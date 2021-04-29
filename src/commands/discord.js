const strings = require("../strings.js");

module.exports = {
	run: (client, message, args) => {
		return message.channel.send(strings.discordLinks);
	},
	aliases: []
};
