const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { networkConfig } = require("./helper-config");
const { network } = require("hardhat");
const { verifyContract } = require("../../utils/verifyContract");

module.exports = buildModule("MyNFTModule", (m) => {

  const chainId = network.config.chainId;

  const args = [
    networkConfig[chainId]["_nftURI"],
    networkConfig[chainId]["_claimFundAddress"],
    networkConfig[chainId]["_preSalesStartTime"],
    networkConfig[chainId]["_preSalesEndTime"],
    networkConfig[chainId]["_publicSalesStartTime"]
  ]

  const myNFTContract = m.contract("MyNFT", args);

  console.log("Contract deployed address : " + myNFTContract.address);

  if(!localChains.include(network.name) && process.env.ALCHEMY_API_KEY) {
    verifyContract(myNFTContract.address, args)
  }

  return { myNFTContract };
});
