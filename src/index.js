// FIND PACKAGES
const Discord = require("discord.js"),
	fs = require("fs"),
	db = require("./db"),
	path = require("path");

const {mojangUUIDFetch, hypixelFetch, replaceError} = require("./util.js");

const client = new Discord.Client();
const config = require("../config.json");

let isReady = false;
let mentionRegex = null;
const commands = {};

client.on("ready", async () => {
	console.log("[INFO] Initializing...");

	try {
		console.log("[INFO] Loading database...");
		await db.createTables();
		console.log("[SUCCESS] Database loaded.");
	} catch (e) {
		console.error("[ERROR] Failed to load database! Aborting...");
		throw e;
	}

	try {
		console.log("[INFO] Loading commands...");
		fs.readdirSync(path.resolve(__dirname, "commands")).forEach(fileName => {
			const obj = require("./commands/" + fileName);
			// Slice to remove `.js`
			commands[fileName.slice(0, -3)] = obj;
			obj.aliases.forEach(name => {
				commands[name] = obj;
			});
		});
		console.log("[SUCCESS] Commands loaded.");
	} catch (e) {
		console.error("[ERROR] Failed to load commands! Aborting...");
		throw e;
	}

	client.user.setActivity("TNT Games | Use /TNThelp");
	mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
	isReady = true;
	console.log("[SUCCESS] Bot is now online and listening for commands!");
});

client.on("message", async message => {
	if (message.author.bot) return;
	if (!isReady) return message.channel.send("I'm not ready, please try again in a few seconds...");

	const channel = await db.getChannelInfo(message);
	const isChannelValid = channel !== null && message.content.startsWith(channel.prefix);
	const isMentionCommand = mentionRegex.test(message.content.trim());

	if (!isMentionCommand && !isChannelValid) return;

	const messageContent = isMentionCommand ? message.content.replace(mentionRegex, "").trim() : message.content.slice(channel.prefix.length).trim();
	const args = messageContent.split(/\s+/g);
	const command = args.shift().toLowerCase();

	if (command in commands) {
		if (channel === null && commands[command].requiresConfiguredChannel) return;
		try {
			await commands[command].run({
				client, message, args,
				command, channelInfo: channel,
				multiArgs: messageContent.slice(command.length)
			});

			return;
		} catch (up) {
			// Debug
			await message.channel.send("An internal error occoured, see the stacktrace below:\n```" + up.stack + "```");
			throw up; // ha ha!
		}
	} else {
		message.channel.send("Command does not exist!");
		if (1 + 1 === 2) return; // Debug
	}

	// if (message.content.toLowerCase() == "/tntremove") {
	// 	if (!message.member.hasPermission("ADMINISTRATOR") && message.author.id != config.owner_id) return;

	// 	await db.deconste(`chan_${message.channel.id}`);
	// 	return message.channel.send("I will no longer respond to messages in this channel");
	// }

	if (command.toLowerCase() === "weekly" || command == "monthly") {
		// load database

		// if settings of message author is not defined
		//		add row {verbose: true, reset: true}

		const settings = await db.get(message.author.id);
		let reset = true;

		// Parse Args
		if (args.length == 0) {
			username = idData[message.author.id];
			if (!settings.reset) {
				reset = false;
			}
		} else if (args.length == 1) {
			const games = ["all", "overall", "wiz", "wizard", "wizards", "tntrun", "run", "pvprun", "pvp", "tnttag", "tag", "bow", "spleef", "bowspleef", "duel", "duels", "tntduels"];
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

		const embed = new Discord.MessageEmbed();
		embed.setColor(`${rankData.color}`);
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
		embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
		embed.setTimestamp();
		embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);

		if (game == "run" || game == "tntrun") {
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Run Stats`);

			embed.addField(`**Wins**`, replaceError(TNTGames.wins_tntrun, 0) - data.run.w, true);
			embed.addField(`**Deaths**`, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l, true);
			embed.addField(`**Potions Thrown**`, replaceError(TNTGames.run_potions_splashed_on_players, 0) - data.run.potions, true);
			embed.addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_tntrun, 0) - data.run.w, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l) * 1000) / 1000, true);
			embed.addField(`**Blocks Broken**`, replaceError(user.player.achievements.tntgames_block_runner, 0) - data.run.blocks, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "pvp" || game == "pvprun") {
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} PVP Run Stats`);
			embed.addField(`**Wins**`, replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, true);
			embed.addField(`**Deaths**`, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l, true);
			embed.addField(`**Kills**`, replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, true);
			embed.addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l) * 1000) / 1000, true);
			embed.addField(`**KDR**`, Math.round(ratio(replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "bowspleef" || game == "bow" || game == "spleef") {
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Stats`);
			embed.addField(`**Wins**`, replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, true);
			embed.addField(`**Deaths**`, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l, true);
			embed.addField(`**Kills**`, replaceError(TNTGames.kills_bowspleef, 0) - data.bow.k, true);
			embed.addField(`**Shots**`, replaceError(TNTGames.tags_bowspleef, 0) - data.bow.shots, true);
			embed.addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "tag" || game == "tnttag") {
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Tag Stats`);
			embed.addField(`**Wins**`, replaceError(TNTGames.wins_tntag, 0) - data.tag.w, true);
			embed.addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true);
			embed.addField(`**K/W**`, Math.round(ratio(replaceError(TNTGames.kills_tntag, 0) - data.tag.k, replaceError(TNTGames.wins_tntag, 0) - data.tag.w) * 1000) / 1000, true);
			embed.addField(`**Tags**`, replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, true);
			embed.addField(`**Tags/Kill**`, Math.round(ratio(replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, replaceError(TNTGames.kills_tntag, 0) - data.tag.k) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "wizards" || game == "wiz" || game == "wizard") {
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Wizards Stats`);
			embed.addField(`**Wins**`, replaceError(TNTGames.wins_capture, 0) - data.wizards.w, true);
			embed.addField(`**Kills**`, replaceError(TNTGames.kills_capture, 0) - data.wizards.k, true);
			embed.addField(`**Assists**`, replaceError(TNTGames.assists_capture, 0) - data.wizards.a, true);
			embed.addField(`**Deaths**`, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d, true);
			embed.addField(`**Points Captured**`, replaceError(TNTGames.points_capture, 0) - data.wizards.p, true);
			embed.addField(`**KDR**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);

			if (settings.verbose) {
				embed.addField(`**Airtime**`, min_sec(Math.floor((replaceError(TNTGames.air_time_capture, 0) - data.wizards.air) / 1200)));
				embed.addField(`**KADR**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0) - data.wizards.k - data.wizards.a, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d) * 1000) / 1000, true);
				embed.addField(`**K/W**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.wins_capture, 0) - data.wizards.w) * 1000) / 1000, true);
				embed.addField(`**Fire**`, replaceError(TNTGames.new_firewizard_kills, 0) - data.wizardKills.f_k, true);
				embed.addField(`**Ice**`, replaceError(TNTGames.new_icewizard_kills, 0) - data.wizardKills.i_k, true);
				embed.addField(`**Wither**`, replaceError(TNTGames.new_witherwizard_kills, 0) - data.wizardKills.w_k, true);
				embed.addField(`**Kinetic**`, replaceError(TNTGames.new_kineticwizard_kills, 0) - data.wizardKills.k_k, true);
				embed.addField(`**Blood**`, replaceError(TNTGames.new_bloodwizard_kills, 0) - data.wizardKills.b_k, true);
				embed.addField(`**Toxic**`, replaceError(TNTGames.new_toxicwizard_kills, 0) - data.wizardKills.t_k, true);
				embed.addField(`**Hydro**`, replaceError(TNTGames.new_hydrowizard_kills, 0) - data.wizardKills.h_k, true);
				embed.addField(`**Ancient**`, replaceError(TNTGames.new_ancientwizard_kills, 0) - data.wizardKills.a_k, true);
				embed.addField(`**Storm**`, replaceError(TNTGames.new_stormwizard_kills, 0) - data.wizardKills.s_k, true);
			}
			return message.channel.send(embed);
		} else if (game == "all" || game == "overall") {
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Games Stats`);
			embed.addField(`**Coins**`, replaceError(TNTGames.coins, 0) - data.allTNT.coins, true);
			embed.addField(`**Playtime**`, min_sec(replaceError(user.player.achievements.tntgames_tnt_triathlon, 0) - data.allTNT.time), true);
			embed.addField(`**TNT Wins**`, replaceError(TNTGames.wins_tntrun, 0) + replaceError(TNTGames.wins_pvprun, 0) + replaceError(TNTGames.wins_tntag, 0) + replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0) - data.allTNT.total_wins, true);
			embed.addField(`**Tag Wins**`, replaceError(TNTGames.wins_tntag, 0) - data.allTNT.tag_wins, true);
			embed.addField(`**TNT Run Wins**`, replaceError(TNTGames.wins_tntrun, 0) - data.allTNT.run_wins, true);
			embed.addField(`**Bowspleef Wins**`, replaceError(TNTGames.wins_bowspleef, 0) - data.allTNT.bow_wins, true);
			embed.addField(`**Wizards Wins**`, replaceError(TNTGames.wins_capture, 0) - data.allTNT.wizards_wins, true);
			embed.addField(`**Wizards Kills**`, replaceError(TNTGames.kills_capture, 0) - data.allTNT.wizards_kills, true);
			embed.addField(`**PVP Run Wins**`, replaceError(TNTGames.wins_pvprun, 0) - data.allTNT.pvp_wins, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		} else if (game == "duel" || game == "duels") {
			if (user.player.stats.Duels == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's Duel Database`);

			console.log(Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l) * 1000) / 1000);
			console.log(replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l);

			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Duels Stats`);
			embed.addField(`**Wins**`, replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, true);
			embed.addField(`**Losses**`, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l, true);
			embed.addField(`**Shots**`, replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0) - data.duels.shots, true);
			embed.addField(`**W/L**`, Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l) * 1000) / 1000, true).setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return message.channel.send(embed);
		}
	}
});

client.login(config.token);
