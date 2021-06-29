// @ts-check
"use strict";

const db = require("../db"),
	{successEmbed} = require("../util.js"),
	strings = require("../strings.js");

module.exports = {
	run: async ({message, args, channelInfo}) => {
		await db.del(db.TABLES.UserCache, {discord: message.author.id});
		return message.channel.send(successEmbed(message.author, strings.reset));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
