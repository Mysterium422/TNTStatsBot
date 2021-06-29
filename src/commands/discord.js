// @ts-check
"use strict";

const strings = require("../strings.js");

module.exports = {
	run: ({message}) => message.channel.send(strings.discordLinks),
	aliases: [],
	requiresConfiguredChannel: true
};
