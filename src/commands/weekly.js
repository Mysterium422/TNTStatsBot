// @ts-check
"use strict";

const {setAndOrGet} = require("../cache.js"),
	{errorEmbed, formatTimestamp} = require("../util"),
	{parseStatsArgs, fetchStats, hypixelToStandard, createTimedEmbed} = require("../stats-utils");

module.exports = {
	run: async ({command, message, args, channelInfo: {prefix}}) => {
		const parsed = await parseStatsArgs(message, args, prefix);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		const isWeekly = command !== "monthly";
		const previous = await setAndOrGet(uuid, isWeekly, stats);

		const embed = createTimedEmbed({
			message, stats, previous, game,
			timeframe: isWeekly ? "Weekly" : "Monthly"
		});

		embed.setDescription("**Showing changes since:** " + formatTimestamp((previous === null ? stats : previous).info.timestamp));
		return message.channel.send(embed);
	},
	aliases: ["monthly"],
	requiresConfiguredChannel: true
};
