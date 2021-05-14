const path = require("path"),
	fs = require("fs");

const knex = require("knex")({
	client: "sqlite3",
	connection: {
		filename: path.resolve(__dirname, "../database.sql")
	},
	useNullAsDefault: true
});

const TABLES = {
	VerifiedUsers: "verified_users",
	ConfiguredChannels: "configured_channels",
	UserCache: "user_cache",
	TimedCache: "timed_cache"
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
				table.string("guild").notNullable();
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
};

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
	const existing = await select(TABLES.VerifiedUsers, {discord});
	if (existing.length === 0) {
		return add(TABLES.VerifiedUsers, {uuid, discord});
	} else {
		return update(TABLES.VerifiedUsers, {discord}, {uuid});
	}
};

const linkChannelPrefix = async (channel, prefix, game) => {
	const selector = {guild: channel.guild.id, channel: channel.id},
		newValues = {prefix, game};

	const updated = await update(TABLES.ConfiguredChannels, selector, newValues);
	if (updated === 0) {
		return add(TABLES.ConfiguredChannels, {...selector, ...newValues});
	} else return updated;
};

const getChannelInfo = async message => {
	const result = await select(TABLES.ConfiguredChannels, {
		guild: message.guild.id,
		channel: message.channel.id
	});

	if (result.length === 0) return null;
	return result[0];
};

module.exports = {
	add, all, update, select, del, reset,
	TABLES, linkUUID, linkChannelPrefix,
	getChannelInfo, createTables
};
