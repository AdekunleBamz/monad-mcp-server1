const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Alchemy RPC setup
const MONAD_RPC = 'https://monad-testnet.g.alchemy.com/v2/acJ8L47AMO3Z3rdE6am-qRh2jjvjL4dM';
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// ⏱️ Delay utility
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🔒 To prevent overlapping block events
let isProcessing = false;

// 🧠 MCP Listener for new blocks with 500ms delay
provider.on('block', async (blockNumber) => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    console.log(`🧱 New block received: ${blockNumber}`);

    const block = await provider.getBlock(blockNumber);
    console.log(`📦 Block ${blockNumber} has ${block.transactions.length} transactions`);
  } catch (error) {
    console.error(`❌ Error fetching block ${blockNumber}:`, error);
  }

  await delay(500);
  isProcessing = false;
});

// 🚀 Basic server endpoint
app.get('/', (req, res) => {
  res.send('🚀 Monad MCP Server with Alchemy RPC listener is running!');
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
