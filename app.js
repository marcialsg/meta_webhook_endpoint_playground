require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests (unchanged)
app.get('/', (req, res) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.status(403).end();
    }
});

// Route for generating groups (unchanged)
app.post('/groups', (req, res) => {

    console.log('Group POST Request Data:', req.body);

    const { subject, description, join_approval_mode } = req.body;

    const groupData = {
        messaging_product: "whatsapp",
        subject: subject,
        description: description,
        join_approval_mode: join_approval_mode
    };

    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

    fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify(groupData)
    })
        .then(response => response.json())
        .then(data => {
            console.log('Group POST Response Data:', data);
            res.status(200).json(data);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).send('Error creating group');
        });
});

// Route for POST requests (Modified to send Markdown-formatted text)
app.post('/', (req, res) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`\n\nWebhook received ${timestamp}\n`);

    const lastMessage = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.at(-1);

    const body = lastMessage?.text?.body; // The user's message body
    const RECIPIENT_NAME = req.body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || "there"; // Attempt to get recipient's name

    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
    const RECIPIENT_PHONE = lastMessage?.from;

    console.log(`\nFrom: ${RECIPIENT_PHONE}, Body: ${body}\n`);

    // --- Start of Markdown Message Configuration ---
    let formattedMessageBody = `Hello *${RECIPIENT_NAME}*!`;

    // Example of dynamic response based on user's message
    if (body && body.toLowerCase().includes("help")) {
        formattedMessageBody += `\n\n_How can I assist you with your request?_`;
        formattedMessageBody += `\n\nTry sending "info" or "status".`;
    } else if (body && body.toLowerCase().includes("info")) {
        formattedMessageBody += `\n\nHere is some ~important~ *information* for you:`;
        formattedMessageBody += `\n\`\`\`This is a monospaced block of text.\`\`\``;
    } else {
        formattedMessageBody += `\n\nThanks for your message: _"${body}"_`;
        formattedMessageBody += `\nWe'll get back to you shortly.`;
    }

    const individualMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT_PHONE,
        type: "text", // Keep type as 'text'
        text: {
            preview_url: true, // You can set this to false if you don't want URL previews
            body: formattedMessageBody // Use the Markdown-formatted string here
        }
    };
    // --- End of Markdown Message Configuration ---

    fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify(individualMessage)
    }).then((response) => {
        if (!response.ok) {
            response.text().then(text => {
                console.error('Error sending Markdown message:', response.status, text);
            });
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Markdown-formatted message sent successfully');
        return response.json();
    })
        .then(data => console.log('Response data:', data))
        .catch(error => console.error('Error:', error));

    res.status(200).end();
});

app.post('/send-markdown-message', (req, res) => {
    const { title, content, recipient } = req.body; // Added 'recipient' for flexibility

    if (!title || !content || !recipient) {
        return res.status(400).json({ error: 'Missing title, content, or recipient in request body.' });
    }

    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

    // Construct the Markdown message
    const markdownBody = `*${title}*\n\n${content}`; // Title in bold, then two newlines for a blank line, then content

    const messagePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient, // Use the recipient phone number passed in the request
        type: "text",
        text: {
            preview_url: true, // Set to false if you don't want URL previews
            body: markdownBody
        }
    };

    console.log(`Attempting to send message to ${recipient} with title: "${title}"`);

    fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify(messagePayload)
    })
        .then(response => {
            if (!response.ok) {
                // Read the error response body for more details
                return response.text().then(text => {
                    throw new Error(`WhatsApp API error! Status: ${response.status}, Message: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Message sent successfully via /send-markdown-message:', data);
            res.status(200).json({ message: 'Message sent successfully', data });
        })
        .catch(error => {
            console.error('Error sending message via /send-markdown-message:', error.message);
            res.status(500).json({ error: 'Failed to send message', details: error.message });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});