// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceProtocol is Ownable, ReentrancyGuard {

    IERC20 public immutable usdc;

    /**
     * Stores address and payout percentage amount (0-100) of a beneficiary.
     */
    struct Beneficiary {
        address payoutAddress;
        uint256 amount;
    }

    Beneficiary[10] private beneficiaries;

    uint256 private balance;
    State private currentState;

    uint256 private constant NOT_FOUND = type(uint256).max;
    uint256 private constant MAX_BENEFICIARIES = 10;
    uint256 private constant MAX_PERCENTAGE = 100;

    event BeneficiaryAdded(address indexed payoutAddress, uint256 amount, uint256 index);
    event BeneficiaryRemoved(address indexed payoutAddress, uint256 index);
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);

    /**
     * Initializes a new InheritanceProtocol.
     * @param _usdcAddress address of the currency used (non-zero).
     */
    constructor(address _usdcAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "USDC address zero");
        usdc = IERC20(_usdcAddress);
        currentState = State.ACTIVE;
    }

    /// ---------- MODIFIERS ----------

    /**
     * This modifier requires the function call to be made before distribution.
     */
    modifier onlyPreDistribution() {
        require(currentState < State.DISTRIBUTION, "Cannot modify funds post-distribution");
        _;
    }

    /// ---------- STATE MACHINE ----------

    /**
     * Defines the state of the contract.
     *  - Active: mutable state, owner check-ins required.
     *  - Warning: Missed check-in, notification sent at 90 days,
     *    verification phase starts at 120 days.
     *  - Verification: submission of death certificate (30 days).
     *  - Distribution: distribute assets based on defined conditions.
     */
    enum State { ACTIVE, WARNING, VERIFICATION, DISTRIBUTION }

    /// ---------- BENEFICIARY HANDLING ----------

    /**
     * Removes a beneficiary with a given address.
     * Only the owner can perform this action.
     * @param _address the address to remove.
     * Fails if the provided address is zero OR not in the list of beneficiaries.
     * @return true if the deletion was successful, false otherwise.
     */
    function removeBeneficiary(address _address) public onlyOwner returns (bool) {
        uint256 index = findBeneficiaryIndex(_address);
        if (index == NOT_FOUND) {
            return false;
        }
        delete beneficiaries[index];
        emit BeneficiaryRemoved(_address, index);
        return true;
    }

    /**
     * Finds the index of a beneficiary in the beneficiaries list.
     * @param _address the address whose index to find.
     * @return the index if the address is in the list, 'NOT_FOUND' otherwise.
     */
    function findBeneficiaryIndex(address _address) public view returns (uint256) {
        if (_address == address(0)) {
            return NOT_FOUND;
        }
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress == _address) {
                return i;
            }
        }
        return NOT_FOUND;
    }

    /**
     * Adds a beneficiary to the list.
     * Only the owner can perform this action.
     * Requirements:
     *  - List not full
     *  - Payout after adding <= 100
     * @param _address the address to add to the list.
     * @param _amount the payout amount related to this address.
     * @return true if the addition was successful, false otherwise.
     */
    function addBeneficiary(address _address, uint256 _amount) public onlyOwner returns (bool) {
        require(_address != address(0), "Invalid address");
        require(_amount > 0 && _amount <= MAX_PERCENTAGE, "Invalid amount");

        // Check for duplicate
        if (findBeneficiaryIndex(_address) != NOT_FOUND) {
            return false;
        }

        uint256 currentSum = getDeterminedPayoutPercentage();
        if (currentSum + _amount > MAX_PERCENTAGE) {
            // it should not be possible to payout more than 100%
            return false;
        }

        // Find empty slot
        uint256 emptyIndex = NOT_FOUND;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress == address(0)) {
                emptyIndex = i;
                break;
            }
        }

        if (emptyIndex == NOT_FOUND) {
            return false; // Max beneficiaries reached
        }

        beneficiaries[emptyIndex] = Beneficiary({ payoutAddress: _address, amount: _amount });
        emit BeneficiaryAdded(_address, _amount, emptyIndex);
        return true;
    }



    /// ---------- BALANCE HANDLING ----------

    /**
     * Deposits a given amount of USDC.
     */
    function deposit(uint256 amount) external onlyOwner nonReentrant onlyPreDistribution{
        require(amount > 0, "Amount has to be greater than zero.");

        usdc.transferFrom(msg.sender, address(this), amount);
        balance += amount;

        //TODO add yield generating here -> Aave or something similar
        emit Deposited(amount);

    }

    /**
     * Withdraws a given amount of USDC.
     */
    function withdraw(uint256 amount) external onlyOwner nonReentrant onlyPreDistribution{
        require(amount > 0, "Amount has to be greater than zero.");
        require(balance >= amount, "Insufficient balance");

        balance -= amount;

        usdc.transfer(msg.sender, amount);
        emit Withdrawn(amount);
    }

    /// ---------- VIEW METHODS ----------

    /**
     * Checks if the currently defined payout is fully determined, meaning
     * 100% of the balance is being spent.
     */
    function isPayoutFullyDetermined() public view returns (bool) {
        uint256 sum = getDeterminedPayoutPercentage();
        return sum == MAX_PERCENTAGE;
    }

    /**
     * Calculates the percentage amount of currently determined payout.
     */
    function getDeterminedPayoutPercentage() public view returns (uint256) {
        uint256 sum;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress != address(0)) {
                sum += beneficiaries[i].amount;
            }
        }
        return sum;
    }

    /**
     * Gets the current balance.
     */
    function getBalance() public view returns (uint256) {
        return balance; // If using Aave this might not work anymore
    }

    /**
     * Getter for the beneficiaries list.
     */
    function getBeneficiaries() public view returns (Beneficiary[10] memory) {
        return beneficiaries;
    }

    /**
     * Counts the number of active beneficiaries.
     */
    function getActiveCount() public view returns (uint256) {
        uint256 count;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress != address(0)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Gets only the active beneficiaries.
     * @return an array of beneficiaries.
     */
    function getActiveBeneficiaries() public view returns (Beneficiary[] memory) {
        uint256 activeCount = getActiveCount();
        Beneficiary[] memory active = new Beneficiary[](activeCount);
        uint256 count = 0;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress != address(0)) {
                active[count] = beneficiaries[i];
                count++;
            }
        }
        return active;
    }

}