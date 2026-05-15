import { BrowserProvider, Contract } from "ethers";

import BatchDistributorABI
from "@/lib/blockchain/abi/BatchDistributor.json";

import MockUSDTABI
from "@/lib/blockchain/abi/MockUSDT.json";

import { CONTRACTS }
from "@/lib/blockchain/contracts";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function getBlockchain() {

  if (!window.ethereum) {
    throw new Error(
      "MetaMask not detected"
    );
  }

  const provider =
    new BrowserProvider(window.ethereum);

  const signer =
    await provider.getSigner();

  const distributor =
    new Contract(
      CONTRACTS.TESTNET.BATCH_DISTRIBUTOR, //hard coded for testnet
      BatchDistributorABI.abi, //hard coded for testnet
      signer
    );

  const mockUSDT =
    new Contract(
      CONTRACTS.TESTNET.MOCK_USDT,
      MockUSDTABI.abi,
      signer
    );

  return {
    provider,
    signer,
    distributor,
    mockUSDT,
  };
}