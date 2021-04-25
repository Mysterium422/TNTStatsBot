// FIND PACKAGES
const Discord = require('discord.js'), client = new Discord.Client()
const db = require('quick.db');
const fs = require('fs');
const yaml = require('js-yaml')
const schedule = require('node-schedule');

// FETCH UNUSED BUT WORKS FOR FUTURE
const { mojangUUIDFetch, hypixelFetch, plotzesFetch, fetch } = require('../global/mystFetch.js')
const { randInt, replaceError, ChatCodes, ChatColor, ownerID, timeConverter } = require('../global/globalUtils.js');

// USED FOR INFO COMMAND
const unix_time_start = Date.now();

// SETUP CONFIG
const yamlConfig = yaml.loadAll(fs.readFileSync("config.yaml", "utf8"));
const config = yamlConfig[0];

const pkg = JSON.parse(fs.readFileSync("package.json"));

// HELPER OBJECTS
const embedFooter = {
	text: ["TNT Stats Bot by Mysterium_", "TNT Stats Bot by Mysterium_", "TNT Stats Bot by Mysterium_", "Created by Mysterium_", "Created by Mysterium_", "Created by Mysterium_", "Invite this bot to your own server! (/invite)", "Invite this bot to your own server! (/invite)", "Invite this bot to your own server! (/invite)", "Invite this bot to your own server! (/invite)", "Invite this bot to your own server! (/invite)", "Wizard Leaderboard Bot! (/discord)", "Suggest fixes! (/discord)", "Join the discord! (/discord)", "All bow to sensei Kidzyy", "Check out my code! (/source)", `Version: ${pkg.version}`, "Report any bugs! (/discord)"],
	image: {
		green: "https://cdn.discordapp.com/emojis/722990201307398204.png?v=1",
		red: "https://cdn.discordapp.com/emojis/722990201302941756.png?v=1"
	}
};

const helpMsg = `__Commands (Prefixes consty depending on your channel)__
**/TNThelp** opens this page. Works anywhere this bot can read/send messages
**/TNTconfigure** <game> <prefix> configure the bot to work in *this* channel using that game or prefix (admin perms needed).
**/TNTremove** This bot will no longer answer to queries in this channel (admin perms needed). Works anywhere this bot can read/send messages.
**/help** opens this page
**/info** shows info about the bot
**/invite** bot invite link
**/source** links the bot source code
**/discord** join link for the discord
**/account** <mention> Looks for an MC account registered to this Discord account 
**/stats** <game> <username> displays the TNT data. <game> will default to the channel game and <username> will default to your set username
Possible 'Game' Parameters: all, wizards, bowspleef, tag, run, pvp
**/kills** <username> gives a breakdown of wizards class by class kills
**/set** <username> sets your username.
**/settings** <setting> <true/false>
Possible 'setting' Parameters:
    verbose - Show more Wizards stats with /stats Default: false
    reset - When false /stats will not update cache so ()s stay till you do /reset. Only works on your own registered ign. Default: true
**/reset** Updates your personal stats in the cache. Only useful if reset setting is false`

const booleanPhrases = {"false":false,
    "true":true,
    "f":false,
    "t":true,
    "y":true,
    "no":false,
    "n":false,
    "yes":true,
    "1":true,
    "0":false}

// USEFUL COMMON FUNCTIONS
function findRank(user) {
	let rankData = {displayName: "", color: ChatColor.gray};

	if (user.player.newPackageRank == "VIP") {
		//OLD: #3ce63d
		rankData = {displayName: "[VIP]", color: "#3ce63d"};
	} else if (user.player.newPackageRank == "VIP_PLUS") {
		rankData = {displayName: "[VIP+]", color: "#3ce63d"};
	} else if (user.player.newPackageRank == "MVP") {
		//OLD: #3de6e6
		rankData = {displayName: "[MVP]", color: "#3de6e6"};
	} else if (user.player.newPackageRank == "MVP_PLUS") {
		rankData = {displayName: "[MVP+]", color: "#3de6e6"};
	}
	if (user.player.monthlyPackageRank == "SUPERSTAR") {
		rankData = {displayName: "[MVP++]", color: ChatColor.gold};
	}
	if (user.player.rank == "YOUTUBER") {
		rankData = {displayName: "[YOUTUBE]", color: ChatColor.red};
	} else if (user.player.rank == "HELPER") {
		rankData = {displayName: "[HELPER]", color: ChatColor.blue};
	} else if (user.player.rank == "MODERATOR") {
		rankData = {displayName: "[MOD]", color: ChatColor.dark_green};
	} else if (user.player.rank == "ADMIN") {
		rankData = {displayName: "[ADMIN]", color: ChatColor.red};
	}
	if (user.player.prefix) {
		rankData = {displayName: user.player.prefix.replace(/\u00A7[0-9A-FK-OR]/gi, ""), color: replaceError(ChatColor[ChatCodes[user.player.prefix[user.player.prefix.indexOf("§") == -1 ? undefined : user.player.prefix.indexOf("§") + 1]]], ChatColor.gray)};
	}
	return rankData;
}

function sendErrorEmbed(channel, error, description) {
	const errorEmbed = new Discord.MessageEmbed().setColor("#F64B4B").setTitle(`Oops!`).addField(`${error}`, `${description}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.red);
	return channel.send(errorEmbed);
}

Array.prototype.unique = function() {
	const a = this.concat();
	const b = [];

	a.forEach((item, index) => {
		if (a.indexOf(item) == index) b.push(b);
	});
	return b;
};

String.prototype.contains = function(substring) {
	return this.indexOf(substring) !== -1;
};

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

    if (!data.stats.TNTGames) return

    var runDBEntry = {
        record:replaceError(data.stats.TNTGames.record_tntrun, 0),
        w:replaceError(data.stats.TNTGames.wins_tntrun, 0),
        l:replaceError(data.stats.TNTGames.deaths_tntrun, 0),
        wl:ratio(data.stats.TNTGames.wins_tntrun, data.stats.TNTGames.deaths_tntrun),
        potions:replaceError(data.stats.TNTGames.run_potions_splashed_on_players, 0),
        blocks:replaceError(data.achievements.tntgames_block_runner, 0)
    }

    await db.set(`cache.${authorID}.${uuid}.run`, runDBEntry)
    return
}

async function setPVPDB(data, uuid, authorID) {

    if (!data.stats.TNTGames) return

    var pvpDBEntry = {
        record:replaceError(data.stats.TNTGames.record_pvprun, 0),
        w:replaceError(data.stats.TNTGames.wins_pvprun, 0),
        l:replaceError(data.stats.TNTGames.deaths_pvprun, 0),
        k:replaceError(data.stats.TNTGames.kills_pvprun, 0),
        wl:ratio(data.stats.TNTGames.wins_pvprun, data.stats.TNTGames.deaths_pvprun),
        kd:ratio(data.stats.TNTGames.kills_pvprun, data.stats.TNTGames.deaths_pvprun)
    }

    await db.set(`cache.${authorID}.${uuid}.pvp`, pvpDBEntry)
    return
}

async function setBowDB(data, uuid, authorID) {

    if (!data.stats.TNTGames) return

    var bowDBEntry = {
        w:replaceError(data.stats.TNTGames.wins_bowspleef, 0),
        l:replaceError(data.stats.TNTGames.deaths_bowspleef, 0),
        shots:replaceError(data.stats.TNTGames.tags_bowspleef, 0),
        k:replaceError(data.stats.TNTGames.kills_bowspleef, 0),
        wl:ratio(data.stats.TNTGames.wins_bowspleef, data.stats.TNTGames.deaths_bowspleef)
    }

    await db.set(`cache.${authorID}.${uuid}.bow`, bowDBEntry)
    return
}

async function setTagDB(data, uuid, authorID) {

    if (!data.stats.TNTGames) return

    var tagDBEntry = {
        w:replaceError(data.stats.TNTGames.wins_tntag, 0),
        k:replaceError(data.stats.TNTGames.kills_tntag, 0),
        kw:ratio(data.stats.TNTGames.kills_tntag, data.stats.TNTGames.wins_tntag),
        tags:replaceError(data.achievements.tntgames_clinic, 0),
        tk:ratio(data.achievements.tntgames_clinic, data.stats.TNTGames.kills_tntag)
    }

    await db.set(`cache.${authorID}.${uuid}.tag`, tagDBEntry)
    return
}

async function setWizDB(data, uuid, authorID) {

    if (!data.stats.TNTGames) return

    var wizDBEntry = {
        w:replaceError(data.stats.TNTGames.wins_capture, 0),
        k:replaceError(data.stats.TNTGames.kills_capture, 0),
        a:replaceError(data.stats.TNTGames.assists_capture, 0),
        d:replaceError(data.stats.TNTGames.deaths_capture, 0),
        p:replaceError(data.stats.TNTGames.points_capture, 0),
        kd:ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.deaths_capture),
        kad:ratio(replaceError(data.stats.TNTGames.kills_capture, 0)+replaceError(data.stats.TNTGames.assists_capture, 0), data.stats.TNTGames.deaths_capture),
        air:replaceError(data.stats.TNTGames.air_time_capture, 0),
        kw:ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.wins_capture)
    }

    await db.set(`cache.${authorID}.${uuid}.wizards`, wizDBEntry)
    return
}

async function setWizKillsDB(data, uuid, authorID) {

    if (!data.stats.TNTGames) return

    var wizKillDBEntry = {
        total_k:replaceError(data.stats.TNTGames.kills_capture, 0),
        f_k:replaceError(data.stats.TNTGames.new_firewizard_kills, 0),
        i_k:replaceError(data.stats.TNTGames.new_icewizard_kills, 0),
        w_k:replaceError(data.stats.TNTGames.new_witherwizard_kills, 0),
        k_k:replaceError(data.stats.TNTGames.new_kineticwizard_kills, 0),
        b_k:replaceError(data.stats.TNTGames.new_bloodwizard_kills, 0),
        t_k:replaceError(data.stats.TNTGames.new_toxicwizard_kills, 0),
        h_k:replaceError(data.stats.TNTGames.new_hydrowizard_kills, 0),
        a_k:replaceError(data.stats.TNTGames.new_ancientwizard_kills, 0),
        s_k:replaceError(data.stats.TNTGames.new_stormwizard_kills, 0),
    }

    await db.set(`cache.${authorID}.${uuid}.wizardKills`, wizKillDBEntry)
    return
}

async function setDuelDB(data, uuid, authorID) {

    if (!data.stats.Duels) return

    var duelDBEntry = {
        w:replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
        l:replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
        shots:replaceError(data.stats.Duels.bowspleef_duel_bow_shots, 0),
        wl: ratio(data.stats.Duels.bowspleef_duel_wins, replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(data.stats.Duels.bowspleef_duel_wins, 0)),
        streak: replaceError(data.stats.Duels.best_tnt_games_winstreak, 0),
        currentStreak: replaceError(data.stats.Duels.current_tnt_games_winstreak, 0)
    }

    await db.set(`cache.${authorID}.${uuid}.duels`, duelDBEntry)
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
    await setDuelDB(data, uuid, authorID)
    await setAllDB(data, uuid, authorID)

    return
}

async function setWeeklyDB(data, uuid) {
    var weeklyDBEntry = {}
    if (data.stats.TNTGames) {
        weeklyDBEntry.run = {
            record:replaceError(data.stats.TNTGames.record_tntrun, 0),
            w:replaceError(data.stats.TNTGames.wins_tntrun, 0),
            l:replaceError(data.stats.TNTGames.deaths_tntrun, 0),
            wl:ratio(data.stats.TNTGames.wins_tntrun, data.stats.TNTGames.deaths_tntrun),
            potions:replaceError(data.stats.TNTGames.run_potions_splashed_on_players, 0)
        }
        weeklyDBEntry.pvp = {
            record:replaceError(data.stats.TNTGames.record_pvprun, 0),
            w:replaceError(data.stats.TNTGames.wins_pvprun, 0),
            l:replaceError(data.stats.TNTGames.deaths_pvprun, 0),
            k:replaceError(data.stats.TNTGames.kills_pvprun, 0),
            wl:ratio(data.stats.TNTGames.wins_pvprun, data.stats.TNTGames.deaths_pvprun),
            kd:ratio(data.stats.TNTGames.kills_pvprun, data.stats.TNTGames.deaths_pvprun)
        }
        weeklyDBEntry.bow = {
            w:replaceError(data.stats.TNTGames.wins_bowspleef, 0),
            l:replaceError(data.stats.TNTGames.deaths_bowspleef, 0),
            shots:replaceError(data.stats.TNTGames.tags_bowspleef, 0),
            k:replaceError(data.stats.TNTGames.kills_bowspleef, 0),
            wl:ratio(data.stats.TNTGames.wins_bowspleef, data.stats.TNTGames.deaths_bowspleef)
        }
        weeklyDBEntry.tag = {
            w:replaceError(data.stats.TNTGames.wins_tntag, 0),
            k:replaceError(data.stats.TNTGames.kills_tntag, 0),
            kw:ratio(data.stats.TNTGames.kills_tntag, data.stats.TNTGames.wins_tntag),
        }

        weeklyDBEntry.wizards = {
            w:replaceError(data.stats.TNTGames.wins_capture, 0),
            k:replaceError(data.stats.TNTGames.kills_capture, 0),
            a:replaceError(data.stats.TNTGames.assists_capture, 0),
            d:replaceError(data.stats.TNTGames.deaths_capture, 0),
            p:replaceError(data.stats.TNTGames.points_capture, 0),
            kd:ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.deaths_capture),
            kad:ratio(replaceError(data.stats.TNTGames.kills_capture, 0)+replaceError(data.stats.TNTGames.assists_capture, 0), data.stats.TNTGames.deaths_capture),
            air:replaceError(data.stats.TNTGames.air_time_capture, 0),
            kw:ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.wins_capture)
        }

        weeklyDBEntry.wizardKills = {
            total_k:replaceError(data.stats.TNTGames.kills_capture, 0),
            f_k:replaceError(data.stats.TNTGames.new_firewizard_kills, 0),
            i_k:replaceError(data.stats.TNTGames.new_icewizard_kills, 0),
            w_k:replaceError(data.stats.TNTGames.new_witherwizard_kills, 0),
            k_k:replaceError(data.stats.TNTGames.new_kineticwizard_kills, 0),
            b_k:replaceError(data.stats.TNTGames.new_bloodwizard_kills, 0),
            t_k:replaceError(data.stats.TNTGames.new_toxicwizard_kills, 0),
            h_k:replaceError(data.stats.TNTGames.new_hydrowizard_kills, 0),
            a_k:replaceError(data.stats.TNTGames.new_ancientwizard_kills, 0),
            s_k:replaceError(data.stats.TNTGames.new_stormwizard_kills, 0),
        }

        weeklyDBEntry.allTNT = {
                coins:replaceError(data.stats.TNTGames.coins, 0),
                total_wins:replaceError(data.stats.TNTGames.wins_tntrun, 0)+replaceError(data.stats.TNTGames.wins_pvprun, 0)+replaceError(data.stats.TNTGames.wins_tntag, 0)+replaceError(data.stats.TNTGames.wins_bowspleef, 0) + replaceError(data.stats.TNTGames.wins_capture, 0),
                streak:replaceError(data.stats.TNTGames.winstreak, 0),
                run_wins:replaceError(data.stats.TNTGames.wins_tntrun, 0),
                run_record:replaceError(data.stats.TNTGames.record_tntrun, 0),
                pvp_wins:replaceError(data.stats.TNTGames.wins_pvprun, 0),
                pvp_record:replaceError(data.stats.TNTGames.record_pvprun, 0),
                tag_wins:replaceError(data.stats.TNTGames.wins_tntag, 0),
                bow_wins:replaceError(data.stats.TNTGames.wins_bowspleef, 0),
                wizards_wins:replaceError(data.stats.TNTGames.wins_capture, 0),
                wizards_kills:replaceError(data.stats.TNTGames.kills_capture, 0)
        }
    }
    else {
        weeklyDBEntry.run = {
            record:0,
            w:0,
            l:0,
            wl:0,
            potions:0
        }
        weeklyDBEntry.pvp = {
            record:0,
            w:0,
            l:0,
            k:0,
            wl:0,
            kd:0
        }
        weeklyDBEntry.bow = {
            w:0,
            l:0,
            shots:0,
            k:0,
            wl:0
        }
        weeklyDBEntry.tag = {
            w:0,
            k:0,
            kw:0,
        }
        weeklyDBEntry.wizards = {
            w:0,
            k:0,
            a:0,
            d:0,
            p:0,
            kd:0,
            kad:0,
            air:0,
            kw:0            
        }
        weeklyDBEntry.wizardKills = {
            total_k:0,
            f_k:0,
            i_k:0,
            w_k:0,
            k_k:0,
            b_k:0,
            t_k:0,
            h_k:0,
            a_k:0,
            s_k:0,
        }
        weeklyDBEntry.allTNT = {
            coins:0,
            total_wins:0,
            streak:0,
            run_wins:0,
            run_record:0,
            pvp_wins:0,
            pvp_record:0,
            tag_wins:0,
            bow_wins:0,
            wizards_wins:0,
            wizards_kills:0
        }
    }
    if (data.stats.duels) {
        weeklyDBEntry.duels = {
            w:replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
            l:replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
            shots:replaceError(data.stats.Duels.bowspleef_duel_bow_shots, 0),
            wl: ratio(data.stats.Duels.bowspleef_duel_wins, replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(data.stats.Duels.bowspleef_duel_wins, 0)),
            streak: replaceError(data.stats.Duels.best_tnt_games_winstreak, 0),
            currentStreak: replaceError(data.stats.Duels.current_tnt_games_winstreak, 0)
        }
    }
    else {
        weeklyDBEntry.duels = {
            w:0,
            l:0,
            shots:0,
            wl:0,
            streak:0,
            currentStreak:0
        }
    }

    if (data.achievements) {
        weeklyDBEntry.allTNT.time = replaceError(data.achievements.tntgames_tnt_triathlon, 0)
        weeklyDBEntry.run.blocks = replaceError(data.achievements.tntgames_block_runner, 0),
        weeklyDBEntry.tag.tags = replaceError(data.achievements.tntgames_clinic, 0)
    }
    else {
        weeklyDBEntry.allTNT.time = 0
        weeklyDBEntry.run.blocks = 0
        weeklyDBEntry.tag.tags = 0
    }

    if (data.achievements && data.stats.TNTGames) {
        weeklyDBEntry.tag.tk = ratio(data.achievements.tntgames_clinic, data.stats.TNTGames.kills_tntag)
    }
    else {
        weeklyDBEntry.tag.tk = 0
    }

    weeklyDBEntry.time = Date.now()

    await db.set(`weekly.${uuid}`, weeklyDBEntry)
    return
}

async function setMonthlyDB(data, uuid) {
    var monthlyDBEntry = {}
    if (data.stats.TNTGames) {
        monthlyDBEntry.run = {
            record:replaceError(data.stats.TNTGames.record_tntrun, 0),
            w:replaceError(data.stats.TNTGames.wins_tntrun, 0),
            l:replaceError(data.stats.TNTGames.deaths_tntrun, 0),
            wl:ratio(data.stats.TNTGames.wins_tntrun, data.stats.TNTGames.deaths_tntrun),
            potions:replaceError(data.stats.TNTGames.run_potions_splashed_on_players, 0)
        }
        monthlyDBEntry.pvp = {
            record:replaceError(data.stats.TNTGames.record_pvprun, 0),
            w:replaceError(data.stats.TNTGames.wins_pvprun, 0),
            l:replaceError(data.stats.TNTGames.deaths_pvprun, 0),
            k:replaceError(data.stats.TNTGames.kills_pvprun, 0),
            wl:ratio(data.stats.TNTGames.wins_pvprun, data.stats.TNTGames.deaths_pvprun),
            kd:ratio(data.stats.TNTGames.kills_pvprun, data.stats.TNTGames.deaths_pvprun)
        }
        monthlyDBEntry.bow = {
            w:replaceError(data.stats.TNTGames.wins_bowspleef, 0),
            l:replaceError(data.stats.TNTGames.deaths_bowspleef, 0),
            shots:replaceError(data.stats.TNTGames.tags_bowspleef, 0),
            k:replaceError(data.stats.TNTGames.kills_bowspleef, 0),
            wl:ratio(data.stats.TNTGames.wins_bowspleef, data.stats.TNTGames.deaths_bowspleef)
        }
        monthlyDBEntry.tag = {
            w:replaceError(data.stats.TNTGames.wins_tntag, 0),
            k:replaceError(data.stats.TNTGames.kills_tntag, 0),
            kw:ratio(data.stats.TNTGames.kills_tntag, data.stats.TNTGames.wins_tntag),
        }

        monthlyDBEntry.wizards = {
            w:replaceError(data.stats.TNTGames.wins_capture, 0),
            k:replaceError(data.stats.TNTGames.kills_capture, 0),
            a:replaceError(data.stats.TNTGames.assists_capture, 0),
            d:replaceError(data.stats.TNTGames.deaths_capture, 0),
            p:replaceError(data.stats.TNTGames.points_capture, 0),
            kd:ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.deaths_capture),
            kad:ratio(replaceError(data.stats.TNTGames.kills_capture, 0)+replaceError(data.stats.TNTGames.assists_capture, 0), data.stats.TNTGames.deaths_capture),
            air:replaceError(data.stats.TNTGames.air_time_capture, 0),
            kw:ratio(data.stats.TNTGames.kills_capture, data.stats.TNTGames.wins_capture)
        }

        monthlyDBEntry.wizardKills = {
            total_k:replaceError(data.stats.TNTGames.kills_capture, 0),
            f_k:replaceError(data.stats.TNTGames.new_firewizard_kills, 0),
            i_k:replaceError(data.stats.TNTGames.new_icewizard_kills, 0),
            w_k:replaceError(data.stats.TNTGames.new_witherwizard_kills, 0),
            k_k:replaceError(data.stats.TNTGames.new_kineticwizard_kills, 0),
            b_k:replaceError(data.stats.TNTGames.new_bloodwizard_kills, 0),
            t_k:replaceError(data.stats.TNTGames.new_toxicwizard_kills, 0),
            h_k:replaceError(data.stats.TNTGames.new_hydrowizard_kills, 0),
            a_k:replaceError(data.stats.TNTGames.new_ancientwizard_kills, 0),
            s_k:replaceError(data.stats.TNTGames.new_stormwizard_kills, 0),
        }

        monthlyDBEntry.allTNT = {
                coins:replaceError(data.stats.TNTGames.coins, 0),
                total_wins:replaceError(data.stats.TNTGames.wins_tntrun, 0)+replaceError(data.stats.TNTGames.wins_pvprun, 0)+replaceError(data.stats.TNTGames.wins_tntag, 0)+replaceError(data.stats.TNTGames.wins_bowspleef, 0) + replaceError(data.stats.TNTGames.wins_capture, 0),
                streak:replaceError(data.stats.TNTGames.winstreak, 0),
                run_wins:replaceError(data.stats.TNTGames.wins_tntrun, 0),
                run_record:replaceError(data.stats.TNTGames.record_tntrun, 0),
                pvp_wins:replaceError(data.stats.TNTGames.wins_pvprun, 0),
                pvp_record:replaceError(data.stats.TNTGames.record_pvprun, 0),
                tag_wins:replaceError(data.stats.TNTGames.wins_tntag, 0),
                bow_wins:replaceError(data.stats.TNTGames.wins_bowspleef, 0),
                wizards_wins:replaceError(data.stats.TNTGames.wins_capture, 0),
                wizards_kills:replaceError(data.stats.TNTGames.kills_capture, 0)
        }
    }
    else {
        monthlyDBEntry.run = {
            record:0,
            w:0,
            l:0,
            wl:0,
            potions:0
        }
        monthlyDBEntry.pvp = {
            record:0,
            w:0,
            l:0,
            k:0,
            wl:0,
            kd:0
        }
        monthlyDBEntry.bow = {
            w:0,
            l:0,
            shots:0,
            k:0,
            wl:0
        }
        monthlyDBEntry.tag = {
            w:0,
            k:0,
            kw:0,
        }
        monthlyDBEntry.wizards = {
            w:0,
            k:0,
            a:0,
            d:0,
            p:0,
            kd:0,
            kad:0,
            air:0,
            kw:0            
        }
        monthlyDBEntry.wizardKills = {
            total_k:0,
            f_k:0,
            i_k:0,
            w_k:0,
            k_k:0,
            b_k:0,
            t_k:0,
            h_k:0,
            a_k:0,
            s_k:0,
        }
        monthlyDBEntry.allTNT = {
            coins:0,
            total_wins:0,
            streak:0,
            run_wins:0,
            run_record:0,
            pvp_wins:0,
            pvp_record:0,
            tag_wins:0,
            bow_wins:0,
            wizards_wins:0,
            wizards_kills:0
        }
    }
    if (data.stats.duels) {
        monthlyDBEntry.duels = {
            w:replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
            l:replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(data.stats.Duels.bowspleef_duel_wins, 0),
            shots:replaceError(data.stats.Duels.bowspleef_duel_bow_shots, 0),
            wl: ratio(data.stats.Duels.bowspleef_duel_wins, replaceError(data.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(data.stats.Duels.bowspleef_duel_wins, 0)),
            streak: replaceError(data.stats.Duels.best_tnt_games_winstreak, 0),
            currentStreak: replaceError(data.stats.Duels.current_tnt_games_winstreak, 0)
        }
    }
    else {
        monthlyDBEntry.duels = {
            w:0,
            l:0,
            shots:0,
            wl:0,
            streak:0,
            currentStreak:0
        }
    }

    if (data.achievements) {
        monthlyDBEntry.allTNT.time = replaceError(data.achievements.tntgames_tnt_triathlon, 0)
        monthlyDBEntry.run.blocks = replaceError(data.achievements.tntgames_block_runner, 0),
        monthlyDBEntry.tag.tags = replaceError(data.achievements.tntgames_clinic, 0)
    }
    else {
        monthlyDBEntry.allTNT.time = 0
        monthlyDBEntry.run.blocks = 0
        monthlyDBEntry.tag.tags = 0
    }

    if (data.achievements && data.stats.TNTGames) {
        monthlyDBEntry.tag.tk = ratio(data.achievements.tntgames_clinic, data.stats.TNTGames.kills_tntag)
    }
    else {
        monthlyDBEntry.tag.tk = 0
    }

    monthlyDBEntry.time = Date.now()

    await db.set(`monthly.${uuid}`, monthlyDBEntry)
    return
}

client.on('ready', async () => {
    console.log('Bot: TNT Stats Bot is online!');
    client.user.setActivity("TNT Games  | Use /TNThelp");

    const scheduleRule = new schedule.RecurrenceRule()
    scheduleRule.second = 0;
    scheduleRule.minute = 30;
    scheduleRule.hour = 9;
    scheduleRule.dayOfWeek = 0;
    scheduleRule.tz = 'America/New_York'

    schedule.scheduleJob(scheduleRule, async function() {
        console.log("deleting weekly")
        db.delete('weekly')
    })

    const scheduleRule2 = new schedule.RecurrenceRule()
    scheduleRule2.second = 0;
    scheduleRule2.minute = 30;
    scheduleRule2.hour = 9;
    scheduleRule2.date = 1;
    scheduleRule2.tz = 'America/New_York'

    schedule.scheduleJob(scheduleRule2, async function() {
        db.delete('weekly')
    })
});

client.on('message', async m => {

    if(m.author.bot) return;

    if(m.content.toLowerCase() == "/ping") {
        let discordToBot = Date.now() - m.createdTimestamp

        let now = Date.now()
        await db.get("chan_"+m.channel.id)
        let botToDB = Date.now() - now
    
        let now2 = Date.now()
        let hypixelResponse = await hypixelFetch('key?')
        let botToHypixel = Date.now() - now2
        let botToHypixelString = ""    
        if (hypixelResponse == "API ERROR") {
            botToHypixelString = "No Response - "
        }

        let now3 = Date.now()
        messageSent = await m.channel.send(`**Ping**\n
Discord to Bot: ${discordToBot}
Bot to Hypixel (round trip): ${botToHypixelString}${botToHypixel}
Bot to Database (round trip): ${botToDB}`);
		const botToDiscord = Date.now() - now3;

		messageSent.edit(`**Ping**
Discord to Bot: ${discordToBot} ms
Bot to Hypixel (round trip): ${botToHypixelString}${botToHypixel} ms
Bot to Database (round trip): ${botToDB} ms
Bot to Discord: ${botToDiscord} ms
Computation: ${Date.now() - m.createdTimestamp - discordToBot - botToHypixel - botToDB - botToDiscord} ms`)
    }

    if(m.content.startsWith("<@!735055542178938960>")) {
        var channel = await db.get("chan_"+m.channel.id)
        if (channel === null) {
            if (m.member.hasPermission('ADMINISTRATOR')) {
                return m.channel.send("Channel not configured (Use /TNTconfigure)")
            }
            else {
                return m.channel.send("Channel not configured")
            }
        }
        else {
            return m.channel.send(`My prefix in this channel is: ${channel.prefix}\nMy default game in this channel is: ${channel.game}`)
        }
    }

    if(m.content.toLowerCase().startsWith("/tntconfigure")) {
        const configurationTool = {all:'All TNT Games',
    wizards:'TNT Wizards',
    run:'TNT Run',
    pvp:'PVP Run',
    tag:'TNT Tag',
    bowspleef:'Bow spleef'}

        if (!m.member.hasPermission('ADMINISTRATOR') && m.author.id != config.masterID) return
        console.log(`${m.author.username}: ${m.content}`)

        const args = m.content.slice(14).split(' ');

        if (!(args[0] in configurationTool)) {return sendErrorEmbed(m.channel,`First Paramenter Invalid`,`Looking for: all, wizards, run, pvp, tag, or bowspleef`)}
        if (args.length == 1) {return sendErrorEmbed(m.channel,`Second Parameter Invalid`,`No Parameter was found`)}
        if (args.length > 2) {return sendErrorEmbed(m.channel,`Prefix Invalid`,`No Spaces in the prefix!`)}

        await db.set(`chan_${m.channel.id}`, {game: args[0], prefix: args[1]})

        const embed = new Discord.MessageEmbed()
        .setColor('#00BF00')
        .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
        .setTitle(`Success! Channel Configured`)
        .setTimestamp()
        .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
        .addField(`__Default Game:__`, configurationTool[args[0]], true)
        .addField(`__Bot Prefix:__`, args[1], true)
        return m.channel.send(embed)
    }
    else if (m.content.toLowerCase() == "/tntremove") {
        if (!m.member.hasPermission('ADMINISTRATOR') && m.author.id != config.masterID) return

        await db.delete(`chan_${m.channel.id}`)
        m.channel.send("I will no longer respond to messages in this channel")
    }
    else if (m.content.toLowerCase().startsWith("/tnthelp")) {
        let prefix = "/"
        let msg = await m.channel.send(new Discord.MessageEmbed()
        .setColor('#3bcc71')
        .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
        .setTitle("Help Menu - Home")
        .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
        .setTimestamp()
        .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
        .setDescription(`:house:: Home\n:bar_chart:: Stat Commands\n:tools:: QoL Commands \n:information_source:: Bot Information Commands\n:track_next:: Latest Update Info`)
        )
        msg.react('🏠').then(msg.react('📊').then(msg.react('🛠').then(msg.react('ℹ').then(msg.react('⏭')))))

        const filter = (reaction, user) => (user.id === m.author.id)

        const collector = msg.createReactionCollector(filter, {time: 60000})
        collector.on('collect', async (reaction, user) => {
            collector.resetTimer({time: 60000})

            await reaction.users.remove(user.id).catch(() => {return})

            if (reaction.emoji.name == "🏠") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Home")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium", embedFooter.image.green)
                .setDescription(`:house:: Home\n:bar_chart:: Stat Commands
:tools:: QoL Commands 
:information_source:: Bot Information Commands
:track_next:: Latest Update Info

**/tntconfigure [game] [prefix]** - Configure the bot to *this* channel. Game options include All, Wizards, Bowspleef, TNT Tag, TNT Run, PVP Run.
**/tntremove** - Remove this channel from the bot's list of channels.
**/tnthelp** - Opens this menu
**/ping** - Check Bot Connection`))
            }
            else if (reaction.emoji.name == "📊") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Stat Commands")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`**${prefix}stats all {username}** - Shows overall TNT Games Stats
**${prefix}stats run {username}** - Shows TNT Run Stats
**${prefix}stats tag {username}** - Shows TNT Tag Stats
**${prefix}stats bowspleef {username}** - Shows Bowspleef Stats
**${prefix}stats wizards {username}** - Shows TNT Wizards Stats
**${prefix}stats pvp {username}** - Shows PVP Run Stats
**${prefix}kills {username}** - Shows TNT Wizards kills by class
                
*()s show changes since your last stats call for that user*
*Game defaults to your channel-configured game if not specified*
*Username defaults to your verified username if not specified*`))
            }
            else if (reaction.emoji.name == "🛠") {
                await msg.react('⚙')
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - QoL Commands")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`**${prefix}account {User ping}** - Shows the account of the specified player if they are verified
**${prefix}set {username}** - Sets your username. Requires you to set your discord tag in Hypixel
**${prefix}settings {setting} {value}** - Configures the setting to the value specified
**${prefix}reset** - Updates your personal stats in the cache. Only useful if reset setting is false
                
:gear:: Settings Info`))
            }
            else if (reaction.emoji.name == "ℹ") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Bot Info Commands")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`**${prefix}help** - Opens this menu
**${prefix}info** - Shows bot info
**${prefix}invite** - Pastes bot invite link
**${prefix}source** - Pastes bot source code link
**${prefix}discord** - Pastes the links of TNT Game discord servers
**${prefix}mysterium** - See more about the bot creator
**${prefix}bugs** - Pastes server invite link to report bugs`))
            }
            else if (reaction.emoji.name == "⏭") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`Latest Update v${package.version}${config.canary ? "dev" : ""}`)
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                // MAINBOTEDIT
                .setDescription(`- Created Interactive Help Menu
- Added duels gamemode support
- Fixed ()s with time bug
- Formatted playtime
- Added owner-only announcement command
- Added some command aliases
- Added new weekly and monthly stats system`))
            }
            else if (reaction.emoji.name == "⚙") {
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Settings Info")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`Format: **Setting** *(Acceptable Values)* - Description - Default: __Value__
                
**Verbose** *(True/False)* - Show more stats - Default: __False__
**Reset** *(True/False)* - Do not update cache so ()s will stay until you do /reset. Only works on your own registered ign - Default: __True__`))
            }
        })
    }

    var channel = await db.get("chan_"+m.channel.id)
    if (channel === null) return

    var prefix = channel.prefix
    if(!m.content.startsWith(prefix)) return
    var game = channel.game

    var args = m.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase()

    console.log(m.author.username+": " + m.content)

    if(command == "help") {
        let msg = await m.channel.send(new Discord.MessageEmbed()
        .setColor('#3bcc71')
        .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
        .setTitle("Help Menu - Home")
        .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
        .setTimestamp()
        .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
        .setDescription(`:house:: Home\n:bar_chart:: Stat Commands\n:tools:: QoL Commands \n:information_source:: Bot Information Commands\n:track_next:: Latest Update Info`)
        )
        msg.react('🏠').then(msg.react('📊').then(msg.react('🛠').then(msg.react('ℹ').then(msg.react('⏭')))))

        const filter = (reaction, user) => (user.id === m.author.id)

        const collector = msg.createReactionCollector(filter, {time: 60000})
        collector.on('collect', async (reaction, user) => {
            collector.resetTimer({time: 60000})

            await reaction.users.remove(user.id).catch(() => {return})

            if (reaction.emoji.name == "🏠") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Home")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium", embedFooter.image.green)
                .setDescription(`:house:: Home\n:bar_chart:: Stat Commands
:tools:: QoL Commands 
:information_source:: Bot Information Commands
:track_next:: Latest Update Info

**/tntconfigure [game] [prefix]** - Configure the bot to *this* channel. Game options include All, Wizards, Bowspleef, TNT Tag, TNT Run, PVP Run.
**/tntremove** - Remove this channel from the bot's list of channels.
**/tnthelp** - Opens this menu
**/ping** - Check Bot Connection`))
            }
            else if (reaction.emoji.name == "📊") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Stat Commands")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`**${prefix}stats all {username}** - Shows overall TNT Games Stats
**${prefix}stats run {username}** - Shows TNT Run Stats
**${prefix}stats tag {username}** - Shows TNT Tag Stats
**${prefix}stats bowspleef {username}** - Shows Bowspleef Stats
**${prefix}stats wizards {username}** - Shows TNT Wizards Stats
**${prefix}stats pvp {username}** - Shows PVP Run Stats
**${prefix}kills {username}** - Shows TNT Wizards kills by class
                
*()s show changes since your last stats call for that user*
*Game defaults to your channel-configured game if not specified*
*Username defaults to your verified username if not specified*`))
            }
            else if (reaction.emoji.name == "🛠") {
                await msg.react('⚙')
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - QoL Commands")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`**${prefix}account {User ping}** - Shows the account of the specified player if they are verified
**${prefix}set {username}** - Sets your username. Requires you to set your discord tag in Hypixel
**${prefix}settings {setting} {value}** - Configures the setting to the value specified
**${prefix}reset** - Updates your personal stats in the cache. Only useful if reset setting is false
                
:gear:: Settings Info`))
            }
            else if (reaction.emoji.name == "ℹ") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Bot Info Commands")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`**${prefix}help** - Opens this menu
**${prefix}info** - Shows bot info
**${prefix}invite** - Pastes bot invite link
**${prefix}source** - Pastes bot source code link
**${prefix}discord** - Pastes the links of TNT Game discord servers
**${prefix}mysterium** - See more about the bot creator
**${prefix}bugs** - Pastes server invite link to report bugs`))
            }
            else if (reaction.emoji.name == "⏭") {
                if (reaction.message.reactions.cache.has('⚙')) {
                    await reaction.message.reactions.cache.get('⚙').users.remove(client.user.id)
                }
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`Latest Update v${package.version}${config.canary ? "dev" : ""}`)
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                // MAINBOTEDIT
                .setDescription(`- Created Interactive Help Menu
- Added duels gamemode support
- Fixed ()s with time bug
- Formatted playtime
- Added owner-only announcement command
- Added some command aliases
- Added new weekly and monthly stats system`))
            }
            else if (reaction.emoji.name == "⚙") {
                msg.edit(new Discord.MessageEmbed()
                .setColor('#3bcc71')
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle("Help Menu - Settings Info")
                .setThumbnail(`https://findicons.com/files/icons/1008/quiet/128/information.png`)
                .setTimestamp()
                .setFooter("Created by Mysterium_", embedFooter.image.green)
                .setDescription(`Format: **Setting** *(Acceptable Values)* - Description - Default: __Value__
                
**Verbose** *(True/False)* - Show more stats - Default: __False__
**Reset** *(True/False)* - Do not update cache so ()s will stay until you do /reset. Only works on your own registered ign - Default: __True__`))
            }
        })
    }

    if (command == "mysterium") {
        m.channel.send("Hey! This bot was coded by Mysterium! Check out my server: https://discord.gg/7Qb5xuJD4C\nHere's my website (WIP): <https://mysterium.me>")
    }


    else if(command.toLowerCase() == "invite") {
        return m.channel.send("Use /TNTconfigure to setup the bot: \nhttps://discord.com/oauth2/authorize?client_id=735055542178938960&scope=bot&permissions=2147994688")
    }
    else if(command.toLowerCase() == "verify") {
        if (m.author.id != config.masterID) return m.channel.send("This is a discord-bot-owner-only command");
        if (args.length != 2) { return m.channel.send("Incorrect amount of arguments")}
        if (!args[0].includes('@')) { return m.channel.send("First Arg must be a ping") }

        if (args[1].length > 20) {
            data = await hypixelFetch(`player?uuid=${args[1]}`)
        }
        else {
            let uuidInput = await mojangUUIDFetch(args[1]).catch(() => {return {id:"UUIDINVALID12345678910"}})

            if (uuidInput.id.length > 20) {
                data = await hypixelFetch(`player?uuid=${uuidInput.id}`)
            }
            else {    
                data = await hypixelFetch(`player?name=${args[1]}`)
            }
        }

        if(data == "API ERROR") { return m.channel.send("API Connection Issues, Hypixel might be offline") }
        if(!data.success || data.success == false || data.player == null || data.player == undefined || !data.player || data.player.stats == undefined) return m.channel.send("Invalid Something");
        if(data.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)


        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        idData[data.player.uuid] = args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')
        idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')] = data.player.uuid

        await setCacheDB(data.player, data.player.uuid, m.author.id)


        fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));
        m.channel.send(`Registered ${data.player.displayname} to ${args[0]}`)
        return;
    }

    else if(command.toLowerCase() == "verifyalt") {
        if (m.author.id != config.masterID) return;
        if (args.length != 2) { return m.channel.send("Incorrect amount of arguments")}
        if (!args[0].includes('@')) { return m.channel.send("First Arg must be a ping") }

        if (args[1].length > 20) {
            data = await hypixelFetch(`player?uuid=${args[1]}`)
        }
        else {
            let uuidInput = await mojangUUIDFetch(args[1]).catch(() => {return {id:"UUIDINVALID12345678910"}})

            if (uuidInput.id.length > 20) {
                data = await hypixelFetch(`player?uuid=${uuidInput.id}`)
            }
            else {    
                data = await hypixelFetch(`player?name=${args[1]}`)
            }
        }

        if(data == "API ERROR") { return m.channel.send("API Connection Issues, Hypixel might be offline") }

        if(!data.success || data.success == false || data.player == null || data.player == undefined || !data.player || data.player.stats == undefined) return m.channel.send("Invalid Something");
        if(data.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)

        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        idData[data.player.uuid] = args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')

        fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));
        m.channel.send(`Registered ${data.player.displayname} to ${args[0]}`)
        return;
    }

    else if(command.toLowerCase() == "info" || command.toLowerCase() == "information") {
        let botUsers = []
        client.guilds.cache.forEach(guild => {guild.members.cache.forEach(member => botUsers.push(member.user.id))})
        let botUsersCount = botUsers.unique().length

        const monthToName = {0:"January", 1:"February", 2:"March", 3:"April", 4:"May", 5:"June", 6:"July", 7:"August", 8:"September", 9:"October", 10:"November", 11:"December"}
        var date = new Date(unix_time_start);
        dateFormatted = `${monthToName[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
        
        let allDb = await db.all().filter(a => a.ID.toLowerCase().startsWith('chan_')).length

        let result = `__Bot Information__
**Version:** ${package.version}
**Creator:** Mysterium
    IGN: Mysterium_
    Discord: Mysterium#5229
**Last Updated:** ${dateFormatted}
        
**Total Guilds:** ${client.guilds.cache.size}
**Configured Channels:** ${allDb}
**Total Unique Users:** ${botUsersCount}`;
		return m.channel.send(result);
	} else if (command.toLowerCase() == "set") {
		if (args.length !== 1) {
			return sendErrorEmbed(m.channel, `Usage Error`, `Usage: ${prefix}set [username]`);
		}

		if (args[0].length > 20) {
			user = await hypixelFetch(`player?uuid=${args[0]}`);
		} else {
			const uuidInput = await mojangUUIDFetch(args[0]).catch(() => {
				return {id: "UUIDINVALID12345678910"};
			});

			if (uuidInput.id.length > 20) {
				user = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				user = await hypixelFetch(`player?name=${args[0]}`);
			}
		}

		if (user == "API ERROR") {
			return m.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user.success && user.cause == "Invalid API key") {
			return sendErrorEmbed(m.channel, "Im too busy!", "Please wait a few seconds and try again");
		}

		if (!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Games Database`);

		//if (idData[m.author.id] == user.player.uuid) {
		//    return m.channel.send("This ign has already been set to this account!")
		//}

		if (!user.player.socialMedia) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`);
		if (!user.player.socialMedia.links) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`);
		if (!user.player.socialMedia.links.DISCORD) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`);
		console.log(m.author.tag == user.player.socialMedia.links.DISCORD);
		if (user.player.socialMedia.links.DISCORD != m.author.tag) {
			return m.channel.send(`Incorrectly set Discord!\nYou must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`);
		}

		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.log("Failure! File Invalid");
			console.log("Terminating Program - Code 005");
			process.exit();
		}
		idData = JSON.parse(received);

		idData[user.player.uuid] = m.author.id;
		idData[m.author.id] = user.player.uuid;

		fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));

		await db.set(m.author.id, {verbose: false, reset: true});
		await setCacheDB(user.player, user.player.uuid, m.author.id);
		return m.channel.send("Successfully set your ign to " + args[0]);
	} else if (command.toLowerCase() == "stats") {
		debugger;
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.log("Failure! File Invalid");
			console.log("Terminating Program - Code 005");
			process.exit();
		}
		idData = JSON.parse(received);

		if ((await db.get(m.author.id)) == undefined) {
			await db.set(m.author.id, {verbose: false, reset: true});
		}

		const settings = await db.get(m.author.id);
		let reset = true;

		// Parse Args
		if (args.length == 0) {
			username = idData[m.author.id];
			if (!settings.reset) {
				reset = false;
			}
		} else if (args.length == 1) {
			const games = ["all", "wizards", "run", "pvp", "tag", "bowspleef"];
			if (games.includes(args[0])) {
				game = args[0];
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
			const uuidInput = await mojangUUIDFetch(username).catch(() => {
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

		if (!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		const TNTGames = user.player.stats.TNTGames;

		data = await db.get(`cache.${m.author.id}.${user.player.uuid}`);
		if (data == undefined) {
			await setCacheDB(user.player, user.player.uuid, m.author.id);
			data = await db.get(`cache.${m.author.id}.${user.player.uuid}`);
		}

		rankData = findRank(user);

		if (game == "run") {
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

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Run Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Record**`, runRecordDisplay, true).addField(`**Wins**`, displayOldNewNumbers(data.run.w, replaceError(TNTGames.wins_tntrun, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.run.l, replaceError(TNTGames.deaths_tntrun, 0)), true).addField(`**Potions Thrown**`, displayOldNewNumbers(data.run.potions, replaceError(TNTGames.run_potions_splashed_on_players, 0)), true).addField(`**W/L**`, displayOldNewNumbers(Math.round(data.run.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_tntrun, TNTGames.deaths_tntrun) * 1000) / 1000), true).addField(`**Blocks Broken**`, displayOldNewNumbers(data.run.blocks, replaceError(user.player.achievements.tntgames_block_runner, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (reset) {
				await setRunDB(user.player, user.player.uuid, m.author.id);
			}
			return m.channel.send(embed);
		} else if (game == "pvp") {
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

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s PVP Run Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Record**`, pvpRecordDisplay, true).addField(`**Wins**`, displayOldNewNumbers(data.pvp.w, replaceError(TNTGames.wins_pvprun, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.pvp.l, replaceError(TNTGames.deaths_pvprun, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.pvp.k, replaceError(TNTGames.kills_pvprun, 0)), true).addField(`**W/L**`, displayOldNewNumbers(Math.round(data.pvp.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_pvprun, TNTGames.deaths_pvprun) * 1000) / 1000), true).addField(`**KDR**`, displayOldNewNumbers(Math.round(data.pvp.kd * 1000) / 1000, Math.round(ratio(TNTGames.kills_pvprun, TNTGames.deaths_pvprun) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setPVPDB(user.player, user.player.uuid, m.author.id);
			}
			return m.channel.send(embed);
		} else if (game == "bowspleef") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(data.bow.w, replaceError(TNTGames.wins_bowspleef, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.bow.l, replaceError(TNTGames.deaths_bowspleef, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.bow.k, replaceError(TNTGames.kills_bowspleef, 0)), true).addField(`**Shots**`, displayOldNewNumbers(data.bow.shots, replaceError(TNTGames.tags_bowspleef, 0)), true).addField(`**W/L**`, displayOldNewNumbers(Math.round(data.bow.wl * 1000) / 1000, Math.round(ratio(TNTGames.wins_bowspleef, TNTGames.deaths_bowspleef) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setBowDB(user.player, user.player.uuid, m.author.id);
			}
			return m.channel.send(embed);
		} else if (game == "tag") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Tag Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(data.tag.w, replaceError(TNTGames.wins_tntag, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true).addField(`**K/W**`, displayOldNewNumbers(Math.round(data.tag.kw * 1000) / 1000, Math.round(ratio(TNTGames.kills_tntag, TNTGames.wins_tntag) * 1000) / 1000), true).addField(`**Tags**`, displayOldNewNumbers(data.tag.tags, replaceError(user.player.achievements.tntgames_clinic, 0)), true).addField(`**Tags/Kill**`, displayOldNewNumbers(Math.round(data.tag.tk * 1000) / 1000, Math.round(ratio(user.player.achievements.tntgames_clinic, TNTGames.kills_tntag) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);
			if (reset) {
				await setTagDB(user.player, user.player.uuid, m.author.id);
			}
			return m.channel.send(embed);
		} else if (game == "wizards") {
			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Stats`).setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`).setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Wins**`, displayOldNewNumbers(data.wizards.w, replaceError(TNTGames.wins_capture, 0)), true).addField(`**Kills**`, displayOldNewNumbers(data.wizards.k, replaceError(TNTGames.kills_capture, 0)), true).addField(`**Assists**`, displayOldNewNumbers(data.wizards.a, replaceError(TNTGames.assists_capture, 0)), true).addField(`**Deaths**`, displayOldNewNumbers(data.wizards.d, replaceError(TNTGames.deaths_capture, 0)), true).addField(`**Points Captured**`, displayOldNewNumbers(data.wizards.p, replaceError(TNTGames.points_capture, 0)), true).addField(`**KDR**`, displayOldNewNumbers(Math.round(data.wizards.kd * 1000) / 1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.deaths_capture) * 1000) / 1000), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (settings.verbose) {
				if (TNTGames.air_time_capture == undefined) {
					const airTimeDifference = 0;
				} else {
					const airTimeDifference = TNTGames.air_time_capture - data.air;
				}
				if (airTimeDifference > 0) {
					const airTimeDisplay = min_sec(Math.floor(replaceError(TNTGames.air_time_capture, 0) / 1200)) + " (+" + min_sec(Math.floor(airTimeDifference / 1200)) + ")";
				} else {
					const airTimeDisplay = min_sec(Math.floor(replaceError(TNTGames.air_time_capture, 0) / 1200));
				}

				embed.addField(`**Airtime**`, airTimeDisplay, true).addField(`**KADR**`, displayOldNewNumbers(Math.round(data.wizards.kad * 1000) / 1000, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0), TNTGames.deaths_capture) * 1000) / 1000), true).addField(`**K/W**`, displayOldNewNumbers(Math.round(data.wizards.kw * 1000) / 1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.wins_capture) * 1000) / 1000), true).addField(`**Fire**`, displayOldNewNumbers(data.wizardKills.f_k, replaceError(TNTGames.new_firewizard_kills, 0)), true).addField(`**Ice**`, displayOldNewNumbers(data.wizardKills.i_k, replaceError(TNTGames.new_icewizard_kills, 0)), true).addField(`**Wither**`, displayOldNewNumbers(data.wizardKills.w_k, replaceError(TNTGames.new_witherwizard_kills, 0)), true).addField(`**Kinetic**`, displayOldNewNumbers(data.wizardKills.k_k, replaceError(TNTGames.new_kineticwizard_kills, 0)), true).addField(`**Blood**`, displayOldNewNumbers(data.wizardKills.b_k, replaceError(TNTGames.new_bloodwizard_kills, 0)), true).addField(`**Toxic**`, displayOldNewNumbers(data.wizardKills.t_k, replaceError(TNTGames.new_toxicwizard_kills, 0)), true).addField(`**Hydro**`, displayOldNewNumbers(data.wizardKills.h_k, replaceError(TNTGames.new_hydrowizard_kills, 0)), true).addField(`**Ancient**`, displayOldNewNumbers(data.wizardKills.a_k, replaceError(TNTGames.new_ancientwizard_kills, 0)), true).addField(`**Storm**`, displayOldNewNumbers(data.wizardKills.s_k, replaceError(TNTGames.new_stormwizard_kills, 0)), true);
			}
			if (settings.verbose && reset) {
				await setWizKillsDB(user.player, user.player.uuid, m.author.id);
			}
			if (reset) {
				await setWizDB(user.player, user.player.uuid, m.author.id);
			}
			return m.channel.send(embed);
		} else if (game == "all") {
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

			const embed = new Discord.MessageEmbed().setColor(`${rankData.color}`).setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`).setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Games Stats`).setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`).setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`).setTimestamp().setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green).addField(`**Coins**`, displayOldNewNumbers(data.allTNT.coins, replaceError(TNTGames.coins, 0)), true).addField(`**Winstreak**`, displayOldNewNumbers(data.allTNT.streak, replaceError(TNTGames.winstreak, 0)), true).addField(`**Playtime**`, displayOldNewNumbers(data.allTNT.time, replaceError(user.player.achievements.tntgames_tnt_triathlon, 0)), true).addField(`**TNT Wins**`, displayOldNewNumbers(data.allTNT.total_wins, replaceError(TNTGames.wins_tntrun, 0) + replaceError(TNTGames.wins_pvprun, 0) + replaceError(TNTGames.wins_tntag, 0) + replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0)), true).addField(`**Tag Wins**`, displayOldNewNumbers(data.allTNT.tag_wins, replaceError(TNTGames.wins_tntag, 0)), true).addField(`**TNT Run Record**`, runRecordDisplay, true).addField(`**TNT Run Wins**`, displayOldNewNumbers(data.allTNT.run_wins, replaceError(TNTGames.wins_tntrun, 0)), true).addField(`**Bowspleef Wins**`, displayOldNewNumbers(data.allTNT.bow_wins, replaceError(TNTGames.wins_bowspleef, 0)), true).addField(`**Wizards Wins**`, displayOldNewNumbers(data.allTNT.wizards_wins, replaceError(TNTGames.wins_capture, 0)), true).addField(`**Wizards Kills**`, displayOldNewNumbers(data.allTNT.wizards_kills, replaceError(TNTGames.kills_capture, 0)), true).addField(`**PVP Run Record**`, pvpRecordDisplay, true).addField(`**PVP Run Wins**`, displayOldNewNumbers(data.allTNT.pvp_wins, replaceError(TNTGames.wins_pvprun, 0)), true).setDescription(`()s show changes since your last ${prefix}stats call for this user`);

			if (reset) {
				await setAllDB(user.player, user.player.uuid, m.author.id);
			}
			return m.channel.send(embed);
		}
	} else if (command.toLowerCase() == "kills") {
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.log("Failure! File Invalid");
			console.log("Terminating Program - Code 005");
			process.exit();
		}
		idData = JSON.parse(received);

		if ((await db.get(m.author.id)) == undefined) {
			await db.set(m.author.id, {verbose: false, reset: true});
		}

		const settings = await db.get(m.author.id);
		let reset = true;

		// Parse Args
		if (args.length == 0) {
			username = idData[m.author.id];
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
			return sendErrorEmbed(m.channel, "Too many arguments", `Format: ${prefix}stats [game] [username]`);
		}

		if (username.length > 20) {
			user = await hypixelFetch(`player?uuid=${username}`);
		} else {
			const uuidInput = await mojangUUIDFetch(username).catch(() => {
				return {id: "UUIDINVALID12345678910"};
			});

			if (uuidInput.id.length > 20) {
				user = await hypixelFetch(`player?uuid=${uuidInput.id}`);
			} else {
				user = await hypixelFetch(`player?name=${username}`);
			}
		}

		if (user == "API ERROR") {
			return m.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user || !user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		const TNTGames = user.player.stats.TNTGames;
		data = await db.get("cache." + m.author.id + "." + user.player.uuid);
		if (data == undefined) {
			await setCacheDB(user.player, user.player.uuid, m.author.id);
			data = await db.get("cache." + m.author.id + "." + user.player.uuid);
		}
		rankData = findRank(user);

		const embed = new Discord.MessageEmbed()
			.setColor(`${rankData.color}`)
			.setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
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
			setWizKillsDB(user.player, user.player.uuid, m.author.id);
		}
		return m.channel.send(embed);
	} else if (command.toLowerCase() == "settings") {
		if (args.length != 2) {
			return sendErrorEmbed(m.channel, `Usage Error`, `Usage: ${prefix}settings [verbose/reset] [true/false]`);
		}

		if (args[0] == "verbose") {
			if (args[1] in booleanPhrases) {
				if ((await db.get(`${m.author.id}.verbose`)) == booleanPhrases[args[1]]) {
					m.channel.send("This setting was already set!");
				} else {
					m.channel.send("Settings changed!");
				}
				await db.set(`${m.author.id}.verbose`, booleanPhrases[args[1]]);
				return;
			} else {
				return sendErrorEmbed(m.channel, `Usage Error`, `Usage: ${prefix}settings verbose [true/false]`);
			}
		}
		if (args[0] == "reset") {
			if (args[1] in booleanPhrases) {
				if ((await db.get(`${m.author.id}.reset`)) == booleanPhrases[args[1]]) {
					m.channel.send("This setting was already set!");
				} else {
					m.channel.send("Settings changed!");
				}
				await db.set(`${m.author.id}.reset`, booleanPhrases[args[1]]);
				return;
			} else {
				return sendErrorEmbed(m.channel, `Usage Error`, `Usage: ${prefix}settings reset [true/false]`);
			}
		}
	} else if (command.toLowerCase() == "reset") {
		let received = "";
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.log("Failure! File Invalid");
			console.log("Terminating Program - Code 005");
			process.exit();
		}
		idData = JSON.parse(received);

		if (m.author.id in idData) {
			const user = await hypixelFetch(`player?uuid=${idData[m.author.id]}`);
		}
		if (user == "API ERROR") {
			return m.channel.send("API Connection Issues, Hypixel might be offline");
		}

		if (!user || !user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
		if (user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no Data in Hypixel's TNT Database`);

		await setCacheDB(user.player, user.player.uuid, m.author.id);
		return m.channel.send(`Reset counters for you!`);
	} else if (command.toLowerCase() == "source") {
		if (args.length != 0) {
			return m.channel.send("Too many arguments");
		}

		return m.channel.send("<https://github.com/Mysterium422/TNTStatsBot>");
	} else if (command.toLowerCase() == "account") {
		if (args.length != 1) {
			return m.channel.send("Incorrect amount of arguments");
		}
		if (!args[0].includes("@")) {
			return m.channel.send("First Arg must be a ping");
		}
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.log("Failure! File Invalid");
			console.log("Terminating Program - Code 005");
			process.exit();
		}
		const idData = JSON.parse(received);

		if (args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "") in idData) {
			m.channel.send("https://namemc.com/profile/" + idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")]);
		} else {
			m.channel.send("No account registered to this ID");
		}
		return;
	} else if (command.toLowerCase() == "account") {
		if (args.length != 1) {
			return m.channel.send("Incorrect amount of arguments");
		}
		if (!args[0].includes("@")) {
			return m.channel.send("First Arg must be a ping");
		}
		try {
			received = await fs.readFileSync("../global/IDS.json");
		} catch (e) {
			console.log("Failure! File Invalid");
			console.log("Terminating Program - Code 005");
			process.exit();
		}
		const idData = JSON.parse(received);

		if (args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "") in idData) {
			m.channel.send("https://namemc.com/profile/" + idData[args[0].replace("<", "").replace(">", "").replace("@", "").replace("!", "")]);
		} else {
			m.channel.send("No account registered to this ID");
		}
		return;
	} else if (command.toLowerCase() == "discord") {
		if (args.length != 0) {
			return m.channel.send("Too many arguments");
		}

		return m.channel.send("Hey! This bot was coded by Mysterium! Check out my server to report bugs and check out my other work: https://discord.gg/7Qb5xuJD4C\nHere's my website (WIP): <https://mysterium.me>");
	} else if (command == "mysterium") {
		return m.channel.send("Hey! This bot was coded by Mysterium! Check out my server to report bugs and check out my other work: https://discord.gg/7Qb5xuJD4C\nHere's my website (WIP): <https://mysterium.me>");
	} else if (command == "bugs") {
		return m.channel.send("Report any bugs here: https://discord.gg/7Qb5xuJD4C");
	}
});

        
        if (!user.player.socialMedia) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)
        if (!user.player.socialMedia.links) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)
        if (!user.player.socialMedia.links.DISCORD) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)
        console.log(m.author.tag == user.player.socialMedia.links.DISCORD)
        if (user.player.socialMedia.links.DISCORD != m.author.tag) {return m.channel.send(`Incorrectly set Discord!\nYou must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)}

        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        idData[user.player.uuid] = m.author.id
        idData[m.author.id] = user.player.uuid

        fs.writeFileSync("../global/IDS.json", JSON.stringify(idData));


        await db.set(m.author.id, {verbose:false, reset:true})
        await setCacheDB(user.player, user.player.uuid, m.author.id)
        return m.channel.send("Successfully set your ign to " + args[0])
    }
    else if (command.toLowerCase() == "stats") {

        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received) 

        if (await db.get(m.author.id) == undefined) {
            await db.set(m.author.id, {verbose:false, reset:true})
        }

        var settings = await db.get(m.author.id)
        var reset = true;

        // Parse Args
        if (args.length == 0) {
            username = idData[m.author.id]
            if (!settings.reset) {
                reset = false;
            }
        }
        else if (args.length == 1) {
            let games = ['all', 'overall', 'wiz', 'wizard', 'wizards', 'tntrun', 'run', 'pvprun', 'pvp', 'tnttag', 'tag', 'bow', 'spleef', 'bowspleef', 'duel', 'duels', 'tntduels']
            if (games.includes(args[0].toLowerCase())) {
                game = args[0].toLowerCase()
                username = idData[m.author.id]
            } 
            else if(args[0].includes("<@!")) {
                username = idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')]
                game = await db.get("chan_"+m.channel.id+".game")
                if (!settings.reset) {
                    reset = false;
                }
            }
            else {
                game = await db.get("chan_"+m.channel.id+".game")
                username = args[0]
            }
        }
        else if (args.length == 2) {
            game = args[0]
            if (args[1].includes("<@")) {
                username = idData[args[1].replace('<', '').replace('>', '').replace('@', '').replace('!', '')]
            }
            else {
                username = args[1]
            }
        }
        else {
            return sendErrorEmbed(m.channel,"Too many arguments",`Format: ${prefix}stats [game] [username]`)
        }
        if (!username) {
            return sendErrorEmbed(m.channel, "Invalid username", `User does not exist OR User has not set their IGN with ${prefix}set`)
        }
        if (username.length > 20) {

            user = await hypixelFetch(`player?uuid=${username}`)
        }
        else {
            var uuidInput = await mojangUUIDFetch(username).catch(() => {return {id:"UUIDINVALID12345678910"}})
            console.log(uuidInput)

            if (uuidInput.id.length > 20) {
                user = await hypixelFetch(`player?uuid=${uuidInput.id}`)
            }
            else {    
                user = await hypixelFetch(`player?name=${username}`)
            }
        }
        
        if(user == "API ERROR") { return m.channel.send("API Connection Issues, Hypixel might be offline") }

        if(!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if (await db.get(`weekly.${user.player.uuid}`) == undefined) {
            await setWeeklyDB(user.player, user.player.uuid)
        }
        if (await db.get(`monthly.${user.player.uuid}`) == undefined) {
            await setMonthlyDB(user.player, user.player.uuid)
        }
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)
    
        const TNTGames = user.player.stats.TNTGames

        data = await db.get(`cache.${m.author.id}.${user.player.uuid}`)
        if (data == undefined) {
            await setCacheDB(user.player, user.player.uuid, m.author.id)
            data = await db.get(`cache.${m.author.id}.${user.player.uuid}`)
        }

        rankData = findRank(user)

        if (game == "run" || game == "tntrun") {

            if (TNTGames.record_tntrun == undefined) {var runRecordDifference = 0} else {var runRecordDifference = TNTGames.record_tntrun - data.run.record}
            if (runRecordDifference > 0) {
                var runRecordDisplay = min_sec(replaceError(TNTGames.record_tntrun, 0)) + " (+" + min_sec(runRecordDifference) + ")"
            }
            else {
                var runRecordDisplay = min_sec(replaceError(TNTGames.record_tntrun, 0))
            }

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Run Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Record**`, runRecordDisplay, true)
                .addField(`**Wins**`, displayOldNewNumbers(data.run.w, replaceError(TNTGames.wins_tntrun, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.run.l, replaceError(TNTGames.deaths_tntrun, 0)), true)
                .addField(`**Potions Thrown**`, displayOldNewNumbers(data.run.potions, replaceError(TNTGames.run_potions_splashed_on_players, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(Math.round(data.run.wl*1000)/1000, Math.round(ratio(TNTGames.wins_tntrun, TNTGames.deaths_tntrun)*1000)/1000), true)
                .addField(`**Blocks Broken**`, displayOldNewNumbers(data.run.blocks, replaceError(user.player.achievements.tntgames_block_runner, 0)), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)

            
            if (reset) {
                await setRunDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "pvp" || game == "pvprun") {
            if (TNTGames.record_pvprun == undefined) {var pvpRecordDifference = 0} else {var pvpRecordDifference = TNTGames.record_pvprun - data.pvp.record}
            if (pvpRecordDifference > 0) {
                var pvpRecordDisplay = min_sec(replaceError(TNTGames.record_pvprun, 0)) + " (+" + min_sec(pvpRecordDifference) + ")"
            } else {
                var pvpRecordDisplay = min_sec(replaceError(TNTGames.record_pvprun, 0))
            }

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s PVP Run Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Record**`, pvpRecordDisplay, true)
                .addField(`**Wins**`, displayOldNewNumbers(data.pvp.w, replaceError(TNTGames.wins_pvprun, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.pvp.l, replaceError(TNTGames.deaths_pvprun, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.pvp.k, replaceError(TNTGames.kills_pvprun, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(Math.round(data.pvp.wl*1000)/1000, Math.round(ratio(TNTGames.wins_pvprun, TNTGames.deaths_pvprun)*1000)/1000), true)
                .addField(`**KDR**`, displayOldNewNumbers(Math.round(data.pvp.kd*1000)/1000, Math.round(ratio(TNTGames.kills_pvprun, TNTGames.deaths_pvprun)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            if (reset) {
                await setPVPDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "bowspleef" || game == "bow" || game == "spleef") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(data.bow.w, replaceError(TNTGames.wins_bowspleef, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.bow.l, replaceError(TNTGames.deaths_bowspleef, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.bow.k, replaceError(TNTGames.kills_bowspleef, 0)), true)
                .addField(`**Shots**`, displayOldNewNumbers(data.bow.shots, replaceError(TNTGames.tags_bowspleef, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(Math.round(data.bow.wl*1000)/1000, Math.round(ratio(TNTGames.wins_bowspleef, TNTGames.deaths_bowspleef)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            if (reset) {
                await setBowDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "tag" || game == "tnttag") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Tag Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(data.tag.w, replaceError(TNTGames.wins_tntag, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true)
                .addField(`**K/W**`, displayOldNewNumbers(Math.round(data.tag.kw*1000)/1000, Math.round(ratio(TNTGames.kills_tntag, TNTGames.wins_tntag)*1000)/1000), true)
                .addField(`**Tags**`, displayOldNewNumbers(data.tag.tags, replaceError(user.player.achievements.tntgames_clinic, 0)), true)
                .addField(`**Tags/Kill**`, displayOldNewNumbers(Math.round(data.tag.tk*1000)/1000, Math.round(ratio(user.player.achievements.tntgames_clinic, TNTGames.kills_tntag)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            if (reset) {
                await setTagDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "wizards" || game == "wiz" || game == "wizard") {

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Stats`)
                .setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(data.wizards.w, replaceError(TNTGames.wins_capture, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.wizards.k, replaceError(TNTGames.kills_capture, 0)), true)
                .addField(`**Assists**`, displayOldNewNumbers(data.wizards.a, replaceError(TNTGames.assists_capture, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.wizards.d, replaceError(TNTGames.deaths_capture, 0)), true)
                .addField(`**Points Captured**`, displayOldNewNumbers(data.wizards.p, replaceError(TNTGames.points_capture, 0)), true)
                .addField(`**KDR**`, displayOldNewNumbers(Math.round(data.wizards.kd*1000)/1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.deaths_capture)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            
            if (settings.verbose) {
                if (TNTGames.air_time_capture == undefined) {var airTimeDifference = 0} else {var airTimeDifference = TNTGames.air_time_capture - data.wizards.air}
                if (airTimeDifference > 0) {
                    var airTimeDisplay = min_sec(Math.floor(replaceError(TNTGames.air_time_capture, 0)/1200)) + " (+" + min_sec(Math.floor(airTimeDifference/1200)) + ")"
                }
                else {
                    var airTimeDisplay = min_sec(Math.floor(replaceError(TNTGames.air_time_capture, 0)/1200))
                }

                embed.addField(`**Airtime**`, airTimeDisplay, true)
                .addField(`**KADR**`, displayOldNewNumbers(Math.round(data.wizards.kad*1000)/1000, Math.round(ratio(replaceError(TNTGames.kills_capture, 0)+replaceError(TNTGames.assists_capture, 0), TNTGames.deaths_capture)*1000)/1000), true)
                .addField(`**K/W**`, displayOldNewNumbers(Math.round(data.wizards.kw*1000)/1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.wins_capture)*1000)/1000), true)
                .addField(`**Fire**`, displayOldNewNumbers(data.wizardKills.f_k, replaceError(TNTGames.new_firewizard_kills, 0)), true)
                .addField(`**Ice**`, displayOldNewNumbers(data.wizardKills.i_k, replaceError(TNTGames.new_icewizard_kills, 0)), true)
                .addField(`**Wither**`, displayOldNewNumbers(data.wizardKills.w_k, replaceError(TNTGames.new_witherwizard_kills, 0)), true)
                .addField(`**Kinetic**`, displayOldNewNumbers(data.wizardKills.k_k, replaceError(TNTGames.new_kineticwizard_kills, 0)), true)
                .addField(`**Blood**`, displayOldNewNumbers(data.wizardKills.b_k, replaceError(TNTGames.new_bloodwizard_kills, 0)), true)
                .addField(`**Toxic**`, displayOldNewNumbers(data.wizardKills.t_k, replaceError(TNTGames.new_toxicwizard_kills, 0)), true)
                .addField(`**Hydro**`, displayOldNewNumbers(data.wizardKills.h_k, replaceError(TNTGames.new_hydrowizard_kills, 0)), true)
                .addField(`**Ancient**`, displayOldNewNumbers(data.wizardKills.a_k, replaceError(TNTGames.new_ancientwizard_kills, 0)), true)
                .addField(`**Storm**`, displayOldNewNumbers(data.wizardKills.s_k, replaceError(TNTGames.new_stormwizard_kills, 0)), true)
            }
            if (settings.verbose && reset) {
                await setWizKillsDB(user.player, user.player.uuid, m.author.id)
            }
            if (reset) {
                await setWizDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "all" || game == "overall") {
            if (TNTGames.record_tntrun == undefined) {var runRecordDifference = 0} else {var runRecordDifference = TNTGames.record_tntrun - data.allTNT.record_tntrun}
            if (runRecordDifference > 0) {
                var runRecordDisplay = min_sec(TNTGames.record_tntrun) + " (+" + min_sec(runRecordDifference) + ")"
            }
            else {
                var runRecordDisplay = min_sec(TNTGames.record_tntrun)
            }

            if (TNTGames.record_pvprun == undefined) {var pvpRecordDifference = 0} else {var pvpRecordDifference = TNTGames.record_pvprun - data.allTNT.record_pvprun}
            if (pvpRecordDifference > 0) {
                var pvpRecordDisplay = min_sec(TNTGames.record_pvprun) + " (+" + min_sec(pvpRecordDifference) + ")"
            } else {
                var pvpRecordDisplay = min_sec(TNTGames.record_pvprun)
            }

            if (user.player.achievements.tntgames_tnt_triathlon == undefined) {var playTimeDifference = 0} else {var playTimeDifference = user.player.achievements.tntgames_tnt_triathlon - data.allTNT.time}
            
            if (playTimeDifference > 0) {
                var playTimeDisplay = min_sec(replaceError(user.player.achievements.tntgames_tnt_triathlon, 0)) + " (+" + min_sec(playTimeDifference) + ")"
            }
            else {
                var playTimeDisplay = min_sec(user.player.achievements.tntgames_tnt_triathlon)
            }

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Games Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Coins**`, displayOldNewNumbers(data.allTNT.coins, replaceError(TNTGames.coins, 0)), true)
                .addField(`**Winstreak**`, displayOldNewNumbers(data.allTNT.streak, replaceError(TNTGames.winstreak, 0)), true)
                .addField(`**Playtime**`, playTimeDisplay, true)
                .addField(`**TNT Wins**`, displayOldNewNumbers(data.allTNT.total_wins, replaceError(TNTGames.wins_tntrun, 0)+replaceError(TNTGames.wins_pvprun, 0)+replaceError(TNTGames.wins_tntag, 0)+replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0),), true)
                .addField(`**Tag Wins**`, displayOldNewNumbers(data.allTNT.tag_wins, replaceError(TNTGames.wins_tntag, 0)), true)
                .addField(`**TNT Run Record**`, runRecordDisplay, true)
                .addField(`**TNT Run Wins**`, displayOldNewNumbers(data.allTNT.run_wins, replaceError(TNTGames.wins_tntrun, 0)), true)
                .addField(`**Bowspleef Wins**`, displayOldNewNumbers(data.allTNT.bow_wins, replaceError(TNTGames.wins_bowspleef, 0)), true)
                .addField(`**Wizards Wins**`, displayOldNewNumbers(data.allTNT.wizards_wins, replaceError(TNTGames.wins_capture, 0)), true)
                .addField(`**Wizards Kills**`, displayOldNewNumbers(data.allTNT.wizards_kills  , replaceError(TNTGames.kills_capture, 0)), true)
                .addField(`**PVP Run Record**`, pvpRecordDisplay, true)
                .addField(`**PVP Run Wins**`, displayOldNewNumbers(data.allTNT.pvp_wins, replaceError(TNTGames.wins_pvprun, 0)), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)

            if (reset) {
                await setAllDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "duel" || game == "duels") {
            if(user.player.stats.Duels == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Duels Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(replaceError(data.duels.w, 0), replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)), true)
                .addField(`**Losses**`, displayOldNewNumbers(replaceError(data.duels.l, 0), replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0),), true)
                .addField(`**Shots**`, displayOldNewNumbers(replaceError(data.duels.shots, 0), replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(replaceError(data.duels.wl, 0), ratio(user.player.stats.Duels.bowspleef_duel_wins, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0))), true)
                .addField(`**Best Streak**`, displayOldNewNumbers(replaceError(data.duels.streak, 0), replaceError(user.player.stats.Duels.best_tnt_games_winstreak, 0)), true)
                .addField(`**Current Streak**`, displayOldNewNumbers(replaceError(data.duels.currentStreak, 0), replaceError(user.player.stats.Duels.current_tnt_games_winstreak, 0)), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)

            if (reset) {
                await setDuelDB(user.player, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
    }
    else if (command.toLowerCase() == "kills") {
        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received) 

        if (await db.get(m.author.id) == undefined) {
            await db.set(m.author.id, {verbose:false, reset:true})
        }

        var settings = await db.get(m.author.id)
        var reset = true;

        // Parse Args
        if (args.length == 0) {
            username = idData[m.author.id]
            if (!settings.reset) {
                reset = false;
            }
        }
        else if (args.length == 1) {
            if(args[0].includes("<@!")) {
                username = idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')]
            }
            else { 
                username = args[0]
            }
        }
        else {
            return sendErrorEmbed(m.channel,"Too many arguments",`Format: ${prefix}stats [game] [username]`)
        }

        if (username.length > 20) {
            user = await hypixelFetch(`player?uuid=${username}`)
        }
        else {
            let uuidInput = await mojangUUIDFetch(username).catch(() => {return {id:"UUIDINVALID12345678910"}})

            if (uuidInput.id.length > 20) {
                user = await hypixelFetch(`player?uuid=${uuidInput.id}`)
            }
            else {    
                user = await hypixelFetch(`player?name=${username}`)
            }
        }

        if(user == "API ERROR") { return m.channel.send("API Connection Issues, Hypixel might be offline") }

        if(!user || !user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)

        const TNTGames = user.player.stats.TNTGames
        data = await db.get("cache."+m.author.id+"."+user.player.uuid)
        if (data == undefined) {
            await setCacheDB(user.player, user.player.uuid,m.author.id)
            data = await db.get("cache."+m.author.id+"."+user.player.uuid)
        }
        rankData = findRank(user)

        const embed = new Discord.MessageEmbed()
            .setColor(`${rankData.color}`)
            .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
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
            .setDescription("Total Kills: " + displayOldNewNumbers(data.wizardKills.total_k, replaceError(TNTGames.kills_capture, 0)))
        if (reset) {
            setWizKillsDB(user.player, user.player.uuid, m.author.id)
        }
        return m.channel.send(embed)
    }
    else if (command.toLowerCase() == "settings") {
        if (args.length != 2) {
            return sendErrorEmbed(m.channel, `Usage Error`,`Usage: ${prefix}settings [setting] [true/false]`)
        }

        if (args[0] == "verbose") {
            if (args[1] in booleanPhrases) {
                if (await db.get(`${m.author.id}.verbose`) == booleanPhrases[args[1]]) {
                    m.channel.send("This setting was already set!")
                }
                else {
                    m.channel.send("Settings changed!")

                }
                await db.set(`${m.author.id}.verbose`, booleanPhrases[args[1]])
                return
            }
            else {
                return sendErrorEmbed(m.channel, `Usage Error`,`Usage: ${prefix}settings verbose [true/false]`)
            }
        }
        else if (args[0] == "reset") {
            if (args[1] in booleanPhrases) {
                if (await db.get(`${m.author.id}.reset`) == booleanPhrases[args[1]]) {
                    m.channel.send("This setting was already set!")
                }
                else {
                    m.channel.send("Settings changed!")
                }
                await db.set(`${m.author.id}.reset`, booleanPhrases[args[1]])
                return
            }
            else {
                return sendErrorEmbed(m.channel, `Usage Error`,`Usage: ${prefix}settings reset [true/false]`)
            }
        }
    }
    else if (command.toLowerCase() == "reset") {
        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        if (m.author.id in idData) {
            var user = await hypixelFetch(`player?uuid=${idData[m.author.id]}`)
        }
        if(user == "API ERROR") { return m.channel.send("API Connection Issues, Hypixel might be offline") }

        if(!user || !user.sjuccess || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)

        await setCacheDB(user.player, user.player.uuid, m.author.id)
        return m.channel.send(`Reset counters for you!`)
    }
    else if (command.toLowerCase() == "source") {
        if (args.length != 0) {
            return m.channel.send("Too many arguments")
        }

        return m.channel.send("<https://github.com/Mysterium422/TNTStatsBot>")
    }
    else if (command.toLowerCase() == "account") {
        if (args.length != 1) { return m.channel.send("Incorrect amount of arguments")}
        if (!args[0].includes('@')) { return m.channel.send("First Arg must be a ping") }
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        let idData = JSON.parse(received)

        if (args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '') in idData) {
            m.channel.send("https://namemc.com/profile/" + idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')])
        }
        else {
            m.channel.send("No account registered to this ID")
        }
        return;
    }
    else if (command.toLowerCase() == "discord") {
        if (args.length != 0) {
            return m.channel.send("Too many arguments")
        }

        return m.channel.send(`**Discord Links**
**TNT Games** - <https://discord.gg/5gTM5UZdQb>
**TNT Wizards** - <https://discord.gg/95T6ZHa>
**TNT Run** - <https://discord.gg/W9xBSjt>
**TNT Tag** - <https://discord.gg/FsneyHHRRt>
**PVP Run** - <https://discord.gg/DRX8Jkt>
**Bow Spleef** - <https://discord.gg/sE4uNVs6MF>

**My Server** - <https://discord.gg/7Qb5xuJD4C> `)
    }
    else if (command == "mysterium") {
        return m.channel.send("Hey! This bot was coded by Mysterium! Check out my server to report bugs and check out my other work: https://discord.gg/7Qb5xuJD4C\nHere's my website (WIP): <https://mysterium.me>")
    }
    else if (command == "bugs") {
        return m.channel.send("Report any bugs here: https://discord.gg/7Qb5xuJD4C")
    }
    else if (command == "announcement") {
        if (m.author.id != ownerID) return

        channelList = db.all().filter(a => {return a.ID.contains("chan_")})
        for (let i = 0; i < channelList.length; i++) {
            if (client.channels.cache.has(channelList[i].ID.slice(5))) {
                channel = await client.channels.cache.get(channelList[i].ID.slice(5))
                channel.send(m.content.slice("/announcement ".length)).catch()
            }
        }
    }
    else if (command == "ownercommand") {
        if (m.author.id != ownerID) return

        channelList = db.all().filter(a => {return a.ID.contains("chan_")})
        for (let i = 0; i < channelList.length; i++) {
            if (client.channels.cache.has(channelList[i].ID.slice(5))) {
                channel = await client.channels.cache.get(channelList[i].ID.slice(5))
                channel.send(new Discord.MessageEmbed()
                    .setTitle("New Version: v4.0.0")
                    .setDescription(`**- New Dynamic Help Menu** (do /help or /tnthelp to check it out) *Please give bot manage reactions perms for the best experience*
**- Added TNT Duels stats!** /stats duels [username] to try that out (slightly unstable)
**- Formatted Playtime** in all stats menu
**- More command Aliases**
**- Bug Squashing**
- Groundwork for some new features`)
                    .setTimestamp()
                    .setColor("#3bcc71")
                    .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)).catch(() => {return})
            }
        }
    }

    else if (command == "weekly" || command == "monthly") {
        
        let received = ""
        try {received = await fs.readFileSync('../global/IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received) 

        if (await db.get(m.author.id) == undefined) {
            await db.set(m.author.id, {verbose:false, reset:true})
        }

        var settings = await db.get(m.author.id)
        var reset = true;

        // Parse Args
        if (args.length == 0) {
            username = idData[m.author.id]
            if (!settings.reset) {
                reset = false;
            }
        }
        else if (args.length == 1) {
            let games = ['all', 'overall', 'wiz', 'wizard', 'wizards', 'tntrun', 'run', 'pvprun', 'pvp', 'tnttag', 'tag', 'bow', 'spleef', 'bowspleef', 'duel', 'duels', 'tntduels']
            if (games.includes(args[0].toLowerCase())) {
                game = args[0].toLowerCase()
                username = idData[m.author.id]
            } 
            else if(args[0].includes("<@!")) {
                username = idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')]
                game = await db.get("chan_"+m.channel.id+".game")
                if (!settings.reset) {
                    reset = false;
                }
            }
            else {
                game = await db.get("chan_"+m.channel.id+".game")
                username = args[0]
            }
        }
        else if (args.length == 2) {
            game = args[0]
            if (args[1].includes("<@")) {
                username = idData[args[1].replace('<', '').replace('>', '').replace('@', '').replace('!', '')]
            }
            else {
                username = args[1]
            }
        }
        else {
            return sendErrorEmbed(m.channel,"Too many arguments",`Format: ${prefix}stats [game] [username]`)
        }
        if (!username) {
            return sendErrorEmbed(m.channel, "Invalid username", `User does not exist OR User has not set their IGN with ${prefix}set`)
        }
        if (username.length > 20) {

            user = await hypixelFetch(`player?uuid=${username}`)
        }
        else {
            var uuidInput = await mojangUUIDFetch(username).catch(() => {return {id:"UUIDINVALID12345678910"}})
            console.log(uuidInput)

            if (uuidInput.id.length > 20) {
                user = await hypixelFetch(`player?uuid=${uuidInput.id}`)
            }
            else {    
                user = await hypixelFetch(`player?name=${username}`)
            }
        }
        
        if(user == "API ERROR") { return m.channel.send("API Connection Issues, Hypixel might be offline") }

        if(!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)
        if (await db.get(`weekly.${user.player.uuid}`) == undefined) {
            await setWeeklyDB(user.player, user.player.uuid)
        }
        if (await db.get(`monthly.${user.player.uuid}`) == undefined) {
            await setMonthlyDB(user.player, user.player.uuid)
        }
        data = await db.get(`${command}.${user.player.uuid}`)

        const TNTGames = user.player.stats.TNTGames

        rankData = await findRank(user)

        if (game == "run" || game == "tntrun") {

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Run Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, replaceError(TNTGames.wins_tntrun, 0) - data.run.w, true)
                .addField(`**Deaths**`, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l, true)
                .addField(`**Potions Thrown**`, replaceError(TNTGames.run_potions_splashed_on_players, 0) - data.run.potions, true)
                .addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_tntrun, 0) - data.run.w, replaceError(TNTGames.deaths_tntrun, 0) - data.run.l)*1000)/1000, true)
                .addField(`**Blocks Broken**`, replaceError(user.player.achievements.tntgames_block_runner, 0) - data.run.blocks, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            return m.channel.send(embed)
        }
        else if (game == "pvp" || game == "pvprun") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} PVP Run Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, true)
                .addField(`**Deaths**`, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l, true)
                .addField(`**Kills**`, replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, true)
                .addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_pvprun, 0) - data.pvp.w, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l)*1000)/1000, true)
                .addField(`**KDR**`, Math.round(ratio(replaceError(TNTGames.kills_pvprun, 0) - data.pvp.k, replaceError(TNTGames.deaths_pvprun, 0) - data.pvp.l)*1000)/1000, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            return m.channel.send(embed)
        }
        else if (game == "bowspleef" || game == "bow" || game == "spleef") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, true)
                .addField(`**Deaths**`, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l, true)
                .addField(`**Kills**`, replaceError(TNTGames.kills_bowspleef, 0) - data.bow.k, true)
                .addField(`**Shots**`, replaceError(TNTGames.tags_bowspleef, 0) - data.bow.shots, true)
                .addField(`**W/L**`, Math.round(ratio(replaceError(TNTGames.wins_bowspleef, 0) - data.bow.w, replaceError(TNTGames.deaths_bowspleef, 0) - data.bow.l)*1000)/1000, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            return m.channel.send(embed)
        }
        else if (game == "tag" || game == "tnttag") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Tag Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, replaceError(TNTGames.wins_tntag, 0) - data.tag.w, true)
                .addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true)
                .addField(`**K/W**`, Math.round(ratio(replaceError(TNTGames.kills_tntag, 0) - data.tag.k, replaceError(TNTGames.wins_tntag, 0) - data.tag.w)*1000)/1000, true)
                .addField(`**Tags**`, replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, true)
                .addField(`**Tags/Kill**`, Math.round(ratio(replaceError(user.player.achievements.tntgames_clinic, 0) - data.tag.tags, replaceError(TNTGames.kills_tntag, 0) - data.tag.k)*1000)/1000, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            return m.channel.send(embed)
        }
        else if (game == "wizards" || game == "wiz" || game == "wizard") {

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Wizards Stats`)
                .setURL(`https://www.plotzes.ml/stats/${user.player.displayname}`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, replaceError(TNTGames.wins_capture, 0) - data.wizards.w, true)
                .addField(`**Kills**`, replaceError(TNTGames.kills_capture, 0) - data.wizards.k, true)
                .addField(`**Assists**`, replaceError(TNTGames.assists_capture, 0) - data.wizards.a, true)
                .addField(`**Deaths**`, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d, true)
                .addField(`**Points Captured**`, replaceError(TNTGames.points_capture, 0) - data.wizards.p, true)
                .addField(`**KDR**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d)*1000)/1000, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            
            if (settings.verbose) {
                embed.addField(`**Airtime**`, min_sec(Math.floor((replaceError(TNTGames.air_time_capture, 0) - data.wizards.air)/1200)),)
                    .addField(`**KADR**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) + replaceError(TNTGames.assists_capture, 0) - data.wizards.k - data.wizards.a, replaceError(TNTGames.deaths_capture, 0) - data.wizards.d)*1000)/1000, true)
                    .addField(`**K/W**`, Math.round(ratio(replaceError(TNTGames.kills_capture, 0) - data.wizards.k, replaceError(TNTGames.wins_capture, 0) - data.wizards.w)*1000)/1000, true)
                    .addField(`**Fire**`, replaceError(TNTGames.new_firewizard_kills, 0) - data.wizardKills.f_k, true)
                    .addField(`**Ice**`, replaceError(TNTGames.new_icewizard_kills, 0) - data.wizardKills.i_k, true)
                    .addField(`**Wither**`, replaceError(TNTGames.new_witherwizard_kills, 0) - data.wizardKills.w_k, true)
                    .addField(`**Kinetic**`, replaceError(TNTGames.new_kineticwizard_kills, 0) - data.wizardKills.k_k, true)
                    .addField(`**Blood**`, replaceError(TNTGames.new_bloodwizard_kills, 0) - data.wizardKills.b_k, true)
                    .addField(`**Toxic**`, replaceError(TNTGames.new_toxicwizard_kills, 0) - data.wizardKills.t_k, true)
                    .addField(`**Hydro**`, replaceError(TNTGames.new_hydrowizard_kills, 0) - data.wizardKills.h_k, true)
                    .addField(`**Ancient**`, replaceError(TNTGames.new_ancientwizard_kills, 0) - data.wizardKills.a_k, true)
                    .addField(`**Storm**`, replaceError(TNTGames.new_stormwizard_kills, 0) - data.wizardKills.s_k, true)
            }
            return m.channel.send(embed)
        }
        else if (game == "all" || game == "overall") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} TNT Games Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Coins**`, replaceError(TNTGames.coins, 0) - data.allTNT.coins, true)
                .addField(`**Playtime**`, min_sec(replaceError(user.player.achievements.tntgames_tnt_triathlon, 0) - data.allTNT.time), true)
                .addField(`**TNT Wins**`, replaceError(TNTGames.wins_tntrun, 0)+replaceError(TNTGames.wins_pvprun, 0)+replaceError(TNTGames.wins_tntag, 0)+replaceError(TNTGames.wins_bowspleef, 0) + replaceError(TNTGames.wins_capture, 0) - data.allTNT.total_wins, true)
                .addField(`**Tag Wins**`, replaceError(TNTGames.wins_tntag, 0) - data.allTNT.tag_wins, true)
                .addField(`**TNT Run Wins**`, replaceError(TNTGames.wins_tntrun, 0) - data.allTNT.run_wins, true)
                .addField(`**Bowspleef Wins**`, replaceError(TNTGames.wins_bowspleef, 0) - data.allTNT.bow_wins, true)
                .addField(`**Wizards Wins**`, replaceError(TNTGames.wins_capture, 0) - data.allTNT.wizards_wins, true)
                .addField(`**Wizards Kills**`, replaceError(TNTGames.kills_capture, 0) - data.allTNT.wizards_kills, true)
                .addField(`**PVP Run Wins**`, replaceError(TNTGames.wins_pvprun, 0) - data.allTNT.pvp_wins, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            return m.channel.send(embed)
        }
        else if (game == "duel" || game == "duels") {
            if(user.player.stats.Duels == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's Duel Database`)

            console.log(Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)-data.duels.l)*1000)/1000)
            console.log(replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)-data.duels.l)
            
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s ${command == "weekly" ? "Weekly" : "Monthly"} Bowspleef Duels Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/${user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text[randInt(0, embedFooter.text.length - 1)], embedFooter.image.green)
                .addField(`**Wins**`, replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, true)
                .addField(`**Losses**`, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.l, true)
                .addField(`**Shots**`, replaceError(user.player.stats.Duels.bowspleef_duel_bow_shots, 0) - data.duels.shots, true)
                .addField(`**W/L**`, Math.round(ratio(replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0) - data.duels.w, replaceError(user.player.stats.Duels.bowspleef_duel_rounds_played, 0)-replaceError(user.player.stats.Duels.bowspleef_duel_wins, 0)-data.duels.l)*1000)/1000, true)
                .setDescription(`Showing changes since: ${timeConverter(Math.floor(data.time))}`)
            return m.channel.send(embed)
        }
    }
})

client.login(config.TNTStatsBotToken);
