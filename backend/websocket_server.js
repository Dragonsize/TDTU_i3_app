const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database connection configuration
// Ensure process.env.DATABASE_URL is set in your .env file
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase/Cloud connections
    }
});

// Store active connections: Map<channelId, Set<WebSocket>>
const channelClients = new Map();

wss.on('connection', (ws, req) => {
    // Parse query parameters to get channel_id and user_id
    // Example connection URL: ws://localhost:3001?channel_id=UUID&user_id=UUID
    const urlParams = new URLSearchParams(req.url.replace('/?', ''));
    const channelId = urlParams.get('channel_id');
    const userId = urlParams.get('user_id');
    const username = urlParams.get('username');

    if (!channelId || !userId) {
        ws.send(JSON.stringify({ error: 'Missing channel_id or user_id' }));
        ws.close();
        return;
    }

    // Add client to the specific channel group
    if (!channelClients.has(channelId)) {
        channelClients.set(channelId, new Set());
    }
    channelClients.get(channelId).add(ws);

    console.log(`Client connected to channel ${channelId}`);

    ws.on('message', async (messageStr) => {
        try {
            // 1. Parse the incoming message
            let messageData;
            try {
                messageData = JSON.parse(messageStr);
            } catch (e) {
                ws.send(JSON.stringify({ error: 'Invalid JSON format' }));
                return;
            }

            // Handle Typing Events
            if (messageData.type === 'typing') {
                const clients = channelClients.get(channelId);
                if (clients) {
                    const broadcastPayload = JSON.stringify({
                        type: 'typing',
                        user_id: userId,
                        username: username,
                        isTyping: messageData.isTyping
                    });
                    clients.forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(broadcastPayload);
                        }
                    });
                }
                return;
            }

            const content = messageData.message;

            // 2. Validate Input (Security & Logic)
            if (!content || typeof content !== 'string') {
                ws.send(JSON.stringify({ error: 'Message content must be a string' }));
                return;
            }

            const trimmedContent = content.trim();
            if (trimmedContent.length === 0) {
                return; // Ignore empty messages
            }
            
            // Check length limit (matching database or reasonable constraint)
            if (trimmedContent.length > 2000) {
                ws.send(JSON.stringify({ error: 'Message too long (max 2000 chars)' }));
                return;
            }

            // 3. Store in Database (SQL Injection Prevention)
            // We use parameterized queries ($1, $2, $3) which automatically escape inputs
            const insertQuery = `
                INSERT INTO public.chat_messages (channel_id, sender_id, message)
                VALUES ($1, $2, $3)
                RETURNING id, sent_at, message, sender_id;
            `;
            
            const values = [channelId, userId, trimmedContent];

            const result = await pool.query(insertQuery, values);
            const savedMessage = result.rows[0];

            // 4. Broadcast to all clients in the channel
            const clients = channelClients.get(channelId);
            if (clients) {
                const broadcastPayload = JSON.stringify({
                    type: 'new_message',
                    data: savedMessage
                });

                clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(broadcastPayload);
                    }
                });
            }

            // Optional: Update the channel's last_message_at timestamp
            await pool.query('UPDATE public.chat_channels SET last_message_at = NOW() WHERE id = $1', [channelId]);

        } catch (err) {
            console.error('Error processing message:', err);
            ws.send(JSON.stringify({ error: 'Internal server error' }));
        }
    });

    ws.on('close', () => {
        if (channelClients.has(channelId)) {
            channelClients.get(channelId).delete(ws);
            if (channelClients.get(channelId).size === 0) {
                channelClients.delete(channelId);
            }
        }
    });
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});