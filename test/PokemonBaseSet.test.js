const { assert, expect } = require("chai");
const { ethers, deployments } = require("hardhat");
const { time, loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const  { whiteList } = require("./whiteList.json");

let contract, contractAddress, owner, addr1, addr2, addr3, now, VRFCoordinatorV2_5Mock;
  
beforeEach(async function() {
  [owner, addr1, addr2, addr3] = await ethers.getSigners();
  const pokemonBaseSet = await ethers.getContractFactory("PokemonBaseSetTest");
  now = (await ethers.provider.getBlock('latest')).timestamp;

  const BASE_FEE = "1000000000000000" // 0.001 ether as base fee
  const GAS_PRICE = "50000000000" // 50 gwei 
  const WEI_PER_UNIT_LINK = "10000000000000000" // 0.01 ether per LINK

  const VRFCoordinatorV2_5MockFactory = await ethers.getContractFactory("VRFCoordinatorV2_5Mock")
  VRFCoordinatorV2_5Mock = await VRFCoordinatorV2_5MockFactory.deploy(BASE_FEE, GAS_PRICE, WEI_PER_UNIT_LINK);
  await VRFCoordinatorV2_5Mock.waitForDeployment();
  
  const fundAmount = "1000000000000000000"
  const transaction = await VRFCoordinatorV2_5Mock.createSubscription()
  const transactionReceipt = await transaction.wait(1)
  const subscriptionId = transactionReceipt.logs[0].args[0]
  await VRFCoordinatorV2_5Mock.fundSubscription(subscriptionId, fundAmount);

  const vrfCoordinatorAddress = await VRFCoordinatorV2_5Mock.getAddress();
  const keyHash = "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc";

  contract = await pokemonBaseSet.connect(owner).deploy(
    "http://local",
    owner.address,
    now + time.duration.minutes(10),
    now + time.duration.minutes(20),
    now + time.duration.minutes(21),
    "0x12014c768bd10562acd224ac6fb749402c37722fab384a6aecc8f91aa7dc51cf",
    subscriptionId,
    vrfCoordinatorAddress,
    keyHash
  );

  await contract.waitForDeployment();
  contractAddress = await contract.getAddress();

  await VRFCoordinatorV2_5Mock.addConsumer(subscriptionId, contractAddress);

});


describe("Pokémon Base Set - Initialization", function () {

    it("should init pokemonBaseSet contract", async function () {
      expect(await contract.nftURI()).to.equal("http://local");
      expect(await contract.claimFundAddress()).to.equal(owner.address);
      expect(await contract.preSalesStartTime()).to.equal(now + time.duration.minutes(10));
      expect(await contract.preSalesEndTime()).to.equal(now + time.duration.minutes(20));
      expect(await contract.publicSalesStartTime()).to.equal(now + time.duration.minutes(21));
    });
  
});


describe("Pokémon Base Set - Pre-sales", function () {

  it("should failed when an unlisted address try to buy a booster during the preasale", async function () {
    const addr2FakeProof = [
      "0xe9707d0e6171f728f7473c24cc0432a9b07eaaf1efed6a137a4a8c12c79552d9",
      "0x1ebaa930b8e9130423c183bf38b0564b0103180b7dad301013b18e59880541ae",
    ];
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr2).preSaleBuyBooster(addr2FakeProof, 1, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWith("Not WhiteListed Address");
  });

  it("should failed when a listed address try to buy a booster before the presale date during the presale", async function () {
    await expect(contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1)).to.be.revertedWithCustomError(contract, "PreSalesNotStarted");
  });

  it("should failed when a listed address try to buy more than 2 boosters during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 3)).to.be.revertedWithCustomError(contract, "ExceedsMaxTokens");
  });

  it("should failed when a listed address try to buy a booster without enough eth during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 2)).to.be.revertedWithCustomError(contract, "NotEnoughEthDeposited");
  });

  it("should mint 11 nft when a listed address try to buy and mint a booster during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    const tx = await contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1, {value: ethers.parseUnits("0.01", "ether")});
    await expect(tx).to.emit(contract, "PreSaleBuyBooster").withArgs(1, addr1.address);

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(1);
    await contract.connect(addr1).mintBooster();
    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);

    expect(await contract.balanceOf(addr1.address)).to.equal(11);
    expect(await contract.preSalesListClaimed(addr1.address)).to.equal(1);
  });

  it("should mint 11 nft when a listed address try to buy and mint 2 boosters during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    const tx = await contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 2, {value: ethers.parseUnits("0.02", "ether")});
    await expect(tx).to.emit(contract, "PreSaleBuyBooster").withArgs(2, addr1.address);

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(2);

    for(var i=0; i<2; i++) {
      await contract.connect(addr1).mintBooster();
    }

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);

    expect(await contract.balanceOf(addr1.address)).to.equal(22);
    expect(await contract.preSalesListClaimed(addr1.address)).to.equal(2);
  });

  it("should failed when a listed address try to buy 2 boosters with only the value for 1 during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    await expect(contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 2, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "NotEnoughEthDeposited");
  });

  it("should mint 22 nft when a listed address try to buy and mint a booster two times during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    await contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1, {value: ethers.parseUnits("0.01", "ether")});
    await contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1, {value: ethers.parseUnits("0.01", "ether")});

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(2);

    for(var i=0; i<2; i++) {
      await contract.connect(addr1).mintBooster();
    }

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
    expect(await contract.balanceOf(addr1.address)).to.equal(22);
  });

  it("should failed when a listed address try to buy 1 booster three times with only the value for 1 during the presale", async function () {
    await time.increase(time.duration.minutes(11));
    await contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1, {value: ethers.parseUnits("0.01", "ether")});
    await contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1, {value: ethers.parseUnits("0.01", "ether")});
    await expect(contract.connect(addr1).preSaleBuyBooster(whiteList[1].proof, 1, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "ExceedsMaxTokens");
    
    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(2);

    for(var i=0; i<2; i++) {
      await contract.connect(addr1).mintBooster();
    }

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
    
    expect(await contract.balanceOf(addr1.address)).to.equal(22);
  });

});


describe("Pokémon Base Set - Buy booster", function () {
  it("should failed when calling the mint function before the presale date", async function () {
    await time.increase(time.duration.minutes(20));
    await expect(contract.connect(addr1).buyBooster(1, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "PublicSalesNotStarted");
  });


  it("should failed when buying booster with the number of nft requested than 10", async function () {
    await time.increase(time.duration.minutes(21));
    await expect(contract.connect(addr1).buyBooster(36, {value: ethers.parseUnits("0.36", "ether")})).to.be.revertedWithCustomError(contract, "ExceedsMaxTokensAtOnce");
  });

  it("should failed when buying booster without enough eth", async function () {
    await time.increase(time.duration.minutes(21));
    await expect(contract.connect(addr1).buyBooster(2, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "NotEnoughEthDeposited");
  });

  it("should buy 1 booster", async function () {
    await time.increase(time.duration.minutes(21));
    await contract.connect(addr1).buyBooster(1, {value: ethers.parseUnits("0.01", "ether")});

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(1);
  });

  it("should buy 35 boosters", async function () {
    await time.increase(time.duration.minutes(21));
    await contract.connect(addr1).buyBooster(35, {value: ethers.parseUnits("0.35", "ether")});

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(35);
  });

  it("should failed when an user try to buy more than 35 boosters at once", async function () {
    await time.increase(time.duration.minutes(21));
    await expect(contract.connect(addr1).buyBooster(36, {value: ethers.parseUnits("0.36", "ether")})).to.be.revertedWithCustomError(contract, "ExceedsMaxTokensAtOnce");

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
  });

  it("should failed when an user try to buy more than 216 boosters", async function () {
    await time.increase(time.duration.minutes(21));

    for(var i=0; i < 216; i++) {
      await contract.connect(addr1).buyBooster(1, {value: ethers.parseUnits("0.01", "ether")})
    }

    await expect(contract.connect(addr1).buyBooster(1, {value: ethers.parseUnits("0.01", "ether")})).to.be.revertedWithCustomError(contract, "ExceedsMaxBoostersPerUser");

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(216);
  });

});


describe("Pokémon Base Set - Buy display", function () {

  it("should buy 36 boosters (1 display)", async function () {
    await time.increase(time.duration.minutes(21));

    const tx = await contract.connect(addr1).buyDisplay(1, {value: ethers.parseUnits("0.3", "ether")})
    await expect(tx).to.emit(contract, "BuyDisplay").withArgs(1, addr1.address);

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(36);
  });

  it("should buy 216 boosters (6 displays)", async function () {
    await time.increase(time.duration.minutes(21));

    const tx = await contract.connect(addr1).buyDisplay(6, {value: ethers.parseUnits("1.8", "ether")})
    await expect(tx).to.emit(contract, "BuyDisplay").withArgs(6, addr1.address);

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(216);
  });

  it("should failed when an user try to buy more than 6 displays at once", async function () {
    await time.increase(time.duration.minutes(21));
    await expect(contract.connect(addr1).buyDisplay(7, {value: ethers.parseUnits("2.1", "ether")})).to.be.revertedWithCustomError(contract, "ExceedsMaxTokensAtOnce");

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
  });

});


describe("Pokémon Base Set - Mint", function () {
  it("should mint 11 nft when a address try to buy and mint a booster", async function () {
    await time.increase(time.duration.minutes(21));
    await contract.connect(addr1).buyBooster(1, {value: ethers.parseUnits("0.01", "ether")});

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(1);

    const tx = await contract.connect(addr1).mintBooster();
    await expect(tx).to.emit(contract, "MintBooster").withArgs(addr1.address);

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
    expect(await contract.balanceOf(addr1.address)).to.equal(11);
  });

  it("should mint 396 nft when a address try to buy and mint a display", async function () {
    await time.increase(time.duration.minutes(21));

    const tx = await contract.connect(addr1).buyDisplay(1, {value: ethers.parseUnits("0.3", "ether")})
    await expect(tx).to.emit(contract, "BuyDisplay").withArgs(1, addr1.address);

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(36);

    for(var i=0; i<36; i++) {
      await contract.connect(addr1).mintBooster();
    }

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);

    expect(await contract.balanceOf(addr1.address)).to.equal(396);
  });

  it("should mint 110 nft when a address try to buy and mint a booster", async function () {
    await time.increase(time.duration.minutes(21));

    for(var i=0; i < 10; i++) {
      await contract.connect(addr1).buyBooster(1, {value: ethers.parseUnits("0.01", "ether")});
      expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(1);
      await contract.connect(addr1).mintBooster();
    }

    expect(await contract.balanceOf(addr1.address)).to.equal(110);
    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
  });

  it("should failed when a address try to mint a booster without buying one", async function () {
    await time.increase(time.duration.minutes(21));

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);

    await expect(contract.connect(addr1).mintBooster()).to.be.revertedWithCustomError(contract, "NotEnoughBoosterInStock");

    expect(await contract.connect(addr1).numberOfUserBoostersInstock(addr1.address)).to.equal(0);
  });

});

describe("Pokémon Base Set - Withdraw", function () {

  it("Should when a non-owner address try to withdraw", async function () {
    await expect(contract.connect(addr1).withdraw()).to.be.revertedWith("Only callable by owner");
  });

  it("Should withdraw all funds when the owner address try to withdraw", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address)
      
      await time.increase(time.duration.minutes(21));

      await contract.connect(addr1).buyBooster(1, { value: ethers.parseUnits("0.01", "ether") })
      await contract.connect(addr2).buyBooster(2, { value: ethers.parseUnits("0.02", "ether") })
      await contract.connect(addr2).buyDisplay(3, { value: ethers.parseUnits("0.9", "ether") })

      const tx = await contract.connect(owner).withdraw()
      const balanceAfter = await ethers.provider.getBalance(owner.address)

      expect(balanceAfter - balanceBefore).to.be.lt(ethers.parseUnits("0.93", "ether"))
      expect(ethers.parseUnits("0", "ether")).to.be.lt(balanceAfter - balanceBefore)
  });

});


describe("Pokémon Base Set - Setters", function () {

  it("Should setting the boosterPrice by the owner", async function () {
    expect(await contract.connect(owner).boosterPrice()).to.equal(ethers.parseUnits("0.01", "ether"));
    await contract.connect(owner).setBoosterPrice("1000000000000000000");
    expect(await contract.connect(owner).boosterPrice()).to.equal(ethers.parseUnits("1", "ether"));
  });

  it("Should failed to set boosterPrice because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setBoosterPrice(0)).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the displayPrice by the owner", async function () {
    expect(await contract.connect(owner).displayPrice()).to.equal(ethers.parseUnits("0.3", "ether"));
    await contract.connect(owner).setDisplayPrice("1000000000000000000");
    expect(await contract.connect(owner).displayPrice()).to.equal(ethers.parseUnits("1", "ether"));
  });

  it("Should failed to set displayPrice because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setDisplayPrice(0)).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the maxBoosterSales by the owner", async function () {
    expect(await contract.connect(owner).maxBoosterSales()).to.equal(3600000);
    await contract.connect(owner).setMaxBoosterSales(7200000);
    expect(await contract.connect(owner).maxBoosterSales()).to.equal(7200000);
  });

  it("Should failed to set maxBoosterSales because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setMaxBoosterSales(3)).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the presaleListMax by the owner", async function () {
    expect(await contract.connect(owner).preSalesListMax()).to.equal(2);
    await contract.connect(owner).setPreSalesListMax(3);
    expect(await contract.connect(owner).preSalesListMax()).to.equal(3);
  });

  it("Should failed to set presaleListMax because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setPreSalesListMax(3)).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the claimFundAddress by the owner", async function () {
    expect(await contract.connect(owner).claimFundAddress()).to.equal(owner.address);
    await contract.connect(owner).setClaimFundAddress(addr1.address);
    expect(await contract.connect(owner).claimFundAddress()).to.equal(addr1.address);
  });

  it("Should failed to set claimFundAddress because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setClaimFundAddress(addr1.address)).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the baseURI by the owner", async function () {
    expect(await contract.connect(owner).nftURI()).to.equal("http://local");
    await contract.connect(owner).setBaseURI("http://other-uri");
    expect(await contract.connect(owner).nftURI()).to.equal("http://other-uri");
  });

  it("Should failed to set baseURI because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setBaseURI("http://other-uri")).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the maxBoosterAtOnce by the owner", async function () {
    expect(await contract.connect(owner).maxBoosterAtOnce()).to.equal(35);
    await contract.connect(owner).setMaxBoosterAtOnce(100);
    expect(await contract.connect(owner).maxBoosterAtOnce()).to.equal(100);
  });

  it("Should failed to set maxBoosterAtOnce because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setMaxBoosterAtOnce(100)).to.be.revertedWith("Only callable by owner");
  });

  it("Should setting the maxDisplayAtOnce by the owner", async function () {
    expect(await contract.connect(owner).maxDisplayAtOnce()).to.equal(6);
    await contract.connect(owner).setMaxDisplayAtOnce(100);
    expect(await contract.connect(owner).maxDisplayAtOnce()).to.equal(100);
  });

  it("Should failed to set maxDisplayAtOnce because the user is not the owner", async function () {
    await expect(contract.connect(addr1).setMaxDisplayAtOnce(100)).to.be.revertedWith("Only callable by owner");
  });

});


describe("Random Number Consumer Unit Tests", async function () {
  it("Should successfully request a random number", async function () {
    await expect(contract.connect(addr1).rollDice()).to.emit(
        VRFCoordinatorV2_5Mock,
        "RandomWordsRequested"
    )
  })

  it("Should successfully request a random number and get a result", async function () {
    const tx = await contract.connect(addr1).rollDice();
    const requestId = await contract.connect(addr1).s_requestId()

    await expect(tx).to.emit(contract, "DiceRolled").withArgs(requestId, addr1.address);


    expect(await contract.connect(addr1).randomWords()).to.equals(42);

    const tx2 = VRFCoordinatorV2_5Mock.fulfillRandomWords(requestId, contractAddress);
    
    await time.increase(time.duration.minutes(1));

    const randomNumber = await contract.connect(addr1).randomWords();

    await expect(tx2).to.emit(contract, "DiceLanded").withArgs(requestId, randomNumber);

    expect(randomNumber).to.be.lessThan(42)

  })

})