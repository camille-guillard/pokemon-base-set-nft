const { expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { time } = require('@nomicfoundation/hardhat-network-helpers');

let contract, owner, addr1, addr2, addr3, now;
  
beforeEach(async function() {
  [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const MyNFT = await ethers.getContractFactory("MyNFT");
  now = (await ethers.provider.getBlock('latest')).timestamp;
  contract = await MyNFT.connect(owner).deploy(
    "http://local",
    owner.address,
    now + time.duration.minutes(10),
    now + time.duration.minutes(20),
    now + time.duration.minutes(21)
  );
})

describe("My NFT - Initialization", function () {

    it("should init MyNft contract", async function () {
      expect(await contract.nftURI()).to.equal("http://local");
      expect(await contract.claimFundAddress()).to.equal(owner.address);
      expect(await contract.preSalesStartTime()).to.equal(now + time.duration.minutes(10));
      expect(await contract.preSalesEndTime()).to.equal(now + time.duration.minutes(20));
      expect(await contract.publicSalesStartTime()).to.equal(now + time.duration.minutes(21));
    });
  
});

describe("My NFT - Pre-Sales", function () {

  it("should failed when calling the presale function before the presale date", async function () {
    await expect(contract.connect(addr1).preSaleMint(1)).to.be.revertedWithCustomError(contract, "PreSalesNotStarted");
  });

  it("should failed when calling the presale function with an address not in the allow list", async function () {
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleMint(1)).to.be.revertedWithCustomError(contract, "AddressNotInTheWhiteList");
  });

  it("should failed when an user other than the owner try to add addresses in the allow list", async function () {
    await expect(contract.connect(addr1).addToPresaleList([addr1.address])).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("should failed when calling the presale function with an address removed from the allow list", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await contract.connect(owner).removeFromPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleMint(1)).to.be.revertedWithCustomError(contract, "AddressNotInTheWhiteList");
  });

  it("should failed when calling the presale function with the number of nft requested  than 2", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleMint(3)).to.be.revertedWithCustomError(contract, "ExceedsMaxTokens");
  });

  it("should failed when calling the presale function without enough eth", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleMint(2)).to.be.revertedWithCustomError(contract, "NotEnoughEthDeposited");
  });

  it("should mint 1 nft during", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    const tx = await contract.connect(addr1).preSaleMint(1, {value: ethers.parseUnits("0.01", "ether")});
    expect(tx).to.emit(contract, "PreSale").withArgs(1, addr1.address);
    expect(await contract.balanceOf(addr1.address)).to.equal(1);
    expect(await contract.preSalesListClaimed(addr1.address)).to.equal(1);
  });

  it("should mint 2 nft", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    const tx = await contract.connect(addr1).preSaleMint(2, {value: ethers.parseUnits("0.02", "ether")});
    expect(tx).to.emit(contract, "PreSale").withArgs(2, addr1.address);
    expect(await contract.balanceOf(addr1.address)).to.equal(2);
    expect(await contract.preSalesListClaimed(addr1.address)).to.equal(2);
  });

  it("should failed when calling the presale function requesting 2 nft with only the value for 1", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleMint(2, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "NotEnoughEthDeposited");
  });

  it("should mint 2 * 1 nft during the presale", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    await contract.connect(addr1).preSaleMint(1, {value: ethers.parseUnits("0.01", "ether")});
    await contract.connect(addr1).preSaleMint(1, {value: ethers.parseUnits("0.01", "ether")});
    expect(await contract.balanceOf(addr1.address)).to.equal(2);
  });

  it("should failed if an user try to mint 3 * 1 nft during the presale", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(11));
    await contract.connect(addr1).preSaleMint(1, {value: ethers.parseUnits("0.01", "ether")});
    await contract.connect(addr1).preSaleMint(1, {value: ethers.parseUnits("0.01", "ether")});
    await expect(contract.connect(addr1).preSaleMint(1, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "ExceedsMaxTokens");
    expect(await contract.balanceOf(addr1.address)).to.equal(2);
  });

});

describe("My NFT - Mint", function () {
  it("should failed when calling the mint function before the presale date", async function () {
    await time.increase(time.duration.minutes(20));
    await expect(contract.connect(addr1).mint(1)).to.be.revertedWithCustomError(contract, "PublicSalesNotStarted");
  });

  it("should failed when calling the mint function before the presale date", async function () {
    await time.increase(time.duration.minutes(20));
    await expect(contract.connect(addr1).mint(1)).to.be.revertedWithCustomError(contract, "PublicSalesNotStarted");
  });

  it("should failed when calling the presale function with the number of nft requested than 10", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(21));
    await expect(contract.connect(addr1).mint(11)).to.be.revertedWithCustomError(contract, "ExceedsMaxTokensAtOnce");
  });

  it("should failed when calling the presale function without enough eth", async function () {
    await contract.connect(owner).addToPresaleList([addr1.address]);
    await time.increase(time.duration.minutes(21));
    await expect(contract.connect(addr1).mint(2)).to.be.revertedWithCustomError(contract, "NotEnoughEthDeposited");
  });

  it("should failed when calling the presale function with an address removed from the allow list", async function () {
    await time.increase(time.duration.minutes(21));
    const tx = await contract.connect(addr1).mint(1, {value: ethers.parseUnits("0.01", "ether")});
    expect(tx).to.emit(contract, "PublicSale").withArgs(1, addr1.address);
    expect(await contract.balanceOf(addr1.address)).to.equal(1);
    expect(await contract.preSalesListClaimed(addr1.address)).to.equal(1);
  });

});

describe("My NFT - Withdraw", function () {

  it("Should failed because not owner", async function () {
    await expect(contract.connect(addr1).withdraw()).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("Should withdraw all funds in the contract", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address)
      
      await time.increase(time.duration.minutes(21));

      await contract.connect(addr1).mint(1, { value: ethers.parseUnits("0.01", "ether") })
      await contract.connect(addr2).mint(2, { value: ethers.parseUnits("0.02", "ether") })

      const tx = await contract.connect(owner).withdraw()
      const balanceAfter = await ethers.provider.getBalance(owner.address)

      expect(balanceAfter - balanceBefore).to.be.lt(ethers.parseUnits("0.03", "ether"))
      expect(ethers.parseUnits("0", "ether")).to.be.lt(balanceAfter - balanceBefore)
  });

});
