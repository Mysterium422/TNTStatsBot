// @ts-check
"use strict";

const strings = require("../strings.js");
const {successEmbed} = require("../util.js");
	
module.exports = {
	run: async ({client, message, channelInfo: {prefix}, multiArgs}) => {
		const reactions = {
			"🏠": {
				name: "Help Menu - Home",
				string: strings.help.home
			},
			"🛠": {
				name: "Help Menu - Configuration",
				string: strings.help.config(client.user)
			},
			"📊": {
				name: "Help Menu - Stats Commands",
				string: strings.help.stats(prefix)
			},
			"⚙️": {
				name: "Help Menu - User Settings",
				string: strings.help.settings(prefix)
			},
			"ℹ": {
				name: "Help Menu - Other Commands",
				string: strings.help.info(prefix)
			}
		};
	
		const aliases = {
			home: "🏠", main: "🏠",
			config: "🛠", configuration: "🛠", setup: "🛠", "setup commands": "🛠", "config commands": "🛠",
			stats: "📊", statistics: "📊", stat: "📊", "stats commands": "📊",
			setting: "⚙️", settings: "⚙️", option: "⚙️", options: "⚙️", "user settings": "⚙️",
			other: "ℹ", info: "ℹ", commands: "ℹ", "other commands": "ℹ"
		};
	
		let game = multiArgs === "" ? "home" : multiArgs.toLowerCase();
		game = reactions[aliases[game]];
		
		const embed = successEmbed(
			message.author,
			game.string, game.name,
			"https://findicons.com/files/icons/1008/quiet/128/information.png"
		);
	
		const msg = await message.channel.send(embed);
		for (const emoji in reactions) await msg.react(emoji);
	
		const collector = msg.createReactionCollector((_, user) => user.id === message.author.id, {time: 60000});
		collector.on("collect", async (reaction, user) => {
			collector.resetTimer({time: 60000});
			await reaction.users.remove(user.id).catch(() => {});
	
			if (!(reaction.emoji.name in reactions)) return;
			const menu = reactions[reaction.emoji.name];
			msg.edit(embed.setTitle(menu.name).setDescription(menu.string));
		});
	},
	aliases: ["tnthelp"],
	requiresConfiguredChannel: true
};
