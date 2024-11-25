pragma solidity 0.8.28;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract PokemonBaseSet is ERC721A, VRFConsumerBaseV2Plus {

    // VRF2.5 params
    uint256 public s_subscriptionId;
    bytes32 public s_keyHash;
    uint32 public s_callbackGasLimit;
    uint16 public s_requestConfirmations;
    mapping(uint256 => address) internal s_users;

    // Pokemon Base Set Params
    uint256 public boosterPrice = 0.01 ether;
    uint256 public displayPrice = 0.3 ether;
    uint256 public maxBoosterSales = 3600000;
    uint8 public preSalesListMax = 2;
    uint8 public maxBoosterAtOnce = 35;
    uint8 public maxDisplayAtOnce = 6;
    address public claimFundAddress;
    string public nftURI;
    mapping(address => bool) public preSalesList;
    mapping(address => uint256) public preSalesListClaimed;
    mapping(address => UserBoosters) internal userBoosters;
    uint8 public maxNumberOfUnopenedBoosters = 216;

    struct UserBoosters {
        uint8 numberOfUnopenedBoosters;
        uint256 requestId;
        bool roolInProgress;
        uint8 currentRandomNumberIndex;
        uint256[217] s_results;
    }

    // Presale
    uint256 public preSalesStartTime;
    uint256 public preSalesEndTime;
    uint256 public publicSalesStartTime;
    bytes32 public merkleTreeRootHash;

    // Collection statistics
    uint8 public maxCardId = 102;
    uint8 public cardPerBooster = 11;
    uint8 public boosterPerDisplay = 36;
    mapping(uint256 => uint8) internal cardIds;

    // Number of card per rarity
    uint8[] private holoCardIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    uint8[] private rareCardIndex = [16, 17, 18, 19, 20, 21, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78];
    uint8[] private uncommonCardIndex = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 95];
    uint8[] private commonCardIndex = [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 90, 91, 92, 93, 94, 96];
    uint8[] private commonEnergyCardIndex = [97, 98, 99, 100, 101];

    // Card number by rarity
    uint8 internal constant HOLO_CARD_NUMBER = 16;
    uint8 internal constant RARE_CARD_NUMBER = 16;
    uint8 internal constant UNCOMMON_CARD_NUMBER = 32;
    uint8 internal constant COMMON_CARD_NUMBER = 33;
    uint8 internal constant COMMON_ENERGY_CARD_NUMBER = 5;
    uint8 internal constant HOLO_CARD_INDEX_START = 0;
    uint8 internal constant HOLO_CARD_INDEX_END = 15;

    // Card ranges
    uint8 internal constant RARE_CARD_INDEX_START_1 = 16;
    uint8 internal constant RARE_CARD_INDEX_END_1 = 21;
    uint8 internal constant RARE_CARD_INDEX_START_2 = 69;
    uint8 internal constant RARE_CARD_INDEX_END_2 = 78;
    uint8 internal constant UNCOMMON_CARD_INDEX_START_1 = 22;
    uint8 internal constant UNCOMMON_CARD_INDEX_END_1 = 41;
    uint8 internal constant UNCOMMON_CARD_INDEX_START_2 = 79;
    uint8 internal constant UNCOMMON_CARD_INDEX_END_2 = 89;
    uint8 internal constant UNCOMMON_CARD_INDEX_3 = 95;
    uint8 internal constant COMMON_CARD_INDEX_START_1 = 42;
    uint8 internal constant COMMON_CARD_INDEX_END_1 = 68;
    uint8 internal constant COMMON_CARD_INDEX_START_2 = 90;
    uint8 internal constant COMMON_CARD_INDEX_END_2 = 94;
    uint8 internal constant COMMON_CARD_INDEX_3 = 96;
    uint8 internal constant COMMON_ENERGY_CARD_INDEX_START = 97;
    uint8 internal constant COMMON_ENERGY_CARD_INDEX_END = 101;


    // Events
    event PreSaleBuyBooster(uint8 quantity, address indexed buyer);
    event BuyBooster(uint8 quantity, address indexed buyer);
    event BuyDisplay(uint8 quantity, address indexed buyer);
    event OpenBooster(address indexed buyer);
    event MintCard(uint8 cardIndex, address indexed buyer);
    event Withdraw(uint256 balance, address indexed owner);
    event DrawStarted(uint256 indexed requestId, address indexed user);
    event DrawCompleted(uint256 indexed requestId);

    // Errors
    error PreSalesNotStarted();
    error PublicSalesNotStarted();
    error StartTimeLaterThanEndTime();
    error NotWhiteListedAddress();
    error NotEnoughBoosterInStock();
    error ExceedsMaxBoostersPerUser();
    error ExceedsMaxTokens();
    error NotEnoughEthDeposited();
    error ExceedsTotalSupply();
    error CannotMint0Nft();
    error ExceedsMaxTokensAtOnce();
    error DrawInProgress();
    error DrawNotStarted();

    constructor(
        string memory _nftURI,
        address _claimFundAddress,
        uint256 _preSalesStartTime,
        uint256 _preSalesEndTime,
        uint256 _publicSalesStartTime,
        bytes32 _merkleTreeRootHash,
        uint256 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations
    )
    ERC721A("PokemonBaseSet", "PKMN-BS")
    VRFConsumerBaseV2Plus(_vrfCoordinator)
    {
        nftURI = _nftURI;
        claimFundAddress = _claimFundAddress;
        preSalesStartTime = _preSalesStartTime;
        preSalesEndTime = _preSalesEndTime;
        publicSalesStartTime = _publicSalesStartTime;
        merkleTreeRootHash = _merkleTreeRootHash;
        s_subscriptionId = _subscriptionId;
        s_keyHash = _keyHash;
        s_callbackGasLimit = _callbackGasLimit;
        s_requestConfirmations = _requestConfirmations;
    }

    function verifyProof(
        bytes32[] calldata proof,
        bytes32 leaf
    ) private view returns (bool) {
        return MerkleProof.verify(proof, merkleTreeRootHash, leaf);
    }

    modifier isWhitelistedAddress(bytes32[] calldata proof) {
        require(verifyProof(proof, keccak256(abi.encodePacked(msg.sender))), NotWhiteListedAddress());
        _;
    }

    function preSaleBuyBooster(bytes32[] calldata proof, uint8 _number) external payable isPreSalesActive isWhitelistedAddress(proof) {
        require(preSalesListClaimed[msg.sender] + _number <= preSalesListMax, ExceedsMaxTokens());
        require(msg.value >= boosterPrice * _number, NotEnoughEthDeposited());
        require(_number > 0, CannotMint0Nft());

        preSalesListClaimed[msg.sender] += _number;
        userBoosters[msg.sender].numberOfUnopenedBoosters = numberOfUnopenedBoosters(msg.sender) + _number;

        drawCards(msg.sender);

        emit PreSaleBuyBooster(_number, msg.sender);
    }

    function buyBooster(uint8 _number) external payable isPublicSalesActive {
        require(_number > 0, CannotMint0Nft());
        require(_number <= maxBoosterAtOnce, ExceedsMaxTokensAtOnce());
        require(msg.value >= boosterPrice * _number, NotEnoughEthDeposited());
        require(totalSupply() + (_number) <= maxBoosterSales, ExceedsTotalSupply());
        require(numberOfUnopenedBoosters(msg.sender) + _number <= maxNumberOfUnopenedBoosters, ExceedsMaxBoostersPerUser());

        userBoosters[msg.sender].numberOfUnopenedBoosters = numberOfUnopenedBoosters(msg.sender) + _number;

        drawCards(msg.sender);

        emit BuyBooster(_number, msg.sender);
    }

    function buyDisplay(uint8 _number) external payable isPublicSalesActive {
        require(_number > 0, CannotMint0Nft());
        require(_number <= maxDisplayAtOnce, ExceedsMaxTokensAtOnce());
        require(msg.value >= displayPrice * _number, NotEnoughEthDeposited());
        require(totalSupply() + (_number * cardPerBooster) <= maxBoosterSales, ExceedsTotalSupply());
        require(numberOfUnopenedBoosters(msg.sender) + (_number * boosterPerDisplay) <= maxNumberOfUnopenedBoosters, ExceedsMaxBoostersPerUser());

        userBoosters[msg.sender].numberOfUnopenedBoosters = numberOfUnopenedBoosters(msg.sender) + (_number * boosterPerDisplay);

        drawCards(msg.sender);

        emit BuyDisplay(_number, msg.sender);
    }

    function openBooster() external {
        require(numberOfUnopenedBoosters(msg.sender) > 0, NotEnoughBoosterInStock());
        require(!roolInProgress(msg.sender), DrawInProgress());
        require(currentRandomNumberIndex(msg.sender) == numberOfUnopenedBoosters(msg.sender), DrawInProgress());
        
        userBoosters[msg.sender].numberOfUnopenedBoosters = numberOfUnopenedBoosters(msg.sender) -1;

        uint256 seed = currentRandomNumber(msg.sender);
        uint256 newTokenId = totalSupply() + 1;

        // 2 common energy cards
        registerCard(newTokenId++, getRandomCardIt(commonEnergyCardIndex, seed>>8));
        registerCard(newTokenId++, getRandomCardIt(commonEnergyCardIndex, seed>>16));

        // 5 common cards
        registerCard(newTokenId++, getRandomCardIt(commonCardIndex, seed>>24));
        registerCard(newTokenId++, getRandomCardIt(commonCardIndex, seed>>32));
        registerCard(newTokenId++, getRandomCardIt(commonCardIndex, seed>>40));
        registerCard(newTokenId++, getRandomCardIt(commonCardIndex, seed>>48));
        registerCard(newTokenId++, getRandomCardIt(commonCardIndex, seed>>56));
        
        // 3 uncommon cards
        registerCard(newTokenId++, getRandomCardIt(uncommonCardIndex, seed>>64));
        registerCard(newTokenId++, getRandomCardIt(uncommonCardIndex, seed>>72));
        registerCard(newTokenId++, getRandomCardIt(uncommonCardIndex, seed>>80));

        // 1/3 chance : 1 holo card, 2/3 chance : 1 rare card
        if((seed % 3) == 0) {
            registerCard(newTokenId, getRandomCardIt(holoCardIndex, seed>>88));
        } else {
            registerCard(newTokenId, getRandomCardIt(rareCardIndex, seed>>88));
        }

        _mint(msg.sender, 11);
        userBoosters[msg.sender].s_results[currentRandomNumberIndex(msg.sender)] = 0;
        userBoosters[msg.sender].currentRandomNumberIndex -= 1;

        emit OpenBooster(msg.sender);
    }

    function getRandomCardIt(uint8[] storage _cardIndexTable, uint256 _seed) private view returns (uint8) {
        return _cardIndexTable[uint(keccak256(abi.encodePacked(_seed))) % _cardIndexTable.length];
    }

    function registerCard(uint256 newTokenId, uint8 _cardIndex) private {
        cardIds[newTokenId] = _cardIndex;
        emit MintCard(_cardIndex, msg.sender);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(payable(claimFundAddress).send(balance));
        emit Withdraw(balance, claimFundAddress);
    }

    function drawCards(
        address user
    ) internal {
        uint256 requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: s_keyHash,
                subId: s_subscriptionId,
                requestConfirmations: s_requestConfirmations,
                callbackGasLimit: s_callbackGasLimit,
                numWords: numberOfUnopenedBoosters(user) - currentRandomNumberIndex(user),
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            })
        );

        s_users[requestId] = user;
        userBoosters[msg.sender].requestId = requestId;
        userBoosters[msg.sender].roolInProgress = true;
        emit DrawStarted(requestId, user);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        address user = s_users[requestId];

        uint8 i = 0;
        while(currentRandomNumberIndex(user) < numberOfUnopenedBoosters(user)) {
            userBoosters[user].currentRandomNumberIndex++;
            userBoosters[user].s_results[currentRandomNumberIndex(user)] = randomWords[i++];
        }

        userBoosters[user].roolInProgress = false;

        emit DrawCompleted(requestId);
    }

    function currentRandomNumberIndex(address addr) internal view returns(uint8) {
        return userBoosters[addr].currentRandomNumberIndex;
    }

    function currentRandomNumber(address addr) internal view returns(uint256) {
        require(currentRandomNumberIndex(addr) > 0, DrawNotStarted());
        return userBoosters[addr].s_results[currentRandomNumberIndex(addr)-1];
    }

    function numberOfUnopenedBoosters(address addr) internal view returns(uint8) {
        return userBoosters[addr].numberOfUnopenedBoosters;
    }

    function numberOfUnopenedBoosters() public view returns(uint8) {
        return numberOfUnopenedBoosters(msg.sender);
    }

    function roolInProgress(address addr) internal view returns(bool) {
        return userBoosters[addr].roolInProgress;
    }

    function roolInProgress() public view returns(bool) {
        return roolInProgress(msg.sender);
    }

    function _baseURI() internal view virtual override returns(string memory) {
        return nftURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) _revert(URIQueryForNonexistentToken.selector);
        require(cardIds[tokenId] >= 0);
        return bytes(nftURI).length > 0 ? string.concat(nftURI, Strings.toString(cardIds[tokenId])) : "";
    }

    modifier isPreSalesActive() {
        require(isPreSalesActivated(), PreSalesNotStarted());
        _;
    }

    modifier isPublicSalesActive() {
        require(isPublicSalesActivated(), PublicSalesNotStarted());
        _;
    }

    function isPreSalesActivated() public view returns(bool) {
        return preSalesStartTime > 0 && preSalesEndTime > 0 && block.timestamp >= preSalesStartTime  && block.timestamp <= preSalesEndTime;
    }

    function isPublicSalesActivated() public view returns(bool) {
        return publicSalesStartTime > 0 && block.timestamp >= publicSalesStartTime;
    }

    function setBoosterPrice(uint256 _boosterPrice) external onlyOwner {
        boosterPrice = _boosterPrice;
    }

    function setDisplayPrice(uint256 _displayPrice) external onlyOwner {
        displayPrice = _displayPrice;
    }

    function setMaxBoosterSales(uint256 _maxBoosterSales) external onlyOwner {
        maxBoosterSales = _maxBoosterSales;
    }

    function setPreSalesListMax(uint8 _preSalesListMax) external onlyOwner {
        preSalesListMax = _preSalesListMax;
    }

    function setClaimFundAddress(address _claimFundAddress) external onlyOwner {
        claimFundAddress = _claimFundAddress;
    }

    function setBaseURI(string calldata _nftURI) external onlyOwner {
        nftURI = _nftURI;
    }

    function setMaxBoosterAtOnce(uint8 _maxBoosterAtOnce) external onlyOwner {
        maxBoosterAtOnce = _maxBoosterAtOnce;
    }

    function setMaxDisplayAtOnce(uint8 _maxDisplayAtOnce) external onlyOwner {
        maxDisplayAtOnce = _maxDisplayAtOnce;
    }

    function setPublicSalesTime(uint256 _publicSalesStartTime) external onlyOwner {
        publicSalesStartTime = _publicSalesStartTime;
    }

    function setPresaleTime(uint256 _preSalesStartTime, uint256 _preSalesEndTime) external onlyOwner {
        require(preSalesStartTime < preSalesEndTime, StartTimeLaterThanEndTime());
        preSalesStartTime = _preSalesStartTime;
        preSalesEndTime = _preSalesEndTime;
    }

    function setMerkleTreeRootHash(bytes32 _merkleTreeRootHash) external onlyOwner {
        merkleTreeRootHash = _merkleTreeRootHash;
    }

    function setSubscriptionId(uint256 _subscriptionId) external onlyOwner {
        s_subscriptionId = _subscriptionId;
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        s_keyHash = _keyHash;
    }

    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        s_callbackGasLimit = _callbackGasLimit;
    }

    function setRequestConfirmations(uint16 _requestConfirmations) external onlyOwner {
        s_requestConfirmations = _requestConfirmations;
    }

}