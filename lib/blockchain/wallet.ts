import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

 async function getProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  return new BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = await getProvider();

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const address = await signer.getAddress();

  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
  };
}
async function disconnectWallet() {
  return true;
}