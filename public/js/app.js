// DOM Elements
const connectionStatus = document.getElementById('connection-status');
const latestBlock = document.getElementById('latest-block');
const latestTxCount = document.getElementById('latest-tx-count');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const resultsContainer = document.getElementById('results-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  fetchLatestBlock();
  setupEventListeners();
  startLiveUpdates();
});

// Event Listeners
function setupEventListeners() {
  refreshBtn.addEventListener('click', fetchLatestBlock);
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
}

// Live Updates
function startLiveUpdates() {
  setInterval(() => fetchLatestBlock(true), 5000); // Update every 5s
}

// Fetch Latest Block
async function fetchLatestBlock(silent = false) {
  try {
    if (!silent) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Loading...';
    }

    const response = await fetch('/latestblock');
    if (!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    updateBlockUI(data);
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
    showError('Please enter a search term');
    return;
  }

  try {
    resultsContainer.innerHTML = '<p>Searching...</p>';
    errorMessage.style.display = 'none';

    const response = await fetch(`/search/${query}`);
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    displayResults(data);
  } catch (error) {
    showError(error.message);
    resultsContainer.innerHTML = '';
  }
}

// Display Results
function displayResults(data) {
  resultsContainer.innerHTML = '';

  if (Array.isArray(data.transaction)) {
    // Address results
    const heading = document.createElement('h3');
    heading.textContent = `Transactions for: ${searchInput.value}`;
    resultsContainer.appendChild(heading);

    if (data.transaction.length === 0) {
      resultsContainer.innerHTML += '<p>No transactions found</p>';
      return;
    }

    data.transaction.forEach(tx => {
      resultsContainer.appendChild(createTxElement(tx));
    });
  } else {
    // Single transaction
    resultsContainer.appendChild(createTxElement(data.transaction, data.block));
  }
}

// Create Transaction Element
function createTxElement(tx, block = null) {
  const element = document.createElement('div');
  element.className = 'transaction';
  
  element.innerHTML = `
    <p><strong>Hash:</strong> ${tx.hash}</p>
    <p><strong>From:</strong> ${tx.from}</p>
    ${tx.to ? `<p><strong>To:</strong> ${tx.to}</p>` : ''}
    <p><strong>Value:</strong> ${ethers.formatEther(tx.value)} MONAD</p>
    ${block ? `<p><strong>Block:</strong> #${block.number}</p>` : ''}
  `;
  
  return element;
}

// Helpers
function updateBlockUI(data) {
  latestBlock.textContent = `Block: #${data.latestBlock}`;
  latestTxCount.textContent = `Transactions: ${data.transactions}`;
  connectionStatus.textContent = '✅ Connected';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}