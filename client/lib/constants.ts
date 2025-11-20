export const STATE_NAMES: Record<number, string> = {
  0: "Active",
  1: "Warning",
  2: "Verification",
  3: "Distribution",
};

export const STATE_COLORS: Record<number, string> = {
  0: "bg-emerald-500",
  1: "bg-amber-500",
  2: "bg-orange-500",
  3: "bg-slate-500",
};

export const STATE_TEXT_COLORS: Record<number, string> = {
  0: "text-emerald-600",
  1: "text-amber-600",
  2: "text-orange-600",
  3: "text-slate-600",
};

export const STATE_BG_COLORS: Record<number, string> = {
  0: "bg-emerald-50",
  1: "bg-amber-50",
  2: "bg-orange-50",
  3: "bg-slate-50",
};

export const STATE_DESCRIPTIONS: Record<number, string> = {
  0: "Owner check-ins required every 90 days",
  1: "Owner missed check-in, verification starts in 30 days",
  2: "Waiting for death certificate submission",
  3: "Assets being distributed to beneficiaries",
};

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545";
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "1337");
