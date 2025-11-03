// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IDeathOracle.sol";

/**
 * Mocking a death certificate oracle.
 * usage in tests:
 * mockOracle.setDeathStatus(owner, true, "0xabcdabcd") // proof has to be any valid hex code
 * usage in contract:
 * address _oracle;
 * oracle = IDeathOracle(_oracle);
 * require(oracle.isDeceased(owner), "Owner not deceased");
 */
contract MockDeathOracle is IDeathOracle {
    struct DeathRecord {
        bool deceased;
        bytes proof; // could be signature, hash etc.
    }

    mapping(address => DeathRecord) private records;

    event DeathRecorded(address indexed owner, bytes proof);

    /**
     * @notice Simulate the oracle confirming a death
     */
    function setDeathStatus(address owner, bool _deceased, bytes calldata _proof) external {
        records[owner] = DeathRecord({ deceased: _deceased, proof: _proof });
        emit DeathRecorded(owner, _proof);
    }

    function isDeceased(address owner) external view override returns (bool) {
        return records[owner].deceased;
    }

    function getProof(address owner) external view override returns (bytes memory) {
        return records[owner].proof;
    }
}
