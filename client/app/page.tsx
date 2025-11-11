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

        contract.on("CheckedIn", () => {
          addLog("✓ Owner checked in", "event");
          loadContractData();
        });

        contract.on("Deposited", (amount) => {
          addLog(`✓ Deposited ${ethers.formatUnits(amount, 6)} USDC`, "event");
          loadContractData();
        });

        contract.on("Withdrawn", (amount) => {
          addLog(`✓ Withdrew ${ethers.formatUnits(amount, 6)} USDC`, "event");
          loadContractData();
        });

        contract.on("StateChanged", (_, from, to) => {
          const stateNames = ["ACTIVE", "WARNING", "VERIFICATION", "DISTRIBUTION"];
          addLog(
            `State changed: ${stateNames[from]} → ${stateNames[to]}`,
            "warning"
          );
          loadContractData();
        });

        contract.on("BeneficiaryAdded", (addr, amount) => {
          addLog(`✓ Beneficiary added: ${addr.slice(0, 6)}...${addr.slice(-4)} (${amount}%)`, "event");
          loadContractData();
        });

        contract.on("BeneficiaryRemoved", (addr) => {
          addLog(`✓ Beneficiary removed: ${addr.slice(0, 6)}...${addr.slice(-4)}`, "event");
          loadContractData();
        });
      } catch (err) {
        console.error("Failed to setup event listeners:", err);
      }
    };

    setupListeners();
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
      await loadContractData();
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
        ) : (
          <div className="space-y-6">
            {/* Check-in Section - Prominent CTA */}
            <div className="col-span-full">
              <CheckInButton onCheckIn={handleCheckIn} isLoading={loading} />
            </div>

            {/* Notary Panel - Only visible to notary */}
            {isNotary && (
              <NotaryPanel
                isNotary={isNotary}
                onUploadDeathCertificate={handleUploadDeathCertificate}
                onUpdateState={handleUpdateState}
                isLoading={loading}
              />
            )}

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
          </div>
        )}
      </div>
    </div>
  );
}
