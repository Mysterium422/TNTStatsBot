const strings = require("../strings.js");

module.exports = {
	run: ({message}) => message.channel.send(strings.source),
	aliases: ["code", "github"]
};
