import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { ethers } from "ethers";
import { LitNetwork } from "@lit-protocol/constants";
import { AccessControlConditions } from "@lit-protocol/types";
//import { decryptToString } from "@lit-protocol/encryption";
import {
  LitAbility,
  LitAccessControlConditionResource,
  createSiweMessageWithRecaps,
  generateAuthSig,
} from "@lit-protocol/auth-helpers";

export const genJWT = async (
    wallet: ethers.Signer,
    chain: string,
  ) => {
    let litNodeClient: LitNodeClient;
  
    try {
      const accessControlConditions: AccessControlConditions = [
        {
          contractAddress: '0x7e1676B4A9dF0B27A70614B9A8058e289872071c',
          standardContractType: 'ERC721',
          chain: 'baseSepolia',
          method: 'balanceOf',
          parameters: [
            ':userAddress'
          ],
          returnValueTest: {
            comparator: '>',
            value: '0'
          }
        }
      ];
      console.log("🔄 Connecting to Lit network...");
      litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.Cayenne,
        debug: false,
      });
      await litNodeClient.connect();
      console.log("✅ Connected to Lit network");
  
      console.log("🔄 Getting EOA Session Sigs...");
      const expiration = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour
      const sessionSigs = await litNodeClient.getSessionSigs({
        chain,
        expiration,
        resourceAbilityRequests: [
          {
            resource: new LitAccessControlConditionResource("*"),
            ability: LitAbility.AccessControlConditionSigning,
          },
        ],
        authNeededCallback: async ({
          resourceAbilityRequests,
          expiration,
          uri,
        }) => {
        const nonce = await litNodeClient.getLatestBlockhash();
        const walletAddress = await wallet.getAddress();  
        const toSign = await createSiweMessageWithRecaps({
            uri: uri!,
            expiration: expiration!,
            resources: resourceAbilityRequests!,
            walletAddress,
            nonce,
            litNodeClient,
          });
  
          return await generateAuthSig({
            signer: wallet,
            toSign,
          });
        },
      });
      console.log("✅ Got EOA Session Sigs");
  
      console.log("🔄 Generating JWT");
      const jwt = await litNodeClient.getSignedToken({
        accessControlConditions,
        chain,
        sessionSigs,
      });
  
      console.log("✅ Generated JWT");
      console.log(jwt);
      return jwt;
    } catch (error) {
      console.error(error);
    } finally {
      litNodeClient!.disconnect();
    }
  };