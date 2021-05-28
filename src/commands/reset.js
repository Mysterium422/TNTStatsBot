// @ts-check
"use strict";

const {cacheUserStats} = require("../cache.js"),
	{parseStatsArgs, fetchStats, hypixelToStandard} = require("../stats-utils.js"),
	{errorEmbed, successEmbed} = require("../util.js"),
    strings = require("../strings.js");

module.exports = {
	run: async ({message, args, channelInfo}) => {
		const parsed = await parseStatsArgs(message, args, channelInfo);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		await cacheUserStats(message.author.id, uuid, stats);
        return message.channel.send(successEmbed(message.author, strings.reset(stats.info.displayname)));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
