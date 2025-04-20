const express = require('express');
const { ethers } = require('ethers');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONAD_RPC = process.env.MONAD_RPC;
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

app.use(express.static(path.join(__dirname, 'public')));

// 🧠 Listen for new blocks
let latestBlock = null;
let latestBlockTxCount = 0;
let lastBlockTime = 0;

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

// 🛠️ API Route for Latest Block
app.get('/latestblock', (req, res) => {
  if (latestBlock !== null) {
    res.json({ latestBlock, transactions: latestBlockTxCount });
  } else {
    res.status(404).send('No blocks received yet');
  }
});

// 🛠️ New API Route for Searching by Hash or Address
app.get('/search/:query', async (req, res) => {
  const query = req.params.query;

  try {
    let txData;
    if (ethers.utils.isAddress(query)) {
      // Fetch all transactions from the address (basic example, could be improved)
      txData = await provider.getHistory(query);
    } else if (ethers.utils.isHexString(query)) {
      // Fetch transaction details by hash
      txData = await provider.getTransaction(query);
    } else {
      return res.status(400).send('Invalid address or hash');
    }

    if (txData) {
      // Fetch the block information
      const block = await provider.getBlock(txData.blockNumber);
      res.json({
        transaction: txData,
        block: block,
      });
    } else {
      res.status(404).send('Transaction or address not found');
    }
  } catch (err) {
    res.status(500).send('Error fetching data: ' + err.message);
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
