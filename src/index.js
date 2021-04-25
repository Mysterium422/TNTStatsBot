// FIND PACKAGES
const Discord = require("discord.js"),
	fs = require("fs"),
	db = require("./db"),
	path = require("path");

const {mojangUUIDFetch, hypixelFetch, randInt, replaceError, ChatCodes, ChatColor, formatTimestamp, booleanPhrases} = require("./util.js");

const client = new Discord.Client();
const config = require("../config.json");

let isReady = false;
const commands = {};
client.on("ready", async () => {
	console.log("[INFO] Initializing...");

	// DEBUG ONLY!!
	await db.reset();
	// DEBUG ONLY!!

	try {
		await db.createTable();
		console.log("[SUCCESS] Loaded database...");
	} catch(e) {
		console.error("[ERROR] Failed to load database! Aborting...");
		throw e;
	}

	try {
		fs.readdirSync(path.resolve(__dirname, "commands")).forEach(fileName => {
			const obj = require("./commands/" + fileName);
			// Slice to remove `.js`
			commands[fileName.slice(0, -3)] = obj;
		});
		console.log("[SUCCESS] Loaded commands...");
	} catch(e) {
		console.error("[ERROR] Failed to load commands! Aborting...");
		throw e;
	}

	console.log("[SUCCESS] Bot is now online and listening for commands!");
	client.user.setActivity("TNT Games | Use /TNThelp");
	isReady = true;
});

client.on("message", async message => {
	const prefix = "!";
	if (message.author.bot || !message.content.startsWith(prefix)) return;

	if (!isReady) {
		message.channel.send("I'm not ready, please try again in a few seconds...");
		return;
	}

	const args = message.content.slice(prefix.length).split(" ");
	const command = args.shift().toLowerCase();

	if (command in commands) {
		try {
			await commands[command].run(client, message, args, prefix);
		} catch (up) {
			// Debug
			message.channel.send("An internal error occoured, see the stacktrace below:");
			message.channel.send("```" + up.stack + "```");
			throw up; // ha ha!
		}
	} else {
		message.channel.send("Command does not exist!");
	}

	if (1 + 1 === 2) return; // Debug

	if (message.content.startsWith("<@!735055542178938960>")) {
		const channel = await db.get("chan_" + message.channel.id);
		if (channel === null) {
			if (message.member.hasPermission("ADMINISTRATOR")) {
				return message.channel.send("Channel not configured (Use /TNTconfigure)");
			} else {
				return message.channel.send("Channel not configured");
			}
		} else {
			return message.channel.send(`My prefix in this channel is: ${channel.prefix}\nMy default game in this channel is: ${channel.game}`);
		}
	} else if (message.content.toLowerCase().startsWith("/tntconfigure")) {
		const configurationTool = {
			all: "All TNT Games",
			wizards: "TNT Wizards",
			run: "TNT Run",
			pvp: "PVP Run",
			tag: "TNT Tag",
			bowspleef: "Bow spleef"
		};

		if (!message.member.hasPermission("ADMINISTRATOR") && message.author.id != config.masterID) return;
		console.log(`${message.author.username}: ${message.content}`);

		const args = message.content.slice(14).split(" ");

		if (!(args[0] in configurationTool)) {
			return sendErrorEmbed(message.channel, `First Paramenter Invalid`, `Looking for: all, wizards, run, pvp, tag, or bowspleef`);
		}
		if (args.length == 1) {
			return sendErrorEmbed(message.channel, `Second Parameter Invalid`, `No Parameter was found`);
		}
		if (args.length > 2) {
			return sendErrorEmbed(message.channel, `Prefix Invalid`, `No Spaces in the prefix!`);
		}

		await db.set(`chan_${message.channel.id}`, {
			game: args[0],
			prefix: args[1]
		});

		const embed = new Discord.MessageEmbed().setColor("#00BF00").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`Success! Channel Configured`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`__Default Game:__`, configurationTool[args[0]], true).addField(`__Bot Prefix:__`, args[1], true);
		return message.channel.send(embed);
	} else if (message.content.toLowerCase() == "/tntremove") {
		if (!message.member.hasPermission("ADMINISTRATOR") && message.author.id != config.masterID) return;

		await db.deconste(`chan_${message.channel.id}`);
		message.channel.send("I will no longer respond to messages in this channel");
	} else if (message.content.toLowerCase().startsWith("/tnthelp")) {
		const prefix = "/";
		const msg = await message.channel.send(new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle("Help Menu - Home").setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).setDescription(`:house:: Home\n:bar_chart:: Stat Commands\n:tools:: QoL Commands \n:information_source:: Bot Information Commands\n:track_next:: Latest Update Info`));
		msg.react("🏠").then(msg.react("📊").then(msg.react("🛠").then(msg.react("ℹ").then(msg.react("⏭")))));

		const filter = (reaction, user) => user.id === message.author.id;

		const collector = msg.createReactionCollector(filter, {
			time: 60000
		});
		collector.on("collect", async (reaction, user) => {
			collector.resetTimer({
				time: 60000
			});

			await reaction.users.remove(user.id).catch(() => {
				return;
			});

			if (reaction.emoji.name == "🏠") {
				if (reaction.message.reactions.cache.has("⚙")) {
					await reaction.message.reactions.cache.get("⚙").users.remove(client.user.id);
				}
				msg.edit(
					new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle("Help Menu - Home").setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter("Created by Mysterium", embedFooter.image.green).setDescription(`:house:: Home\n:bar_chart:: Stat Commands
:tools:: QoL Commands 
:information_source:: Bot Information Commands
:track_next:: Latest Update Info

**/tntconfigure [game] [prefix]** - Configure the bot to *this* channel. Game options include All, Wizards, Bowspleef, TNT Tag, TNT Run, PVP Run.
**/tntremove** - Remove this channel from the bot's list of channels.
**/tnthelp** - Opens this menu
**/ping** - Check Bot Connection`)
				);
			} else if (reaction.emoji.name == "📊") {
				if (reaction.message.reactions.cache.has("⚙")) {
					await reaction.message.reactions.cache.get("⚙").users.remove(client.user.id);
				}
				msg.edit(
					new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle("Help Menu - Stat Commands").setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter("Created by Mysterium_", embedFooter.image.green).setDescription(`**${prefix}stats all {username}** - Shows overall TNT Games Stats
**${prefix}stats run {username}** - Shows TNT Run Stats
**${prefix}stats tag {username}** - Shows TNT Tag Stats
**${prefix}stats bowspleef {username}** - Shows Bowspleef Stats
**${prefix}stats wizards {username}** - Shows TNT Wizards Stats
**${prefix}stats pvp {username}** - Shows PVP Run Stats
**${prefix}kills {username}** - Shows TNT Wizards kills by class
			
*()s show changes since your last stats call for that user*
*Game defaults to your channel-configured game if not specified*
*Username defaults to your verified username if not specified*`)
				);
			} else if (reaction.emoji.name == "🛠") {
				await msg.react("⚙");
				msg.edit(
					new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle("Help Menu - QoL Commands").setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter("Created by Mysterium_", embedFooter.image.green).setDescription(`**${prefix}account {User ping}** - Shows the account of the specified player if they are verified
**${prefix}set {username}** - Sets your username. Requires you to set your discord tag in Hypixel
**${prefix}settings {setting} {value}** - Configures the setting to the value specified
**${prefix}reset** - Updates your personal stats in the cache. Only useful if reset setting is false
			
:gear:: Settings Info`)
				);
			} else if (reaction.emoji.name == "ℹ") {
				if (reaction.message.reactions.cache.has("⚙")) {
					await reaction.message.reactions.cache.get("⚙").users.remove(client.user.id);
				}
				msg.edit(
					new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle("Help Menu - Bot Info Commands").setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter("Created by Mysterium_", embedFooter.image.green).setDescription(`**${prefix}help** - Opens this menu
**${prefix}info** - Shows bot info
**${prefix}invite** - Pastes bot invite link
**${prefix}source** - Pastes bot source code link
**${prefix}discord** - Pastes the links of TNT Game discord servers
**${prefix}mysterium** - See more about the bot creator
**${prefix}bugs** - Pastes server invite link to report bugs`)
				);
			} else if (reaction.emoji.name == "⏭") {
				if (reaction.message.reactions.cache.has("⚙")) {
					await reaction.message.reactions.cache.get("⚙").users.remove(client.user.id);
				}
				msg.edit(
					// MAINBOTEDIT
					new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`Latest Update v${pkg.version}${config.canary ? "dev" : ""}`).setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter("Created by Mysterium_", embedFooter.image.green).setDescription(`- Created Interactive Help Menu
- Added duels gamemode support
- Fixed ()s with time bug
- Formatted playtime
- Added owner-only announcement command
- Added some command aliases
- Added new weekly and monthly stats system`)
				);
			} else if (reaction.emoji.name == "⚙") {
				msg.edit(
					new Discord.MessageEmbed().setColor("#3bcc71").setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle("Help Menu - Settings Info").setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`).setTimestamp().setFooter("Created by Mysterium_", embedFooter.image.green).setDescription(`Format: **Setting** *(Acceptable Values)* - Description - Default: __Value__
			
**Verbose** *(True/False)* - Show more stats - Default: __False__
**Reset** *(True/False)* - Do not update cache so ()s will stay until you do /reset. Only works on your own registered ign - Default: __True__`)
				);
			}
		});
	}

	// let channel = await db.get("chan_" + m.channel.id);
	// if (channel === null) return;
	// const prefix = channel.prefix;
	// if (!m.content.startsWith(prefix)) return;
	// let game = channel.game;

	if (command.toLowerCase() === "verifyalt") {
		if (message.author.id != config.masterID) return;
		if (args.length != 2) {
			return message.channel.send("Incorrect amount of arguments");
		}
		if (!args[0].includes("@")) {
			return message.channel.send("First Arg must be a ping");
		}

		if (args[1].length > 20) {
			data = await hypixelFetch(`player?uuid=${args[1]}`);
		} else {
			const uuidInput = await mojangUUIDFetch(args[1]).catch(() => {
				return {
					id: "UUIDINVALID12345678910"
				};
			});

			if (uuidInput.id.length > 20) {
				data = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				data = await hypixelFetch(`player?name=${args[1]}`);
			}
		}

		if (data == "API ERROR") {
			return message.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!data.success || data.success == false || data.player == null || data.player == undefined || !data.player || data.player.stats == undefined) return message.channel.send("Invalid Something");
		if (data.player.stats.TNTGames == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		idData[data.player.uuid] = args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "");

		fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));
		message.channel.send(`Registered ${data.player.displayname} to ${args[0]}`);
		return;
	} else if (command.toLowerCase() === "set") {
		
	} else if (command.toLowerCase() === "stats") {
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		if ((await db.get(message.author.id)) == undefined) {
			await db.set(message.author.id, {
				verbose: false,
				reset: true
			});
		}

		const settings = await db.get(message.author.id);
		let reset = true;

		// Parse Args
		if (args.length == 0) {
			username = idData[message.author.id];
			if (!settings.reset) {
				reset = false;
			}
		} else if (args.length == 1) {
			const games = [
				"all",
				"overall",
				"wiz",
				"wizard",
				"wizards",
				"tntrun",
				"run",
				"pvprun",
				"pvp",
				"tnttag",
				"tag",
				"bow",
				"spleef",
				"bowspleef",
				"duel",
				"duels",
				"tntduels"
			];
			if (games.includes(args[0].toLowerCase())) {
				game = args[0].toLowerCase();
				username = idData[message.author.id];
			} else if (args[0].includes("<@!")) {
				username = idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")];
				game = await db.get("chan_" + message.channel.id + ".game");
				if (!settings.reset) {
					reset = false;
				}
			} else {
				game = await db.get("chan_" + message.channel.id + ".game");
				username = args[0];
			}
		} else if (args.length == 2) {
			game = args[0];
			if (args[1].includes("<@")) {
				username = idData[args[1].replace("<", "").replace(">", "").replace("@", "").replace("!", "")];
			} else {
				username = args[1];
			}
		} else {
			return sendErrorEmbed(message.channel, "Too many arguments", `Format: ${prefix}stats [game] [username]`);
		}
		if (!username) {
			return sendErrorEmbed(message.channel, "Invalid username", `User does not exist OR User has not set their IGN with ${prefix}set`);
		}
		if (username.length > 20) {
			user = await hypixelFetch(`player?uuid=${username}`);
		} else {
			const uuidInput = await mojangUUIDFetch(username).catch(() => {
				return {
					id: "UUIDINVALID12345678910"
				};
			});
			console.log(uuidInput);

			if (uuidInput.id.length > 20) {
				user = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				user = await hypixelFetch(`player?name=${username}`);
			}
		}

		if (user == "API ERROR") {
			return message.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if ((await db.get(`weekly.${user.player.uuid}`)) == undefined) {
			await setWeeklyDB(user.player, user.player.uuid);
		}
		if ((await db.get(`monthly.${user.player.uuid}`)) == undefined) {
			await setMonthlyDB(user.player, user.player.uuid);
		}
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		const TNTGames = user.player.stats.TNTGames;

		data = await db.get(`cache.${message.author.id}.${user.player.uuid}`);
		if (data == undefined) {
			await setCacheDB(user.player, user.player.uuid, message.author.id);
			data = await db.get(`cache.${message.author.id}.${user.player.uuid}`);
		}

		rankData = findRank(user);

		if (game == "run" || game == "tntrun") {
			if (TNTGames.record_tntrun == undefined) {
				const runRecordDifference = 0;
			} else {
				const runRecordDifference = TNTGames.record_tntrun - data.run.record;
			}
			if (runRecordDifference > 0) {
				const runRecordDisplay = min_sec(replaceError(TNTGames.record_tntrun, 0)) + " (+" + min_sec(runRecordDifference) + ")";
			} else {
				const runRecordDisplay = min_sec(replaceError(TNTGames.record_tntrun, 0));
			}

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Run Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Record**`, runRecordDisplay, true).addField(`**Wins**`, displayOldNewNumbers(data.run.w, replaceError(TNTGames.wins_tntrun, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.run.l, replaceError(TNTGames.deaths_tntrun, 0)), true).addField(`**Potions Thrown**`, displayOldNewNumbers(data.run.potions, replaceError(TNTGames.run_potions_splashed_on_players, 0)), true).addField(`**W/L**`, displayOldNewNumbers(Math.round(data.run.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_tntrun, TNTGames.deaths_tntrun) * 1000) / 1000), true).addField(`**Blocks Broken**`, displayOldNewNumbers(data.run.blocks, replaceError(user.player.achievements.tntgames_block_runner, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (reset) {
				await setRunDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "pvp" || game == "pvprun") {
			if (TNTGames.record_pvprun == undefined) {
				const pvpRecordDifference = 0;
			} else {
				const pvpRecordDifference = TNTGames.record_pvprun - data.pvp.record;
			}
			if (pvpRecordDifference > 0) {
				const pvpRecordDisplay = min_sec(replaceError(TNTGames.record_pvprun, 0)) + " (+" + min_sec(pvpRecordDifference) + ")";
			} else {
				const pvpRecordDisplay = min_sec(replaceError(TNTGames.record_pvprun, 0));
			}

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s PVP Run Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Record**`, pvpRecordDisplay, true).addField(`**Wins**`, displayOldNewNumbers(data.pvp.w, replaceError(TNTGames.wins_pvprun, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.pvp.l, replaceError(TNTGames.deaths_pvprun, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.pvp.k, replaceError(TNTGames.kills_pvprun, 0)), true).addField(`**W/L**`, displayOldNewNumbers(Math.round(data.pvp.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_pvprun, TNTGames.deaths_pvprun) * 1000) / 1000), true).addField(`**KDR**`, displayOldNewNumbers(Math.round(data.pvp.kd * 1000) / 1000, Math.round(ratio(TNTGames.kills_pvprun, TNTGames.deaths_pvprun) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setPVPDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "bowspleef" || game == "bow" || game == "spleef") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(data.bow.w, replaceError(TNTGames.wins_bowspleef, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.bow.l, replaceError(TNTGames.deaths_bowspleef, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.bow.k, replaceError(TNTGames.kills_bowspleef, 0)), true).addField(`**Shots**`, displayOldNewNumbers(data.bow.shots, replaceError(TNTGames.tags_bowspleef, 0)), true).addField(`**W/L**`, displayOldNewNumbers(Math.round(data.bow.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_bowspleef, TNTGames.deaths_bowspleef) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setBowDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "tag" || game == "tnttag") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Tag Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(data.tag.w, replaceError(TNTGames.wins_tntag, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true).addField(`**K/W**`, displayOldNewNumbers(Math.round(data.tag.kw * 1000) / 1000, Math.round(ratio(TNTGames.kills_tntag, TNTGames.wins_tntag) * 1000) / 1000), true).addField(`**Tags**`, displayOldNewNumbers(data.tag.tags, replaceError(user.player.achievements.tntgames_clinic, 0)), true).addField(`**Tags/Kill**`, displayOldNewNumbers(Math.round(data.tag.tk * 1000) / 1000, Math.round(ratio(user.player.achievements.tntgames_clinic, TNTGames.kills_tntag) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setTagDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "wizards" || game == "wiz" || game == "wizard") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Stats`).setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(data.wizards.w, replaceError(TNTGames.wins_capture, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.wizards.k, replaceError(TNTGames.kills_capture, 0)), true).addField(`**Assists**`, displayOldNewNumbers(data.wizards.a, replaceError(TNTGames.assists_capture, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.wizards.d, replaceError(TNTGames.deaths_capture, 0)), true).addField(`**Points Captured**`, displayOldNewNumbers(data.wizards.p, replaceError(TNTGames.points_capture, 0)), true).addField(`**KDR**`, displayOldNewNumbers(Math.round(data.wizards.kd * 1000) / 1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.deaths_capture) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (settings.verbose) {
				if (TNTGames.air_time_capture == undefined) {
					const airTimeDifference = 0;
				} else {
					const airTimeDifference = TNTGames.air_time_capture - data.wizards.air;
				}
				if (airTimeDifference > 0) {
					const airTimeDisplay = min_sec(Math.floor(replaceError(TNTGames.air_time_capture, 0) / 1200)) + " (+" + min_sec(Math.floor(airTimeDifference / 1200)) + ")";
				} else {
					const airTimeDisplay = min_sec(Math.floor(replaceError(TNTGames.air_time_capture, 0) / 1200));
				}

				embed.addField(`**Airtime**`, airTimeDisplay, true).addField(`**KADR**`, displayOldNewNumbers(Math.round(data.wizards.kad * 1000) / 1000, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0), TNTGames.deaths_capture) * 1000) / 1000), true).addField(`**K/W**`, displayOldNewNumbers(Math.round(data.wizards.kw * 1000) / 1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.wins_capture) * 1000) / 1000), true).addField(`**Fire**`, displayOldNewNumbers(data.wizardKills.f_k, replaceError(TNTGames.new_firewizard_kills, 0)), true).addField(`**Ice**`, displayOldNewNumbers(data.wizardKills.i_k, replaceError(TNTGames.new_icewizard_kills, 0)), true).addField(`**Wither**`, displayOldNewNumbers(data.wizardKills.w_k, replaceError(TNTGames.new_witherwizard_kills, 0)), true).addField(`**Kinetic**`, displayOldNewNumbers(data.wizardKills.k_k, replaceError(TNTGames.new_kineticwizard_kills, 0)), true).addField(`**Blood**`, displayOldNewNumbers(data.wizardKills.b_k, replaceError(TNTGames.new_bloodwizard_kills, 0)), true).addField(`**Toxic**`, displayOldNewNumbers(data.wizardKills.t_k, replaceError(TNTGames.new_toxicwizard_kills, 0)), true).addField(`**Hydro**`, displayOldNewNumbers(data.wizardKills.h_k, replaceError(TNTGames.new_hydrowizard_kills, 0)), true).addField(`**Ancient**`, displayOldNewNumbers(data.wizardKills.a_k, replaceError(TNTGames.new_ancientwizard_kills, 0)), true).addField(`**Storm**`, displayOldNewNumbers(data.wizardKills.s_k, replaceError(TNTGames.new_stormwizard_kills, 0)), true);
			}
			if (settings.verbose && reset) {
				await setWizKillsDB(user.player, user.player.uuid, message.author.id);
			}
			if (reset) {
				await setWizDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "all" || game == "overall") {
			if (TNTGames.record_tntrun == undefined) {
				const runRecordDifference = 0;
			} else {
				const runRecordDifference = TNTGames.record_tntrun - data.allTNT.record_tntrun;
			}
			if (runRecordDifference > 0) {
				const runRecordDisplay = min_sec(TNTGames.record_tntrun) + " (+" + min_sec(runRecordDifference) + ")";
			} else {
				const runRecordDisplay = min_sec(TNTGames.record_tntrun);
			}

			if (TNTGames.record_pvprun == undefined) {
				const pvpRecordDifference = 0;
			} else {
				const pvpRecordDifference = TNTGames.record_pvprun - data.allTNT.record_pvprun;
			}
			if (pvpRecordDifference > 0) {
				const pvpRecordDisplay = min_sec(TNTGames.record_pvprun) + " (+" + min_sec(pvpRecordDifference) + ")";
			} else {
				const pvpRecordDisplay = min_sec(TNTGames.record_pvprun);
			}

			if (user.player.achievements.tntgames_tnt_triathlon == undefined) {
				const playTimeDifference = 0;
			} else {
				const playTimeDifference = user.player.achievements.tntgames_tnt_triathlon - data.allTNT.time;
			}

			if (playTimeDifference > 0) {
				const playTimeDisplay = min_sec(replaceError(user.player.achievements.tntgames_tnt_triathlon, 0)) + " (+" + min_sec(playTimeDifference) + ")";
			} else {
				const playTimeDisplay = min_sec(user.player.achievements.tntgames_tnt_triathlon);
			}

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Games Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Coins**`, displayOldNewNumbers(data.allTNT.coins, replaceError(TNTGames.coins, 0)), true).addField(`**Winstreak**`, displayOldNewNumbers(data.allTNT.streak, replaceError(TNTGames.winstreak, 0)), true).addField(`**Playtime**`, playTimeDisplay, true).addField(`**TNT Wins**`, displayOldNewNumbers(data.allTNT.total_wins, replaceError(TNTGames.wins_tntrun, 0) + replaceError(TNTGames.wins_pvprun, 0) + replaceError(TNTGames.wins_tntag, 0) + replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0)), true).addField(`**Tag Wins**`, displayOldNewNumbers(data.allTNT.tag_wins, replaceError(TNTGames.wins_tntag, 0)), true).addField(`**TNT Run Record**`, runRecordDisplay, true).addField(`**TNT Run Wins**`, displayOldNewNumbers(data.allTNT.run_wins, replaceError(TNTGames.wins_tntrun, 0)), true).addField(`**Bowspleef Wins**`, displayOldNewNumbers(data.allTNT.bow_wins, replaceError(TNTGames.wins_bowspleef, 0)), true).addField(`**Wizards Wins**`, displayOldNewNumbers(data.allTNT.wizards_wins, replaceError(TNTGames.wins_capture, 0)), true).addField(`**Wizards Kills**`, displayOldNewNumbers(data.allTNT.wizards_kills, replaceError(TNTGames.kills_capture, 0)), true).addField(`**PVP Run Record**`, pvpRecordDisplay, true).addField(`**PVP Run Wins**`, displayOldNewNumbers(data.allTNT.pvp_wins, replaceError(TNTGames.wins_pvprun, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (reset) {
				await setAllDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "duel" || game == "duels") {
			if (user.player.stats.Duels == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Duels Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(replaceError(data.duels.w, 0), replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)), true).addField(`**Losses**`, displayOldNewNumbers(replaceError(data.duels.l, 0), replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)), true).addField(`**Shots**`, displayOldNewNumbers(replaceError(data.duels.shots, 0), replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0)), true).addField(`**W/L**`, displayOldNewNumbers(replaceError(data.duels.wl, 0), ratio(user.player.stats.Duels.bowspleef_duel_wins, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0))), true).addField(`**Best Streak**`, displayOldNewNumbers(replaceError(data.duels.streak, 0), replaceError(user.player.stats.Duels.best_tnt_games_winstreak, 0)), true).addField(`**Current Streak**`, displayOldNewNumbers(replaceError(data.duels.currentStreak, 0), replaceError(user.player.stats.Duels.current_tnt_games_winstreak, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (reset) {
				await setDuelDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		}
	} else if (command.toLowerCase() === "kills") {
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		if ((await db.get(message.author.id)) == undefined) {
			await db.set(message.author.id, {
				verbose: false,
				reset: true
			});
		}

		const settings = await db.get(message.author.id);
		let reset = true;

		// Parse Args
		if (args.length == 0) {
			username = idData[message.author.id];
			if (!settings.reset) {
				reset = false;
			}
		} else if (args.length == 1) {
			if (args[0].includes("<@!")) {
				username = idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")];
			} else {
				username = args[0];
			}
		} else {
			return sendErrorEmbed(message.channel, "Too many arguments", `Format: ${prefix}stats [game] [username]`);
		}

		if (username.length > 20) {
			user = await hypixelFetch(`player?uuid=${username}`);
		} else {
			const uuidInput = await mojangUUIDFetch(username).catch(() => {
				return {
					id: "UUIDINVALID12345678910"
				};
			});

			if (uuidInput.id.length > 20) {
				user = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				user = await hypixelFetch(`player?name=${username}`);
			}
		}

		if (user == "API ERROR") {
			return message.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user || !user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		const TNTGames = user.player.stats.TNTGames;
		data = await db.get("cache." + message.author.id + "." + user.player.uuid);
		if (data == undefined) {
			await setCacheDB(user.player, user.player.uuid, message.author.id);
			data = await db.get("cache." + message.author.id + "." + user.player.uuid);
		}
		rankData = findRank(user);

		const embed = new Discord.MessageEmbed()
			.setColor(`${rankData.color}`)
			.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`)
			.setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Kills`)
			.setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`)
			.setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
			// .setImage(`https://visage.surgeplay.com/frontfull/512/${user.player.uuid}`)
			.setTimestamp()
			.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
			.addField(`**Fire**`, displayOldNewNumbers(data.wizardKills.f_k, replaceError(TNTGames.new_firewizard_kills, 0)), true)
			.addField(`**Ice**`, displayOldNewNumbers(data.wizardKills.i_k, replaceError(TNTGames.new_icewizard_kills, 0)), true)
			.addField(`**Wither**`, displayOldNewNumbers(data.wizardKills.w_k, replaceError(TNTGames.new_witherwizard_kills, 0)), true)
			.addField(`**Kinetic**`, displayOldNewNumbers(data.wizardKills.k_k, replaceError(TNTGames.new_kineticwizard_kills, 0)), true)
			.addField(`**Blood**`, displayOldNewNumbers(data.wizardKills.b_k, replaceError(TNTGames.new_bloodwizard_kills, 0)), true)
			.addField(`**Toxic**`, displayOldNewNumbers(data.wizardKills.t_k, replaceError(TNTGames.new_toxicwizard_kills, 0)), true)
			.addField(`**Hydro**`, displayOldNewNumbers(data.wizardKills.h_k, replaceError(TNTGames.new_hydrowizard_kills, 0)), true)
			.addField(`**Ancient**`, displayOldNewNumbers(data.wizardKills.a_k, replaceError(TNTGames.new_ancientwizard_kills, 0)), true)
			.addField(`**Storm**`, displayOldNewNumbers(data.wizardKills.s_k, replaceError(TNTGames.new_stormwizard_kills, 0)), true)
			.setDescription("Total Kills: " + displayOldNewNumbers(data.wizardKills.total_k, replaceError(TNTGames.kills_capture, 0)));
		if (reset) {
			setWizKillsDB(user.player, user.player.uuid, message.author.id);
		}
		return message.channel.send(embed);
	} else if (command.toLowerCase() === "settings") {
		if (args.length != 2) {
			return sendErrorEmbed(message.channel, `Usage Error`, `Usage: ${prefix}settings [setting] [true/false]`);
		}

		if (args[0] == "verbose") {
			if (args[1] in booleanPhrases) {
				if ((await db.get(`${message.author.id}.verbose`)) == booleanPhrases[args[1]]) {
					message.channel.send("This setting was already set!");
				} else {
					message.channel.send("Settings changed!");
				}
				await db.set(`${message.author.id}.verbose`, booleanPhrases[args[1]]);
				return;
			} else {
				return sendErrorEmbed(message.channel, `Usage Error`, `Usage: ${prefix}settings verbose [true/false]`);
			}
		} else if (args[0] == "reset") {
			if (args[1] in booleanPhrases) {
				if ((await db.get(`${message.author.id}.reset`)) == booleanPhrases[args[1]]) {
					message.channel.send("This setting was already set!");
				} else {
					message.channel.send("Settings changed!");
				}
				await db.set(`${message.author.id}.reset`, booleanPhrases[args[1]]);
				return;
			} else {
				return sendErrorEmbed(message.channel, `Usage Error`, `Usage: ${prefix}settings reset [true/false]`);
			}
		}
	} else if (command.toLowerCase() === "reset") {
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		if (message.author.id in idData) {
			const user = await hypixelFetch(`player?uuid=${idData[message.author.id]}`);
		}
		if (user == "API ERROR") {
			return message.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user || !user.sjuccess || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		await setCacheDB(user.player, user.player.uuid, message.author.id);
		return message.channel.send(`Reset counters for you!`);
	} else if (command.toLowerCase() === "account") {
		if (args.length != 1) {
			return message.channel.send("Incorrect amount of arguments");
		}
		if (!args[0].includes("@")) {
			return message.channel.send("First Arg must be a ping");
		}
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		const idData = JSON.parse(received);

		if (args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "") in idData) {
			message.channel.send("https://namemc.com/profile/" + idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")]);
		} else {
			message.channel.send("No account registered to this ID");
		}
		return;
	} else if (command.toLowerCase() === "mysterium") {
		return message.channel.send("Hey! This bot was coded by Mysterium&Lebster!\nReport Bugs here: https://discord.gg/7Qb5xuJD4C\nHere's my website (WIP): <https://mysterium.me>");
	} else if (command.toLowerCase() === "announcement") {
		if (message.author.id != config.masterID) return;

		channelList = db.all().filter(a => {
			return a.ID.includes("chan_");
		});
		for (let i = 0; i < channelList.length; i++) {
			if (client.channels.cache.has(channelList[i].ID.slice(5))) {
				channel = await client.channels.cache.get(channelList[i].ID.slice(5));
				channel.send(message.content.slice("/announcement ".length)).catch();
			}
		}
	} else if (command.toLowerCase() === "ownercommand") {
		if (message.author.id != config.masterID) return;

		channelList = db.all().filter(a => {
			return a.ID.includes("chan_");
		});
		for (let i = 0; i < channelList.length; i++) {
			if (client.channels.cache.has(channelList[i].ID.slice(5))) {
				channel = await client.channels.cache.get(channelList[i].ID.slice(5));
				channel
					.send(
						new Discord.MessageEmbed()
							.setTitle("New Version: v4.0.0")
							.setDescription(
								`**- New Dynamic Help Menu** (do /help or /tnthelp to check it out) *Please give bot manage reactions perms for the best experience*
	**- Added TNT Duels stats!** /stats duels [username] to try that out (slightly unstable)
	**- Formatted Playtime** in all stats menu
	**- More command Aliases**
	**- Bug Squashing**
	- Groundwork for some new features`
							)
							.setTimestamp()
							.setColor("#3bcc71")
							.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
					)
					.catch(() => {
						return;
					});
			}
		}
	} else if (command.toLowerCase() === "weekly" || command == "monthly") {
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.warn("File is invalid!");
			process.exit();
		}
		idData = JSON.parse(received);

		if ((await db.get(message.author.id)) == undefined) {
			await db.set(message.author.id, {
				verbose: false,
				reset: true
			});
		}

		const settings = await db.get(message.author.id);
		let reset = true;

		// Parse Args
		if (args.length == 0) {
			username = idData[message.author.id];
			if (!settings.reset) {
				reset = false;
			}
		} else if (args.length == 1) {
			const games = [
				"all",
				"overall",
				"wiz",
				"wizard",
				"wizards",
				"tntrun",
				"run",
				"pvprun",
				"pvp",
				"tnttag",
				"tag",
				"bow",
				"spleef",
				"bowspleef",
				"duel",
				"duels",
				"tntduels"
			];
			if (games.includes(args[0].toLowerCase())) {
				game = args[0].toLowerCase();
				username = idData[message.author.id];
			} else if (args[0].includes("<@!")) {
				username = idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")];
				game = await db.get("chan_" + message.channel.id + ".game");
				if (!settings.reset) {
					reset = false;
				}
			} else {
				game = await db.get("chan_" + message.channel.id + ".game");
				username = args[0];
			}
		} else if (args.length == 2) {
			game = args[0];
			if (args[1].includes("<@")) {
				username = idData[args[1].replace("<", "").replace(">", "").replace("@", "").replace("!", "")];
			} else {
				username = args[1];
			}
		} else {
			return sendErrorEmbed(message.channel, "Too many arguments", `Format: ${prefix}stats [game] [username]`);
		}
		if (!username) {
			return sendErrorEmbed(message.channel, "Invalid username", `User does not exist OR User has not set their IGN with ${prefix}set`);
		}
		if (username.length > 20) {
			user = await hypixelFetch(`player?uuid=${username}`);
		} else {
			const uuidInput = await mojangUUIDFetch(username).catch(() => {
				return {
					id: "UUIDINVALID12345678910"
				};
			});
			console.log(uuidInput);

			if (uuidInput.id.length > 20) {
				user = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				user = await hypixelFetch(`player?name=${username}`);
			}
		}

		if (user == "API ERROR") {
			return message.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);
		if ((await db.get(`weekly.${user.player.uuid}`)) == undefined) {
			await setWeeklyDB(user.player, user.player.uuid);
		}
		if ((await db.get(`monthly.${user.player.uuid}`)) == undefined) {
			await setMonthlyDB(user.player, user.player.uuid);
		}
		data = await db.get(`${command}.${user.player.uuid}`);

		const TNTGames = user.player.stats.TNTGames;

		rankData = await findRank(user);

		if (game == "run" || game == "tntrun") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Run Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, replaceError(TNTGames.wins_tntrun, 0) - data.run.w, true).addField(`**Deaths**`, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l, true).addField(`**Potions Thrown**`, replaceError(TNTGames.run_potions_splashed_on_players, 0) - data.run.potions, true).addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_tntrun, 0) - data.run.w, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l) * 1000) / 1000, true).addField(`**Blocks Broken**`, replaceError(user.player.achievements.tntgames_block_runner, 0) - data.run.blocks, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "pvp" || game == "pvprun") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} PVP Run Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, true).addField(`**Deaths**`, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l, true).addField(`**Kills**`, replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, true).addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l) * 1000) / 1000, true).addField(`**KDR**`, Math.round(ratio(replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "bowspleef" || game == "bow" || game == "spleef") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, true).addField(`**Deaths**`, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l, true).addField(`**Kills**`, replaceError(TNTGames.kills_bowspleef, 0) - data.bow.k, true).addField(`**Shots**`, replaceError(TNTGames.tags_bowspleef, 0) - data.bow.shots, true).addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "tag" || game == "tnttag") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Tag Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, replaceError(TNTGames.wins_tntag, 0) - data.tag.w, true).addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true).addField(`**K/W**`, Math.round(ratio(replaceError(TNTGames.kills_tntag, 0) - data.tag.k, replaceError(TNTGames.wins_tntag, 0) - data.tag.w) * 1000) / 1000, true).addField(`**Tags**`, replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, true).addField(`**Tags/Kill**`, Math.round(ratio(replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, replaceError(TNTGames.kills_tntag, 0) - data.tag.k) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "wizards" || game == "wiz" || game == "wizard") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Wizards Stats`).setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, replaceError(TNTGames.wins_capture, 0) - data.wizards.w, true).addField(`**Kills**`, replaceError(TNTGames.kills_capture, 0) - data.wizards.k, true).addField(`**Assists**`, replaceError(TNTGames.assists_capture, 0) - data.wizards.a, true).addField(`**Deaths**`, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d, true).addField(`**Points Captured**`, replaceError(TNTGames.points_capture, 0) - data.wizards.p, true).addField(`**KDR**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);

			if (settings.verbose) {
				embed.addField(`**Airtime**`, min_sec(Math.floor((replaceError(TNTGames.air_time_capture, 0) - data.wizards.air) / 1200))).addField(`**KADR**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0) - data.wizards.k - data.wizards.a, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d) * 1000) / 1000, true).addField(`**K/W**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.wins_capture, 0) - data.wizards.w) * 1000) / 1000, true).addField(`**Fire**`, replaceError(TNTGames.new_firewizard_kills, 0) - data.wizardKills.f_k, true).addField(`**Ice**`, replaceError(TNTGames.new_icewizard_kills, 0) - data.wizardKills.i_k, true).addField(`**Wither**`, replaceError(TNTGames.new_witherwizard_kills, 0) - data.wizardKills.w_k, true).addField(`**Kinetic**`, replaceError(TNTGames.new_kineticwizard_kills, 0) - data.wizardKills.k_k, true).addField(`**Blood**`, replaceError(TNTGames.new_bloodwizard_kills, 0) - data.wizardKills.b_k, true).addField(`**Toxic**`, replaceError(TNTGames.new_toxicwizard_kills, 0) - data.wizardKills.t_k, true).addField(`**Hydro**`, replaceError(TNTGames.new_hydrowizard_kills, 0) - data.wizardKills.h_k, true).addField(`**Ancient**`, replaceError(TNTGames.new_ancientwizard_kills, 0) - data.wizardKills.a_k, true).addField(`**Storm**`, replaceError(TNTGames.new_stormwizard_kills, 0) - data.wizardKills.s_k, true);
			}
			return message.channel.send(embed);
		} else if (game == "all" || game == "overall") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Games Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Coins**`, replaceError(TNTGames.coins, 0) - data.allTNT.coins, true).addField(`**Playtime**`, min_sec(replaceError(user.player.achievements.tntgames_tnt_triathlon, 0) - data.allTNT.time), true).addField(`**TNT Wins**`, replaceError(TNTGames.wins_tntrun, 0) + replaceError(TNTGames.wins_pvprun, 0) + replaceError(TNTGames.wins_tntag, 0) + replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0) - data.allTNT.total_wins, true).addField(`**Tag Wins**`, replaceError(TNTGames.wins_tntag, 0) - data.allTNT.tag_wins, true).addField(`**TNT Run Wins**`, replaceError(TNTGames.wins_tntrun, 0) - data.allTNT.run_wins, true).addField(`**Bowspleef Wins**`, replaceError(TNTGames.wins_bowspleef, 0) - data.allTNT.bow_wins, true).addField(`**Wizards Wins**`, replaceError(TNTGames.wins_capture, 0) - data.allTNT.wizards_wins, true).addField(`**Wizards Kills**`, replaceError(TNTGames.kills_capture, 0) - data.allTNT.wizards_kills, true).addField(`**PVP Run Wins**`, replaceError(TNTGames.wins_pvprun, 0) - data.allTNT.pvp_wins, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "duel" || game == "duels") {
			if (user.player.stats.Duels == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's Duel Database`);

			console.log(Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l) * 1000) / 1000);
			console.log(replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l);

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Duels Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, true).addField(`**Losses**`, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l, true).addField(`**Shots**`, replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0) - data.duels.shots, true).addField(`**W/L**`, Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		}
	}
});

client.login(config.token);
