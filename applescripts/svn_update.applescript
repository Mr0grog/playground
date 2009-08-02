set filecount to 0

on open filelist
	repeat with i in filelist
		set filecount to 1
		set filepath to POSIX path of i
		tell application "Terminal"
			do script with command "svn update " & filepath
		end tell
	end repeat
end open

if filecount < 1 then
	display alert "Drop a folder or file on this app to update it."
end if