// DOM Elements
const connectionStatus = document.getElementById('connection-status');
const latestBlock = document.getElementById('latest-block');
const latestTxCount = document.getElementById('latest-tx-count');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const resultsContainer = document.getElementById('results-container');

// State
let currentBlock = { number: 0, txs: 0 };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchLatestBlock();
  setupEventListeners();
  startLiveUpdates();
});

// Event Listeners
function setupEventListeners() {
  refreshBtn.addEventListener('click', () => fetchLatestBlock(false, true));
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleSearch());
}

// Live Updates (Polling)
function startLiveUpdates() {
  setInterval(() => fetchLatestBlock(true), 5000); // Update every 5s
}

// Fetch Latest Block
async function fetchLatestBlock(silent = false, force = false) {
  if (!silent) {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';
  }

  try {
    const response = await fetch('/latestblock');
    if (!response.ok) throw new Error('Network error');
    
    const { success, latestBlock, transactions, uiMessage, error } = await response.json();
    if (error) throw new Error(uiMessage);

    // Only update UI if block changed or forced
    if (force || latestBlock !== currentBlock.number) {
      currentBlock = { number: latestBlock, txs: transactions };
      latestBlock.textContent = `Block #${latestBlock}`;
      latestTxCount.textContent = `Transactions: ${transactions}`;
      connectionStatus.textContent = '✅ Connected';
      if (uiMessage) console.log(uiMessage); // Optional: log server messages
    }
  } catch (error) {
    connectionStatus.textContent = '❌ Disconnected';
    if (!silent) showError(error.message);
  } finally {
    if (!silent) {
      refreshBtn.disabled = false;
      refreshBtn.textContent = 'Refresh';
    }
  }
}

// Handle Search
async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) {
    showError('Please enter an address or transaction hash');
    return;
  }

  showLoading();
  errorMessage.style.display = 'none';

  try {
    const response = await fetch(`/search/${query}`);
    const { success, data, uiMessage, error } = await response.json();
    
    if (error) throw new Error(uiMessage);
    displayResults(data, uiMessage);
  } catch (error) {
    showError(error.message);
    resultsContainer.innerHTML = '';
  }
}

// Display Results
function displayResults(data, message) {
  resultsContainer.innerHTML = `
    <div class="result-header">
      <h3>${message}</h3>
      <p>Mined in Block #${data.block.number}</p>
    </div>
    ${data.transactions.map(tx => `
      <div class="transaction-card">
        <p><strong>Hash:</strong> ${tx.hash}</p>
        <p><strong>From:</strong> ${tx.from}</p>
        ${tx.to ? `<p><strong>To:</strong> ${tx.to}</p>` : ''}
        <p><strong>Value:</strong> ${ethers.formatEther(tx.value)} MONAD</p>
        <p><strong>Gas:</strong> ${tx.gasLimit.toString()}</p>
      </div>
    `).join('')}
  `;
}

// UI Helpers
function showLoading() {
  resultsContainer.innerHTML = '<div class="loading">🔍 Searching blockchain...</div>';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}