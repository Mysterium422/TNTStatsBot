const strings = require("../strings.js");

module.exports = {
	run: ({message}) => message.channel.send(strings.discordLinks),
	aliases: []
};
