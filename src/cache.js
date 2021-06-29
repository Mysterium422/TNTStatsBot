// @ts-check
"use strict";

const db = require("./db"),
	{HypixelStats, fromJSON, fetchStats} = require("./stats-utils");

/**
* Cache a user's viewing of a UUID's stats
* @param {String} discord Discord ID
* @param {String} uuid Minecraft UUID
* @param {HypixelStats} data Stats to cache
* @param {String} game Game to cache
*/
const cacheUserStats = async (discord, uuid, data, game = null) => {
	data.unsetRatios();
	const existing = await db.select(db.TABLES.UserCache, ["data"], {discord, uuid});
	if (existing.length === 0) {
		return db.add(db.TABLES.UserCache, {discord, uuid, data: JSON.stringify(data)});
	}
	
	if (game === null) {
		return db.update(db.TABLES.UserCache, {discord, uuid}, {data: JSON.stringify(data)});
	} else {
		const newData = fromJSON(JSON.parse(existing[0].data)).unsetRatios();
		newData.stats[game] = data.stats[game];
		return db.update(db.TABLES.UserCache, {discord, uuid}, {data: JSON.stringify(newData)});
	}
};

/**
* Get a Discord User's cache of a UUID's statistics
* @param {String} discord Discord ID
* @param {String} uuid Minecraft UUID
* @returns {Promise<HypixelStats|null>} UUID's cached statistics, or `null` if no cache was found
*/
const getUserStats = async (discord, uuid) => {
	const result = await db.where(db.TABLES.UserCache, {discord, uuid});
	if (result.length === 0) return null;
	else return fromJSON(JSON.parse(result[0].data));
};

/**
 * Get the timed stats of a UUID
 * @param {String} uuid Minecraft UUID
 * @param {Boolean} isWeekly Are the stats weekly?
* @returns {Promise<HypixelStats|null>} UUID's timed statistics, or `null` if no cache was found
 */
const getTimedStats = async (uuid, isWeekly) => {
	const result = await db.where(db.TABLES.TimedCache, {uuid, isWeekly});
	if (result.length === 0) return null;
	else return fromJSON(JSON.parse(result[0].data));
};

/**
 * Store a UUID's timed stats if they do not exist
 * @param {String} uuid Minecraft UUID
 * @param {HypixelStats} stats Stats to cache
 */
const confirmTimedStats = async (uuid, stats) => {
	stats.unsetRatios();
	/** @type {db.TimedCacheRow[]} */
	const rows = await db.where(db.TABLES.TimedCache, {uuid});
	if (rows.length === 2) return;

	const data = JSON.stringify(stats);
	if (rows.length === 1) {
		const missingRow = rows[0].isWeekly !== 1;
		await db.add(db.TABLES.TimedCache, {uuid, isWeekly: missingRow, data});
	} else if (rows.length === 0) {
		await db.add(db.TABLES.TimedCache, {uuid, isWeekly: false, data});
		await db.add(db.TABLES.TimedCache, {uuid, isWeekly: true, data});
	}
};

/**
 * Update the caches of every user in the TimedStats table
 * @param {Boolean} isWeekly Weekly or Monthly?
 * @param {Number} limit Maximum promises to run at once
 * @returns {Promise<void[]>} Success
 */
const updateAllCaches = async (isWeekly, limit) => {
	const promises = await db.select(db.TABLES.TimedCache, ["uuid"], {isWeekly})
		.then(rows => rows.map(({uuid}) => fetchStats(uuid).then(response =>
			response.success ? db.add(db.TABLES.TimedCache, {
				isWeekly, uuid,
				data: JSON.stringify(new HypixelStats(response.user.player))
			}) : null
		)));

	await db.del(db.TABLES.TimedCache, {isWeekly});

	const worker = async () => {
		for (const [_, promise] of promises.entries()) {
			await promise;
		}
	};

	return Promise.all(Array.from({length: Math.min(promises.length, limit)}, worker));
};

module.exports = {
	cacheUserStats,
	getUserStats,
	getTimedStats,
	confirmTimedStats,
	updateAllCaches
};
