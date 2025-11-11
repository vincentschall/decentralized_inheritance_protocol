"use client";

import { formatUnits } from "ethers";
import { Coins } from "lucide-react";

interface BalanceDisplayProps {
  balance: bigint;
  depositedPercentage: number;
}

export default function BalanceDisplay({
  balance,
  depositedPercentage,
}: BalanceDisplayProps) {
  const formattedBalance = parseFloat(formatUnits(balance, 6)).toFixed(2);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400" />
          Total Balance
        </h2>
      </div>

      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <p className="text-gray-400 text-sm mb-2">USDC Deposited</p>
        <p className="text-4xl font-bold text-white mb-4">${formattedBalance}</p>

        {/* Payout Distribution */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-400 text-sm">Payout Distribution</p>
            <p className="text-white font-semibold">{depositedPercentage}%</p>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${depositedPercentage}%` }}
            ></div>
          </div>
        </div>

        {depositedPercentage === 100 ? (
          <p className="text-green-400 text-sm mt-3">✓ Payout fully determined</p>
        ) : (
          <p className="text-yellow-400 text-sm mt-3">
            {100 - depositedPercentage}% remaining to distribute
          </p>
        )}
      </div>
    </div>
  );
}
