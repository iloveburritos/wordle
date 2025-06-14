# Wordl3 Setup and Debugging Guide

## 🚨 Critical Issues Found

Based on the console errors and debugging, here are the main issues preventing your app from working:

### 1. **Missing Environment Variables**
All required environment variables are missing. You need to set up:

**Frontend (.env.local in project root):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS
NEXT_PUBLIC_PRIVY_APP_ID=YOUR_PRIVY_APP_ID
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/94961/wordl31155v2/v0.0.1/graphql
NEXT_PUBLIC_WEBSITE_URL=http://localhost:3000
```

**Backend (server/.env.local):**
```bash
PRIVY_APP_ID=YOUR_PRIVY_APP_ID
PRIVY_APP_SECRET=YOUR_PRIVY_APP_SECRET
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS
CONTRACT_OWNER_PRIVATE_KEY=YOUR_PRIVATE_KEY
JWT_SECRET=YOUR_JWT_SECRET
SUBGRAPH_URL=https://api.studio.thegraph.com/query/94961/wordl31155v2/version/latest
FRONTEND_URL=http://localhost:3000
```

### 2. **Inactive Alchemy API Key**
Your Alchemy app is inactive (403 Forbidden errors). You need to:
1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Check if your app is active
3. If inactive, either reactivate it or create a new app
4. Update your RPC URLs with the new API key

### 3. **Backend Server Not Running**
The Heroku app `wordl3-server.herokuapp.com` is not accessible.

## 🔧 Step-by-Step Fix

### Step 1: Fix Alchemy API Key
1. Visit [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Create a new app or reactivate existing one
3. Copy the Base Sepolia RPC URL
4. Update your environment variables

### Step 2: Set Up Environment Variables
1. Create `.env.local` in project root with frontend variables
2. Create `server/.env.local` with backend variables
3. Replace all `YOUR_*` placeholders with actual values

### Step 3: Start Backend Server Locally
```bash
cd server
npm install
node server.js
```

### Step 4: Test Connectivity
```bash
npm run debug
```

### Step 5: Start Frontend
```bash
npm run dev
```

## 🐛 Debugging Commands

### Test API Connectivity
```bash
npm run debug
```

### Check Environment Variables
```bash
node -e "console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)"
```

### Test Backend Health
```bash
curl http://localhost:3001/health
```

## 📋 Required Services

1. **Alchemy** - For blockchain RPC endpoints
2. **Privy** - For wallet authentication
3. **The Graph** - For subgraph queries
4. **Heroku** (optional) - For backend deployment

## 🔍 Common Error Solutions

### CORS Errors
- ✅ Fixed in server.js with proper CORS configuration
- Make sure FRONTEND_URL is set correctly

### 403 Forbidden (Alchemy)
- Reactivate or recreate your Alchemy app
- Update RPC URLs with new API key

### 404 Not Found (API)
- Backend server not running
- Start with `cd server && node server.js`

### "Failed to fetch" Errors
- Check NEXT_PUBLIC_API_URL is set correctly
- Ensure backend server is running
- Verify CORS configuration

## 🚀 Production Deployment

For production, update environment variables:
- `NEXT_PUBLIC_API_URL` to your deployed backend URL
- `NEXT_PUBLIC_WEBSITE_URL` to your frontend domain
- Deploy backend to Heroku or similar service

## 📞 Need Help?

1. Run `npm run debug` to test connectivity
2. Check browser console for specific error messages
3. Verify all environment variables are set
4. Ensure backend server is running 