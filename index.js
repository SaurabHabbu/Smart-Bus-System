const express = require('express');
const mysql = require('mysql');

const app = express();

// MySQL database configuration
const connection = mysql.createConnection({
  host: '34.93.119.64',
  user: 'root',
  password: 'root123',
  database: 'bustrack'
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database: ', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

// API route to get a specific parameter
app.get('/',(req,res) => {
    res.send("hi");
});
app.get('/:rfidno', (req, res) => {
  const rfidno = req.params.rfidno;
  const sql = `SELECT * FROM register WHERE rfidno = '${rfidno}' `;

  connection.query(sql, (err, result) => {
    if (err) {
      console.error('Error executing MySQL query: ', err);
      res.status(500).send('Error executing MySQL query');
      return;
    }
    res.send(true);
  });
});

// Start the server
const hostname = '0.0.0.0'
const port = 3000;
app.listen(port,hostname, () => {
  console.log(`Server is running on port ${port}`);
});