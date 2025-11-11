"use client";

import { Users, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Beneficiary {
  payoutAddress: string;
  amount: number;
}

interface BeneficiariesListProps {
  beneficiaries: Beneficiary[];
  onAddBeneficiary: (address: string, amount: number) => Promise<void>;
  onRemoveBeneficiary: (address: string) => Promise<void>;
  isLoading: boolean;
  maxBeneficiaries: number;
}

export default function BeneficiariesList({
  beneficiaries,
  onAddBeneficiary,
  onRemoveBeneficiary,
  isLoading,
  maxBeneficiaries,
}: BeneficiariesListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const activeBeneficiaries = beneficiaries.filter((b) => b.payoutAddress !== "0x0000000000000000000000000000000000000000");

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        setAddError("Invalid Ethereum address");
        return;
      }

      const amount = parseInt(newAmount);
      if (isNaN(amount) || amount <= 0 || amount > 100) {
        setAddError("Amount must be between 1 and 100");
        return;
      }

      await onAddBeneficiary(newAddress, amount);
      setNewAddress("");
      setNewAmount("");
      setShowAddForm(false);
    } catch (err: any) {
      setAddError(err.message || "Failed to add beneficiary");
    } finally {
      setAddLoading(false);
    }
  };

  const totalPercentage = activeBeneficiaries.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          Beneficiaries
        </h2>
        <span className="text-gray-400 text-sm">
          {activeBeneficiaries.length} / {maxBeneficiaries}
        </span>
      </div>

      {/* Beneficiaries List */}
      {activeBeneficiaries.length > 0 ? (
        <div className="space-y-3 mb-6">
          {activeBeneficiaries.map((beneficiary, index) => (
            <div
              key={index}
              className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between hover:bg-white/10 transition"
            >
              <div className="flex-1">
                <p className="text-white font-mono text-sm">
                  {beneficiary.payoutAddress.slice(0, 6)}...{beneficiary.payoutAddress.slice(-4)}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {beneficiary.amount}% of total balance
                </p>
              </div>
              <button
                onClick={() => onRemoveBeneficiary(beneficiary.payoutAddress)}
                disabled={isLoading}
                className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Total Percentage Progress */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-400 text-sm">Total Distribution</p>
              <p className="text-white font-bold">{totalPercentage}%</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  totalPercentage === 100
                    ? "bg-green-500"
                    : totalPercentage > 80
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              ></div>
            </div>
            {totalPercentage > 100 && (
              <p className="text-red-400 text-xs mt-2">⚠ Total exceeds 100%</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center mb-6">
          <p className="text-gray-400">No beneficiaries added yet</p>
        </div>
      )}

      {/* Add Beneficiary Form */}
      {showAddForm && activeBeneficiaries.length < maxBeneficiaries ? (
        <form onSubmit={handleAddBeneficiary} className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
          <input
            type="text"
            placeholder="0x..."
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 border border-white/20 mb-3 focus:outline-none focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Percentage (1-100)"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            min="1"
            max="100"
            className="w-full bg-white/10 text-white placeholder-gray-500 rounded-lg px-3 py-2 border border-white/20 mb-3 focus:outline-none focus:border-blue-500"
          />
          {addError && <p className="text-red-400 text-sm mb-3">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addLoading || !newAddress || !newAmount}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition"
            >
              {addLoading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError("");
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* Add Button */}
      {activeBeneficiaries.length < maxBeneficiaries && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Beneficiary
        </button>
      )}
    </div>
  );
}
