# Decentralized inheritance protocol

## Referenced Documents

* [CONTRIBUTING](CONTRIBUTING.md)
* [License](LICENSE.md)
* [Description](description.txt)

## Roadmap

not definitive and not in-order.  


### Core Contract Features
- **Beneficiary management logic**
    - [x] Implemented
    - [x] Tested
- **Transferring and withdrawing assets (use mock USDC)**
    - [ ] Implemented
    - [ ] Tested
- **State handling: check-ins (liveness proof with timer reset)**
    - [ ] Implemented
    - [ ] Tested
- **State handling: phase transitions (Active → Warning → Verification → Distribution)**
    - [ ] Implemented
    - [ ] Tested
- **Verification phase: mocking death certificates (trusted contacts with signature mocks via ecrecover)**
    - [ ] Implemented
    - [ ] Tested
- **Payout logic (trigger distribution with percentage-based shares)**
    - [ ] Implemented
    - [ ] Tested

### Yield and Vesting Integration
- **Yield generation (mock with simple accrual formula or Aave stub on testnet)**
    - [ ] Implemented
    - [ ] Tested
- **Vesting contract (time-locked claims for beneficiaries with unlock schedules)**
    - [ ] Implemented
    - [ ] Tested
- **Integration: hook yield/vesting into payouts (deploy per-beneficiary vesting on distribution)**
    - [ ] Implemented
    - [ ] Tested

### Factory and Multi-User Support
- **InheritanceFactory contract (deploy per-user Core instances with createInheritance)**
    - [ ] Implemented
    - [ ] Tested
- **User interaction views (getUserInheritance, getState, timeUntilNextCheckIn)**
    - [ ] Implemented
    - [ ] Tested

### Testing and Deployment
- **Unit tests (per function: e.g., addBeneficiary overflow, checkIn resets)**
    - [ ] Implemented
- **Integration tests (full flow: setup → check-in → simulate death → payout → claim vesting)**
    - [ ] Implemented
- **Edge case tests (false alarm challenge, partial percentages, max beneficiaries)**
    - [ ] Implemented
- **Gas optimization and static analysis (optimize loops, run Slither)**
    - [ ] Performed
- **Deployment to local Hardhat and Sepolia testnet (with mock USDC funding)**
    - [ ] Completed
- **E2E demo script (Hardhat task for end-to-end simulation)**
    - [ ] Implemented
- **Documentation (README with flows, ABI, and setup instructions)**
    - [ ] Updated

### Client / UX
- **Interaction with Factory Contract (Deployment of Inheritance contract, View functionality)**
  - [ ] Implemented
- **Interaction with Deployed InheritanceProtocol contract (Deposit, Withdraw, Yield / View account, Beneficiary Management, CheckIns, Death verification)**
  - [ ] Implemented

## Hardhat version

This project uses hardhat v3. See the [documentation](https://hardhat.org/docs/getting-started).

## Styleguide

Usage of [NatSpec](https://docs.soliditylang.org/en/latest/natspec-format.html) style comments is encouraged.