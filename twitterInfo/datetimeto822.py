import rfc822, calendar, datetime, time

def to_datetime(time_str):
    rfc_date = rfc822.parsedate(time_str)
    date_obj = datetime.datetime.utcfromtimestamp(calendar.timegm(rfc_date))
    return date_obj

def to_rfc822(date_obj):
    time_tuple = date_obj.timetuple()
    rfc_date = rfc822.formatdate(time.mktime(time_tuple))
    return rfc_date
