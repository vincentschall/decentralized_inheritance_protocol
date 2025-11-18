"use client";

import { useState } from "react";
import { Banknote, ArrowUp, ArrowDown } from "lucide-react";

interface FundsManagerProps {
  onDeposit: (amount: string) => Promise<void>;
  onWithdraw: (amount: string) => Promise<void>;
  isLoading: boolean;
}

type Action = "deposit" | "withdraw" | null;

export default function FundsManager({
  onDeposit,
  onWithdraw,
  isLoading,
}: FundsManagerProps) {
  const [action, setAction] = useState<Action>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!amount || parseFloat(amount) <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (action === "deposit") {
        await onDeposit(amount);
      } else if (action === "withdraw") {
        await onWithdraw(amount);
      }

      setAmount("");
      setAction(null);
    } catch (err: any) {
      setError(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
        <Banknote className="w-5 h-5 text-gray-400" />
        Manage Funds
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Deposit Button */}
        <button
          onClick={() => {
            setAction("deposit");
            setError("");
          }}
          disabled={isLoading || action !== null}
          className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          <ArrowUp className="w-4 h-4" />
          Deposit
        </button>

        {/* Withdraw Button */}
        <button
          onClick={() => {
            setAction("withdraw");
            setError("");
          }}
          disabled={isLoading || action !== null}
          className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2.5 rounded-lg transition text-sm"
        >
          <ArrowDown className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Form */}
      {action && (
        <form onSubmit={handleAction} className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div>
            <label className="text-gray-500 text-xs mb-2 block">
              Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-gray-900 text-sm"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 rounded-lg transition text-sm disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : action === "deposit"
                ? "Confirm Deposit"
                : "Confirm Withdraw"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAction(null);
                setAmount("");
                setError("");
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
