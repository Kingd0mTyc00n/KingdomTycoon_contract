import { network } from "hardhat";

const { ethers } = await network.connect();

// Utility function for exponential backoff retry
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message.includes("rate limited") && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`⏳ Rate limited. Retrying in ${delay/1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  const contractAddress = "0x3f28033374ecf16A90fDbc22ea8e2Bb6194671F7";
  const lord = await ethers.getContractAt("Lord", contractAddress);
  const [signer] = await ethers.getSigners();
  
  console.log("🎮 Smart Gacha Mint with Rate Limiting Protection");
  console.log("Contract:", contractAddress);
  console.log("Signer:", signer.address);
  
  const gasPrice = ethers.parseUnits("150", "gwei");
  const gasLimit = 500000;
  
  try {
    // Single gacha mint with retry logic
    console.log("\n🎲 Attempting gacha mint with rate limiting protection...");
    
    const result = await retryWithBackoff(async () => {
      console.log("🔄 Calling gachaMint...");
      
      const tx = await lord.gachaMint(signer.address, 1, {
        gasLimit: gasLimit,
        gasPrice: gasPrice
      });
      
      console.log("📝 Transaction submitted:", tx.hash);
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt?.blockNumber);
      
      return { tx, receipt };
    });
    
    // Show results
    const totalCost = (result.receipt?.gasUsed || 0n) * (result.tx.gasPrice || 0n);
    console.log("💰 Cost:", ethers.formatEther(totalCost), "SEI");
    
    // Check new NFTs
    const [ownedIds, balances] = await lord.getUserNFTs(signer.address);
    const totalNFTs = await lord.getUserTotalNFTCount(signer.address);
    
    console.log("\n🎁 Results:");
    console.log("NFT Types:", ownedIds.length);
    console.log("Total NFTs:", totalNFTs.toString());
    console.log("Owned IDs:", ownedIds.map((id: any) => id.toString()).join(", "));
    
  } catch (error: any) {
    console.error("❌ Failed:", error.message);
    
    if (error.message.includes("rate limited")) {
      console.log("\n💡 Tips to avoid rate limiting:");
      console.log("1. Wait 10-30 seconds between transactions");
      console.log("2. Use lower gas prices if possible");
      console.log("3. Batch multiple operations when possible");
      console.log("4. Check network congestion");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
