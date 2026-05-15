import { Contract }
from "ethers";

import ERC20ABI
from "@/lib/blockchain/abi/ERC20.json";

export function getTokenContract(
  tokenAddress: string,
  signer: any
) {

  return new Contract(
    tokenAddress,
    ERC20ABI.abi,
    signer
  );
}