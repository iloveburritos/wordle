// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyERC1155 is ERC1155, Ownable {
    // Mapping of token ID to wallet address that can mint it
    mapping(uint256 => address) private allowedMinters;

    // Struct to hold score data
    struct Score {
        string ciphertext;
        string datatoencrypthash;
    }

    // Mapping from address to their score struct
    mapping(address => Score) private scores;

    // Current game identifier
    uint256 public currentGame;

    // Address of the forwarder
    address public forwarder;

    // Number of groups
    uint256 public numTokens;

    // Mapping from address to number of tokens (aka groups) held
    mapping(address => uint256) public tokensHeld;

    // Events
    event ForwarderUpdated(address indexed newForwarder);
    event ScoreAdded(uint256 indexed gameId, address indexed user, string ciphertext, string datatoencrypthash);
    event ScoresCleared(uint256 indexed previousGameId, uint256 indexed newGameId);
    event NewUser(uint256 indexed tokenId, address indexed user);
    event RemoveUser(uint256 indexed tokenId, address indexed user);
    event NewGroup(uint256 indexed tokenId, address indexed owner);

    constructor(string memory uri, address initialOwner) ERC1155(uri) Ownable(initialOwner) {}

    /**
    * @dev Function to register yourself as the minter for the current token ID
    */
    function registerMinter() external {
        uint256 tokenId = numTokens; // Use current numTokens as the token ID
        require(allowedMinters[tokenId] == address(0), "Token ID already has a registered minter");
        allowedMinters[tokenId] = msg.sender;

        // Increment numTokens after assigning the token ID
        numTokens++;

        // Emit NewGroup event
        emit NewGroup(tokenId, msg.sender);
    }


    /**
     * @dev Mint function restricted to the allowed minter of the token ID
     * @param account The address to mint tokens to
     * @param tokenId The token ID to mint
     * @param data Additional data
     */
    function mint(
            address account, 
            uint256 tokenId, 
            bytes memory data) external {
        require(allowedMinters[tokenId] == msg.sender, "You are not authorized to mint this token ID");
        require(balanceOf(account, tokenId) == 0, "Recipient already owns a token with this ID");
        require(data.length == 0, "Invalid data, pass empty bytes");
        
        // Mint one token only
        _mint(account, tokenId, 1, data);

        // Update the tokensHeld mapping
        tokensHeld[account]++;

        // Emit NewUser event
        emit NewUser(tokenId, account);
    }


    /**
     * @dev Burn function that allows both the token holder and the token ID owner (minter) to burn tokens
     * @param account The address holding the tokens
     * @param tokenId The token ID to burn
     */
    function burn(address account, uint256 tokenId) external {
        require(
            account == msg.sender || allowedMinters[tokenId] == msg.sender,
            "Only the token holder or the token ID owner can burn"
        );
        require(balanceOf(account, tokenId) > 0, "Account does not own this token");

        // Burn one token only
        _burn(account, tokenId, 1);

        // Decrease the tokensHeld mapping
        tokensHeld[account]--;
        
        // Remove score if the holder has no tokens left
        if (tokensHeld[account] == 0) {
            delete scores[account];
        }

        // Emit RemoveUser event
        emit RemoveUser(tokenId, account);
    }

    /**
     * @dev Function to set the encrypted score for a user.
     * @param user The wallet address of the user
     * @param scoreCiphertext The encrypted score
     * @param scoreHash The hash of the score data
     */
    function setScore(
        address user,
        string memory scoreCiphertext,
        string memory scoreHash
    ) external onlyOwner {
        // Check if the user holds at least one NFT
        uint256 totalBalance = 0;

        // Iterate over token IDs to check if the user owns any tokens
        for (uint256 tokenId = 0; tokenId <= numTokens; tokenId++) {
            totalBalance += balanceOf(user, tokenId);
        }

        require(totalBalance > 0, "User must hold at least one NFT to submit a score");

        // Check if a score has already been submitted
        require(bytes(scores[user].ciphertext).length == 0, "Score already submitted for this game");

        // Add the encrypted score to the mapping
        scores[user] = Score(scoreCiphertext, scoreHash);

        // Emit ScoreAdded event
        emit ScoreAdded(currentGame, user, scoreCiphertext, scoreHash);
    }

    /**
     * @dev Get the score data for a user
     * @param user The wallet address of the user
     * @return The score struct containing ciphertext and datatoencrypthash
     */
    function getScore(address user) external view returns (Score memory) {
        return scores[user];
    }

    /**
     * @dev Set or update the forwarder address.
     * @param newForwarder The new forwarder address
     */
    function setForwarder(address newForwarder) external onlyOwner {
        require(newForwarder != address(0), "Forwarder address cannot be zero");
        forwarder = newForwarder;
        emit ForwarderUpdated(newForwarder);
    }

    /**
     * @dev Clear all scores and increment the current game counter.
     * Can only be called by the forwarder.
     */
    function clearScore() external {
        require(msg.sender == forwarder, "Only the forwarder can call this function");

        // Clear all scores
        for (uint256 i = 0; i < currentGame; i++) {
            delete scores[msg.sender];
        }

        // Increment the current game counter
        uint256 previousGameId = currentGame;
        currentGame++;

        // Emit event for cleared scores
        emit ScoresCleared(previousGameId, currentGame);
    }

        /**
    * @dev Check if a wallet address is allowed based on the score mapping.
    * @param wallet The wallet address to check.
    * @return True if the score mapping for the address is non-empty, false otherwise.
    */
    function isAllowed(address wallet) external view returns (bool) {
        return bytes(scores[wallet].ciphertext).length > 0;
    }

}
