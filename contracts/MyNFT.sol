pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SalesActivation.sol";

contract MyNFT is ERC721Enumerable, SalesActivation {

    uint256 public price = 0.01 ether;
    uint256 public maxSales = 10;
    uint256 public presaleListMax = 2;
    address public claimFundAddress;
    string public ntfURI;
    mapping(address => bool) public presaleList;
    mapping(address => uint256) public presaleListClaimed;

    event Presale(uint256 quantity, address indexed buyer);
    event Mint(uint256 quantity, address indexed buyer);


    constructor(
        string memory _nftURI,
        address _claimFundAddress,
        uint256 _preSalesStartTime,
        uint256 _preSalesEndTime,
        uint256 _publicSalesStartTime
    ) ERC721("MyERC721NFT", "NFT") SalesActivation(_preSalesStartTime, _preSalesEndTime, _publicSalesStartTime, _claimFundAddress) {
            ntfURI = _nftURI;
            claimFundAddress = _claimFundAddress;
    }

    function addToPresaleList(address[] calldata _addressList) external onlyOwner {
        for(uint256 i=0; i<_addressList.length; i++) {
            presaleList[_addressList[i]] = true;
        }
    }

    function removeFromPresaleList(address[] calldata _addressList) external onlyOwner {
        for(uint256 i=0; i<_addressList.length; i++) {
            presaleList[_addressList[i]] = false;
        }
    }

    function presaleMint(uint256 _number) external payable isPresalesActive {
        require(presaleList[msg.sender], "not in white list");
        require(presaleListClaimed[msg.sender] + _number <= presaleListMax, "exceed max");
        require(msg.value >= price * _number, "not enought eth");
        require(totalSupply() + _number <= maxSales, "exceeds total supply");
        require(tx.origin == msg.sender, "contrats are not allowed");

        for(uint256 i=0; i<_number; i++) {
           presaleListClaimed[msg.sender] += 1;
           _safeMint(msg.sender, totalSupply() + 1);
        }

        emit Presale(_number, msg.sender);
    }

    function mint(uint256 _number) external payable isPublicSalesActive {
        require(msg.value >= price * _number, "not enought eth");
        require(totalSupply() + _number <= maxSales, "exceeds total supply");
        require(tx.origin == msg.sender, "contrats are not allowed");
        require(_number > 0, "cannot mint 0 nft");
        require(_number <= 10, "not allowed to buy more than 10 nft at once");

        for(uint256 i=0; i<_number; i++) {
           presaleListClaimed[msg.sender] += 1;
           _safeMint(msg.sender, totalSupply() + 1);
        }

        emit Mint(_number, msg.sender);
    }

    function setPrice(uint256 _newPrice) external onlyOwner {
        price = _newPrice;
    }

    function setTotalSales(uint256 _total) external onlyOwner {
        maxSales = _total;
    }

    function setPresaleListMax(uint256 _presaleListMax) external onlyOwner {
        presaleListMax = _presaleListMax;
    }

    function setClaimFundAddress(address _claimFundAddress) external onlyOwner {
        claimFundAddress = _claimFundAddress;
    }

    function setBaseURI(string calldata _ntfURI) external onlyOwner {
        ntfURI = _ntfURI;
    }

    function _baseURI() internal view virtual override returns(string memory) {
        return ntfURI;
    }

}