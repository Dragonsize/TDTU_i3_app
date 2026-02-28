const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');


const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Database connection
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined
});

// In-memory user store only (messages now in DB)
const users = new Map(); // userId -> { username, ws }

// Serve static files if needed
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- WebSocket Chat Logic ---
wss.on('connection', (ws, req) => {
    // Parse query params for channel_id, user_id, username
    const url = new URL(req.url, `http://${req.headers.host}`);
    const channelId = url.searchParams.get('channel_id');
    const userId = url.searchParams.get('user_id');
    const username = url.searchParams.get('username') || 'User';

    if (!channelId || !userId) {
        ws.close();
        return;
    }


    // Register user
    users.set(userId, { username, ws });

    // Send chat history from DB
    (async () => {
        try {
            const { rows } = await pool.query(
                'SELECT id, sender_id as user_id, message, sent_at FROM chat_messages WHERE channel_id = $1 ORDER BY sent_at ASC LIMIT 100',
                [channelId]
            );
            ws.send(JSON.stringify({ type: 'history', data: rows }));
        } catch (e) {
            ws.send(JSON.stringify({ type: 'error', error: 'Failed to load chat history.' }));
        }
    })();

    ws.on('message', (msg) => {
        let payload;
        try {
            payload = JSON.parse(msg);
        } catch {
            payload = { message: msg };
        }
        // Typing event
        if (payload.type === 'typing') {
            // Broadcast typing to all connected users in this channel
            for (const [uid, u] of users.entries()) {
                if (uid !== userId) {
                    u.ws.send(JSON.stringify({
                        type: 'typing',
                        user_id: userId,
                        username,
                        isTyping: payload.isTyping
                    }));
                }
            }
            return;
        }
        // New message
        if (payload.message) {
            (async () => {
                try {
                    const insert = await pool.query(
                        'INSERT INTO chat_messages (channel_id, sender_id, message) VALUES ($1, $2, $3) RETURNING id, sender_id as user_id, message, sent_at',
                        [channelId, userId, payload.message]
                    );
                    const messageObj = insert.rows[0];
                    // Broadcast to all connected users in this channel
                    for (const [uid, u] of users.entries()) {
                        u.ws.send(JSON.stringify({
                            type: 'new_message',
                            data: messageObj
                        }));
                    }
                } catch (e) {
                    ws.send(JSON.stringify({ type: 'error', error: 'Failed to send message.' }));
                }
            })();
        }
    });

    ws.on('close', () => {
        users.delete(userId);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Chat WebSocket server running on port ${PORT}`);
});
