# # Monad MCP Server

This project is a Node.js application that listens for new blocks on the Monad blockchain testnet.

---

## 🚀 Features

- Connects to Monad Testnet via Alchemy RPC.
- Listens for new blocks in real-time.
- Logs block numbers and transaction counts.
- Serves a basic HTTP API with block information.

---

## 📦 Prerequisites

Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- Git

---

## ⚙️ Setup Instructions

### 1. Clone this repository

```bash
git clone https://github.com/adekunlebamz/monad-mcp-server.git
cd monad-mcp-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

Create a `.env` file in the root folder with the following content:

```env
MONAD_RPC=https://monad-testnet.g.alchemy.com/v2/your-alchemy-key
PORT=3000
```

📝 Replace `your-alchemy-key` with your actual API key from Alchemy.

### 4. Start the server

```bash
npm start
```

### 5. Open in your browser

- Go to http://localhost:3000 → See the welcome message
- Go to http://localhost:3000/latestblock → Get latest block number and transaction count

## 🧪 Example Response from `/latestblock`

```json
{
  "blockNumber": 123456,
  "transactionCount": 42
}
```

## 🛠 Notes

- The listener runs in real-time using `provider.on('block')`.
- The `/latestblock` API returns the most recent block number and how many transactions it had.

## 📝 License
MIT – Do whatever you want with it 🚀
