# Kingdom Tycoon - Lord NFT Contract

A comprehensive ERC1155 NFT contract for Kingdom Tycoon game, featuring character NFTs with gacha mechanics and extensive user query functionality.

## Contract Overview

The `Lord` contract is an ERC1155 multi-token standard implementation that serves as the core NFT system for Kingdom Tycoon. It enables the minting, trading, and management of character NFTs with built-in gacha (random reward) mechanics.

### Key Features

- **ERC1155 Multi-Token Standard**: Efficient batch operations and multiple token types in a single contract
- **Gacha Mechanics**: Random character minting system with configurable probability
- **Owner Controls**: Administrative functions for minting, pausing, and URI management
- **User Query Functions**: Comprehensive methods to query user NFT ownership and balances
- **Burnable Tokens**: Users can burn their NFTs if needed
- **Pausable**: Emergency pause functionality for contract operations
- **Supply Tracking**: Built-in supply tracking for all token types

## Contract Architecture

### Inheritance Structure

```
Lord Contract
├── ERC1155 (OpenZeppelin)
├── Ownable (OpenZeppelin)
├── ERC1155Pausable (OpenZeppelin)
├── ERC1155Burnable (OpenZeppelin)
└── ERC1155Supply (OpenZeppelin)
```

### Constants

| Constant | Value | Description |
|----------|--------|-------------|
| `MAX_CHARACTER_ID` | 20 | Maximum character ID available for minting |
| `MIN_CHARACTER_ID` | 1 | Minimum character ID available for minting |

### State Variables

- `_nonce`: Private counter used for randomness generation in gacha mechanics

## Core Functions

### Administrative Functions

#### `constructor(address initialOwner)`
Initializes the contract with an initial owner and sets up the ERC1155 structure.

#### `setURI(string memory newuri)` (Owner Only)
Updates the metadata URI for all tokens.

#### `pause()` / `unpause()` (Owner Only)
Emergency pause/unpause functionality to halt all token transfers.

#### `mint(address account, uint256 id, uint256 amount, bytes memory data)` (Owner Only)
Mints a specific amount of a specific token ID to an account.

#### `mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)` (Owner Only)
Batch mints multiple token types and amounts to a single account.

### Gacha System

#### `gachaMint(address user, uint256 numberOfNFTs)` (Owner Only)
```solidity
function gachaMint(address user, uint256 numberOfNFTs) 
    public 
    onlyOwner 
    returns (uint256[] memory characterIds)
```

**Parameters:**
- `user`: Address to receive the minted NFTs
- `numberOfNFTs`: Number of NFTs to mint (1-50)

**Returns:**
- `characterIds`: Array of randomly generated character IDs

**Events Emitted:**
- `GachaMint(address indexed user, uint256[] characterIds, uint256 timestamp)`

#### `publicGachaMint(uint256 numberOfNFTs)` (Public Payable)
```solidity
function publicGachaMint(uint256 numberOfNFTs) 
    public 
    payable 
    returns (uint256[] memory characterIds)
```

Public version of gacha minting that users can call directly. Currently allows 1-10 NFTs per transaction.

**Note:** Payment logic is commented out but can be implemented by adding mint price requirements.

### User Query Functions

#### `getUserNFTs(address user)`
```solidity
function getUserNFTs(address user) 
    public 
    view 
    returns (uint256[] memory ownedIds, uint256[] memory balances)
```

Returns all NFT IDs owned by a user along with their respective balances.

#### `getUserNFTIds(address user)`
```solidity
function getUserNFTIds(address user) 
    public 
    view 
    returns (uint256[] memory ownedIds)
```

Returns only the NFT IDs owned by a user (without balance information).

#### `userOwnsNFT(address user, uint256 tokenId)`
```solidity
function userOwnsNFT(address user, uint256 tokenId) 
    public 
    view 
    returns (bool owned, uint256 balance)
```

Checks if a user owns a specific NFT ID and returns the exact balance.

#### `getUserBalances(address user, uint256[] memory tokenIds)`
```solidity
function getUserBalances(address user, uint256[] memory tokenIds) 
    public 
    view 
    returns (uint256[] memory balances)
```

Batch query for user's balances across multiple token IDs.

#### `getUserNFTTypeCount(address user)`
```solidity
function getUserNFTTypeCount(address user) 
    public 
    view 
    returns (uint256 count)
```

Returns the number of different NFT types a user owns.

#### `getUserTotalNFTCount(address user)`
```solidity
function getUserTotalNFTCount(address user) 
    public 
    view 
    returns (uint256 totalNFTs)
```

Returns the total number of NFTs owned by a user (sum of all balances).

## Events

### `GachaMint`
```solidity
event GachaMint(address indexed user, uint256[] characterIds, uint256 timestamp);
```

Emitted when NFTs are minted through the gacha system.

**Parameters:**
- `user`: Address that received the NFTs
- `characterIds`: Array of character IDs that were minted
- `timestamp`: Block timestamp when the mint occurred

## Randomness Generation

The contract uses a pseudo-random number generation system for gacha mechanics:

```solidity
function _generateRandomCharacterId() private returns (uint256) {
    _nonce++;
    uint256 randomHash = uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao, // More secure than block.difficulty
        msg.sender,
        _nonce
    )));
    
    return (randomHash % (MAX_CHARACTER_ID - MIN_CHARACTER_ID + 1)) + MIN_CHARACTER_ID;
}
```

**Security Note:** This is pseudo-random and should not be used for high-stakes applications. For production games with real monetary value, consider using Chainlink VRF or similar oracle solutions.

## Usage Examples

### Deploying the Contract

```javascript
const Lord = await ethers.getContractFactory("Lord");
const lord = await Lord.deploy(ownerAddress);
await lord.deployed();
```

### Minting NFTs via Gacha

```javascript
// Owner minting for a user
const tx = await lord.gachaMint(userAddress, 5);
const receipt = await tx.wait();

// Public minting (user calling directly)
const tx2 = await lord.connect(user).publicGachaMint(3);
```

### Querying User NFTs

```javascript
// Get all NFTs owned by a user
const [ownedIds, balances] = await lord.getUserNFTs(userAddress);

// Check if user owns a specific NFT
const [owns, balance] = await lord.userOwnsNFT(userAddress, 5);

// Get total count of different NFT types
const typeCount = await lord.getUserNFTTypeCount(userAddress);
```

## Security Considerations

1. **Owner Privileges**: The contract owner has significant control including minting and pausing
2. **Randomness**: Uses pseudo-random generation which is predictable on-chain
3. **Supply Limits**: No maximum supply limits implemented per token type
4. **Payment Logic**: Public gacha minting currently has no payment requirements

## Development Setup

### Installation

```shell
npm install
```

### Running Tests

```shell
npx hardhat test
```

### Compilation

```shell
npx hardhat compile
```

### Deployment

```shell
# Local deployment
npx hardhat ignition deploy ignition/modules/deploy-test.ts

# Testnet deployment (configure network in hardhat.config.ts)
npx hardhat ignition deploy --network sepolia ignition/modules/deploy-test.ts
```

## License

MIT License - see the contract file for the SPDX license identifier.

## Contract Address

*To be updated after deployment*

## Version History

- **v1.0.0**: Initial implementation with ERC1155, gacha mechanics, and user query functions
