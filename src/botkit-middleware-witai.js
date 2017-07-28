var Wit = require('node-wit').Wit;

// not used at the moment
var actions = {
	say: function (sessionId, context, message, cb) {
		console.log(message);
		cb();
	},
	merge: function (sessionId, context, entities, message, cb) {
		cb(context);
	},
	error: function (sessionId, context, error) {
		console.log(error.message);
	}
};

module.exports = function (config) {

	if (!config || !config.token) {
		throw new Error('No wit.ai API token specified');
	}

	if (!config.minimum_confidence) {
		config.minimum_confidence = 0.5;
	}

	var client = new Wit(config.token, actions);

	var middleware = {};

	middleware.receive = function (bot, message, next) {
		// Only parse messages of type text and mention the bot.
		// Otherwise it would send every single message to wit (probably don't want that).
		//EDIT: parse messages with text that are not posted by this bot or any other bot
		//if (message.text && message.text.indexOf(bot.identity.id) > -1 
		if (message.text && (message.user != bot.identity.id && !message.bot_id)) {
			/*console.log("---Not ignored: " + message.text);
			if (message) {
				console.log(message);
				console.log(message.text.indexOf(bot.identity.id));
			}*/
			//console.log(message.text.length);
			//truncate messages that are too long
			if (message.text.length > 256) {
				message.text = message.text.substring(0, 256);
			}
			client.message(message.text, function (error, data) {
				if (error) {
					console.log(error);
					next(error);
				} else {
					message.entities = data.entities;
					next();
				}
			});
		} else {
			/*if (message.text) {
				console.log("----ignorned: " + message.text);
				console.log(message);
			}
			next();*/
		}
	};

	middleware.hears = function (tests, message) {
		if (message.entities && message.entities.intent) {
			/*console.log("-----middleware.hears-------");
			console.log(message);*/
			for (var i = 0; i < message.entities.intent.length; i++) {
				for (var t = 0; t < tests.length; t++) {
					if (message.entities.intent[i].value == tests[t] &&
						message.entities.intent[i].confidence >= config.minimum_confidence) {
						return true;
					}
				}
			}
		}

		return false;
	};

	return middleware;
};
