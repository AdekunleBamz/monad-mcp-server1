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
if (!MONAD_RPC) throw new Error('Missing MONAD_RPC in .env');
const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// API Endpoints
app.get('/latestblock', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    res.json({
      success: true,
      latestBlock: blockNumber,
      transactions: block?.transactions?.length || 0,
      uiMessage: `Current block: #${blockNumber}`
    });
  } catch (err) {
    console.error('Block fetch error:', err);
    res.status(500).json({
      error: true,
      uiMessage: 'Failed to fetch block data',
      message: err.message
    });
  }
});

app.get('/search/:query', async (req, res) => {
  const query = req.params.query.trim();

  // Validate input format
  if (!/^0x[a-fA-F0-9]{40,64}$/.test(query)) {
    return res.status(400).json({
      error: true,
      uiMessage: 'Invalid format. Use: 0x... (address or hash)'
    });
  }

  try {
    let result;
    if (ethers.isAddress(query)) {
      // Address search
      result = await provider.getHistory(query);
      if (!result.length) {
        return res.status(404).json({
          error: true,
          uiMessage: 'No transactions found for this address'
        });
      }
    } else {
      // Transaction hash search
      result = await provider.getTransaction(query);
      if (!result) {
        return res.status(404).json({
          error: true,
          uiMessage: 'Transaction not found'
        });
      }
      result = [result]; // Convert to array for consistent handling
    }

    // Get block data for the first transaction
    const block = await provider.getBlock(result[0].blockNumber);
    
    res.json({
      success: true,
      data: {
        transactions: result,
        block
      },
      uiMessage: `Found ${result.length} transaction(s)`
    });

  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({
      error: true,
      uiMessage: 'Network error. Try again later',
      message: err.message
    });
  }
});

// Serve frontend
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start server
provider.getBlockNumber()
  .then(n => console.log(`✅ Connected to Monad RPC. Current block: ${n}`))
  .catch(err => console.error('RPC connection failed:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});