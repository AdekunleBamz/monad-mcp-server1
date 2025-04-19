const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Alchemy RPC setup
const MONAD_RPC = 'https://monad-testnet.g.alchemy.com/v2/acJ8L47AMO3Z3rdE6am-qRh2jjvjL4dM';
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// Variable to store the latest block number and transaction count
let latestBlock = null;
let latestBlockTxCount = 0;  // Store transaction count for the latest block

// 🧠 MCP Listener for new blocks with rate limiting (500ms delay)
let lastBlockTime = 0;  // Store the timestamp of the last block processed

provider.on('block', async (blockNumber) => {
  const currentTime = Date.now();

  // Apply the rate limit (500ms delay)
  if (currentTime - lastBlockTime < 500) {
    return;  // Skip this block if it's too soon (less than 500ms)
  }

  console.log(`🧱 New block received: ${blockNumber}`);
  latestBlock = blockNumber;  // Update the latest block number

  const block = await provider.getBlock(blockNumber);
  latestBlockTxCount = block.transactions.length;  // Get the number of transactions in this block
  console.log(`📦 Block ${blockNumber} has ${latestBlockTxCount} transactions`);

  lastBlockTime = currentTime;  // Update the last block time
});

// 🚀 Basic server endpoint
app.get('/', (req, res) => {
  res.send('🚀 Monad MCP Server with Alchemy RPC listener is running!');
});

// 🚀 Latest block endpoint (with transaction count)
app.get('/latestblock', (req, res) => {
  if (latestBlock !== null) {
    res.json({ 
      latestBlock, 
      transactions: latestBlockTxCount 
    });
  } else {
    res.status(404).send('No blocks received yet');
  }
});

// Check connection with Alchemy RPC on start
provider.getBlockNumber()
  .then((blockNumber) => {
    console.log(`Connected to Alchemy RPC successfully! Current Block Number: ${blockNumber}`);
  })
  .catch((error) => {
    console.error('Error connecting to Alchemy RPC:', error);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
