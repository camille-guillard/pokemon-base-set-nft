pragma solidity 0.8.27;

import "../PokemonBaseSet.sol";

contract PokemonBaseSetTest is PokemonBaseSet {

    uint256 public s_requestId;

    constructor(
        string memory _nftURI,
        address _claimFundAddress,
        uint256 _preSalesStartTime,
        uint256 _preSalesEndTime,
        uint256 _publicSalesStartTime,
        bytes32 _rootHash,
        uint256 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash
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
        _keyHash)
    { }

    function randomWords() external view returns(uint256) {
        return s_results[msg.sender];
    }

    function rollDice() external {
        s_requestId = rollDice(msg.sender);
    }

    function getRollerByRequestId(uint256 key) external view returns (address) {
        return s_rollers[key];
    }

    function getResultByAddress(address key) external view returns (uint256) {
        return s_results[key];
    }

}