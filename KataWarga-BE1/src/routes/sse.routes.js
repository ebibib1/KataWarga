const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
require('dotenv').config();

// In-memory clients storage
const clients = new Map(); // Map<userId, res[]>

router.get('/events', (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(403).send('Forbidden');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!clients.has(userId)) {
    clients.set(userId, []);
  }
  clients.get(userId).push(res);

  req.on('close', () => {
    const userClients = clients.get(userId);
    if (userClients) {
      clients.set(userId, userClients.filter(client => client !== res));
    }
  });
});

// Function to push notification to a user
const sendNotification = (userId, notification) => {
  if (clients.has(userId)) {
    clients.get(userId).forEach(res => {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    });
  }
};

module.exports = { router, sendNotification };
