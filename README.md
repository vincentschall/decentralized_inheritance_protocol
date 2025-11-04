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
    - [x] Implemented
    - [x] Tested
- **State handling: check-ins (liveness proof with timer reset)**
    - [x] Implemented
    - [x] Tested
- **State handling: phase transitions (Active → Warning → Verification → Distribution)**
    - [x] Implemented
    - [x] Tested
- **Verification phase: mocking death certificates**
    - [x] Implemented
    - [x] Tested
- **Payout logic (trigger distribution with percentage-based shares)**
    - [x] Implemented
    - [x] Tested

### Yield and Vesting Integration
- **Yield generation**
    - [ ] Implemented
    - [ ] Tested
- **Vesting contract (time-locked claims for beneficiaries with unlock schedules)**
    - [ ] Implemented
    - [ ] Tested
- **Integration: hook yield/vesting into payouts (deploy per-beneficiary vesting on distribution)**
    - [ ] Implemented
    - [ ] Tested

### Client / UX
- [ ] **Basic setup: view functionality**
- [ ] **Interaction with Deployed InheritanceProtocol contract (Deposit, Withdraw, Yield / View account, Beneficiary Management, CheckIns, Death verification)**

## Hardhat version

This project uses hardhat v3. See the [documentation](https://hardhat.org/docs/getting-started).

## Styleguide

Usage of [NatSpec](https://docs.soliditylang.org/en/latest/natspec-format.html) style comments is encouraged.