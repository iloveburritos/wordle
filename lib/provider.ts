// lib/provider.ts

import { ethers } from "ethers";

const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const ethRpcUrl = process.env.NEXT_PUBLIC_ETH_RPC_URL;
console.log("RPC URL:", baseRpcUrl, ethRpcUrl); // Debugging: Check if the RPC URL is loaded correctly

if (!baseRpcUrl || !ethRpcUrl) {
    throw new Error("RPC_URL is not defined in the environment variables.");
}

export const baseProvider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
export const ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
