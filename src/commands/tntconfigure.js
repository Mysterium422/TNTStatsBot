const db = require("../db");
const strings = require("../strings.js");
const {errorEmbed, successEmbed, GAMES, GAMES_READABLE} = require("../util.js");

module.exports = {
	run: (client, message, [game, ...prefix]) => {
		prefix = prefix.join(" ");
		if (!message.member.hasPermission("ADMINISTRATOR")) {
			return message.channel.send(errorEmbed("Invalid permissions", "Only a server administrator can configure the bot."));
		}
		
		if (!(game in GAMES)) {
			return message.channel.send(errorEmbed("Invalid game type", strings.invalid_game_type));
		}
		
		if (prefix.length === 0) {
			return message.channel.send(errorEmbed("Invalid prefix", "Expected at least one character"));
		}

		game = GAMES[game]; // Convert to the internal representation

		db.linkChannelPreifx(message.channel, prefix, game);
		const embed = successEmbed(message.author, "", "Success! Channel Configured");
		embed.addField("__Default Game:__", GAMES_READABLE[game], true);
		embed.addField("__Bot Prefix:__", prefix, true);
		return message.channel.send(embed);
	},
	aliases: ["configure", "config", "setup"]
};
