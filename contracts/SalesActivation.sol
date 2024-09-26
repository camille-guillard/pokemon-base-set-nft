pragma solidity 0.8.27;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SalesActivation is Ownable {

    uint256 public preSalesStartTime;
    uint256 public preSalesEndTime;
    uint256 public publicSalesStartTime;

    constructor(
        uint256 _preSalesStartTime,
        uint256 _preSalesEndTime,
        uint256 _publicSalesStartTime,
        address _ownerAddress
    ) Ownable(_ownerAddress) {
            preSalesStartTime = _preSalesStartTime;
            preSalesEndTime = _preSalesEndTime;
            publicSalesStartTime = _publicSalesStartTime;
    }

    modifier isPresalesActive() {
        require(isPresalesActivated(), "presales not started");
        _;
    }

    modifier isPublicSalesActive() {
        require(isPublicSalesActivated(), "public sales not started");
        _;
    }

    function isPresalesActivated() public view returns(bool) {
        return preSalesStartTime > 0 && preSalesEndTime > 0 && block.timestamp >= preSalesStartTime  && block.timestamp <= preSalesEndTime;
    }

    function isPublicSalesActivated() public view returns(bool) {
        return publicSalesStartTime > 0 && block.timestamp >= publicSalesStartTime;
    }

    function setPublicSalesTime(uint256 _publicSalesStartTime) external onlyOwner {
        publicSalesStartTime = _publicSalesStartTime;
    }

    function setPresaleTime(uint256 _preSalesStartTime, uint256 _preSalesEndTime) external onlyOwner {
        require(preSalesStartTime < preSalesEndTime, "endtime should be later than starttime");
        preSalesStartTime = _preSalesStartTime;
        preSalesEndTime = _preSalesEndTime;
    }
}