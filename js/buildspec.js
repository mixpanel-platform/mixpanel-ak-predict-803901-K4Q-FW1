//assemble spec object
var spec = [];

//get all events & count number of events
var eventsCount = $('.event-name').length

//iterate through each event AND property; add it to the spec
for (var i = 0; i < eventsCount; i++) {
    var eventObj = {};
    eventObj.event = $('#' + i +' .event-name .name')[0].value;
        for (var j = 0; j < $('.event-name').length; j++) {
            if ($('#' + i + ' .prop-name')) {
                eventObj['property '+i] = $('.prop-name')[i].value;
            }
        };
    
        
    //}

	


    spec.push(eventObj)
};






//this is how it should be structured
var spec = [{
    "event": "Drank Something",
    "properties": [
        {
            "name": "drink",
            "values": ['coke1', "coke2"],
            "superprop": true
        },
        {
         "name": "Amount",
         "values": [386, 234],
        }
    ]
}, {
    "event": "Ate Something",
    "properties": {
        "type": ["coke1", "coke2", "coke3"],
        "amount": [386, 360],
        "fat": true
    }
}]


var funnels = [{
    "funnel name": "activation"
}, {
    "steps": ["sign up", "foo", "bar", "die"]
}, {
    "funnel name": "retention"
}, {
    "steps": ["stay", "go", "stay", "die"]
}]


var platforns = ["Android", "iOS", "Web"]