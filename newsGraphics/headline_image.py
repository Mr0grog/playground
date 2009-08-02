import sys
import urllib
import urllib2
import re


IMAGE_SEARCH = "http://images.google.com/images"

def get_headline_image(headline):
	# query = '+"ap" %s' % headline
	query = headline

	qs = urllib.urlencode({ "q": query })
	request = urllib2.Request(IMAGE_SEARCH + "?" + qs, headers={ "User-agent": "python!" })
	try:
		data = urllib2.urlopen(request)
		content = data.read()
	except:
		content = ""

	# remove non-html content
	content = re.compile(r'(<script.*?/script>)|(<style.*?/style>)', re.M | re.S).sub('', content)

	# find the first image result
	link = re.findall('href="?/imgres\?(.*?)[ >]', content, re.M | re.S)
	if len(link) == 0:
		return None
		
	link = link[0]

	# get info about results
	image_info = {}
	parts = link.split("&")
	for part in parts:
		if "=" in part:
			key, val = part.split("=", 1)
			image_info[urllib.unquote_plus(key)] = urllib.unquote_plus(val)
		else:
			image_info[urllib.unquote_plus(part)] = True

	return {
		"image": image_info["imgurl"],
		"source": image_info["imgrefurl"],
	}
	

if __name__ == "__main__":
	# get input or fake it
	if len(sys.argv) > 1:
		headline = sys.argv[1]
	else:
		headline = "Aid is on the way to devastated Myanmar but so is heavy rain"
	
	image = get_headline_image(headline)
	
	print image["image"]