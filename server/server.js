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

async function runGraphQueryForWallet(walletAddress) {
  const url = 'https://api.studio.thegraph.com/query/94961/worldv4/version/latest';
  const query = `
    query Subgraphs($walletAddress: String!) {
      newUsers(where: { userAddress: $walletAddress }) {
        id
        tokenId
        userAddress
      }
    }
  `;

  console.log(`Running GraphQL query for wallet ${walletAddress}`);
  const variables = {
    walletAddress: walletAddress.toLowerCase(), // Ensure case-insensitivity
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: query,
      variables: variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL query failed with status ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error(`GraphQL query errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data.newUsers;
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

    console.log(`Score received: ${score}`);

    // Extract the wallet address from the SIWE message
    const walletAddress = siweMessage.address;
    const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!baseRpcUrl || !contractAddress) {
      throw new Error("Missing required environment variables for contract interaction.");
    }

    // Interact with the smart contract to check balance
    const provider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
    const contract = new ethers.Contract(contractAddress, WordleABI, provider);

    let balance;
    try {
      balance = await contract.balanceOf(walletAddress);
      console.log(`Balance for wallet ${walletAddress}: ${balance.toString()}`);
    } catch (err) {
      console.error("Error fetching balance from contract:", err.message);
      return res.status(500).json({ error: "Failed to check wallet balance" });
    }

    // Verify that the balance is greater than 0
    if (balance.isZero()) {
      console.error("Wallet does not hold any tokens.");
      return res.status(403).json({ error: "Wallet does not hold the required tokens" });
    }

    // RUN THE GRAPH QUERY HERE
    let tokenId;
    try {
      const graphResult = await runGraphQueryForWallet(walletAddress);
      console.log(`GraphQL query result for wallet ${walletAddress}:`, graphResult);
      tokenId = graphResult[0].tokenId;
      console.log(`Token ID for wallet ${walletAddress}: ${tokenId}`);
    } catch (error) {
      console.error("Error running GraphQL query:", error.message);
      return res.status(500).json({ error: "Failed to fetch data from The Graph" });
    }

    // create ethers wallet using process.env.CONTRACT_OWNER_PRIVATE_KEY
    const privateKey = process.env.CONTRACT_OWNER_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);

    // connect to the contract using the wallet
    const contractWithSigner = contract.connect(wallet);

    // call the setScore function on the contract
    const tx = await contractWithSigner.setUserScore(tokenId, score.ciphertext, score.dataToEncryptHash);
    console.log(`Transaction sent for wallet ${walletAddress}: ${tx.hash}`);
    await tx.wait();

    // Return success response if everything is verified
    return res.status(200).json({
      success: true,
      message: "Score and signature verified successfully",
    });
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