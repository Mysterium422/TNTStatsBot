// SETUP CONFIG
const config = require("../config.json");
const key = config.hypixelToken;
const nodeFetch = require("node-fetch");

// TODO: Caching with keyv (npm install keyv)
module.exports = {
	hypixelFetch: async function(query) {
		console.log("FETCHING :: ", `https://api.hypixel.net/${query}&key=${key}`);
		try {
			return await nodeFetch(`https://api.hypixel.net/${query}&key=${key}`).then(res => res.json());
		} catch (e) {
			return "API ERROR";
		}
	},
	mojangUUIDFetch: async function(query) {
		return await nodeFetch(`https://api.mojang.com/users/profiles/minecraft/${query}`)
			.then(response => response.status === 204 ? null : response.json());
	}
};
