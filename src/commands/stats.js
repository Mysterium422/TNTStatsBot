// @ts-check
"use strict";

const {cacheUserStats, getUserStats, confirmTimedStats} = require("../cache.js"),
	{getUserSettings} = require("../db.js"),
	{errorEmbed} = require("../util.js"),
	{fetchStats, HypixelStats, parseStatsArgs, fromJSON} = require("../stats-utils.js");

const commandFunction = async (uuid, game, message) => {
	const data = await fetchStats(uuid);
	if (!data.success) return message.channel.send(errorEmbed(...data.error));

	const stats = new HypixelStats(data.user.player);
	const previous = await getUserStats(message.author.id, uuid);
	const settings = await getUserSettings(message.author);
	if (settings.reset) await cacheUserStats(message.author.id, uuid, stats);
	
	const embed = stats.toEmbed({ game, author: message.author, settings, previous });

	await message.channel.send(embed);
	await confirmTimedStats(uuid, stats);
};

module.exports = {
	run: async ({message, args, channelInfo}) => {
		const parsed = await parseStatsArgs(message, args, channelInfo);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;
		return commandFunction(uuid, game, message);
	},
	aliases: [],
	requiresConfiguredChannel: true,
	commandFunction
};
