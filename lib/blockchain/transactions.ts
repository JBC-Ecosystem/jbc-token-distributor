export async function waitForTransaction(
  tx: any
) {

  const receipt = await tx.wait();

  return {
    hash: receipt.hash,
    blockNumber:
      receipt.blockNumber,
    status: receipt.status,
  };
}