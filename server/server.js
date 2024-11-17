import express from "express";
import { ethers } from "ethers";
import { WordleABI } from "../public/contractABI.js"; // Adjust the path to match your project structure
import dotenv from "dotenv";
import cors from "cors"; // Import the CORS middleware
dotenv.config();

const app = express();

// Enable CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests from your frontend
  })
);

app.use(express.json()); // Middleware to parse JSON request bodies

// POST endpoint to mint NFTs
app.post("/mint", async (req, res) => {
  try {
    // Extract wallet addresses from the request body
    const { walletAddresses } = req.body;

    if (!walletAddresses || !Array.isArray(walletAddresses)) {
      return res.status(400).json({ error: "Invalid request body. Provide an array of wallet addresses." });
    }

    // Log incoming wallet addresses
    console.log("Wallet Addresses:", walletAddresses);

    // Load environment variables
    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const networkUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

    if (!privateKey || !contractAddress || !networkUrl) {
      throw new Error("Missing required environment variables.");
    }

    // Connect to Ethereum network
    const provider = new ethers.providers.JsonRpcProvider(networkUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, WordleABI, wallet);

    console.log("Connected to provider and contract");

    // Mint NFTs for each wallet address
    const mintPromises = walletAddresses.map(async (address) => {
      const tx = await contract.safeMint(address); // safeMint is the minting function in your smart contract
      console.log(`Transaction sent for ${address}: ${tx.hash}`);
      await tx.wait(); // Wait for the transaction to be mined
      return tx.hash; // Return transaction hash
    });

    // Wait for all transactions to complete
    const txHashes = await Promise.all(mintPromises);

    // Respond with success and transaction hashes
    return res.status(200).json({
      success: true,
      message: "NFTs minted successfully.",
      transactionHashes: txHashes,
    });
  } catch (error) {
    console.error("Minting error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred.",
    });
  }
});

// Start the server
const PORT = process.env.NEXT_PUBLIC_PORT || 3001; // Default to 3001 if the env variable isn't set
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
