const express = require('express');
const { ethers } = require('ethers');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// RPC Connection
const MONAD_RPC = process.env.MONAD_RPC;
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// API Endpoints
app.get('/latestblock', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    res.json({
      latestBlock: blockNumber,
      transactions: block.transactions.length
    });
  } catch (err) {
    console.error('Latest block error:', err);
    res.status(500).json({ error: 'Failed to fetch block' });
  }
});

app.get('/search/:query', async (req, res) => {
  const query = req.params.query;
  
  // Input validation
  if (!query || !query.startsWith('0x') || query.length < 42) {
    return res.status(400).json({ error: 'Invalid input format' });
  }

  try {
    let txData;
    if (ethers.isAddress(query)) {
      txData = await provider.getHistory(query);
    } else if (ethers.isHexString(query)) {
      txData = await provider.getTransaction(query);
      if (!txData) return res.status(404).json({ error: 'Transaction not found' });
    } else {
      return res.status(400).json({ error: 'Invalid address or hash' });
    }

    const block = await provider.getBlock(txData.blockNumber || txData[0]?.blockNumber);
    res.json({ transaction: txData, block });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback route
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start server
provider.getBlockNumber()
  .then(n => console.log(`✅ Connected to RPC. Current block: ${n}`))
  .catch(err => console.error('RPC error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});