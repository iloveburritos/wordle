export const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/94961/wordl31155v2/v0.0.1/graphql';

if (!SUBGRAPH_URL) {
  throw new Error('NEXT_PUBLIC_SUBGRAPH_URL is not defined in environment variables');
} 