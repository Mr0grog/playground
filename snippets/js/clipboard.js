var copyText = function(text) {
	netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
	var Cc = Components.classes;
	var Ci = Components.interfaces;
	var Cstr = Cc["@mozilla.org/supports-string;1"];
	var CTra = Cc["@mozilla.org/widget/transferable;1"];
	var CClp = Cc["@mozilla.org/widget/clipboard;1"];

	var str = Cstr.createInstance(Ci.nsISupportsString);
	if (!str) {
		return false;
	}
	str.data = text;
	
	var trans = CTra.createInstance(Ci.nsITransferable);
	if (!trans) {
		return false;
	}
	
	trans.addDataFlavor("text/unicode");
	trans.setTransferData("text/unicode", str, text.length * 2);
	
	var clipboard = CClp.getService(Ci.nsIClipboard);
	if (!clipboard) {
		return false;
	}
	
	clipboard.setData(trans, null, Ci.nsIClipboard.kGlobalClipboard);
	return true;
};