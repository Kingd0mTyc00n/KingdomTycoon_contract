# Lord.sol Contract - Technical Documentation

## Contract Summary

The `Lord` contract is a comprehensive ERC1155 multi-token NFT implementation designed for the Kingdom Tycoon game. It provides character NFTs with gacha mechanics, extensive user query capabilities, and administrative controls.

## Table of Contents

1. [Contract Inheritance](#contract-inheritance)
2. [State Variables](#state-variables)
3. [Constants](#constants)
4. [Events](#events)
5. [Function Reference](#function-reference)
6. [Gas Optimization](#gas-optimization)
7. [Security Analysis](#security-analysis)
8. [Integration Guide](#integration-guide)

## Contract Inheritance

```solidity
contract Lord is ERC1155, Ownable, ERC1155Pausable, ERC1155Burnable, ERC1155Supply
```

### Inherited Functionality

| Contract | Purpose | Key Features |
|----------|---------|--------------|
| `ERC1155` | Multi-token standard | Batch operations, semi-fungible tokens |
| `Ownable` | Access control | Owner-only functions, ownership transfer |
| `ERC1155Pausable` | Emergency controls | Pause/unpause transfers |
| `ERC1155Burnable` | Token destruction | User-controlled token burning |
| `ERC1155Supply` | Supply tracking | Total supply per token ID |

## State Variables

### Private Variables

```solidity
uint256 private _nonce;
```

- **Purpose**: Incremental counter for randomness generation
- **Usage**: Ensures unique pseudo-random values in gacha mechanics
- **Initial Value**: 0 (set in constructor)

## Constants

```solidity
uint256 public constant MAX_CHARACTER_ID = 20;
uint256 public constant MIN_CHARACTER_ID = 1;
```

- **Character Range**: IDs 1-20 (20 different character types)
- **Immutable**: Values cannot be changed after deployment
- **Gas Efficient**: Using constants saves gas compared to storage variables

## Events

### GachaMint Event

```solidity
event GachaMint(address indexed user, uint256[] characterIds, uint256 timestamp);
```

**Parameters:**
- `user` (indexed): Address receiving the minted NFTs
- `characterIds`: Array of minted character IDs
- `timestamp`: Block timestamp of the mint

**Use Cases:**
- Off-chain tracking of gacha results
- Analytics and user engagement metrics
- Frontend notifications for successful mints

## Function Reference

### Constructor

```solidity
constructor(address initialOwner) ERC1155("") Ownable(initialOwner)
```

**Parameters:**
- `initialOwner`: Address that will have owner privileges

**Initialization:**
- Sets up ERC1155 with empty URI (to be set later)
- Assigns ownership to specified address
- Initializes nonce to 0

### Administrative Functions

#### setURI

```solidity
function setURI(string memory newuri) public onlyOwner
```

**Purpose**: Update metadata URI for all tokens
**Access**: Owner only
**Gas Cost**: ~23,000 gas
**Use Case**: Update metadata location or structure

#### pause / unpause

```solidity
function pause() public onlyOwner
function unpause() public onlyOwner
```

**Purpose**: Emergency halt of all token transfers
**Access**: Owner only
**Gas Cost**: ~30,000 gas each
**Use Case**: Emergency response, maintenance

#### mint

```solidity
function mint(address account, uint256 id, uint256 amount, bytes memory data) public onlyOwner
```

**Purpose**: Mint specific amount of specific token ID
**Access**: Owner only
**Parameters:**
- `account`: Recipient address
- `id`: Token ID (should be 1-20)
- `amount`: Quantity to mint
- `data`: Additional data for hooks

#### mintBatch

```solidity
function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner
```

**Purpose**: Batch mint multiple token types
**Access**: Owner only
**Gas Efficiency**: More efficient than multiple single mints

### Gacha Functions

#### gachaMint (Owner)

```solidity
function gachaMint(address user, uint256 numberOfNFTs) public onlyOwner returns (uint256[] memory characterIds)
```

**Parameters:**
- `user`: Address to receive NFTs
- `numberOfNFTs`: Count (1-50)

**Returns**: Array of generated character IDs

**Process:**
1. Validates parameters
2. Generates random character IDs
3. Batch mints to user
4. Emits GachaMint event

**Gas Cost**: ~50,000 + (numberOfNFTs * 25,000) gas

#### publicGachaMint

```solidity
function publicGachaMint(uint256 numberOfNFTs) public payable returns (uint256[] memory characterIds)
```

**Parameters:**
- `numberOfNFTs`: Count (1-10, lower limit for public)

**Payment**: Currently no payment required (commented out)

**Gas Cost**: Similar to gachaMint but user pays

### User Query Functions

#### getUserNFTs

```solidity
function getUserNFTs(address user) public view returns (uint256[] memory ownedIds, uint256[] memory balances)
```

**Purpose**: Get all owned NFT IDs and their balances
**Gas Cost**: ~200,000 gas (view function, no state change)
**Optimization**: Creates arrays of exact size needed

**Algorithm:**
1. Count owned NFT types
2. Create properly sized arrays
3. Populate with IDs and balances

#### getUserNFTIds

```solidity
function getUserNFTIds(address user) public view returns (uint256[] memory ownedIds)
```

**Purpose**: Get only NFT IDs (without balances)
**Implementation**: Wrapper around getUserNFTs
**Use Case**: When balance information isn't needed

#### userOwnsNFT

```solidity
function userOwnsNFT(address user, uint256 tokenId) public view returns (bool owned, uint256 balance)
```

**Purpose**: Check specific NFT ownership
**Gas Cost**: ~5,000 gas
**Returns**: Both boolean ownership and exact balance

#### getUserBalances

```solidity
function getUserBalances(address user, uint256[] memory tokenIds) public view returns (uint256[] memory balances)
```

**Purpose**: Batch balance query for specific token IDs
**Gas Cost**: ~10,000 + (tokenIds.length * 2,000) gas
**Use Case**: Checking balances for specific characters

#### getUserNFTTypeCount

```solidity
function getUserNFTTypeCount(address user) public view returns (uint256 count)
```

**Purpose**: Count different NFT types owned
**Gas Cost**: ~50,000 gas
**Use Case**: Collection completion tracking

#### getUserTotalNFTCount

```solidity
function getUserTotalNFTCount(address user) public view returns (uint256 totalNFTs)
```

**Purpose**: Sum of all NFT balances
**Gas Cost**: ~50,000 gas
**Use Case**: Total collection size

### Internal Functions

#### _generateRandomCharacterId

```solidity
function _generateRandomCharacterId() private returns (uint256)
```

**Randomness Sources:**
- `block.timestamp`: Current block time
- `block.prevrandao`: Previous block's randomness (replaces `block.difficulty`)
- `msg.sender`: Function caller address
- `_nonce`: Incremental counter

**Algorithm:**
1. Increment nonce
2. Hash combined entropy sources
3. Modulo operation to fit character range
4. Add MIN_CHARACTER_ID offset

**Security Note**: Pseudo-random, predictable by miners

## Gas Optimization

### Batch Operations

- Use `mintBatch` instead of multiple `mint` calls
- Use `getUserBalances` for multiple balance queries

### View Function Efficiency

- `getUserNFTs`: O(n) where n = character range (20)
- `userOwnsNFT`: O(1) single balance check
- `getUserBalances`: O(m) where m = query array length

### Storage Optimization

- Constants instead of storage variables
- Efficient array sizing in query functions

## Security Analysis

### Access Control

**Owner Privileges:**
- Mint unlimited NFTs
- Pause/unpause contract
- Update metadata URI

**Risk Mitigation:**
- Use multi-sig wallet for owner
- Time-locks for critical functions
- Regular security audits

### Randomness Security

**Current Implementation:**
- Pseudo-random using block data
- Predictable by sophisticated actors

**Recommended Improvements:**
- Chainlink VRF for true randomness
- Commit-reveal scheme
- Oracle-based entropy

### Integer Overflow Protection

- Solidity 0.8+ has built-in overflow protection
- Safe math operations throughout

### Reentrancy Protection

- ERC1155 standard includes reentrancy protection
- No external calls in critical functions

## Integration Guide

### Frontend Integration

#### Web3.js Example

```javascript
// Get user's NFT collection
const [ownedIds, balances] = await lordContract.methods.getUserNFTs(userAddress).call();

// Perform gacha mint
const tx = await lordContract.methods.publicGachaMint(3).send({
  from: userAddress,
  gas: 300000
});

// Listen for gacha results
lordContract.events.GachaMint({
  filter: { user: userAddress }
}, (error, event) => {
  console.log('Minted characters:', event.returnValues.characterIds);
});
```

#### ethers.js Example

```javascript
// Check specific NFT ownership
const [owns, balance] = await lordContract.userOwnsNFT(userAddress, characterId);

// Get collection statistics
const typeCount = await lordContract.getUserNFTTypeCount(userAddress);
const totalCount = await lordContract.getUserTotalNFTCount(userAddress);
```

### Backend Integration

#### Event Monitoring

```javascript
// Monitor all gacha mints
lordContract.on('GachaMint', (user, characterIds, timestamp, event) => {
  // Update database
  // Send notifications
  // Update analytics
});
```

#### Batch Queries

```javascript
// Efficient multi-user query
const users = ['0x...', '0x...', '0x...'];
const userNFTs = await Promise.all(
  users.map(user => lordContract.getUserNFTs(user))
);
```

### Game Integration

#### Character Metadata

```javascript
// Token URI format: https://api.kingdomtycoon.com/metadata/{id}
const tokenURI = await lordContract.uri(characterId);
const metadata = await fetch(tokenURI.replace('{id}', characterId));
```

#### Marketplace Integration

```javascript
// Approve marketplace for trading
await lordContract.setApprovalForAll(marketplaceAddress, true);

// Transfer NFTs
await lordContract.safeTransferFrom(from, to, tokenId, amount, data);
```

## Testing Recommendations

### Unit Tests

1. **Access Control**: Test owner-only functions
2. **Gacha Mechanics**: Verify randomness distribution
3. **Query Functions**: Test edge cases and gas usage
4. **Event Emission**: Verify correct event data

### Integration Tests

1. **Marketplace Compatibility**: Test with OpenSea, etc.
2. **Wallet Integration**: Test with MetaMask, WalletConnect
3. **Gas Optimization**: Benchmark gas usage

### Security Tests

1. **Reentrancy**: Test for reentrancy vulnerabilities
2. **Integer Overflow**: Test boundary conditions
3. **Access Control**: Test unauthorized access attempts

## Deployment Checklist

- [ ] Set appropriate owner address (preferably multi-sig)
- [ ] Configure metadata URI
- [ ] Test all functions on testnet
- [ ] Verify contract on block explorer
- [ ] Set up monitoring for events
- [ ] Prepare emergency pause procedures
- [ ] Document deployed contract addresses

## Upgrade Considerations

The current contract is not upgradeable. For future versions consider:

1. **Proxy Patterns**: OpenZeppelin upgradeable contracts
2. **State Migration**: Plan for data migration
3. **Backward Compatibility**: Maintain interface compatibility
4. **Governance**: Decentralized upgrade mechanisms

## Conclusion

The Lord contract provides a solid foundation for Kingdom Tycoon's NFT system with efficient gacha mechanics and comprehensive user query capabilities. Regular security audits and potential randomness improvements should be considered for production deployment.
