// @ts-check
"use strict";

const Discord = require("discord.js"),
	fs = require("fs"),
	db = require("./db"),
	cache = require("./cache"),
	cron = require("node-cron"),
	path = require("path");

const client = new Discord.Client();
const config = require("../config.json");

let isReady = false;
let mentionRegex = null;
const commands = {};

cron.schedule("30 9 * * 0", () => cache.updateAllCaches(true, 40), {
	timezone: "Etc/UTC"
});

cron.schedule("30 9 1 * *", () => cache.updateAllCaches(false, 40), {
	timezone: "Etc/UTC"
});

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
			obj.aliases.forEach(name => {
				commands[name] = obj;
			});
		});
		console.log("[SUCCESS] Commands loaded.");
	} catch (e) {
		console.error("[ERROR] Failed to load commands! Aborting...");
		throw e;
	}

	client.user.setActivity("TNT Games");
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
	const users = await Promise.all(config.developers.concat(config.owner_id).map(id => client.users.fetch(id)));
	const errorMessage = [
		"**====== [ BEGIN ERROR LOG ] ======**",
		"Date: " + message.createdAt.toString(),
		"Command: " + message.content,
		"Link: " + message.url,
		"Guild: " + (typeof invite === "undefined" ? "Private server" : invite.toString()),
		"Error: ```" + (err.message + "\n" + err.stack) + "```"
	].join("\n");

	users.forEach(user => user.send(errorMessage));
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
				client, message, args, command,
				channelInfo: channel,
				multiArgs: messageContent.slice(command.length).trim()
			});
		} catch (error) {
			if (config.notify_errors) await errorLog(message, error);
			await message.channel.send("An internal error occurred.");
			console.error(error);
		}
	}
});

client.login(config.token);
