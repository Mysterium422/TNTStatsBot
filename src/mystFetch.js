let mojangQueries = 0;
function newMojangQuery() {
    mojangQueries = mojangQueries+1;
    setTimeout(function () {
        mojangQueries = mojangQueries - 1;
    }, 10 * 60 * 1000);
}

const yaml = require("js-yaml"),
	path = require("path"),
      fs = require("fs");
// SETUP CONFIG
const yamlConfig = yaml.loadAll(fs.readFileSync(path.resolve(__dirname, "../config.yaml"), "utf8"));
const config = yamlConfig[0];
const key = config.hypixelToken;

module.exports = {
	hypixelFetch: async function(query) {
		console.log(`https://api.hypixel.net/${query}&key=${key}`);

		let variable;
		try {
			variable = await nodeFetch(`https://api.hypixel.net/${query}&key=${key}`).then(res => res.json());
		} catch (e) {
			variable = "API ERROR";
		}

		return variable;
	},
	mojangUUIDFetch: async function(query) {
		if (mojangQueries > 599) {
			return {name: query, id: query};
		} else {
			newMojangQuery();
			return await nodeFetch(`https://api.mojang.com/users/profiles/minecraft/${query}`).then(res => res.json());
		}
	}
};