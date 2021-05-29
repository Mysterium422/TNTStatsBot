// @ts-check
"use strict";

const {cacheUserStats, getUserStats, getTimedStats, cacheTimedStats} = require("../cache.js"),
	{getUserSettings} = require("../db.js"),
	{errorEmbed} = require("../util.js"),
	{fetchStats, hypixelToStandard, parseStatsArgs, createStatsEmbed} = require("../stats-utils");

module.exports = {
	run: async ({message, args, channelInfo}) => {
		const parsed = await parseStatsArgs(message, args, channelInfo);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		const previous = await getUserStats(message.author.id, uuid);
		const settings = await getUserSettings(message.author);
		if (settings.reset) await cacheUserStats(message.author.id, uuid, stats);
		// TODO: take in settings to use for verbose option
		message.channel.send(createStatsEmbed({message, stats, previous, game, settings}));

		await getTimedStats(uuid, true).then(cache => (cache === null ? cacheTimedStats(uuid, true, stats) : null));
		await getTimedStats(uuid, false).then(cache => (cache === null ? cacheTimedStats(uuid, true, stats) : null));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
