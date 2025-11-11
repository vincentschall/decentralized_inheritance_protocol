// Auto-deploy script that checks if contracts exist before deploying
import hre from "hardhat";
import DeployModule from "../ignition/modules/Deploy.js";
import fs from "fs";
import { ethers } from "ethers";

const RPC_URL = "http://localhost:8545";
const DEPLOYMENT_INFO_PATH = "./deployment-info.json";
const CLIENT_DEPLOYMENT_INFO_PATH = "../client/public/deployment-info.json";

async function checkContractExists(address) {
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const code = await provider.getCode(address);
        return code && code !== "0x" && code.length > 10;
    } catch (error) {
        return false;
    }
}

async function loadExistingDeployment() {
    try {
        if (fs.existsSync(DEPLOYMENT_INFO_PATH)) {
            const data = fs.readFileSync(DEPLOYMENT_INFO_PATH, "utf8");
            return JSON.parse(data);
        }
    } catch (error) {
        console.log("No existing deployment info found");
    }
    return null;
}

async function verifyContractsExist(deploymentInfo) {
    if (!deploymentInfo || !deploymentInfo.contracts) {
        return false;
    }

    const contracts = deploymentInfo.contracts;
    const requiredContracts = ["InheritanceProtocol", "MockUSDC", "MockDeathOracle", "MockAavePool"];
    
    for (const contractName of requiredContracts) {
        const address = contracts[contractName];
        if (!address) {
            console.log(`Missing ${contractName} address in deployment info`);
            return false;
        }
        
        const exists = await checkContractExists(address);
        if (!exists) {
            console.log(`Contract ${contractName} at ${address} does not exist`);
            return false;
        }
    }
    
    return true;
}

async function deployContracts() {
    console.log("Deploying contracts ...");
    const connection = await hre.network.connect();

    // Get signers via connection.ethers
    const [owner, notary, beneficiary1, beneficiary2, beneficiary3] = await connection.ethers.getSigners();
    console.log("Deploying with accounts");
    console.log("Owner: ", owner.address);
    console.log("Notary: ", notary.address);
    console.log("Beneficiary1: ", beneficiary1.address);
    console.log("Beneficiary2: ", beneficiary2.address);
    console.log("Beneficiary3: ", beneficiary3.address);

    const { mockUSDC, mockDeathOracle, mockAavePool, inheritanceProtocol } = await connection.ignition.deploy(
        DeployModule, {
            parameters: {
                Deploy: {
                    notaryAddress: notary.address
                }
            }
        }
    );

    console.log("MockUSDC deployed to: ", await mockUSDC.getAddress());
    console.log("MockDeathOracle deployed to: ", await mockDeathOracle.getAddress());
    console.log("MockAavePool deployed to: ", await mockAavePool.getAddress());
    console.log("InheritanceProtocol deployed to: ", await inheritanceProtocol.getAddress());

    const initialBalance = connection.ethers.parseUnits("10000", 6); // 10,000 USDC
    console.log("Sending 10000 usdc to owner");
    await mockUSDC.mint(owner.address, initialBalance);
    await mockUSDC.connect(owner).approve(await mockUSDC.getAddress(), initialBalance);

    const deploymentInfo = {
        network: "localhost",
        contracts: {
            MockUSDC: await mockUSDC.getAddress(),
            MockDeathOracle: await mockDeathOracle.getAddress(),
            MockAavePool: await mockAavePool.getAddress(),
            InheritanceProtocol: await inheritanceProtocol.getAddress()
        },
        accounts: {
            owner: owner.address,
            notary: notary.address,
            beneficiary1: beneficiary1.address,
            beneficiary2: beneficiary2.address,
            beneficiary3: beneficiary3.address
        }
    };

    console.log("Deployment summary: ");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    fs.writeFileSync(DEPLOYMENT_INFO_PATH, JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to deployment-info.json");

    // Copy to client/public/
    fs.copyFileSync(DEPLOYMENT_INFO_PATH, CLIENT_DEPLOYMENT_INFO_PATH);
    console.log("✓ Copied deployment-info.json to client/public/");
    
    return deploymentInfo;
}

async function main() {
    try {
        // Check if Hardhat node is running
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        await provider.getBlockNumber();
        console.log("✓ Hardhat node is running");
    } catch (error) {
        console.error("✗ Cannot connect to Hardhat node at", RPC_URL);
        console.error("Please start Hardhat node first: npx hardhat node");
        process.exit(1);
    }

    // Load existing deployment info
    const existingDeployment = await loadExistingDeployment();
    
    if (existingDeployment) {
        console.log("Found existing deployment info, verifying contracts...");
        const contractsExist = await verifyContractsExist(existingDeployment);
        
        if (contractsExist) {
            console.log("✓ All contracts exist and are valid");
            console.log("InheritanceProtocol:", existingDeployment.contracts.InheritanceProtocol);
            return;
        } else {
            console.log("⚠ Some contracts are missing, redeploying...");
            // Clear Ignition cache to force fresh deployment
            const ignitionPath = "./ignition/deployments/chain-1337";
            if (fs.existsSync(ignitionPath)) {
                fs.rmSync(ignitionPath, { recursive: true, force: true });
                console.log("Cleared Ignition cache");
            }
        }
    } else {
        console.log("No existing deployment found, deploying fresh...");
    }

    // Deploy contracts
    await deployContracts();
    console.log("✓ Deployment complete!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

