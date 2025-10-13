// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract InheritanceProtocol is Ownable, ReentrancyGuard{

	IERC20 public immutable usdc;

	enum state { ACTIVE, WARNING, VERIFICATION, DISTRIBUTION }

	struct Beneficiary {
		address payoutAddress;
		uint amount; // percentage value (0-100)
	}

	Beneficiary[10] beneficiaries;

	constructor(address _usdcAddress) Ownable(msg.sender) {
		require(_usdcAddress != address(0), "USDC address zero");
		usdc = IERC20(_usdcAddress);
	}

	function getBeneficiaries() public view returns (Beneficiary[10] memory) {
		return beneficiaries;
	}

	function isPayoutFullyDetermined() public view returns (bool) {
		uint256 sum;
		for (uint i=0; i<10; i++) {
			if (beneficiaries[i].payoutAddress != address(0)) {
				sum += beneficiaries[i].amount;
			}
		}
		return sum == 100;
	}


}

