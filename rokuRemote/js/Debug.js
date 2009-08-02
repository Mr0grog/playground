var Debug = {
	logMessages: false,  // set to true to log messages
	logToConsole: true,  // set to true to log with console.log if it exists
	logToAIR: true,      // set to true to log with air.trace if it exists
	
	log: function(message) {
		if (this.logToConsole && window.console && console.log) {
			console.log(message);
		}
		
		if (this.logToAIR && window.air) {
			if (air.Introspector && air.Introspector.Console) {
				air.Introspector.Console.log(message);
			} else {
				air.trace(message);
			}
		}
	}
};