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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Beneficiaries
        </h2>
        <span className="text-gray-500 text-xs">
          {activeBeneficiaries.length} / {maxBeneficiaries}
        </span>
      </div>

      {/* Beneficiaries List */}
      {activeBeneficiaries.length > 0 ? (
        <div className="space-y-2 mb-6">
          {activeBeneficiaries.map((beneficiary, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-100 transition"
            >
              <div className="flex-1">
                <p className="text-gray-900 font-mono text-sm">
                  {beneficiary.payoutAddress.slice(0, 6)}...{beneficiary.payoutAddress.slice(-4)}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {beneficiary.amount}% of total balance
                </p>
              </div>
              <button
                onClick={() => onRemoveBeneficiary(beneficiary.payoutAddress)}
                disabled={isLoading}
                className="p-2 hover:bg-red-50 rounded-lg transition text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Total Percentage Progress */}
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-500 text-xs">Total Distribution</p>
              <p className="text-gray-900 font-medium text-sm">{totalPercentage}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  totalPercentage === 100
                    ? "bg-emerald-500"
                    : totalPercentage > 80
                    ? "bg-amber-500"
                    : "bg-gray-900"
                }`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              ></div>
            </div>
            {totalPercentage > 100 && (
              <p className="text-red-600 text-xs mt-2">Total exceeds 100%</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center mb-6">
          <p className="text-gray-500 text-sm">No beneficiaries added yet</p>
        </div>
      )}

      {/* Add Beneficiary Form */}
      {showAddForm && activeBeneficiaries.length < maxBeneficiaries ? (
        <form onSubmit={handleAddBeneficiary} className="bg-gray-50 rounded-lg p-4 mb-4">
          <input
            type="text"
            placeholder="0x..."
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 border border-gray-200 mb-3 focus:outline-none focus:border-gray-900 text-sm"
          />
          <input
            type="number"
            placeholder="Percentage (1-100)"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            min="1"
            max="100"
            className="w-full bg-white text-gray-900 placeholder-gray-400 rounded-lg px-3 py-2 border border-gray-200 mb-3 focus:outline-none focus:border-gray-900 text-sm"
          />
          {addError && <p className="text-red-600 text-sm mb-3">{addError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addLoading || !newAddress || !newAmount}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition text-sm"
            >
              {addLoading ? "Adding..." : "Add"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddError("");
              }}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition text-sm"
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
          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Beneficiary
        </button>
      )}
    </div>
  );
}
