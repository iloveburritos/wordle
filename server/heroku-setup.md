# Heroku Environment Variables Setup

After creating your Heroku app, set these environment variables:

## Set Environment Variables on Heroku

```bash
# Replace 'your-wordl3-server' with your actual app name
heroku config:set PRIVY_APP_ID=your_privy_app_id -a your-wordl3-server
heroku config:set PRIVY_APP_SECRET=N5s4c5dz6v7dAa8ySgEi2fjM61vpLvRkJeDazidpV9JhsCmu8HCbiXj25RKc3FMTMBHgAWGYR8Z4sdDMtmA6LEp -a wordl3-server
heroku config:set BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/L4Rh_Myxql5_39cFaK2wav7aiA12496H -a wordl3-server
heroku config:set ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/L4Rh_Myxql5_39cFaK2wav7aiA12496H -a wordl3-server
heroku config:set CONTRACT_ADDRESS=0xF55B6959Cb83294C3D54aac2a3DeCD79F7952CA2 -a wordl3-server
heroku config:set CONTRACT_OWNER_PRIVATE_KEY=1e32eac036466f9d12239b751e3e048fb68eaed3fc5f1a6c894e466985f5b987 -a wordl3-server
heroku config:set JWT_SECRET=ZoCzVWoynnr1VM3tyq4eduKPoA8S9SPDp3GpNmpGCN0= -a wordl3-server
heroku config:set SUBGRAPH_URL=https://api.studio.thegraph.com/query/94961/wordl31155v2/version/latest -a wordl3-server
heroku config:set FRONTEND_URL=https://wordl3.com -a wordl3-server
```

## Verify Environment Variables

```bash
heroku config -a wordl3-server
```

## Deploy to Heroku

```bash
git push heroku main
```

## Check Logs

```bash
heroku logs --tail -a wordl3-server
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