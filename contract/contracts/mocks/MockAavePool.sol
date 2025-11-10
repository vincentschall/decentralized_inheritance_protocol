// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Mock of aave pool. Follows this documentation:
 * https://aave.com/docs/developers/smart-contracts/pool
 * Only implements the functions that are needed for this project.
 */
contract MockAavePool {
    IERC20 public immutable usdc;
    mapping(address => uint256) public balances;

    constructor(address _usdcAddress) {
        usdc = IERC20(_usdcAddress);
    }

    function supply(address asset, uint256 amount, address onBehalfOf) external {
        require(asset == address(usdc), "Unsupported asset");
        require(amount > 0, "Non-positive amount");

        usdc.transferFrom(msg.sender, address(this), amount);

        balances[onBehalfOf] += amount;
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(asset == address(usdc), "Unsupported asset");

        uint256 userBalance = balances[msg.sender];
        require(userBalance >= amount, "Not enough balance");

        // fake interest (5%)
        uint256 yieldAmount = (amount * 105) / 100;
        balances[msg.sender] -= amount;

        usdc.transferFrom(address(this), to, yieldAmount);
        return yieldAmount;
    }
}