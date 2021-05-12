const db = require("./db");
const saveStats = async (discord, uuid, data) => {
    const updated = await db.update(db.TABLES.UserCache, {discord, uuid}, {data: JSON.stringify(data)});
    if (updated === 0) {
        return db.add(db.TABLES.UserCache, {discord, uuid, data: JSON.stringify(data)});
    } else return updated;
};

module.exports = {saveStats};