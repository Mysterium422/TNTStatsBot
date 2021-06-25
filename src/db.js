// @ts-check
"use strict";

const path = require("path"),
	fs = require("fs"),
	{getDefaultSettings, isDefault} = require("./settings.js");

/**
 * @type {import("knex").Knex}
 */
// @ts-ignore
const knex = require("knex")({
	client: "sqlite3",
	connection: {
		filename: path.resolve(__dirname, "../db.sqlite3")
	},
	useNullAsDefault: true
});

const TABLES = {
	VerifiedUsers: "verified_users",
	ConfiguredChannels: "configured_channels",
	UserCache: "user_cache",
	TimedCache: "timed_cache",
	UserSettings: "user_settings"
};

const createTables = () => {
	knex.schema.hasTable(TABLES.VerifiedUsers).then(exists => {
		if (!exists) {
			return knex.schema.createTable(TABLES.VerifiedUsers, table => {
				table.string("uuid").primary();
				table.string("discord").notNullable();
			});
		}
	});

	knex.schema.hasTable(TABLES.ConfiguredChannels).then(exists => {
		if (!exists) {
			return knex.schema.createTable(TABLES.ConfiguredChannels, table => {
				table.string("channel").notNullable();
				table.string("prefix").notNullable();
				table.string("game").notNullable();
			});
		}
	});

	knex.schema.hasTable(TABLES.UserCache).then(exists => {
		if (!exists) {
			return knex.schema.createTable(TABLES.UserCache, table => {
				table.string("discord").notNullable();
				table.string("uuid").notNullable();
				table.jsonb("data").notNullable();
			});
		}
	});

	knex.schema.hasTable(TABLES.TimedCache).then(exists => {
		if (!exists) {
			return knex.schema.createTable(TABLES.TimedCache, table => {
				table.string("uuid").notNullable();
				table.boolean("isWeekly").notNullable();
				table.jsonb("data").notNullable();
			});
		}
	});

	knex.schema.hasTable(TABLES.UserSettings).then(exists => {
		if (!exists) {
			return knex.schema.createTable(TABLES.UserSettings, table => {
				table.string("discord").primary();
				table.jsonb("data").notNullable();
			});
		}
	});
};

const reset = async () => {
	console.warn("[NOTICE] Resetting database...");
	// Delete the database file if it exists
	if (fs.existsSync(path.resolve(__dirname, "../db.sqlite3"))) {
		fs.unlinkSync(path.resolve(__dirname, "../db.sqlite3"));
	}
};

/**
 * @typedef {Object} VerifiedUserRow
 * @property {string} uuid Minecraft UUID
 * @property {string} discord Discord account ID
 */

/**
 * @typedef {Object} ConfiguredChannelRow
 * @property {String} guild Guild ID
 * @property {String} channel Channel ID
 * @property {String} prefix Bot prefix
 * @property {String} game Default game
 */

/**
 * @typedef {Object} UserCacheRow
 * @property {String} discord Discord account ID
 * @property {String} uuid Minecraft UUID
 * @property {String} data Statistics
 */

/**
 * @typedef {Object} TimedCacheRow
 * @property {Number} isWeekly Is the row weekly or monthly data?
 * @property {String} uuid Minecraft UUID
 * @property {String} data Statistics
 */

/**
 * @typedef {Object} UserSettingsRow
 * @property {String} discord Discord ID
 * @property {String} data Statistics
 */

/**
 * Get all rows in a table
 * @param {String} table Table to select from
 * @returns {Promise<Object[]>} All rows
 */
const all = table => knex(table);

/**
 * Add a row to a table
 * @param {String} table Table to add to
 * @param {Object} row Row to insert
 * @returns {Promise<number[]>}
 */
const add = (table, row) => knex(table).insert(row);

/**
 * Update a row with new values
 * @param {String} table Table to update in
 * @param {Object} query Query to find the row
 * @param {Object} newvalue New values for the row
 * @returns {Promise<number>} Number of rows updated
 */
const update = (table, query, newvalue) => knex(table).where(query).update(newvalue);

/**
 * Fetch all rows which match a query
 * @param {String} table Table to search
 * @param {Object} query Query to find the rows
 * @returns {Promise<Object[]>} Rows which match the query
 */
const where = (table, query) => knex(table).where(query);

/**
 * Select columns from rows which match a query
 * @param {String} table Table to select from
 * @param {String[]} columns Columns to select
 * @param {Object} query Query to find the rows
 * @returns {Promise<Object[]>} Columns of rows which match the query
 */
const select = (table, columns, query) => knex(table).select(...columns).where(query);

/**
 * Delete rows by a query
 * @param {String} table Table to delete from
 * @param {Object} query Query to find the rows
 * @returns {Promise<void>}
 */
const del = (table, query) => knex(table).where(query).del();

/**
 * Link a Minecraft UUID to a Discord account
 * @param {String} uuid Minecraft UUID
 * @param {String} discord Discord ID
 */
const linkUUID = async (uuid, discord) => {
	const updated = await update(TABLES.VerifiedUsers, {discord}, {uuid});
	if (updated === 0) await add(TABLES.VerifiedUsers, {discord, uuid});
};

/**
 * Configure a Discord channel
 * @param {import("discord.js").TextChannel} channel Channel to link
 * @param {String} prefix Channel prefix
 * @param {String} game Default game
 */
const configureChannel = async (channel, prefix, game) => {
	const newValues = {prefix, game};

	const updated = await update(TABLES.ConfiguredChannels, {channel: channel.id}, newValues);
	if (updated === 0) {
		return add(TABLES.ConfiguredChannels, {channel: channel.id, ...newValues});
	}
};

/**
 * Change a Discord user's bot setting
 * @param {import("discord.js").User} user User
 * @param {String} setting Setting to change
 * @param {*} value New value
 */
const setUserSetting = async (user, setting, value) => {
	/** @type {UserSettingsRow[]} */
	const result = await where(TABLES.UserSettings, {discord: user.id});

	const newObj = result.length === 0 ? getDefaultSettings() : JSON.parse(result[0].data);
	newObj[setting] = value;
	if (isDefault(newObj)) {
		await del(TABLES.UserSettings, {discord: user.id});
	} else {
		const data = JSON.stringify(newObj);
		const updated = await update(TABLES.UserSettings, {discord: user.id}, {data});
		if (updated === 0) await add(TABLES.UserSettings, {discord: user.id, data});
	}
};

/**
 * Get the configuration of a channel
 * @param {import("discord.js").Message} message Message
 * @returns {Promise<ConfiguredChannelRow | null>} Channel configuration, or `null` if the channel is not configured
 */
const getChannelInfo = async message => {
	const result = await where(TABLES.ConfiguredChannels, {channel: message.channel.id});
	if (result.length === 0) return null;
	else return result[0];
};

/**
 * Get the bot settings of a user.
 * @param {import("discord.js").User} user User
 * @returns {Promise<import("./settings").UserSettings>} The user's settings
 */
const getUserSettings = async user => {
	const result = await where(TABLES.UserSettings, {discord: user.id});
	const res = result.length === 0 ? {} : JSON.parse(result[0].data);
	return Object.assign(getDefaultSettings(), res);
};

module.exports = {
	add, all, update, where, del, reset, select,
	TABLES,
	linkUUID,
	configureChannel,
	getChannelInfo,
	createTables,
	getUserSettings,
	setUserSetting,
	knex
};
