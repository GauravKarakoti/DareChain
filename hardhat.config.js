require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type {import('hardhat/config').HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    world: {
      url: process.env.WORLD || "https://worldchain-mainnet.g.alchemy.com/public",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    world_testnet: {
      url: process.env.WORLD_TESTNET || "https://worldchain-sepolia.g.alchemy.com/public",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    filecoin: {
      url: "https://rpc.ankr.com/filecoin_testnet",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 314159,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};