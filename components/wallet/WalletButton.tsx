"use client";

import { useWallet } from "@/hooks/useWallet";

export default function WalletButton() {

  const {
    wallet,
    connect,
    disconnect,
  } = useWallet();

  if (wallet.connected) {
    return (
      <div className="flex items-center gap-3">

        <div className="rounded-full border px-4 py-2 text-sm">
          {wallet.address?.slice(0, 6)}
          ...
          {wallet.address?.slice(-4)}
        </div>

        <button
          onClick={disconnect}
          className="rounded-full bg-red-500 px-4 py-2 text-sm text-white"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={wallet.loading}
      className="rounded-full bg-indigo-600 px-5 py-2 text-white"
    >
      {wallet.loading
        ? "Connecting..."
        : "Connect Wallet"}
    </button>
  );
}