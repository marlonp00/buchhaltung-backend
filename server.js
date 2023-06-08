const express = require('express');
require('dotenv').config();
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

const config = {
  host: process.env.HOSTPOINT,
  user: process.env.HOSTPOINTUSER,
  password: process.env.HOSTPOINTPASSWORD,
  database: process.env.HOSTPOINTDATABASE,
  port: 3306
};

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());


/******* ROUTES *******/


// Login Routes

app.post('/login', (req, res) => {
  const users = JSON.parse(process.env.USERS);

  const { username, password } = req.body;

  console.log(users)

  const user = users.find(user => user.username === username && user.password === password);

  if (user) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  } 
});


/* TODO: Set protected Routes in the app */
app.get('/protected', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { username } = decoded;
    res.json({ message: `Hello, ${username}! This is protected data.` });
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});



// CRUD API

// GET /clients - get all clients
app.get('/clients', async (req, res) => {
  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('SELECT id, firstname, lastname, address, plz, orders, versand, phone, mail, state, date FROM Clients');
    connection.end();

    const clients = rows.map(row => {
      return {
        id: row.id,
        firstname: row.firstname,
        lastname: row.lastname,
        address: row.address,
        plz: row.plz,
        orders: row.orders,
        versand: row.versand,
        phone: row.phone,
        mail: row.mail,
        state: row.state,
        date: row.date
      };
    });

   return res.json(clients);
  } catch (error) {
    console.error('Error retrieving clients:', error);
    return res.status(500).send('Error retrieving clients');
  }
});

// GET /clients/:id - get a single client
app.get('/clients/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('SELECT id, firstname, lastname, address, plz, orders, versand, phone, mail, state, date FROM Clients WHERE id = ?', [id]);
    connection.end();

    if (rows.length === 0) {
      return res.status(404).send('Client not found');
    }

    const client = {
      id: rows[0].id,
      firstname: rows[0].firstname,
      lastname: rows[0].lastname,
      address: rows[0].address,
      plz: rows[0].plz,
      orders: rows[0].orders,
      versand: rows[0].versand,
      phone: rows[0].phone,
      mail: rows[0].mail,
      state: rows[0].state,
      date: rows[0].date
    };

    return res.json(client);
  } catch (error) {
    console.error('Error retrieving client:', error);
   return res.status(500).send('Error retrieving client');
  }
});

// POST /clients - create a new client
app.post('/clients', async (req, res) => {
  const { firstname, lastname, address, plz, orders, versand, phone, mail, state, date } = req.body;

  try {
    const connection = await mysql.createConnection(config);
    const [result] = await connection.execute('INSERT INTO Clients (firstname, lastname, address, plz, orders, versand, phone, mail, state, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [firstname, lastname, address, plz, orders, versand, phone, mail, state, date]);
    connection.end();

    const newClientId = result.insertId;

    const newClient = {
      id: newClientId,
      firstname: firstname,
      lastname: lastname,
      address: address,
     
      plz: plz,
      orders: orders,
      versand: versand,
      phone: phone,
      mail: mail,
      state: state,
      date: date
    };

    return res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).send('Error creating client');
  }
});

// PUT /clients/:id - update a client
app.put('/clients/:id', async (req, res) => {
  const id = req.params.id;
  const { state } = req.body;

  try {
    const connection = await mysql.createConnection(config);
    const [result] = await connection.execute('UPDATE Clients SET state = ? WHERE id = ?', [state, id]);
    connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).send('Client not found');
    }

    const updatedClient = {
      id: id,
      state: state
    };

   return  res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
   return  res.status(500).send('Error updating client');
  }
});

// DELETE /clients/:id - delete a client
app.delete('/clients/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const connection = await mysql.createConnection(config);
    const [result] = await connection.execute('DELETE FROM Clients WHERE id = ?', [id]);
    connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).send('Client not found');
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting client:', error);
    return res.status(500).send('Error deleting client');
  }
});




app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});