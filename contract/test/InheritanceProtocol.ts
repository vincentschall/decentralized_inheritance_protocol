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

    describe("Initialization", function () {
        it("Should set the correct number of active beneficiaries", async function () {
            expect(await inheritanceProtocol.getActiveCount()).to.equal(0);
        });

        it("Should return an empty list of beneficiaries", async function () {
            const beneficiaries = await inheritanceProtocol.getBeneficiaries();
            beneficiaries.forEach((beneficiary) => {
                expect(beneficiary[0]).to.equal("0x0000000000000000000000000000000000000000");
                expect(beneficiary[1]).to.equal(0n);
            })
        });

        it("Should set determined payout percentage to 0", async function () {
            expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(0);
        });

        it("Should define that the payout is not fully determined", async function () {
            expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.equal(false);
        })
    });

});
