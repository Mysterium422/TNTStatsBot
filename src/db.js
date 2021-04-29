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
	knex.schema.hasTable(TABLES.VerifiedUsers).then(exists => {
		if (!exists) {
			return knex.schema.createTable(TABLES.VerifiedUsers, table => {
				table.string("uuid").primary();
				table.string("discord").notNullable();
				table.boolean("alt").notNullable();
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

const setMain = async (uuid, discord) => {
	const existing = await select(TABLES.VerifiedUsers, {discord}),
		  mains = existing.filter(row => !row.alt);

	if (mains.length === 0 || existing.length === 0) {
		return add(TABLES.VerifiedUsers, {uuid, discord, alt: false});
	} else if (mains.length === 1) {
		return update(TABLES.VerifiedUsers, mains[0], {uuid});
	} else {
		// TODO: Yikes! Multiple main accounts somehow
		console.error("Multiple main accounts!");
		process.exit(0);
	}
};

const addAlt = (uuid, discord) =>
	update(TABLES.VerifiedUsers, {uuid}, {discord, alt: true});

const linkChannelPreifx = async (channel, prefix, game) => {
	const selector = {guild: channel.guild.id, channel: channel.id},
		newValues = {prefix, game};

	const updated = await update(TABLES.ConfiguredChannels, selector, newValues);
	if (updated === 0) {
		return add(TABLES.ConfiguredChannels, {...selector, ...newValues});
	} else return updated;
};

module.exports = {
	add,
	all,
	update,
	select,
	del,
	reset,
	TABLES,
	setMain, addAlt,
	linkChannelPreifx,
	createVerifiedTable,
	createChannelTable
};
