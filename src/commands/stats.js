const {cacheUserStats, getUserStats, getTimedStats, cacheTimedStats} = require("../cache.js"),
	{getUserSettings} = require("../db.js"),
	{errorEmbed} = require("../util.js"),
	{fetchStats, hypixelToStandard, parseStatsArgs, createStatsEmbed} = require("../stats-utils");

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

		await getTimedStats(uuid, true).then(cache => (cache === null ? cacheTimedStats(uuid, true, stats) : null));
		await getTimedStats(uuid, false).then(cache => (cache === null ? cacheTimedStats(uuid, true, stats) : null));
	},
	aliases: [],
	requiresConfiguredChannel: true
};
