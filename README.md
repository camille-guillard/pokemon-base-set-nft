# **Base Web3 Project**

compile : npx hardhat compile
create a local node : npx hardhat node
test : npx hardhat test --network localhost
deploy : npx hardhat ignition deploy ./ignition/modules/PokemonBaseSetModule.js --network sepolia
verify : npx hardhat verify --network sepolia 0xCB34B351dE56113f5c9379741B12EFe6840c76DC "https://gold-acute-python-408.mypinata.cloud/ipfs/QmPS91JPSF4qLxixrNFhAso4FjJciEaCe8Fefr5THd6miX/" "0x907D577AF8386402e248AD3736593627cAFD1085" "1727654400" "1728259199" "1728259200" "0x12014c768bd10562acd224ac6fb749402c37722fab384a6aecc8f91aa7dc51cf" "113976695910214076856129855253409653665408242942060079584559527527298385366102" "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B" "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae"