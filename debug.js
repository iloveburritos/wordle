// Debug script to test API connectivity and environment variables
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wordl3-server-14ba565fcb76.herokuapp.com/';

// Remove trailing slash if present to avoid double slashes
const cleanApiUrl = API_URL.replace(/\/$/, '');

async function testAPI() {
  console.log('🔍 Testing API connectivity...');
  console.log('API URL:', cleanApiUrl);
  
  try {
    // Test health endpoint
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${cleanApiUrl}/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    } else {
      console.log('Health check failed');
    }
    
    // Test generate-nonce endpoint
    console.log('\n2. Testing generate-nonce endpoint...');
    const nonceResponse = await fetch(`${cleanApiUrl}/generate-nonce`);
    console.log('Nonce status:', nonceResponse.status);
    
    if (nonceResponse.ok) {
      const nonceData = await nonceResponse.json();
      console.log('Nonce data received:', !!nonceData.token);
    } else {
      const errorText = await nonceResponse.text();
      console.log('Nonce error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔍 Testing environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_BASE_RPC_URL',
    'NEXT_PUBLIC_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_PRIVY_APP_ID'
  ];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
    if (value) {
      console.log(`  Value: ${value.substring(0, 20)}...`);
    }
  }
}

async function main() {
  console.log('🚀 Starting Wordl3 Debug Script\n');
  
  await testEnvironmentVariables();
  await testAPI();
  
  console.log('\n✅ Debug script completed');
}

main().catch(console.error); 