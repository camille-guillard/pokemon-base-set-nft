pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SalesActivation.sol";

contract PokemonBaseSet is ERC721Enumerable, SalesActivation {

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
    mapping(address => uint256) public numberOfUserBoostersInstock;
    uint8 public maxNumberOfUserBoostersInstock = 216;

    // Collection statistics
    uint8 public maxCardId = 102;
    uint8 public cardPerBooster = 11;
    uint8 public boosterPerDisplay = 36;
    mapping(uint256 => uint8) private cardIds;

    // Number of card per rarity
    uint8[] private holoCardIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    uint8[] private rareCardIndex = [16, 17, 18, 19, 20, 21, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78];
    uint8[] private uncommonCardIndex = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 95];
    uint8[] private commonCardIndex = [42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 90, 91, 92, 93, 94, 96];
    uint8[] private commonEnergyCardIndex = [97, 98, 99, 100, 101];

    uint256 private random = 0;

    event PreSaleMintBooster(uint8 quantity, address indexed buyer);
    event BuyBooster(uint8 quantity, address indexed buyer);
    event BuyDisplay(uint8 quantity, address indexed buyer);
    event MintBooster(address indexed buyer);
    event MintCard(uint8 cardIndex, address indexed buyer);
    event Withdraw(uint256 balance, address indexed owner);

    error AddressNotInTheWhiteList();
    error NotEnoughBoosterInStock();
    error ExceedsMaxBoostersPerUser();
    error ExceedsMaxTokens();
    error NotEnoughEthDeposited();
    error ExceedsTotalSupply();
    error ContratsNotAllowed();
    error CannotMint0Nft();
    error ExceedsMaxTokensAtOnce();

    constructor(
        string memory _nftURI,
        address _claimFundAddress,
        uint256 _preSalesStartTime,
        uint256 _preSalesEndTime,
        uint256 _publicSalesStartTime
    ) ERC721("PokemonBaseSet", "PKMN-BS") SalesActivation(_preSalesStartTime, _preSalesEndTime, _publicSalesStartTime, _claimFundAddress) {
            nftURI = _nftURI;
            claimFundAddress = _claimFundAddress;
    }

    function addToPresaleList(address[] calldata _addressList) external onlyOwner {
        uint256 length = _addressList.length;
        for(uint8 i=0; i<length;) {
            preSalesList[_addressList[i]] = true;
            unchecked{ i++; }
        }
    }

    function removeFromPresaleList(address[] calldata _addressList) external onlyOwner {
        uint256 length = _addressList.length;
        for(uint8 i=0; i<length;) {
            preSalesList[_addressList[i]] = false;
            unchecked{ i++; }
        }
    }

    function preSaleMintBooster(uint8 _number) external payable isPreSalesActive {
        require(preSalesList[msg.sender], AddressNotInTheWhiteList());
        require(preSalesListClaimed[msg.sender] + _number <= preSalesListMax, ExceedsMaxTokens());
        require(msg.value >= boosterPrice * _number, NotEnoughEthDeposited());
        require(_number > 0, CannotMint0Nft());
        require(tx.origin == msg.sender, ContratsNotAllowed());

        preSalesListClaimed[msg.sender] += _number;
        numberOfUserBoostersInstock[msg.sender] = numberOfUserBoostersInstock[msg.sender] + _number;

        emit PreSaleMintBooster(_number, msg.sender);
    }

    function buyBooster(uint8 _number) external payable isPublicSalesActive {
        require(_number > 0, CannotMint0Nft());
        require(_number <= maxBoosterAtOnce, ExceedsMaxTokensAtOnce());
        require(msg.value >= boosterPrice * _number, NotEnoughEthDeposited());
        require(totalSupply() + (_number) <= maxBoosterSales, ExceedsTotalSupply());
        require(numberOfUserBoostersInstock[msg.sender] + _number <= maxNumberOfUserBoostersInstock, ExceedsMaxBoostersPerUser());
        require(tx.origin == msg.sender, ContratsNotAllowed());

        numberOfUserBoostersInstock[msg.sender] = numberOfUserBoostersInstock[msg.sender] + _number;

        emit BuyBooster(_number, msg.sender);
    }

    function buyDisplay(uint8 _number) external payable isPublicSalesActive {
        require(_number > 0, CannotMint0Nft());
        require(_number <= maxDisplayAtOnce, ExceedsMaxTokensAtOnce());
        require(msg.value >= displayPrice * _number, NotEnoughEthDeposited());
        require(totalSupply() + (_number * cardPerBooster) <= maxBoosterSales, ExceedsTotalSupply());
        require(numberOfUserBoostersInstock[msg.sender] + _number <= maxNumberOfUserBoostersInstock, ExceedsMaxBoostersPerUser());
        require(tx.origin == msg.sender, ContratsNotAllowed());

        numberOfUserBoostersInstock[msg.sender] = numberOfUserBoostersInstock[msg.sender] + (_number * boosterPerDisplay);

        emit BuyDisplay(_number, msg.sender);
    }

    function mintBooster() external {
        require(numberOfUserBoostersInstock[msg.sender] > 0, NotEnoughBoosterInStock());
        
        numberOfUserBoostersInstock[msg.sender] = numberOfUserBoostersInstock[msg.sender] -1;

        // 2 common energy cards
        for(uint8 i=0; i < 2;) {
            mintCard(getRandomCardIt(commonEnergyCardIndex));
            unchecked{ i++; }
        }

        // 5 common cards
        for(uint8 i=0; i < 5;) {
            mintCard(getRandomCardIt(commonCardIndex));
            unchecked{ i++; }
        }
        
        // 3 uncommon cards
        for(uint8 i=0; i < 3;) {
            mintCard(getRandomCardIt(uncommonCardIndex));
            unchecked{ i++; }
        }

        // 1/3 chance : 1 holo card, 2/3 chance : 1 rare card
        if((uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, totalSupply(), random++))) % 3) == 0) {
            mintCard(getRandomCardIt(holoCardIndex));
        } else {
            mintCard(getRandomCardIt(rareCardIndex));
        }

        emit MintBooster(msg.sender);
    }

    function mintCard(uint8 _cardIndex) private {
        uint256 newTokenId = totalSupply() + 1;
        _safeMint(msg.sender, newTokenId);
        cardIds[newTokenId] = _cardIndex;
        emit MintCard(_cardIndex, msg.sender);
    }

    function getRandomCardIt(uint8[] storage _cardIndexTable) private returns (uint8) {
        return _cardIndexTable[uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, totalSupply(), random++))) % _cardIndexTable.length];
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(payable(claimFundAddress).send(balance));
        emit Withdraw(balance, claimFundAddress);
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

    function _baseURI() internal view virtual override returns(string memory) {
        return nftURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        require(cardIds[tokenId] >= 0);
        return bytes(nftURI).length > 0 ? string.concat(nftURI, Strings.toString(cardIds[tokenId])) : "";
    }   

}