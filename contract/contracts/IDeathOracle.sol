// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDeathOracle {
    /// @notice Returns true if the oracle has verified the owner's death
    function isDeceased(address owner) external view returns (bool);

    /// @notice Returns a cryptographic proof or reference (optional)
    function getProof(address owner) external view returns (bytes memory);
}
