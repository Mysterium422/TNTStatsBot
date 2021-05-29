// @ts-check
"use strict";

const {cacheUserStats, getUserStats, getTimedStats, cacheTimedStats} = require("../cache.js"),
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
	
	const embed = stats.toEmbed({
		game, author: message.author, settings,
		previous: fromJSON(previous)
	});

	await message.channel.send(embed);
	await getTimedStats(uuid, true).then(cache => (cache === null ? cacheTimedStats(uuid, true, stats) : null));
	await getTimedStats(uuid, false).then(cache => (cache === null ? cacheTimedStats(uuid, true, stats) : null));
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
