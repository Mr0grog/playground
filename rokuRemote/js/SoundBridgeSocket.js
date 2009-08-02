var SoundBridgeSocket = function(deviceIP) {
	if (deviceIP) {
		this.connect(deviceIP);
	}
	
	return this;
};

// static properties
SoundBridgeSocket._port = 5555;

SoundBridgeSocket.prototype = {
	// instance properties
	// _socket: the tcp socket for actual communication
	
	// public
	connect: function(deviceIP) {
		Debug.log("Attempting to connect to " + deviceIP);
		
		this._socket = new air.Socket(deviceIP, SoundBridgeSocket._port);
		this._socket.endian = air.Endian.LITTLE_ENDIAN;
		this._socket.addEventListener(air.Event.CLOSE, this._closeHandler);
		this._socket.addEventListener(air.Event.CONNECT, this._connectHandler);
		this._socket.addEventListener(air.IOErrorEvent.IO_ERROR, this._ioErrorHandler);
		this._socket.addEventListener(air.SecurityErrorEvent.SECURITY_ERROR, this._securityErrorHandler);
		this._socket.addEventListener(air.ProgressEvent.SOCKET_DATA, this._socketDataHandler);
	},
	
	
	
	// private
	_connectHandler: function(e) {
		Debug.log("Connected to SoundBridge.");
	},
	
	_closeHandler: function(e) {
		Debug.log("Disconnected from SoundBridge.");
	},
	
	_socketDataHandler: function(e) {
		// DO SOME STUFF!!
	},
	
	_ioErrorHandler: function(e) {
		Debug.log("SoundBridge I/O Error: " + e);
	},
	
	_securityErrorHandler: function(e) {
		Debug.log("SoundBridge Security Error: " + e);
	},
	
};