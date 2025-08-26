import type { HardhatUserConfig } from "hardhat/config";
import "dotenv/config";

import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerify from '@nomicfoundation/hardhat-verify';


const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin,hardhatVerify],
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
    sei_atlantic_2: {
      type: "http",
      chainType: "l1",
      url: "https://evm-rpc-testnet.sei-apis.com",
      accounts: process.env.SEI_PRIVATE_KEY ? [process.env.SEI_PRIVATE_KEY] : [],
      chainId: 1328,
      gasPrice: 100000000000000,
    },
  },
 
  verify: {
    blockscout: {
      enabled: true
    }
  },
 
  chainDescriptors: {
    1328: {
      name: 'sei_atlantic_2',
      blockExplorers: {
        blockscout: {
          name: 'Seitrace',
          url: 'https://seitrace.com',
          apiUrl: 'https://seitrace.com/atlantic-2/api'
        }
      }
    }
  }
};

export default config;
