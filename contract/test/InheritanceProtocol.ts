import { expect } from "chai";
import { ZeroAddress } from "ethers";
import hre from "hardhat";
import type { InheritanceProtocol, MockUSDC, MockDeathOracle } from "../types/ethers-contracts/index.js";

let connectedEthers: Awaited<ReturnType<typeof hre.network.connect>>['ethers'];

describe("Inheritance Protocol", function () {
    let inheritanceProtocol: InheritanceProtocol;
    let mockUSDC: MockUSDC;
    type SignerType = Awaited<ReturnType<typeof connectedEthers.getSigners>>[number];
    let owner: SignerType;
    let addrs: SignerType[];
    let beneficiary1: SignerType;
    let beneficiary2: SignerType;
    let beneficiary3: SignerType;
    let beneficiary4: SignerType;
    let beneficiary5: SignerType;
    let beneficiary6: SignerType;
    let beneficiary7: SignerType;
    let beneficiary8: SignerType;
    let beneficiary9: SignerType;
    let beneficiary10: SignerType;

    let mockDeathOracle: MockDeathOracle;

    const USDC_DECIMALS = 6;
    const INITIAL_USDC_BALANCE = 10000n * (10n ** BigInt(USDC_DECIMALS));

    before(async function () {
        const { ethers } = await hre.network.connect();
        connectedEthers = ethers;
        [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4, beneficiary5, beneficiary6, beneficiary7, beneficiary8, beneficiary9, beneficiary10, ...addrs] = await connectedEthers.getSigners();
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

        const MockDeathOracle = await connectedEthers.getContractFactory("MockDeathOracle");
        mockDeathOracle = await MockDeathOracle.deploy();
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
                expect(beneficiary.payoutAddress).to.equal(ZeroAddress);
                expect(beneficiary.amount).to.equal(0n);
            })
        });

        it("Should set determined payout percentage to 0", async function () {
            expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(0);
        });

        it("Should define that the payout is not fully determined", async function () {
            expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.equal(false);
        });
    });

    describe("Beneficiary handling helpers", function () {
        async function setupBeneficiaries(setup: Array<{ address: SignerType; amount: bigint }>) {
            for (const { address, amount } of setup) {
                const tx = await inheritanceProtocol.addBeneficiary(address.address, amount);
                await expect(tx).to.emit(inheritanceProtocol, "BeneficiaryAdded");
            }
        }

        async function setup10Beneficiaries() {
            await setupBeneficiaries([
                { address: beneficiary1, amount: 10n },
                { address: beneficiary2, amount: 10n },
                { address: beneficiary3, amount: 10n },
                { address: beneficiary4, amount: 10n },
                { address: beneficiary5, amount: 10n },
                { address: beneficiary6, amount: 10n },
                { address: beneficiary7, amount: 10n },
                { address: beneficiary8, amount: 10n },
                { address: beneficiary9, amount: 10n },
                { address: beneficiary10, amount: 10n }
            ]);
        }

        describe("Adding beneficiaries", function () {
            it("Should allow adding a single valid beneficiary", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();
                const tx = await inheritanceProtocol.addBeneficiary(beneficiary1.address, 10n);
                await expect(tx).to.emit(inheritanceProtocol, "BeneficiaryAdded");
                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 1n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum + 10n);
            });

            it("Should allow adding multiple beneficiaries up to max without exceeding 100%", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();
                await setupBeneficiaries([
                    { address: beneficiary1, amount: 10n },
                    { address: beneficiary2, amount: 20n },
                    { address: beneficiary3, amount: 30n },
                    { address: beneficiary4, amount: 40n }
                ]);
                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 4n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum + 100n);
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.true;
            });

            it("Should allow adding exactly 10 beneficiaries", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();
                await setup10Beneficiaries();
                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 10n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum + 100n);
            });

            it("Should reject adding a beneficiary with zero address", async function () {
                await expect(
                    inheritanceProtocol.addBeneficiary(ZeroAddress, 10n)
                ).to.be.revertedWith("Invalid address");
            });

            it("Should reject adding a beneficiary with invalid amount (0)", async function () {
                await expect(
                    inheritanceProtocol.addBeneficiary(beneficiary1.address, 0n)
                ).to.be.revertedWith("Invalid amount");
            });

            it("Should reject adding a beneficiary with invalid amount (>100)", async function () {
                await expect(
                    inheritanceProtocol.addBeneficiary(beneficiary1.address, 101n)
                ).to.be.revertedWith("Invalid amount");
            });

            it("Should reject adding a duplicate beneficiary", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                const tx1 = await inheritanceProtocol.addBeneficiary(beneficiary1.address, 10n);
                await expect(tx1).to.emit(inheritanceProtocol, "BeneficiaryAdded");

                const tx2 = await inheritanceProtocol.addBeneficiary(beneficiary1.address, 20n);
                await expect(tx2).to.not.emit(inheritanceProtocol, "BeneficiaryAdded");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 1n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum + 10n);
            });

            it("Should reject adding when total percentage would exceed 100%", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                await setupBeneficiaries([
                    { address: beneficiary1, amount: 50n },
                    { address: beneficiary2, amount: 50n }
                ]);

                const tx = await inheritanceProtocol.addBeneficiary(beneficiary3.address, 1n);
                await expect(tx).to.not.emit(inheritanceProtocol, "BeneficiaryAdded");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 2n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum + 100n);
            });

            it("Should reject adding when list is full (10 beneficiaries)", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                await setup10Beneficiaries();

                const tx = await inheritanceProtocol.addBeneficiary(addrs[0].address, 5n);
                await expect(tx).to.not.emit(inheritanceProtocol, "BeneficiaryAdded");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 10n);
            });
        });

        describe("Removing beneficiaries", function () {
            beforeEach(async function () {
                await setupBeneficiaries([
                    { address: beneficiary1, amount: 10n },
                    { address: beneficiary2, amount: 20n },
                    { address: beneficiary3, amount: 30n }
                ]);
            });

            it("Should allow removing a valid beneficiary", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                const tx = await inheritanceProtocol.removeBeneficiary(beneficiary2.address);
                await expect(tx).to.emit(inheritanceProtocol, "BeneficiaryRemoved");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount - 1n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum - 20n);
            });

            it("Should reject removing a non-existent beneficiary", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                const tx = await inheritanceProtocol.removeBeneficiary(addrs[0].address);
                await expect(tx).to.not.emit(inheritanceProtocol, "BeneficiaryRemoved");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum);
            });

            it("Should reject removing zero address", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                const tx = await inheritanceProtocol.removeBeneficiary(ZeroAddress);
                await expect(tx).to.not.emit(inheritanceProtocol, "BeneficiaryRemoved");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum);
            });

            it("Should update fully determined status after removal", async function () {
                // Clear existing beneficiaries from beforeEach
                await inheritanceProtocol.removeBeneficiary(beneficiary1.address);
                await inheritanceProtocol.removeBeneficiary(beneficiary2.address);
                await inheritanceProtocol.removeBeneficiary(beneficiary3.address);

                await setupBeneficiaries([
                    { address: beneficiary1, amount: 40n },
                    { address: beneficiary2, amount: 60n }
                ]);
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.true;

                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                const tx = await inheritanceProtocol.removeBeneficiary(beneficiary2.address);
                await expect(tx).to.emit(inheritanceProtocol, "BeneficiaryRemoved");

                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum - 60n);
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.false;
            });
        });

        describe("Getting beneficiaries", function () {
            beforeEach(async function () {
                await setupBeneficiaries([
                    { address: beneficiary1, amount: 10n },
                    { address: beneficiary3, amount: 30n },
                    { address: beneficiary5, amount: 50n }
                ]);
            });

            it("Should return the full fixed-size array of beneficiaries", async function () {
                const fullList = await inheritanceProtocol.getBeneficiaries();
                expect(fullList.length).to.equal(10);

                // Check active ones (order preserved by addition; collect and match)
                const activeAddresses = [beneficiary1.address, beneficiary3.address, beneficiary5.address];
                const activeAmounts = [10n, 30n, 50n];
                const foundActive = new Map<string, bigint>();
                for (let i = 0; i < 10; i++) {
                    const addr = fullList[i].payoutAddress;
                    const amt = fullList[i].amount;
                    if (activeAddresses.includes(addr)) {
                        foundActive.set(addr, amt);
                    } else {
                        expect(addr).to.equal(ZeroAddress);
                        expect(amt).to.equal(0n);
                    }
                }
                expect(foundActive.size).to.equal(3);
                activeAddresses.forEach((expectedAddr, idx) => {
                    expect(foundActive.get(expectedAddr)).to.equal(activeAmounts[idx]);
                });
            });

            it("Should return only active beneficiaries in getActiveBeneficiaries", async function () {
                const activeList = await inheritanceProtocol.getActiveBeneficiaries();
                expect(activeList.length).to.equal(3);
                const activeAddresses = [beneficiary1.address, beneficiary3.address, beneficiary5.address];
                const activeAmounts = [10n, 30n, 50n];
                activeList.forEach((beneficiary, i) => {
                    expect(beneficiary.payoutAddress).to.equal(activeAddresses[i]);
                    expect(beneficiary.amount).to.equal(activeAmounts[i]);
                });
            });

            it("Should correctly count active beneficiaries", async function () {
                expect(await inheritanceProtocol.getActiveCount()).to.equal(3);
            });

            it("Should correctly compute determined payout percentage", async function () {
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(90n);
            });

            it("Should correctly check if payout is fully determined", async function () {
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.false;

                // Add one more to make 100%
                const tx = await inheritanceProtocol.addBeneficiary(beneficiary2.address, 10n);
                await expect(tx).to.emit(inheritanceProtocol, "BeneficiaryAdded");
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.true;
            });
        });

        describe("Edge cases", function () {
            it("Should handle adding and removing in mixed order without issues", async function () {
                // Add 5
                await setupBeneficiaries([
                    { address: beneficiary1, amount: 20n },
                    { address: beneficiary2, amount: 20n },
                    { address: beneficiary3, amount: 20n },
                    { address: beneficiary4, amount: 20n },
                    { address: beneficiary5, amount: 20n }
                ]);
                let currentCount = await inheritanceProtocol.getActiveCount();
                let currentSum = await inheritanceProtocol.getDeterminedPayoutPercentage();
                expect(currentCount).to.equal(5n);
                expect(currentSum).to.equal(100n);

                // Remove one
                const removeTx = await inheritanceProtocol.removeBeneficiary(beneficiary3.address);
                await expect(removeTx).to.emit(inheritanceProtocol, "BeneficiaryRemoved");
                currentCount = await inheritanceProtocol.getActiveCount();
                currentSum = await inheritanceProtocol.getDeterminedPayoutPercentage();
                expect(currentCount).to.equal(4n);
                expect(currentSum).to.equal(80n);

                // Try to add back with adjusted amount
                const addTx1 = await inheritanceProtocol.addBeneficiary(beneficiary3.address, 10n);
                await expect(addTx1).to.emit(inheritanceProtocol, "BeneficiaryAdded");
                currentCount = await inheritanceProtocol.getActiveCount();
                currentSum = await inheritanceProtocol.getDeterminedPayoutPercentage();
                expect(currentCount).to.equal(5n);
                expect(currentSum).to.equal(90n);

                // Fill to 100% with another
                const addTx2 = await inheritanceProtocol.addBeneficiary(beneficiary6.address, 10n);
                await expect(addTx2).to.emit(inheritanceProtocol, "BeneficiaryAdded");
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.true;
            });

            it("Should handle max percentage exactly at 100% without overflow", async function () {
                const initialCount = await inheritanceProtocol.getActiveCount();
                const initialSum = await inheritanceProtocol.getDeterminedPayoutPercentage();

                const tx = await inheritanceProtocol.addBeneficiary(beneficiary1.address, 100n);
                await expect(tx).to.emit(inheritanceProtocol, "BeneficiaryAdded");

                expect(await inheritanceProtocol.getActiveCount()).to.equal(initialCount + 1n);
                expect(await inheritanceProtocol.getDeterminedPayoutPercentage()).to.equal(initialSum + 100n);
                expect(await inheritanceProtocol.isPayoutFullyDetermined()).to.be.true;

                // Cannot add more
                const tx2 = await inheritanceProtocol.addBeneficiary(beneficiary2.address, 1n);
                await expect(tx2).to.not.emit(inheritanceProtocol, "BeneficiaryAdded");
            });

            it("findBeneficiaryIndex should work correctly", async function () {
                await setupBeneficiaries([
                    { address: beneficiary1, amount: 10n },
                    { address: beneficiary2, amount: 20n }
                ]);

                // Note: This is an internal view function, but we can test via events or indirect checks
                // For direct testing, we'd need to expose it or infer from behavior
                // Here, infer from remove success
                const removeTx1 = await inheritanceProtocol.removeBeneficiary(beneficiary1.address);
                await expect(removeTx1).to.emit(inheritanceProtocol, "BeneficiaryRemoved");

                const removeTx2 = await inheritanceProtocol.removeBeneficiary(beneficiary2.address);
                await expect(removeTx2).to.emit(inheritanceProtocol, "BeneficiaryRemoved");

                const removeTx3 = await inheritanceProtocol.removeBeneficiary(addrs[0].address);
                await expect(removeTx3).to.not.emit(inheritanceProtocol, "BeneficiaryRemoved");
            });
        });
    });

    describe("Funds Handling", function () {
        const DEPOSIT_AMOUNT = 1000n * (10n ** BigInt(USDC_DECIMALS));
        const WITHDRAW_PARTIAL_AMOUNT = 500n * (10n ** BigInt(USDC_DECIMALS));

        describe("Deposits", function () {
            it("Should deposit funds successfully", async function () {
                const initialContractBalance = await mockUSDC.balanceOf(await inheritanceProtocol.getAddress());
                const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);
                const initialProtocolBalance = await inheritanceProtocol.getBalance();

                const tx = await inheritanceProtocol.deposit(DEPOSIT_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Deposited").withArgs(DEPOSIT_AMOUNT);

                expect(await inheritanceProtocol.getBalance()).to.equal(initialProtocolBalance + DEPOSIT_AMOUNT);
                expect(await mockUSDC.balanceOf(await inheritanceProtocol.getAddress())).to.equal(initialContractBalance + DEPOSIT_AMOUNT);
                expect(await mockUSDC.balanceOf(owner.address)).to.equal(initialOwnerBalance - DEPOSIT_AMOUNT);
            });

            it("Should reject deposit with zero amount", async function () {
                await expect(inheritanceProtocol.deposit(0n)).to.be.revertedWith("Amount has to be greater than zero.");
            });

            it("Should allow deposit after adding beneficiaries (no interference)", async function () {
                // Setup beneficiaries first
                await inheritanceProtocol.addBeneficiary(beneficiary1.address, 50n);
                await inheritanceProtocol.addBeneficiary(beneficiary2.address, 50n);

                const tx = await inheritanceProtocol.deposit(DEPOSIT_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Deposited").withArgs(DEPOSIT_AMOUNT);

                expect(await inheritanceProtocol.getBalance()).to.equal(DEPOSIT_AMOUNT);
                expect(await inheritanceProtocol.getActiveCount()).to.equal(2n); // Beneficiaries unchanged
            });

            it("Should reject deposit from non-owner", async function () {
                await expect(
                    inheritanceProtocol.connect(addrs[0]).deposit(DEPOSIT_AMOUNT)
                ).to.be.revertedWithCustomError(inheritanceProtocol, "OwnableUnauthorizedAccount")
                    .withArgs(addrs[0].address);
            });

            // Note: State guard test assumes currentState is ACTIVE initially; full test requires state implementation
            it("Should allow deposit in ACTIVE state", async function () {
                // Assuming initial state is ACTIVE; deposit succeeds as above
                const tx = await inheritanceProtocol.deposit(DEPOSIT_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Deposited").withArgs(DEPOSIT_AMOUNT);
            });
        });

        describe("Withdrawals", function () {
            beforeEach(async function () {
                // Pre-deposit for withdrawal tests
                await inheritanceProtocol.deposit(DEPOSIT_AMOUNT);
            });

            it("Should withdraw funds successfully (partial)", async function () {
                const initialContractBalance = await mockUSDC.balanceOf(await inheritanceProtocol.getAddress());
                const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);
                const initialProtocolBalance = await inheritanceProtocol.getBalance();

                const tx = await inheritanceProtocol.withdraw(WITHDRAW_PARTIAL_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Withdrawn").withArgs(WITHDRAW_PARTIAL_AMOUNT);

                expect(await inheritanceProtocol.getBalance()).to.equal(initialProtocolBalance - WITHDRAW_PARTIAL_AMOUNT);
                expect(await mockUSDC.balanceOf(await inheritanceProtocol.getAddress())).to.equal(initialContractBalance - WITHDRAW_PARTIAL_AMOUNT);
                expect(await mockUSDC.balanceOf(owner.address)).to.equal(initialOwnerBalance + WITHDRAW_PARTIAL_AMOUNT);
            });

            it("Should withdraw funds successfully (full)", async function () {
                const initialContractBalance = await mockUSDC.balanceOf(await inheritanceProtocol.getAddress());
                const initialOwnerBalance = await mockUSDC.balanceOf(owner.address);
                const initialProtocolBalance = await inheritanceProtocol.getBalance();

                const tx = await inheritanceProtocol.withdraw(DEPOSIT_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Withdrawn").withArgs(DEPOSIT_AMOUNT);

                expect(await inheritanceProtocol.getBalance()).to.equal(initialProtocolBalance - DEPOSIT_AMOUNT);
                expect(await mockUSDC.balanceOf(await inheritanceProtocol.getAddress())).to.equal(initialContractBalance - DEPOSIT_AMOUNT);
                expect(await mockUSDC.balanceOf(owner.address)).to.equal(initialOwnerBalance + DEPOSIT_AMOUNT);
            });

            it("Should reject withdrawal with zero amount", async function () {
                await expect(inheritanceProtocol.withdraw(0n)).to.be.revertedWith("Amount has to be greater than zero.");
            });

            it("Should reject withdrawal exceeding balance", async function () {
                await expect(inheritanceProtocol.withdraw(DEPOSIT_AMOUNT * 2n)).to.be.revertedWith("Insufficient balance");
            });

            it("Should reject withdrawal from non-owner", async function () {
                await expect(
                    inheritanceProtocol.connect(addrs[0]).withdraw(WITHDRAW_PARTIAL_AMOUNT)
                ).to.be.revertedWithCustomError(inheritanceProtocol, "OwnableUnauthorizedAccount")
                    .withArgs(addrs[0].address);
            });

            it("Should allow withdrawal after adding beneficiaries (no interference)", async function () {
                // Setup beneficiaries after deposit
                await inheritanceProtocol.addBeneficiary(beneficiary1.address, 50n);
                await inheritanceProtocol.addBeneficiary(beneficiary2.address, 50n);

                const tx = await inheritanceProtocol.withdraw(WITHDRAW_PARTIAL_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Withdrawn").withArgs(WITHDRAW_PARTIAL_AMOUNT);

                expect(await inheritanceProtocol.getBalance()).to.equal(DEPOSIT_AMOUNT - WITHDRAW_PARTIAL_AMOUNT);
                expect(await inheritanceProtocol.getActiveCount()).to.equal(2n); // Beneficiaries unchanged
            });

            // Note: State guard test assumes currentState is ACTIVE initially; full test requires state implementation
            it("Should allow withdrawal in ACTIVE state", async function () {
                const tx = await inheritanceProtocol.withdraw(WITHDRAW_PARTIAL_AMOUNT);
                await expect(tx).to.emit(inheritanceProtocol, "Withdrawn").withArgs(WITHDRAW_PARTIAL_AMOUNT);
            });

            it("Should reject withdrawal post-distribution (when implemented)", async function () {
                // TODO: Once state machine is added, mock or set currentState to DISTRIBUTION and expect revert with "Cannot modify funds post-distribution"
                // For now, skipped as state not yet implemented
                this.skip();
            });
        });

        describe("Funds Edge Cases", function () {
            it("Should handle multiple deposits and withdrawals correctly", async function () {
                const deposit1 = 500n * (10n ** BigInt(USDC_DECIMALS));
                const deposit2 = 300n * (10n ** BigInt(USDC_DECIMALS));
                const withdraw1 = 400n * (10n ** BigInt(USDC_DECIMALS));

                // Deposit 1
                await inheritanceProtocol.deposit(deposit1);
                expect(await inheritanceProtocol.getBalance()).to.equal(deposit1);

                // Deposit 2
                await inheritanceProtocol.deposit(deposit2);
                expect(await inheritanceProtocol.getBalance()).to.equal(deposit1 + deposit2);

                // Withdraw partial
                await inheritanceProtocol.withdraw(withdraw1);
                expect(await inheritanceProtocol.getBalance()).to.equal(deposit1 + deposit2 - withdraw1);
            });

            it("getBalance should reflect contract's USDC balance accurately", async function () {
                await inheritanceProtocol.deposit(DEPOSIT_AMOUNT);
                expect(await inheritanceProtocol.getBalance()).to.equal(await mockUSDC.balanceOf(await inheritanceProtocol.getAddress()));
            });
        });
    });

    describe("Check-ins and state machine", function (){
        const CHECK_IN_PERIOD = 90n * 24n * 60n * 60n;
        const GRACE_PERIOD = 30n * 24n * 60n * 60n;

        describe("Initial check-in state", function () {
            it("Should set last check-in time to deployment time", async function () {
                const lastCheckInTime = await inheritanceProtocol.getLastCheckIn();
                const currentBlock = await connectedEthers.provider.getBlock('latest');
                expect(lastCheckInTime).to.be.closeTo(BigInt(currentBlock!.timestamp), 5n);
            });

            it("Should start in active state", async function () {
                const state = await inheritanceProtocol.getState();
                expect(state).to.equal(0);
            });
        });

        describe("Check-ins in active state", function () {

            it("Should allow owner to check in", async function () {
                const { networkHelpers } = await hre.network.connect();
                const initialCheckIn = await inheritanceProtocol.getLastCheckIn();
                const timeSkip = 10n * 24n * 60n * 60n; // 10 days
                await networkHelpers.time.increase(timeSkip);
                const tx = await inheritanceProtocol.checkIn();
                await expect(tx).to.emit(inheritanceProtocol, "CheckedIn");
                const newCheckInTime = await inheritanceProtocol.getLastCheckIn();
                expect(newCheckInTime).to.be.gt(initialCheckIn);
            });

        });
    });

    describe("Mocking death oracles", function () {

        it("Should allow recording deaths", async function () {
            const proof = "0xabcdabcd";
            // I used beneficiary address here, so I don't have to set up new test addresses
            const address = await beneficiary1.getAddress();
            await expect(
                mockDeathOracle.setDeathStatus(address, true, proof)
            ).to.emit(mockDeathOracle, "DeathRecorded");
            expect(await mockDeathOracle.isDeceased(address)).to.be.true;
            expect(await mockDeathOracle.getProof(address)).to.equal(proof);
        });

    });
});