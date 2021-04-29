const path = require("path"),
	  fs = require("fs");

const knex = require("knex")({
	client: "sqlite3",
	connection: {
		filename: path.resolve(__dirname, "../database.sql")
	}
});

const TABLES = {
	VerifiedUsers: "verified_users",
	ConfiguredChannels: "configured_channels"
};

const createVerifiedTable = () =>
	knex.schema.hasTable(TABLES.VerifiedUsers).then((exists) => {
		if (!exists) {
			return knex.schema.createTable(TABLES.VerifiedUsers, table => {
				table.string("uuid").primary();
				table.string("discord").notNullable();
				table.json("cache").defaultTo(null);
			});
		}
	});

const createChannelTable = () =>
	knex.schema.hasTable("configured_channels").then(exists => {
		if (!exists) {
			return knex.schema.createTable("configured_channels", table => {
				table.string("guild").notNullable();
				table.string("channel").notNullable();
				table.string("prefix").notNullable();
				table.string("game").notNullable();
			});
		}
	});

const reset = async () => {
	console.warn("[NOTICE] Resetting database...");
	// Delete the database file if it exists
	if (fs.existsSync(path.resolve(__dirname, "../database.sql"))) {
		fs.unlinkSync(path.resolve(__dirname, "../database.sql"));
	}
};

const all = database => knex(database);
const add = (database, row) => knex(database).insert(row);
const update = (database, query, newvalue) => knex(database).where(query).update(newvalue);
const select = (database, query) => knex(database).where(query);
const del = (database, query) => knex(database).where(query).del();

const linkUUID = async (uuid, discord) => {
	const updated = await update(TABLES.VerifiedUsers, {uuid}, {discord});
	if (updated === 0) {
		return await add(TABLES.VerifiedUsers, {uuid, discord});
	} else return updated;
};

const linkChannelPreifx = async (channel, prefix, game) => {
	const selector = {guild: channel.guild.id, channel: channel.id},
		  newValues = {prefix, game};

	const updated = await update(TABLES.ConfiguredChannels, selector, newValues);
	if (updated === 0) {
		return await add(TABLES.ConfiguredChannels, {...selector, ...newValues});
	} else return updated;
};

module.exports = {
	add, all, update, select, del, reset, // General
	TABLES, // enum
	linkUUID, linkChannelPreifx, // Helpers
	createVerifiedTable, createChannelTable // Create tables
};