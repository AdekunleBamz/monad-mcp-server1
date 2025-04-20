const express = require('express');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const MONAD_RPC = process.env.MONAD_RPC || 'https://monad-testnet.g.alchemy.com/v2/your-key-here';

let provider;
let latestBlock = null;
let latestBlockTxCount = 0;
let lastBlockTime = 0;

function startBlockListener() {
  provider = new ethers.JsonRpcProvider(MONAD_RPC);

  provider.on('block', async (blockNumber) => {
    const currentTime = Date.now();
    if (currentTime - lastBlockTime < 500) return;

    try {
      console.log(`🧱 New block: ${blockNumber}`);
      latestBlock = blockNumber;

      const block = await provider.getBlock(blockNumber);
      latestBlockTxCount = block.transactions.length;
      console.log(`📦 Block ${blockNumber} has ${latestBlockTxCount} txs`);

      lastBlockTime = currentTime;
    } catch (err) {
      console.error('Error processing block:', err.message);
    }
  });

  provider._websocket?.on('close', (code) => {
    console.error(`❌ WebSocket closed with code ${code}. Reconnecting in 3s...`);
    retryConnection();
  });

  provider._websocket?.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
    retryConnection();
  });

  provider.getBlockNumber()
    .then(blockNumber => {
      console.log(`✅ Connected to Monad RPC! Current block: ${blockNumber}`);
    })
    .catch(err => {
      console.error('❌ Failed to connect:', err.message);
      retryConnection();
    });
}

function retryConnection() {
  // Clear all existing listeners and retry after 3s
  if (provider) provider.removeAllListeners();
  setTimeout(() => {
    console.log('🔄 Retrying connection...');
    startBlockListener();
  }, 3000);
}

// Start listener
startBlockListener();

// HTTP Routes
app.get('/', (req, res) => {
    res.send(`
        <h2>🚀 Monad MCP Server is Live</h2>
        <p>This server connects to the Monad Testnet via Alchemy RPC.</p>
        <ul>
          <li>🔁 Listens for new blocks in real-time</li>
          <li>📦 Tracks the latest block number and its transaction count</li>
          <li>🧠 Powered by Node.js, Express, and Ethers.js</li>
          <li>🌐 API Endpoint: <code>/latestblock</code> returns JSON data with block number and transaction count</li>
        </ul>
        <p>Use this server to fetch up-to-date data from the Monad blockchain. Ideal for integrations, dashboards, and block explorers.</p>
      `);      
});

app.get('/latestblock', (req, res) => {
  if (latestBlock !== null) {
    res.json({ latestBlock, transactions: latestBlockTxCount });
  } else {
    res.status(404).send('No blocks yet.');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
});
