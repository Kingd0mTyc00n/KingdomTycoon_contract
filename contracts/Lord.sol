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
        require(numberOfNFTs > 0 && numberOfNFTs <= 10, "Invalid number of NFTs (1-50)");
        
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
     * @dev Public gacha mint function that users can call directly (if you want to allow this)
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
        
        return gachaMint(msg.sender, numberOfNFTs);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Pausable, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
