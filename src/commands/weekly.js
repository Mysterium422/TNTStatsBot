module.exports = {
	run: async ({client, args}) => {
		if ((await db.get(m.author.id)) == undefined) {
			await db.set(m.author.id, {verbose: false, reset: true});
		}

		var settings = await db.get(m.author.id);

		// Parse Args
		if (args.length == 0) {
			username = idData[m.author.id];
		} else if (args.length == 1) {
			let games = ["all", "overall", "wiz", "wizard", "wizards", "tntrun", "run", "pvprun", "pvp", "tnttag", "tag", "bow", "spleef", "bowspleef", "duel", "duels", "tntduels"];

			if (games.includes(args[0].toLowerCase())) {
				game = args[0].toLowerCase();
				username = idData[m.author.id];
			} else if (args[0].includes("<@!")) {
				username = idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")];
				game = await db.get("chan_" + m.channel.id + ".game");
				if (!settings.reset) {
					reset = false;
				}
			} else {
				game = await db.get("chan_" + m.channel.id + ".game");
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
			return sendErrorEmbed(m.channel, "Too many arguments", `Format: ${prefix}stats [game] [username]`);
		}
		if (!username) {
			return sendErrorEmbed(m.channel, "Invalid username", `User does not exist OR User has not set their IGN with ${prefix}set`);
		}
		if (username.length > 20) {
			user = await hypixelFetch(`player?uuid=${username}`);
		} else {
			var uuidInput = await mojangUUIDFetch(username).catch(() => {
				return {id: "UUIDINVALID12345678910"};
			});
			console.log(uuidInput);

			if (uuidInput.id.length > 20) {
				user = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				user = await hypixelFetch(`player?name=${username}`);
			}
		}

		if (user == "API ERROR") {
			return m.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, "Unknown Player", "Player has no data in Hypixel's Database");
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel, "Unknown Player", "Player has no Data in Hypixel's TNT Database");
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
			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Run Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Wins**", replaceError(TNTGames.wins_tntrun, 0) - data.run.w, true);
			embed.addField("**Deaths**", replaceError(TNTGames.deaths_tntrun, 0) - data.run.l, true);
			embed.addField("**Potions Thrown**", replaceError(TNTGames.run_potions_splashed_on_players, 0) - data.run.potions, true);
			embed.addField("**W/L**", Math.round(ratio(replaceError(TNTGames.wins_tntrun, 0) - data.run.w, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l) * 1000) / 1000, true);
			embed.addField("**Blocks Broken**", replaceError(user.player.achievements.tntgames_block_runner, 0) - data.run.blocks, true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return m.channel.send(embed);
		} else if (game == "pvp" || game == "pvprun") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} PVP Run Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Wins**", replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, true);
			embed.addField("**Deaths**", replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l, true);
			embed.addField("**Kills**", replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, true);
			embed.addField("**W/L**", Math.round(ratio(replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l) * 1000) / 1000, true);
			embed.addField("**KDR**", Math.round(ratio(replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l) * 1000) / 1000, true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return m.channel.send(embed);
		} else if (game == "bowspleef" || game == "bow" || game == "spleef") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Wins**", replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, true);
			embed.addField("**Deaths**", replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l, true);
			embed.addField("**Kills**", replaceError(TNTGames.kills_bowspleef, 0) - data.bow.k, true);
			embed.addField("**Shots**", replaceError(TNTGames.tags_bowspleef, 0) - data.bow.shots, true);
			embed.addField("**W/L**", Math.round(ratio(replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l) * 1000) / 1000, true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return m.channel.send(embed);
		} else if (game == "tag" || game == "tnttag") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Tag Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Wins**", replaceError(TNTGames.wins_tntag, 0) - data.tag.w, true);
			embed.addField("**Kills**", displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true);
			embed.addField("**K/W**", Math.round(ratio(replaceError(TNTGames.kills_tntag, 0) - data.tag.k, replaceError(TNTGames.wins_tntag, 0) - data.tag.w) * 1000) / 1000, true);
			embed.addField("**Tags**", replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, true);
			embed.addField("**Tags/Kill**", Math.round(ratio(replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, replaceError(TNTGames.kills_tntag, 0) - data.tag.k) * 1000) / 1000, true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return m.channel.send(embed);
		} else if (game == "wizards" || game == "wiz" || game == "wizard") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Wizards Stats`);
			embed.setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Wins**", replaceError(TNTGames.wins_capture, 0) - data.wizards.w, true);
			embed.addField("**Kills**", replaceError(TNTGames.kills_capture, 0) - data.wizards.k, true);
			embed.addField("**Assists**", replaceError(TNTGames.assists_capture, 0) - data.wizards.a, true);
			embed.addField("**Deaths**", replaceError(TNTGames.deaths_capture, 0) - data.wizards.d, true);
			embed.addField("**Points Captured**", replaceError(TNTGames.points_capture, 0) - data.wizards.p, true);
			embed.addField("**KDR**", Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d) * 1000) / 1000, true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);

			if (settings.verbose) {
				embed.addField("**Airtime**", min_sec(Math.floor((replaceError(TNTGames.air_time_capture, 0) - data.wizards.air) / 1200)), true);
				embed.addField("**KADR**", Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0) - data.wizards.k - data.wizards.a, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d) * 1000) / 1000, true);
				embed.addField("**K/W**", Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.wins_capture, 0) - data.wizards.w) * 1000) / 1000, true);
				embed.addField("**Fire**", replaceError(TNTGames.new_firewizard_kills, 0) - data.wizardKills.f_k, true);
				embed.addField("**Ice**", replaceError(TNTGames.new_icewizard_kills, 0) - data.wizardKills.i_k, true);
				embed.addField("**Wither**", replaceError(TNTGames.new_witherwizard_kills, 0) - data.wizardKills.w_k, true);
				embed.addField("**Kinetic**", replaceError(TNTGames.new_kineticwizard_kills, 0) - data.wizardKills.k_k, true);
				embed.addField("**Blood**", replaceError(TNTGames.new_bloodwizard_kills, 0) - data.wizardKills.b_k, true);
				embed.addField("**Toxic**", replaceError(TNTGames.new_toxicwizard_kills, 0) - data.wizardKills.t_k, true);
				embed.addField("**Hydro**", replaceError(TNTGames.new_hydrowizard_kills, 0) - data.wizardKills.h_k, true);
				embed.addField("**Ancient**", replaceError(TNTGames.new_ancientwizard_kills, 0) - data.wizardKills.a_k, true);
				embed.addField("**Storm**", replaceError(TNTGames.new_stormwizard_kills, 0) - data.wizardKills.s_k, true);
			}
			return m.channel.send(embed);
		} else if (game == "all" || game == "overall") {
			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Games Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Coins**", replaceError(TNTGames.coins, 0) - data.allTNT.coins, true);
			embed.addField("**Playtime**", min_sec(replaceError(user.player.achievements.tntgames_tnt_triathlon, 0) - data.allTNT.time), true);
			embed.addField("**TNT Wins**", replaceError(TNTGames.wins_tntrun, 0) + replaceError(TNTGames.wins_pvprun, 0) + replaceError(TNTGames.wins_tntag, 0) + replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0) - data.allTNT.total_wins, true);
			embed.addField("**Tag Wins**", replaceError(TNTGames.wins_tntag, 0) - data.allTNT.tag_wins, true);
			embed.addField("**TNT Run Wins**", replaceError(TNTGames.wins_tntrun, 0) - data.allTNT.run_wins, true);
			embed.addField("**Bowspleef Wins**", replaceError(TNTGames.wins_bowspleef, 0) - data.allTNT.bow_wins, true);
			embed.addField("**Wizards Wins**", replaceError(TNTGames.wins_capture, 0) - data.allTNT.wizards_wins, true);
			embed.addField("**PVP Run Wins**", replaceError(TNTGames.wins_pvprun, 0) - data.allTNT.pvp_wins, true);
			embed.addField("**Duel Wins**", replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0), true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return m.channel.send(embed);
		} else if (game == "duel" || game == "duels") {
			if (user.player.stats.Duels == undefined) return sendErrorEmbed(m.channel, "Unknown Player", "Player has no Data in Hypixel's Duel Database");

			const embed = new Discord.MessageEmbed();
			embed.setColor(rankData.color);
			embed.setAuthor(m.author.tag, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`);
			embed.setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Duels Stats`);
			embed.setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`);
			embed.setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`);
			embed.setTimestamp();
			embed.setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green);
			embed.addField("**Wins**", replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, true);
			embed.addField("**Losses**", replaceError(user.player.stats.Duels.bowspleef_duel_deaths, 0) - data.duels.l, true);
			embed.addField("**Shots**", replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0) - data.duels.shots, true);
			embed.addField("**W/L**", Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_deaths, 0) - data.duels.l) * 1000) / 1000, true);
			embed.setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`);
			return m.channel.send(embed);
		}
	},
	aliases: [],
	requiresConfiguredChannel: true
};
