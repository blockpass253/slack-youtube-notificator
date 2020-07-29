const axios = require('axios');
const qs = require('querystring');
const fs = require('fs');

const CALLBACK_URL = process.env.CALLBACK_URL;
const HUB_URL = process.env.HUB_URL;

const subscribeTo = async topic => {
    return axios({
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
};

const subscribeToAll = async () => {
    for(const channel of getChannels()) {
        const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channel.id}`;
        try {
            await subscribeTo(topic);
        }
        catch(err) {
            console.log(`Failed to subscribe to ${channel.name}. Error: ${err.message}`)
        }
    }
};

const scheduleRefresh = (topic, refreshTime) => {
    setTimeout( () => {
        subscribeTo(topic);
    }, (refreshTime - 180) * 1000);
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

module.exports = {
    subscribeToAll,
    scheduleRefresh
};
