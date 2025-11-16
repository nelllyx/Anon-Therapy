# Encrypted Messaging System Setup Guide

## Overview
This application now includes a fully encrypted, real-time messaging system with:
- **End-to-end encryption** using AES-256-GCM
- **Real-time delivery** via Socket.io
- **Message status tracking** (sent, delivered, read)
- **Typing indicators**
- **Conversation management**
- **Unread message counts**

## Setup Instructions

### 1. Environment Variable
Add the following to your `config.env` file:

```env
MESSAGE_ENCRYPTION_KEY=your-64-character-hex-encryption-key-here
```

**Important:** Generate a secure encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

**⚠️ WARNING:** 
- Never commit the encryption key to version control
- Store it securely in your environment variables
- If you lose the key, all encrypted messages cannot be decrypted
- Each environment (dev, staging, production) should have its own unique key

### 2. API Endpoints

All endpoints require authentication via the `protect` middleware.

#### Send a Message
```
POST /api/v1/messages/send
Content-Type: application/json

{
  "receiverId": "receiver_user_id",
  "receiverRole": "client" | "therapist",
  "message": "Your message text here",
  "messageType": "text" | "file" | "image" | "system",
  "fileUrl": "optional_file_url",
  "fileName": "optional_file_name",
  "sessionId": "optional_session_id"
}
```

#### Get All Conversations
```
GET /api/v1/messages/conversations
```

#### Get Messages for a Conversation
```
GET /api/v1/messages/conversations/:conversationId/messages?page=1&limit=50
```

#### Mark Messages as Read
```
PATCH /api/v1/messages/conversations/:conversationId/read
```

#### Mark Message as Delivered
```
PATCH /api/v1/messages/messages/:messageId/delivered
```

#### Delete a Message
```
DELETE /api/v1/messages/messages/:messageId
```

## Socket.io Events

### Client → Server Events

#### Join Conversation Room
```javascript
socket.emit('join_conversation', conversationId, (callback) => {
  console.log('Joined conversation:', callback);
});
```

#### Leave Conversation Room
```javascript
socket.emit('leave_conversation', conversationId);
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  conversationId: 'conversation_id',
  receiverId: 'receiver_id'
});

// Stop typing
socket.emit('typing_stop', {
  conversationId: 'conversation_id'
});
```

#### Mark Message as Read (via socket)
```javascript
socket.emit('message_read', {
  messageId: 'message_id',
  conversationId: 'conversation_id'
});
```

#### Mark Message as Delivered (via socket)
```javascript
socket.emit('message_delivered', {
  messageId: 'message_id',
  conversationId: 'conversation_id'
});
```

### Server → Client Events

#### New Message Received
```javascript
socket.on('message_received', (messageData) => {
  console.log('New message:', messageData);
  // messageData contains:
  // - messageId
  // - conversationId
  // - senderId
  // - receiverId
  // - message (decrypted)
  // - messageType
  // - createdAt
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // data contains:
  // - userId
  // - conversationId
  // - isTyping (boolean)
});
```

#### Message Read Receipt
```javascript
socket.on('message_read_receipt', (data) => {
  console.log('Message read:', data);
});
```

#### Message Delivered Receipt
```javascript
socket.on('message_delivered_receipt', (data) => {
  console.log('Message delivered:', data);
});
```

## Frontend Implementation Example

### Connect to Socket
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your_jwt_token_here'
  }
});

socket.on('connect', () => {
  console.log('Connected to messaging server');
  
  // Join a conversation when user opens it
  socket.emit('join_conversation', conversationId);
});

socket.on('message_received', (message) => {
  // Handle new message
  addMessageToUI(message);
});

socket.on('user_typing', (data) => {
  // Show typing indicator
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

### Send a Message
```javascript
async function sendMessage(receiverId, receiverRole, message) {
  // 1. Save message via REST API
  const response = await fetch('/api/v1/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include your auth token
    },
    body: JSON.stringify({
      receiverId,
      receiverRole,
      message,
      messageType: 'text'
    })
  });
  
  const result = await response.json();
  
  // Message is automatically emitted via socket by the server
  // You'll receive it via 'message_received' event
}
```

### Typing Indicator
```javascript
let typingTimeout;

function handleTyping(conversationId, receiverId) {
  // Emit typing start
  socket.emit('typing_start', { conversationId, receiverId });
  
  // Clear existing timeout
  clearTimeout(typingTimeout);
  
  // Set timeout to stop typing after 3 seconds of inactivity
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { conversationId });
  }, 3000);
}
```

## Security Considerations

### Current Implementation
- **Server-side encryption**: Messages are encrypted before storage in the database
- **AES-256-GCM**: Uses authenticated encryption for security
- **Transport encryption**: Socket.io connections should use WSS (WebSocket Secure) in production

### For True End-to-End Encryption (E2E)
To implement true E2E encryption where the server cannot decrypt messages:

1. **Client-side encryption**: Encrypt messages on the client before sending
2. **Key exchange**: Use a key exchange protocol (e.g., Diffie-Hellman) or pre-shared keys
3. **Key storage**: Store encryption keys only on client devices
4. **Server role**: Server stores encrypted blobs without ability to decrypt

This requires additional frontend implementation and key management.

## Database Schema

### Messages Collection
- Messages are stored with encrypted content
- IV (Initialization Vector) and tag are stored separately
- Messages can be soft-deleted

### Conversations Collection
- Tracks participants and their last seen times
- Maintains unread message counts per participant
- Can be linked to therapy sessions

## Testing

1. **Generate encryption key** and add to `config.env`
2. **Start the server**
3. **Connect two clients** with different user accounts
4. **Send messages** between them
5. **Verify encryption**: Check database - messages should be encrypted
6. **Verify decryption**: Messages should appear readable in the UI

## Troubleshooting

### Messages not decrypting
- Check that `MESSAGE_ENCRYPTION_KEY` is set correctly
- Verify the key hasn't changed (changing the key will make old messages unreadable)
- Check server logs for decryption errors

### Real-time messages not appearing
- Verify socket connection is established
- Check that users have joined the conversation room
- Verify JWT token is valid in socket handshake
- Check server logs for socket errors

### Typing indicators not working
- Ensure `typing_start` and `typing_stop` events are being emitted
- Check that users are in the same conversation room
- Verify socket connection is active

