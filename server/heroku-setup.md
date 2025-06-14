# Heroku Environment Variables Setup

After creating your Heroku app, set these environment variables:

## Set Environment Variables on Heroku

```bash
# Replace 'your-wordl3-server' with your actual app name
heroku config:set PRIVY_APP_ID=your_privy_app_id -a your-wordl3-server
heroku config:set PRIVY_APP_SECRET=your_privy_app_secret -a your-wordl3-server
heroku config:set BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your_alchemy_key -a your-wordl3-server
heroku config:set ETH_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key -a your-wordl3-server
heroku config:set CONTRACT_ADDRESS=your_contract_address -a your-wordl3-server
heroku config:set CONTRACT_OWNER_PRIVATE_KEY=your_private_key -a your-wordl3-server
heroku config:set JWT_SECRET=your_jwt_secret -a your-wordl3-server
heroku config:set SUBGRAPH_URL=https://api.studio.thegraph.com/query/94961/wordl31155v2/version/latest -a your-wordl3-server
heroku config:set FRONTEND_URL=https://wordl3.com -a your-wordl3-server
```

## Verify Environment Variables

```bash
heroku config -a your-wordl3-server
```

## Deploy to Heroku

```bash
git push heroku main
```

## Check Logs

```bash
heroku logs --tail -a your-wordl3-server
```

## Test Your App

```bash
heroku open -a your-wordl3-server
```

## Update Frontend Environment Variable

Once deployed, update your frontend `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-wordl3-server.herokuapp.com
``` 