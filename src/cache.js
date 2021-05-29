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
	const result = await db.select(db.TABLES.UserCache, {discord, uuid});
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
 * Get cached timed user stats
 * @param {String} uuid Minecraft UUID
 * @param {Number} isWeekly Are the stats weekly? (1 = weekly, 0 = monthly)
 * @returns {Promise<HypixelStats | null>} Cached stats, or `null` if they have not been cached
 */
const getTimedStats = async (uuid, isWeekly) => {
	const result = await db.select(db.TABLES.TimedCache, {uuid, isWeekly});
	if (result.length === 0) return null;
	else return fromJSON(JSON.parse(result[0].data));
};

/**
* Cache new stats & get the previously cached timed stats
* @param {string} uuid UUID to which the stats belong
* @param {boolean} isWeekly Are the new stats weekly (true) or monthly (false)?
* @param {HypixelStats} stats New stats to cache
* @returns {Promise<HypixelStats>} Last cached stats
*/
const useTimedStats = async (uuid, isWeekly, stats) => {
	const result = await db.select(db.TABLES.TimedCache, {uuid});
	const mainIndex = result.findIndex(row => (row.isWeekly === 1 && isWeekly) || (row.isWeekly === 0 && !isWeekly));

	if (mainIndex === -1 || result.length === 0) {
		await cacheTimedStats(uuid, isWeekly, stats);
	} else if (result.length === 1 || result.length === 0) {
		await cacheTimedStats(uuid, !isWeekly, stats);
	}

	return fromJSON(mainIndex === -1 ? stats : JSON.parse(result[mainIndex].data));
};

module.exports = {
	cacheUserStats,
	getUserStats,
	cacheTimedStats,
	getTimedStats,
	useTimedStats
};
