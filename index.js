const express = require('express');
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (like index.html) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Connect to Monad RPC
const MONAD_RPC = process.env.MONAD_RPC;
if (!MONAD_RPC) {
  console.error("❌ MONAD_RPC is not set in .env");
  process.exit(1);
}
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// Track the latest block and tx count
let latestBlock = null;
let latestBlockTxCount = 0;
let lastBlockTime = 0;

// 🧠 Listen for new blocks
provider.on('block', async (blockNumber) => {
  const now = Date.now();
  if (now - lastBlockTime < 500) return; // avoid spammy updates

  try {
    const block = await provider.getBlock(blockNumber);
    latestBlock = blockNumber;
    latestBlockTxCount = block.transactions.length;
    lastBlockTime = now;
    console.log(`📦 Block ${blockNumber} with ${latestBlockTxCount} txs`);
  } catch (err) {
    console.error('❌ Error fetching block:', err.message);
  }
});

// 🛠️ API route for frontend to fetch latest block info
app.get('/latestblock', (req, res) => {
  if (latestBlock !== null) {
    res.json({ latestBlock, transactions: latestBlockTxCount });
  } else {
    res.status(404).send('No blocks received yet');
  }
});

// 🌐 Catch-all: serve index.html for any other route
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// ✅ Test RPC connection once at startup
provider.getBlockNumber()
  .then((n) => console.log(`✅ Connected to RPC! Current Block: ${n}`))
  .catch((err) => {
    console.error('❌ RPC connection error:', err.message);
    process.exit(1);
  });

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
