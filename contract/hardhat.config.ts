import type { HardhatUserConfig } from "hardhat/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatIgnition from "@nomicfoundation/hardhat-ignition"; // Core Ignition (keep this)
import hardhatIgnitionEthers from "@nomicfoundation/hardhat-ignition-ethers"; // Add this for Ethers + Ignition

const config: HardhatUserConfig = {
    plugins: [
        hardhatToolboxMochaEthersPlugin,
        hardhatNetworkHelpers,
        hardhatIgnition,
        hardhatIgnitionEthers,
    ],
    solidity: {
        profiles: {
            default: {
                version: "0.8.28",
            },
            production: {
                version: "0.8.28",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        },
    },
    networks: {
        hardhatMainnet: {
            type: "edr-simulated",
            chainType: "l1",
        },
        hardhatOp: {
            type: "edr-simulated",
            chainType: "op",
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            type: "http",
        },
    },
};

export default config;