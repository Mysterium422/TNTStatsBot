const {errorEmbed, getUUIDFromDiscord, parseUser, getMentioned, getStats, hypixelToStandard} = require("../util.js");
const strings = require("../strings.js");

module.exports = {
	run: async ({message, args}) => {
		let uuid = null;
		if (args.length === 0) {
			uuid = await getUUIDFromDiscord(message.author.id);
			if (uuid === null) return message.channel.send(errorEmbed("Discord account not linked", strings.unlinked));
		} else if (args.length === 1) {
			const user = await parseUser(arg[0], getMentioned(message));
			if (!user.success) return message.channel.send(...user.error);
			uuid = user.uuid;
		}

		const data = await getStats(uuid);
		if (!data.success) return message.channel.send(errorEmbed(...data.error));

		/**
		 * @type {import("../util").HypixelStats}
		*/
		const stats = hypixelToStandard(data);
		debugger;
	},
	aliases: [],
	requiresConfiguredChannel: true
};
