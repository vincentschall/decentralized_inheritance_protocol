"use client";

import { STATE_NAMES, STATE_COLORS, STATE_DESCRIPTIONS, STATE_TEXT_COLORS } from "@/lib/constants";
import { Clock, Activity } from "lucide-react";

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
  const stateName = STATE_NAMES[state] || "Unknown";
  const stateColor = STATE_COLORS[state] || "bg-gray-500";
  const stateTextColor = STATE_TEXT_COLORS[state] || "text-gray-600";
  const stateDescription = STATE_DESCRIPTIONS[state] || "Unknown state";

  const lastCheckInDate = new Date(lastCheckIn * 1000);
  const daysSinceCheckIn = Math.floor(
    (Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card">
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-gray-400" />
        Protocol Status
      </h2>

      <div className="space-y-4">
        {/* Current State */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-2">Current State</p>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${stateColor}`}></div>
            <p className={`text-lg font-semibold ${stateTextColor}`}>{stateName}</p>
          </div>
          <p className="text-gray-500 text-xs">{stateDescription}</p>
        </div>

        {/* Last Check-in */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-2">Last Check-in</p>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className="text-lg font-semibold text-gray-900">{daysSinceCheckIn}d ago</p>
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
        className="mt-4 w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium py-2 rounded-lg transition text-sm"
      >
        {isLoading ? "Updating..." : "Update State"}
      </button>
    </div>
  );
}
