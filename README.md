This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install all relevant packages:


npm install


Second, you'll need the following environment variables for the front-end:


NEXT_PUBLIC_PRIVY_APP_ID

NEXT_PUBLIC_PRIVY_CLIENT_ID

NEXT_PUBLIC_BASE_RPC_URL

NEXT_PUBLIC_ETH_RPC_URL

NEXT_PUBLIC_CONTRACT_ADDRESS

NEXT_PUBLIC_API_URL

CONTRACT_OWNER_PRIVATE_KEY

Third, run the front-end:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.


Before playing the game, you also need to start the express server:


cd server

npm install

node server.js


You will need the same environment variables for the express server.


Read more here: public/Wordl3 Overview.pdf
