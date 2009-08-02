/* App Controller */

// Global Data!
var App = {
	// Properties
	servers: [],
	currentServer: "",
	
	currentSong: null,
	
	// Functions
	updateCurrentSong: function(callback) {
		SB.getCurrentSongInfo(function(info) {
			if (!App.currentSong || App.currentSong.title != info.title || App.currentSong.artist != info.artist) {
				for (var item in info) {
					Debug.log("new song " + item + ": '" + info[item] + "'");
				}
			}
			App.currentSong = App.processSongInfo(info);
			if (callback)
				callback(App.currentSong);
		});
	},
	
	processSongInfo: function(info) {
		if (info) {
			info.title = info.title || "Untitled";
			info.artist = info.artist || "Unknown Artist";
		}
		return info;
	}
};

nativeWindow.visible = true;

window.addEventListener("load",function() {
	Debug.log("win loaded");
	
	document.getElementsByTagName("form")[0].addEventListener("submit", function(e) {
		e.preventDefault();
	}, false);
	
	document.getElementById("playButton").addEventListener("click", function() {
		SB.play();
	}, false);
	document.getElementById("pauseButton").addEventListener("click", function() {
		SB.pause();
	}, false);
	$("#previousButton").click(function(e) {
		e.preventDefault();
		SB.previous();
	});
	$("#nextButton").click(function(e) {
		e.preventDefault();
		SB.next();
	});
	$("#stateButton").click(function(e) {
		e.preventDefault();
		SB.getCurrentState(function(state) {
			Debug.log("state is: " + state);
			SB.getVolume(function(volume) {
				Debug.log("Moving slider to " + volume)
				$("#volumeSlider").slider("moveTo", volume, 0);
			});
		});
	});
	
	
	SB.initConnection("192.168.1.2");
	SB.whenReady(function() {
		SB.sendCommand("GetFriendlyName", "", function(name) {
			nativeWindow.title = name;
			$("#deviceName").html(name);
		});
		
		SB.sendCommand("GetConnectedServer");
		
		SB.listServers("daap upnp rsp slim", function(serverList) {
			App.servers = serverList;
			var list = $("#librarySelector")
				.empty()
				.append("<option>Not Connected</option>")
				.change(function() {
					SB.connectTo($(this).val());
					Debug.log("connecting to " + $(this).val());
				});
			SB.sendCommand("GetActiveServerInfo", "", function(serverName) {
				for (var i = 0; i < App.servers.length; i++) {
					list.append("<option>" + App.servers[i] + "</option>");
				}
				
				Debug.log("SERVERNAME: " + serverName);
				var parts = serverName.match(/(.*?): (.*)$/);
				if (parts && App.servers.indexOf(parts[2]) > -1) {
					App.connectedServer = App.servers[App.servers.indexOf(parts[2])];
					Debug.log("CONNECTED TO NAME: " + parts[2] + "\n  APPCS: " + App.connectedServer);
					
					$("#librarySelector").val(App.connectedServer);
					Debug.log("VAL: " + $("#librarySelector").val());
				}
			});
		});
		
		
		$("#volumeSlider").slider({
			minValue: 0,
			maxValue: 100,
			slide: function(e, ui) {
				SB.setVolume(ui.value);
			}
		});
		SB.getVolume(function(volume) {
			Debug.log("Moving slider to " + volume)
			$("#volumeSlider").slider("moveTo", volume, 0);
		});
		
		SB.listNowPlayingQueue(function(queue) {
			var songTable = $("#songQueue tbody");
			for (var i = 0; i < queue.length; i++) {
				var row = document.createElement("tr");
				row.setAttribute("index", "" + i);
				row.className = (i % 2 > 0) ? "odd" : "even";
				$(row)
					.append("<td>" + queue[i] + "</td>")
					.appendTo(songTable)
					.dblclick(function(e) {
						SB.play(this.getAttribute("index"));
					});
			}
		});
		
		/*
		SB.listSongs(function(songList) {
			Debug.log("First Song: " + songList[0]);
			var songTable = $("#songList tbody");
			for (var i = 0; i < songList.length; i++) {
				songTable.append("<tr><td>" + songList[i] + "</td></tr>");
			}
		});
		
		SB.getQueueInfo(function(queue) {
			Debug.log("Got queue");
			var songTable = $("#songQueue tbody");
			for (var i = 0; i < queue.length; i++) {
				songTable.append("<tr><td>" + queue[i].artist + "</td><td>" + queue[i].title + "</td></tr>");
			}
		});
		*/
		
		(function() {
			App.updateCurrentSong(function(info) {
				var str = "";
				if (info) {
					str = info.artist + "—" + info.title;
				} else {
					str = "No Song Currently Playing";
				}
				$("#currentSong").html(str);
				
			});
			
			setTimeout(arguments.callee, 2000);
		})();
	});
	
	
}, false);