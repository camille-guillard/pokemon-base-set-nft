pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./SalesActivation.sol";

contract MyNFT is ERC721Enumerable, SalesActivation {

    uint256 public price = 0.01 ether;
    uint256 public maxSales = 100;
    uint256 public preSalesListMax = 2;
    address public claimFundAddress;
    string public nftURI;
    mapping(address => bool) public preSalesList;
    mapping(address => uint256) public preSalesListClaimed;

    //uint256 public maxCardId = 102;
    uint256 public maxCardId = 2;
    mapping(uint256 tokenId => uint256) private cardIds;

    event PreSale(uint256 quantity, address indexed buyer);
    event Mint(uint256 quantity, address indexed buyer);
    event Withdraw(uint256 balance, address indexed owner);

    error AddressNotInTheWhiteList();
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
    ) ERC721("MyERC721NFT", "NFT") SalesActivation(_preSalesStartTime, _preSalesEndTime, _publicSalesStartTime, _claimFundAddress) {
            nftURI = _nftURI;
            claimFundAddress = _claimFundAddress;
    }

    function addToPresaleList(address[] calldata _addressList) external onlyOwner {
        for(uint256 i=0; i<_addressList.length; i++) {
            preSalesList[_addressList[i]] = true;
        }
    }

    function removeFromPresaleList(address[] calldata _addressList) external onlyOwner {
        for(uint256 i=0; i<_addressList.length; i++) {
            preSalesList[_addressList[i]] = false;
        }
    }

    function preSaleMint(uint256 _number) external payable isPreSalesActive {
        require(preSalesList[msg.sender], AddressNotInTheWhiteList());
        require(preSalesListClaimed[msg.sender] + _number <= preSalesListMax, ExceedsMaxTokens());
        require(msg.value >= price * _number, NotEnoughEthDeposited());
        require(totalSupply() + _number <= maxSales, ExceedsTotalSupply());
        require(_number > 0, CannotMint0Nft());
        require(tx.origin == msg.sender, ContratsNotAllowed());

        for(uint256 i=0; i<_number; i++) {
           preSalesListClaimed[msg.sender] += 1;
           _safeMint(msg.sender, totalSupply() + 1);
            cardIds[totalSupply() + 1] = random();
        }

        emit PreSale(_number, msg.sender);
    }

    function mint(uint256 _number) external payable isPublicSalesActive {
        require(_number > 0, CannotMint0Nft());
        require(_number <= 10, ExceedsMaxTokensAtOnce());
        require(msg.value >= price * _number, NotEnoughEthDeposited());
        require(totalSupply() + _number <= maxSales, ExceedsTotalSupply());
        require(tx.origin == msg.sender, ContratsNotAllowed());

        for(uint256 i=0; i<_number; i++) {
           preSalesListClaimed[msg.sender] += 1;
           _safeMint(msg.sender, totalSupply() + 1);
           cardIds[totalSupply() + 1] = random();
        }

        emit Mint(_number, msg.sender);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(payable(claimFundAddress).send(balance));
        emit Withdraw(balance, claimFundAddress);
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
    }

    function setTotalSales(uint256 _total) external onlyOwner {
        maxSales = _total;
    }

    function setPresaleListMax(uint256 _preSalesListMax) external onlyOwner {
        preSalesListMax = _preSalesListMax;
    }

    function setClaimFundAddress(address _claimFundAddress) external onlyOwner {
        claimFundAddress = _claimFundAddress;
    }

    function setBaseURI(string calldata _nftURI) external onlyOwner {
        nftURI = _nftURI;
    }

    function _baseURI() internal view virtual override returns(string memory) {
        return nftURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        require(cardIds[tokenId] >= 0);
        return bytes(nftURI).length > 0 ? string.concat(nftURI, Strings.toString(cardIds[tokenId])) : "";
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % maxCardId;
    }

}