// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceProtocol is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    /**
     * Defines the state of the contract.
     *  - Active: mutable state, owner check-ins required.
     *  - Warning: Missed check-in, notification sent at 90 days,
     *    verification phase starts at 120 days.
     *  - Verification: submission of death certificate (30 days).
     *  - Distribution: distribute assets based on defined conditions.
     */
    enum State { ACTIVE, WARNING, VERIFICATION, DISTRIBUTION }

    /**
     * Stores address and payout percentage amount (0-100) of a beneficiary.
     */
    struct Beneficiary {
        address payoutAddress;
        uint256 amount;
    }

    Beneficiary[10] private beneficiaries;

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
    }

    /// ---------- BENEFICIARY HANDLING ----------

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
     * @param amount the payout amount related to this address.
     * @return true if the addition was successful, false otherwise.
     */
    function addBeneficiary(address _address, uint256 amount) public onlyOwner returns (bool) {
        require(_address != address(0), "Invalid address");
        require(amount > 0 && amount <= MAX_PERCENTAGE, "Invalid amount");

        // Check for duplicate
        if (findBeneficiaryIndex(_address) != NOT_FOUND) {
            return false;
        }

        uint256 currentSum = getDeterminedPayoutPercentage();
        if (currentSum + amount > MAX_PERCENTAGE) {
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

        beneficiaries[emptyIndex] = Beneficiary({ payoutAddress: _address, amount: amount });
        emit BeneficiaryAdded(_address, amount, emptyIndex);
        return true;
    }

    function getBeneficiaries() public view returns (Beneficiary[10] memory) {
        return beneficiaries;
    }

    function getActiveCount() public view returns (uint256) {
        uint256 count;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress != address(0)) {
                count++;
            }
        }
        return count;
    }

    /// ---------- HELPER METHODS ----------

    function isPayoutFullyDetermined() public view returns (bool) {
        uint256 sum = getDeterminedPayoutPercentage();
        return sum == MAX_PERCENTAGE;
    }

    function getDeterminedPayoutPercentage() public view returns (uint256) {
        uint256 sum;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress != address(0)) {
                sum += beneficiaries[i].amount;
            }
        }
        return sum;
    }

}