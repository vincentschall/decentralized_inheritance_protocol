// run npx hardhat node
// run this in new terminal session with npx hardhat run scripts/deploy.js --network localhost
import hre from "hardhat";
import DeployModule from "../ignition/modules/Deploy.js";
import fs from "fs";

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
    fs.writeFileSync("./deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to deployment-info.json");

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});