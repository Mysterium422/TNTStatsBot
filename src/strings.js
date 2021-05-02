module.exports = {
// TODO: This is used wrongly in many places
unlinked:
`You need to link you Discord account to your profile on Hypixel!
To do so, please follow this guide:
<https://hypixel.net/threads/guide-how-to-link-discord-account.3315476/>

**Once you have linked your account**, come back here and re-run the command.`,

discordLinks:
`**Discord Links**
**TNT Games** - <https://discord.gg/5gTM5UZdQb>
**TNT Wizards** - <https://discord.gg/95T6ZHa>
**TNT Run** - <https://discord.gg/W9xBSjt>
**TNT Tag** - <https://discord.gg/FsneyHHRRt>
**PVP Run** - <https://discord.gg/DRX8Jkt>
**Bow Spleef** - <https://discord.gg/sE4uNVs6MF>

**My Server** - <https://discord.gg/7Qb5xuJD4C>`,

help_home: prefix =>
`:house:: Home
:bar_chart:: Stat Commands
:tools:: QoL Commands
:information_source:: Bot Information Commands
:track_next:: Latest Update Info

**${prefix}tntconfigure [game] [prefix]** - Configure the bot to *this* channel. Game options include All, Wizards, Bowspleef, TNT Tag, TNT Run, PVP Run.
**${prefix}tntremove** - Remove this channel from the bot's list of channels.
**${prefix}tnthelp** - Opens this menu`,

help_stats: prefix =>
`**${prefix}stats all [username]** - Shows overall TNT Games Stats
**${prefix}stats run [username]** - Shows TNT Run Stats
**${prefix}stats tag [username]** - Shows TNT Tag Stats
**${prefix}stats bowspleef [username]** - Shows Bowspleef Stats
**${prefix}stats wizards [username]** - Shows TNT Wizards Stats
**${prefix}stats pvp [username]** - Shows PVP Run Stats
**${prefix}kills [username]** - Shows TNT Wizards kills by class

*()s show changes since your last stats call for that user*
*Game defaults to your channel-configured game if not specified*
*Username defaults to your verified username if not specified*`,

help_qol: prefix =>
`**${prefix}account [User ping]** - Shows the account of the specified player if they are verified
**${prefix}set [username]** - Sets your username. Requires you to set your discord tag in Hypixel
**${prefix}settings [setting] [value]** - Configures the setting to the value specified
**${prefix}reset** - Updates your personal stats in the cache. Only useful if reset setting is false
**${prefix}ping** - Check bot connection

:gear:: Settings Info`,

help_info: prefix =>
`**${prefix}help** - Opens this menu
**${prefix}info** - Shows bot info
**${prefix}invite** - Pastes bot invite link
**${prefix}source** - Pastes bot source code link
**${prefix}discord** - Pastes the links of TNT Game discord servers
**${prefix}mysterium** - See more about the bot creator
**${prefix}bugs** - Pastes server invite link to report bugs`,

help_update:
`- Everything rewritten by Lebster
- Full changelog soon!`,

help_settings: 
`**Verbose** *(True/False)* - Show more stats
Default: __False__

**Reset** *(True/False)* - Do not update cache so brackets will stay until you do /reset. (Only works on your registered ign)
Default: __True__`,

invite:
`Use \`/TNTconfigure\` to set up the bot:
https://discord.com/oauth2/authorize?client_id=735055542178938960&scope=bot&permissions=2147994688`,

source:
"Contribute here: https://github.com/LebsterFace/TNTStatsBot",

invalid_game_type:
"Expected one of: `all`, `wizards`, `run`, `pvp`, `tag`, `bowspleef`",

reportbugs:
"Report any bugs here: https://discord.gg/7Qb5xuJD4C"
};