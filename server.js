const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS for local frontend testing
app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database('./orders.db');

// Create orders table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    mobile TEXT,
    email TEXT,
    state TEXT,
    city TEXT,
    address TEXT,
    items TEXT,
    subtotal REAL,
    minOrder REAL,
    packing REAL,
    roundoff REAL,
    overall REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Save order endpoint
app.post('/api/order', (req, res) => {
  const {
    name, mobile, email, state, city, address,
    items, subtotal, minOrder, packing, roundoff, overall
  } = req.body;

  db.run(
    `INSERT INTO orders (name, mobile, email, state, city, address, items, subtotal, minOrder, packing, roundoff, overall)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name, mobile, email, state, city, address,
      JSON.stringify(items), subtotal, minOrder, packing, roundoff, overall
    ],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, orderId: this.lastID });
      }
    }
  );
});

// Admin panel: get all orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});