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
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <Banknote className="w-6 h-6 text-green-400" />
        Manage Funds
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Deposit Button */}
        <button
          onClick={() => {
            setAction("deposit");
            setError("");
          }}
          disabled={isLoading || action !== null}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
          Deposit
        </button>

        {/* Withdraw Button */}
        <button
          onClick={() => {
            setAction("withdraw");
            setError("");
          }}
          disabled={isLoading || action !== null}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
        >
          <ArrowDown className="w-5 h-5" />
          Withdraw
        </button>
      </div>

      {/* Form */}
      {action && (
        <form onSubmit={handleAction} className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-gray-500 rounded-lg px-4 py-3 border border-white/20 focus:outline-none focus:border-blue-500 text-lg"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !amount}
              className={`flex-1 text-white font-semibold py-3 rounded-lg transition ${
                action === "deposit"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              } disabled:opacity-50`}
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
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
