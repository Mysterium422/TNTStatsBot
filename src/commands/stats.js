const {cacheUserStats, getUserStats} = require("../cache.js");
const {
	errorEmbed,
	fetchStats,
	hypixelToStandard,
	parseStatsArgs,
	createStatsEmbed
} = require("../util.js");

module.exports = {
	run: async ({message, args}) => {
		const parsed = await parseStatsArgs(message, args);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		const previous = await getUserStats(message.author.id, uuid);
		await cacheUserStats(message.author.id, uuid, stats);

		return message.channel.send(createStatsEmbed({message, stats, previous, game}));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
