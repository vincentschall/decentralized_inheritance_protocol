export const STATE_NAMES: Record<number, string> = {
  0: "ACTIVE",
  1: "WARNING",
  2: "VERIFICATION",
  3: "DISTRIBUTION",
};

export const STATE_COLORS: Record<number, string> = {
  0: "bg-green-500",
  1: "bg-yellow-500",
  2: "bg-orange-500",
  3: "bg-red-500",
};

export const STATE_DESCRIPTIONS: Record<number, string> = {
  0: "Active - Owner check-ins required every 90 days",
  1: "Warning - Owner missed check-in, verification starts in 30 days",
  2: "Verification - Waiting for death certificate submission",
  3: "Distribution - Assets being distributed to beneficiaries",
};

export const RPC_URL = "http://localhost:8545";
export const CHAIN_ID = 31337; // Hardhat local chain ID
