const db = require("../db");
const strings = require("../strings.js");
const {errorEmbed, successEmbed} = require("../util.js");

module.exports = {
	run: async (client, message, [game, ...prefix]) => {
		const configurationTool = {
			all: "All TNT Games",
			wizards: "TNT Wizards",
			run: "TNT Run",
			pvp: "PVP Run",
			tag: "TNT Tag",
			bowspleef: "Bow spleef"
		};

		prefix = prefix.join(" ");

		if (!message.member.hasPermission("ADMINISTRATOR")) {
			return message.channel.send(errorEmbed("Invalid permissions", "Only a server administrator can configure the bot."));
		} else if (!(game in configurationTool)) {
			return message.channel.send(errorEmbed("Invalid game type", strings.invalid_game_type));
		} else if (prefix.length === 0) {
			return message.channel.send(errorEmbed("Invalid prefix", "Expected at least one character"));
		}

		// await db.set(`chan_${message.channel.id}`, {
		// 	game: args[0],
		// 	prefix: args[1]
		// });

		const embed = successEmbed(message.author, "", "Success! Channel Configured");
		embed.addField("__Default Game:__", configurationTool[game], true);
		embed.addField("__Bot Prefix:__", prefix, true);

		return message.channel.send(embed);
	},
	aliases: ["configure", "config", "setup"]
};
