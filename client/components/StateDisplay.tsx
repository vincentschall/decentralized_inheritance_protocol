"use client";

import { STATE_NAMES, STATE_COLORS, STATE_DESCRIPTIONS } from "@/lib/constants";
import { Clock } from "lucide-react";

interface StateDisplayProps {
  state: number;
  lastCheckIn: number;
  onUpdateState: () => void;
  isLoading: boolean;
}

export default function StateDisplay({
  state,
  lastCheckIn,
  onUpdateState,
  isLoading,
}: StateDisplayProps) {
  const stateName = STATE_NAMES[state] || "UNKNOWN";
  const stateColor = STATE_COLORS[state] || "bg-gray-500";
  const stateDescription = STATE_DESCRIPTIONS[state] || "Unknown state";

  const lastCheckInDate = new Date(lastCheckIn * 1000);
  const daysSinceCheckIn = Math.floor(
    (Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">Protocol Status</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current State */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-gray-300 text-sm mb-2">Current State</p>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-4 h-4 rounded-full ${stateColor} animate-pulse`}></div>
            <p className="text-2xl font-bold text-white">{stateName}</p>
          </div>
          <p className="text-gray-400 text-sm">{stateDescription}</p>
        </div>

        {/* Last Check-in */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <p className="text-gray-300 text-sm mb-2">Last Check-in</p>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-400" />
            <p className="text-2xl font-bold text-white">{daysSinceCheckIn}d ago</p>
          </div>
          <p className="text-gray-400 text-xs">
            {lastCheckInDate.toLocaleDateString()} {lastCheckInDate.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Update State Button */}
      <button
        onClick={onUpdateState}
        disabled={isLoading}
        className="mt-6 w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition transform hover:scale-105 active:scale-95"
      >
        {isLoading ? "Updating..." : "Update State"}
      </button>
    </div>
  );
}
