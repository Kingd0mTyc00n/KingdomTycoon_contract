import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  // Your deployed contract address
  const contractAddress = "0x3f28033374ecf16A90fDbc22ea8e2Bb6194671F7";
  
  // Get contract instance
  const lord = await ethers.getContractAt("Lord", contractAddress);
  const [signer] = await ethers.getSigners();
  
  console.log("Contract address:", contractAddress);
  console.log("Signer address:", signer.address);
  
  // Get current network gas price
  console.log("Getting network information...");
  
  // Set proper gas settings for function calls
  const gasPrice = ethers.parseUnits("150", "gwei"); // 150 gwei
  const gasLimit = 500000; // 500k gas limit
  
  console.log("\n=== CALLING WITH PROPER GAS SETTINGS ===");
  console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
  console.log("Gas Price:", ethers.formatEther(gasPrice), "SEI");
  console.log("Gas Limit:", gasLimit);
  
  try {
    // Example: Call gacha mint with proper gas settings
    console.log("\nCalling gachaMint with 3 NFTs...");
    
    // Estimate gas first
    const estimatedGas = await lord.gachaMint.estimateGas(signer.address, 3);
    console.log("Estimated gas needed:", estimatedGas.toString());
    
    // Call with explicit gas settings
    const tx = await lord.gachaMint(signer.address, 3, {
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      // You can also use maxFeePerGas and maxPriorityFeePerGas for EIP-1559
      // maxFeePerGas: ethers.parseUnits("200", "gwei"),
      // maxPriorityFeePerGas: ethers.parseUnits("50", "gwei")
    });
    
    console.log("Transaction hash:", tx.hash);
    console.log("Transaction gas price:", ethers.formatUnits(tx.gasPrice, "gwei"), "gwei");
    console.log("Transaction gas price:", ethers.formatEther(tx.gasPrice), "SEI");
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("\n=== TRANSACTION RESULTS ===");
    console.log("Block number:", receipt?.blockNumber);
    console.log("Gas used:", receipt?.gasUsed?.toString());
    console.log("Effective gas price:", ethers.formatUnits(receipt?.gasPrice || 0n, "gwei"), "gwei");
    
    // Calculate total cost
    const totalCost = (receipt?.gasUsed || 0n) * (receipt?.gasPrice || 0n);
    console.log("Total transaction cost:", ethers.formatEther(totalCost), "SEI");
    
    // Check if user received NFTs
    const [ownedIds, balances] = await lord.getUserNFTs(signer.address);
    console.log("User now owns NFT IDs:", ownedIds.map((id: any) => id.toString()));
    console.log("With balances:", balances.map((bal: any) => bal.toString()));
    
  } catch (error) {
    console.error("Error calling function:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
