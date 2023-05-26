const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL connection configuration
const connection = mysql.createConnection({
  host: '34.101.225.147',
  user: 'bitebyte',
  password: 'coolgamer501',
  database: 'test'
});

// Connect to MySQL
connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
  } else {
    console.log('Connected to MySQL database.');
  }
});

// API endpoint for user registration
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  const user = { username, email, password };

 connection.query('SELECT * FROM users WHERE email = ?', email, (err, results) => {
    if (err) {
      console.error('Error checking user existence:', err);
      res.status(500).json({ error: 'Failed to register user.' });
    } else if (results.length > 0) {
      res.status(409).json({ error: 'User already exists.' });
    } else {
      const user = { username, email, password };

      connection.query('INSERT INTO users SET ?', user, (err, result) => {
        if (err) {
          console.error('Error registering user:', err);
          res.status(500).json({ error: 'Failed to register user.' });
        } else {
          res.status(200).json({ message: 'User registered successfully.' });
        }
      });
    }
  });
});

 //API endpoint for fetch users data
app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error fetching user data:', err);
      res.status(500).json({ error: 'Failed to fetch user data.' });
    } else {
      res.status(200).json({ users: results });
    }
  });
});

// API endpoint for user login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  connection.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) {
        console.error('Error logging in:', err);
        res.status(500).json({ error: 'Failed to log in.' });
      } else if (results.length === 0) {
        res.status(401).json({ error: 'Invalid email or password.' });
      } else {
        const user = results[0];
        const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful.', token, username: user.username });
      }
    }
  );
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, 'your-secret-key', (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token.' });
      }
      req.userId = decoded.userId;
      next();
    });
  } else {
    res.status(401).json({ error: 'Token not provided.' });
  }
}

app.post('/addUserInformation', authenticateToken, (req, res) => {
  const { age, gender, weight, height } = req.body;
  const userId = req.userId;

  const userInformation = { age, gender, height, weight };

  connection.query('UPDATE users SET ? WHERE id = ?', [userInformation, userId], (err, result) => {
    if (err) {
      console.error('Error adding user information:', err);
      res.status(500).json({ error: 'Failed to add user information.' });
    } else {
      // Return the user's input in the response
      const response = { age, gender, height, weight };
      res.status(200).json({ message: 'User information added successfully.', data: response });
    }
  });
});




// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});

