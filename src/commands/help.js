const Discord = require("discord.js");
const {randomChoice, embedFooter, noop} = require("../util.js");

// Sad formatting :'(
const TEXT = {
home:
`:house:: Home
:bar_chart:: Stat Commands
:tools:: QoL Commands
:information_source:: Bot Information Commands
:track_next:: Latest Update Info

**/tntconfigure [game] [prefix]** - Configure the bot to *this* channel. Game options include All, Wizards, Bowspleef, TNT Tag, TNT Run, PVP Run.
**/tntremove** - Remove this channel from the bot's list of channels.
**/tnthelp** - Opens this menu
**/ping** - Check Bot Connection`,

stats:
`**${"!" /*prefix*/}stats all {username}** - Shows overall TNT Games Stats
**${"!" /*prefix*/}stats run {username}** - Shows TNT Run Stats
**${"!" /*prefix*/}stats tag {username}** - Shows TNT Tag Stats
**${"!" /*prefix*/}stats bowspleef {username}** - Shows Bowspleef Stats
**${"!" /*prefix*/}stats wizards {username}** - Shows TNT Wizards Stats
**${"!" /*prefix*/}stats pvp {username}** - Shows PVP Run Stats
**${"!" /*prefix*/}kills {username}** - Shows TNT Wizards kills by class

*()s show changes since your last stats call for that user*
*Game defaults to your channel-configured game if not specified*
*Username defaults to your verified username if not specified*`,

qol:
`**${"!" /*prefix*/}account {User ping}** - Shows the account of the specified player if they are verified
**${"!" /*prefix*/}set {username}** - Sets your username. Requires you to set your discord tag in Hypixel
**${"!" /*prefix*/}settings {setting} {value}** - Configures the setting to the value specified
**${"!" /*prefix*/}reset** - Updates your personal stats in the cache. Only useful if reset setting is false

:gear:: Settings Info`,

info:
`**${"!" /*prefix*/}help** - Opens this menu
**${"!" /*prefix*/}info** - Shows bot info
**${"!" /*prefix*/}invite** - Pastes bot invite link
**${"!" /*prefix*/}source** - Pastes bot source code link
**${"!" /*prefix*/}discord** - Pastes the links of TNT Game discord servers
**${"!" /*prefix*/}mysterium** - See more about the bot creator
**${"!" /*prefix*/}bugs** - Pastes server invite link to report bugs`,

update:
`- Created Interactive Help Menu
- Added duels gamemode support
- Fixed ()s with time bug
- Formatted playtime
- Added owner-only announcement command
- Added some command aliases
- Added new weekly and monthly stats system`,

settings: 
`Format: **Setting** *(Acceptable Values)* - Description - Default: __Value__

**Verbose** *(True/False)* - Show more stats - Default: __False__
**Reset** *(True/False)* - Do not update cache so ()s will stay until you do /reset. Only works on your own registered ign - Default: __True__`
};

module.exports = {
	run: async (client, message, args) => {
		const embed = new Discord.MessageEmbed();
		embed.setColor("#3bcc71");
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle("Help Menu - Home");
		embed.setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`);
		embed.setTimestamp().setFooter(randomChoice(embedFooter.text), embedFooter.image.green);
		embed.setDescription(TEXT.home);

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
				msg.edit(embed.setTitle("Help Menu - Home").setDescription(TEXT.home));
			} else if (reaction.emoji.name === "📊") {
				msg.edit(embed.setTitle("Help Menu - Stats Commands").setDescription(TEXT.stats));
			} else if (reaction.emoji.name === "ℹ") {
				msg.edit(embed.setTitle("Help Menu - Bot Info Commands").setDescription(TEXT.info));
			} else if (reaction.emoji.name === "⏭") {
				msg.edit(embed.setTitle("Latest Update: v5.0.0").setDescription(TEXT.update));
			}

			if (reaction.emoji.name == "⚙") {
				msg.edit(embed.setTitle("Help Menu - Settings Info").setDescription(TEXT.settings));
				return;
			} else if (reaction.emoji.name === "🛠") {
				msg.edit(embed.setTitle("Help Menu - QoL Commands").setDescription(TEXT.qol));
				msg.react("⚙");
			} else if (reaction.message.reactions.cache.has("⚙")) {
				await reaction.message.reactions.cache.get("⚙").users.remove(client.user.id);
			}
		});
	},
	aliases: []
};
