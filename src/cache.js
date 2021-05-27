// @ts-check
"use strict";

const db = require("./db");

const cacheUserStats = async (discord, uuid, data) => {
	const updated = await db.update(db.TABLES.UserCache, {discord, uuid}, {data: JSON.stringify(data)});
	if (updated === 0) {
		return db.add(db.TABLES.UserCache, {discord, uuid, data: JSON.stringify(data)});
	} else return updated;
};

const getUserStats = async (discord, uuid) => {
	const result = await db.select(db.TABLES.UserCache, {discord, uuid});
	if (result.length === 0) return null;
	else return JSON.parse(result[0].data);
};

const cacheTimedStats = async (uuid, isWeekly, data) => {
	const updated = await db.update(db.TABLES.TimedCache, {uuid, isWeekly}, {data: JSON.stringify(data)});
	if (updated === 0) {
		return db.add(db.TABLES.TimedCache, {uuid, isWeekly, data: JSON.stringify(data)});
	} else return updated;
};

const getTimedStats = async (uuid, isWeekly) => {
	const result = await db.select(db.TABLES.TimedCache, {uuid, isWeekly});
	if (result.length === 0) return null;
	else return JSON.parse(result[0].data);
};

// Take in stats, return the previous cached stats for isWeekly
const setAndOrGet = async (uuid, isWeekly, stats) => {
	const result = await db.select(db.TABLES.TimedCache, {uuid});
	const mainIndex = result.findIndex(row => row.isWeekly === isWeekly - 0);

	if (mainIndex === -1 || result.length === 0) {
		await cacheTimedStats(uuid, isWeekly, stats);
	} else if (result.length === 1 || result.length === 0) {
		await cacheTimedStats(uuid, !isWeekly, stats);
	}

	if (mainIndex !== -1) return JSON.parse(result[mainIndex].data);
	else return stats;
};

module.exports = {
	cacheUserStats,
	getUserStats,
	cacheTimedStats,
	getTimedStats,
	setAndOrGet
};
