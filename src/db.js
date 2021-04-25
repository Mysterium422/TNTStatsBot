const path = require("path");
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
				table.increments("internal_id");
				table.string("uuid_mc");
				table.string("discord_id");
			});
		}
	});

const add = obj => knex("verified_users").insert(obj);
const all = () => knex("verified_users");
const update = (query, newvalue) => knex("verified_users").where(query).update(newvalue);
const select = query => knex("verified_users").where(query);

module.exports = {
	createTable,
	add,
	all,
	update,
	select
};