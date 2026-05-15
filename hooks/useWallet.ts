"use client";

import { useEffect, useState } from "react";
import {
  connectWallet,
} from "@/lib/blockchain/wallet";

interface WalletState {
  address: string | null;

  chainId: number | null;

  connected: boolean;

  loading: boolean;

  error: string | null;
}

export function useWallet() {

  const [wallet, setWallet] =
    useState<WalletState>({
      address: null,
      chainId: null,
      connected: false,
      loading: false,
      error: null,
    });

  async function connect() {

    try {

      setWallet((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const result =
        await connectWallet();

      setWallet({
        address: result.address,
        chainId: result.chainId,
        connected: true,
        loading: false,
        error: null,
      });

    } catch (error: any) {

      setWallet((prev) => ({
        ...prev,
        loading: false,
        error:
          error.message ||
          "Wallet connection failed",
      }));
    }
  }

  function disconnect() {

    setWallet({
      address: null,
      chainId: null,
      connected: false,
      loading: false,
      error: null,
    });
  }

  // Auto reconnect
  useEffect(() => {

    if (!window.ethereum) return;

    window.ethereum
      .request({
        method: "eth_accounts",
      })
      .then((accounts: string[]) => {

        if (accounts.length > 0) {
          connect();
        }
      });

  }, []);

  return {
    wallet,
    connect,
    disconnect,
  };
}