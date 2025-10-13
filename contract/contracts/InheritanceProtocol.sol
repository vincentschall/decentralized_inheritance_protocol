// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceProtocol is Ownable, ReentrancyGuard{

	IERC20 public immutable usdc;

	enum state { ACTIVE, WARNING, VERIFICATION, DISTRIBUTION }

	constructor(address _usdcAddress) Ownable(msg.sender) {
		
		require(_usdcAddress != address(0), "USDC address zero");
		usdc = IERC20(_usdcAddress);

	}


	


}

