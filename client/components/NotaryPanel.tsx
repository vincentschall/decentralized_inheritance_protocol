"use client";

import { useState } from "react";
import { FileText, RefreshCw } from "lucide-react";

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
    <div className="space-y-4">
        {/* Death Certificate Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Death Certificate
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Upload death verification to trigger distribution phase
          </p>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition text-sm"
            >
              {isLoading ? "Processing..." : "Issue Death Certificate"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">
                  This action will mark the owner as deceased and initiate the distribution process. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeathCertificate}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Update State Section */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-400" />
            Update Contract State
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Manually trigger state machine evaluation
          </p>
          <button
            onClick={onUpdateState}
            disabled={isLoading}
            className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-medium py-2.5 px-4 rounded-lg transition text-sm"
          >
            {isLoading ? "Updating..." : "Update State"}
          </button>
        </div>
    </div>
  );
}

