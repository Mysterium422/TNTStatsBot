const db = require("../db");
const {errorEmbed, randomChoice, embedFooter} = require("../util.js");

module.exports = {
	run: async (client, message, [game, prefix]) => {
		const configurationTool = {
			all: "All TNT Games",
			wizards: "TNT Wizards",
			run: "TNT Run",
			pvp: "PVP Run",
			tag: "TNT Tag",
			bowspleef: "Bow spleef"
		};

		if (!message.member.hasPermission("ADMINISTRATOR")) {
			return message.channel.send(errorEmbed("Invalid permissions", "Only a server administrator can configure the bot."));
		}

		if (!(args[0] in configurationTool)) {
			return sendErrorEmbed(message.channel, `First Paramenter Invalid`, `Looking for: all, wizards, run, pvp, tag, or bowspleef`);
		}
		if (args.length == 1) {
			return sendErrorEmbed(message.channel, `Second Parameter Invalid`, `No Parameter was found`);
		}
		if (args.length > 2) {
			return sendErrorEmbed(message.channel, `Prefix Invalid`, `No Spaces in the prefix!`);
		}

		// await db.set(`chan_${message.channel.id}`, {
		// 	game: args[0],
		// 	prefix: args[1]
		// });

		// TODO: successEmbed(author) in utls
		const embed = new Discord.MessageEmbed();
		embed.setColor("#3bcc71");
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle(`Success! Channel Configured`);
		embed.setTimestamp();
		embed.setFooter(randomChoice(embedFooter), embedFooter.image.green);
		embed.addField(`__Default Game:__`, configurationTool[args[0]], true);
		embed.addField(`__Bot Prefix:__`, args[1], true);

		return message.channel.send(embed);
	},
	aliases: ["configure", "config", "setup"]
};
