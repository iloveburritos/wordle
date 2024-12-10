// lib/provider.ts

import { ethers } from "ethers";
import { WordleABI } from "../public/contractABI.mjs";

const baseRpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const ethRpcUrl = process.env.NEXT_PUBLIC_ETH_RPC_URL;
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

console.log("RPC URL:", baseRpcUrl, ethRpcUrl); // Debugging: Check if the RPC URL is loaded correctly

if (!baseRpcUrl || !ethRpcUrl) {
    throw new Error("RPC_URL is not defined in the environment variables.");
}

if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS is not defined in the environment variables.");
}

export const baseProvider = new ethers.providers.JsonRpcProvider(baseRpcUrl);
export const ethProvider = new ethers.providers.JsonRpcProvider(ethRpcUrl);

export const getContract = (signerOrProvider = baseProvider) => {
    return new ethers.Contract(contractAddress, WordleABI, signerOrProvider);
};
