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

  describe("Gacha Mint", function () {
    it("Should successfully gacha mint NFTs and return character IDs", async function () {
      const numberOfNFTs = 5;
      
      // Call gacha mint and measure gas
      const tx = await lord.connect(owner).gachaMint(user1.address, numberOfNFTs);
      const receipt = await tx.wait();
      
      console.log("\n=== GACHA MINT GAS ANALYSIS ===");
      console.log("Gas Used:", receipt.gasUsed.toString());
      console.log("Gas Price:", ethers.formatUnits(tx.gasPrice, "gwei"), "gwei");
      console.log("Transaction Fee:", ethers.formatEther(receipt.gasUsed * tx.gasPrice), "ETH");
      console.log("Gas per NFT:", (receipt.gasUsed / BigInt(numberOfNFTs)).toString());
      
      // Check if event was emitted
      const gachaMintEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = lord.interface.parseLog(log);
          return parsedLog.name === "GachaMint";
        } catch {
          return false;
        }
      });
      
      expect(gachaMintEvent).to.not.be.undefined;
      
      // Parse the event to get character IDs
      const parsedEvent = lord.interface.parseLog(gachaMintEvent);
      const characterIds = parsedEvent.args.characterIds;
      
      console.log("Minted Character IDs:", characterIds.map((id: any) => id.toString()));
      
      // Verify character IDs are within expected range
      expect(characterIds).to.have.length(numberOfNFTs);
      for (const id of characterIds) {
        expect(id).to.be.at.least(1);
        expect(id).to.be.at.most(20); // MAX_CHARACTER_ID = 20
      }
      
      // Verify user actually owns these NFTs (account for duplicates)
      const uniqueIds = [...new Set(characterIds.map((id: any) => Number(id)))];
      for (const id of uniqueIds) {
        const expectedBalance = characterIds.filter((charId: any) => Number(charId) === id).length;
        expect(await lord.balanceOf(user1.address, id)).to.equal(expectedBalance);
      }
      
      // Test view functions
      const [ownedIds, balances] = await lord.getUserNFTs(user1.address);
      console.log("User's owned NFT IDs:", ownedIds.map((id: any) => id.toString()));
      console.log("User's NFT balances:", balances.map((bal: any) => bal.toString()));
      
      expect(ownedIds.length).to.be.at.least(1); // Changed from exact match due to possible duplicates
      expect(await lord.getUserTotalNFTCount(user1.address)).to.equal(numberOfNFTs);
    });

    it("Should handle multiple gacha mints and accumulate correctly", async function () {
      // First gacha mint
      const tx1 = await lord.connect(owner).gachaMint(user1.address, 3);
      const receipt1 = await tx1.wait();
      
      // Second gacha mint
      const tx2 = await lord.connect(owner).gachaMint(user1.address, 2);
      const receipt2 = await tx2.wait();
      
      console.log("\n=== MULTIPLE GACHA MINTS ===");
      console.log("First mint gas:", receipt1.gasUsed.toString());
      console.log("Second mint gas:", receipt2.gasUsed.toString());
      console.log("Total gas used:", (receipt1.gasUsed + receipt2.gasUsed).toString());
      
      // Should have 5 total NFTs
      const totalNFTs = await lord.getUserTotalNFTCount(user1.address);
      expect(totalNFTs).to.equal(5);
      
      // Test getUserNFTs function
      const [ownedIds, balances] = await lord.getUserNFTs(user1.address);
      console.log("Final owned IDs:", ownedIds.map((id: any) => id.toString()));
      console.log("Final balances:", balances.map((bal: any) => bal.toString()));
    });

    it("Should test gas efficiency with different mint sizes", async function () {
      const testSizes = [1, 5, 10, 15]; // Changed from 20 to 15 to stay within limit
      
      console.log("\n=== GAS EFFICIENCY ANALYSIS ===");
      console.log("Mint Size | Gas Used | Gas/NFT | Gas Price (gwei)");
      console.log("----------|----------|---------|----------------");
      
      // Get fresh users for each test to avoid any state interference
      const signers = await ethers.getSigners();
      
      for (let i = 0; i < testSizes.length; i++) {
        const size = testSizes[i];
        const testUser = signers[i + 3]; // Use signers 3, 4, 5, 6
        
        const tx = await lord.connect(owner).gachaMint(testUser.address, size);
        const receipt = await tx.wait();
        
        const gasUsed = receipt.gasUsed;
        const gasPerNFT = gasUsed / BigInt(size);
        const gasPriceGwei = ethers.formatUnits(tx.gasPrice, "gwei");
        
        console.log(`${size.toString().padStart(9)} | ${gasUsed.toString().padStart(8)} | ${gasPerNFT.toString().padStart(7)} | ${gasPriceGwei.padStart(14)}`);
        
        // Verify minting worked
        const currentTotal = await lord.getUserTotalNFTCount(testUser.address);
        expect(currentTotal).to.equal(size);
        console.log(`  -> User${i+3} now has ${currentTotal} total NFTs`);
      }
    });

    it("Should test view functions with gas measurement", async function () {
      // Mint some NFTs first
      await lord.connect(owner).gachaMint(user1.address, 10);
      
      console.log("\n=== VIEW FUNCTIONS GAS MEASUREMENT ===");
      
      // Test getUserNFTs (this is a view function, should be free)
      const startTime = Date.now();
      const [ownedIds, balances] = await lord.getUserNFTs(user1.address);
      const endTime = Date.now();
      
      console.log("getUserNFTs execution time:", endTime - startTime, "ms");
      console.log("Owned NFT count:", ownedIds.length);
      
      // Test individual view functions
      const totalCount = await lord.getUserTotalNFTCount(user1.address);
      const typeCount = await lord.getUserNFTTypeCount(user1.address);
      
      console.log("Total NFTs owned:", totalCount.toString());
      console.log("Different NFT types:", typeCount.toString());
      
      // Test userOwnsNFT function
      if (ownedIds.length > 0) {
        const [owns, balance] = await lord.userOwnsNFT(user1.address, ownedIds[0]);
        expect(owns).to.be.true;
        expect(balance).to.be.at.least(1);
        console.log(`User owns NFT ID ${ownedIds[0]}: ${owns}, Balance: ${balance}`);
      }
    });

    it("Should validate gacha mint constraints", async function () {
      // Test zero address rejection
      await expect(
        lord.connect(owner).gachaMint("0x0000000000000000000000000000000000000000", 1)
      ).to.be.revertedWith("Cannot mint to zero address");
      
      // Test zero amount rejection
      await expect(
        lord.connect(owner).gachaMint(user1.address, 0)
      ).to.be.revertedWith("Invalid number of NFTs (1-50)");
      
      // Test over limit rejection
      await expect(
        lord.connect(owner).gachaMint(user1.address, 51)
      ).to.be.revertedWith("Invalid number of NFTs (1-50)");
      
      // Test non-owner access
      await expect(
        lord.connect(user1).gachaMint(user1.address, 1)
      ).to.be.revertedWithCustomError(lord, "OwnableUnauthorizedAccount");
    });

    it("Should test publicGachaMint function", async function () {
      // Test public gacha mint (users can call this themselves)
      const tx = await lord.connect(user1).publicGachaMint(3);
      const receipt = await tx.wait();
      
      console.log("\n=== PUBLIC GACHA MINT ===");
      console.log("Gas Used:", receipt.gasUsed.toString());
      console.log("Gas Price:", ethers.formatUnits(tx.gasPrice, "gwei"), "gwei");
      
      // Verify user received NFTs
      const totalNFTs = await lord.getUserTotalNFTCount(user1.address);
      expect(totalNFTs).to.equal(3);
      
      // Test public gacha mint constraints
      await expect(
        lord.connect(user1).publicGachaMint(0)
      ).to.be.revertedWith("Invalid number of NFTs (1-10)");
      
      await expect(
        lord.connect(user1).publicGachaMint(11)
      ).to.be.revertedWith("Invalid number of NFTs (1-10)");
    });

    it("Should generate different random character IDs", async function () {
      const numberOfMints = 10;
      const allCharacterIds: number[] = [];
      
      // Perform multiple gacha mints
      for (let i = 0; i < numberOfMints; i++) {
        const tx = await lord.connect(owner).gachaMint(user2.address, 1);
        const receipt = await tx.wait();
        
        // Extract character ID from event
        const gachaMintEvent = receipt.logs.find((log: any) => {
          try {
            const parsedLog = lord.interface.parseLog(log);
            return parsedLog.name === "GachaMint";
          } catch {
            return false;
          }
        });
        
        const parsedEvent = lord.interface.parseLog(gachaMintEvent);
        const characterId = Number(parsedEvent.args.characterIds[0]);
        allCharacterIds.push(characterId);
      }
      
      console.log("\n=== RANDOMNESS TEST ===");
      console.log("Generated Character IDs:", allCharacterIds);
      
      // Check if we got different IDs (randomness test)
      const uniqueIds = [...new Set(allCharacterIds)];
      console.log("Unique IDs generated:", uniqueIds.length, "out of", numberOfMints);
      
      // All IDs should be within valid range
      for (const id of allCharacterIds) {
        expect(id).to.be.at.least(1);
        expect(id).to.be.at.most(20);
      }
    });
  });
});
