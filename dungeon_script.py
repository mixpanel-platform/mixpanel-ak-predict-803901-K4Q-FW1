import time
import urllib #for url encoding
import base64
import json
import eventlet
from eventlet.green import urllib2
import datetime
import calendar
import uuid
import random
import struct
import socket
from math import floor
from dateutil import relativedelta

def simulate_users(amount, flow_map, user_file, date):
	events = []
	people_updates = []
	time = calendar.timegm(datetime.datetime.strptime(date, "%Y-%m-%d").timetuple())
	for x in range(amount):
		user = build_user()
		if len(flow_map["required"]) > 0:
			required_events, updates = required(flow_map, user, time)
			events = events + required_events
			people_updates = people_updates + updates
		else:
			if random.randint(1,100) > 70:
				notification_events, user = notification_data(user)
				timestamp = random.randint(time+106400, time+192800)
				for event in notification_events:
					timestamp = random.randint(timestamp, timestamp+600)
					event_name = event["event"]
					user = date_properties(event_name, user, timestamp)
					event["properties"]["time"] = timestamp
					event["properties"].update(user["properties"])
					event["properties"].update(user["people_properties"])
					events.append(event)
				f = open('retained.txt', 'a')
				f.write(json.dumps(user)+"\n")
				f.close()
	try:
		f = open(user_file, 'r')
	except:
		f = []
	for user in f:
		user = json.loads(user)
		usage_events, updates = usage(flow_map, user, time)
		events = events + usage_events
		people_updates = people_updates + updates
	if len(events):
		print "simulation complete"
		print "sending %s events" % (str(len(events)))
		event_batcher(events)
	if len(people_updates):
		print "sending people updates"
		people_batcher(people_updates, "$set")
	try:
		f.close()
	except:
		print "First Day!"
	stupid_file_switch(user_file, 'retained.txt')

def required(flow_map, user, time):
	events = []
	complete = []
	f = open('retained.txt', 'a')
	timestamp = random.randint(time+106400, time+192800)
	if not user["required"]:
		for funnel in flow_map["required"]:
			for event in flow_map["required"][funnel]:
				properties, modifier, user = apply_event_properties(event, user)
				conversion = user_conversion(user, 60, 90, "conversion", modifier)
				if random.randint(1,100) > conversion:
					return events, complete
				else:
					event = {"event":event, "properties":{}}
					event_name = event["event"]
					timestamp = random.randint(timestamp, timestamp+600)
					user = date_properties(event_name, user, timestamp)
					event["properties"]["time"] = timestamp
					event["properties"].update(user["properties"])
					event["properties"].update(user["people_properties"])
					event["properties"].update(properties)
					events.append(event)
					user = last_event(event_name, user)
		if len(events) == len(flow_map["required"][funnel]):
			notification_events, user = notification_data(user)
			for event in notification_events:
				timestamp = random.randint(timestamp, timestamp+600)
				user = date_properties(event_name, user, timestamp)
				event["properties"]["time"] = timestamp
				event["properties"].update(user["properties"])
				event["properties"].update(user["people_properties"])
				event["properties"].update(properties)
				events.append(event)
			complete.append(user)
			f.write(json.dumps(user)+"\n") 
	f.close()
	return events, complete

def usage(flow_map, user, time):
	events = []
	updates = []
	attempts = 0
	timestamp = random.randint(time+106400, time+192800)
	f = open('retained.txt', 'a')
	x = user_conversion(user, 60, 90, "retention")
	if random.randint(1,100) > x:
		y = user_conversion(user, 80, 95, "retention")
		if random.randint(1,100) < y:
			f.write(json.dumps(user)+"\n")
			f.close()
		return events, updates
	else:
		while True:
			for funnel in flow_map["usage"]:
				for event in flow_map["usage"][funnel]:
					properties, modifier, user = apply_event_properties(event, user)
					conversion = user_conversion(user, 50, 80, "conversion", modifier)
					if random.randint(1,100) > conversion:
						attempts += 1
						if attempts == 3:
							z = user_conversion(user,90, 95, "retention")
							if random.randint(1,100) < z:
								f.write(json.dumps(user)+"\n")
								f.close()
							return events, updates
						break
					else:
						if funnel == "unused":
							event = random.choice(flow_map["usage"]["unused"])
						event = {"event":event, "properties":{}}
						event_name = event["event"]
						timestamp = random.randint(timestamp, timestamp+600)
						user = date_properties(event_name, user, timestamp)
						event["properties"]["time"] = timestamp
						user = increment_events(event_name, user)
						event["properties"].update(user["properties"])
						event["properties"].update(user["people_properties"])
						event["properties"].update(properties)
						events.append(event)
						user = last_event(event_name, user)
						updates.append(user)

def increment_events(event, user):
	property_name = "%s Count" % (event)
	if not user["people_properties"].get(property_name):
		user["people_properties"][property_name] = 1
	else:
		user["people_properties"][property_name] += 1
	return user

def notification_data(user):
	notification_events = []
	for event_name in notifications:
		event = {"event":event_name, "properties":{}}
		for campaign in notifications[event_name]:
			for prop in campaign:
				if prop == "message_id" or prop == "$variant_id":
					value_1 = campaign[prop][0]
					value_2 = campaign[prop][1]
					value_3 = campaign[prop][2]
					variant = weighted_choice([({"value":value_1, "retention":-.1, "conversion":-.1, "name":prop}, 40),({"value":value_2, "retention":0, "conversion":0, "name":prop}, 40),({"value":value_3, "retention":.1, "conversion":.1, "name":prop}, 40)])
					user["retention"] += variant["retention"]
					user["conversion"] += variant["conversion"]
					event["properties"].update({variant["name"]:variant["value"]})
				else:
					event["properties"].update({prop:campaign[prop]})
			notification_events.append(event)
	return notification_events, user

def date_properties(event, user, timestamp):
	if event_dict.get(event):
		for prop in event_dict[event]:
			if event_dict[event][prop]["type"] == "date":
				if event_dict[event][prop]["values"] == "first":
					if not user["people_properties"].get(prop):
						user["people_properties"][prop] = datetime.datetime.fromtimestamp(timestamp+25200).strftime('%Y-%m-%dT%H:%M:%S')
				elif event_dict[event][prop]["values"] == "last":
					user["people_properties"][prop] = datetime.datetime.fromtimestamp(timestamp+25200).strftime('%Y-%m-%dT%H:%M:%S')

	return user

def apply_event_properties(event, user):
	properties = {}
	modifier = 0
	if event_dict.get(event):
		for prop in event_dict[event]:
			if event_dict[event][prop]["type"] == "list":
				prop_value = []
				max_length = len(event_dict[event][prop]["values"])
				for value in event_dict[event][prop]["values"]:
					if event_dict[event][prop]["values"][value] == "good": 
						if random.randint(1,100) > 30:
							prop_value.append(value)
					else:
						if random.randint(1,100) > 60:
							prop_value.append(value)
				if event_dict[event][prop]["super"] != "true":
					properties[prop] = prop_value
				else:
					user["people_properties"][prop] = prop_value
			if event_dict[event][prop]["type"] == "string":
				choices = []
				for value in event_dict[event][prop]["values"]:
					if event_dict[event][prop]["values"][value] == "good": 
						choices.append((value, random.randint(80,100)))
					else:
						choices.append((value, random.randint(40,60)))
				prop_value = weighted_choice(choices)
				properties[prop] = prop_value
				if event_dict[event][prop]["values"][value] == "good":
					modifier += random.randint(5,15)
				else:
					modifier += random.randint(-10,0)
				elif not user["people_properties"].get(prop):
					user["people_properties"][prop] = prop_value
					if event_dict[event][prop]["values"][value] == "good":
						user["conversion"] += .2
						user["retention"] += .1
					else:
						user["conversion"] += -.2
						user["retention"] += -.1
			if event_dict[event][prop]["type"] == "boolean":
				prop_value = weighted_choice([(True,random.randint(40,100)), (False, random.randint(40,100))])
				if prop_value:
					weight = event_dict[event][prop]["values"]["true"]
				else:
					weight = event_dict[event][prop]["values"]["false"]
				if event_dict[event][prop]["super"] != "true":
					properties[prop] = prop_value
					if weight == "good":
						modifier += random.randint(5,15)
					else:
						modifier += random.randint(-10,0)
				elif not user["people_properties"].get(prop):
					user["people_properties"][prop] = prop_value
					if weight == "good":
						user["conversion"] += .1
						user["retention"] += .1
					else:
						user["conversion"] += -.1
						user["retention"] += -.1
			if event_dict[event][prop]["type"] == "numeric":
				value_range = event_dict[event][prop]["values"]
				if '.' in value_range[0]:
					value_range = [float(value_range[0]), float(value_range[1])]
				else:
					value_range = [int(value_range[0]), int(value_range[1])]
				if isinstance(value_range[0], int):
					prop_value = random.randint(int(value_range[0]),int(value_range[1]))
				elif isinstance(value_range[0], float):
					sigfig = len(str(value_range[0]).split('.')[1])
					prop_value = round(random.uniform(value_range[0], value_range[1]), sigfig)
				if event_dict[event][prop]["super"] != "true":
					properties[prop] = prop_value
				elif not user["people_properties"].get(prop):
					user["people_properties"][prop] = prop_value
	return properties, modifier, user

def last_event(event, user):
	user["people_properties"]["Last Event"] = event
	return user

def user_conversion(user, x, y, modifier, event_bump=0):
	value = (user[modifier] * x) + event_bump
	if value > y:
		return y
	else:
		return value


def track(events):
	data = base64.b64encode(json.dumps(events))
	host = 'api.mixpanel.com'
	params = {
		'data': data,
		'verbose':1,
		'ip':0,
		'api_key':api_key
	}
	url = 'http://%s/%s/' % (host, 'import')
	response = urllib2.urlopen(url, urllib.urlencode(params))
	message = response.read()

	if json.loads(message)['status'] != 1:
	    print message

def event_batcher(eventlist):
	events = []
	pool = eventlet.GreenPool(size=200)
	for event in eventlist:
		events.append(event)
		if len(events) == 50:
			pool.spawn(track, events)
			events = []
	pool.waitall()
	if len(events):
		track(events)

def people_update(userlist, operator):
		url = "http://api.mixpanel.com/engage/"
		batch = []
		for user in userlist:
			distinctid = user['properties']['distinct_id']
			tempparams = {
				'token':token,
				'$distinct_id':distinctid,
				"$ignore_time":"True"
				}
			if operator == "$set":
				tempparams.update({'$set':user['people_properties']})
				tempparams.update({'$ip':user['properties']['ip']})
			elif operator == "$append":
				tempparams.update({operator:{"$transactions":user["$transactions"]}})
			elif operator == "$add":
				tempparams.update({operator:{"Revenue":user["Revenue"]}})
			batch.append(tempparams)

		payload = {"data":base64.b64encode(json.dumps(batch)), "verbose":1, "ip":0}
		response = urllib2.urlopen(url, urllib.urlencode(payload))
		message = response.read()
		if json.loads(message)['status'] != 1:
			print message

def people_batcher(users, operator):
        pool = eventlet.GreenPool(size=200)
        batch_list = []
        while len(users):
            batch = users[:50]
            batch_list.append(batch)
            users = users[50:]
            x = 0
        for batch in batch_list:
            x+=1
            pool.spawn(people_update, batch, operator)
        pool.waitall()
					

def weighted_choice(choices):
	total = sum(w for c, w in choices)
	r = random.uniform(0, total)
	upto = 0
	for c, w in choices:
		if upto + w > r:
			return c
		upto += w

def build_user():
	user = {"properties":{"distinct_id":str(uuid.uuid4()), "token":token}, "people_properties":{}, "retention":1, "conversion":1, "required":False}
	user["properties"].update({"ip":socket.inet_ntoa(struct.pack('>I', random.randint(1, 0xffffffff)))})
	first_names = ['James','John','Robert','Michael','William','David','Richard','Charles','Joseph','Thomas','Christopher','Daniel','Paul','Mark','Donald','George','Kenneth','Steven','Edward','Brian','Ronald','Anthony','Kevin','Jason','Matthew','Gary','Timothy','Jose','Larry','Jeffrey','Frank','Scott','Eric','Stephen','Andrew','Raymond','Gregory','Joshua','Jerry','Dennis','Walter','Patrick','Peter','Harold','Douglas','Henry','Carl','Arthur','Ryan','Roger','Joe','Juan','Jack','Albert','Jonathan','Justin','Terry','Gerald','Keith','Samuel','Willie','Ralph','Lawrence','Nicholas','Roy','Benjamin','Bruce','Brandon','Adam','Harry','Fred','Wayne','Billy','Steve','Louis','Jeremy','Aaron','Randy','Howard','Eugene','Carlos','Russell','Bobby','Victor','Martin','Ernest','Phillip','Todd','Jesse','Craig','Alan','Shawn','Clarence','Sean','Philip','Chris','Johnny','Earl','Jimmy','Antonio','Danny','Bryan','Tony','Luis','Mike','Stanley','Leonard','Nathan','Dale','Manuel','Rodney','Curtis','Norman','Allen','Marvin','Vincent','Glenn','Jeffery','Travis','Jeff','Chad','Jacob','Lee','Melvin','Alfred','Kyle','Francis','Bradley','Jesus','Herbert','Frederick','Ray','Joel','Edwin','Don','Eddie','Ricky','Troy','Randall','Barry','Alexander','Bernard','Mario','Leroy','Francisco','Marcus','Micheal','Theodore','Mary','Patricia','Linda','Barbara','Elizabeth','Jennifer','Maria','Susan','Margaret','Dorothy','Lisa','Nancy','Karen','Betty','Helen','Sandra','Donna','Carol','Ruth','Sharon','Michelle','Laura','Sarah','Kimberly','Deborah','Jessica','Shirley','Cynthia','Angela','Melissa','Brenda','Amy','Anna','Rebecca','Virginia','Kathleen','Pamela','Martha','Debra','Amanda','Stephanie','Carolyn','Christine','Marie','Janet','Catherine','Frances','Ann','Joyce','Diane','Alice','Julie','Heather','Teresa','Doris','Gloria','Evelyn','Jean','Cheryl','Mildred','Katherine','Joan','Ashley','Judith','Rose','Janice','Kelly','Nicole','Judy','Christina','Kathy','Theresa','Beverly','Denise','Tammy','Irene','Jane','Lori','Rachel','Marilyn','Andrea','Kathryn','Louise','Sara','Anne','Jacqueline','Wanda','Bonnie','Julia','Ruby','Lois','Tina','Phyllis','Norma','Paula','Diana','Annie','Lillian','Emily','Robin','Peggy','Crystal','Gladys','Rita','Dawn','Connie','Florence','Tracy','Edna','Tiffany','Carmen','Rosa','Cindy','Grace','Wendy','Victoria','Edith','Kim','Sherry','Sylvia','Josephine']
	last_names = ['Smith','Johnson','Williams','Jones','Brown','Davis','Miller','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Garcia','Martinez','Robinson','Clark','Rodriguez','Lewis','Lee','Walker','Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott','Green','Adams','Baker','Gonzalez','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward','Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price','Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long','Patterson','Hughes','Flores','Washington','Butler','Simmons','Foster','Gonzales','Bryant','Alexander','Russell','Griffin','Diaz','Hayes','Myers','Ford','Hamilton','Graham','Sullivan','Wallace','Woods','Cole','West','Jordan','Owens','Reynolds','Fisher','Ellis','Harrison','Gibson','Mcdonald','Cruz','Marshall','Ortiz','Gomez','Murray','Freeman','Wells','Webb','Simpson','Stevens','Tucker','Porter','Hunter','Hicks','Crawford','Henry','Boyd','Mason','Morales','Kennedy','Warren','Dixon','Ramos','Reyes','Burns','Gordon','Shaw','Holmes','Rice','Robertson','Hunt','Black','Daniels','Palmer','Mills','Nichols','Grant','Knight','Ferguson','Rose','Stone','Hawkins','Dunn','Perkins','Hudson','Spencer','Gardner','Stephens','Payne','Pierce','Berry','Matthews','Arnold','Wagner','Willis','Ray','Watkins','Olson','Carroll','Duncan','Snyder','Hart','Cunningham','Bradley','Lane','Andrews','Ruiz','Harper','Fox','Riley','Armstrong','Carpenter','Weaver','Greene','Lawrence','Elliott','Chavez','Sims','Austin','Peters','Kelley','Franklin','Lawson','Fields','Gutierrez','Ryan','Schmidt','Carr','Vasquez','Castillo','Wheeler','Chapman','Oliver','Montgomery','Richards','Williamson','Johnston','Banks','Meyer','Bishop','Mccoy','Howell','Alvarez','Morrison','Hansen','Fernandez','Garza','Harvey','Little','Burton','Stanley','Nguyen','George','Jacobs','Reid','Kim','Fuller','Lynch','Dean','Gilbert','Garrett','Romero','Welch','Larson','Frazier','Burke','Hanson','Day','Mendoza','Moreno','Bowman','Medina','Fowler','Brewer','Hoffman','Carlson','Silva','Pearson','Holland','Douglas','Fleming','Jensen','Vargas','Byrd','Davidson']
	email_domains = ["gmail", "yahoo", "aol", "hotmail"]
	email_words = ['dragon','lancer','sword','fire','magic','dance','random','killer','hacker','pike','trebuchet','catapult','iron','ranger','bow','arrow','strafe','hound','wiggle','darkness','light','coward','hero','giant','troll','dog','wolf','bear','puma','lion','pterodactyl','love','shadow','x']
	email = "%s.%s@%s.com" % (random.choice(email_words), random.choice(email_words), random.choice(email_domains))
	user['people_properties'].update({"$first_name":random.choice(first_names), "$last_name":random.choice(last_names), "$email":email})
	platform = random.choice(config["platforms"])
	if platform == "iOS":
		user["people_properties"]["Platform"] = "iOS"
		iOS_properties = [{"value":"iPhone OS", "retention":0, "conversion":0, "name":"$os"}]
		iOS_properties.append(weighted_choice([({"value":"iPhone4,1", "retention":.1, "conversion":0, "name":"$model"},40) , ({"value":"iPhone3,1", "retention":0, "conversion":0, "name":"$model"},35), ({"value":"iPhone6,1", "retention":.1, "conversion":0, "name":"$model"},50), ({"value":"iPhone5,2", "retention":0, "conversion":0, "name":"$model"},30), ({"value":"iPhone6,1", "retention":.1, "conversion":.1, "name":"$model"},45), ({"value":"iPhone5,1", "retention":0, "conversion":0, "name":"$model"},28), ({"value":"iPod5,1", "retention":.1, "conversion":.1, "name":"$model"},22), ({"value":"iPad2,5", "retention":0, "conversion":.1, "name":"$model"},20), ({"value":"iPad3,4", "retention":.1, "conversion":.1, "name":"$model"},15), ({"value":"iPad4,1", "retention":.1, "conversion":0, "name":"$model"},10)]))
		iOS_properties.append(weighted_choice([({"value":"1.0", "retention":-.2, "conversion":-.2, "name":"App Version"}, 5),({"value":"2.0.1", "retention":-.1, "conversion":-.1, "name":"App Version"}, 10), ({"value":"3.1.0", "retention":.05, "conversion":.05, "name":"App Version"}, 90)]))
		iOS_properties.append(weighted_choice([({"value":"8.4.1", "retention":.1, "conversion":0, "name":"$os_version"},30) , ({"value":"8.4", "retention":0, "conversion":0, "name":"$os_version"},55), ({"value":"8.3", "retention":.1, "conversion":0, "name":"$os_version"},110), ({"value":"8.2", "retention":0, "conversion":0, "name":"$os_version"},40), ({"value":"8.0", "retention":.1, "conversion":.1, "name":"$os_version"},20), ({"value":"7.1.2", "retention":0, "conversion":0, "name":"$os_version"},120), ({"value":"7.1.1", "retention":.1, "conversion":.1, "name":"$os_version"},75), ({"value":"7.0.4", "retention":0, "conversion":.1, "name":"$os_version"},20), ({"value":"6.1.3", "retention":.1, "conversion":.1, "name":"$os_version"},50), ({"value":"9.0", "retention":.1, "conversion":0, "name":"$os_version"},40)]))
		user = apply_properties(iOS_properties, user)
	if platform == "Android":
		user["people_properties"]["Platform"] = "Android"
		android_properties = [{"value":"Android", "retention":-.1, "conversion":-.1, "name":"$os"}]
		android_properties.append(weighted_choice([({"value":"GT-I9300", "retention":.1, "conversion":.1, "name":"$model"},45), ({"value":"GT-I9500", "registration":0, "retention":.1, "conversion":0, "name":"$model"},40), ({"value":"SM-G900F", "registration":-.1, "retention":0, "conversion":0, "name":"$model"},35), ({"value":"GT-I8190L", "registration":.1, "retention":.1, "conversion":0, "name":"$model"},32), ({"value":"XT1032", "registration":0, "retention":0, "conversion":0, "name":"$model"},28), ({"value":"Nexus 5", "registration":-.1, "retention":0, "conversion":0, "name":"$model"},25), ({"value":"LG-D802", "registration":.1, "retention":.1, "conversion":.1, "name":"$model"},20)]))
		android_properties.append(weighted_choice([({"value":"5.1.1", "retention":.1, "conversion":0, "name":"$os_version"},90) , ({"value":"5.1", "retention":0, "conversion":0, "name":"$os_version"},20), ({"value":"5.0.2", "retention":.1, "conversion":0, "name":"$os_version"},80), ({"value":"5.0", "retention":0, "conversion":0, "name":"$os_version"},90), ({"value":"4.4.4", "retention":.1, "conversion":.1, "name":"$os_version"},130), ({"value":"4.4.2", "retention":0, "conversion":0, "name":"$os_version"},260), ({"value":"4.3", "retention":.1, "conversion":.1, "name":"$os_version"},40), ({"value":"4.2.2", "retention":0, "conversion":.1, "name":"$os_version"},100), ({"value":"4.2.1", "retention":.1, "conversion":.1, "name":"$os_version"},50), ({"value":"4.0.3", "retention":.1, "conversion":0, "name":"$os_version"},30)]))
		android_properties.append(weighted_choice([({"value":"1.0", "retention":-.2, "conversion":-.2, "name":"App Version"}, 5),({"value":"2.0.1", "retention":-.1, "conversion":-.1, "name":"App Version"}, 10), ({"value":"3.1.0", "retention":.05, "conversion":.05, "name":"App Version"}, 90)]))
		user = apply_properties(android_properties, user)
	if platform == "Web":
		user["people_properties"]["Platform"] = "Web"
		web_properties = []
		web_properties.append(weighted_choice([({"value":"Mac OS X", "retention":0, "conversion":.1, "name":"$os"}, 100), ({"value":"Windows", "retention":-.1, "conversion":0, "name":"$os"}, 90), ({"value":"Linux", "retention":.1, "conversion":0, "name":"$os"}, 60)]))
		web_properties.append(weighted_choice([({"value":"Chrome", "retention":.1, "conversion":.1, "name":"$browser"},45), ({"value":"Mozilla", "registration":0, "retention":.1, "conversion":0, "name":"$browser"},40), ({"value":"Safari", "registration":-.1, "retention":0, "conversion":0, "name":"$browser"},35), ({"value":"Mobile Safari", "retention":.1, "conversion":0, "name":"$browser"},32), ({"value":"Internet Explorer", "retention":-.1, "conversion":-.1, "name":"$browser"},28), ({"value":"Android Mobile", "registration":-.1, "retention":0, "conversion":0, "name":"$browser"},25)]))
		user["people_properties"]["$initial_referrer"] = random.choice(['http://bing.com','http://google.com','http://facebook.com','http://twitter.com','http://reddit.com','http://baidu.com','http://duckduckgo.com'])
		user = apply_properties(web_properties, user)
	attribution = weighted_choice([({"value":"Organic", "retention":.1, "conversion":0, "name":"Campaign Name"}, 50), ({"value":"Super Sale", "retention":0, "conversion":0, "name":"Campaign Name"}, 20), ({"value":"Big Discounts", "retention":-.1, "conversion":-.1, "name":"Campaign Name"}, 15), ({"value":"Buy Now", "retention":0, "conversion":-.1, "name":"Campaign Name"}, 25)])
	if attribution["value"] != "Organic":
		source = weighted_choice([({"value":"Facebook", "retention":.1, "conversion":0, "name":"Campaign Source"}, 50), ({"value":"Twitter", "retention":0, "conversion":0, "name":"Campaign Source"}, 20), ({"value":"Google Adwords", "retention":-.1, "conversion":-.1, "name":"Campaign Source"}, 15), ({"value":"Email", "retention":0, "conversion":-.1, "name":"Campaign Source"}, 25), ({"value":"LinkedIn", "retention":-.1, "conversion":-.1, "name":"Campaign Source"}, 25)])
	else:
		source = {"value":"Organic", "retention":0, "conversion":0, "name":"Campaign Source"}
	user = apply_properties([attribution, source], user)
	experiment_group = weighted_choice([({"value":"Group A", "retention":0, "conversion":.1, "name":"Experiment Group"}, 40), ({"value":"Group B", "retention":-.1, "conversion":-.1, "name":"Experiment Group"}, 50), ("None", 60)])
	if experiment_group != "None":
		user = apply_properties([experiment_group], user)
	return user

def apply_properties(property_list, user):
	for property_dict in property_list:
		user["people_properties"][property_dict["name"]] = property_dict["value"]
		user["retention"] += property_dict["retention"]
		user["conversion"] += property_dict["conversion"]
	return user

def stupid_file_switch(old_file, new_file):
	new = open(new_file, "r")
	old = open(old_file, "w")
	for user in new:
		old.write(user)
	old.close()
	new.close()
	new = open(new_file, "w")
	new.close()

def run():
	try:
		f = open("last_date", "r")
		for line in f:
			from_date = line
	except:
		from_date = (datetime.datetime.now() - relativedelta.relativedelta(months=3)).strftime("%Y-%m-%d")
	from_date_list = from_date.split("-")
	from_date = datetime.date(int(from_date_list[0]), int(from_date_list[1]), int(from_date_list[2]))
	to_date = datetime.date.today()
	delta = (to_date - from_date).days

	for x in range(delta):
		request_date_object = from_date + relativedelta.relativedelta(days=x)
		request_date = str(request_date_object)
		with open("last_date", "w") as f:
			next_date = str(request_date_object + relativedelta.relativedelta(days=1))
			f.write(next_date)
		print request_date
		simulate_users(random.randint(5000,6000), flow_map, "registered_users.txt", request_date)