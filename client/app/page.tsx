"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import WalletConnector from "@/components/WalletConnector";
import StateDisplay from "@/components/StateDisplay";
import BalanceDisplay from "@/components/BalanceDisplay";
import BeneficiariesList from "@/components/BeneficiariesList";
import FundsManager from "@/components/FundsManager";
import CheckInButton from "@/components/CheckInButton";
import EventLogger, { LogEntry } from "@/components/EventLogger";
import NotaryPanel from "@/components/NotaryPanel";
import {
  getInheritanceProtocolContract,
  getUSDCContract,
  getInheritanceProtocolReadonly,
  loadDeploymentInfo,
} from "@/lib/contracts";
import { RPC_URL } from "@/lib/constants";

export default function Home() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string>("");
  const [state, setState] = useState<number>(0);
  const [balance, setBalance] = useState<bigint>(0n);
  const [lastCheckIn, setLastCheckIn] = useState<number>(0);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [payoutPercentage, setPayoutPercentage] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isNotary, setIsNotary] = useState(false);

  const addLog = useCallback(
    (
      message: string,
      type: "info" | "success" | "error" | "warning" | "event" = "info"
    ) => {
      const log: LogEntry = {
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
        type,
        message,
      };
      setLogs((prev) => [...prev, log]);
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Load contract data
  const loadContractData = useCallback(async () => {
    if (!signer) return;

    try {
      addLog("Loading contract data...", "info");
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = await getInheritanceProtocolReadonly(provider);

      const [currentState, currentBalance, currentLastCheckIn, currentBeneficiaries, currentPayoutPercentage] =
        await Promise.all([
          contract.getState(),
          contract.getBalance(),
          contract.getLastCheckIn(),
          contract.getActiveBeneficiaries(),
          contract.getDeterminedPayoutPercentage(),
        ]);

      setState(Number(currentState));
      setBalance(currentBalance);
      setLastCheckIn(Number(currentLastCheckIn));
      setBeneficiaries(
        currentBeneficiaries.map((b: any) => ({
          payoutAddress: b.payoutAddress,
          amount: Number(b.amount),
        }))
      );
      setPayoutPercentage(Number(currentPayoutPercentage));

      addLog("Contract data loaded successfully", "success");
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load contract data";
      addLog(errorMsg, "error");
      setError(errorMsg);
    }
  }, [signer, addLog]);

  // Initial data load
  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  // Setup event listeners
  useEffect(() => {
    if (!signer) return;

    const setupListeners = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = await getInheritanceProtocolReadonly(provider);

        // Wrap event handlers to catch errors silently
        const safeHandler = (handler: (...args: any[]) => void) => {
          return (...args: any[]) => {
            try {
              handler(...args);
            } catch (err) {
              // Silently ignore event handler errors
            }
          };
        };

        contract.on("CheckedIn", safeHandler(() => {
          addLog("✓ Owner checked in", "event");
          loadContractData();
        }));

        contract.on("Deposited", safeHandler((amount) => {
          addLog(`✓ Deposited ${ethers.formatUnits(amount, 6)} USDC`, "event");
          loadContractData();
        }));

        contract.on("Withdrawn", safeHandler((amount) => {
          addLog(`✓ Withdrew ${ethers.formatUnits(amount, 6)} USDC`, "event");
          loadContractData();
        }));

        contract.on("StateChanged", safeHandler((_, from, to) => {
          const stateNames = ["ACTIVE", "WARNING", "VERIFICATION", "DISTRIBUTION"];
          addLog(
            `State changed: ${stateNames[from]} → ${stateNames[to]}`,
            "warning"
          );
          loadContractData();
        }));

        contract.on("BeneficiaryAdded", safeHandler((addr, amount) => {
          addLog(`✓ Beneficiary added: ${addr.slice(0, 6)}...${addr.slice(-4)} (${amount}%)`, "event");
          loadContractData();
        }));

        contract.on("BeneficiaryRemoved", safeHandler((addr) => {
          addLog(`✓ Beneficiary removed: ${addr.slice(0, 6)}...${addr.slice(-4)}`, "event");
          loadContractData();
        }));

        contract.on("PayoutMade", safeHandler((amount, payoutAddress) => {
          addLog(
            `💰 Payout: ${ethers.formatUnits(amount, 6)} USDC → ${payoutAddress.slice(0, 6)}...${payoutAddress.slice(-4)}`,
            "success"
          );
          loadContractData();
        }));

        // Suppress provider errors for unrecognized selectors
        provider.on("error", () => {
          // Silently ignore provider errors
        });
      } catch (err) {
        // Silently ignore setup errors
      }
    };

    setupListeners();

    // Cleanup function to remove listeners
    return () => {
      // Event listeners will be cleaned up automatically when component unmounts
    };
  }, [signer, addLog, loadContractData]);

  const handleCheckIn = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog("Sending check-in transaction...", "info");
      const contract = await getInheritanceProtocolContract(signer);
      const tx = await contract.checkIn();
      addLog("Check-in transaction sent. Waiting for confirmation...", "info");
      await tx.wait();
      addLog("✓ Check-in successful!", "success");
      await loadContractData();
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Check-in failed";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (amount: string) => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog(`Depositing ${amount} USDC...`, "info");
      const parsedAmount = ethers.parseUnits(amount, 6);

      // Approve USDC first
      const usdc = await getUSDCContract(signer);
      const deploymentInfo = await loadDeploymentInfo();

      addLog("Approving USDC spend...", "info");
      const approveTx = await usdc.approve(
        deploymentInfo.contracts.InheritanceProtocol,
        parsedAmount
      );
      await approveTx.wait();
      addLog("USDC approved", "success");

      // Deposit
      const contract = await getInheritanceProtocolContract(signer);
      addLog("Sending deposit transaction...", "info");
      const tx = await contract.deposit(parsedAmount);
      await tx.wait();
      addLog(`✓ Deposited ${amount} USDC successfully!`, "success");
      await loadContractData();
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Deposit failed";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (amount: string) => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog(`Withdrawing ${amount} USDC...`, "info");
      const parsedAmount = ethers.parseUnits(amount, 6);
      const contract = await getInheritanceProtocolContract(signer);
      addLog("Sending withdraw transaction...", "info");
      const tx = await contract.withdraw(parsedAmount);
      await tx.wait();
      addLog(`✓ Withdrew ${amount} USDC successfully!`, "success");
      await loadContractData();
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Withdraw failed";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (beneficiaryAddress: string, amount: number) => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog(`Adding beneficiary: ${beneficiaryAddress.slice(0, 6)}...${beneficiaryAddress.slice(-4)}`, "info");
      const contract = await getInheritanceProtocolContract(signer);
      const tx = await contract.addBeneficiary(beneficiaryAddress, amount);
      await tx.wait();
      addLog(`✓ Beneficiary added successfully!`, "success");
      await loadContractData();
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Failed to add beneficiary";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBeneficiary = async (beneficiaryAddress: string) => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog(`Removing beneficiary: ${beneficiaryAddress.slice(0, 6)}...${beneficiaryAddress.slice(-4)}`, "info");
      const contract = await getInheritanceProtocolContract(signer);
      const tx = await contract.removeBeneficiary(beneficiaryAddress);
      await tx.wait();
      addLog(`✓ Beneficiary removed successfully!`, "success");
      await loadContractData();
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Failed to remove beneficiary";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateState = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog("Updating contract state...", "info");
      const contract = await getInheritanceProtocolContract(signer);
      const tx = await contract.updateState();
      await tx.wait();
      addLog("✓ State updated successfully!", "success");
      await loadContractData();
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Failed to update state";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (newSigner: ethers.Signer, newAddress: string) => {
    setSigner(newSigner);
    setAddress(newAddress);
    addLog(`Connected wallet: ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`, "success");
    setError("");
    
    // Check if connected address is the notary
    try {
      const deploymentInfo = await loadDeploymentInfo();
      if (newAddress.toLowerCase() === deploymentInfo.accounts.notary.toLowerCase()) {
        setIsNotary(true);
        addLog("🔔 Notary access granted", "info");
      } else {
        setIsNotary(false);
      }
    } catch (err) {
      console.error("Failed to load deployment info:", err);
    }
  };

  const handleDisconnect = () => {
    setSigner(null);
    setAddress("");
    setIsNotary(false);
    addLog("Wallet disconnected", "info");
  };

  const handleUploadDeathCertificate = async (deceased: boolean) => {
    if (!signer) return;
    setLoading(true);
    try {
      addLog("Uploading death certificate...", "info");
      const contract = await getInheritanceProtocolContract(signer);
      
      // Create a simple proof (in production this would be a real proof)
      const proof = ethers.toUtf8Bytes("DEATH_CERTIFICATE_PROOF");
      
      const tx = await contract.uploadDeathVerification(deceased, proof);
      addLog("Death certificate transaction sent. Waiting for confirmation...", "info");
      await tx.wait();
      addLog("✓ Death certificate uploaded successfully!", "success");
      
      // Reload contract data to check current state
      await loadContractData();
      
      // Automatically transition to DISTRIBUTION if deceased
      if (deceased) {
        // Check current state - need to be in VERIFICATION to transition to DISTRIBUTION
        const currentState = await contract.getState();
        
        // If not in VERIFICATION, first transition to VERIFICATION
        if (currentState !== 2) { // 2 = VERIFICATION
          addLog("Transitioning to VERIFICATION state...", "info");
          const changeStateTx = await contract.changeState(2); // VERIFICATION = 2
          await changeStateTx.wait();
          addLog("✓ Contract state changed to VERIFICATION", "success");
        }
        
        // Now update state to trigger transition to DISTRIBUTION
        addLog("Updating contract state to trigger distribution...", "info");
        const updateTx = await contract.updateState();
        await updateTx.wait();
        addLog("✓ Contract state updated! Distribution phase initiated.", "success");
        await loadContractData();
      }
    } catch (err: any) {
      const errorMsg = err.reason || err.message || "Failed to upload death certificate";
      addLog(errorMsg, "error");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white mb-2">
              Inheritance Protocol
            </h1>
            <p className="text-gray-200 text-lg">
              Secure decentralized estate planning
            </p>
          </div>
          <WalletConnector onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {!signer ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 border border-white/20 text-center">
            <p className="text-gray-300 text-lg mb-4">
              Please connect your wallet to manage your inheritance protocol
            </p>
            <p className="text-gray-400">
              Make sure MetaMask is installed and set to the local Hardhat network (localhost:8545)
            </p>
          </div>
        ) : isNotary ? (
          // NOTARY VIEW - Minimal interface
          <div className="space-y-6">
            {/* Notary Header */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚖️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Notary Dashboard</h2>
                  <p className="text-purple-200 text-sm">Authorized notary access</p>
                </div>
              </div>
              {/* Current State Info */}
              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <p className="text-gray-300 text-sm">
                  Current Contract State: <span className="font-semibold text-white">{["ACTIVE", "WARNING", "VERIFICATION", "DISTRIBUTION"][state]}</span>
                </p>
              </div>
            </div>

            {/* Notary Actions */}
            <NotaryPanel
              isNotary={isNotary}
              onUploadDeathCertificate={handleUploadDeathCertificate}
              onUpdateState={handleUpdateState}
              isLoading={loading}
            />

            {/* Event Logger - Right side for notary */}
            <div className="lg:col-span-1">
              <EventLogger logs={logs} onClear={clearLogs} />
            </div>
          </div>
        ) : (
          // OWNER VIEW - Changes based on state
          <div className="space-y-6">
            {state === 0 ? (
              // ACTIVE STATE - Full functionality
              <>
                {/* Check-in Section - Prominent CTA */}
                <div className="col-span-full">
                  <CheckInButton onCheckIn={handleCheckIn} isLoading={loading} />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* State and Balance */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StateDisplay
                        state={state}
                        lastCheckIn={lastCheckIn}
                        onUpdateState={handleUpdateState}
                        isLoading={loading}
                      />
                      <BalanceDisplay balance={balance} depositedPercentage={payoutPercentage} />
                    </div>

                    {/* Beneficiaries */}
                    <BeneficiariesList
                      beneficiaries={beneficiaries}
                      onAddBeneficiary={handleAddBeneficiary}
                      onRemoveBeneficiary={handleRemoveBeneficiary}
                      isLoading={loading}
                      maxBeneficiaries={10}
                    />

                    {/* Funds Manager */}
                    <FundsManager
                      onDeposit={handleDeposit}
                      onWithdraw={handleWithdraw}
                      isLoading={loading}
                    />
                  </div>

                  {/* Right Column - Event Logger */}
                  <div className="lg:col-span-1">
                    <EventLogger logs={logs} onClear={clearLogs} />
                  </div>
                </div>
              </>
            ) : state === 1 ? (
              // WARNING STATE - Urgent check-in needed
              <>
                {/* Urgent Warning Banner */}
                <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">⚠️</span>
                    <div>
                      <h2 className="text-2xl font-bold text-yellow-200">Warning: Check-in Overdue</h2>
                      <p className="text-yellow-300">You missed your check-in deadline. Please check in immediately!</p>
                    </div>
                  </div>
                  <CheckInButton onCheckIn={handleCheckIn} isLoading={loading} />
                </div>

                {/* Main Grid - Limited functionality */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StateDisplay
                        state={state}
                        lastCheckIn={lastCheckIn}
                        onUpdateState={handleUpdateState}
                        isLoading={loading}
                      />
                      <BalanceDisplay balance={balance} depositedPercentage={payoutPercentage} />
                    </div>
                    <BeneficiariesList
                      beneficiaries={beneficiaries}
                      onAddBeneficiary={handleAddBeneficiary}
                      onRemoveBeneficiary={handleRemoveBeneficiary}
                      isLoading={loading}
                      maxBeneficiaries={10}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <EventLogger logs={logs} onClear={clearLogs} />
                  </div>
                </div>
              </>
            ) : state === 2 ? (
              // VERIFICATION STATE - Death verification in progress
              <>
                <div className="bg-orange-500/20 border-2 border-orange-500 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">🔍</span>
                    <div>
                      <h2 className="text-2xl font-bold text-orange-200">Verification Phase</h2>
                      <p className="text-orange-300">Your death certificate is being verified. No administrative actions available.</p>
                    </div>
                  </div>
                </div>

                {/* Read-only view */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StateDisplay
                        state={state}
                        lastCheckIn={lastCheckIn}
                        onUpdateState={handleUpdateState}
                        isLoading={loading}
                      />
                      <BalanceDisplay balance={balance} depositedPercentage={payoutPercentage} />
                    </div>
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                      <h3 className="text-xl font-bold text-white mb-4">Beneficiaries</h3>
                      {beneficiaries.length === 0 ? (
                        <p className="text-gray-400">No beneficiaries configured</p>
                      ) : (
                        <div className="space-y-2">
                          {beneficiaries.map((b, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                              <span className="text-white font-mono text-sm">{b.payoutAddress.slice(0, 6)}...{b.payoutAddress.slice(-4)}</span>
                              <span className="text-gray-300">{b.amount}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <EventLogger logs={logs} onClear={clearLogs} />
                  </div>
                </div>
              </>
            ) : (
              // DISTRIBUTION STATE - Payouts completed (compact view)
              <>
                <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✅</span>
                    <div>
                      <h2 className="text-xl font-bold text-red-200">Distribution Complete</h2>
                      <p className="text-red-300 text-sm">All assets have been distributed to beneficiaries.</p>
                    </div>
                  </div>
                </div>

                {/* Compact summary view */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 space-y-4">
                    {/* Compact State and Balance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-300 text-xs mb-1">State</p>
                        <p className="text-lg font-bold text-red-400">DISTRIBUTION</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-gray-300 text-xs mb-1">Balance</p>
                        <p className="text-lg font-bold text-white">0 USDC</p>
                      </div>
                    </div>
                    
                    {/* Scrollable Beneficiaries List */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-lg font-bold text-white mb-3">Final Beneficiaries</h3>
                      {beneficiaries.length === 0 ? (
                        <p className="text-gray-400 text-sm">No beneficiaries were configured</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {beneficiaries.map((b, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                              <span className="text-white font-mono text-xs">{b.payoutAddress.slice(0, 6)}...{b.payoutAddress.slice(-4)}</span>
                              <span className="text-green-400 font-semibold text-sm">{b.amount}% ✓ Paid</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-1">
                    <EventLogger logs={logs} onClear={clearLogs} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
