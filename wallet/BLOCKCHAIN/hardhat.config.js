require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {},

    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.DID_ADMIN_PRIVATE_KEY
           ?[process.env.DID_ADMIN_PRIVATE_KEY]
           :[],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  gasReporter: {
    enabled: true,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    gasPrice: 20,
    showTimeSpent: true,
    noColors: false,
  },
};