import { expect } from "chai";
import hre from "hardhat";
import type { InheritanceProtocol, MockUSDC } from "../types/ethers-contracts/index.js";

let connectedEthers: Awaited<ReturnType<typeof hre.network.connect>>['ethers'];

describe("Inheritance Protocol", function () {
    let inheritanceProtocol: InheritanceProtocol;
    let mockUSDC: MockUSDC;
    type SignerType = Awaited<ReturnType<typeof connectedEthers.getSigners>>[number];
    let owner: SignerType;
    let addrs: SignerType[];

    const USDC_DECIMALS = 6;
    const INITIAL_USDC_BALANCE = 10000n * (10n ** BigInt(USDC_DECIMALS));

    before(async function () {
        const { ethers } = await hre.network.connect();
        connectedEthers = ethers;
        [owner, ...addrs] = await connectedEthers.getSigners();
    });

    beforeEach(async function () {
        const MockUSDCFactory = await connectedEthers.getContractFactory("MockUSDC");
        mockUSDC = await MockUSDCFactory.deploy();

        const InheritanceProtocolFactory = await connectedEthers.getContractFactory("InheritanceProtocol");
        inheritanceProtocol = await InheritanceProtocolFactory.deploy(
            await mockUSDC.getAddress()
        );

        await mockUSDC.mint(owner.address, INITIAL_USDC_BALANCE);

        await mockUSDC.connect(owner).approve(
            await inheritanceProtocol.getAddress(),
            2n ** 256n - 1n
        );
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await inheritanceProtocol.owner()).to.equal(owner.address);
        });

        it("Should set the correct USDC address", async function () {
            expect(await inheritanceProtocol.usdc()).to.equal(await mockUSDC.getAddress());
        });
    });
});