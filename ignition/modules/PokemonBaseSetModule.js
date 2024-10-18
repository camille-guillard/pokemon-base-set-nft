const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { networkConfig } = require("./helper-config");
const { network } = require("hardhat");
const { verifyContract } = require("../../utils/verifyContract");

module.exports = buildModule("PokemonBaseSetModule", (m) => {

  const chainId = network.config.chainId;

  console.log("chainID : " + chainId);

  const args = [
    networkConfig[chainId]["_nftURI"],
    networkConfig[chainId]["_claimFundAddress"],
    networkConfig[chainId]["_preSalesStartTime"],
    networkConfig[chainId]["_preSalesEndTime"],
    networkConfig[chainId]["_publicSalesStartTime"],
    networkConfig[chainId]["_merkleTreeRootHash"],
    networkConfig[chainId]["_subscriptionId"],
    networkConfig[chainId]["_vrfCoordinator"],
    networkConfig[chainId]["_keyHash"],
    networkConfig[chainId]["_callbackGasLimit"],
    networkConfig[chainId]["_requestConfirmations"]
  ]
  

  const pokemonBaseSetContract = m.contract("PokemonBaseSet", args, { id: "artemis" });

  return { pokemonBaseSetContract };
});
