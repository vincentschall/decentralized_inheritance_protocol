# Inheritance Protocol Client

## Installation

```bash
cd client
npm install
mkdir public
```

## Running the Application

### Development Mode

```bash
npm run dev
```

App running on `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start
```

## Setup Instructions

1. **Start the blockchain** (in the contract directory):
   ```bash
   npm install
   npx hardhat node
   ```

2. **Deploy contracts** (in a new terminal):
   ```bash
   cd contract
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Copy deployment info** (from contract to client):
   ```bash
   cp contract/deployment-info.json client/public/
   ```

4. **Run the frontend** (in another terminal):
   ```bash
   cd client
   npm install
   npm run dev
   ```

5. **Configure MetaMask**:
   - Add a custom RPC network pointing to `http://localhost:8545`
   - Chain ID: `31337`
   - Import one of the test accounts from Hardhat

