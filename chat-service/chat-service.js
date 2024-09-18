const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let messages = [];

wss.on('connection', (ws, req) => {
  let token = req.url.split('token=')[1];

  try {
    const user = jwt.verify(token, 'secret-key');
    ws.user = user;
    console.log(`${user.username} connected`);

    ws.on('message', (message) => {
      try {
        const msgData = JSON.parse(message);

        if (!msgData.type) throw new Error('Invalid message format, type required');
        
        switch (msgData.type) {
          case 'sendMessage':
            // Handle sending a message
            if (!msgData.receiver || !msgData.content) throw new Error('Receiver and content are required');
            
            const newMessage = {
              id: messages.length + 1,
              sender: ws.user.id,
              receiver: msgData.receiver,
              content: msgData.content,
              status: 'unread',
              timestamp: new Date()
            };

            messages.push(newMessage);
            console.log('Message sent:', newMessage);

            wss.clients.forEach(client => {
              if (client.user.id === msgData.receiver && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'message', message: newMessage }));
              }
            });

            break;

          case 'acknowledgeMessage':
            // Handle message acknowledgment
            const messageId = msgData.messageId;
            const messageToAcknowledge = messages.find(m => m.id === messageId && m.receiver === ws.user.id);

            if (messageToAcknowledge) {
              messageToAcknowledge.status = 'read';
              console.log(`Message ID ${messageId} marked as read`);

              ws.send(JSON.stringify({ type: 'acknowledgment', messageId: messageId, status: 'read' }));
            } else {
              ws.send(JSON.stringify({ error: 'Message not found or not authorized to acknowledge this message' }));
            }

            break;

          case 'getMessages':
            // Handle fetching messages
            const filter = msgData.status || 'all';
            let filteredMessages = messages.filter(m => m.receiver === ws.user.id || m.sender === ws.user.id);

            if (filter !== 'all') {
              filteredMessages = filteredMessages.filter(m => m.status === filter);
            }

            ws.send(JSON.stringify({ type: 'messages', messages: filteredMessages }));
            break;

          default:
            throw new Error('Invalid message type');
        }
      } catch (error) {
        ws.send(JSON.stringify({ error: error.message }));
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

  } catch (err) {
    ws.close(1008, 'Invalid token');
  }
});

server.listen(3003, () => {
  console.log('Chat service running on port 3003');
});
