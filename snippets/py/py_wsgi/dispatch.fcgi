#!/usr/bin/env python

import sys
from fcgi import WSGIServer
import application
import cgi

class Request(object):pass

def app(e, start_response):
	req = Request()
	
	#POST Data
	req.form = cgi.FieldStorage(fp = e["wsgi.input"], environ = e)
	
	#GET Data
	# req.params = cgi.parse_qs(e["QUERY_STRING"])
	
	start_response("200 OK", [("Content-type", "text/html")])
	return [application.start(req)]
	

WSGIServer(app).run()