const express = require('express');
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Alchemy RPC setup
const MONAD_RPC = process.env.MONAD_RPC;
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// MCP Block data
let latestBlock = null;
let latestBlockTxCount = 0;
let lastBlockTime = 0;

// 🧠 Listen for new blocks
provider.on('block', async (blockNumber) => {
  const now = Date.now();
  if (now - lastBlockTime < 500) return;

  try {
    const block = await provider.getBlock(blockNumber);
    latestBlock = blockNumber;
    latestBlockTxCount = block.transactions.length;
    lastBlockTime = now;
    console.log(`📦 Block ${blockNumber}: ${latestBlockTxCount} txs`);
  } catch (err) {
    console.error('Error fetching block:', err.message);
  }
});

// 🛠️ API Route
app.get('/latestblock', (req, res) => {
  if (latestBlock !== null) {
    res.json({ latestBlock, transactions: latestBlockTxCount });
  } else {
    res.status(404).send('No blocks received yet');
  }
});

// 🌐 Fallback route for frontend
app.use((req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });  

// ✅ Test connection on startup
provider.getBlockNumber()
  .then((n) => console.log(`✅ Connected to RPC! Current Block: ${n}`))
  .catch((err) => console.error('RPC error:', err.message));

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
