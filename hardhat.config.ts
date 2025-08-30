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
      gasPrice: 150000000000, // 150 gwei - increased for faster processing
      gas: 8000000, // 8M gas limit - sufficient for contract deployment
      gasMultiplier: 1.5, // Automatically increase gas by 50%
      timeout: 60000 // 60 second timeout
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
