const strings = require("../strings.js");

module.exports = {
	run: async (client, message, args) => {
		return message.channel.send(strings.source);
	},
	aliases: ["code", "github"]
};
