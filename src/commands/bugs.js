// @ts-check
"use strict";

const strings = require("../strings.js");

module.exports = {
	run: ({message}) => message.channel.send(strings.reportbugs),
	aliases: ["bug", "reportbug", "report", "issue", "issues"],
	requiresConfiguredChannel: true
};
