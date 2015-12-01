$(document).ready(function() {
	
    function newEvent(i, val) {
        var val = val ? val : '';
        var addButton = $('#add-event');

        // add event div with event name, option to collapse, option to delete
        var eventDiv = $('<div class="event" id="' + i + '"></div>').insertBefore(addButton);
        var eventNameDiv = $('<div class="event-name"></div').appendTo(eventDiv);
        $('<div class="collapse-expand">-</div>').appendTo(eventNameDiv);
        $('<input class="name text" type="text">').appendTo(eventNameDiv).val(val);
        $('<div class="delete-icon"></div>').appendTo(eventNameDiv);

        // add properties div
        var propDiv = $('<div class="properties"></div>').appendTo(eventDiv);

        // set up plus button for option to add a property to the event
        var newProp = $('<div class="new-prop"></div>');
        newProp.appendTo(propDiv);
        var addProp = $('<div class="plus" style="display: inline-block"></div>');
        addProp.appendTo(newProp);
        if (propDiv.find('.property').length == 0) {
            addProp.css('margin-top', '20px');
        }

        // focus on event name input
        eventDiv.find('.name.text').focus();

        events ++;
    }

    function newProperty(propDiv, val, type, superp, propVals) {
        var val = val ? val : '';
        var type = type ? type : 'string';
        var superp = superp == 'true' ? '' : 'no';
        var newPropDiv = propDiv.find('.new-prop');

        // add property div to event properties div
        var newPropDiv = $('<div class="property"></div>').insertBefore(newPropDiv);

        // append property name input
        $('<input class="prop-name" type="text">').appendTo(newPropDiv).val(val);

        // append typecast button & icon to div, append menu but hide
        var castMenu = $('<div class="cast-menu"></div>').appendTo(newPropDiv);
        var typecast = $('<div class="typecast"></div>').appendTo(castMenu);        
        $('<div class="icon"></div>').appendTo(typecast).addClass(type);
        var menu = '<div class="menu"><div class="menu-item string-menu"><div class="string icon"></div><p>String</p></div><div class="menu-item numeric-menu"><div class="numeric icon"></div><p>Numeric</p></div><div class="menu-item boolean-menu"><div class="boolean icon"></div><p>Boolean</p></div><div class="menu-item date-menu"><div class="date icon"></div><p>Date</p></div><div class="menu-item list-menu"><div class="list icon"></div><p>List</p></div></div>'
        $(menu).appendTo(typecast).hide();

        // append delete button to property div
        $('<div class="delete-icon"></div>').appendTo(newPropDiv);

        // append super/people property toggle to property div
        $('<div class="container super"><div class="toggle ' + superp + '"></div></div>').appendTo(newPropDiv);

        // default to string and add string property value div
        newPropValues(type, newPropDiv, propVals);

        // focus on property name input
        propDiv.find('.prop-name').focus();
    }

    // add new property
    $(eventSection).on('click', '.new-prop > .plus', function() {
        var propDiv = $(this).parents('.properties');
        new newProperty(propDiv);
    })

    function newPropValues(value, div, propVals) {

        if (div.children('.prop-values').attr('class')) {
            // grab current typecast selection
            var currentValType = div.children('.prop-values').attr('class').split(' ')[1];
            // if the same type was selected again, do not remove the input
            if (currentValType == value) {
                return;
            }
            // remove input to replace with new type
            div.children('.prop-values').remove();
        }
        var valuesDiv = $('<div class="prop-values ' + value + '"></div>').appendTo(div);

        // add input types based on typecast value chosen
        if (value == 'list') {
            var tooltip = "Input individual list values (e.g., if list might look like ['a', 'b', 'c'] or ['a', 'c'], etc. enter 3 rows below, first should simply have: a)"
            $('<div class="inline-text" title="' + tooltip + '">Values</div>').appendTo(valuesDiv);
            $('<div class="plus"></div>').appendTo(valuesDiv);

            if (propVals) {
                for (var i = 0; i < Object.keys(propVals).length; i++) {
                    var value = Object.keys(propVals)[i];
                    var valueType = propVals[value];
                    newPropVal('list', valuesDiv, value, valueType);
                }                
            } else {
                newPropVal('list', valuesDiv);
            }
        } else if (value == 'string') {
            $('<div class="inline-text">Values</div>').appendTo(valuesDiv);
            $('<div class="plus"></div>').appendTo(valuesDiv);

            if (propVals) {
                for (var i = 0; i < Object.keys(propVals).length; i++) {
                    var value = Object.keys(propVals)[i];
                    var valueType = propVals[value];
                    newPropVal('string', valuesDiv, value, valueType);
                }                
            } else {
                newPropVal('string', valuesDiv);
            }
        } else if (value == 'date') {
            var dateType = propVals ? propVals : 'first';
            var eventName = div.parents('.event').find('input.name.text').val();
            var eventVal = eventName == '' ? 'event' : eventName;
            var dateSelect = $('<div class="date-select"></div>').appendTo(valuesDiv);
            $('<div class="select-button"><p>Date of ' + dateType + ' ' + eventVal + '</p><div class="down-arrow"></div></div><div class="select-menu fixed-dropdown"><div class="options-list"></div></div>').appendTo(dateSelect);

            // add options and select appropriate option
            if (propVals == 'last') {
                $('<div class="select-option">Date of first ' + eventVal + '</div>').appendTo(dateSelect.find('.options-list'));
                $('<div class="select-option selected">Date of last ' + eventVal + '</div>').appendTo(dateSelect.find('.options-list'));
            } else {
                $('<div class="select-option selected">Date of first ' + eventVal + '</div>').appendTo(dateSelect.find('.options-list'));
                $('<div class="select-option">Date of last ' + eventVal + '</div>').appendTo(dateSelect.find('.options-list'));                
            }
        } else if (value == 'numeric') {
            var bounds = propVals ? propVals : ['',''];
            $('<div class="inline-text">Between</p>').appendTo(valuesDiv);
            $('<input type="text" class="integer">').appendTo(valuesDiv).val(bounds[0]);
            $('<div class="inline-text">and</div>').appendTo(valuesDiv);
            $('<input type="text" class="integer">').appendTo(valuesDiv).val(bounds[1]);
        } else if (value == 'boolean') {
            $('<div class="inline-text">True</div><div class="inline-text">False</div>').appendTo(valuesDiv);
        }
    }

    function newPropVal(typecastChoice, div, val, good) {
        var val = val ? val : '';
        var good = good == 'good' ? '' : 'no';
        var plusButton = div.find('.plus');

        // add property value input and delete button
        $('<input type="text" class="' + typecastChoice + '-val">').insertBefore(plusButton).val(val);
        $('<div class="delete-icon"></div>').insertBefore(plusButton);

        // align input fields
        var values = div.children('.' + typecastChoice + '-val');
        if (values.length > 0) {
            for (var valueId = 1; valueId < values.length; valueId++) {
                $(values[valueId]).css('margin-left', '60px');
            }
        }

        // append "good property" toggle
        var container = $('<div class="container good"></div>').insertBefore(plusButton);
        $('<div class="toggle ' + good + '"></div>').appendTo(container);

        // focus on property name if empty, otherwise focus on new property value
        if (div.parents('.property').find('.prop-name').val() == '') {
            div.parents('.property').find('.prop-name').focus();
        } else {
            div.find('.' + typecastChoice + '-val').last().focus();
        }
    }

    // add new property value
    $(eventSection).on('click', '.prop-values .plus', function() {
        var typecastChoice = $(this).parents('.prop-values').attr('class').split(' ')[1];
        var div = $(this).parents('.prop-values');
        var prevPropVal = $(this).prevAll('.' + typecastChoice + '-val').val();
        newPropVal(typecastChoice, div);
    });

    // ADD EVENT
    $('#add-event').click(function() {
        var prevEvent = $(this).prev('.event').find('.name').val();
        var prevEvents = $(this).siblings('.event');
        for (var eventId = 0; eventId < prevEvents.length; eventId++) {
            if ($(prevEvents[eventId]).css('display') != 'none') {
                $(prevEvents[eventId]).find('.collapse-expand').trigger('click');
            }
        }
        if (prevEvent || $(this).prev('.event').length == 0) {
            newEvent(events);
        }
    });

    // COLLAPSE AND EXPAND EVENTS
    // collapse
    $(eventSection).on('click', '.collapse-expand', function() {
        var id = $(this).parent().parent().attr('id');
        var eventName = $(this).siblings('.name').val();
        if (eventName == undefined || !eventName) {
            newAlert('No event name to save. Complete or delete event.');
            return;
        }
        var eventDiv = $(this).parents('.event');
        var namesDiv = eventSection.find('.event-names');
        eventDiv.hide();
        var collapseEvent = $('<div class="collapse-event" id="collapsed' + id + '"></div>').appendTo(namesDiv).text(eventName);

        // add dividers between multiple open events
        eventSection.find('hr').remove();
        if ($('.event:visible').length > 1) {
            $('<hr>').insertAfter('.event:visible:not(:last)');
        }
    });
    // expand
    $(eventSection).on('click', '.collapse-event', function() {
        var id = $(this).attr('id').substring(9);
        $('#' + id).show();
        $(this).remove();

        // add dividers between multiple open events
        eventSection.find('hr').remove();
        if ($('.event:visible').length > 1) {
            $('<hr>').insertAfter('.event:visible:not(:last)');
        }
    });

    // DELETE EVENTS, PROPERTIES, PROPERTY VALUES
    // delete event
    $(eventSection).on('click', '.event-name > .delete-icon', function() {
        var eventName = $(this).prev('.name.text').val();
        var deleteConfirm = window.confirm('Are you sure you want to delete this event?');
        if (deleteConfirm) {
            $(this).parents('.event').remove();
            var pathEvents = pathSection.find('.select-button:contains("' + eventName + '")');
            for (pathEvent = 0; pathEvent < pathEvents.length; pathEvent++) {
                $(pathEvents[pathEvent]).text('');
            }
        }
        updatePathEvents();

        // add dividers between multiple open events
        eventSection.find('hr').remove();
        if ($('.event:visible').length > 1) {
            $('<hr>').insertAfter('.event:visible:not(:last)');
        }
    });
    // delete property 
    $(eventSection).on('click', '.property > .delete-icon', function() {
        var noProps = false;
        if ($(this).parents('.properties').find('.property').length == 1) {
            noProps = true;
        }
        $(this).parent().remove();
        if (noProps) {
            $('.properties').find('.new-prop .plus').css('margin-top', '20px');            
        }
        else {
            $('.properties').find('.new-prop .plus').css('margin-top', '');            
        }
    });
    // delete property value (for string or list values)
    $(eventSection).on('click', '.prop-values > .delete-icon', function() {
        var typecast = $(this).parent().hasClass('string') ? 'string' : 'list';
        if ($(this).siblings('.' + typecast + '-val').length == 1) {
            newAlert('Must have at least one property value.');
            return;
        }
        $(this).prev('.' + typecast + '-val').remove();
        $(this).next('.container.good').remove();
        $(this).remove();
        $('.prop-values > .inline-text').next('.' + typecast + '-val').css('margin-left', '0px');
    });

    // TYPECAST PROPERTIES
    // show typecasting menu
    $(eventSection).on('click', '.typecast', function(e) {
        e.stopPropagation();
        $(this).find('.menu').toggle();
        $('.typecast').toggleClass('active');
        // click out of any other open menus
        $('.select-menu').hide();
        $('.select-button').removeClass('active');
    });
    // select typecast menu option
    $(eventSection).on('click', '.menu-item', function() {
        var propDiv = $(this).parent().parent().parent().parent();
        var selection = $(this).text().toLowerCase();
        var typecastIcon = $(this).parent().parent().parent().children('.typecast').children('.icon');

        // switch icon to correct type
        typecastIcon.removeClass();
        typecastIcon.addClass(selection + ' icon');

        newPropValues(selection, propDiv);
    });
    // click out of typecast menu
    $('body').on('click', ':not(.typecast)', function(e) {
        e.stopPropagation();
        $('.typecast').removeClass('active');
        $('.menu').hide();
    });

    // DATE VALUES
    $(eventSection).on('click', '.select-button, .select-button > *', function() {
        $(this).siblings('.select-menu').toggle();
        $(this).siblings('.select-menu').find('.search-box').focus();
        $(this).toggleClass('active');
    });
    // select event from dropdown
    $(eventSection).on('click', '.select-option', function() {
        var selected = $(this).text();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        $(this).parent().parent().siblings('.select-button').removeClass('active').html('<div class="remove-step"></div><p>' + selected + '</p><div class="down-arrow"></div>');
        $('.select-menu').hide();
    });

    // highlight property section when appropriate inputs gain focus
    $(eventSection)
        .on('focusin', 'input', function() {
            $(this).parents('.property').addClass('hovered');
        })
        .on('focusout', 'input', function() {
            $(this).parents('.property').removeClass('hovered');
        });

    // add a first event to the event builder
    newEvent(events);

});