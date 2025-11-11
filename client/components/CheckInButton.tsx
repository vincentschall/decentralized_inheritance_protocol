"use client";

import { Heart } from "lucide-react";

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
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition transform hover:scale-105 active:scale-95 text-lg shadow-lg"
    >
      <Heart className="w-6 h-6 animate-pulse" />
      {isLoading ? "Checking In..." : "Check In (I'm Alive!)"}
    </button>
  );
}
