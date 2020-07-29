const Slack = require('slack');
const parser = require('fast-xml-parser');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const bot = new Slack({token: SLACK_TOKEN});

const sendVideoMessage = async (xmlFeed) => {
    try {
        const options = { ignoreAttributes: false };
        const feed = parser.parse(xmlFeed, options).feed;
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
