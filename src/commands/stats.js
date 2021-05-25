const {cacheUserStats, getUserStats, setAndOrGet, getTimedStats, cacheTimedStats} = require("../cache.js");
const { getUserSettings } = require("../db.js");
const {
	errorEmbed,
	fetchStats,
	hypixelToStandard,
	parseStatsArgs,
	createStatsEmbed
} = require("../util.js");

module.exports = {
	run: async ({message, args, channelInfo: {prefix}}) => {
		const parsed = await parseStatsArgs(message, args, prefix);
		if (!parsed.success) return message.channel.send(errorEmbed(...parsed.error));
		const {uuid, game} = parsed;

		const data = await fetchStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		const stats = hypixelToStandard(data.user.player);
		const previous = await getUserStats(message.author.id, uuid);
		const userSettings = await getUserSettings(message.author);
		if (userSettings === null || userSettings.reset) {
			await cacheUserStats(message.author.id, uuid, stats);
		}
		
		message.channel.send(createStatsEmbed({message, stats, previous, game}));

		await getTimedStats(uuid, true).then(cache => cache === null ? cacheTimedStats(uuid, true) : null);
		await getTimedStats(uuid, false).then(cache => cache === null ? cacheTimedStats(uuid, true) : null);
	},
	aliases: [],
	requiresConfiguredChannel: true
};
