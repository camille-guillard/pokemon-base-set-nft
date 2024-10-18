require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1;
const ETHERSCAN_SEPOLIA_API_KEY = process.env.ETHERSCAN_SEPOLIA_API_KEY;
const POLYGONSCAN_AMOY_API_KEY = process.env.POLYGONSCAN_AMOY_API_KEY;

module.exports = {
    defaultNetwork: "amoy",
    networks: {
      hardhat: {
        chainId: 31337
      },
      sepolia: {
        chainId: 11155111,
        url: "https://eth-sepolia.g.alchemy.com/v2/" + ALCHEMY_API_KEY,
        accounts: [PRIVATE_KEY_1]
      },
      amoy: {
        chainId: 80002,
        url: "https://polygon-amoy.g.alchemy.com/v2/" + ALCHEMY_API_KEY,
        accounts: [PRIVATE_KEY_1]
      }
    },
    solidity: {
      version: "0.8.28",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },
    mocha: {
      timeout: 40000
    },
    etherscan: {
      apiKey: {
        sepolia: ETHERSCAN_SEPOLIA_API_KEY,
        polygonAmoy: POLYGONSCAN_AMOY_API_KEY
      }
    },
    sourcify: {
      enabled: true
    }    
  }