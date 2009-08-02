import urllib
import urllib2
import simplejson
import datetime, datetimeto822

def fetch_url(url, uname=None, passw=None):
    request = urllib2.Request(url)
    
    try:
        f = urllib2.urlopen(request)
        result = f.read()
    except:
        return 'Error getting data'
        
    return result

def get_user_info(user):
    info_url = 'http://twitter.com/users/show/'
    info_url = info_url + user + '.json'
    
    info = fetch_url(info_url)
    info = simplejson.loads(info)
    
    return info

def get_follow_status(info):
    follow_ratio = info['followers_count'] * 1.0 / info['friends_count']
    follow_status = 'normal person'
    if (follow_ratio > 5):
        follow_status = 'celebrity'
    elif (follow_ratio < 0.2):
        follow_status = 'follower'
    
    return follow_status

def get_tweet_volume(info):
    volume = {'avg': 0, 'lately': 0}
    
    start_date = datetimeto822.to_datetime(info['created_at'])
    delta = datetime.datetime.now() - start_date
    tweets = info['statuses_count']
    
    avg = float(tweets) / delta.days
    volume['avg'] = avg
    
    lately_days = 14
    since = datetime.datetime.now() - datetime.timedelta(lately_days)
    
    since_rfc = datetimeto822.to_rfc822(since)
    timeline_url = 'http://twitter.com/statuses/user_timeline/'
    timeline_url = timeline_url + info['screen_name'] + '.json?since=' + urllib.quote(since_rfc)
    tweet_list = fetch_url(timeline_url)
    tweet_list = simplejson.loads(tweet_list)
    tweets = len(tweet_list)
    
    volume['lately'] = float(len(tweet_list)) / lately_days
    
    return volume


# Get info for...?
check_user = raw_input("Get stats for: ")

info = get_user_info(check_user)

# Get celebrity-ness
follow_status = get_follow_status(info)

# Display it
print ''
print '%s is a %s' % (check_user, follow_status)
print '(%d followers / %d followees)' % (info['followers_count'], info['friends_count'])

volume = get_tweet_volume(info)

print ''
print '%f tweets per day, on average' % volume['avg']
print '%f tweets per day, for the last two weeks' % volume['lately']


print ''