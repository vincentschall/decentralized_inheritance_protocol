// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceProtocol is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;

    enum State { ACTIVE, WARNING, VERIFICATION, DISTRIBUTION }

    struct Beneficiary {
        address payoutAddress;
        uint256 amount; // percentage value (0-100)
    }

    Beneficiary[10] private beneficiaries;

    uint256 private constant NOT_FOUND = type(uint256).max;
    uint256 private constant MAX_BENEFICIARIES = 10;
    uint256 private constant MAX_PERCENTAGE = 100;

    event BeneficiaryAdded(address indexed payoutAddress, uint256 amount, uint256 index);
    event BeneficiaryRemoved(address indexed payoutAddress, uint256 index);

    constructor(address _usdcAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "USDC address zero");
        usdc = IERC20(_usdcAddress);
    }

    function getBeneficiaries() public view returns (Beneficiary[10] memory) {
        return beneficiaries;
    }

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

    function getActiveCount() public view returns (uint256) {
        uint256 count;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (beneficiaries[i].payoutAddress != address(0)) {
                count++;
            }
        }
        return count;
    }

    function removeBeneficiary(address _address) public onlyOwner returns (bool) {
        // return type (bool):
        // true if deletion was successful
        // false otherwise
        uint256 index = findBeneficiaryIndex(_address);
        if (index == NOT_FOUND) {
            return false;
        }
        delete beneficiaries[index];
        emit BeneficiaryRemoved(_address, index);
        return true;
    }

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

    function addBeneficiary(address _address, uint256 amount) public onlyOwner returns (bool) {
        // return type (bool):
        // true if addition was successful
        // false otherwise
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