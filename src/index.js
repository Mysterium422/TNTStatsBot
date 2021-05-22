// FIND PACKAGES
const Discord = require("discord.js"),
	fs = require("fs"),
	db = require("./db"),
	path = require("path");

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
			commands[fileName.slice(0, -3)] = obj; // Slice to remove `.js`
			obj.aliases.forEach(name => { commands[name] = obj; });
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

/**
 * @param {import("discord.js").Message} message 
 * @param {Error} err 
 */
 const errorLog = async (message, err) => {
    const invite = (await message.guild.fetchInvites()).first();
    const owner = await client.users.fetch(config.owner_id);
	owner.send([
        "Date: " + message.createdAt.toString(),
        "Command: " + message.content,
        "Link: " + message.url,
        "Guild: " + (typeof invite === 'undefined' ? "Private server" : invite.toString()),
        "Error: ```" + (err.message + "\n" + err.stack) + "```",
    ].join("\n"));
};

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
			return await commands[command].run({
				client, message, args,
				command, channelInfo: channel,
				multiArgs: messageContent.slice(command.length).trim()
			});
		} catch (error) {
			await errorLog(message, error);
			await message.channel.send("An internal error occoured, see the stacktrace below:\n```" + error.stack + "```"); // FIXME: Debug Only!!
			process.exit(1);
		}
	} else {
		return message.channel.send("Command does not exist!");
	}

	// if (message.content.toLowerCase() == "/tntremove") {
	// 	if (!message.member.hasPermission("ADMINISTRATOR") && message.author.id != config.owner_id) return;

	// 	await db.deconste(`chan_${message.channel.id}`);
	// 	return message.channel.send("I will no longer respond to messages in this channel");
	// }
});

client.login(config.token);
