// @ts-check
"use strict";

const booleanPhrases = {
	false: false,
	true: true,
	f: false,
	t: true,
	y: true,
	no: false,
	n: false,
	yes: true,
	"1": true,
	"0": false
};

const SETTINGS = {
	reset: {
		type: "boolean",
		default: true
	},
	verbose: {
		type: "boolean",
		default: false
	}
};

/**
 * @typedef {Object} UserSettings A Discord user's bot settings
 * @property {Boolean} reset Should statistics cache be automatically reset?
 * @property {Boolean} verbose Should detailed statistics be shown?
 */

const SETTINGS_READABLE = {
	reset: "reset",
	"auto reset": "reset",
	auto_reset: "reset",
	"auto-reset": "reset",
	auto: "reset",

	verbose: "verbose",
	more: "verbose"
};

const getDefaultSettings = () => {
	const result = {};
	for (const setting in SETTINGS) result[setting] = SETTINGS[setting].default;
	return result;
};

module.exports = {SETTINGS, SETTINGS_READABLE, booleanPhrases, getDefaultSettings};
