const db = require("./db");
const saveStats = async (discord, uuid, data) => {
    const updated = await db.update(db.TABLES.UserCache, {discord, uuid}, {data: JSON.stringify(data)});
    if (updated === 0) {
        return db.add(db.TABLES.UserCache, {discord, uuid, data: JSON.stringify(data)});
    } else return updated;
};

const getCache = async (discord, uuid) => {
    const result = await db.select(db.TABLES.UserCache, {discord, uuid});
    if (result.length === 0) return null;
    else return JSON.parse(result[0].data);
};

module.exports = {saveStats, getCache};