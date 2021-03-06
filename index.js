// FIND PACKAGES
const Discord = require('discord.js'), client = new Discord.Client(), client2 = new Discord.Client()
const db = require('quick.db');
const fs = require('fs');
const yaml = require('js-yaml')

// FETCH UNUSED BUT WORKS FOR FUTURE
const { hypixelFetch, plotzesFetch, fetch } = require('./mystFetch.js')

// USED FOR INFO COMMAND
let unix_time_start = Date.now()

// SETUP CONFIG
let yamlConfig = yaml.loadAll(fs.readFileSync('config.yaml', 'utf8'))
const config = yamlConfig[0]

const package = JSON.parse(fs.readFileSync('package.json'))

// HELPER OBJECTS
const embedFooter = {
        text: 'TNT Stats Bot by Mysterium_',
        image: {
            'green': 'https://cdn.discordapp.com/emojis/722990201307398204.png?v=1',
            'red':   'https://cdn.discordapp.com/emojis/722990201302941756.png?v=1'
        }
}

const helpMsg = `__Commands (Prefixes vary depending on your channel)__
**/TNThelp** opens this page. Works anywhere this bot can read/send messages
**/TNTconfigure** <game> <prefix> enables the bot with the default game and prefix (admin perms needed). Works anywhere this bot can read/send messages
**/help** opens this page
**/info** shows info about the bot
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

const ChatColor = {black:"#000000",
dark_blue:"#0000AA",
dark_green:"#00AA00",
dark_aqua:"#00AAAA",
dark_red:"#AA0000",
dark_purple:"#AA00AA",
gold:"#FFAA00",
gray:"#AAAAAA",
dark_gray:"#555555",
blue:"#5555FF",
green:"#55FF55",
aqua:"#55FFFF",
red:"#FF5555",
light_purple:"#FF55FF",
yellow:"#FFFF55",
white:"#FFFFFF"}

const ChatCodes = {0:"black",
1:"dark_blue",
2:"dark_green",
3:"dark_aqua",
4:"dark_red",
5:"dark_purple",
6:"gold",
7:"gray",
8:"dark_gray",
9:"blue",
a:"green",
b:"aqua",
c:"red",
d:"light_purple",
e:"yellow",
f:"white"}

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
function findRank (user) {
    var rankData = {displayName:"", color:ChatColor.gray}

    if(user.player.newPackageRank == "VIP") {
        //OLD: #3ce63d
        rankData = {displayName:"[VIP]", color:"#3ce63d"}
    }
    else if(user.player.newPackageRank == "VIP_PLUS") {
        rankData = {displayName:"[VIP+]", color:"#3ce63d"}
    }    
    else if(user.player.newPackageRank == "MVP") {
        //OLD: #3de6e6
        rankData = {displayName:"[MVP]", color:"#3de6e6"}
    }
    else if(user.player.newPackageRank == "MVP_PLUS") {
        rankData = {displayName:"[MVP+]", color:"#3de6e6"}
    }
    if(user.player.monthlyPackageRank == "SUPERSTAR") {
        rankData = {displayName:"[MVP++]", color:ChatColor.gold}
    }
    if (user.player.rank == "YOUTUBER") {
        rankData = {displayName:"[YOUTUBE]", color:ChatColor.red}
    }
    else if (user.player.rank == "HELPER") {
        rankData = {displayName:"[HELPER]", color:ChatColor.blue}
    }
    else if (user.player.rank == "MODERATOR") {
        rankData = {displayName:"[MOD]", color:ChatColor.dark_green}
    }
    else if (user.player.rank == "ADMIN") {
        rankData = {displayName:"[ADMIN]", color:ChatColor.red}
    }
    if (user.player.prefix) {
        rankData = {displayName:user.player.prefix.replace(/\u00A7[0-9A-FK-OR]/ig, ''), color:replaceError(ChatColor[ChatCodes[user.player.prefix[(user.player.prefix.indexOf('§') == -1) ? undefined : user.player.prefix.indexOf('§')+1]]], ChatColor.gray)}
    }
    return rankData;
}

function sendErrorEmbed(channel, error, description) {
    const errorEmbed = new Discord.MessageEmbed()
        .setColor('#F64B4B')
        .setTitle(`Oops!`)
        .addField(`${error}`, `${description}`)
        .setTimestamp()
        .setFooter(embedFooter.text, embedFooter.image.red)
    return channel.send(errorEmbed);
}

Array.prototype.unique = function() {
    var a = this.concat();
    let b = []
    
    a.forEach((item, index) => { if (a.indexOf(item) == index) b.push(b) });
    return b;
};

function min_sec(seconds) {
    var mins = Math.floor(seconds/60)
    var secondsNew = seconds - mins*60
    if (secondsNew < 10) {
        return mins.toString() + ":0" + secondsNew.toString()
    }
    else {
        return mins.toString() + ":" + secondsNew.toString()
    }
}

function displayOldNewNumbers(old, updated) {
    var updatedRound = Math.round(updated*1000)/1000

    if (old == updated) {
        return updatedRound.toString()
    }
    else if (old > updated) {
        var diff = Math.round((old-updated)*1000)/1000
        return updatedRound.toString() + " (-" + diff.toString() + ")"
    }
    else {
        var diff = Math.round((updated-old)*1000)/1000
        return updatedRound.toString() + " (+" + diff.toString() + ")"
    }
}

function replaceError(a, defaultVar) {
    if (a == undefined) {
        return defaultVar;
    }
    else {
        return a;
    }
}

// FOR KDR AND W/L AND OTHER RATIOS
function ratio(a, b) {
    a = replaceError(a, 0)
    b = replaceError(b, 0)

    if (b == 0) return a;
    else return a/b
}


// DB HANDLERS
async function setRunDB(TNTGames, uuid, authorID) {

    var runDBEntry = {
        record:replaceError(TNTGames.record_tntrun, 0),
        w:replaceError(TNTGames.wins_tntrun, 0),
        l:replaceError(TNTGames.deaths_tntrun, 0),
        wl:ratio(TNTGames.wins_tntrun, TNTGames.deaths_tntrun),
        potions:replaceError(TNTGames.run_potions_splashed_on_players, 0)
    }

    await db.set(`cache.${authorID}.${uuid}.run`, runDBEntry)
    return
}

async function setPVPDB(TNTGames, uuid, authorID) {

    var pvpDBEntry = {
        record:replaceError(TNTGames.record_pvprun, 0),
        w:replaceError(TNTGames.wins_pvprun, 0),
        l:replaceError(TNTGames.deaths_pvprun, 0),
        k:replaceError(TNTGames.kills_pvprun, 0),
        wl:ratio(TNTGames.wins_pvprun, TNTGames.deaths_pvprun),
        kd:ratio(TNTGames.kills_pvprun, TNTGames.deaths_pvprun)
    }

    await db.set(`cache.${authorID}.${uuid}.pvp`, pvpDBEntry)
    return
}

async function setBowDB(TNTGames, uuid, authorID) {

    var bowDBEntry = {
        w:replaceError(TNTGames.wins_bowspleef, 0),
        l:replaceError(TNTGames.deaths_bowspleef, 0),
        shots:replaceError(TNTGames.tags_bowspleef, 0),
        k:replaceError(TNTGames.kills_bowspleef, 0),
        wl:ratio(TNTGames.wins_bowspleef, TNTGames.deaths_bowspleef)
    }

    await db.set(`cache.${authorID}.${uuid}.bow`, bowDBEntry)
    return
}

async function setTagDB(TNTGames, uuid, authorID) {

    var tagDBEntry = {
        w:replaceError(TNTGames.wins_tntag, 0),
        k:replaceError(TNTGames.kills_tntag, 0),
        kw:ratio(TNTGames.kills_tntag, TNTGames.wins_tntag)
    }

    await db.set(`cache.${authorID}.${uuid}.tag`, tagDBEntry)
    return
}

async function setWizDB(TNTGames, uuid, authorID) {

    var wizDBEntry = {
        w:replaceError(TNTGames.wins_capture, 0),
        k:replaceError(TNTGames.kills_capture, 0),
        a:replaceError(TNTGames.assists_capture, 0),
        d:replaceError(TNTGames.deaths_capture, 0),
        p:replaceError(TNTGames.points_capture, 0),
        kd:ratio(TNTGames.kills_capture, TNTGames.deaths_capture),
        kad:ratio(replaceError(TNTGames.kills_capture)+replaceError(TNTGames.assists_capture), TNTGames.deaths_capture),
        air:replaceError(TNTGames.air_time_capture, 0),
        kw:ratio(TNTGames.kills_capture, TNTGames.wins_capture)
    }

    await db.set(`cache.${authorID}.${uuid}.wizards`, wizDBEntry)
    return
}

async function setWizKillsDB(TNTGames, uuid, authorID) {

    var wizKillDBEntry = {
        total_k:replaceError(TNTGames.kills_capture, 0),
        f_k:replaceError(TNTGames.new_firewizard_kills, 0),
        i_k:replaceError(TNTGames.new_icewizard_kills, 0),
        w_k:replaceError(TNTGames.new_witherwizard_kills, 0),
        k_k:replaceError(TNTGames.new_kineticwizard_kills, 0),
        b_k:replaceError(TNTGames.new_bloodwizard_kills, 0),
        t_k:replaceError(TNTGames.new_toxicwizard_kills, 0),
        h_k:replaceError(TNTGames.new_hydrowizard_kills, 0),
        a_k:replaceError(TNTGames.new_ancientwizard_kills, 0),
        s_k:replaceError(TNTGames.new_stormwizard_kills, 0),
    }

    await db.set(`cache.${authorID}.${uuid}.wizardKills`, wizKillDBEntry)
    return
}

async function setAllDB(TNTGames, uuid, authorID) {

    await db.set(`cache.${authorID}.${uuid}.coins`, replaceError(TNTGames.coins, 0))
    await db.set(`cache.${authorID}.${uuid}.w`, replaceError(TNTGames.wins, 0))
    await db.set(`cache.${authorID}.${uuid}.streak`, replaceError(TNTGames.winstreak, 0))

    await db.set(`cache.${authorID}.${uuid}.run,record`, replaceError(TNTGames.record_tntrun, 0))
    await db.set(`cache.${authorID}.${uuid}.run.w`, replaceError(TNTGames.wins_tntrun, 0))

    await db.set(`cache.${authorID}.${uuid}.pvp.record`, replaceError(TNTGames.record_pvprun, 0))
    await db.set(`cache.${authorID}.${uuid}.pvp.w`, replaceError(TNTGames.wins_pvprun, 0))
    await db.set(`cache.${authorID}.${uuid}.pvp.k`, replaceError(TNTGames.kills_pvprun, 0))

    await db.set(`cache.${authorID}.${uuid}.tag.w`, replaceError(TNTGames.wins_tntag, 0))

    await db.set(`cache.${authorID}.${uuid}.bow.w`, replaceError(TNTGames.wins_bowspleef, 0))

    await db.set(`cache.${authorID}.${uuid}.wizards.w`, replaceError(TNTGames.wins_capture, 0))
    await db.set(`cache.${authorID}.${uuid}.wizards.k`, replaceError(TNTGames.kills_capture, 0))
    return
}

async function setCacheDB(TNTGames, uuid, authorID) {
    await setRunDB(TNTGames, uuid, authorID);
    await setPVPDB(TNTGames, uuid, authorID);
    await setTagDB(TNTGames, uuid, authorID);
    await setWizDB(TNTGames, uuid, authorID);
    await setBowDB(TNTGames, uuid, authorID);
    await setWizKillsDB(TNTGames, uuid, authorID);

    await db.set(`cache.${authorID}.${uuid}.coins`, replaceError(TNTGames.coins, 0))
    return
}

client.on('ready', () => {
    console.log('Bot: TNT Stats Bot is online!');
    client.user.setActivity("TNT Games  | Use /TNThelp");
});

client.on('message', async m => {

    if(m.author.bot) return;

    if(m.content.toLowerCase().startsWith("/tntconfigure")) {
        const configurationTool = {all:'All TNT Games',
    wizards:'TNT Wizards',
    run:'TNT Run',
    pvp:'PVP Run',
    tag:'TNT Tag',
    bowspleef:'Bow spleef'}

        if (!m.member.hasPermission('ADMINISTRATOR')) return
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
        .setFooter(embedFooter.text, embedFooter.image.green)
        .addField(`__Default Game:__`, configurationTool[args[0]], true)
        .addField(`__Bot Prefix:__`, args[1], true)
        return m.channel.send(embed)
    }

    else if (m.content.toLowerCase().startsWith("/tnthelp")) {
        console.log(`${m.author.username}: ${m.content}`)
        return m.channel.send(helpMsg)
    }

    var channel = await db.get("chan_"+m.channel.id)
    if (channel === null) return

    var prefix = channel.prefix
    if(!m.content.startsWith(prefix)) return
    var game = channel.game

    var args = m.content.slice(prefix.length).split(' ');
    const command = args.shift()

    console.log(m.author.username+": " + m.content)

    if(command.toLowerCase() == "help") {
        return m.channel.send(helpMsg)
    }

    else if(command.toLowerCase() == "invite") {
        return m.channel.send("Use /TNTconfigure to setup the bot: \nhttps://discord.com/oauth2/authorize?client_id=735055542178938960&scope=bot&permissions=519232")
    }
    else if(command.toLowerCase() == "verify") {
        if (m.author.id != config.masterID) return;
        if (args.length != 2) { return m.channel.send("Incorrect amount of arguments")}
        if (!args[0].includes('@')) { return m.channel.send("First Arg must be a ping") }

        if (args[1].length > 20) {
            data = await hypixelFetch(`player?uuid=${args[1]}`)
        }
        else {
            data = await hypixelFetch(`player?name=${args[1]}`)
        }

        if(!data.success || data.success == false || data.player == null || data.player == undefined || !data.player || data.player.stats == undefined) return m.channel.send("Invalid Something");
        
        let received = ""
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        idData[data.player.uuid] = args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')
        idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')] = data.player.uuid

        await setCacheDB(data.player.stats.TNTGames, data.player.uuid, m.author.id)


        fs.writeFileSync("IDS.json", JSON.stringify(idData));
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
            data = await hypixelFetch(`player?name=${args[1]}`)
        }

        if(!data.success || data.success == false || data.player == null || data.player == undefined || !data.player || data.player.stats == undefined) return m.channel.send("Invalid Something");
        
        let received = ""
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        idData[data.player.uuid] = args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')

        fs.writeFileSync("IDS.json", JSON.stringify(idData));
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
**Total Unique Users:** ${botUsersCount}`
        return m.channel.send(result);
    }

    else if (command.toLowerCase() == 'set') {
        if(args.length !== 1) {return sendErrorEmbed(m.channel, `Usage Error`,`Usage: ${prefix}set [username]`)}

        var user = await hypixelFetch(`player?name=${args[0]}`)
        if (!user.success && user.cause == "Invalid API key") {return sendErrorEmbed(m.channel,"Im too busy!", "Please wait a few seconds and try again")}

        if(!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Games Database`)
        if (!user.player.socialMedia) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)
        if (!user.player.socialMedia.links) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)
        if (!user.player.socialMedia.links.DISCORD) return m.channel.send(`You must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)
        console.log(m.author.tag == user.player.socialMedia.links.DISCORD)
        if (user.player.socialMedia.links.DISCORD != m.author.tag) {return m.channel.send(`ljsadfafjskdIncorrectly set Discord!\nYou must first link your discord to hypixel. <https://www.youtube.com/watch?v=Cfa-EcRD6SI> for a tutorial (ignore the part at the end with using a command in guild discord)\nThen, come back here to do /set ${args[0]} again.\n\nAlternatively, DM Mysterium#5229 or ping me and I will verify you.`)}

        let received = ""
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        idData[user.player.uuid] = args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')

        fs.writeFileSync("IDS.json", JSON.stringify(idData));


        await db.set(m.author.id, {verbose:false, reset:true})
        await setCacheDB(user.player.stats.TNTGames, user.player.uuid, m.author.id)
        return m.channel.send("Successfully set your ign to " + args[0])
    }

    else if (command.toLowerCase() == "stats") {
        let received = ""
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
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
            let games = ['all','wizards','run','pvp','tag','bowspleef']
            if (games.includes(args[0])) {
                game = args[0]
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
            var user = await hypixelFetch(`player?uuid=${username}`)
            plotzesFetch("stats", `?user=${username}&discupdate=false`)
        }
        else {
            var user = await hypixelFetch(`player?name=${username}`)
            plotzesFetch("stats", `?user=${username}&discupdate=false`)
        }

        if(!user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)
    
        const TNTGames = user.player.stats.TNTGames

        data = await db.get(`cache.${m.author.id}.${user.player.uuid}`)
        if (data == undefined) {
            await setCacheDB(TNTGames, user.player.uuid, m.author.id)
        }
        if (data.run == undefined || data.tag == undefined || data.pvp == undefined || data.bow == undefined || data.wizards == undefined || data.wizardKills == undefined || data.coins == undefined) {
            await setCacheDB(TNTGames, user.player.uuid, m.author.id);
        }

        if (data.wins == undefined || data.streak == undefined) {
            await db.set(`cache.${m.author.id}.${user.player.uuid}.streak`, replaceError(TNTGames.winstreak, 0))
            await db.set(`cache.${m.author.id}.${user.player.uuid}.w`, replaceError(TNTGames.wins, 0))
            await db.get(`cache.${m.author.id}.${user.player.uuid}`)
        }
        data = await db.get(`cache.${m.author.id}.${user.player.uuid}`)

        rankData = findRank(user)

        if (game == "run") {
            if (TNTGames.record_tntrun == undefined) {var runRecordDifference = 0} else {var runRecordDifference = TNTGames.record_tntrun - data.run.record}
            if (runRecordDifference > 0) {
                var runRecordDisplay = min_sec(TNTGames.record_tntrun) + " (+" + min_sec(runRecordDifference) + ")"
            }
            else {
                var runRecordDisplay = min_sec(TNTGames.record_tntrun)
            }

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Run Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text, embedFooter.image.green)
                .addField(`**Record**`, runRecordDisplay, true)
                .addField(`**Wins**`, displayOldNewNumbers(data.run.w, replaceError(TNTGames.wins_tntrun, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.run.l, replaceError(TNTGames.deaths_tntrun, 0)), true)
                .addField(`**Potions Thrown**`, displayOldNewNumbers(data.run.potions, replaceError(TNTGames.run_potions_splashed_on_players, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(Math.round(data.run.wl*1000)/1000, Math.round(ratio(TNTGames.wins_tntrun, TNTGames.deaths_tntrun)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)

            
            if (reset) {
                await setRunDB(TNTGames, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "pvp") {
            if (TNTGames.record_pvprun == undefined) {var pvpRecordDifference = 0} else {var pvpRecordDifference = TNTGames.record_pvprun - data.pvp.record}
            if (pvpRecordDifference > 0) {
                var pvpRecordDisplay = min_sec(TNTGames.record_pvprun) + " (+" + min_sec(pvpRecordDifference) + ")"
            } else {
                var pvpRecordDisplay = min_sec(TNTGames.record_pvprun)
            }

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s PVP Run Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text, embedFooter.image.green)
                .addField(`**Record**`, pvpRecordDisplay, true)
                .addField(`**Wins**`, displayOldNewNumbers(data.pvp.w, replaceError(TNTGames.wins_pvprun, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.pvp.l, replaceError(TNTGames.deaths_pvprun, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.pvp.k, replaceError(TNTGames.kills_pvprun, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(Math.round(data.pvp.wl*1000)/1000, Math.round(ratio(TNTGames.wins_pvprun, TNTGames.deaths_pvprun)*1000)/1000), true)
                .addField(`**KDR**`, displayOldNewNumbers(Math.round(data.run.kd*1000)/1000, Math.round(ratio(TNTGames.kills_pvprun, TNTGames.deaths_pvprun)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            if (reset) {
                await setPVPDB(TNTGames, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "bowspleef") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s Bowspleef Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text, embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(data.bow.w, replaceError(TNTGames.wins_bowspleef, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.bow.l, replaceError(TNTGames.deaths_bowspleef, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.bow.k, replaceError(TNTGames.kills_bowspleef, 0)), true)
                .addField(`**Shots**`, displayOldNewNumbers(data.bow.shots, replaceError(TNTGames.tags_bowspleef, 0)), true)
                .addField(`**W/L**`, displayOldNewNumbers(Math.round(data.bow.wl*1000)/1000, Math.round(ratio(TNTGames.wins_bowspleef, TNTGames.deaths_bowspleef)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            if (reset) {
                await setBowDB(TNTGames, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "tag") {
            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Tag Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text, embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(data.tag.w, replaceError(TNTGames.wins_tntag, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.tag.k, replaceError(TNTGames.kills_tntag, 0)), true)
                .addField(`**W/K**`, displayOldNewNumbers(Math.round(data.tag.kw*1000)/1000, Math.round(ratio(TNTGames.kills_tntag, TNTGames.wins_tntag)*1000)/1000, true))
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            if (reset) {
                await setTagDB(TNTGames, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "wizards") {

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Stats`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
                .setTimestamp()
                .setFooter(embedFooter.text, embedFooter.image.green)
                .addField(`**Wins**`, displayOldNewNumbers(data.wizards.w, replaceError(TNTGames.wins_capture, 0)), true)
                .addField(`**Kills**`, displayOldNewNumbers(data.wizards.k, replaceError(TNTGames.kills_capture, 0)), true)
                .addField(`**Assists**`, displayOldNewNumbers(data.wizards.a, replaceError(TNTGames.assists_capture, 0)), true)
                .addField(`**Deaths**`, displayOldNewNumbers(data.wizards.d, replaceError(TNTGames.deaths_capture, 0)), true)
                .addField(`**Points Captured**`, displayOldNewNumbers(data.wizards.p, replaceError(TNTGames.points_capture, 0)), true)
                .addField(`**KDR**`, displayOldNewNumbers(Math.round(data.wizards.kd*1000)/1000, Math.round(ratio(TNTGames.kills_capture, TNTGames.deaths_capture)*1000)/1000), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)
            
            if (settings.verbose) {
                if (TNTGames.air_time_capture == undefined) {var airTimeDifference = 0} else {var airTimeDifference = TNTGames.air_time_capture - data.air}
                if (airTimeDifference > 0) {
                    var airTimeDisplay = min_sec(Math.floor(TNTGames.air_time_capture/1200)) + " (+" + min_sec(Math.floor(airTimeDifference/1200)) + ")"
                }
                else {
                    var airTimeDisplay = min_sec(Math.floor(TNTGames.air_time_capture/1200))
                }

                embed.addField(`**Airtime**`, airTimeDisplay, true)
                .addField(`**KADR**`, displayOldNewNumbers(Math.round(data.wizards.kad*1000)/1000, Math.round(ratio(replaceError(TNTGames.kills_capture)+replaceError(TNTGames.assists_capture), TNTGames.deaths_capture)*1000)/1000), true)
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
                await setWizKillsDB(TNTGames, user.player.uuid, m.author.id)
            }
            if (reset) {
                await setWizDB(TNTGames, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
        else if (game == "all") {
            if (TNTGames.record_tntrun == undefined) {var runRecordDifference = 0} else {var runRecordDifference = TNTGames.record_tntrun - data.run.record}
            if (runRecordDifference > 0) {
                var runRecordDisplay = min_sec(TNTGames.record_tntrun) + " (+" + min_sec(runRecordDifference) + ")"
            }
            else {
                var runRecordDisplay = min_sec(TNTGames.record_tntrun)
            }

            if (TNTGames.record_pvprun == undefined) {var pvpRecordDifference = 0} else {var pvpRecordDifference = TNTGames.record_pvprun - data.pvp.record}
            if (pvpRecordDifference > 0) {
                var pvpRecordDisplay = min_sec(TNTGames.record_pvprun) + " (+" + min_sec(pvpRecordDifference) + ")"
            } else {
                var pvpRecordDisplay = min_sec(TNTGames.record_pvprun)
            }

            const embed = new Discord.MessageEmbed()
                .setColor(`${rankData.color}`)
                .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
                .setTitle(`${rankData.displayName} ${user.player.displayname}'s TNT Games Stats`)
                .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
                .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
                .setTimestamp()
                .setFooter(embedFooter.text, embedFooter.image.green)
                .addField(`**Coins**`, displayOldNewNumbers(data.coins, replaceError(TNTGames.coins, 0)), true)
                .addField(`**TNT Wins**`, displayOldNewNumbers(data.w, replaceError(TNTGames.wins, 0)), true)
                .addField(`**Winstreak**`, displayOldNewNumbers(data.streak, replaceError(TNTGames.winstreak, 0)), true)
                .addField(`**Tag Wins**`, displayOldNewNumbers(data.tag.w, replaceError(TNTGames.wins_tntag, 0)), true)
                .addField(`**TNT Run Record**`, runRecordDisplay, true)
                .addField(`**TNT Run Wins**`, displayOldNewNumbers(data.run.w, replaceError(TNTGames.wins_tntrun, 0)), true)
                .addField(`**Bowspleef Wins**`, displayOldNewNumbers(data.bow.w, replaceError(TNTGames.wins_bowspleef, 0)), true)
                .addField(`**Wizards Wins**`, displayOldNewNumbers(data.wizards.w, replaceError(TNTGames.wins_capture, 0)), true)
                .addField(`**Wizards Kills**`, displayOldNewNumbers(data.wizards.k, replaceError(TNTGames.kills_capture, 0)), true)
                .addField(`**PVP Run Record**`, pvpRecordDisplay, true)
                .addField(`**PVP Run Wins**`, displayOldNewNumbers(data.pvp.w, replaceError(TNTGames.wins_pvprun, 0)), true)
                .addField(`**PVP Run Kills**`, displayOldNewNumbers(data.pvp.k, replaceError(TNTGames.kills_pvprun, 0)), true)
                .setDescription(`()s show changes since your last ${prefix}stats call for this user`)

            if (reset) {
                await setAllDB(TNTGames, user.player.uuid, m.author.id)
            }
            return m.channel.send(embed)
        }
    }
    else if (command == "kills") {
        let received = ""
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
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
                reset = false
            }
        }
        else if (args.length == 1) {
            username = args[0]
        }
        else {
            return sendErrorEmbed(m.channel,"Too many arguments",`Format: ${prefix}kills [username]`)
        }
        if (username.length > 20) {
            var user = await hypixelFetch(`player?uuid=${username}`)
            plotzesFetch("stats", `?user=${username}&discupdate=false`)
        }
        else {
            var user = await hypixelFetch(`player?name=${username}`)
            plotzesFetch("stats", `?user=${username}&discupdate=false`)
        }

        if(!user || !user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)

        const TNTGames = user.player.stats.TNTGames
        data = await db.get("cache."+m.author.id+"."+user.player.uuid)
        if (data == undefined) {
            await setCacheDB(TNTGames, user.player.uuid,m.author.id)
            data = await db.get("cache."+m.author.id+"."+user.player.uuid)
        }
        rankData = findRank(user)

        const embed = new Discord.MessageEmbed()
            .setColor(`${rankData.color}`)
            .setAuthor(`${m.author.tag}`, `https://cdn.discordapp.com/avatars/${m.author.id}/${m.author.avatar}?size=128`)
            .setTitle(`${rankData.displayName} ${user.player.displayname}'s Wizards Kills`)
            .setURL(`https://plancke.io/hypixel/player/stats/${user.player.displayname}`)
            .setThumbnail(`https://visage.surgeplay.com/head/128/{user.player.uuid}`)
            // .setImage(`https://visage.surgeplay.com/frontfull/512/${user.player.uuid}`)
            .setTimestamp()
            .setFooter(embedFooter.text, embedFooter.image.green)
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
            setWizKillsDB(TNTGames, user.player.uuid, m.author.id)
        }
        return m.channel.send(embed)
    }
    else if (command.toLowerCase() == "settings") {
        if (args.length != 2) {
            return sendErrorEmbed(m.channel, `Usage Error`,`Usage: ${prefix}settings [verbose/reset/game] [true/false]`)
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
        if (args[0] == "reset") {
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
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        idData = JSON.parse(received)

        if (m.author.id in idData) {
            var user = await hypixelFetch(`player?uuid=${idData[m.author.id]}`)
        }

        if(!user || !user.success || user.success == false || user.player == null || user.player == undefined || !user.player || user.player.stats == undefined) return sendErrorEmbed(m.channel, `Unknown Player`, `Player has no data in Hypixel's Database`);
        if(user.player.stats.TNTGames == undefined) return sendErrorEmbed(m.channel,`Unknown Player`,`Player has no Data in Hypixel's TNT Database`)

        await setCacheDB(user.player.stats.TNTGames, user.player.uuid, m.author.id)
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
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
        let idData = JSON.parse(received)

        if (args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '') in idData) {
            m.channel.send("https://namemc.com/profile/" + idData[args[0].replace('<', '').replace('>', '').replace('@', '').replace('!', '')])
        }
        else {
            m.channel.send("No account registered to this ID")
        }
        return;
    }
    else if (command.toLowerCase() == "account") {
        if (args.length != 1) { return m.channel.send("Incorrect amount of arguments")}
        if (!args[0].includes('@')) { return m.channel.send("First Arg must be a ping") }
        try {received = await fs.readFileSync('IDS.json')} catch{ console.log("Failure! File Invalid"); console.log("Terminating Program - Code 005"); process.exit(); }
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

        return m.channel.send(`__**Bot Development & Bot Server (also TNT Wizards Discord)**__
https://discord.gg/Mappy28gZD`)

    }
})

client.login(config.TNTStatsBotToken);