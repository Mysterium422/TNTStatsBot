const strings = require("../strings.js");

module.exports = {
	run: ({message}) => message.channel.send(strings.mysterium),
	aliases: ["lebster", "author", "authors", "creator", "creators"],
	requiresConfiguredChannel: true
};
