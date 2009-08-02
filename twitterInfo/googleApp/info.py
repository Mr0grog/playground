import os
import cgi
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template
from google.appengine.ext import db

class Greeting(db.Model):
    author = db.UserProperty()
    content = db.StringProperty(multiline=True)
    date = db.DateTimeProperty(auto_now_add=True)
    

class MainPage(webapp.RequestHandler):
    def get(self):
        self.response.out.write('<html><body>')
        
        greetings = Greeting.all().order('-date').fetch(10)
        
        user = users.get_current_user()
        if user:
            url = users.create_logout_url('/')
            url_linktext = 'Log out'
        else:
            url = users.create_login_url(self.request.uri)
            url_linktext = 'Log in'
        
        data = {
            'greetings': greetings,
            'url': url,
            'url_linktext': url_linktext
        }
        
        path = os.path.join(os.path.dirname(__file__), 'index.html')
        self.response.out.write(template.render(path, data))

class Guestbook(webapp.RequestHandler):
    def post(self):
        greeting = Greeting()
        
        user = users.get_current_user()
        if user:
            greeting.author = user
        
        greeting.content = self.request.get('content')
        greeting.put()
        self.redirect('/')

class Nothing(webapp.RequestHandler):
    def resp(self):
        self.error(404)
        self.response.out.write('404 - No such page!')
    def get(self):
        self.resp()
    def post(self):
        self.resp()

application = webapp.WSGIApplication(
    [('/',     MainPage),
     ('/sign', Guestbook),
     (r'.*',   Nothing)], 
    debug=True)

def main():
    run_wsgi_app(application)


if __name__ == '__main__':
    main()
