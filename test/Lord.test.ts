import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Lord ERC1155 Contract", function () {
  let lord: any;
  let owner: any;
  let user1: any;
  let user2: any;

  const TOKEN_ID_1 = 1;
  const TOKEN_ID_2 = 2;
  const MINT_AMOUNT = 100;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Lord contract
    lord = await ethers.deployContract("Lord", [owner.address]);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await lord.owner()).to.equal(owner.address);
    });

    it("Should support ERC1155 interface", async function () {
      // ERC1155 interface ID
      expect(await lord.supportsInterface("0xd9b67a26")).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should mint a single NFT to user", async function () {
      const data = "0x";
      
      // Mint token to user1
      await expect(lord.connect(owner).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, data))
        .to.emit(lord, "TransferSingle")
        .withArgs(owner.address, "0x0000000000000000000000000000000000000000", user1.address, TOKEN_ID_1, MINT_AMOUNT);

      // Check balance
      expect(await lord.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT);
    });

    it("Should mint multiple different tokens to user", async function () {
      const data = "0x";
      
      // Mint token 1
      await lord.connect(owner).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, data);
      
      // Mint token 2
      await lord.connect(owner).mint(user1.address, TOKEN_ID_2, MINT_AMOUNT * 2, data);

      // Check balances
      expect(await lord.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT);
      expect(await lord.balanceOf(user1.address, TOKEN_ID_2)).to.equal(MINT_AMOUNT * 2);
    });

    it("Should mint batch tokens to user", async function () {
      const tokenIds = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT, MINT_AMOUNT * 2];
      const data = "0x";

      await expect(lord.connect(owner).mintBatch(user1.address, tokenIds, amounts, data))
        .to.emit(lord, "TransferBatch")
        .withArgs(owner.address, "0x0000000000000000000000000000000000000000", user1.address, tokenIds, amounts);

      // Check balances
      expect(await lord.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT);
      expect(await lord.balanceOf(user1.address, TOKEN_ID_2)).to.equal(MINT_AMOUNT * 2);
    });

    it("Should update total supply after minting", async function () {
      const data = "0x";
      
      // Check initial supply
      expect(await lord.totalSupply(TOKEN_ID_1)).to.equal(0);
      
      // Mint tokens
      await lord.connect(owner).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, data);
      
      // Check updated supply
      expect(await lord.totalSupply(TOKEN_ID_1)).to.equal(MINT_AMOUNT);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const data = "0x";
      
      await expect(
        lord.connect(user1).mint(user2.address, TOKEN_ID_1, MINT_AMOUNT, data)
      ).to.be.revertedWithCustomError(lord, "OwnableUnauthorizedAccount");
    });

    it("Should fail batch mint if arrays length mismatch", async function () {
      const tokenIds = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [MINT_AMOUNT]; // Wrong length
      const data = "0x";

      await expect(
        lord.connect(owner).mintBatch(user1.address, tokenIds, amounts, data)
      ).to.be.revertedWithCustomError(lord, "ERC1155InvalidArrayLength");
    });
  });

  describe("Transfers", function () {
    beforeEach(async function () {
      // Mint some tokens to user1 for transfer tests
      const data = "0x";
      await lord.connect(owner).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, data);
    });

    it("Should transfer tokens between users", async function () {
      const transferAmount = 50;
      const data = "0x";

      await expect(
        lord.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, transferAmount, data)
      ).to.emit(lord, "TransferSingle")
        .withArgs(user1.address, user1.address, user2.address, TOKEN_ID_1, transferAmount);

      // Check balances after transfer
      expect(await lord.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT - transferAmount);
      expect(await lord.balanceOf(user2.address, TOKEN_ID_1)).to.equal(transferAmount);
    });

    it("Should batch transfer tokens", async function () {
      // Mint additional token type
      const data = "0x";
      await lord.connect(owner).mint(user1.address, TOKEN_ID_2, MINT_AMOUNT * 2, data);

      const tokenIds = [TOKEN_ID_1, TOKEN_ID_2];
      const amounts = [25, 50];

      await expect(
        lord.connect(user1).safeBatchTransferFrom(user1.address, user2.address, tokenIds, amounts, data)
      ).to.emit(lord, "TransferBatch")
        .withArgs(user1.address, user1.address, user2.address, tokenIds, amounts);

      // Check balances
      expect(await lord.balanceOf(user2.address, TOKEN_ID_1)).to.equal(25);
      expect(await lord.balanceOf(user2.address, TOKEN_ID_2)).to.equal(50);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      // Mint some tokens for burning tests
      const data = "0x";
      await lord.connect(owner).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, data);
    });

    it("Should allow token holder to burn their tokens", async function () {
      const burnAmount = 30;

      await expect(lord.connect(user1).burn(user1.address, TOKEN_ID_1, burnAmount))
        .to.emit(lord, "TransferSingle")
        .withArgs(user1.address, user1.address, "0x0000000000000000000000000000000000000000", TOKEN_ID_1, burnAmount);

      // Check balance and supply after burning
      expect(await lord.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT - burnAmount);
      expect(await lord.totalSupply(TOKEN_ID_1)).to.equal(MINT_AMOUNT - burnAmount);
    });

    it("Should allow batch burning", async function () {
      // Mint additional token type
      const data = "0x";
      await lord.connect(owner).mint(user1.address, TOKEN_ID_2, MINT_AMOUNT * 2, data);

      const tokenIds = [TOKEN_ID_1, TOKEN_ID_2];
      const burnAmounts = [20, 40];

      await expect(lord.connect(user1).burnBatch(user1.address, tokenIds, burnAmounts))
        .to.emit(lord, "TransferBatch")
        .withArgs(user1.address, user1.address, "0x0000000000000000000000000000000000000000", tokenIds, burnAmounts);

      // Check balances after burning
      expect(await lord.balanceOf(user1.address, TOKEN_ID_1)).to.equal(MINT_AMOUNT - 20);
      expect(await lord.balanceOf(user1.address, TOKEN_ID_2)).to.equal((MINT_AMOUNT * 2) - 40);
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause transfers", async function () {
      // Mint tokens first
      const data = "0x";
      await lord.connect(owner).mint(user1.address, TOKEN_ID_1, MINT_AMOUNT, data);

      // Pause the contract
      await lord.connect(owner).pause();
      expect(await lord.paused()).to.be.true;

      // Should fail to transfer when paused
      await expect(
        lord.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 10, data)
      ).to.be.revertedWithCustomError(lord, "EnforcedPause");

      // Unpause
      await lord.connect(owner).unpause();
      expect(await lord.paused()).to.be.false;

      // Should work after unpause
      await expect(
        lord.connect(user1).safeTransferFrom(user1.address, user2.address, TOKEN_ID_1, 10, data)
      ).to.emit(lord, "TransferSingle");
    });

    it("Should fail if non-owner tries to pause", async function () {
      await expect(lord.connect(user1).pause())
        .to.be.revertedWithCustomError(lord, "OwnableUnauthorizedAccount");
    });
  });

  describe("URI Management", function () {
    it("Should allow owner to set URI", async function () {
      const newURI = "https://api.example.com/metadata/{id}.json";
      
      await lord.connect(owner).setURI(newURI);
      
      // Check if URI is set (we can't directly read it but can mint and check)
      const data = "0x";
      await lord.connect(owner).mint(user1.address, TOKEN_ID_1, 1, data);
      expect(await lord.uri(TOKEN_ID_1)).to.equal(newURI);
    });

    it("Should fail if non-owner tries to set URI", async function () {
      const newURI = "https://api.example.com/metadata/{id}.json";
      
      await expect(lord.connect(user1).setURI(newURI))
        .to.be.revertedWithCustomError(lord, "OwnableUnauthorizedAccount");
    });
  });
});
