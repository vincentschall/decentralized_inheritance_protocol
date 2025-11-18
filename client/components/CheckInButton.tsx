"use client";

import { CheckCircle } from "lucide-react";

interface CheckInButtonProps {
  onCheckIn: () => Promise<void>;
  isLoading: boolean;
}

export default function CheckInButton({
  onCheckIn,
  isLoading,
}: CheckInButtonProps) {
  return (
    <button
      onClick={onCheckIn}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition text-sm"
    >
      <CheckCircle className="w-4 h-4" />
      {isLoading ? "Checking In..." : "Confirm Check-in"}
    </button>
  );
}
