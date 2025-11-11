"use client";

import { useState } from "react";

interface NotaryPanelProps {
  isNotary: boolean;
  onUploadDeathCertificate: (deceased: boolean) => Promise<void>;
  onUpdateState: () => Promise<void>;
  isLoading: boolean;
}

export default function NotaryPanel({
  isNotary,
  onUploadDeathCertificate,
  onUpdateState,
  isLoading,
}: NotaryPanelProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isNotary) {
    return null;
  }

  const handleDeathCertificate = async () => {
    setShowConfirm(false);
    await onUploadDeathCertificate(true);
  };

  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
          <span className="text-2xl">⚖️</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Notary Panel</h2>
          <p className="text-purple-200 text-sm">You are the designated notary</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Death Certificate Section */}
        <div className="bg-black/20 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span>📜</span>
            Death Certificate
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Upload death verification to trigger distribution phase
          </p>
          
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
            >
              {isLoading ? "Processing..." : "Issue Death Certificate"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm font-medium">
                  ⚠️ This action will mark the owner as deceased and initiate the distribution process. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeathCertificate}
                  disabled={isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Update State Section */}
        <div className="bg-black/20 rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span>🔄</span>
            Update Contract State
          </h3>
          <p className="text-gray-300 text-sm mb-4">
            Manually trigger state machine evaluation
          </p>
          <button
            onClick={onUpdateState}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
          >
            {isLoading ? "Updating..." : "Update State"}
          </button>
        </div>
      </div>
    </div>
  );
}

