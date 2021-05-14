const strings = require("../strings.js");

module.exports = {
	run: ({message}) => message.channel.send(strings.invite),
	aliases: [],
	requiresConfiguredChannel: true
};
