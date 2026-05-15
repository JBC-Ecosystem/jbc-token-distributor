import { JsonRpcProvider, isAddress, Contract } from "ethers";

/**
 * Standard BEP-20/ERC-20 ABI for read-only operations
 */
export const MINIMAL_BEP20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

export const mainnet_bsc = "https://bsc-dataseed.binance.org/";

export const testnet_bsc = "https://data-seed-prebsc-1-s1.binance.org:8545/";

export async function detectToken(contractAddress: string, testnet: boolean = true) {
  // =========================
  // 1. VALIDATE ADDRESS FORMAT
  // =========================
  if (!isAddress(contractAddress)) {
    throw new Error("Invalid contract address format");
  }
  const rpc = testnet ? testnet_bsc : mainnet_bsc;

  // =========================
  // 2. CREATE RPC PROVIDER (BNB Smart Chain)
  // =========================
  // Mainnet: https://bsc-dataseed.binance.org/
  // Testnet: https://data-seed-prebsc-1-s1.binance.org:8545/
  const provider = new JsonRpcProvider(rpc);

  try {
    // =========================
    // 3. CHECK IF CODE EXISTS
    // =========================
    const code = await provider.getCode(contractAddress);
    if (code === "0x" || code === "0x0") {
      throw new Error("No contract found at this address on BSC");
    }

    // =========================
    // 4. CREATE TOKEN CONTRACT
    // =========================
    // We use the provider instead of a signer for read-only calls
    const token = new Contract(contractAddress, MINIMAL_BEP20_ABI, provider);

    // =========================
    // 5. FETCH TOKEN DATA
    // =========================
    const [name, symbol, decimals, network] = await Promise.all([
      token.name().catch(() => "Unknown"),
      token.symbol().catch(() => "Unknown"),
      token.decimals().catch(() => 18),
      provider.getNetwork(),
    ]);

    // =========================
    // 6. RETURN TOKEN INFO
    // =========================
    return {
      name,
      symbol,
      decimals: Number(decimals),
      chainId: Number(network.chainId),
      contractAddress,
      networkName: "BNB Smart Chain",
    };

  } catch (error: any) {
    throw new Error(
      `Failed to detect BEP-20 token: ${error.message || "Invalid Contract"}`
    );
  }
}