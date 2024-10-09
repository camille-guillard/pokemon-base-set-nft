# **Base Web3 Project**

compile : npx hardhat compile
create a local node : npx hardhat node
test : npx hardhat test --network localhost
deploy : npx hardhat ignition deploy ./ignition/modules/PokemonBaseSetModule.js --network sepolia
verify : npx hardhat verify --network sepolia 0xCB34B351dE56113f5c9379741B12EFe6840c76DC "https://beige-effective-gerbil-958.mypinata.cloud/ipfs/QmPS91JPSF4qLxixrNFhAso4FjJciEaCe8Fefr5THd6miX/" "0x907D577AF8386402e248AD3736593627cAFD1085" "1727654400" "1728259199" "1728259200"