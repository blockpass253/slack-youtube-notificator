require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const qs = require('querystring');
const Slack = require('slack');
const parser = require('fast-xml-parser');

const PORT = process.env.PORT;
const CALLBACK_URL = process.env.CALLBACK_URL;
const HUB_URL = process.env.HUB_URL;
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const bot = new Slack({token: SLACK_TOKEN});

const app = express();

app.use(express.text({ type: 'application/atom+xml' }));

app.get('/youtube/callback', async (req, res) => {
    if (req.query && req.query['hub.challenge']) {
        scheduleRefresh(req.query['hub.topic'], req.query['hub.lease_seconds']);
        return res.send(req.query['hub.challenge']);
    }

    console.log('Failed verification.');
    return res.status(500).send();
});

app.post('/youtube/callback', async (req, res) => {
    try {
        const options = { ignoreAttributes: false };
        const feed = parser.parse(req.body, options).feed;
        if (feed['at:deleted-entry']) {
            return res.end();
        }

        const text = `*${feed.entry.author.name}* subió un video :pog:
${feed.entry.link['@_href']}`;
        await bot.chat.postMessage({ channel: SLACK_CHANNEL, text});
        res.end();
    }
    catch(err) {
        console.log(err);
        res.status(500).end();
    }
});

app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}.`);
    await subscribeToAll();
    console.log('Finished subscribing to channels.')
});

const scheduleRefresh = (topic, refreshTime) => {
    setTimeout( topic => {
        subscribeTo(topic);
    }, (refreshTime - 180) * 1000);
};

const subscribeTo = async topic => {
    try {
        await axios({
            method: 'post',
            url: HUB_URL,
            data: qs.stringify({
                'hub.mode': 'subscribe',
                'hub.topic': topic,
                'hub.callback': CALLBACK_URL,
                'hub.verify': 'sync'
            }),
            headers: {
                'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
            }
        });
        return true;
    }
    catch(err) {
        return false;
    }
};

const subscribeToAll = async () => {
    for(const channel of getChannels()) {
        const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel.id}`;
        const result = await subscribeTo(topic);
        if (result) {
            console.log(`Successfully subscribed to ${channel.name}`);
        }
        else {
            console.log(`Failed to subscribe to ${channel.name}`);
        }
    }
};

const getChannels = () => {
    try {
        const raw = fs.readFileSync('channels.json');
        return JSON.parse(raw);
    }
    catch(err) {
        console.log('Unable to read channels file.');
        return [];
    }
};