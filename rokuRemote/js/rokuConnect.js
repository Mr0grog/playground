/* SB for SoundBridge */
var SB = {
	_pollingFrequency: 1000,
	_controlTerms: /TransactionInitiated|ListResultSize|ListResultEnd|TransactionComplete|OK/,
	
	_response: "",
	_lastResponse: "",
	_isReady: false,
	
	_commandListeners: {},
	
	
	initConnection: function(address) {
		Debug.log("initing connection");
		this.socket = new air.Socket(address, 5555);
		this.socket.endian = air.Endian.LITTLE_ENDIAN;
		this.socket.addEventListener(air.Event.CLOSE, this._closeHandler);
		this.socket.addEventListener(air.Event.CONNECT, this._connectHandler);
		this.socket.addEventListener(air.IOErrorEvent.IO_ERROR, this._ioErrorHandler);
		this.socket.addEventListener(air.SecurityErrorEvent.SECURITY_ERROR, this._securityErrorHandler);
		this.socket.addEventListener(air.ProgressEvent.SOCKET_DATA, this._socketDataHandler);
	},
	
	close: function() {
		if (this.socket && this.socket.connected) {
			this.socket.close();
			this._isReady = false;
		}
	},
	
	_write: function(str) {
		str += "\n";
		try {
			this.socket.writeUTFBytes(str);
		}
		catch(e) {
			Debug.log(e);
		}
	},
	
	_read: function() {
		if (/\r\n/.test(this._lastResponse)) {
			this._lastResponse = "";
		}
		
		var str = this.socket.readUTFBytes(this.socket.bytesAvailable);
		var fullResponse = this._lastResponse += str;
		
		if (/\r\n/.test(fullResponse)) {
			// we might get multiple lines at a time
			var lines = fullResponse.split("\r\n");
			for (var i = 0; i < lines.length; i++) {
				if (i == lines.length - 1 && lines[i] != "") {
					this._lastResponse = "" + lines[i];
					break;
				}
				this._completeResponse(lines[i]);
			}
		}
		
		this._response += str;
		return str;
	},
	
	_completeResponse: function(response) {
		// Debug.log("got " + response);
		var parts = response.match(/^(.*?): (.*)$/);
		if (parts && parts[1]) {
			// Debug.log("got " + parts[1] + ": " + parts[2]);
			this._handleCommand(parts[1], parts[2]);
		}
	},
	
	sendCommand: function(command, args, callback, type) {
		Debug.log("sending " + command + (callback ? " with callback" : ""));
		
		if (callback)
			this._addCommandListener(command, callback, type);
		
		this._write(command + ((" " + args) || ""));
		this.socket.flush();
	},
	
	_addCommandListener: function(command, callback, type) {
		if (!this._commandListeners[command])
			this._commandListeners[command] = [];
		
		this._commandListeners[command].push(callback);
		this._commandListeners[command].type = type;
	},
	
	_handleCommand: function(command, result) {
		var listeners = this._commandListeners[command];
		if (listeners) {
			for (var i = 0; i < listeners.length; i++) {
				listeners[i](result);
			}
			if (this._isFinalResponse(result, this._commandListeners[command].type)) {
				this._commandListeners[command] = null;
			}
		}
	},
	
	_isFinalResponse: function(response, type) {
		var finalizers = ["OK", "TransactionComplete"];
		if (type == "transaction") {
			finalizers = ["TransactionComplete"];
		} else if (type == "singular") {
			return true;
		}
		return (finalizers.indexOf(response) > -1)
	},
	
	
	
	_closeHandler: function(e) {
		Debug.log("closeHandler: " + e);
	},
	
	_connectHandler: function(e) {
		Debug.log("!! CONNECTED");
	},
	
	_ioErrorHandler: function(e) {
		Debug.log("ioErrorHandler: " + e);
	},
	
	_securityErrorHandler: function(e) {
		Debug.log("securityErrorHandler: " + e);
	},
	
	_socketDataHandler: function(e) {
		// Debug.log("socketDataHandler: " + e);
		var resp = SB._read();
		
		// if (/roku: ready/.test(SB._response) && !arguments.callee.hasRun) {
		if ((SB._lastResponse == "roku: ready\r\n") && !arguments.callee.hasRun) {
			arguments.callee.hasRun = true;
			SB._ready();
		}
	},
	
	
	
	whenReady: function(callback) {
		if (!this._ready.callbacks)
			this._ready.callbacks = [];
		
		this._ready.callbacks.push(callback);	
			
		if (this._isReady) {
			callback();
		}
	},
	
	_ready: function() {
		this._isReady = true;
		var callbacks = arguments.callee.callbacks;
		if (callbacks) {
			Debug.log("!! READY");
			for (var i = 0; i < callbacks.length; i++) {
				callbacks[i]();
			}
		}
	},
	
	
	
	
	/*********** COMMANDS ***********/
	// Transport Commands (no valuable response)
	play: function(index) {
		if (index != null) {
			this.sendCommand("PlayIndex", index);
		} else {
			this.sendCommand("Play");
		}
	},
	pause: function() {
		this.sendCommand("Pause");
	},
	previous: function() {
		this.sendCommand("Previous");
	},
	next: function() {
		this.sendCommand("Next");
	},
	// shuffle setting should be "on", "off", or "cycle" (null is the same as "cycle", a function reports the current state)
	shuffle: function(setting) {
		setting = setting || "cycle";
		if (typeof(setting) == "function") {
			this.sendCommand("Suffle", "", setting);
		} else {
			this.sendCommand("shuffle", setting);
		}
	},
	setVolume: function(volume) {
		volume = Math.min(100, Math.max(0, volume));
		this.sendCommand("SetVolume", volume);
	},
	getVolume: function(callback) {
		this.sendCommand("GetVolume", "", callback);
	},
	
	connectTo: function(serverName) {
		this.sendCommand("GetConnectedServer", "", function() {
			SB.sendCommand("ServerDisconnect", "", function(message) {
				Debug.log("ServerDisconnect: " + message)
				if (message == "TransactionComplete") {
					SB.listServers(null, function(serverList) {
						var index = serverList.indexOf(serverName);
						if (index > -1) {
							Debug.log("CONNECTING TO " + serverName)
							SB.sendCommand("ServerConnect", serverName);
						}
					});
				}
			})
		})
	},
	
	// Data commands
	getCurrentState: function(callback) {
		this.sendCommand("GetTransportState", "", callback, "singular");
	},
	
	getSongInfo: function(index, callback) {
		var info = {};
		this.sendCommand("GetSongInfo", index, function(infoBit) {
			Debug.log("processing GetSongInfo: " + infoBit);
			if (infoBit == "TransactionComplete") {
				if (!info.artist && !info.title && !info.trackLengthMS)
					return callback();
				return callback(info);
			}
			
			var parts = infoBit.match(/^(.*?): (.*)$/);
			if (parts && parts[1]) {
				info[parts[1]] = parts[2];
			}
		}, "transaction");
	},
	getCurrentSongInfo: function(callback) {
		var info = {};
		this.sendCommand("GetCurrentSongInfo", "", function(infoBit) {
			// Debug.log("got current song info bit:\n" + infoBit);
			if (infoBit == "OK") {
				if (!info.artist && !info.title && !info.trackLengthMS)
					return callback();
				return callback(info);
			}
			
			var parts = infoBit.match(/^(.*?): (.*)$/);
			if (parts && parts[1]) {
				info[parts[1]] = parts[2];
			}
		});
	},
	
	// List commands
	listServers: function(types, callback) {
		if (types == null)
			types = "daap upnp rsp slim";
		if (types) {
			SB.sendCommand("SetServerFilter", types);
		}
		
		var servers = [];
		SB.sendCommand("ListServers", "", function(server) {
			Debug.log("Processing: " + server);
			if (!SB._controlTerms.test(server)) {
				servers.push(server);
			} else if (server == "ListResultEnd") {
				callback(servers);
			}
		});
	},
	
	listSongs: function(params) {
		var endFunc = function() {};
		if (typeof(params) == "function")
			endFunc = params;
			
		var songs = [];
		this.sendCommand("ListSongs", "", function(songName) {
			if (/TransactionInitiated|ListResultSize/.test(songName)) {
				return;
			} else if ("ListResultEnd" == songName) {
				arguments.callee.listOver = true;
				return;
			} else if ("TransactionComplete" == songName && arguments.callee.listOver) {
				endFunc(songs);
				return;
			}
			
			songs.push(songName);
		});
	},
	
	listNowPlayingQueue: function(callback) {
		var queue = [];
		this.sendCommand("ListNowPlayingQueue", "", function(songName) {
			if (!/ListResultSize|ListResultEnd/.test(songName)) {
				queue.push(songName);
			} else if (songName == "ListResultEnd" && callback) {
				callback(queue);
			}
		});
	},
	
	getQueueInfo: function(callback) {
		var songs = [];
		var index = 0;
		this.sendCommand("ListNowPlayingQueue", "", function(songName) {
			if (/ListResultSize/.test(songName)) {
				// SB.sendCommand("CancelTransaction", "ListNowPlayingQueue");
				
				var totalSongs = parseInt(songName.match(/ListResultSize (\d*)$/)[1]);
				SB.getSongInfo(index, function(songInfo) {
					Debug.log("INFO: " + songInfo.title);
					songs.push(songInfo);
					
					if (++index == totalSongs) {
						callback(songs);
					} else {
						Debug.log("get next");
						var thisFunc = arguments.callee;
						setTimeout(function() { SB.getSongInfo(index, thisFunc); }, 10);
					}
				});
			}
		});
	},
}