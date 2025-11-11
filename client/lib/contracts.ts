import { ethers } from "ethers";
import { INHERITANCE_PROTOCOL_ABI, USDC_ABI } from "./abi";

export interface DeploymentInfo {
  network: string;
  contracts: {
    MockUSDC: string;
    MockDeathOracle: string;
    MockAavePool: string;
    InheritanceProtocol: string;
  };
  accounts: {
    owner: string;
    notary: string;
    beneficiary1: string;
    beneficiary2: string;
    beneficiary3: string;
  };
}

let deploymentInfo: DeploymentInfo | null = null;

export async function loadDeploymentInfo(): Promise<DeploymentInfo> {
  if (deploymentInfo) {
    return deploymentInfo;
  }

  try {
    const response = await fetch("/deployment-info.json");
    if (!response.ok) {
      throw new Error(`Failed to load deployment info: ${response.statusText}`);
    }
    deploymentInfo = await response.json();
    return deploymentInfo;
  } catch (error) {
    console.error("Error loading deployment info:", error);
    throw new Error("Could not load contract deployment information. Make sure the backend is running.");
  }
}

export async function getInheritanceProtocolContract(
  signer: ethers.Signer
): Promise<ethers.Contract> {
  const info = await loadDeploymentInfo();
  return new ethers.Contract(
    info.contracts.InheritanceProtocol,
    INHERITANCE_PROTOCOL_ABI,
    signer
  );
}

export async function getUSDCContract(
  signer: ethers.Signer
): Promise<ethers.Contract> {
  const info = await loadDeploymentInfo();
  return new ethers.Contract(
    info.contracts.MockUSDC,
    USDC_ABI,
    signer
  );
}

export async function getInheritanceProtocolReadonly(
  provider: ethers.Provider
): Promise<ethers.Contract> {
  const info = await loadDeploymentInfo();
  return new ethers.Contract(
    info.contracts.InheritanceProtocol,
    INHERITANCE_PROTOCOL_ABI,
    provider
  );
}
