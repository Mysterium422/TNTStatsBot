const strings = require("../strings.js");

module.exports = {
	run: ({message, channelInfo: {prefix}}) => message.channel.send(strings.invite(prefix)),
	aliases: [],
	requiresConfiguredChannel: true
};
