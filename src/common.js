const {replaceError, ChatCodes, ChatColor} = require("./util.js");

// USEFUL COMMON FUNCTIONS
function findRank(user) {
	let rankData = {
		displayName: "",
		color: ChatColor.gray
	};

	if (user.player.newPackageRank == "VIP") {
		//OLD: #3ce63d
		rankData = {
			displayName: "[VIP]",
			color: "#3ce63d"
		};
	} else if (user.player.newPackageRank == "VIP_PLUS") {
		rankData = {
			displayName: "[VIP+]",
			color: "#3ce63d"
		};
	} else if (user.player.newPackageRank == "MVP") {
		//OLD: #3de6e6
		rankData = {
			displayName: "[MVP]",
			color: "#3de6e6"
		};
	} else if (user.player.newPackageRank == "MVP_PLUS") {
		rankData = {
			displayName: "[MVP+]",
			color: "#3de6e6"
		};
	}
	if (user.player.monthlyPackageRank == "SUPERSTAR") {
		rankData = {
			displayName: "[MVP++]",
			color: ChatColor.gold
		};
	}
	if (user.player.rank == "YOUTUBER") {
		rankData = {
			displayName: "[YOUTUBE]",
			color: ChatColor.red
		};
	} else if (user.player.rank == "HELPER") {
		rankData = {
			displayName: "[HELPER]",
			color: ChatColor.blue
		};
	} else if (user.player.rank == "MODERATOR") {
		rankData = {
			displayName: "[MOD]",
			color: ChatColor.dark_green
		};
	} else if (user.player.rank == "ADMIN") {
		rankData = {
			displayName: "[ADMIN]",
			color: ChatColor.red
		};
	}
	if (user.player.prefix) {
		rankData = {
			displayName: user.player.prefix.replace(/\u00A7[0-9A-FK-OR]/gi, ""),
			color: replaceError(ChatColor[ChatCodes[user.player.prefix[user.player.prefix.indexOf("§") == -1 ? undefined : user.player.prefix.indexOf("§") + 1]]], ChatColor.gray)
		};
	}
	return rankData;
}

function min_sec(seconds) {
	const mins = Math.floor(seconds / 60);
	const secondsNew = seconds - mins * 60;
	if (secondsNew < 10) {
		return mins.toString() + ":0" + secondsNew.toString();
	} else {
		return mins.toString() + ":" + secondsNew.toString();
	}
}

function displayOldNewNumbers(old, updated) {
	const updatedRound = Math.round(updated * 1000) / 1000;

	if (old == updated) {
		return updatedRound.toString();
	} else if (old > updated) {
		const diff = Math.round((old - updated) * 1000) / 1000;
		return updatedRound.toString() + " (-" + diff.toString() + ")";
	} else {
		const diff = Math.round((updated - old) * 1000) / 1000;
		return updatedRound.toString() + " (+" + diff.toString() + ")";
	}
}

// FOR KDR AND W/L AND OTHER RATIOS
function ratio(a, b) {
	a = replaceError(a, 0);
	b = replaceError(b, 0);

	if (b == 0) return a;
	else return a / b;
}

// DB HANDLERS
async function setRunDB(data, uuid, authorID) {
	if (!data.stats.TNTGames) return;

	const runDBEntry = {
		record: replaceError(data.stats.TNTGames.record_tntrun, 0),
		w: replaceError(data.stats.TNTGames.wins_tntrun, 0),
		l: replaceError(data.stats.TNTGames.deaths_tntrun, 0),
		wl: ratio(data.stats.TNTGames.wins_tntrun, data.stats.TNTGames.deaths_tntrun),
		potions: replaceError(data.stats.TNTGames.run_potions_splashed_on_players, 0),
		blocks: replaceError(data.achievements.tntgames_block_runner, 0)
	};

	await db.set(`cache.${authorID}.${uuid}.run`, runDBEntry);
	return;
}

async function setPVPDB(data, uuid, authorID) {
	if (!data.stats.TNTGames) return;

	const pvpDBEntry = {
		record: replaceError(data.stats.TNTGames.record_pvprun, 0),
		w: replaceError(data.stats.TNTGames.wins_pvprun, 0),
		l: replaceError(data.stats.TNTGames.deaths_pvprun, 0),
		k: replaceError(data.stats.TNTGames.kills_pvprun, 0),
		wl: ratio(data.stats.TNTGames.wins_pvprun, data.stats.TNTGames.deaths_pvprun),
		kd: ratio(data.stats.TNTGames.kills_pvprun, data.stats.TNTGames.deaths_pvprun)
	};

	await db.set(`cache.${authorID}.${uuid}.pvp`, pvpDBEntry);
	return;
}

async function setBowDB(data, uuid, authorID) {
	if (!data.stats.TNTGames) return;

	const bowDBEntry = {
		w: replaceError(data.stats.TNTGames.wins_bowspleef, 0),
		l: replaceError(data.stats.TNTGames.deaths_bowspleef, 0),
		shots: replaceError(data.stats.TNTGames.tags_bowspleef, 0),
		k: replaceError(data.stats.TNTGames.kills_bowspleef, 0),
		wl: ratio(data.stats.TNTGames.wins_bowspleef, data.stats.TNTGames.deaths_bowspleef)
	};

	await db.set(`cache.${authorID}.${uuid}.bow`, bowDBEntry);
	return;
}

async function setTagDB(data, uuid, authorID) {
	if (!data.stats.TNTGames) return;

	const tagDBEntry = {
		w: replaceError(data.stats.TNTGames.wins_tntag, 0),
		k: replaceError(data.stats.TNTGames.kills_tntag, 0),
		kw: ratio(data.stats.TNTGames.kills_tntag, data.stats.TNTGames.wins_tntag),
		tags: replaceError(data.achievements.tntgames_clinic, 0),
		tk: ratio(data.achievements.tntgames_clinic, data.stats.TNTGames.kills_tntag)
	};

	await db.set(`cache.${authorID}.${uuid}.tag`, tagDBEntry);
	return;
}

async function setWizDB(data, uuid, authorID) {
	if (!data.stats.TNTGames) return;

	const wizDBEntry = {
		w: replaceError(data.stats.TNTGames.wins_capture, 0),
		k: replaceError(data.stats.TNTGames.kills_capture, 0),
		a: replaceError(data.stats.TNTGames.assists_capture, 0),
		d: replaceError(data.stats.TNTGames.deaths_capture, 0),
		p: replaceError(data.stats.TNTGames.points_capture, 0),
		kd: ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.deaths_capture),
		kad: ratio(replaceError(data.stats.TNTGames.kills_capture, 0) + replaceError(data.stats.TNTGames.assists_capture, 0), data.stats.TNTGames.deaths_capture),
		air: replaceError(data.stats.TNTGames.air_time_capture, 0),
		kw: ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.wins_capture)
	};

	await db.set(`cache.${authorID}.${uuid}.wizards`, wizDBEntry);
	return;
}

async function setWizKillsDB(data, uuid, authorID) {
	if (!data.stats.TNTGames) return;

	const wizKillDBEntry = {
		total_k: replaceError(data.stats.TNTGames.kills_capture, 0),
		f_k: replaceError(data.stats.TNTGames.new_firewizard_kills, 0),
		i_k: replaceError(data.stats.TNTGames.new_icewizard_kills, 0),
		w_k: replaceError(data.stats.TNTGames.new_witherwizard_kills, 0),
		k_k: replaceError(data.stats.TNTGames.new_kineticwizard_kills, 0),
		b_k: replaceError(data.stats.TNTGames.new_bloodwizard_kills, 0),
		t_k: replaceError(data.stats.TNTGames.new_toxicwizard_kills, 0),
		h_k: replaceError(data.stats.TNTGames.new_hydrowizard_kills, 0),
		a_k: replaceError(data.stats.TNTGames.new_ancientwizard_kills, 0),
		s_k: replaceError(data.stats.TNTGames.new_stormwizard_kills, 0)
	};

	await db.set(`cache.${authorID}.${uuid}.wizardKills`, wizKillDBEntry);
	return;
}

async function setDuelDB(data, uuid, authorID) {
	if (!data.stats.Duels) return;

	const duelDBEntry = {
		w: replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
		l: replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
		shots: replaceError(data.stats.Duels.bowspleef_duel_bow_shots, 0),
		wl: ratio(data.stats.Duels.bowspleef_duel_wins, replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(data.stats.Duels.bowspleef_duel_wins, 0)),
		streak: replaceError(data.stats.Duels.best_tnt_games_winstreak, 0),
		currentStreak: replaceError(data.stats.Duels.current_tnt_games_winstreak, 0)
	};

	await db.set(`cache.${authorID}.${uuid}.duels`, duelDBEntry);
}

async function setAllDB(data, uuid, authorID) {
	const allDBEntry = {
		coins: replaceError(data.stats.TNTGames.coins, 0),
		total_wins: replaceError(data.stats.TNTGames.wins_tntrun, 0) + replaceError(data.stats.TNTGames.wins_pvprun, 0) + replaceError(data.stats.TNTGames.wins_tntag, 0) + replaceError(data.stats.TNTGames.wins_bowspleef, 0) + replaceError(data.stats.TNTGames.wins_capture, 0),
		streak: replaceError(data.stats.TNTGames.winstreak, 0),
		time: replaceError(data.achievements.tntgames_tnt_triathlon, 0),
		run_wins: replaceError(data.stats.TNTGames.wins_tntrun, 0),
		run_record: replaceError(data.stats.TNTGames.record_tntrun, 0),
		pvp_wins: replaceError(data.stats.TNTGames.wins_pvprun, 0),
		pvp_record: replaceError(data.stats.TNTGames.record_pvprun, 0),
		tag_wins: replaceError(data.stats.TNTGames.wins_tntag, 0),
		bow_wins: replaceError(data.stats.TNTGames.wins_bowspleef, 0),
		wizards_wins: replaceError(data.stats.TNTGames.wins_capture, 0),
		wizards_kills: replaceError(data.stats.TNTGames.kills_capture, 0)
	};

	await db.set(`cache.${authorID}.${uuid}.allTNT`, allDBEntry);
	return;
}

async function setCacheDB(data, uuid, authorID) {
	await setRunDB(data, uuid, authorID);
	await setPVPDB(data, uuid, authorID);
	await setTagDB(data, uuid, authorID);
	await setWizDB(data, uuid, authorID);
	await setBowDB(data, uuid, authorID);
	await setWizKillsDB(data, uuid, authorID);
	await setDuelDB(data, uuid, authorID);
	await setAllDB(data, uuid, authorID);

	return;
}

async function setWeeklyDB(data, uuid) {
	const weeklyDBEntry = {};
	if (data.stats.TNTGames) {
		weeklyDBEntry.run = {
			record: replaceError(data.stats.TNTGames.record_tntrun, 0),
			w: replaceError(data.stats.TNTGames.wins_tntrun, 0),
			l: replaceError(data.stats.TNTGames.deaths_tntrun, 0),
			wl: ratio(data.stats.TNTGames.wins_tntrun, data.stats.TNTGames.deaths_tntrun),
			potions: replaceError(data.stats.TNTGames.run_potions_splashed_on_players, 0)
		};
		weeklyDBEntry.pvp = {
			record: replaceError(data.stats.TNTGames.record_pvprun, 0),
			w: replaceError(data.stats.TNTGames.wins_pvprun, 0),
			l: replaceError(data.stats.TNTGames.deaths_pvprun, 0),
			k: replaceError(data.stats.TNTGames.kills_pvprun, 0),
			wl: ratio(data.stats.TNTGames.wins_pvprun, data.stats.TNTGames.deaths_pvprun),
			kd: ratio(data.stats.TNTGames.kills_pvprun, data.stats.TNTGames.deaths_pvprun)
		};
		weeklyDBEntry.bow = {
			w: replaceError(data.stats.TNTGames.wins_bowspleef, 0),
			l: replaceError(data.stats.TNTGames.deaths_bowspleef, 0),
			shots: replaceError(data.stats.TNTGames.tags_bowspleef, 0),
			k: replaceError(data.stats.TNTGames.kills_bowspleef, 0),
			wl: ratio(data.stats.TNTGames.wins_bowspleef, data.stats.TNTGames.deaths_bowspleef)
		};
		weeklyDBEntry.tag = {
			w: replaceError(data.stats.TNTGames.wins_tntag, 0),
			k: replaceError(data.stats.TNTGames.kills_tntag, 0),
			kw: ratio(data.stats.TNTGames.kills_tntag, data.stats.TNTGames.wins_tntag)
		};

		weeklyDBEntry.wizards = {
			w: replaceError(data.stats.TNTGames.wins_capture, 0),
			k: replaceError(data.stats.TNTGames.kills_capture, 0),
			a: replaceError(data.stats.TNTGames.assists_capture, 0),
			d: replaceError(data.stats.TNTGames.deaths_capture, 0),
			p: replaceError(data.stats.TNTGames.points_capture, 0),
			kd: ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.deaths_capture),
			kad: ratio(replaceError(data.stats.TNTGames.kills_capture, 0) + replaceError(data.stats.TNTGames.assists_capture, 0), data.stats.TNTGames.deaths_capture),
			air: replaceError(data.stats.TNTGames.air_time_capture, 0),
			kw: ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.wins_capture)
		};

		weeklyDBEntry.wizardKills = {
			total_k: replaceError(data.stats.TNTGames.kills_capture, 0),
			f_k: replaceError(data.stats.TNTGames.new_firewizard_kills, 0),
			i_k: replaceError(data.stats.TNTGames.new_icewizard_kills, 0),
			w_k: replaceError(data.stats.TNTGames.new_witherwizard_kills, 0),
			k_k: replaceError(data.stats.TNTGames.new_kineticwizard_kills, 0),
			b_k: replaceError(data.stats.TNTGames.new_bloodwizard_kills, 0),
			t_k: replaceError(data.stats.TNTGames.new_toxicwizard_kills, 0),
			h_k: replaceError(data.stats.TNTGames.new_hydrowizard_kills, 0),
			a_k: replaceError(data.stats.TNTGames.new_ancientwizard_kills, 0),
			s_k: replaceError(data.stats.TNTGames.new_stormwizard_kills, 0)
		};

		weeklyDBEntry.allTNT = {
			coins: replaceError(data.stats.TNTGames.coins, 0),
			total_wins: replaceError(data.stats.TNTGames.wins_tntrun, 0) + replaceError(data.stats.TNTGames.wins_pvprun, 0) + replaceError(data.stats.TNTGames.wins_tntag, 0) + replaceError(data.stats.TNTGames.wins_bowspleef, 0) + replaceError(data.stats.TNTGames.wins_capture, 0),
			streak: replaceError(data.stats.TNTGames.winstreak, 0),
			run_wins: replaceError(data.stats.TNTGames.wins_tntrun, 0),
			run_record: replaceError(data.stats.TNTGames.record_tntrun, 0),
			pvp_wins: replaceError(data.stats.TNTGames.wins_pvprun, 0),
			pvp_record: replaceError(data.stats.TNTGames.record_pvprun, 0),
			tag_wins: replaceError(data.stats.TNTGames.wins_tntag, 0),
			bow_wins: replaceError(data.stats.TNTGames.wins_bowspleef, 0),
			wizards_wins: replaceError(data.stats.TNTGames.wins_capture, 0),
			wizards_kills: replaceError(data.stats.TNTGames.kills_capture, 0)
		};
	} else {
		weeklyDBEntry.run = {
			record: 0,
			w: 0,
			l: 0,
			wl: 0,
			potions: 0
		};
		weeklyDBEntry.pvp = {
			record: 0,
			w: 0,
			l: 0,
			k: 0,
			wl: 0,
			kd: 0
		};
		weeklyDBEntry.bow = {
			w: 0,
			l: 0,
			shots: 0,
			k: 0,
			wl: 0
		};
		weeklyDBEntry.tag = {
			w: 0,
			k: 0,
			kw: 0
		};
		weeklyDBEntry.wizards = {
			w: 0,
			k: 0,
			a: 0,
			d: 0,
			p: 0,
			kd: 0,
			kad: 0,
			air: 0,
			kw: 0
		};
		weeklyDBEntry.wizardKills = {
			total_k: 0,
			f_k: 0,
			i_k: 0,
			w_k: 0,
			k_k: 0,
			b_k: 0,
			t_k: 0,
			h_k: 0,
			a_k: 0,
			s_k: 0
		};
		weeklyDBEntry.allTNT = {
			coins: 0,
			total_wins: 0,
			streak: 0,
			run_wins: 0,
			run_record: 0,
			pvp_wins: 0,
			pvp_record: 0,
			tag_wins: 0,
			bow_wins: 0,
			wizards_wins: 0,
			wizards_kills: 0
		};
	}
	if (data.stats.duels) {
		weeklyDBEntry.duels = {
			w: replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
			l: replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
			shots: replaceError(data.stats.Duels.bowspleef_duel_bow_shots, 0),
			wl: ratio(data.stats.Duels.bowspleef_duel_wins, replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(data.stats.Duels.bowspleef_duel_wins, 0)),
			streak: replaceError(data.stats.Duels.best_tnt_games_winstreak, 0),
			currentStreak: replaceError(data.stats.Duels.current_tnt_games_winstreak, 0)
		};
	} else {
		weeklyDBEntry.duels = {
			w: 0,
			l: 0,
			shots: 0,
			wl: 0,
			streak: 0,
			currentStreak: 0
		};
	}

	if (data.achievements) {
		weeklyDBEntry.allTNT.time = replaceError(data.achievements.tntgames_tnt_triathlon, 0);
		weeklyDBEntry.run.blocks = replaceError(data.achievements.tntgames_block_runner, 0);
		weeklyDBEntry.tag.tags = replaceError(data.achievements.tntgames_clinic, 0);
	} else {
		weeklyDBEntry.allTNT.time = 0;
		weeklyDBEntry.run.blocks = 0;
		weeklyDBEntry.tag.tags = 0;
	}

	if (data.achievements && data.stats.TNTGames) {
		weeklyDBEntry.tag.tk = ratio(data.achievements.tntgames_clinic, data.stats.TNTGames.kills_tntag);
	} else {
		weeklyDBEntry.tag.tk = 0;
	}

	weeklyDBEntry.time = Date.now();

	await db.set(`weekly.${uuid}`, weeklyDBEntry);
	return;
}

async function setMonthlyDB(data, uuid) {
	const monthlyDBEntry = {};
	if (data.stats.TNTGames) {
		monthlyDBEntry.run = {
			record: replaceError(data.stats.TNTGames.record_tntrun, 0),
			w: replaceError(data.stats.TNTGames.wins_tntrun, 0),
			l: replaceError(data.stats.TNTGames.deaths_tntrun, 0),
			wl: ratio(data.stats.TNTGames.wins_tntrun, data.stats.TNTGames.deaths_tntrun),
			potions: replaceError(data.stats.TNTGames.run_potions_splashed_on_players, 0)
		};
		monthlyDBEntry.pvp = {
			record: replaceError(data.stats.TNTGames.record_pvprun, 0),
			w: replaceError(data.stats.TNTGames.wins_pvprun, 0),
			l: replaceError(data.stats.TNTGames.deaths_pvprun, 0),
			k: replaceError(data.stats.TNTGames.kills_pvprun, 0),
			wl: ratio(data.stats.TNTGames.wins_pvprun, data.stats.TNTGames.deaths_pvprun),
			kd: ratio(data.stats.TNTGames.kills_pvprun, data.stats.TNTGames.deaths_pvprun)
		};
		monthlyDBEntry.bow = {
			w: replaceError(data.stats.TNTGames.wins_bowspleef, 0),
			l: replaceError(data.stats.TNTGames.deaths_bowspleef, 0),
			shots: replaceError(data.stats.TNTGames.tags_bowspleef, 0),
			k: replaceError(data.stats.TNTGames.kills_bowspleef, 0),
			wl: ratio(data.stats.TNTGames.wins_bowspleef, data.stats.TNTGames.deaths_bowspleef)
		};
		monthlyDBEntry.tag = {
			w: replaceError(data.stats.TNTGames.wins_tntag, 0),
			k: replaceError(data.stats.TNTGames.kills_tntag, 0),
			kw: ratio(data.stats.TNTGames.kills_tntag, data.stats.TNTGames.wins_tntag)
		};

		monthlyDBEntry.wizards = {
			w: replaceError(data.stats.TNTGames.wins_capture, 0),
			k: replaceError(data.stats.TNTGames.kills_capture, 0),
			a: replaceError(data.stats.TNTGames.assists_capture, 0),
			d: replaceError(data.stats.TNTGames.deaths_capture, 0),
			p: replaceError(data.stats.TNTGames.points_capture, 0),
			kd: ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.deaths_capture),
			kad: ratio(replaceError(data.stats.TNTGames.kills_capture, 0) + replaceError(data.stats.TNTGames.assists_capture, 0), data.stats.TNTGames.deaths_capture),
			air: replaceError(data.stats.TNTGames.air_time_capture, 0),
			kw: ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.wins_capture)
		};

		monthlyDBEntry.wizardKills = {
			total_k: replaceError(data.stats.TNTGames.kills_capture, 0),
			f_k: replaceError(data.stats.TNTGames.new_firewizard_kills, 0),
			i_k: replaceError(data.stats.TNTGames.new_icewizard_kills, 0),
			w_k: replaceError(data.stats.TNTGames.new_witherwizard_kills, 0),
			k_k: replaceError(data.stats.TNTGames.new_kineticwizard_kills, 0),
			b_k: replaceError(data.stats.TNTGames.new_bloodwizard_kills, 0),
			t_k: replaceError(data.stats.TNTGames.new_toxicwizard_kills, 0),
			h_k: replaceError(data.stats.TNTGames.new_hydrowizard_kills, 0),
			a_k: replaceError(data.stats.TNTGames.new_ancientwizard_kills, 0),
			s_k: replaceError(data.stats.TNTGames.new_stormwizard_kills, 0)
		};

		monthlyDBEntry.allTNT = {
			coins: replaceError(data.stats.TNTGames.coins, 0),
			total_wins: replaceError(data.stats.TNTGames.wins_tntrun, 0) + replaceError(data.stats.TNTGames.wins_pvprun, 0) + replaceError(data.stats.TNTGames.wins_tntag, 0) + replaceError(data.stats.TNTGames.wins_bowspleef, 0) + replaceError(data.stats.TNTGames.wins_capture, 0),
			streak: replaceError(data.stats.TNTGames.winstreak, 0),
			run_wins: replaceError(data.stats.TNTGames.wins_tntrun, 0),
			run_record: replaceError(data.stats.TNTGames.record_tntrun, 0),
			pvp_wins: replaceError(data.stats.TNTGames.wins_pvprun, 0),
			pvp_record: replaceError(data.stats.TNTGames.record_pvprun, 0),
			tag_wins: replaceError(data.stats.TNTGames.wins_tntag, 0),
			bow_wins: replaceError(data.stats.TNTGames.wins_bowspleef, 0),
			wizards_wins: replaceError(data.stats.TNTGames.wins_capture, 0),
			wizards_kills: replaceError(data.stats.TNTGames.kills_capture, 0)
		};
	} else {
		monthlyDBEntry.run = {
			record: 0,
			w: 0,
			l: 0,
			wl: 0,
			potions: 0
		};
		monthlyDBEntry.pvp = {
			record: 0,
			w: 0,
			l: 0,
			k: 0,
			wl: 0,
			kd: 0
		};
		monthlyDBEntry.bow = {
			w: 0,
			l: 0,
			shots: 0,
			k: 0,
			wl: 0
		};
		monthlyDBEntry.tag = {
			w: 0,
			k: 0,
			kw: 0
		};
		monthlyDBEntry.wizards = {
			w: 0,
			k: 0,
			a: 0,
			d: 0,
			p: 0,
			kd: 0,
			kad: 0,
			air: 0,
			kw: 0
		};
		monthlyDBEntry.wizardKills = {
			total_k: 0,
			f_k: 0,
			i_k: 0,
			w_k: 0,
			k_k: 0,
			b_k: 0,
			t_k: 0,
			h_k: 0,
			a_k: 0,
			s_k: 0
		};
		monthlyDBEntry.allTNT = {
			coins: 0,
			total_wins: 0,
			streak: 0,
			run_wins: 0,
			run_record: 0,
			pvp_wins: 0,
			pvp_record: 0,
			tag_wins: 0,
			bow_wins: 0,
			wizards_wins: 0,
			wizards_kills: 0
		};
	}
	if (data.stats.duels) {
		monthlyDBEntry.duels = {
			w: replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
			l: replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
			shots: replaceError(data.stats.Duels.bowspleef_duel_bow_shots, 0),
			wl: ratio(data.stats.Duels.bowspleef_duel_wins, replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0) - replaceError(data.stats.Duels.bowspleef_duel_wins, 0)),
			streak: replaceError(data.stats.Duels.best_tnt_games_winstreak, 0),
			currentStreak: replaceError(data.stats.Duels.current_tnt_games_winstreak, 0)
		};
	} else {
		monthlyDBEntry.duels = {
			w: 0,
			l: 0,
			shots: 0,
			wl: 0,
			streak: 0,
			currentStreak: 0
		};
	}

	if (data.achievements) {
		monthlyDBEntry.allTNT.time = replaceError(data.achievements.tntgames_tnt_triathlon, 0);
		monthlyDBEntry.run.blocks = replaceError(data.achievements.tntgames_block_runner, 0);
		monthlyDBEntry.tag.tags = replaceError(data.achievements.tntgames_clinic, 0);
	} else {
		monthlyDBEntry.allTNT.time = 0;
		monthlyDBEntry.run.blocks = 0;
		monthlyDBEntry.tag.tags = 0;
	}

	if (data.achievements && data.stats.TNTGames) {
		monthlyDBEntry.tag.tk = ratio(data.achievements.tntgames_clinic, data.stats.TNTGames.kills_tntag);
	} else {
		monthlyDBEntry.tag.tk = 0;
	}

	monthlyDBEntry.time = Date.now();

	await db.set(`monthly.${uuid}`, monthlyDBEntry);
	return;
}
