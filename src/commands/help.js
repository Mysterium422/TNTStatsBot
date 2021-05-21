const strings = require("../strings.js");
const {noop, successEmbed} = require("../util.js");

module.exports = {
	run: async ({client, message, channelInfo: {prefix}}) => {
		// TODO: Embeds for each menu
		// FIXME: No configuration menu!
		const reactions = {
			"🏠": {
				name: "Help Menu - Home",
				string: strings.help.home
			},
			"🛠": {
				name: "Help Menu - Configuration",
				string: strings.help.config
			},
			"🔁": {
				name: "Help Menu - Update Information",
				string: strings.help.update
			},
			"📊": {
				name: "Help Menu - Stats Commands",
				string: strings.help.stats(prefix)
			},
			"🔗": {
				name: "Help Menu - Account Linking",
				string: strings.help.linking(prefix)
			},
			"⚙️": {
				name: "Help Menu - User Settings",
				string: strings.help.settings
			},
			"ℹ": {
				name: "Help Menu - Other Commands",
				string: strings.help.info(prefix)
			}
		};

		const embed = successEmbed(
			message.author,
			reactions["🏠"].string,
			reactions["🏠"].name,
			"https://findicons.com/files/icons/1008/quiet/128/information.png"
		);

		const msg = await message.channel.send(embed);
		for (const emoji in reactions) await msg.react(emoji);

		const collector = msg.createReactionCollector((_, user) => user.id === message.author.id, {time: 60000});
		collector.on("collect", async (reaction, user) => {
			collector.resetTimer({time: 60000});
			await reaction.users.remove(user.id).catch(noop);

			if (!(reaction.emoji.name in reactions)) return;
			const menu = reactions[reaction.emoji.name];
			msg.edit(embed.setTitle(menu.name).setDescription(menu.string));
		});
	},
	aliases: ["tnthelp"],
	requiresConfiguredChannel: true
};
