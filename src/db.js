const path = require("path"),
	  fs = require("fs");

const knex = require("knex")({
	client: "sqlite3",
	connection: {
		filename: path.resolve(__dirname, "../database.sql")
	}
});

const createTable = () =>
	knex.schema.hasTable("verified_users").then(function(exists) {
		if (!exists) {
			return knex.schema.createTable("verified_users", table => {
				table.string("uuid").primary();
				table.string("discord").notNullable();
			});
		}
	});

const add = obj => knex("verified_users").insert(obj);
const all = () => knex("verified_users");
const update = (query, newvalue) => knex("verified_users").where(query).update(newvalue);
const select = query => knex("verified_users").where(query);
const reset = async () => {
	console.warn("[NOTICE] Resetting database...");
	fs.unlinkSync(path.resolve(__dirname, "../database.sql"));
	await createTable();
};

const setData = async (uuid, discord) => {
	const updated = await update({uuid}, {discord});
	if (updated === 0) {
		return await add({uuid, discord});
	} else return updated;
};

module.exports = {
	createTable,
	add,
	all,
	update,
	select,
	setData,
	reset
};