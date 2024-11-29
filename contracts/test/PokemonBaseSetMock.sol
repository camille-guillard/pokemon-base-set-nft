pragma solidity 0.8.28;

import "../PokemonBaseSet.sol";

contract PokemonBaseSetMock is PokemonBaseSet {

    constructor(
        string memory _nftURI,
        address _claimFundAddress,
        uint256 _preSalesStartTime,
        uint256 _preSalesEndTime,
        uint256 _publicSalesStartTime,
        bytes32 _rootHash,
        uint256 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    )
    PokemonBaseSet(
        _nftURI,
        _claimFundAddress,
        _preSalesStartTime,
        _preSalesEndTime,
        _publicSalesStartTime,
        _rootHash,
        _subscriptionId,
        _vrfCoordinator,
        _keyHash,
        _callbackGasLimit,
        _requestConfirmations)
    { }

    function drawCards() external {
        drawCards(msg.sender);
    }

    function getUserByRequestId(uint256 key) external view returns(address) {
        return s_users[key];
    }

    function currentRandomNumberIndex() external view returns(uint8) {
        return currentRandomNumberIndex(msg.sender);
    }

    function currentRandomNumber() external view returns(uint256) {
        return currentRandomNumber(msg.sender);
    }

    function randomNumberByIndex(uint8 _index) external view returns(uint256) {
        return userBoosters[msg.sender].s_results[_index];
    }

    function requestId() external view returns(uint256) {
        return userBoosters[msg.sender].requestId;
    }

    function setNumberOfUnopenedBoosters(uint8 _number) external {
        userBoosters[msg.sender].numberOfUnopenedBoosters = _number;
    }
    
    function getUserBoosters() external view returns(uint256[217] memory) {
        return userBoosters[msg.sender].s_results;
    }

    function getCardIds() external view returns(uint8[] memory) {
        uint8[] memory memoryArray = new uint8[](totalSupply());
        for(uint i = 0; i < totalSupply(); i++) {
            memoryArray[i] = cardIds[i];
        }
        return memoryArray;
    }

    function getCardRarityStats() external view returns(uint256 nbHoloCards, uint256 nbRareCards, uint256 nbUncommonCards, uint256 nbCommonCards, uint256 nbCommonEnergyCards) {
        for(uint8 i=0; i < totalSupply();) {
            if(HOLO_CARD_INDEX_START <= cardIds[i] && cardIds[i] <= HOLO_CARD_INDEX_END) {
                nbHoloCards++;
            }
            else if((RARE_CARD_INDEX_START_1 <= cardIds[i] && cardIds[i] <= RARE_CARD_INDEX_END_1)
                || (RARE_CARD_INDEX_START_2 <= cardIds[i] && cardIds[i] <= RARE_CARD_INDEX_END_2)) {
                nbRareCards++;
            }
            else if((UNCOMMON_CARD_INDEX_START_1 <= cardIds[i] && cardIds[i] <= UNCOMMON_CARD_INDEX_END_1)
                || (UNCOMMON_CARD_INDEX_START_2 <= cardIds[i] && cardIds[i] <= UNCOMMON_CARD_INDEX_END_2)
                || cardIds[i] == UNCOMMON_CARD_INDEX_3) {
                nbUncommonCards++;
            }
            else if((COMMON_CARD_INDEX_START_1 <= cardIds[i] && cardIds[i] <= COMMON_CARD_INDEX_END_1)
                || (COMMON_CARD_INDEX_START_2 <= cardIds[i] && cardIds[i] <= COMMON_CARD_INDEX_END_2)
                || cardIds[i] == COMMON_CARD_INDEX_3) {
                nbCommonCards++;
            } else if (COMMON_ENERGY_CARD_INDEX_START <= cardIds[i] && cardIds[i] <= COMMON_ENERGY_CARD_INDEX_END) {
                nbCommonEnergyCards++;
            }
            unchecked{ i++; }
        }
    }

}