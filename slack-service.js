const Slack = require('slack');
const parser = require('fast-xml-parser');
const InMemoryCache = require('./inMemoryCache');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const bot = new Slack({token: SLACK_TOKEN});

const sendVideoMessage = async (xmlFeed) => {
    try {
        const cache = new InMemoryCache();
        const options = { ignoreAttributes: false };
        const feed = parser.parse(xmlFeed, options).feed;
        let keyMatch = feed.entry.link['@_href'].match(/v=([^&#]{5,})/);
        if (keyMatch.length > 0 && cache.isOnCache(keyMatch[1])) {
            return
        } else if (keyMatch.length > 0){
            cache.add(keyMatch[1], true);
        }
        if (feed['at:deleted-entry']) {
            return;
        }

        const text = `*${feed.entry.author.name}* subió un video :pog:
    ${feed.entry.link['@_href']}`;
        await bot.chat.postMessage({ channel: SLACK_CHANNEL, text});
    }
    catch(err) {
        console.log(`Couldn't send the message. Error: ${err.message}`);
    }
}

module.exports = {
    sendVideoMessage
};
