const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const users = [
  { id: 1, username: 'user1', password: 'pass1' },
  { id: 2, username: 'user2', password: 'pass2' }
];

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  const user = users.find(u => u.username === username && u.password === password);

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({
    id: user.id, 
    username: user.username
  },
    'secret-key', {
      expiresIn: '4h'
  });
  
  res.json({ token });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(3001, () => {
  console.log('Auth service running on port 3001');
});
