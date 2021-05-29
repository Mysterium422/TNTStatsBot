// @ts-check
"use strict";

module.exports = {
unlinked:
`You need to link you Discord account to your profile on Hypixel!
To do so, please follow this guide:
<https://hypixel.net/threads/guide-how-to-link-discord-account.3315476/>

**Once you have linked your account**, come back here and re-run the command.`,

unverified: prefix =>
`You need to link your Discord account to your Minecraft account!
To do so, run the command: \`${prefix}set [your username]\`
**Once you have linked your account**, come back here and re-run the command.

*Alternatively, you can specify your username after the command*`,

uuid_invalid:
`The provided UUID was invalid`,

playername_invalid:
`The provided playername was invalid`,

bad_link:
`The mentioned user has an invalid Minecraft account linked`,

discordLinks:
`**Discord Links**
**TNT Games** - <https://discord.gg/5gTM5UZdQb>
**TNT Wizards** - <https://discord.gg/95T6ZHa>
**TNT Run** - <https://discord.gg/W9xBSjt>
**TNT Tag** - <https://discord.gg/FsneyHHRRt>
**PVP Run** - <https://discord.gg/DRX8Jkt>
**Bow Spleef** - <https://discord.gg/sE4uNVs6MF>

**Mysterium's Server** - <https://discord.gg/7Qb5xuJD4C>`,

help: {

home: `**React to view a specific page**

:house: : **Home**
:tools: : **Configuration**
:bar_chart: : **Statistics Commands**
:gear: : **User Settings**
:information_source: : **Other Commands**`,

stats: prefix =>
`**\`${prefix}kills [user]\`** - TNT Wizards kills by class
**\`${prefix}stats [user] [help]\`** - Shows TNT games stats

Possible Games:
\`all\` - Overall TNT Games Stats
\`run\` - TNT Run Stats
\`tag\` - TNT Tag Stats
\`bowspleef\` - Bowspleef Stats
\`wizards\` - TNT Wizards Stats
\`pvp\` - PVP Run Stats

*Brackets show changes since your last stats call for that user*
*\`[game]\` defaults to the channel-configured game if not specified*
*\`[user]\` defaults to your linked account if not specified*

**\`${prefix}reset [user]\`** - Reset your brackets for \`[user]\` (defaults to yourself)
*Only useful if you have the **auto reset** setting disabled*

**\`${prefix}account [mention]\`** - Shows the linked account of the mentioned user (defaults to yourself)
**\`${prefix}set [username]\`** - Links your Discord account to your Minecraft account
Linking your account prevents you from having to specify your username when using stats commands`,

info: prefix =>
`**\`${prefix}help\`** - Opens this menu
**\`${prefix}info\`** - Shows bot info
**\`${prefix}invite\`** - Bot invite link
**\`${prefix}source\`** - Link to bot source code
**\`${prefix}discord\`** - Links of TNT Game Discord servers
**\`${prefix}author\`** - Read more about the bot creators
**\`${prefix}bugs\`** - Server invite link for reporting bugs
**\`${prefix}ping\`** - Check bot connection`,

config: bot =>
`To configure the bot in a specific channel, mention the bot and specify the default game & prefix for that channel.

For example, saying:
**${bot} wizards /**

Configures the bot to listen to the prefix \`/\`,
and sets ***TNT Wizards*** as the default game for commands.`,

settings: prefix =>
`**Verbose ** *(True/__False__)*
    Show more statistics in \`${prefix}stats\`

**Auto Reset** *(__True__/False)*
    Automatically reset brackets for \`${prefix}stats\`
    Disable to make brackets stay until you do \`${prefix}reset\`

*Default values are __underlined__*`
},

invite: prefix =>
`See \`${prefix}help configuration\` for help with setting up the bot:
https://discord.com/oauth2/authorize?client_id=735055542178938960&scope=bot&permissions=2147994688`,

settings: {
unknown: setting =>
`Unknown setting '\`${setting}\`'`,

invalid: (prefix, setting, value) =>
`Setting \`${setting}\` cannot be set to '\`${value}\`'
See \`${prefix}help settings\` for acceptable values`,

updated: (setting, value) =>
`Updated setting \`${setting}\` to '\`${value}\`'`,

value: (setting, value) =>
`Setting \`${setting}\` currently has the value '\`${value}\`'`,

unspecified: prefix =>
`You haven't specified the setting name!
Syntax: **\`${prefix}setting [setting name] [new value]\`**`

},

source:
"Contribute here: https://github.com/LebsterFace/TNTStatsBot",

invalid_game_type:
"Expected one of: `all`, `wizards`, `run`, `pvp`, `tag`, `bowspleef`",

reportbugs:
"Report any bugs here: https://discord.gg/7Qb5xuJD4C",

update:
`**Latest Update: v5.0.0**
- Everything rewritten by Lebster
- Full changelog soon!`,

mysterium:
`This bot was originally created by Mysterium_
**Mysterium's Website (WIP)**: <https://mysterium.me>

Later, Lebster joined the project and rewrote the entire bot!
**Lebster's Website**: <https://lebster.xyz>

Please report any bugs here: https://discord.gg/7Qb5xuJD4C`
};
