const strings = require("../strings.js");

module.exports = {
	run: async (client, message, args) => {
		return message.channel.send(strings.discordLinks);
	},
	aliases: []
};
