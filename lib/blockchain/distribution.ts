import { ethers, JsonRpcProvider, Contract } from "ethers";

import { getBlockchain } from "./provider";

import { getTokenContract } from "./token";
import { mainnet_bsc, MINIMAL_BEP20_ABI, testnet_bsc } from "./detectToken";
import { getBNBPrice } from "../utils";

const DISTRIBUTOR_ADDRESS = process.env.NEXT_PUBLIC_DISTRIBUTOR_ADDRESS;
const DISTRIBUTOR_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
    ],
    name: "SafeERC20FailedOperation",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalRecipients",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalAmount",
        type: "uint256",
      },
    ],
    name: "BatchTransfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "recipients",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
    ],
    name: "distribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// =========================
// APPROVE TOKENS
// =========================

export async function approveTokens(
  tokenAddress: string,
  amount: string,
  decimals: number = 18,
) {
  const { distributor, signer } = await getBlockchain();

  const tokenContract = getTokenContract(tokenAddress, signer);

  const parsedAmount = ethers.parseUnits(amount, decimals);

  console.log(amount, parsedAmount.toString());

  const tx = await tokenContract.approve(
    await distributor.getAddress(),
    parsedAmount,
  );

  return tx;
}

// =========================
// EXECUTE DISTRIBUTION
// =========================

export async function executeDistribution(
  tokenAddress: string,
  recipients: string[],
  amounts: string[],
  signer: ethers.Signer, // Pass the signer directly from your useWallet hook
  decimals: number = 18,
  senderAddress: string,
  totalAmounts: string, // Total amount for logging or future features, not needed for distribution logic
) {
  // 1. Validation Guard
  if (!tokenAddress || !DISTRIBUTOR_ADDRESS) {
    throw new Error(
      "Missing contract addresses. Check your environment variables.",
    );
  }

  if (recipients.length !== amounts.length || recipients.length === 0) {
    throw new Error("Recipients and amounts length mismatch.");
  }

  try {
    // 2. Initialize the Distributor Contract with the Signer
    const distributor = new Contract(
      DISTRIBUTOR_ADDRESS,
      DISTRIBUTOR_ABI,
      signer,
    );

    // 3. Parse amounts correctly based on token decimals
    const parsedAmounts = amounts.map((amount) =>
      ethers.parseUnits(amount, decimals),
    );

    const TotalparedAmount = ethers.parseUnits(totalAmounts, decimals);

    // Inside your execution logic (simplified for clarity)
    const totalAmount = parsedAmounts.reduce((a, b) => a + b, BigInt(0));

    const tokenContract = new Contract(tokenAddress, MINIMAL_BEP20_ABI, signer);

    // 1. Check current allowance
    const currentAllowance = await tokenContract.allowance(
      senderAddress,
      DISTRIBUTOR_ADDRESS,
    );

    console.log("Current Allowance:", ethers.formatUnits(currentAllowance, decimals));
    console.log("Total Amount to Distribute:", ethers.formatUnits(totalAmount, decimals));

    if (currentAllowance < totalAmount) {
      console.log("Requesting approval...");
      // 2. Trigger Approval Transaction
      const approveTx = await tokenContract.approve(
        DISTRIBUTOR_ADDRESS,
        TotalparedAmount,
      );

      // 3. WAIT for the approval to be mined
      await approveTx.wait();
      console.log("Approval confirmed!");
    }

    // 4. Execute the transaction
    console.log("Initiating distribution transaction...");
    const tx = await distributor.distribute(
      tokenAddress,
      recipients,
      parsedAmounts,
    );

    // 5. Return the transaction object
    // The frontend can then use tx.wait() to show a success message
    return tx;
  } catch (error: any) {
    console.error("Distribution Error:", error);

    // Friendly error messages for common blockchain failures
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction was rejected by the user.");
    }

    throw new Error(error.reason || "Failed to execute distribution.");
  }
}

// =========================
// ESTIMATE GAS
// =========================

// Constants for BNB Chain
const BNB_PRICE_USD = await getBNBPrice(); // You could fetch this from an API later

export async function estimateDistributionGas(
  tokenAddress: string,
  recipients: string[],
  amounts: string[],
  senderAddress: string,
  decimals: number = 18,
  testnet: boolean = true,
) {
  // 1. Create a Direct RPC Provider (No MetaMask)
  const rpc = testnet ? testnet_bsc : mainnet_bsc;
  console.log("Using RPC:", rpc);
  const provider = new JsonRpcProvider(rpc);

  const network = await provider.getNetwork();
  console.log("Connected to network:", network.chainId);
  const chainId = Number(network.chainId);

  if (testnet) {
    if (chainId !== 97) {
      return {
        success: false,
        error: "Network Mismatch: App set to Testnet, but RPC is not BSC Testnet (97) please switch to BNB Chain Testnet in your wallet or check your network settings.",
      };
    }
  } else {
    // Flag if Mainnet is selected but we aren't on Chain 56
    if (chainId !== 56) {
      return {
        success: false,
        error: "Network Mismatch: App set to Mainnet, but RPC is not BSC Mainnet (56) please switch to BNB Chain Mainnet in your wallet or check your network settings.",
      };
    }
  }

  // 2. Setup Contracts using the provider (Read-only)
  // Replace these with your actual ABI and Contract Addresses
  const tokenContract = new Contract(tokenAddress, MINIMAL_BEP20_ABI, provider);
  const distributorContract = new Contract(
    DISTRIBUTOR_ADDRESS as string,
    DISTRIBUTOR_ABI,
    provider,
  );

  const parsedAmounts = amounts.map((amount) =>
    ethers.parseUnits(amount, decimals),
  );

  const totalAmount = parsedAmounts.reduce(
    (sum, value) => sum + value,
    BigInt(0),
  );

  // 3. Fetch data from the chain
  const [allowance, feeData] = await Promise.all([
    tokenContract.allowance(senderAddress, DISTRIBUTOR_ADDRESS),
    provider.getFeeData(),
  ]);

  const gasPrice = feeData.gasPrice || BigInt(0);

  let approvalGasUnits = BigInt(0);
  let distributionGasUnits = BigInt(0);
  let needsApproval = false;

  // =========================
  // APPROVAL ESTIMATION
  // =========================
  if (allowance < totalAmount) {
    needsApproval = true;
    // We use .estimateGas and specify the 'from' address
    approvalGasUnits = await tokenContract.approve.estimateGas(
      DISTRIBUTOR_ADDRESS,
      totalAmount,
      { from: senderAddress },
    );
  }

  // =========================
  // DISTRIBUTION ESTIMATION
  // =========================
  // We can estimate this even if they haven't approved yet
  // by catching errors or assuming the approval happens first
  try {
    distributionGasUnits = await distributorContract.distribute.estimateGas(
      tokenAddress,
      recipients,
      parsedAmounts,
      { from: senderAddress },
    );
  } catch (e) {
    // If the contract reverts because of allowance, we use a fallback constant
    // or ignore it until approval is done.
    // Usually ~50k gas per recipient is a safe rough estimate for distributions.
    distributionGasUnits = BigInt(recipients.length * 50000);
  }

  // =========================
  // CALCULATE COSTS
  // =========================
  const calculateCosts = (units: bigint) => {
    const wei = units * gasPrice;
    const bnb = ethers.formatEther(wei);
    const usd = (Number(bnb) * BNB_PRICE_USD).toFixed(2);
    return { units: units.toString(), bnb, usd };
  };

  const approvalResults = calculateCosts(approvalGasUnits);
  const distributionResults = calculateCosts(distributionGasUnits);
  const totalResults = calculateCosts(approvalGasUnits + distributionGasUnits);

  return {
    success: true,
    needsApproval,
    gasPriceGwei: ethers.formatUnits(gasPrice, "gwei"),
    approval: approvalResults,
    distribution: distributionResults,
    total: totalResults,
  };
}
