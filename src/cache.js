// @ts-check
"use strict";

const db = require("./db"),
	{HypixelStats, fromJSON} = require("./stats-utils");

/**
* Cache a user's viewing of a UUID's stats
* @param {string} discord Discord ID
* @param {string} uuid Minecraft UUID
* @param {HypixelStats} data Stats to cache
*/
const cacheUserStats = async (discord, uuid, data) => {
	const updated = await db.update(db.TABLES.UserCache, {discord, uuid}, {data: JSON.stringify(data)});
	if (updated === 0) await db.add(db.TABLES.UserCache, {discord, uuid, data: JSON.stringify(data)});
};

/**
* Get a Discord User's cache of a UUID's statistics
* @param {String} discord Discord ID
* @param {String} uuid Minecraft UUID
* @returns {Promise<HypixelStats | null>} UUID's cached statistics, or `null` if no cache was found
*/
const getUserStats = async (discord, uuid) => {
	const result = await db.where(db.TABLES.UserCache, {discord, uuid});
	if (result.length === 0) return null;
	else return fromJSON(JSON.parse(result[0].data));
};

/**
 * Cache timed user stats
 * @param {String} uuid Minecraft UUID
 * @param {Boolean} isWeekly Are the stats weekly?
 * @param {HypixelStats} data Stats to cache
 */
const cacheTimedStats = async (uuid, isWeekly, data) => {
	const updated = await db.update(db.TABLES.TimedCache, {uuid, isWeekly}, {data: JSON.stringify(data)});
	if (updated === 0) await db.add(db.TABLES.TimedCache, {uuid, isWeekly, data: JSON.stringify(data)});
};

/**
* Cache new stats & get the previously cached timed stats
* @param {string} uuid UUID to which the stats belong
* @param {boolean} isWeekly Are the new stats weekly (true) or monthly (false)?
* @param {HypixelStats} stats New stats to cache
* @returns {Promise<HypixelStats>} Last cached stats
*/
const useTimedStats = async (uuid, isWeekly, stats) => {
	const result = await db.where(db.TABLES.TimedCache, {uuid});
	const mainIndex = result.findIndex(row => (row.isWeekly === 1 && isWeekly) || (row.isWeekly === 0 && !isWeekly));
	await cacheTimedStats(uuid, isWeekly, stats);
	return mainIndex === -1 ? stats : fromJSON(JSON.parse(result[mainIndex].data));
};

/**
 * Store a UUID's timed stats if they do not exist
 * @param {String} uuid Minecraft UUID
 * @param {HypixelStats} stats Stats to cache
 */
const confirmTimedStats = async (uuid, stats) => {
	/** @type {import("./db").TimedCacheRow[]} */
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

module.exports = {
	cacheUserStats,
	getUserStats,
	cacheTimedStats,
	confirmTimedStats,
	useTimedStats
};
