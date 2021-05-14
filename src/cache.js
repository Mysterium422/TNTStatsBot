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

module.exports = {cacheUserStats, getUserStats, cacheTimedStats, getTimedStats};
