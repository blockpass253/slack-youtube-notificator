require('dotenv').config();
const express = require('express');

const { subscribeToAll, scheduleRefresh } = require('./subscription-service');
const { sendVideoMessage } = require('./slack-service');

const PORT = process.env.PORT;

const app = express();

app.use(express.text({ type: 'application/atom+xml' }));

app.get('/', (req, res) => {
    return res.status(200).send({message: 'ok'});
});

app.get('/youtube/callback', async (req, res) => {
    if (req.query && req.query['hub.challenge']) {
        scheduleRefresh(req.query['hub.topic'], req.query['hub.lease_seconds']);
        return res.status(200).send(req.query['hub.challenge']);
    }

    console.log('Failed verification.');
    return res.status(500).send();
});

app.post('/youtube/callback', async (req, res) => {
    try {
        await sendVideoMessage(req.body);
        res.status(200);
    }
    catch(err) {
        console.log(err);
        res.status(500);
    }
    finally {
        res.end();
    }
});

app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}.`);
    await subscribeToAll();
    console.log('Finished subscribing to channels.')
});