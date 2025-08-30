// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import {ERC1155Pausable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Pausable.sol";
import {ERC1155Supply} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Lord is ERC1155, Ownable, ERC1155Pausable, ERC1155Burnable, ERC1155Supply {
    
    // Events
    event GachaMint(address indexed user, uint256[] characterIds, uint256 timestamp);
    
    // State variables
    uint256 private _nonce;
    uint256 public constant MAX_CHARACTER_ID = 20; // Maximum character ID available
    uint256 public constant MIN_CHARACTER_ID = 1;   // Minimum character ID available
    constructor(address initialOwner) ERC1155("") Ownable(initialOwner) {
        _nonce = 0;
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
        public
        onlyOwner
    {
        _mint(account, id, amount, data);
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        public
        onlyOwner
    {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Get all NFT IDs that a user owns (with their balances)
     * @param user The address to query
     * @return ownedIds Array of NFT IDs the user owns
     * @return balances Array of balances for each NFT ID
     */
    function getUserNFTs(address user) 
        public 
        view 
        returns (uint256[] memory ownedIds, uint256[] memory balances) 
    {
        require(user != address(0), "Cannot query zero address");
        
        // First, count how many different NFTs the user owns
        uint256 ownedCount = 0;
        for (uint256 i = MIN_CHARACTER_ID; i <= MAX_CHARACTER_ID; i++) {
            if (balanceOf(user, i) > 0) {
                ownedCount++;
            }
        }
        
        // Create arrays with the exact size needed
        ownedIds = new uint256[](ownedCount);
        balances = new uint256[](ownedCount);
        
        // Fill the arrays with owned NFT IDs and their balances
        uint256 index = 0;
        for (uint256 i = MIN_CHARACTER_ID; i <= MAX_CHARACTER_ID; i++) {
            uint256 balance = balanceOf(user, i);
            if (balance > 0) {
                ownedIds[index] = i;
                balances[index] = balance;
                index++;
            }
        }
        
        return (ownedIds, balances);
    }

    /**
     * @dev Get only the NFT IDs that a user owns (without balances)
     * @param user The address to query
     * @return ownedIds Array of NFT IDs the user owns
     */
    function getUserNFTIds(address user) 
        public 
        view 
        returns (uint256[] memory ownedIds) 
    {
        (ownedIds, ) = getUserNFTs(user);
        return ownedIds;
    }

    /**
     * @dev Check if a user owns a specific NFT ID
     * @param user The address to query
     * @param tokenId The NFT ID to check
     * @return owned True if user owns at least 1 of this NFT
     * @return balance The exact balance of this NFT
     */
    function userOwnsNFT(address user, uint256 tokenId) 
        public 
        view 
        returns (bool owned, uint256 balance) 
    {
        balance = balanceOf(user, tokenId);
        owned = balance > 0;
        return (owned, balance);
    }

    /**
     * @dev Get user's balance for multiple NFT IDs at once
     * @param user The address to query
     * @param tokenIds Array of NFT IDs to check
     * @return balances Array of balances for each NFT ID
     */
    function getUserBalances(address user, uint256[] memory tokenIds) 
        public 
        view 
        returns (uint256[] memory balances) 
    {
        require(user != address(0), "Cannot query zero address");
        
        balances = new uint256[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            balances[i] = balanceOf(user, tokenIds[i]);
        }
        
        return balances;
    }

    /**
     * @dev Get total number of different NFT types a user owns
     * @param user The address to query
     * @return count Number of different NFT types owned
     */
    function getUserNFTTypeCount(address user) 
        public 
        view 
        returns (uint256 count) 
    {
        for (uint256 i = MIN_CHARACTER_ID; i <= MAX_CHARACTER_ID; i++) {
            if (balanceOf(user, i) > 0) {
                count++;
            }
        }
        return count;
    }

    /**
     * @dev Get total number of NFTs a user owns (sum of all balances)
     * @param user The address to query
     * @return totalNFTs Total number of NFTs owned
     */
    function getUserTotalNFTCount(address user) 
        public 
        view 
        returns (uint256 totalNFTs) 
    {
        for (uint256 i = MIN_CHARACTER_ID; i <= MAX_CHARACTER_ID; i++) {
            totalNFTs += balanceOf(user, i);
        }
        return totalNFTs;
    }

    /**
     * @dev Gacha mint function that mints random character NFTs to a user
     * @param user The address to mint NFTs to
     * @param numberOfNFTs The number of NFTs to mint
     * @return characterIds Array of minted character IDs
     */
    function gachaMint(address user, uint256 numberOfNFTs) 
        public 
        onlyOwner 
        returns (uint256[] memory characterIds) 
    {
        require(user != address(0), "Cannot mint to zero address");
        require(numberOfNFTs > 0 && numberOfNFTs <= 50, "Invalid number of NFTs (1-50)");
        
        characterIds = new uint256[](numberOfNFTs);
        uint256[] memory amounts = new uint256[](numberOfNFTs);
        
        // Generate random character IDs
        for (uint256 i = 0; i < numberOfNFTs; i++) {
            characterIds[i] = _generateRandomCharacterId();
            amounts[i] = 1; // Mint 1 of each character
        }
        
        // Mint all NFTs in a batch
        _mintBatch(user, characterIds, amounts, "");
        
        // Emit event
        emit GachaMint(user, characterIds, block.timestamp);
        
        return characterIds;
    }

    /**
     * @dev Generates a pseudo-random character ID
     * @return Random character ID between MIN_CHARACTER_ID and MAX_CHARACTER_ID
     */
    function _generateRandomCharacterId() private returns (uint256) {
        _nonce++;
        uint256 randomHash = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao, // More secure than block.difficulty in recent versions
            msg.sender,
            _nonce
        )));
        
        return (randomHash % (MAX_CHARACTER_ID - MIN_CHARACTER_ID + 1)) + MIN_CHARACTER_ID;
    }

    /**
     * @dev Public gacha mint function that users can call directly
     * @param numberOfNFTs The number of NFTs to mint
     * @return characterIds Array of minted character IDs
     */
    function publicGachaMint(uint256 numberOfNFTs) 
        public 
        payable 
        returns (uint256[] memory characterIds) 
    {
        require(numberOfNFTs > 0 && numberOfNFTs <= 10, "Invalid number of NFTs (1-10)");
        // Add payment logic here if needed
        // require(msg.value >= numberOfNFTs * MINT_PRICE, "Insufficient payment");
        
        // Duplicate the gacha mint logic for public access
        characterIds = new uint256[](numberOfNFTs);
        uint256[] memory amounts = new uint256[](numberOfNFTs);
        
        // Generate random character IDs
        for (uint256 i = 0; i < numberOfNFTs; i++) {
            characterIds[i] = _generateRandomCharacterId();
            amounts[i] = 1; // Mint 1 of each character
        }
        
        // Mint all NFTs in a batch
        _mintBatch(msg.sender, characterIds, amounts, "");
        
        // Emit event
        emit GachaMint(msg.sender, characterIds, block.timestamp);
        
        return characterIds;
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
