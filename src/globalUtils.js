String.prototype.contains = function(substring) {
	return this.indexOf(substring) !== -1;
};

module.exports = {
	// Returns a random value between the max and min (both exclusive)
	randInt: function(max, min) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	},
	// Shuffles an array randomly
	shuffle: function(array) {
		var currentIndex = array.length,
			temporaryValue,
			randomIndex;

		while (0 !== currentIndex) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	},
	// Converts UNIX to a Readable String
	timeConverter: function(UNIX_timestamp) {
		var a = new Date(UNIX_timestamp);
		var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		var year = a.getFullYear();
		var month = months[a.getMonth()];
		var date = a.getDate();
		var hour = a.getHours();
		var min = a.getMinutes() < 10 ? "0" + a.getMinutes() : a.getMinutes();
		var sec = a.getSeconds() < 10 ? "0" + a.getSeconds() : a.getSeconds();
		var time = date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
		return time;
	},
	// Replaces undefined with default variable
	replaceError: function(a, defaultVar) {
		if (a == undefined) {
			return defaultVar;
		} else {
			return a;
		}
	},
	// Ratio calculation
	ratio: function(a, b) {
		a = replaceError(a, 0);
		b = replaceError(b, 0);

		if (b == 0) return a;
		else return a / b;
	},
	booleanPhrases: {
		false: false,
		true: true,
		f: false,
		t: true,
		y: true,
		no: false,
		n: false,
		yes: true,
		"1": true,
		"0": false
	},
	ownerID: "573340518130384896",
	ChatColor: {
		black: "#000000",
		dark_blue: "#0000AA",
		dark_green: "#00AA00",
		dark_aqua: "#00AAAA",
		dark_red: "#AA0000",
		dark_purple: "#AA00AA",
		gold: "#FFAA00",
		gray: "#AAAAAA",
		dark_gray: "#555555",
		blue: "#5555FF",
		green: "#55FF55",
		aqua: "#55FFFF",
		red: "#FF5555",
		light_purple: "#FF55FF",
		yellow: "#FFFF55",
		white: "#FFFFFF"
	},
	ChatCodes: {
		0: "black",
		1: "dark_blue",
		2: "dark_green",
		3: "dark_aqua",
		4: "dark_red",
		5: "dark_purple",
		6: "gold",
		7: "gray",
		8: "dark_gray",
		9: "blue",
		a: "green",
		b: "aqua",
		c: "red",
		d: "light_purple",
		e: "yellow",
		f: "white"
	}
};
