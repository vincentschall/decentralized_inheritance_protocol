// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IDeathOracle} from "./IDeathOracle.sol";

contract InheritanceProtocol is Ownable, ReentrancyGuard {

    IERC20 public immutable usdc;
    IDeathOracle public immutable deathOracle;
    address private notaryAddress;

    /**
     * Stores address and payout percentage amount (0-100) of a beneficiary.
     */
    struct Beneficiary {
        address payoutAddress;
        uint256 amount;
    }

    Beneficiary[10] private _beneficiaries;

    uint256 private _balance;
    State private _currentState;

    uint256 private _lastCheckIn;
    bool private _called = false;

    uint256 private constant NOT_FOUND = type(uint256).max;
    uint256 private constant MAX_BENEFICIARIES = 10;
    uint256 private constant MAX_PERCENTAGE = 100;
    uint256 private constant CHECK_IN_PERIOD = 90 * 1 days;
    uint256 private constant GRACE_PERIOD = 30 * 1 days;

    event BeneficiaryAdded(address indexed payoutAddress, uint256 amount, uint256 index);
    event BeneficiaryRemoved(address indexed payoutAddress, uint256 index);
    event Deposited(uint256 amount);
    event Withdrawn(uint256 amount);
    event CheckedIn(uint256 timestamp);
    event StateChanged(uint256 timestamp, State from, State to);
    event PayoutMade(uint256 amount, address payoutAddress);
    event TestEvent(string s);
    event TestEventNum(uint s);

    /**
     * Initializes a new InheritanceProtocol.
     * @param _usdcAddress address of the currency used (non-zero).
     */
    constructor(address _usdcAddress, address _deathOracleAddress, address _notaryAddress) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "USDC address zero");
        require(_deathOracleAddress != address(0), "Death Oracle address zero");
        usdc = IERC20(_usdcAddress);
        deathOracle = IDeathOracle(_deathOracleAddress);
        notaryAddress = _notaryAddress;
        _currentState = State.ACTIVE;
        _lastCheckIn = block.timestamp;
    }

    /// ---------- MODIFIERS ----------

    /**
     * This modifier requires the function call to be made before distribution.
     */
    modifier onlyPreDistribution() {
        require(_currentState < State.DISTRIBUTION, "Cannot modify funds post-distribution");
        _;
    }

    /**
     * This modifier requires the function call to be made in the ACTIVE or WARNING phase
     */
    modifier onlyActiveWarning() {
        require(_currentState < State.VERIFICATION, "Cannot make administrative changes without Owner check-In");
        _;
    }

    /**
     * This modifier requires the function call to be made in the DISTRIBUTION phase
     */
    modifier onlyDistribution() {
        require(_currentState == State.DISTRIBUTION, "Can only make payouts in distribution phase");
        _;
    }

    /**
     * This modifier requires the function call to be made by the notary
     */
    modifier onlyNotary() {
        require(msg.sender == notaryAddress, "Only notary can call this function");
        _;
    }

    /// ---------- STATE MACHINE & CHECK-INS ----------

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
     * Updates the State in the State-Machine
     * Should always be possible and accessible by anyone
     * @return currentState after execution
     */
    function updateState() public returns (State) {
        uint256 elapsed = uint256(block.timestamp) - _lastCheckIn;
        State oldState = _currentState;

        // --- Phase transitions in logical order ---

        // If in ACTIVE and check-in expired → WARNING
        if (_currentState == State.ACTIVE && elapsed > CHECK_IN_PERIOD) {
            _currentState = State.WARNING;
        }

        // If in WARNING and grace period expired → VERIFICATION
        if (_currentState == State.WARNING && elapsed > CHECK_IN_PERIOD + GRACE_PERIOD) {
            _currentState = State.VERIFICATION;
        }

        // If in VERIFICATION and death confirmed → DISTRIBUTION
        if (_currentState == State.VERIFICATION && deathOracle.isDeceased(owner())) {
            _currentState = State.DISTRIBUTION;
        }

        emit StateChanged(block.timestamp, oldState, _currentState);

        // Trigger payout if we reached DISTRIBUTION
        if (_currentState == State.DISTRIBUTION) {
            distributePayout();
        }

        return _currentState;
    }


    /**
     * Changes the state of the contract to a given state.
     * @param to the state to change to.
     */
    function changeState (State to) public {
        require(to != _currentState, "Already in requested state");
        emit StateChanged(block.timestamp, _currentState, to);
        _currentState = to;
    }

    /**
     * The owner checks in to verify that he's alive.
     * Should be possible in active and warning state.
     */
    function checkIn() public onlyOwner {
        require(_currentState == State.ACTIVE || _currentState == State.WARNING, "Need to be in active or warning state");
        emit CheckedIn(block.timestamp);
        _lastCheckIn = block.timestamp;
    }

    /// ---------- BENEFICIARY HANDLING ----------


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
            if (_beneficiaries[i].payoutAddress == _address) {
                return i;
            }
        }
        return NOT_FOUND;
    }

    /**
     * Removes a beneficiary with a given address.
     * Only the owner can perform this action.
     * @param _address the address to remove.
     * Fails if the provided address is zero OR not in the list of beneficiaries.
     * @return true if the deletion was successful, false otherwise.
     */
    function removeBeneficiary(address _address) public onlyOwner onlyActiveWarning returns (bool) {
        checkIn();
        uint256 index = findBeneficiaryIndex(_address);
        if (index == NOT_FOUND) {
            return false;
        }
        delete _beneficiaries[index];
        emit BeneficiaryRemoved(_address, index);
        return true;
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
    function addBeneficiary(address _address, uint256 _amount) public onlyOwner onlyActiveWarning returns (bool) {
        checkIn();
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
            if (_beneficiaries[i].payoutAddress == address(0)) {
                emptyIndex = i;
                break;
            }
        }

        if (emptyIndex == NOT_FOUND) {
            return false; // Max beneficiaries reached
        }

        _beneficiaries[emptyIndex] = Beneficiary({ payoutAddress: _address, amount: _amount });
        emit BeneficiaryAdded(_address, _amount, emptyIndex);
        return true;
    }



    /// ---------- BALANCE HANDLING ----------

    /**
     * Deposits a given amount of USDC.
     * @param _amount the amount to deposit.
     */
    function deposit(uint256 _amount) external onlyOwner nonReentrant onlyPreDistribution {
        checkIn();
        require(_amount > 0, "Amount has to be greater than zero.");

        usdc.transferFrom(msg.sender, address(this), _amount);
        _balance += _amount;

        //TODO add yield generating here -> Aave or something similar
        emit Deposited(_amount);

    }

    /**
     * Withdraws a given amount of USDC.
     * @param _amount the amount to withdraw.
     */
    function withdraw(uint256 _amount) external onlyOwner nonReentrant onlyPreDistribution {
        checkIn();
        require(_amount > 0, "Amount has to be greater than zero.");
        require(_balance >= _amount, "Insufficient balance");

        _balance -= _amount;

        usdc.transfer(msg.sender, _amount);
        emit Withdrawn(_amount);
    }

    /// ---------- DEATH CERTIFICATION ----------

    /**
     * Upload the death verification to the chain
     * Only callable by the notary
     */
    function uploadDeathVerification(bool _deceased, bytes calldata _proof) external onlyNotary{
        deathOracle.setDeathStatus(owner(), _deceased, _proof);
    }

    /**
     * Checks if the owner died by calling death certificate oracle.
     * @return true if the owner died, else otherwise.
     */
    function checkIfOwnerDied() public view returns (bool) {
        return deathOracle.isDeceased(owner());
    }

    /// ---------- DISTRIBUTION METHODS ----------

    /**
     * Distributes the payout based on definitions given by owner.
     * Is only called in the updateState() Function, after death verification
     */
    function distributePayout() public {
        require(!_called, "Payout can only be called once.");
        _called = true;
        uint256 count = getActiveCount();
        Beneficiary[] memory activeBeneficiaries = getActiveBeneficiaries();
        uint256 originalBalance = _balance;
        for (uint256 i=0; i<count; i++) {
            Beneficiary memory beneficiary = activeBeneficiaries[i];
            uint256 amount = beneficiary.amount;
            address payoutAddress = beneficiary.payoutAddress;

            uint actualAmount = (originalBalance * amount) / MAX_PERCENTAGE;

            // decision made: change balance value (should be 0 at the end)
            // pros: good for checking / testing
            // cons: just setting it to 0 would be less error-prone
            _balance -= actualAmount;

            usdc.transfer( payoutAddress, actualAmount);
            emit PayoutMade(actualAmount, payoutAddress);
        }
    }

    /// ---------- VIEW METHODS ----------

    /**
     * Checks if the currently defined payout is fully determined, meaning
     * 100% of the balance is being spent.
     * @return true if the full balance will be spent, false otherwise.
     */
    function isPayoutFullyDetermined() public view returns (bool) {
        uint256 sum = getDeterminedPayoutPercentage();
        return sum == MAX_PERCENTAGE;
    }

    /**
     * Calculates the percentage amount of currently determined payout.
     * @return a number between 0 and 100, equivalent to the combined relative payout.
     */
    function getDeterminedPayoutPercentage() public view returns (uint256) {
        uint256 sum;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (_beneficiaries[i].payoutAddress != address(0)) {
                sum += _beneficiaries[i].amount;
            }
        }
        return sum;
    }

    /**
     * Gets the current balance.
     * @return the balance of the combined deposited funds.
     */
    function getBalance() public view returns (uint256) {
        return _balance; // If using Aave this might not work anymore
    }

    /**
     * Getter for the beneficiaries list.
     * @return the list of 10 beneficiaries (might contain empty slots).
     */
    function getBeneficiaries() public view returns (Beneficiary[10] memory) {
        return _beneficiaries;
    }

    /**
     * Counts the number of active beneficiaries.
     * @return the number of active beneficiaries.
     */
    function getActiveCount() public view returns (uint256) {
        uint256 count;
        for (uint256 i = 0; i < MAX_BENEFICIARIES; i++) {
            if (_beneficiaries[i].payoutAddress != address(0)) {
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
            if (_beneficiaries[i].payoutAddress != address(0)) {
                active[count] = _beneficiaries[i];
                count++;
            }
        }
        return active;
    }

    /**
     * Gets the current state of the contract.
     * @return the current state.
     */
    function getState() public view returns (State) {
        return _currentState;
    }

    /**
     * Gets the last check-in time.
     * @return the last check-in time.
     */
    function getLastCheckIn() public view returns (uint256) {
        return _lastCheckIn;
    }

}
