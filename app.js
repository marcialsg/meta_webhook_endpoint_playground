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

    const PHONE_NUMBER_ID = '1011082392088113';
    const ACCESS_TOKEN = 'EAAM41SXnDT4BQyxNUOahxFRq6sSE26bxP4Diw0lEtzVPDckZCy1JmiHfA4ygqVqRuT4SFr4KnkOdw2aSTzHRmm7Lf1zFTBkh7r3NDZCG8KXAzVhaFv8KEADkAmS5KxiZAdUZAZALy6PebcLW6cWF6ZAFup6ZBdzANIYzPUD2CqUOxX2uRYuZA7SKIFUUSnDHfZCpVi8djhNfr9wpJkbRpqEEqq8AzdNJnKUSxmIsmUVCUEfNhsyB5ZAQRbMT5OgZCXCJNmDm5pW2OVZCx4VkjyGaFzVK';
    const RECIPIENT_PHONE = lastMessage?.from;

    console.log(`\nFrom: ${RECIPIENT_PHONE}, Body: ${body}\n`);

    fetch(`https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ACCESS_TOKEN}`
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: RECIPIENT_PHONE,
            type: "text",
            text: {
                preview_url: true,
                body: "Hello from Node.js"
            }
        })
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