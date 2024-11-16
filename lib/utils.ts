// lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ethers } from "ethers"
import { ethProvider} from "@/lib/provider" 

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export async function resolveAddress(identifier: string): Promise<string> {
  if (identifier.endsWith(".eth")) {
    try {
      const resolvedAddress = await ethProvider.resolveName(identifier)
      if (!resolvedAddress) {
        throw new Error(`Could not resolve ${identifier}`)
      }
      return resolvedAddress
    } catch (error) {
      console.error(`Error resolving ENS name: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error("ENS resolution failed")
    }
  }

  if (ethers.utils.isAddress(identifier)) {
    return identifier
  }

  throw new Error("Invalid identifier format")
}