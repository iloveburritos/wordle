import express from "express";
import { ethers  } from "ethers";
import { WordleABI } from "./public/contractABI.mjs"; // Adjust the path to match your project structure
import dotenv from "dotenv";
import cors from "cors"; // Import the CORS middleware
import { customAlphabet } from "nanoid"; // Use customAlphabet to specify characters
import jwt from "jsonwebtoken"; // Import jsonwebtoken library
import { SiweMessage } from "siwe"; // Import SIWE library

dotenv.config({ path: './.env.local' });

const app = express();

// Enable CORS middleware
app.use(cors());

app.use(express.json()); // Middleware to parse JSON request bodies

// POST endpoint to mint NFTs
app.post("/mint", async (req, res) => {
  try {
    const { 
      walletAddresses, 
      tokenId, 
      data, 
      message, 
      signature, 
      token,
      senderAddress 
    } = req.body;

    // 1. Verify JWT token
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid JWT token" });
    }

    // 2. Verify SIWE message
    const siweMessage = new SiweMessage(message);
    const verification = await siweMessage.verify({ signature });
    
    if (!verification.success || verification.data.address !== senderAddress) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 3. Verify sender is member of the group
    const provider = new ethers.JSONRpcProvider(process.env.BASE_RPC_URL);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      WordleABI,
      provider
    );
    
    const senderBalance = await contract.balanceOf(senderAddress, tokenId);
    if (senderBalance.eq(0)) {
      return res.status(403).json({ error: "Sender is not a member of this group" });
    }

    // 4. Process minting for each address
    const wallet = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY, provider);
    const contractWithSigner = contract.connect(wallet);
    
    const results = [];
    for (const address of walletAddresses) {
      try {
        const balance = await contract.balanceOf(address, tokenId);
        if (balance.gt(0)) {
          results.push({
            address,
            status: 'skipped',
            message: 'Address already has an NFT'
          });
          continue;
        }

        const tx = await contractWithSigner.mint(
          address,
          tokenId,
          "0x",
          {
            gasLimit: ethers.utils.hexlify(500000),
            maxFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei")
          }
        );

        await tx.wait();
        results.push({
          address,
          status: 'success',
          txHash: tx.hash
        });
      } catch (error) {
        results.push({
          address,
          status: 'error',
          error: error.message
        });
      }
    }

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Minting error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred"
    });
  }
});

const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/94961/wordl31155v2/version/latest';

if (!SUBGRAPH_URL) {
  throw new Error('SUBGRAPH_URL is not defined in environment variables');
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

    res.status(200).json({ 
      token,
      nonce
    });
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
      const provider = new ethers.JSONRpcProvider(process.env.BASE_RPC_URL);
      console.log("PROVIDER: ", provider);
      console.log("BASE_RPC_URL: ", process.env.BASE_RPC_URL);
      const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
      
      if (!ownerPrivateKey) {
        throw new Error('Contract owner private key not configured');
      }

      const wallet = new ethers.Wallet(ownerPrivateKey, provider);
      const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, WordleABI, wallet);

      console.log('Contract interaction details:', {
        walletAddress,
        ciphertext: score.ciphertext,
        dataToEncryptHash: score.dataToEncryptHash,
        contractAddress: process.env.CONTRACT_ADDRESS
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

// POST endpoint to create a new group
app.post("/create-group", async (req, res) => {
  try {
    const { walletAddress, message, signature, token } = req.body;

    console.log("Received create-group request:", { walletAddress, message });

    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    try {
      jwt.verify(token, secret);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ error: "Invalid JWT" });
    }

    // Verify SIWE message
    const siweMessage = new SiweMessage(message);
    const verification = await siweMessage.verify({ signature });

    if (!verification.success) {
      console.error("SIWE verification failed:", verification);
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Set up contract interaction
    const provider = new ethers.JSONRpcProvider(process.env.BASE_RPC_URL);
    const ownerPrivateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!ownerPrivateKey || !contractAddress) {
      throw new Error('Missing required environment variables');
    }

    console.log("Setting up contract interaction with address:", contractAddress);

    const wallet = new ethers.Wallet(ownerPrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, WordleABI, wallet);

    // Register as minter and get tokenId
    console.log("Calling registerMinter...");
    const registerTx = await contract.registerMinter({
      gasLimit: 500000,
      maxFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
      maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei")
    });
    
    console.log("Waiting for registerMinter transaction:", registerTx.hash);
    const registerReceipt = await registerTx.wait();
    console.log("RegisterMinter receipt received:", registerReceipt);

    const newGroupEvent = registerReceipt.events?.find(
      (event) => event.event === 'NewGroup'
    );

    if (!newGroupEvent) {
      console.error("No NewGroup event in receipt. Events:", registerReceipt.events);
      throw new Error('NewGroup event not found in transaction receipt');
    }

    const tokenId = newGroupEvent.args.tokenId.toString();
    console.log("New group created with tokenId:", tokenId);

    // Register server wallet as an allowed minter for this tokenId
    console.log("Registering server as minter for tokenId:", tokenId);
    const allowMinterTx = await contract.setApprovalForAll(wallet.address, true);
    await allowMinterTx.wait();
    console.log("Server registered as minter for tokenId:", tokenId);

    // Mint token for the creator
    console.log("Minting token for creator:", walletAddress);
    const mintTx = await contract.mint(
      walletAddress, 
      tokenId, 
      "0x",
      {
        gasLimit: 500000,
        maxFeePerGas: ethers.utils.parseUnits("1.5", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei")
      }
    );
    
    console.log("Waiting for mint transaction:", mintTx.hash);
    const mintReceipt = await mintTx.wait();
    console.log("Mint receipt received:", mintReceipt);

    return res.status(200).json({
      success: true,
      tokenId: tokenId,
      creatorAddress: walletAddress,
      mintTxHash: mintTx.hash
    });

  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred"
    });
  }
});

// Add this endpoint
app.post("/api/mint", async (req, res) => {
  try {
    const { 
      walletAddresses, 
      tokenId, 
      message, 
      signature, 
      token,
      senderAddress 
    } = req.body;

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET);

    // Verify SIWE message
    const siweMessage = new SiweMessage(message);
    const verification = await siweMessage.verify({ signature });
    
    if (!verification.success || verification.data.address !== senderAddress) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Verify sender is member of the group
    const provider = new ethers.JSONRpcProvider(process.env.BASE_RPC_URL);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      WordleABI,
      provider
    );
    
    const senderBalance = await contract.balanceOf(senderAddress, tokenId);
    if (senderBalance.eq(0)) {
      return res.status(403).json({ error: "Sender is not a member of this group" });
    }

    // Process minting for each address
    const wallet = new ethers.Wallet(process.env.CONTRACT_OWNER_PRIVATE_KEY, provider);
    const contractWithSigner = contract.connect(wallet);
    
    const results = [];
    for (const address of walletAddresses) {
      try {
        const balance = await contract.balanceOf(address, tokenId);
        if (balance.gt(0)) {
          results.push({
            address,
            status: 'skipped',
            message: 'Address already has an NFT'
          });
          continue;
        }

        const tx = await contractWithSigner.mint(address, tokenId, "0x");
        await tx.wait();
        
        results.push({
          address,
          status: 'success',
          txHash: tx.hash
        });
      } catch (error) {
        results.push({
          address,
          status: 'error',
          error: error.message
        });
      }
    }

    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Minting error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred"
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3001; // Heroku sets PORT dynamically
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});