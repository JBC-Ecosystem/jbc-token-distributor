"use client";
import { useEffect, useState, useRef } from "react";
import { parseFile, ParsedRow } from "@/lib/parser/parserFile";
import {
  validateRows,
  ValidationSummary,
} from "@/lib/validations/validateRows";
import { createBatches, DistributionBatch } from "@/lib/batch/createBatches";
import WalletButton from "@/components/wallet/WalletButton";
import {
  approveTokens,
  executeDistribution,
  estimateDistributionGas,
} from "@/lib/blockchain/distribution";

import { waitForTransaction } from "@/lib/blockchain/transactions";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";

export default function DashboardPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Add this line

  const [tokens, setTokens] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [batches, setBatches] = useState<DistributionBatch[]>([]);
  const [error, setError] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [testnet, setTestnet] = useState(false);
  const [senderAddress, setSenderAddress] = useState("");
  const { wallet, connect, disconnect } = useWallet();

  const [txHash, setTxHash] = useState("");

  const [gasInfo, setGasInfo] = useState({
    units: "",
    bnb: "",
    usd: "",
  });
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setLoading(true);
      setError("");

      const file = event.target.files?.[0];

      if (!file) return;

      const parsedRows = await parseFile(file);

      setRows(parsedRows);
      const validationResult = validateRows(parsedRows, selectedToken.tokenId);
      setValidation(validationResult);

      const generatedBatches = createBatches(validationResult.validRows);

      setBatches(generatedBatches);

      console.log(parsedRows);
    } catch (err) {
      console.error(err);

      setError("Failed to parse file");
    } finally {
      setLoading(false);
    }
  }
  async function handleEstimateGas() {
    try {
      setLoading(true);
      const recipients = validation?.validRows.map((r) => r.Wallet) || [];

      const amounts = validation?.validRows.map((r) => r.Amount) || [];

      const totalAmount =
        validation?.validRows.reduce(
          (sum, row) => sum + Number(row.Amount),
          0,
        ) || 0;

      // Approve
      const approveTx = await approveTokens(
        selectedToken.contractAddress,
        String(totalAmount),
      );

      await waitForTransaction(approveTx);
      const address = wallet.connected ? wallet.address : "";
      if(wallet.connected && !address) {
        alert("Wallet connected but address not found. Please reconnect your wallet.");
        setLoading(false);
        return;
      }


      const gas = await estimateDistributionGas(
        selectedToken.contractAddress,
        recipients,
        amounts,
        address as string,
        selectedToken.decimals,
        testnet,
      );

      setLoading(false);

      if (!gas.success || !gas.total) {
        alert(gas.error || "Failed to estimate gas");
        return;
      }

      setGasInfo(gas.total);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDistribution() {
    try {
      setTxLoading(true);

      const recipients = validation?.validRows.map((r) => r.Wallet) || [];

      const amounts = validation?.validRows.map((r) => r.Amount) || [];

      const totalAmount =
        validation?.validRows.reduce(
          (sum, row) => sum + Number(row.Amount),
          0,
        ) || 0;

      // 1. Get signer from your provider (MetaMask/Browser)
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

       const address = wallet.connected ? wallet.address : "";
      if(wallet.connected && !address) {
        alert("Wallet connected but address not found. Please reconnect your wallet.");
        setLoading(false);
        return;
      }

      // Execute
      const distributionTx = await executeDistribution(
        selectedToken.contractAddress,
        recipients,
        amounts,
        signer,
        selectedToken.decimals,
        address as string,
      );

      const receipt = await waitForTransaction(distributionTx);

      setTxHash(receipt.hash);

      alert("Distribution completed");
    } catch (error) {
      console.error(error);

      alert("Distribution failed");
    } finally {
      setTxLoading(false);
    }
  }

  async function handleclear() {
    // 1. Reset all state variables
    setRows([]);
    setValidation(null);
    setBatches([]);
    setError("");
    setTxHash("");
    setGasInfo({
      units: "",
      bnb: "",
      usd: "",
    });

    // 2. Clear the actual DOM element
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {

    async function fetchTokens() {
      const response = await fetch("/api/tokens");

      const data = await response.json();

      setTokens(data);
    }

    fetchTokens();
  }, []);

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">JBC Token Distribution Dashboard</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-100 max-w-2xl">
          Upload a CSV or Excel file containing BEP-20 wallet addresses and
          token amounts to distribute in batch. The admin panel will process the
          upload and prepare the distribution.
        </p>
      </div>
      <div className="flex justify-end">
        {wallet.connected ? (
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
        ) : (
          <button
            onClick={connect}
            disabled={wallet.loading}
            className="rounded-full bg-indigo-600 px-5 py-2 text-white"
          >
            {wallet.loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="rounded-xl border p-4">
          <label className="block text-sm font-medium">Select Token</label>

          <select
            className="mt-3 w-full rounded-lg border px-3 py-2 dark:bg-slate-700"
            value={selectedToken?.id || ""}
            onChange={(e) => {
              const token = tokens.find((t) => t.id === e.target.value);

              setSelectedToken(token);
            }}
          >
            <option value="">Choose token</option>

            {tokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name} ({token.symbol})
              </option>
            ))}
          </select>
          <label className="block text-sm font-medium">Select network</label>

          <select
            className="mt-3 w-full rounded-lg border px-3 py-2 dark:bg-slate-700"
            value={testnet.toString() || ""}
            onChange={(e) => {
              setTestnet(e.target.value === "true" ? true : false);
            }}
          >
            <option value="">Choose network</option>

            {[true, false].map((isTestnet) => (
              <option key={isTestnet.toString()} value={isTestnet.toString()}>
                {isTestnet ? "Testnet" : "Mainnet"}
              </option>
            ))}
          </select>
        </div>
        <h2 className="text-xl font-semibold">Batch Distribution</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-100">
          Choose a file with wallet addresses and distribution values. Supported
          formats: .csv, .xlsx, .xls.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-slate-200  p-4">
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              htmlFor="fileUpload"
            >
              Upload wallet list
            </label>
            <input
              id="fileUpload"
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="mt-3 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-100">
              The file should include wallet addresses and token amounts in
              separate columns.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200  p-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Distribution status
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl  p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Total wallets
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-200">
                  {validation?.totalWallets ?? 0}
                </p>
              </div>
              <div className="rounded-2xl  p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Total tokens
                </p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-200">
                  {rows
                    .reduce(
                      (total, row) => total + parseFloat(row.Amount || "0"),
                      0,
                    )
                    .toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Gas Units
                </p>

                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-200">
                  {gasInfo.units || "-"}
                </p>
              </div>

              <div className="rounded-2xl p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Estimated BNB Cost
                </p>

                <p className="text-2xl font-semibold text-emerald-600">
                  {gasInfo.bnb || "-"}
                </p>
              </div>

              <div className="rounded-2xl p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Estimated USD Cost
                </p>

                <p className="text-2xl font-semibold text-indigo-600">
                  ${gasInfo.usd || "-"}
                </p>
              </div>
              <div className="rounded-2xl p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Valid Wallets
                </p>

                <p className="text-2xl font-semibold text-emerald-600">
                  {validation?.totalValid ?? 0}
                </p>
              </div>
              <div className="rounded-2xl p-3 shadow-sm">
                <p className="text-sm text-slate-500 dark:text-slate-100">
                  Invalid Entries
                </p>

                <p className="text-2xl font-semibold text-red-600">
                  {validation?.totalInvalid ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleclear}
            className="rounded-full bg-slate-100 dark:bg-slate-600 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-200 hover:dark:bg-slate-500"
          >
            Clear
          </button>
          <button
            onClick={handleEstimateGas}
            disabled={!validation || validation.totalValid === 0 || loading}
            className="rounded-full border px-4 py-2"
          >
            Estimate Gas
          </button>
          <button
            type="button"
            disabled={
              !validation ||
              validation.totalValid === 0 ||
              txLoading ||
              !selectedToken ||
              loading
            }
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={handleDistribution}
          >
            Start Batch Distribution
          </button>
        </div>
      </section>

      {rows.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Wallet</th>
                <th className="px-4 py-3 text-left">Token</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {validation?.validRows.map((row, index) => (
                <tr key={index} className="border-t border-slate-200">
                  <td className="px-4 py-3">{row.Wallet}</td>

                  <td className="px-4 py-3">{row.TokenId}</td>

                  <td className="px-4 py-3">{row.Amount}</td>

                  <td className="px-4 py-3 text-emerald-600">Valid</td>
                </tr>
              ))}

              {validation?.invalidRows.map((row, index) => (
                <tr
                  key={`invalid-${index}`}
                  className="border-t border-red-200 bg-red-50 dark:bg-red-900/50"
                >
                  <td className="px-4 py-3">{row.Wallet}</td>

                  <td className="px-4 py-3">{row.TokenId}</td>

                  <td className="px-4 py-3">{row.Amount}</td>

                  <td className="px-4 py-3 text-red-600">
                    {row.errors.join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {batches.length > 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold">Prepared Batches</h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-100">
            Distribution batches prepared for execution.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <div
                key={batch.batchId}
                className="rounded-xl border border-slate-200 p-4"
              >
                <h3 className="font-semibold">Batch #{batch.batchId}</h3>

                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    Wallets:{" "}
                    <span className="font-medium">{batch.totalWallets}</span>
                  </p>

                  <p>
                    Total Amount:{" "}
                    <span className="font-medium">{batch.totalAmount}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200  p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Recent Uploads</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-100">
          Review recent batch uploads and their processing status.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className=" text-slate-500 dark:text-slate-100">
              <tr>
                <th className="px-4 py-3 font-medium">File name</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium">Wallets</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 dark:text-slate-200">
              <tr>
                <td className="px-4 py-4">example-distribution.csv</td>
                <td className="px-4 py-4">Today</td>
                <td className="px-4 py-4">120</td>
                <td className="px-4 py-4 text-emerald-600">Ready</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
