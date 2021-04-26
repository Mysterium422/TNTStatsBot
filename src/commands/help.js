const Discord = require("discord.js");
const strings = require("../strings.js");
const {randomChoice, embedFooter, noop} = require("../util.js");

module.exports = {
	run: async (client, message, args, prefix) => {
		const embed = new Discord.MessageEmbed();
		embed.setColor("#3bcc71");
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle("Help Menu - Home");
		embed.setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`);
		embed.setTimestamp().setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		embed.setDescription(strings.help_home);

		const msg = await message.channel.send(embed);
		msg.react("🏠")
		.then(msg.react("📊"))
		.then(msg.react("🛠"))
		.then(msg.react("ℹ"))
		.then(msg.react("⏭"));

		const collector = msg.createReactionCollector((_, user) => user.id === message.author.id, {time: 60000});
		collector.on("collect", async (reaction, user) => {
			collector.resetTimer({time: 60000});
			await reaction.users.remove(user.id).catch(noop);
			const embed = new Discord.MessageEmbed();
			embed.setColor("#3bcc71");
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`);
			embed.setTimestamp();
			embed.setFooter("Created by Mysterium", embedFooter.image.green);
			
			if (reaction.emoji.name === "🏠") {
				msg.edit(embed.setTitle("Help Menu - Home").setDescription(strings.help_home));
			} else if (reaction.emoji.name === "📊") {
				msg.edit(embed.setTitle("Help Menu - Stats Commands").setDescription(strings.help_stats(prefix)));
			} else if (reaction.emoji.name === "ℹ") {
				msg.edit(embed.setTitle("Help Menu - Bot Info Commands").setDescription(strings.help_info(prefix)));
			} else if (reaction.emoji.name === "⏭") {
				msg.edit(embed.setTitle("Latest Update: v5.0.0").setDescription(strings.help_update));
			}

			if (reaction.emoji.name == "⚙") {
				msg.edit(embed.setTitle("Help Menu - Settings Info").setDescription(strings.help_settings));
				return;
			} else if (reaction.emoji.name === "🛠") {
				msg.edit(embed.setTitle("Help Menu - QoL Commands").setDescription(strings.help_qol(prefix)));
				msg.react("⚙");
			} else if (reaction.message.reactions.cache.has("⚙")) {
				await reaction.message.reactions.cache.get("⚙").users.remove(client.user.id);
			}
		});
	},
	aliases: []
};
