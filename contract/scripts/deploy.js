// run npx hardhat node
// run this in new terminal session with npx hardhat run scripts/deploy.js --network localhost
import hre from "hardhat";
import DeployModule from "../ignition/modules/Deploy.js";

async function main() {
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

    const { mockUSDC, mockDeathOracle, inheritanceProtocol } = await connection.ignition.deploy(DeployModule);


    console.log("MockUSDC deployed to: ", await mockUSDC.getAddress());
    console.log("MockDeathOracle deployed to: ", await mockDeathOracle.getAddress());
    console.log("InheritanceProtocol deployed to: ", await inheritanceProtocol.getAddress());

    const initialBalance = connection.ethers.parseUnits("10000", 6); // 10,000 USDC
    console.log("Sending 10000 usdc to owner");
    await mockUSDC.mint(owner.address, initialBalance);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});