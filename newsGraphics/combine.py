import os
import feedparser
from jinja import Environment, FileSystemLoader
from headline_image import get_headline_image

WORLD_NEWS = "http://news.google.com/?ned=us&topic=w&output=rss"
TECH_NEWS = "http://news.google.com/?ned=us&topic=t&output=rss"


world = []
data = feedparser.parse(WORLD_NEWS)
for entry in data.entries:
	title = entry.title[:entry.title.find(" - ")]
	image = get_headline_image(title)
	world.append({
		"title": title,
		"link": entry.link,
		"image": image,
	})
	
	image_url = ""
	if image:
		image_url = image["image"]
		
	print "%s: %s" % (title, image_url)


tech = []
data = feedparser.parse(TECH_NEWS)
for entry in data.entries:
	title = entry.title[:entry.title.find(" - ")]
	image = get_headline_image(title)
	tech.append({
		"title": title,
		"link": entry.link,
		"image": image,
	})

	image_url = ""
	if image:
		image_url = image["image"]

	print "%s: %s" % (title, image_url)



TEMPLATE_PATH = os.path.join(os.path.dirname(__file__), "templates")
jinja_env = Environment(loader=FileSystemLoader(TEMPLATE_PATH))

def render_template(template, **context):
	return jinja_env.get_template(template).render(**context)


# render the output
html = render_template("news.html", world=world, tech=tech)

f = open('output/results.html', 'w')
f.write(html)
f.close()