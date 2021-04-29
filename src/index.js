// FIND PACKAGES
const Discord = require("discord.js"),
	fs = require("fs"),
	db = require("./db"),
	path = require("path");

const {mojangUUIDFetch, hypixelFetch, replaceError, booleanPhrases, getMentioned, errorEmbed} = require("./util.js");

const client = new Discord.Client();
const config = require("../config.json");

let isReady = false;
const commands = {};
client.on("ready", async () => {
	console.log("[INFO] Initializing...");

	// DEBUG ONLY!!
	// await db.reset();
	// DEBUG ONLY!!

	try {
		// Kinda verbose but idrc
		console.log("[INFO] Loading channel database...");
		await db.createChannelTable();
		console.log("[SUCCESS] Database loaded.");

		console.log("[INFO] Loading users database...");
		await db.createVerifiedTable();
		console.log("[SUCCESS] Database loaded.");
	} catch (e) {
		console.error("[ERROR] Failed to load users database! Aborting...");
		throw e;
	}

	try {
		fs.readdirSync(path.resolve(__dirname, "commands")).forEach(fileName => {
			const obj = require("./commands/" + fileName);
			// Slice to remove `.js`
			commands[fileName.slice(0, -3)] = obj;
			obj.aliases.forEach(name => {
				commands[name] = obj;
			});
		});
		console.log("[SUCCESS] Loaded commands...");
	} catch (e) {
		console.error("[ERROR] Failed to load commands! Aborting...");
		throw e;
	}

	console.log("[SUCCESS] Bot is now online and listening for commands!");
	client.user.setActivity("TNT Games | Use /TNThelp");
	isReady = true;
});

client.on("message", async message => {
	if (message.author.bot) return;

	if (!isReady) {
		message.channel.send("I'm not ready, please try again in a few seconds...");
		return;
	}

	// TODO: Per-channel prefix
	const prefix = "!";
	const mentioned = getMentioned(message);
	if (mentioned !== null && mentioned.id === client.user.id) {
		// const channel = await db.get("chan_" + message.channel.id);
		// if (channel === null) {
		// 	if (message.member.hasPermission("ADMINISTRATOR")) {
		// 		return message.channel.send("Channel not configured (Use /TNTconfigure)");
		// 	} else {
		// 		return message.channel.send("Channel not configured");
		// 	}
		// } else {
		// 	return message.channel.send(`My prefix in this channel is: ${channel.prefix}\nMy default game in this channel is: ${channel.game}`);
		// }
		return message.channel.send(errorEmbed("Command under construction", "Per-channel setup is still under construction!"));
	}

	const args = message.content.slice(prefix.length).split(/\s+/g);
	const command = args.shift().toLowerCase();

	if (command in commands) {
		try {
			await commands[command].run(client, message, args, prefix, message.content.slice(prefix.length + command.length));
			return;
		} catch (up) {
			// Debug
			await message.channel.send("An internal error occoured, see the stacktrace below:\n```" + up.stack + "```");
			throw up; // ha ha!
		}
	} else {
		message.channel.send("Command does not exist!");
		// return;
	}

	if (1 + 1 === 2) return; // Debug

	if (message.content.toLowerCase() == "/tntremove") {
		if (!message.member.hasPermission("ADMINISTRATOR") && message.author.id != config.owner_id) return;

		await db.deconste(`chan_${message.channel.id}`);
		message.channel.send("I will no longer respond to messages in this channel");
	}

	// let channel = await db.get("chan_" + m.channel.id);
	// if (channel === null) return;
	// const prefix = channel.prefix;
	// if (!m.content.startsWith(prefix)) return;
	// let game = channel.game;

	if (command.toLowerCase() === "stats") {
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

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Run Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Record**`, runRecordDisplay, true);
			embed.addField(`**Wins**`, displayOldNewNumbers(data.run.w, replaceError(TNTGames.wins_tntrun, 0)), true);
			embed.addField(`**Deaths**`, displayOldNewNumbers(data.run.l, replaceError(TNTGames.deaths_tntrun, 0)), true);
			embed.addField(`**Potions Thrown**`, displayOldNewNumbers(data.run.potions, replaceError(TNTGames.run_potions_splashed_on_players, 0)), true);
			embed.addField(`**W/L**`, displayOldNewNumbers(Math.round(data.run.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_tntrun, TNTGames.deaths_tntrun) * 1000) / 1000), true);
			embed.addField(`**Blocks Broken**`, displayOldNewNumbers(data.run.blocks, replaceError(user.player.achievements.tntgames_block_runner, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

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

			const embed = new Discord.MessageEmbed();
			embed.setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s PVP Run Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Record**`, pvpRecordDisplay, true);
			embed.addField(`**Wins**`, displayOldNewNumbers(data.pvp.w, replaceError(TNTGames.wins_pvprun, 0)), true);
			embed.addField(`**Deaths**`, displayOldNewNumbers(data.pvp.l, replaceError(TNTGames.deaths_pvprun, 0)), true);
			embed.addField(`**Kills**`, displayOldNewNumbers(data.pvp.k, replaceError(TNTGames.kills_pvprun, 0)), true);
			embed.addField(`**W/L**`, displayOldNewNumbers(Math.round(data.pvp.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_pvprun, TNTGames.deaths_pvprun) * 1000) / 1000), true);
			embed.addField(`**KDR**`, displayOldNewNumbers(Math.round(data.pvp.kd * 1000) / 1000, Math.round(ratio(TNTGames.kills_pvprun, TNTGames.deaths_pvprun) * 1000) / 1000), true);
			embed.setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setPVPDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "bowspleef" || game == "bow" || game == "spleef") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Wins**`, displayOldNewNumbers(data.bow.w, replaceError(TNTGames.wins_bowspleef, 0)), true);
			embed.addField(`**Deaths**`, displayOldNewNumbers(data.bow.l, replaceError(TNTGames.deaths_bowspleef, 0)), true);
			embed.addField(`**Kills**`, displayOldNewNumbers(data.bow.k, replaceError(TNTGames.kills_bowspleef, 0)), true);
			embed.addField(`**Shots**`, displayOldNewNumbers(data.bow.shots, replaceError(TNTGames.tags_bowspleef, 0)), true);
			embed.addField(`**W/L**`, displayOldNewNumbers(Math.round(data.bow.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_bowspleef, TNTGames.deaths_bowspleef) * 1000) / 1000), true);
			embed.setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setBowDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "tag" || game == "tnttag") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Tag Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Wins**`, displayOldNewNumbers(data.tag.w, replaceError(TNTGames.wins_tntag, 0)), true);
			embed.addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true);
			embed.addField(`**K/W**`, displayOldNewNumbers(Math.round(data.tag.kw * 1000) / 1000, Math.round(ratio(TNTGames.kills_tntag, TNTGames.wins_tntag) * 1000) / 1000), true);
			embed.addField(`**Tags**`, displayOldNewNumbers(data.tag.tags, replaceError(user.player.achievements.tntgames_clinic, 0)), true);
			embed.addField(`**Tags/Kill**`, displayOldNewNumbers(Math.round(data.tag.tk * 1000) / 1000, Math.round(ratio(user.player.achievements.tntgames_clinic, TNTGames.kills_tntag) * 1000) / 1000), true);
			embed.setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setTagDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "wizards" || game == "wiz" || game == "wizard") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Stats`);
			embed.setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Wins**`, displayOldNewNumbers(data.wizards.w, replaceError(TNTGames.wins_capture, 0)), true);
			embed.addField(`**Kills**`, displayOldNewNumbers(data.wizards.k, replaceError(TNTGames.kills_capture, 0)), true);
			embed.addField(`**Assists**`, displayOldNewNumbers(data.wizards.a, replaceError(TNTGames.assists_capture, 0)), true);
			embed.addField(`**Deaths**`, displayOldNewNumbers(data.wizards.d, replaceError(TNTGames.deaths_capture, 0)), true);
			embed.addField(`**Points Captured**`, displayOldNewNumbers(data.wizards.p, replaceError(TNTGames.points_capture, 0)), true);
			embed.addField(`**KDR**`, displayOldNewNumbers(Math.round(data.wizards.kd * 1000) / 1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.deaths_capture) * 1000) / 1000), true);
			embed.setDescription(`()s show changes since your last ${prefix}stats call for this user`);

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

				emed.addField(`**Airtime**`, airTimeDisplay, true);
				emed.addField(`**KADR**`, displayOldNewNumbers(Math.round(data.wizards.kad * 1000) / 1000, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0), TNTGames.deaths_capture) * 1000) / 1000), true);
				emed.addField(`**K/W**`, displayOldNewNumbers(Math.round(data.wizards.kw * 1000) / 1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.wins_capture) * 1000) / 1000), true);
				emed.addField(`**Fire**`, displayOldNewNumbers(data.wizardKills.f_k, replaceError(TNTGames.new_firewizard_kills, 0)), true);
				emed.addField(`**Ice**`, displayOldNewNumbers(data.wizardKills.i_k, replaceError(TNTGames.new_icewizard_kills, 0)), true);
				emed.addField(`**Wither**`, displayOldNewNumbers(data.wizardKills.w_k, replaceError(TNTGames.new_witherwizard_kills, 0)), true);
				emed.addField(`**Kinetic**`, displayOldNewNumbers(data.wizardKills.k_k, replaceError(TNTGames.new_kineticwizard_kills, 0)), true);
				emed.addField(`**Blood**`, displayOldNewNumbers(data.wizardKills.b_k, replaceError(TNTGames.new_bloodwizard_kills, 0)), true);
				emed.addField(`**Toxic**`, displayOldNewNumbers(data.wizardKills.t_k, replaceError(TNTGames.new_toxicwizard_kills, 0)), true);
				emed.addField(`**Hydro**`, displayOldNewNumbers(data.wizardKills.h_k, replaceError(TNTGames.new_hydrowizard_kills, 0)), true).addField(`**Ancient**`, displayOldNewNumbers(data.wizardKills.a_k, replaceError(TNTGames.new_ancientwizard_kills, 0)), true).addField(`**Storm**`, displayOldNewNumbers(data.wizardKills.s_k, replaceError(TNTGames.new_stormwizard_kills, 0)), true);
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

			const embed = new Discord.MessageEmbed();
			embed.setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Games Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Coins**`, displayOldNewNumbers(data.allTNT.coins, replaceError(TNTGames.coins, 0)), true);
			embed.addField(`**Winstreak**`, displayOldNewNumbers(data.allTNT.streak, replaceError(TNTGames.winstreak, 0)), true);
			embed.addField(`**Playtime**`, playTimeDisplay, true);
			embed.addField(`**TNT Wins**`, displayOldNewNumbers(data.allTNT.total_wins, replaceError(TNTGames.wins_tntrun, 0) + replaceError(TNTGames.wins_pvprun, 0) + replaceError(TNTGames.wins_tntag, 0) + replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0)), true);
			embed.addField(`**Tag Wins**`, displayOldNewNumbers(data.allTNT.tag_wins, replaceError(TNTGames.wins_tntag, 0)), true);
			embed.addField(`**TNT Run Record**`, runRecordDisplay, true);
			embed.addField(`**TNT Run Wins**`, displayOldNewNumbers(data.allTNT.run_wins, replaceError(TNTGames.wins_tntrun, 0)), true);
			embed.addField(`**Bowspleef Wins**`, displayOldNewNumbers(data.allTNT.bow_wins, replaceError(TNTGames.wins_bowspleef, 0)), true);
			embed.addField(`**Wizards Wins**`, displayOldNewNumbers(data.allTNT.wizards_wins, replaceError(TNTGames.wins_capture, 0)), true);
			embed.addField(`**Wizards Kills**`, displayOldNewNumbers(data.allTNT.wizards_kills, replaceError(TNTGames.kills_capture, 0)), true);
			embed.addField(`**PVP Run Record**`, pvpRecordDisplay, true);
			embed.addField(`**PVP Run Wins**`, displayOldNewNumbers(data.allTNT.pvp_wins, replaceError(TNTGames.wins_pvprun, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (reset) {
				await setAllDB(user.player, user.player.uuid, message.author.id);
			}
			return message.channel.send(embed);
		} else if (game == "duel" || game == "duels") {
			if (user.player.stats.Duels == undefined) return sendErrorEmbed(message.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

			const embed = new Discord.MessageEmbed();
			embed.setColor(`${rankData.color}`);
			embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Duels Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField(`**Wins**`, displayOldNewNumbers(replaceError(data.duels.w, 0), replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)), true);
			embed.addField(`**Losses**`, displayOldNewNumbers(replaceError(data.duels.l, 0), replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)), true);
			embed.addField(`**Shots**`, displayOldNewNumbers(replaceError(data.duels.shots, 0), replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0)), true);
			embed.addField(`**W/L**`, displayOldNewNumbers(replaceError(data.duels.wl, 0), ratio(user.player.stats.Duels.bowspleef_duel_wins, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0))), true);
			embed.addField(`**Best Streak**`, displayOldNewNumbers(replaceError(data.duels.streak, 0), replaceError(user.player.stats.Duels.best_tnt_games_winstreak, 0)), true);
			embed.addField(`**Current Streak**`, displayOldNewNumbers(replaceError(data.duels.currentStreak, 0), replaceError(user.player.stats.Duels.current_tnt_games_winstreak, 0)), true);
			embed.setDescription(`()s show changes since your last ${prefix}stats call for this user`);

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

		const embed = new Discord.MessageEmbed();
		embed.setColor(`${rankData.color}`);
		embed.setAuthor(`${message.author.tag}`, `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}?size=128`);
		embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Kills`);
		embed.setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`);
		embed.setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`);
		// embed.setImage(`https://visage.surgeplay.com/frontfull/512/${user.player.uuid}`)
		embed.setTimestamp();
		embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
		embed.addField(`**Fire**`, displayOldNewNumbers(data.wizardKills.f_k, replaceError(TNTGames.new_firewizard_kills, 0)), true);
		embed.addField(`**Ice**`, displayOldNewNumbers(data.wizardKills.i_k, replaceError(TNTGames.new_icewizard_kills, 0)), true);
		embed.addField(`**Wither**`, displayOldNewNumbers(data.wizardKills.w_k, replaceError(TNTGames.new_witherwizard_kills, 0)), true);
		embed.addField(`**Kinetic**`, displayOldNewNumbers(data.wizardKills.k_k, replaceError(TNTGames.new_kineticwizard_kills, 0)), true);
		embed.addField(`**Blood**`, displayOldNewNumbers(data.wizardKills.b_k, replaceError(TNTGames.new_bloodwizard_kills, 0)), true);
		embed.addField(`**Toxic**`, displayOldNewNumbers(data.wizardKills.t_k, replaceError(TNTGames.new_toxicwizard_kills, 0)), true);
		embed.addField(`**Hydro**`, displayOldNewNumbers(data.wizardKills.h_k, replaceError(TNTGames.new_hydrowizard_kills, 0)), true);
		embed.addField(`**Ancient**`, displayOldNewNumbers(data.wizardKills.a_k, replaceError(TNTGames.new_ancientwizard_kills, 0)), true);
		embed.addField(`**Storm**`, displayOldNewNumbers(data.wizardKills.s_k, replaceError(TNTGames.new_stormwizard_kills, 0)), true);
		embed.setDescription("Total Kills: " + displayOldNewNumbers(data.wizardKills.total_k, replaceError(TNTGames.kills_capture, 0)));
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
	} else if (command.toLowerCase() === "mysterium") {
		return message.channel.send("Hey! This bot was coded by Mysterium&Lebster!\nReport Bugs here: https://discord.gg/7Qb5xuJD4C\nHere's my website (WIP): <https://mysterium.me>");
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
