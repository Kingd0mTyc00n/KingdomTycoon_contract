import { network } from "hardhat";

const { ethers } = await network.connect();

// Utility function to add delays between transactions
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Your deployed contract address
  const contractAddress = "0x3f28033374ecf16A90fDbc22ea8e2Bb6194671F7";
  
  // Get contract instance
  const lord = await ethers.getContractAt("Lord", contractAddress);
  const [signer] = await ethers.getSigners();
  
  console.log("Contract address:", contractAddress);
  console.log("Signer address:", signer.address);
  
  // Gas settings to ensure fast processing
  const gasPrice = ethers.parseUnits("150", "gwei");
  const gasLimit = 500000;
  
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  
  try {
    // Test multiple gacha mints with proper delays
    const mintCounts = [1, 2, 3, 5]; // Different amounts to test
    const delayBetweenCalls = 5000; // 5 seconds between calls
    
    console.log(`\n=== TESTING GACHA MINT WITH ${delayBetweenCalls/1000}s DELAYS ===`);
    
    for (let i = 0; i < mintCounts.length; i++) {
      const numberOfNFTs = mintCounts[i];
      
      console.log(`\n--- Test ${i + 1}: Minting ${numberOfNFTs} NFTs ---`);
      
      try {
        // Add delay before each call (except the first)
        if (i > 0) {
          console.log(`Waiting ${delayBetweenCalls/1000} seconds to avoid rate limiting...`);
          await delay(delayBetweenCalls);
        }
        
        // Estimate gas first
        console.log("Estimating gas...");
        const estimatedGas = await lord.gachaMint.estimateGas(signer.address, numberOfNFTs);
        console.log("Estimated gas:", estimatedGas.toString());
        
        // Call gacha mint with proper gas settings
        console.log("Calling gachaMint...");
        const tx = await lord.gachaMint(signer.address, numberOfNFTs, {
          gasLimit: gasLimit,
          gasPrice: gasPrice
        });
        
        console.log("Transaction hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);
        console.log("Gas used:", receipt?.gasUsed?.toString());
        
        // Calculate cost
        const totalCost = (receipt?.gasUsed || 0n) * (tx.gasPrice || 0n);
        console.log("Transaction cost:", ethers.formatEther(totalCost), "SEI");
        
        // Get minted NFTs from event
        const events = receipt?.logs || [];
        console.log("Events found:", events.length);
        
        // Check user's current NFTs
        const [ownedIds, balances] = await lord.getUserNFTs(signer.address);
        console.log("User now owns:", ownedIds.length, "different NFT types");
        console.log("Total NFTs:", await lord.getUserTotalNFTCount(signer.address));
        
      } catch (error: any) {
        console.error(`❌ Error in test ${i + 1}:`, error.message);
        
        if (error.message.includes("rate limited")) {
          console.log("🔄 Rate limited - increasing delay for next attempt");
          // Double the delay for the next call
          await delay(delayBetweenCalls * 2);
        }
      }
    }
    
    console.log("\n=== FINAL SUMMARY ===");
    const [finalOwnedIds, finalBalances] = await lord.getUserNFTs(signer.address);
    console.log("Final owned NFT IDs:", finalOwnedIds.map((id: any) => id.toString()));
    console.log("Final balances:", finalBalances.map((bal: any) => bal.toString()));
    console.log("Total different NFT types:", finalOwnedIds.length);
    console.log("Total NFT count:", await lord.getUserTotalNFTCount(signer.address));
    
  } catch (error) {
    console.error("Script error:", error);
  }
}

// Error handling wrapper
main()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
