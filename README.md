# Decentralized inheritance protocol

## Quick Start

### Installation

```bash
# Install contract dependencies
cd contract && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### Running the Application

**Terminal 1** - Start local blockchain:
```bash
npx hardhat node
```
MetaMask Chain ID: `31337`

**Terminal 2** - Deploy contracts:
```bash
npm run deploy
```

**Terminal 3** - Run frontend:
```bash
cd client
npm run dev
```

App running on `http://localhost:3000`

### MetaMask Setup
- Add custom RPC: `http://localhost:8545`
- Chain ID: `31337`
- Import test account from Hardhat output

## Referenced Documents

* [CONTRIBUTING](CONTRIBUTING.md)
* [License](LICENSE.md)
* [Description](description.txt)
* [LatexREADME](docs/report/README.md)

## Scripts

* [LatexBuild](docs/report/build.sh)
* [Cleanup](cleanup.js)
* [HardhatStart](start.js)

## Roadmap

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
- **Yield generation**
    - [x] Implemented
    - [x] Tested

### Client / UX
- [x] **Basic setup: view functionality**
- [x] **Interaction with Deployed InheritanceProtocol contract (Deposit, Withdraw, Yield / View account, Beneficiary Management, CheckIns, Death verification)**

## Hardhat version

This project uses hardhat v3. See the [documentation](https://hardhat.org/docs/getting-started).

## Styleguide

Usage of [NatSpec](https://docs.soliditylang.org/en/latest/natspec-format.html) style comments is encouraged.