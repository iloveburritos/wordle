// lib/provider.ts

import { ethers } from "ethers";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
console.log("RPC URL:", rpcUrl); // Debugging: Check if the RPC URL is loaded correctly

if (!rpcUrl) {
    throw new Error("RPC_URL is not defined in the environment variables.");
}

const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

export default provider;