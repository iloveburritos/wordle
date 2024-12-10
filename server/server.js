import express from "express";
import { ethers } from "ethers";
import { WordleABI } from "../public/contractABI.mjs"; // Adjust the path to match your project structure
import dotenv from "dotenv";
import cors from "cors"; // Import the CORS middleware
import { customAlphabet } from "nanoid"; // Use customAlphabet to specify characters
import jwt from "jsonwebtoken"; // Import jsonwebtoken library
import { SiweMessage } from "siwe"; // Import SIWE library

dotenv.config({ path: './.env.local' });

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
    const { walletAddresses } = req.body;

    if (!walletAddresses || !Array.isArray(walletAddresses)) {
      return res.status(400).json({ 
        error: "Invalid request body. Provide an array of wallet addresses." 
      });
    }

    console.log("Wallet Addresses:", walletAddresses);

    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const networkUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

    if (!privateKey || !contractAddress || !networkUrl) {
      throw new Error("Missing required environment variables.");
    }

    const provider = new ethers.providers.JsonRpcProvider(networkUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, WordleABI, wallet);

    console.log("Connected to provider and contract");

    // Process each address sequentially to avoid nonce issues
    const results = [];
for (const address of walletAddresses) {
  try {
    console.log(`Processing address: ${address}`);
    
    // Check if address already has an NFT
    const balance = await contract.balanceOf(address);
    
    if (balance.gt(0)) {
      console.log(`Address ${address} already has an NFT`);
      results.push({
        address,
        status: 'skipped',
        message: 'Address already has an NFT'
      });
      continue;
    }

    // Get the latest nonce for this transaction
    const nonce = await wallet.getTransactionCount("latest");
    
    // Estimate gas for this specific transaction
    let gasEstimate;
    try {
      gasEstimate = await contract.estimateGas.safeMint(address);
      console.log(`Gas estimate for ${address}: ${gasEstimate.toString()}`);
    } catch (gasError) {
      throw new Error(`Gas estimation failed: ${gasError.message}`);
    }
    
    const tx = await contract.safeMint(address, {
      nonce: nonce,
      gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
      maxFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei")
    });

    console.log(`Transaction sent for ${address}: ${tx.hash}`);
    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error('Transaction reverted on chain');
    }

    results.push({
      address,
      status: 'success',
      txHash: tx.hash
    });
  } catch (error) {
    console.error(`Error minting for address ${address}:`, error);
    results.push({
      address,
      status: 'error',
      error: error.message,
      details: error.receipt ? `Transaction reverted: ${error.receipt.transactionHash}` : undefined
    });
  }
}

    return res.status(200).json({
      success: true,
      message: "NFT minting process completed",
      results: results
    });
  } catch (error) {
    console.error("Minting error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred.",
    });
  }
});

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/94961/wordle31155/version/latest';

if (!SUBGRAPH_URL) {
  throw new Error('NEXT_PUBLIC_SUBGRAPH_URL is not defined in environment variables');
}

async function runGraphQueryForWallet(walletAddress) {
  // First try a test query to verify the endpoint
  const testQuery = `
    {
      _meta {
        block {
          number
        }
        deployment
        hasIndexingErrors
      }
    }
  `;

  try {
    const testResponse = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery
      }),
    });

    const testResult = await testResponse.json();
    console.log('Graph API test response:', testResult);

    // Now query for the tokens
    const query = `
      {
        newUsers(where: { user: "${walletAddress.toLowerCase()}" }) {
          id
          tokenId
          user
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

    console.log(`Running GraphQL query for wallet ${walletAddress}`);

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphQL query failed: ${errorText}`);
    }

    const result = await response.json();
    console.log('Graph API response:', result);

    if (result.errors) {
      throw new Error(`GraphQL query errors: ${JSON.stringify(result.errors)}`);
    }

    if (!result.data) {
      console.log('No data returned from The Graph, but no errors. User might not have any tokens.');
      return [];
    }

    // Convert BigInt tokenId to Number
    const users = result.data.newUsers.map(user => ({
      ...user,
      tokenId: Number(user.tokenId)
    }));

    return users;
  } catch (error) {
    console.error('Error querying The Graph:', error);
    throw error;
  }
}

// GET endpoint to generate a nonce
app.get("/generate-nonce", (req, res) => {
  try {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 12);
    const nonce = nanoid();
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET is not defined" });
    }

    const token = jwt.sign({ nonce }, secret, { expiresIn: "10m" });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

// POST endpoint to verify SIWE message and JWT
app.post("/send-score", async (req, res) => {
  try {
    const { message, signature, token, score } = req.body;

    console.log("SCORE: ", score);

    if (!message || !signature || !token || score === undefined) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Verify the JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ error: "Invalid JWT" });
    }

    const { nonce } = decoded; // Extract the nonce from the JWT

    // Parse the SIWE message string into an object
    const siweMessage = new SiweMessage(message);
    console.log("Parsed SIWE message:", siweMessage);

    // Verify that the nonce in the SIWE message matches the nonce from the JWT
    if (siweMessage.nonce !== nonce) {
      console.error("Nonce mismatch. SIWE message nonce:", siweMessage.nonce, "JWT nonce:", nonce);
      return res.status(400).json({ error: "Nonce mismatch" });
    }

    // Verify the SIWE signature
    const verification = await siweMessage.verify({ signature });
    console.log("SIWE verification:", verification);

    if (!verification) {
      return res.status(401).json({ error: "Invalid SIWE signature" });
    }

    // Extract the wallet address from the SIWE message
    const walletAddress = siweMessage.address;

    // Check token ownership using the Graph API
    try {
      const tokens = await runGraphQueryForWallet(walletAddress);
      if (!tokens || tokens.length === 0) {
        return res.status(403).json({ error: "No tokens found for this wallet" });
      }
      console.log(`Found ${tokens.length} tokens for wallet ${walletAddress}`);
    } catch (err) {
      console.error("Error checking token ownership:", err);
      return res.status(500).json({ error: "Failed to verify token ownership" });
    }

    // If we get here, the user has at least one token
    console.log(`Score received:`, score);

    // Submit score to contract
    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_BASE_RPC_URL);
      const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
      
      if (!ownerPrivateKey) {
        throw new Error('Contract owner private key not configured');
      }

      const wallet = new ethers.Wallet(ownerPrivateKey, provider);
      const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, WordleABI, wallet);

      console.log('Contract interaction details:', {
        walletAddress,
        ciphertext: score.ciphertext,
        dataToEncryptHash: score.dataToEncryptHash,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      });
      
      // Call setScore with the user's wallet address
      const tx = await contract.setScore(
        walletAddress,  // user's wallet address
        score.ciphertext,
        score.dataToEncryptHash
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', {
        hash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      // Verify the score was set
      try {
        const savedScore = await contract.getScore(walletAddress);
        console.log('Verified saved score:', {
          ciphertext: savedScore.ciphertext,
          datatoencrypthash: savedScore.datatoencrypthash
        });
      } catch (verifyError) {
        console.warn('Could not verify saved score:', verifyError);
      }

      res.status(200).json({ 
        message: "Score submitted successfully",
        txHash: tx.hash,
        walletAddress: walletAddress
      });
    } catch (contractError) {
      console.error('Contract interaction error:', contractError);
      throw new Error(`Failed to submit score to contract: ${contractError.message}`);
    }
  } catch (error) {
    console.error("Error verifying score:", error);
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