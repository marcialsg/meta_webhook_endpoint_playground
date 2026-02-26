// require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

// Route for GET requests
app.get('/', (req, res) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('WEBHOOK VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.status(403).end();
    }
});

// Route for POST requests
app.post('/', (req, res) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    console.log(`\n\nWebhook received ${timestamp}\n`);

    const lastMessage = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.at(-1);

    const body = lastMessage?.text?.body;

    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
    const RECIPIENT_PHONE = lastMessage?.from;

    console.log(`\nFrom: ${RECIPIENT_PHONE}, Body: ${body}\n`);

    const individualMessage = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: RECIPIENT_PHONE,
        type: "text",
        text: {
            preview_url: true,
            body: "Hello from Node.js"
        }
    };



    const groupMessage = {
        messaging_product: "whatsapp",
        recipient_type: "group",
        to: 'FNq4p3Z6Kx0Ldw7w01DPgd',
        type: "text",
        text: {
            preview_url: true,
            body: "Hello from Node.js"
        }
    };

    fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify(groupMessage)
    })
        .then(response => response.json())
        .then(data => console.log('Response:', data))
        .catch(error => console.error('Error:', error));


    res.status(200).end();
});

// Start the server
app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});