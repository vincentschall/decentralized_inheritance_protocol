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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Coins className="w-5 h-5 text-gray-400" />
          Total Balance
        </h2>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-500 text-xs mb-1">USDC Deposited</p>
        <p className="text-3xl font-semibold text-gray-900 mb-4">${formattedBalance}</p>

        {/* Payout Distribution */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-500 text-xs">Payout Distribution</p>
            <p className="text-gray-900 font-medium text-sm">{depositedPercentage}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${depositedPercentage}%` }}
            ></div>
          </div>
        </div>

        {depositedPercentage === 100 ? (
          <p className="text-emerald-600 text-xs mt-3">Payout fully determined</p>
        ) : (
          <p className="text-amber-600 text-xs mt-3">
            {100 - depositedPercentage}% remaining to distribute
          </p>
        )}
      </div>
    </div>
  );
}
