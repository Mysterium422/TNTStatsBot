// @ts-check
"use strict";

const {getUserSettings, setUserSetting} = require("../db.js");
const {SETTINGS_READABLE, SETTINGS, booleanPhrases} = require("../settings.js");
const strings = require("../strings.js");
const {errorEmbed, successEmbed} = require("../util.js");

module.exports = {
	run: async ({message, args: [setting, value], channelInfo: {prefix}}) => {
		if (typeof setting === "undefined") {
			return message.channel.send(errorEmbed("Setting not specified", strings.settings.unspecified(prefix)));
		}

		if (!(setting in SETTINGS)) {
			return message.channel.send(errorEmbed("Unknown setting", strings.settings.unknown(setting)));
		}

		const settingName = SETTINGS_READABLE[setting];

		if (typeof value === "undefined") {
			const existingSettings = await getUserSettings(message.author);
			return message.channel.send(successEmbed(message.author, strings.settings.value(settingName, existingSettings[settingName])));
		}

		let settingValue = null;
		const settingObj = SETTINGS[settingName];
		if (settingObj.type === "boolean") {
			if (value in booleanPhrases) {
				settingValue = booleanPhrases[value];
			} else {
				return message.channel.send(errorEmbed("Invalid value", strings.settings.invalid(prefix, setting, value)));
			}
		}

		await setUserSetting(message.author, setting, settingValue);
		return message.channel.send(successEmbed(message.author, strings.settings.updated(setting, value)));
	},
	aliases: ["settings"],
	requiresConfiguredChannel: true
};
