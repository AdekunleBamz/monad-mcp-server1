require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const path = require('path');
const net = require('net');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// Security Configuration
// ======================

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, uiMessage: "Too many requests" }
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// Apply security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.ethers.org", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// ======================
// Middleware Configuration
// ======================
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Improved CORS - Restrict to your domain in production
app.use((req, res, next) => {
  // In production, replace '*' with your actual domain
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.ALLOWED_ORIGIN || 'https://your-domain.com'] 
    : ['http://localhost:3000'];
    
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ======================
// RPC Connection Setup
// ======================
const MONAD_RPC = process.env.MONAD_RPC;
if (!MONAD_RPC) {
  console.error('‼️ Missing MONAD_RPC in .env file');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(MONAD_RPC);

// ======================
// API Endpoints
// ======================

// Health Check Endpoint (minimal information)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Latest Block Data (reduced information)
app.get('/latestblock', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    res.json({
      success: true,
      latestBlock: blockNumber,
      transactions: block?.transactions?.length || 0,
      uiMessage: `Block #${blockNumber} (${block.transactions.length} txs)`
    });
  } catch (err) {
    console.error('Block fetch error:', err);
    // Generic error, hide implementation details
    res.status(500).json({
      error: true,
      uiMessage: 'Failed to fetch block data'
    });
  }
});

// Transaction Search with improved validation
app.get('/search/:query', async (req, res) => {
  const query = req.params.query.trim();

  // Validate input format
  if (!/^0x[a-fA-F0-9]{40,64}$/.test(query)) {
    return res.status(400).json({
      error: true,
      uiMessage: '❌ Must be: 0x + 40-64 hex characters'
    });
  }

  try {
    let result;
    const isAddress = ethers.isAddress(query);

    if (isAddress) {
      result = await provider.getHistory(query);
      if (!result.length) {
        return res.status(404).json({
          error: true,
          uiMessage: '🔍 No transactions found for this address'
        });
      }
    } else {
      result = await provider.getTransaction(query);
      if (!result) {
        return res.status(404).json({
          error: true,
          uiMessage: '🔍 Transaction not found'
        });
      }
      result = [result]; // Convert to array for consistent handling
    }

    // Get block data for the first transaction
    const block = await provider.getBlock(result[0].blockNumber);
    
    // Remove sensitive information before sending
    const sanitizedTxs = result.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      blockNumber: tx.blockNumber
    }));
    
    res.json({
      success: true,
      data: {
        transactions: sanitizedTxs,
        blockNumber: block.number,
        timestamp: block.timestamp
      },
      uiMessage: `✅ Found ${result.length} ${isAddress ? 'address' : 'tx'} record(s)`
    });

  } catch (err) {
    console.error('Search error:', err);
    // Generic error message
    res.status(500).json({
      error: true,
      uiMessage: '🌐 Network error - try again'
    });
  }
});

// ======================
// Server Initialization
// ======================
let currentBlock = null;

const checkPort = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(false))
      .once('listening', () => {
        tester.close();
        resolve(true);
      })
      .listen(port);
  });
};

const startServer = async () => {
  try {
    // 1. Verify RPC connection
    currentBlock = await provider.getBlockNumber();
    console.log(`✓ RPC Connected | Block: ${currentBlock}`);

    // 2. Check port availability
    const portAvailable = await checkPort(PORT);
    if (!portAvailable) {
      throw new Error(`Port ${PORT} already in use`);
    }

    // 3. Start Express server
    app.listen(PORT, () => {
      console.log(`
      ======================
      🚀 Server Operational
      ----------------------
      Port: ${PORT}
      Environment: ${process.env.NODE_ENV || 'development'}
      ======================
      `);
    });

  } catch (err) {
    console.error('\x1b[31m', '‼️ Startup Failed:', err.message, '\x1b[0m');
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
};

// Start the server
startServer();

// ======================
// Process Handlers
// ======================
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
});