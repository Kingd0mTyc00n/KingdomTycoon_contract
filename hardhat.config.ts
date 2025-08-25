import type { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin],
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

    seitestnet: {
      type: "http",
      chainType: "l1",
      url: "https://evm-rpc-testnet.sei-apis.com",
      accounts: process.env.SEI_PRIVATE_KEY ? [process.env.SEI_PRIVATE_KEY] : [],
      chainId: 1328,
    },
    seimainnet: {
      type: "http",
      chainType: "l1",
      url: "https://evm-rpc.sei-apis.com",
      accounts: process.env.SEI_PRIVATE_KEY ? [process.env.SEI_PRIVATE_KEY] : [],
      chainId: 1329,
    },
  },
};

export default config;
