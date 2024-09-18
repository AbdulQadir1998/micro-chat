// profile-service.js
const express = require('express');
const app = express();

const users = [
  { id: 1, username: 'user1', profile: 'Profile of user1' },
  { id: 2, username: 'user2', profile: 'Profile of user2' }
];

app.get('/profile/me', (req, res) => {
  // Extract user information from x-user-data header
  const userData = req.headers['x-user-data'];
  if (!userData) {
    return res.status(401).send('User data not provided');
  }

  const user = JSON.parse(userData); // Parse the user data from the header
  console.log('User data from header', user);

  const foundUser = users.find(u => u.id === user.id);
  if (!foundUser) return res.status(404).send('User not found');

  res.json(foundUser);
});

app.listen(3002, () => {
  console.log('Profile service running on port 3002');
});
