
const { v4: uuidv4 } = require('uuid');
const geminiService = require('../services/geminiService');

// In-memory store for connected clients
const clients = new Map();

/**
 * Handles incoming WebSocket connections and messages.
 * @param {WebSocket} ws The WebSocket connection object.
 */
function handleWebSocketConnection(ws) {
    const clientId = uuidv4();
    clients.set(clientId, ws);
    console.log(`Client connected: ${clientId}`);

    // Send the client its ID
    ws.send(JSON.stringify({ type: 'assign-id', clientId }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, clientId, data);
        } catch (error) {
            // If message is not JSON, it's likely audio data
            if (message instanceof Buffer) {
                handleAudioMessage(clientId, message);
            } else {
                console.error('Failed to parse message or handle audio:', error);
            }
        }
    });

    ws.on('close', () => {
        clients.delete(clientId);
        console.log(`Client disconnected: ${clientId}`);
        // Notify other clients about the disconnection
        broadcast({ type: 'client-disconnected', clientId });
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
    });
}

/**
 * Processes parsed JSON messages from a client.
 * @param {WebSocket} ws The WebSocket connection object.
 * @param {string} clientId The ID of the sender client.
 * @param {object} data The parsed message data.
 */
function handleMessage(ws, clientId, data) {
    console.log(`Received message from ${clientId}:`, data.type);

    switch (data.type) {
        // Broadcast WebRTC signaling messages to all other clients
        case 'webrtc-offer':
        case 'webrtc-answer':
        case 'webrtc-ice-candidate':
            broadcast(data, clientId);
            break;
        
        // Update the language preference for the client
        case 'language-toggle':
            const client = clients.get(clientId);
            if (client) {
                client.language = data.payload.language; // e.g., 'en' or 'ur'
                console.log(`Client ${clientId} switched language to ${client.language}`);
            }
            break;

        default:
            console.log(`Unknown message type from ${clientId}: ${data.type}`);
    }
}

/**
 * Handles raw audio buffer messages from a client.
 * @param {string} senderId The ID of the client who sent the audio.
 * @param {Buffer} audioBuffer The raw audio data.
 */
async function handleAudioMessage(senderId, audioBuffer) {
    console.log(`Received audio chunk from ${senderId}`);
    try {
        // Determine the language direction from the client's state (this is a placeholder)
        // In a real app, the client would send its current language preference.
        const clientState = clients.get(senderId)?.language || 'en'; // Default to English
        const sourceLang = clientState === 'en' ? 'English' : 'Urdu';
        const targetLang = clientState === 'en' ? 'Urdu' : 'English';

        const { originalText, translatedText } = await geminiService.processAudio(audioBuffer, sourceLang, targetLang);

        // Broadcast the result to ALL clients so UIs can update
        const message = {
            type: 'translation-result',
            payload: {
                senderId,
                originalText,
                translatedText,
                sourceLang,
                targetLang,
            }
        };

        broadcast(message);

    } catch (error) {
        console.error(`Error processing audio for client ${senderId}:`, error);
        const errorMsg = JSON.stringify({ type: 'error', message: 'Translation failed.' });
        // Send error back to the sender
        clients.get(senderId)?.send(errorMsg);
    }
}

/**
 * Broadcasts a message to all clients, including the sender if specified.
 * @param {any} message The message to broadcast (can be JSON object, string, or Buffer).
 * @param {string | null} excludeId Optional client ID to exclude from the broadcast.
 */
function broadcast(message, excludeId = null) {
    let dataToSend = message;
    if (typeof message === 'object' && !(message instanceof Buffer)) {
        dataToSend = JSON.stringify(message);
    }

    for (const [id, client] of clients.entries()) {
        if (id !== excludeId && client.readyState === client.OPEN) {
            client.send(dataToSend);
        }
    }
}

module.exports = { handleWebSocketConnection };
