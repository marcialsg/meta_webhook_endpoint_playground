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

    console.log("\nlastMessage: ", lastMessage);

    console.log(JSON.stringify(lastMessage, null, 2));

    // const PHONE_NUMBER_ID = '106540352242922';
    // const ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN';
    // const RECIPIENT_PHONE = '+16505551234';

    // fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${ACCESS_TOKEN}`
    //     },
    //     body: JSON.stringify({
    //         messaging_product: "whatsapp",
    //         recipient_type: "individual",
    //         to: RECIPIENT_PHONE,
    //         type: "text",
    //         text: {
    //             preview_url: true,
    //             body: "As requested, here's the link to our latest product: https://www.meta.com/quest/quest-3/"
    //         }
    //     })
    // })
    //     .then(response => response.json())
    //     .then(data => console.log('Response:', data))
    //     .catch(error => console.error('Error:', error));



    res.status(200).end();
});

// Start the server
app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});