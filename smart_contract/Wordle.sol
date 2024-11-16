// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wordle is ERC721, Ownable {
    uint256 private _nextTokenId;

    // Struct to hold two strings for a user
    struct ScoreData {
        string encryptedScore;
        string hashScore;
    }
    
    // Mapping from token ID to string
    //tokenData is now called userScores
    mapping(uint256 => ScoreData) private _userScores;

    // Mapping from addresses to token IDs
    mapping(address => uint256) private _addressToTokenId;

    // Counter to track the number of active tokens
    uint256 public activeTokenCount;

    // Counter to track the game we are on
    uint256 public currentGame;

    // Address of the forwarder
    address public forwarder;

    // Event emitted when token data is cleared
    event GameEnded(uint256 indexed currentGame);

    // Event emitted when a new score is added
    event ScoreAdded(uint256 indexed tokenId, address indexed user, string encryptedScore, string hashScore, uint256 indexed currentGame);

    // Event emitted when a new player is added (i.e. new token is minted)
    event newUser(uint256 indexed tokenId, address indexed userAddress);

    constructor(address initialOwner)
        ERC721("Wordle", "WRDL")
        Ownable(initialOwner)
    {
        // Initialize currentGame to 0
        currentGame = 0;
    }

    // Modifier to check if the caller is the owner or the forwarder
    modifier onlyOwnerOrForwarder() {
        require(msg.sender == owner() || msg.sender == forwarder, "Caller is not owner or forwarder");
        _;
    }

    // Function to set the forwarder address (only callable by the owner) used by Chainlink for automatic reset
    function setForwarder(address newForwarder) public onlyOwner {
        forwarder = newForwarder;
    }

    // Function to mint a new token
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        // Update the address-to-token mapping
        _addressToTokenId[to] = tokenId;

        // Emit event for indexing purposes
        emit newUser(tokenId, to);
    }

    // Function to set token data for a token ID
    function setUserScore(uint256 tokenId, string memory encryptedScore, string memory hashScore) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        // Update token data if it is currently empty
        if (bytes(_userScores[tokenId].encryptedScore).length == 0) {
            _userScores[tokenId] = ScoreData(encryptedScore, hashScore);
            activeTokenCount++;
        }

        // Get the wallet address associated with the token ID
        address user = ownerOf(tokenId);

        // Emit the ScoreAdded event
        emit ScoreAdded(tokenId, user, encryptedScore, hashScore, currentGame);
    }

    // Function to get the token data for a token ID
    function getScore(uint256 tokenId) public view returns (string memory encryptedScore, string memory hashScore) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");

        ScoreData memory data = _userScores[tokenId];

        return (data.encryptedScore, data.hashScore);
    }

    // Function to clear all token data
    function clearScores() public onlyOwnerOrForwarder {
        // Iterate through the mapping and clear each token's data
        for (uint256 tokenId = 0; tokenId < _nextTokenId; tokenId++) {
            if (bytes(_userScores[tokenId].encryptedScore).length != 0) {

                // Clear the data
                delete _userScores[tokenId];
            }
        }

        // Reset the active token count
        activeTokenCount = 0;

        // Emit an event with the token ID and corresponding message
        emit GameEnded(currentGame);

        // Increment the current game counter
        currentGame++;
    }

    // Function to check if a wallet is allowed based on its NFT ownership and token data
    function isAllowed(address wallet) public view returns (bool) {
        // Always return true if the caller is the contract owner
        if (wallet == owner()) {
            return true;
        }

        require(balanceOf(wallet) > 0, "Address does not own any tokens");

        // Retrieve the token ID directly from the mapping
        uint256 tokenId = _addressToTokenId[wallet];
        return bytes(_userScores[tokenId].encryptedScore).length != 0;
    }
}