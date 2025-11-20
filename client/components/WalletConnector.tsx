"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, LogOut } from "lucide-react";

interface WalletConnectorProps {
  onConnect: (signer: ethers.Signer, address: string) => void;
  onDisconnect: () => void;
}

export default function WalletConnector({
  onConnect,
  onDisconnect,
}: WalletConnectorProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    setLoading(true);
    setError("");
    try {
      if (!window.ethereum) {
        setError("MetaMask not installed. Please install MetaMask.");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = accounts[0];

      setAddress(userAddress);
      onConnect(signer, userAddress);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setError("");
    onDisconnect();
  };

  return (
    <div className="flex items-center gap-4">
      {address ? (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Connected</p>
            <p className="text-gray-900 font-mono text-sm">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
          <button
            onClick={disconnectWallet}
            className="p-2 hover:bg-red-50 rounded-lg transition text-red-500 hover:text-red-600"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={loading}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 px-4 py-2 rounded-lg text-white text-sm font-medium transition"
        >
          <Wallet className="w-4 h-4" />
          {loading ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
