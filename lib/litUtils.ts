import { LitNodeClient } from "@lit-protocol/lit-node-client";
import {encryptString, decryptToString} from "@lit-protocol/encryption"; 
import { ethers } from "ethers";
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import { EvmContractConditions } from "@lit-protocol/types";
import {
  LitAccessControlConditionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

  export const encryptStringWithContractConditions = async (
    toEncryptString: string,
  ) => {
    let litNodeClient: LitNodeClient;
  
    try {
      const evmContractConditions: EvmContractConditions = [
          {
            contractAddress: "0x36a74dA23506e80Af8D85EfdE4A6eAB1C6cCc26c",
            functionName: "isAllowed",
            functionParams: [":userAddress"],
            functionAbi: {
              type: "function",
              stateMutability: "view",
              outputs: [
                {
                  type: "bool",
                  name: "",
                  internalType: "bool",
                },
              ],
              name: "isAllowed",
              inputs: [
                {
                  type: "address",
                  name: "wallet",
                  internalType: "address",
                },
              ],
            },
            chain: "baseSepolia",
            returnValueTest: {
              key: "",
              comparator: "=",
              value: "true",
            },
          },
        ];
  
      console.log("🔄 Connecting to Lit network...");
      litNodeClient = new LitNodeClient({
        litNetwork: LIT_NETWORK.DatilTest,
        debug: false,
      });
      await litNodeClient.connect();
      console.log("✅ Connected to Lit network");
  
      console.log("🔄 Encrypting file...");
      const { ciphertext, dataToEncryptHash } = await encryptString(
        {
          dataToEncrypt: toEncryptString,
          evmContractConditions,
        },
        litNodeClient
      );
      console.log("✅ Encrypted Successfully");
  
      return { ciphertext, dataToEncryptHash };
    } catch (error) {
      console.error(error);
    } finally {
      litNodeClient!.disconnect();
    }
  };

  export const decryptStringWithContractConditions = async (
    ciphertext: string,
    dataToEncryptHash: string,
    wallet: ethers.Signer,
    chain: string,
  ) => {
    let litNodeClient: LitNodeClient;
  
    try {
      const evmContractConditions: EvmContractConditions = [
          {
            contractAddress: "0x36a74dA23506e80Af8D85EfdE4A6eAB1C6cCc26c",
            functionName: "isAllowed",
            functionParams: [":userAddress"],
            functionAbi: {
              type: "function",
              stateMutability: "view",
              outputs: [
                {
                  type: "bool",
                  name: "",
                  internalType: "bool",
                },
              ],
              name: "isAllowed",
              inputs: [
                {
                  type: "address",
                  name: "wallet",
                  internalType: "address",
                },
              ],
            },
            chain: "baseSepolia",
            returnValueTest: {
              key: "",
              comparator: "=",
              value: "true",
            },
          },
        ];
      console.log("🔄 Connecting to Lit network...");
      litNodeClient = new LitNodeClient({
        litNetwork: LIT_NETWORK.DatilTest,
        debug: true,
      });
      await litNodeClient.connect();
      console.log("✅ Connected to Lit network");
  
      console.log("🔄 Getting EOA Session Sigs...");
      const sessionSigs = await litNodeClient.getSessionSigs({
        chain,
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
        resourceAbilityRequests: [
          {
            resource: new LitAccessControlConditionResource("*"),
            ability: LIT_ABILITY.AccessControlConditionDecryption,
          },
        ],
        authNeededCallback: async ({
          resourceAbilityRequests,
          expiration,
          uri,
        }) => {
          const toSign = await createSiweMessageWithRecaps({
            uri: uri!,
            expiration: expiration!,
            resources: resourceAbilityRequests!,
            walletAddress: await wallet.getAddress(),
            nonce: await litNodeClient.getLatestBlockhash(),
            litNodeClient,
          });
  
          return await generateAuthSig({
            signer: wallet,
            toSign,
          });
        },
      });
      console.log("✅ Got EOA Session Sigs");
  
      console.log("🔄 Decrypting to file...");
      const decryptedString = await decryptToString(
        {
          ciphertext,
          dataToEncryptHash,
          chain,
          sessionSigs,
          evmContractConditions,
        },
        litNodeClient
      );
      console.log("✅ Decrypted file");
  
      if (decryptedString) {
        console.log("🔓 Decrypted string:");
        console.log(decryptedString);
      }
      return decryptedString;
    } catch (error) {
      console.error(error);
    } finally {
      litNodeClient!.disconnect();
    }
  };