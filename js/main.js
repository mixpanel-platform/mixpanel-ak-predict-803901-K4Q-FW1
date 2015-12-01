$(document).ready(function() {

/// overall

    //mixpanel.dm.track('View Page', {
    //     'Page Name': 'Builder',
    // });
    //mixpanel.dm.identify();

    var baseEndpoint = '/admin/internal/dungeon_master_2';

    loadedDungeon = 0;
    loadedDungeonUser = '';
    loadedDungeonName = '';

    var eventSection = $('#events > .expanded');
    var pathSection = $('#paths > .expanded');
    var configSection = $('#config > .expanded');

    var events = 0;
    var paths = 0;

    // collect current values for all sections
    savedValues = {};
    function updateValues(object) {
        object['events'] = collectEvents();
        object['paths'] = collectPaths();
        object['config'] = collectConfig();
        object['name'] = collectName();
        object['industry'] = collectIndustry();
    }
    updateValues(savedValues);
    // start timing for save dungeon event
    //mixpanel.dm.time_event('Save Dungeon');

    // make sure changed inputs are not lost by accidental reload or back navigation
    window.onbeforeunload = confirmExit;
    function confirmExit() {
        var currentValues = {};
        updateValues(currentValues);
        if (JSON.stringify(currentValues) != JSON.stringify(savedValues)) {
            return "You have unsaved changes."
        }
    }

    // navigate between steps
    $('.collapsed').click(function(e) {
        e.stopPropagation();

        if ($(this).parent().children('.expanded:visible').length > 0) {
        	collapseSteps();
        } else {
	        $(this).siblings('.expanded').width('1050px');
	        var newHeight = $(this).siblings('.expanded').height() + 60;

	        // expand this section
	        $(this).parent().animate({
	            height: newHeight,
	            'width': '1050px',
	            opacity: 1
	        }, 500, function() { 
	            // reset height
	            $(this).height('');
	        });
	        // show expanded div in section
	        $(this).siblings('.expanded').delay(300).animate({
	            opacity: 'show'
	        }, 500, function() {
                // focus on event input in event section
                if ($(this).parent().attr('id') == 'events') {
                    $(this).find('.name').focus();
                }
            });
	        // collapse other sections
	        $(this).parent().siblings('.section').not('#search, .help').animate({
	            width: '700px',
	            height: '60px',
	            opacity: 0.4
	        }, 500);
	        $(this).parent().siblings('.section').not('#search, .help').find('.expanded').fadeOut(500);

            // start timing 'complete section' events when sections open
            if ($(this).parent().attr('id') == 'events') {
                //mixpanel.dm.time_event('Complete Event Section');
	        } else if ($(this).parent().attr('id') == 'paths') {
                //mixpanel.dm.time_event('Complete Path Section');
                // update path events if opening the paths section
	            updatePathEvents();
	        }
        }
    });

    // complete step
    $('body').on('click', '.button.next.done', function() {
        var sectionDiv = $(this).parents('.section').attr('id');
        if (sectionDiv == 'events') {
            // track event
            var numEvents = $('#events').find('.event').find('.name').filter(function() {return $(this).val() != ''}).length;
            var numProps = $('#events').find('.property').find('.prop-name').filter(function() {return $(this).val() != ''}).length;
            var numSuper = $('#events').find('.property').find('.prop-name').filter(function() {return $(this).val() != ''}).parents('.property').find('.container.super').find('.toggle:not(.no)').length;
            var allTypes = $('#events').find('.property').find('.prop-name').filter(function() {return $(this).val() != ''}).parents('.property').find('.typecast > .icon');
            var propTypes = [];
            $.each(allTypes, function(i, icon) {
                var type = $(icon).attr('class').slice(5);
                if ($.inArray(type, propTypes) === -1) propTypes.push(type);
            });
            //mixpanel.dm.track('Complete Event Section', {
            //     'Total Events': numEvents,
            //     'Total Properties': numProps,
            //     'Total Super/People Properties': numSuper,
            //     'All Property Types': propTypes,
            // });
        } else if (sectionDiv == 'paths') {
            // track event
            var allPaths = $('#paths').find('.path');
            var goodPaths = {'required': [], 'required events': 0, 'usage': [], 'usage events': 0};
            $.each(allPaths, function(i, path) {
                var pathType = $(path).parent().attr('class');
                $.each($(path).find('.select-button'), function(i, button) {
                    if ($(button).text() != '-- Select first event --' && $(button).text() != '-- Select next event --') {
                        if ($.inArray(path, goodPaths[pathType]) === -1) {
                            goodPaths[pathType].push(path);
                        }
                        goodPaths[pathType + ' events'] ++;
                    }
                });
            });
            var numRequired = goodPaths['required'].length;
            var numUsage = goodPaths['usage'].length;
            var numRequiredEvents = goodPaths['required events'];
            var numUsageEvents = goodPaths['usage events'];
            var numUnused = $('#paths').find('.collapse-event').length;
            // //mixpanel.dm.track('Complete Path Section', {
            //     'Total Paths': numRequired + numUsage,
            //     'Usage Paths': numUsage,
            //     'Required Paths': numRequired,
            //     'Unused Events': numUnused,
            //     'Usage Path Events': numUsageEvents,
            //     'Required Path Events': numRequiredEvents,
            // });
        } else if (sectionDiv == 'config') {
            // save or save & download dungeon depending on button clicked
            if ($(this).text() == 'SAVE') {
                var saved = saveDungeon(false);
            } else if ($(this).text() == 'SAVE & DOWNLOAD') {
                var saved = saveDungeon(true);
            }
        }

        // if config section has errors, don't collapse it
        if (saved == 'stop') {
        	return;
        }
        else {
	        // collapse this section
	        $(this).parents('.expanded').hide();
	        $(this).parents('.section').animate({
	            'width': '700px',
	            height: '60px',
	            opacity: 0.4
	        }, 500);
	        // expand next section (if there is one)
	        $(this).parents('.section').next().children('.collapsed').trigger('click');        	
        }
    });

    // collapse all steps
    function collapseSteps() {
        $('.section').not('#search, .help').animate({
            width: '700px',
            height: '60px',
            opacity: 1
        }, 500);
        $('.section').not('#search, .help').find('.expanded').fadeOut(500);
    }
    // collapse steps if anything outside a step is clicked
    $('body').on('click', function(e) {// ':not(.section, .section *, .alert, .alert *, .fade)', function(e) {
        // if the element is being removed, do not collapse section
        if ($(e.target).attr('class') == 'delete-icon' || $(e.target).attr('class') == 'remove-step' || $(e.target).attr('class') == 'collapse-event') {
            return;
        }
        collapseSteps();
    });

    // load dungeon from url if applicable
    function getQueryVariable(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split('&');
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == variable) {
                return decodeURIComponent(pair[1]);
            }
        }
        return '';
    }
    var selectedId = getQueryVariable('id');
    window.onload = function() {
        if (selectedId) {
            getDungeon(selectedId);
            $('.select-option.multi#dungeon' + selectedId).addClass('selected');
            $('.select-option.multi#dungeon' + selectedId).siblings('.select-option.multi').removeClass('selected');
            // make sure no properties are highlighted
            $('.property').removeClass('hovered');
        }
    }

    // open events section
    $('#events > .collapsed').delay(500).trigger('click');
    updatePathEvents();

    // floating navigation menu
    var lastScrollTop = 0;
    $(window).scroll(function(event){
        var st = $(this).scrollTop();
        if (st > lastScrollTop && document.body.scrollTop > 150){
            $('.mini-nav').stop().animate({'top': '0'}, 500);
        } else  if (st < lastScrollTop && document.body.scrollTop < 200) {
            $('.mini-nav').stop().hide().css({'top': '-57px', 'display': ''});
        }
        lastScrollTop = st;
    });

    // nav items
    $('.home-nav').click(function() {
        //mixpanel.dm.track('Click Nav', {
        //     'Nav Item': 'Home',
        // });
    });
    $('.new-nav').click(function() {
        //mixpanel.dm.track('Click Nav', {
        //     'Nav Item': 'New',
        // });
        // go to builder page
        window.location.href = baseEndpoint + '/builder/';
    });
    $('.eternal-nav').click(function() {
        //mixpanel.dm.track('Click Nav', {
        //     'Nav Item': 'Eternal',
        // });
        // show eternal
    });
    $('.help-nav').click(function() {
        //mixpanel.dm.track('Click Nav', {
        //     'Nav Item': 'Help',
        // });
        // collapse other sections
        $('#search').fadeOut(500);
        collapseSteps();

        // show help modal
        $('.help').fadeIn(500);
        $('.fade').fadeIn(500);
    });

    // close help and search modals
    $('.fade, .close, .get-started').click(function() {
        $('#search').fadeOut(500);
        $('.help').fadeOut(500);
        $('.fade').fadeOut(500);        
    });

    // show tooltips
    $('body').on('mouseenter', '.tooltip', function() { 
        $(this).siblings('.tooltip-content').fadeIn(500); 
    }).on('mouseleave', '.tooltip', function() {
        $(this).siblings('.tooltip-content').fadeOut(500);
    });

    // show alerts
    function newAlert(string) {
        var alert = $('<div class="alert"><div class="alert-title">Error</div><div class="alert-content">' + string + '</div><div class="alert-ok button next">OK</div></div>');
        $('.fade').clone().addClass('alert-fade').appendTo('body').fadeIn(200);
        alert.appendTo('header').fadeIn(200);
    }
    // close alerts
    $('body').on('click', '.alert-ok', function() {
        $('.fade.alert-fade').remove();
        $('.alert').remove();
    });

    // toggles
    $('.expanded').on('click', '.toggle', function() {
        $(this).toggleClass('no');
    });
    // checkboxes
    $('.checkbox-option:not(.disabled)').click(function() {
        $(this).toggleClass('selected');
    });
    // radio buttons
    $('.radio').click(function() {
        $('<div class="radio-selected"></div>').appendTo($(this)).animate({'opacity': 1}, 200);
        $(this).parent().siblings('.check').find('.radio-selected').remove();
    });

    // DROPDOWNS
    // show dropdown when button is clicked
    // $('body').on('click', '.select-button, .select-button > *:not(.remove-step)', function(e) {
    //     e.stopPropagation();
    //     // hide this menu if open
    //     if ($(this).parents('.dropdown-parent').find('.select-menu:visible').length > 0) {
    //         $('.select-menu').hide();
    //         $('.select-button').removeClass('active');
    //     }
    //     else {
    //         // show applicable menu
    //         $(this).parents('.dropdown-parent').find('.select-menu').toggle();
    //         $(this).parents('.dropdown-parent').find('.select-menu').find('.search-box').focus();
    //         $(this).parents('.dropdown-parent').find('.select-button').toggleClass('active');
    //     }
    //     // hide any other open menus
    //     $('.select-menu').not($(this).parents('.dropdown-parent').find('.select-menu')).hide();
    //     $('.select-button').not($(this).parents('.dropdown-parent').find('.select-button')).removeClass('active');
    // });

    // select option from dropdown
    $('body').on('click', '.select-option:not(#search .select-option)', function() {
        var selected = $(this).text();
        $(this).addClass('selected');
        $(this).siblings().removeClass('selected');
        $(this).parents('.dropdown-parent').find('.select-button').removeClass('active');
        $(this).parents('.dropdown-parent').find('.select-button > p').text(selected);
        $('.select-menu').hide();

        // update path events and hide delete buttons if needed (i.e., if path event dropdown)
        if ($(this).parents('.dropdown-parent').hasClass('path-event')) {
            $(this).parents('.dropdown-parent').find('.select-button').css('border', '1px solid #cbcfd9');
            updatePathEvents();
            $('.remove-step').hide();
        }
    });
    // search for events in path dropdowns
    $(pathSection).on('change keydown keyup', '.search-box', function() {
        var searchText = $(this).val().toLowerCase();
        var options = $(this).parent().siblings('.options-list').children();
        for (var option = 0; option < options.length; option++) {
            var eventName = options[option]
            if ($(eventName).text().toLowerCase().indexOf(searchText) == -1) {
                $(eventName).hide();
            }
            else {
                $(eventName).show();
            }
        }
    });
    // click out of dropdowns
    $('body').on('click', ':not(.select-menu, .select-button, .search-box, .select-button > *)', function(e) {
        e.stopPropagation();
        $('.select-button').removeClass('active');
        $('.select-menu').hide();
    });

    // keyboard shortcuts
    $(document).keydown(function(e) {
        var $current = $(document.activeElement);
        // escape key
        if (e.keyCode == 27) {
            // escape out of dropdowns
            $('.select-button').removeClass('active');
            $('.select-menu').hide();
            // escape out of typecast menus
            $('.typecast').removeClass('active');
            $('.menu').hide();
            // escape out of modals
            $('.fade').trigger('click');
        } else if (e.keyCode == 13) {
            // enter
            // if in a dropdown, select first event in dropdown
            if ($('.select-button').hasClass('active')) {
                var firstOption = $('.select-button.active').siblings().find('.select-option:visible').first();
                $(firstOption).trigger('click');
            }
            // if in event input, add a new event
            if ($current.is('.name')) {
                $('#add-event').trigger('click');
            }
            // if in a property section, add a new property
            if ($current.parents('.property').length > 0) {
                $('.new-prop').find('.plus').trigger('click');
            }
        } else if (e.keyCode == 9 && e.shiftKey) {
            // not shift-tab
            $.noop();
        } else if (e.keyCode == 9) {            
            // tab
            if ($current.is('input.name')) {
                // if event has no properties, create new property when tab is pressed
                if ($current.parent().siblings('.properties').children('.property').length == 0) {
                    $current.parent().siblings('.properties').find('.plus').trigger('click');
                }
            } else if (($current.is('.string-val') && $current.nextAll('.string-val').length == 0) || ($current.is('.list-val') && $current.nextAll('.list-val').length == 0)) {
                // if creating string/list values and there are no other inputs to tab to, add another value
                if ($current.is($('#events').find('input').last())) {
                    $current.parents('.prop-values').find('.plus').trigger('click');
                }
            }
        }
    });


/// events

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
        addProp.appendTo(newProp).css('margin-top', '20px');

        // focus on event name input
        eventDiv.find('.name').focus();

        events ++;
    }
    // add new event
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

    function newProperty(propDiv, val, type, superp, propVals) {
        var val = val ? val : '';
        var type = type ? type : 'string';
        var superp = superp == 'true' ? '' : 'no';
        var addPropDiv = propDiv.find('.new-prop');

        // add property div to event properties div
        var newPropDiv = $('<div class="property"></div>').insertBefore(addPropDiv);

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

        setTimeout(function() {
            // focus on property name input
            if (!selectedId) {
                propDiv.find('.prop-name').focus();
            }            
        });
    }
    // add new property
    $(eventSection).on('click', '.new-prop > .plus', function() {
        var propDiv = $(this).parents('.properties');
        new newProperty(propDiv);
        $(this).css('margin-top', '')
    });

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
            var dateSelect = $('<div class="date-select dropdown-parent"></div>').appendTo(valuesDiv);
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
            var types = propVals ? propVals : {'True': 'bad', 'False': 'bad'};
            if ($.isArray(types)) types = {'True': 'bad', 'False': 'bad'};
            $.each(Object.keys(types), function(i, propVal) {
                var good = types[propVal] == 'bad' ? 'no' : '';
                $('<div class="boolean-val"><div class="inline-text">' + propVal[0].toUpperCase() + propVal.substring(1) + '</div><div class="container good"><div class="toggle ' + good + '"></div></div></div>').appendTo(valuesDiv);
            });
        }

        setTimeout(function() {
            // focus on first new input
            if (!selectedId) {
                div.find('.prop-values').find('input').filter(function() {return $(this).val() == ''}).first().focus();
            }
        });
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

        setTimeout(function() {
            // focus on new property value
            if (!selectedId) {
                div.find('.' + typecastChoice + '-val').last().focus();
            }
        });
    }
    // add new property value
    $(eventSection).on('click', '.prop-values .plus', function() {
        var typecastChoice = $(this).parents('.prop-values').attr('class').split(' ')[1];
        var div = $(this).parents('.prop-values');
        var prevPropVal = $(this).prevAll('.' + typecastChoice + '-val').val();
        newPropVal(typecastChoice, div);
    });

    // validate numeric inputs
    function validateInput(inputElement) {
        var value = $(inputElement).val();
        if (!isNaN(parseInt(value))) {
            $(inputElement).css('border', '1px solid #bdc7d2');
        }
        else {
            $(inputElement).css('border', '1px solid red');
        }                                    
    }
    // validate numeric values as applicable inputs lose focus
    $('body').on('focusout', '.numeric input', function() {
        validateInput($(this));
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
            updatePathEvents();
        }

        // add dividers between multiple open events
        eventSection.find('hr').remove();
        if ($('.event:visible').length > 1) {
            $('<hr>').insertAfter('.event:visible:not(:last)');
        }
    });
    // delete property 
    $(eventSection).on('click', '.property > .delete-icon', function() {
        var noProps = ($(this).parents('.properties').find('.property').length == 1) ? true : false;
        $(this).parent().remove();
        if (noProps) {
            $('.properties').find('.new-prop .plus').css('margin-top', '20px');            
        } else {
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
        $(this).toggleClass('active');
        // click out of any other open menus
        $('.select-menu').hide();
        $('.select-button').removeClass('active');
    });
    // select typecast menu option
    $(eventSection).on('click', '.typecast .menu-item', function() {
        var propDiv = $(this).parents('.property');
        var selection = $(this).text().toLowerCase();
        var typecastIcon = $(this).parents('.typecast').children('.icon');

        // switch icon to correct type
        typecastIcon.removeClass();
        typecastIcon.addClass('icon ' + selection);

        newPropValues(selection, propDiv);
    });
    // click out of typecast menu
    $('body').on('click', ':not(.typecast)', function(e) {
        e.stopPropagation();
        $('.typecast').removeClass('active');
        $('.menu').hide();
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
    if (!selectedId) {
        newEvent(events);        
    }


/// paths

    function newPath(i, type, pathName, pathEvents) {
        var div = type == 'required' ? $('.required') : $('.usage');
        var pathName = pathName ? pathName : '';
        var pathEvents = pathEvents ? pathEvents : ['-- Select first event --'];
        var addPathButton = div.find('.button.next-path');

        // if it's a second path in the same section, add a line between paths
        if (div.find('.path').length > 0) {
            $('<hr>').insertBefore(addPathButton);            
        }
        
        // add path div to required or usage section and add event dropdown to new path
        var pathDiv = $('<div class="path" id="path' + i + '"></div>').insertBefore(addPathButton);
        var nameHolder = $('<div class="path-name-holder"></div>').appendTo(pathDiv);
        $('<input placeholder="Path Name" type="text" class="path-name">').appendTo(nameHolder).val(pathName);
        $('<div class="delete-icon"></div>').appendTo(nameHolder);
        var pathEventDiv = $('<div class="path-event-names"></div>').appendTo(pathDiv);
        $('<div class="plus" style="display: inline-block; vertical-align: 1px;"></div>').appendTo(pathEventDiv);

        for (i = 0; i < pathEvents.length; i++) {
            newPathEvent(pathEventDiv, type, pathEvents[i]);
        }

        updateRequired();
        paths++;
    }
    // add new path
    $(pathSection).on('click', '.button.next-path', function() {
        var type = $(this).parent().attr('class');
        newPath(paths, type);
    });

    function updateRequired() {
        // show "ADD PATH" button in required section section only if there isn't one
        if ($('.required > .path').length > 0) {
            $('.required > .button.next-path').hide();
        }
        else {
            $('.required > .button.next-path').show();
        }
    }

    function newPathEvent(pathDiv, type, eventName) {
        var eventName = eventName ? eventName : '-- Select next event --';
        var addEventButton = pathDiv.find('.plus');

        var pathEventHTML = $('<div class="path-event dropdown-parent"></div>').insertBefore(addEventButton);
        var pathEventInnerHTML = $('<div class="select-button"><div class="remove-step"></div><p>' + eventName + '</p><div class="down-arrow"></div></div><div class="select-menu"><div class="search-box-container"><input class="search-box"></div><div class="options-list"></div></div>');
        pathEventInnerHTML.appendTo(pathEventHTML);

        updatePathEvents();

        $('<div class="right-arrow"></div>').insertBefore(addEventButton);
    }
    // add new path event
    $(pathSection).on('click', '.path-event-names > .plus', function() {
        var pathDiv = $(this).parent();
        var type = pathDiv.parent().parent().attr('id');

        newPathEvent(pathDiv, type);
    });

    function updatePathEvents() {
        var eventDivs = eventSection.find('.event');
        var pathEventNames = pathSection.find('.path-event').find('.select-button > p');
        var options = $('.path-event').find('.options-list');

        // loop through path events and make sure all events are still there
        for (pathEvent = 0; pathEvent < pathEventNames.length; pathEvent++) {
            // if the path event has an event selected, and that event is not in the updated event list
            if ($(pathEventNames[pathEvent]).text() != '-- Select first event --'
                && $(pathEventNames[pathEvent]).text() != '-- Select next event --'
                && eventDivs.filter(function() { 
                    return $(this).find('.name').val() == $(pathEventNames[pathEvent]).text()
                }).length == 0) {
                // reset the path event dropdown to select text
                if ($(pathEventNames[pathEvent]).is($(pathEventNames[pathEvent]).parents('.path-event-names').find('.select-button > p').first())) {
                    $(pathEventNames[pathEvent]).text('-- Select first event --');
                } else {
                    $(pathEventNames[pathEvent]).text('-- Select next event --');
                }
                // let user know the event name has been removed from the path event
                $(pathEventNames[pathEvent]).parents('.select-button').css('border', '1px solid red');
            }
        }

        // remove all current menu options and unused events in case any have been deleted or changed
        $(options).children().remove();
        pathSection.find('.collapse-event').remove();

        // loop through all events
        for (eventId = 0; eventId < eventDivs.length; eventId++) {
            var name = $(eventDivs[eventId]).find('.name.text').val();
            var divId = $(eventDivs[eventId]).attr('id');
            // if there is an event to add
            if (name != '') {
                $('<div class="select-option option' + divId + '">' + name + '</div>').appendTo(options);
                // only if the event is actually unused in a path, add it to unused events
                if ($('.select-button > p').filter(function() {return $(this).text() === name}).length == 0) {
                    $('<div class="collapse-event" id="unused' + divId + '"></div>').appendTo(pathSection.find('.event-names')).text(name).fadeIn(500);
                }
            }
        }
        // show unused events section only if there are unused events
        if ($('.event-names.unused').find('.collapse-event').length == 0) {
            $('.event-names.unused').hide();
        }
        else {
            $('.event-names.unused').show();
        }
    }

    // DELETE PATHS, PATH EVENTS
    // delete path
    $(pathSection).on('click', '.path .delete-icon', function() {
        $(this).parents('.path').next('hr').remove();
        if ($(this).parents('.path').nextAll('.path').length == 0) {
            $(this).parents('.path').prev('hr').remove();
        }

        $(this).parents('.path').remove();
        updateRequired();
        updatePathEvents();
    });
    // show delete button when mousing over a path event
    $(pathSection).on('mouseenter', '.path-event', function() { 
        $(this).find('.select-button').find('.remove-step').css('display', 'inline-block'); 
        $(this).find('.select-button > p').css('max-width', '145px');
    }).on('mouseleave', '.path-event', function() {
        $(this).find('.select-button').find('.remove-step').hide();
        $(this).find('.select-button > p').css('max-width', '');
    });
    // delete path event
    $(pathSection).on('click', '.remove-step', function() {
        if ($(this).parent().parent().siblings('.path-event').length == 0) {
            newAlert('Must have at least one event in a path.');
        }
        else {
            $(this).parent().parent().next('.right-arrow').remove();
            $(this).parent().parent().remove();
            updatePathEvents();
        }
    });

    // add one required path and one usage path to paths section when document loads
    if (!selectedId) {
        newPath(paths, 'required');
        newPath(paths, 'usage');        
    }


/// save dungeon

    function collectEvents(validate) {
        eventErrors = 0;
        var eventjson = {};
        var eventList = $('#events').find('.event');

        for (var eventId = 0; eventId < eventList.length; eventId++) {
            var eventDiv = $(eventList[eventId]);
            var eventName = eventDiv.children('.event-name').find('input').val();

            if (eventName != '') {
                eventjson[eventName] = {};
                // if there are any properties, collect them
                if (eventDiv.find('.property').length != 0) {
                    collectProperties(eventDiv, eventName, eventjson, validate);
                }
            }
        }
        if (validate) {
            if ($.isEmptyObject(eventjson)) {
                eventErrors ++;
                newAlert('Must have at least one event.');
            }        
            if (eventErrors > 0) {
                $('#events > .collapsed').trigger('click');
                var errorInputs = $('#events input').filter(function() {
                    return $(this).css('border') == '1px solid rgb(255, 0, 0)';
                });
                for (i = 0; i < errorInputs.length; i++) {
                    var eventId = $(errorInputs[i]).parents('.event').attr('id');
                    $('#collapsed' + eventId).trigger('click');
                }
                return 'stop';
            }
        }
        return eventjson;
    }

    function collectProperties(eventDiv, eventName, eventjson, validate) {
        var propList = eventDiv.find('.property');

        for (var propId = 0; propId < propList.length; propId++) {
            var propDiv = $(propList[propId]);
            
            var propName = propDiv.children('.prop-name').val();
            if (propName != '') {
                eventjson[eventName][propName] = {};
                
                var type = propDiv.find('.typecast').children('.icon').attr('class').split(' ')[1];
                eventjson[eventName][propName]['type'] = type;

                var regular = propDiv.find('.container.super').find('.toggle').hasClass('no');
                eventjson[eventName][propName]['super'] = regular ? "false" : "true";

                collectPropertyValues(propDiv, propName, eventName, eventjson, validate);
            }
        }
    }

    function collectPropertyValues(propDiv, propName, eventName, eventjson, validate) {
        var valuesDiv = propDiv.find('.prop-values');

        // collect values based on property type
        if ($(valuesDiv).hasClass('boolean')) {
            var good1 = valuesDiv.find('.toggle').first().hasClass('no') ? 'bad' : 'good';
            var good2 = valuesDiv.find('.toggle').last().hasClass('no') ? 'bad' : 'good';
            eventjson[eventName][propName]['values'] = {'true': good1, 'false': good2}
        }
        else if ($(valuesDiv).hasClass('numeric')) {
            var values = [];
            var inputList = $(valuesDiv).find('input');
            for (var inputId = 0; inputId < inputList.length; inputId++) {
                var value = $(inputList[inputId]).val();
                if (validate) {
                    if (value != '' && !isNaN(parseInt(value))) {
                        values.push($(inputList[inputId]).val());
                        $(inputList[inputId]).css('border', '1px solid #bdc7d2');
                    }
                    else {
                        eventErrors ++;
                        $(inputList[inputId]).css('border', '1px solid red');
                    }                                    
                }
            }
            eventjson[eventName][propName]['values'] = values;
        }
        else if ($(valuesDiv).hasClass('date')) {
            var selectionText = $(valuesDiv).find('p').text();
            selection = selectionText.indexOf('Date of first') > -1 ? 'first' : 'last';
            eventjson[eventName][propName]['values'] = selection;
        }
        else if ($(valuesDiv).hasClass('string') || $(valuesDiv).hasClass('list')) {
            var values = {};
            var inputList = $(valuesDiv).find('input');
            for (var inputId = 0; inputId < inputList.length; inputId++) {
                var valueDiv = $(inputList[inputId]);
                if (valueDiv.val() != '') {
                    var bad = valueDiv.nextAll('.container.good').first().find('.toggle').hasClass('no');
                    values[valueDiv.val()] = bad ? 'bad' : 'good';
                }
            }
            if (validate) {
                if ($.isEmptyObject(values)) {
                    eventErrors ++;
                    $(inputList).css('border', '1px solid red');
                }
                else {
                    $(inputList).css('border', '1px solid #bdc7d2')
                }                                    
            }
            eventjson[eventName][propName]['values'] = values;
        }
        else {
            console.log('cannot read type of property values');
            if (validate) {
                eventErrors++;
                newAlert('Unknown Error');
            }
        }
    }

    function collectPaths() {
        var pathjson = {'required': {}, 'usage': {}};

        // loop through all paths to add to path JSON object
        var pathList = $('#paths').find('.path');
        for (var pathId = 0; pathId < pathList.length; pathId++) {
            var pathDiv = $(pathList[pathId]);
            // required or usage path?
            var type = pathDiv.parent().attr('class');
            
            // loop through each event in a path
            var events = [];
            var pathEventList = pathDiv.find('.path-event');
            for (var pathEventId = 0; pathEventId < pathEventList.length; pathEventId++) {
                var eventName = $(pathEventList[pathEventId]).find('.select-button > p').text();
                if (eventName != '-- Select first event --' && eventName != '-- Select next event --' && eventName != '') {
                    events.push(eventName);
                }
            }
            if (events.length > 0) {
                // collect or assign path name
                var name = pathDiv.find('.path-name').val();
                var pathName = name == '' ? events[0] + ' > ' + events[events.length-1] : name;                
                // append path name & array of events to correct path type (required or usage)
                pathjson[type][pathName] = events;
            }
        }

        // grab all unused events and add to 'unused' funnel in 'usage' object
        var unusedList = $('.event-names.unused').find('.collapse-event');
        pathjson['usage']['unused'] = []
        for (var unusedId = 0; unusedId < unusedList.length; unusedId++) {
            pathjson['usage']['unused'].push($(unusedList[unusedId]).text());
        }

        return pathjson;
    }

    function collectConfig(validate) {
        var platforms = [];
        var platformList = $('#platforms').find('.checkbox-option');
        for (var id = 0; id < platformList.length; id++) {
            if ($(platformList[id]).hasClass('selected')) {
                platforms.push($(platformList[id]).next('.checkbox-label').text());
            }
        }

        var weekend = $('#weekend-dip').find('.toggle').hasClass('no') ? "false" : "true";

        // var autoInc = $('#auto-increment').hasClass('selected') ? true : false;
        // var autoFirst = $('#auto-first-date').hasClass('selected') ? true : false;
        // var autoLast = $('#auto-last-date').hasClass('selected') ? true : false;

        var notifications = [];
        var notificationList = $('#notification-type').find('.checkbox-option');
        for (var id = 0; id < notificationList.length; id++) {
            if ($(notificationList[id]).hasClass('selected')) {
                notifications.push($(notificationList[id]).next('.checkbox-label').text());
            }
        }
        // var notification = $('#notification-type').find('.radio-selected').parent().siblings('.radio-label').text();

        return {'platforms': platforms, 'weekend_dip': weekend, 'notifications': notifications}
    }

    function collectIndustry(validate) {
        var industry = $('#config .industry-select').find('p').text();

        if (validate) {
            if (industry == '-- Select Industry --') {
                var dungeonName = $('#dungeon-name').find('input').val();
                if (dungeonName == '' || !dungeonName) {
                    $('#dungeon-name').find('input').css('border', '1px solid red');
                } else {
                    $('#dungeon-name').find('input').css('border', '1px solid #bdc7d2');
                }

                $('#config .industry-select').find('.select-button').css('border', '1px solid red');
                return 'stop';
            }
            else {
                $('#config .industry-select').find('.select-button').css('border', '1px solid #cbcfd9');            
            }
        }
        return industry;
    }

    function collectName(validate) {
        var dungeonName = $('#dungeon-name').find('input').val();
        if (validate) {
            if (dungeonName == '' || !dungeonName) {
                var industry = $('#config .industry-select').find('p').text();
                if (industry == '-- Select Industry --') {
                    $('#config .industry-select').find('.select-button').css('border', '1px solid red');
                } else {
                    $('#config .industry-select').find('.select-button').css('border', '1px solid #cbcfd9');                                
                }

                $('#dungeon-name').find('input').css('border', '1px solid red');
                return 'stop';
            }
            else {
                $('#dungeon-name').find('input').css('border', '1px solid #bdc7d2');
            }        
        }
        return dungeonName;
    }

    // function getCurrentUser() {
    //     if (window.location.hostname == 'dm2.dev') {
    //         window.user = {firstName: "Laura", lastName: "Del Beccaro", email: "laura@mixpanel.com"}
    //     }
    //     currentUser = window.user.firstName + ' ' + window.user.lastName[0] + '.';
    //     //mixpanel.dm.people.set({
    //     //     '$first_name': window.user.firstName,
    //     //     '$last_name': window.user.lastName,
    //     //     '$email': window.user.email,
    //     // });
    //     //mixpanel.dm.register({
    //     //     'Name': window.user.firstName + ' ' + window.user.lastName,
    //     //     'Email': window.user.email,
    //     // });
    // }
    // getCurrentUser();

    function saveDungeon(download) {
        var download = download ? true : false;
        var eventjson = collectEvents(true);
        if (eventjson == 'stop') {
            return;
        }

        var pathjson = collectPaths();

        var configjson = collectConfig(true);
        if (configjson == 'stop') {
            return 'stop';
        }
        var name = collectName(true);
        if (name == 'stop') {
            return 'stop';
        }
        var industry = collectIndustry(true);
        if (industry == 'stop') {
            return 'stop';
        }

        dungeon(eventjson, pathjson, configjson, name, industry, download);
    }

    function trackDungeonSave(eventjson, pathjson, configjson, name, industry, download) {
        // track event
        //mixpanel.dm.track('Save Dungeon', {
        //     'Download': download,
        //     'Industry': industry,
        //     'Dungeon Name': name,
        //     'Author': currentUser,
        //     'Platforms': configjson.platforms,
        //     'Weekend Dip': configjson.weekend,
        //     'Pre-generated Notifications': configjson.notifications,
        //     'Total Events': Object.keys(eventjson).length,
        //     'Total Paths': Object.keys(pathjson.required).length + Object.keys(pathjson.usage).length - 1, // subtract unused event list
        //     'Required Paths': Object.keys(pathjson.required).length,
        //     'Usage Paths': Object.keys(pathjson.usage).length - 1, // subtract unused event list
        //     'Unused Events': pathjson.usage.unused.length,
        // });
        var downloadIncrement = download ? 1 : 0;
        //mixpanel.dm.people.increment({
        //     'Lifetime Dungeon Saves': 1,
        //     'Lifetime Dungeon Downloads': downloadIncrement,
        //     'Lifetime Dungeon Events': Object.keys(eventjson).length,
        //     'Lifetime Dungeon Paths': Object.keys(pathjson.required).length + Object.keys(pathjson.usage).length - 1, // subtract unused event list
        // })
        // start timing for next save
        //mixpanel.dm.time_event('Save Dungeon');
    }

    function dungeon(eventjson, pathjson, configjson, name, industry, download) {
        var dungeon = {'name': name, 'industry': industry, 'meta': {'events': eventjson, 'paths': pathjson, 'config': configjson}}

        // send to django
        // check if updating existing dungeon or posting a new one
        if (loadedDungeon > 0 && loadedDungeonName == name && loadedDungeonUser == currentUser) {
            var overwrite = false;

            // only confirm if values have changed
            var currentValues = {};
            updateValues(currentValues);
            if (JSON.stringify(currentValues) != JSON.stringify(savedValues)) {
                overwrite = window.confirm('This will update and overwrite the current dungeon. Change the name of the dungeon to save a new one. Proceed?');
            }
            else {
                overwrite = true;
            }

            if (overwrite) {
                $.ajax({
                    url: baseEndpoint + '/dungeons/' + loadedDungeon + '/',
                    type: 'PUT',
                    data: JSON.stringify(dungeon),
                    success: function(result) {
                        console.log(result);
                        result = JSON.parse(result);
                        saveLoadedDungeon(result);
                    }
                });
                trackDungeonSave(eventjson, pathjson, configjson, name, industry, download);
            }
            else {
                download = false;
            }
        }
        else {
            $.post(baseEndpoint + '/dungeons/', JSON.stringify(dungeon), function(result) {
                console.log(result);
                result = JSON.parse(result);
                saveLoadedDungeon(result);
            });
            trackDungeonSave(eventjson, pathjson, configjson, name, industry, download);
        }
        console.log(JSON.stringify(dungeon));

        if (download) {
            // don't confirm window exit when navigating to download script
            window.onbeforeunload = null;
            // download python script
            var input = $('<input>').attr({
                type: 'hidden',
                name: 'meta'
            }).val(JSON.stringify(dungeon));

            $('<form>').append(input).attr({ action: '../script/', method: 'post'}).submit();
            // go back to confirming an exit in case any values are changed
            setTimeout(function() {window.onbeforeunload = confirmExit});
        }
    }


/// load dungeons

    function getDungeon(id) {
        // var dungeonData = "{\"author\": \"Andy K.\", \"industry\": \"Finance\", \"meta\": {\"paths\": {\"usage\": {\"unused\": [\"View Payment Activity\", \"View Screen\", \"Modify Alerts\", \"Browse Financial Products\"], \"Pay Bill\": [\"App Open\", \"View Balance\", \"Pay My Bill\", \"Payment Completed\"], \"Credit Tracker\": [\"App Open\", \"Credit Tracker\"]}, \"required\": {\"Signup\": [\"App Open\", \"Enter Pin\", \"Registration\"]}}, \"config\": {\"platforms\": [\"iOS\", \"Android\"], \"weekend_dip\": \"true\", \"industry\": \"Finance\", \"notifications\": [\"Push\", \"Mobile In-App\"]}, \"events\": {\"Payment Completed\": {\"Bank Linked\": {\"values\": {\"Wells Fargo\": \"bad\", \"Bank of America\": \"good\", \"Charles Schwab\": \"bad\", \"Chase\": \"good\"}, \"super\": \"true\", \"type\": \"string\"}, \"Days Until Payment\": {\"values\": [\"0\", \"30\"], \"super\": \"true\", \"type\": \"numeric\"}, \"Scheduled Payment\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}}, \"Browse Financial Products\": {}, \"App Open\": {\"Count of App Open\": {\"values\": {\"10\": \"bad\", \"1\": \"bad\", \"0\": \"bad\", \"3\": \"bad\", \"2\": \"bad\", \"5\": \"bad\", \"4\": \"bad\", \"7\": \"bad\", \"6\": \"bad\", \"9\": \"bad\", \"8\": \"bad\"}, \"super\": \"true\", \"type\": \"string\"}, \"New User\": {\"values\": {\"1\": \"bad\", \"0\": \"bad\"}, \"super\": \"true\", \"type\": \"string\"}}, \"View Screen\": {\"Screen Name\": {\"values\": {\"Nearby ATMs\": \"bad\", \"Settings\": \"bad\", \"Pay Bill\": \"bad\", \"Alerts\": \"bad\", \"View Balance\": \"bad\", \"Home\": \"good\"}, \"super\": \"false\", \"type\": \"string\"}}, \"View Payment Activity\": {}, \"Modify Alerts\": {\"Balance Summary\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}, \"Payment Due Notice\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}, \"Int'l Transaction\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}, \"Payment Posted\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}, \"Transaction Made Above\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}, \"Payment Scheduled Confirmation\": {\"values\": [\"true\", \"false\"], \"super\": \"true\", \"type\": \"boolean\"}}, \"View Balance\": {\"Current Balance\": {\"values\": [\"0\", \"20000\"], \"super\": \"true\", \"type\": \"numeric\"}, \"Available Credit\": {\"values\": [\"0\", \"20000\"], \"super\": \"true\", \"type\": \"numeric\"}, \"Rewards Miles\": {\"values\": [\"0\", \"250000\"], \"super\": \"true\", \"type\": \"numeric\"}}, \"Pay My Bill\": {}, \"Enter Pin\": {\"Success\": {\"values\": {\"1\": \"bad\", \"0\": \"bad\"}, \"super\": \"true\", \"type\": \"string\"}}, \"Registration\": {}, \"Credit Tracker\": {}}}, \"id\": 2153, \"name\": \"Capital One Mobile v3\"}"
        $.get(baseEndpoint + '/dungeons/' + id + '/', function(result) {
            var dungeonData = result;
            dungeonData = JSON.parse(dungeonData);
	        loadDungeon(dungeonData);
        });
    }

    function saveLoadedDungeon(dungeonData) {
        loadedDungeon = dungeonData['id'];
        loadedDungeonUser = dungeonData['author'];
        loadedDungeonName = dungeonData['name'];

        // update saved values to equal loaded dungeon
        updateValues(savedValues);
    }

    function loadDungeon(dungeonData) {
        var eventObject = dungeonData.meta.events;
        var pathObject = dungeonData.meta.paths;
        var configObject = dungeonData.meta.config;
        var industry = dungeonData.industry;

        loadEvents(eventObject);
        setTimeout(function() {
            // don't load paths until all events are loaded to avoid empty paths
            loadPaths(pathObject);
            saveLoadedDungeon(dungeonData);
        });
        loadConfig(configObject);
        loadIndustry(industry);

        // load dungeon name
        $('#dungeon-name input').val(dungeonData['name']);

        // track event
        //mixpanel.dm.track('Load Dungeon', {
        //     'Dungeon Id': loadedDungeon,
        //     'Dungeon Name': loadedDungeonName,
        //     'Dungeon Author': loadedDungeonUser,
        //     'Industry': industry,
        // });
        //mixpanel.dm.people.increment('Lifetime Dungeon Loads');
    }

    function loadEvents(eventData) {
        $('.event').remove();
        events = 0;
        // loop through all events
        for (var i = 0; i < Object.keys(eventData).length; i++) {
            var eventName = Object.keys(eventData)[i];
            newEvent(i, eventName);
            if (Object.keys(eventData[eventName]).length > 0) {
                // loop through all properties
                for (var j = 0; j < Object.keys(eventData[eventName]).length; j++) {
                    var $propDiv = $('#' + i).find('.properties');

                    var propName = Object.keys(eventData[eventName])[j];
                    var propType = eventData[eventName][propName]['type'];
                    var propSuper = eventData[eventName][propName]['super'];
                    var values = eventData[eventName][propName]['values'];

                    newProperty($propDiv, propName, propType, propSuper, values);
                }
            }
        }
    }

    function loadPaths(pathData) {
        $('.path').remove();
        $('.unused > .collapse-event').remove();
        paths = 0;

        var requiredName = Object.keys(pathData['required'])[0];
        var requiredEvents = pathData['required'][requiredName];
        newPath(paths, 'required', requiredName, requiredEvents);

        var usagePaths = Object.keys(pathData['usage']);
        for (i = 0; i < usagePaths.length; i++) {
            var usageName = usagePaths[i];
            // avoid loading unused event list
            if (usageName != 'unused') {
                // collect path events and create path
                var usageEvents = pathData['usage'][usagePaths[i]];
                newPath(paths, 'usage', usageName, usageEvents);                
            }
        }
        updatePathEvents();
    }

    function loadConfig(configData) {
        // check only selected platforms
        $('#platforms .checkbox-option').removeClass('selected');
        for (i = 0; i < configData['platforms'].length; i++) {
            var platform = configData['platforms'][i].toLowerCase();
            $('#platform-' + platform).addClass('selected');
        }

        // weekend dip setting
        if (configData['weekend_dip'] == 'true') {
            $('#weekend-dip .toggle').removeClass('no');            
        }

        // check only selected notifications
        $('#notification-type .checkbox-option').removeClass('selected');
        // only push for now
        if ($.inArray('push', configData['notifications'])) {
            $('#push').addClass('selected');
        }
        // for (i = 0; i < configData['notifications'].length; i++) {
        //     var notification = configData['notifications'][i].toLowerCase();
        //     if (notification == 'mobile in-app') { notification = 'mobile-inapp' }
        //     else if (notification == 'web in-app') { notification = 'web-inapp' }
        //     $('#' + notification).addClass('selected');
        // }
    }

    function loadIndustry(industry) {
        $('#industry .select-option').filter(function() {
            return $(this).text().toLowerCase() === industry.toLowerCase();
        }).trigger('click');
    }


/// easter egg

    var easterEgg = false;

    $('.hidden-torch').click(function() {
        if (easterEgg) {
            $('.main-nav').show();
            $('.mini-nav').show();
            $('.page-title').height('0px')
            $('body').css({'background-color': '', 'background': '', 'color': '', 'font-family': ''});
            $('.section').css({'border': '', 'background-color': ''});
            $('div').css({'background-color': '', 'color': '', 'text-shadow': ''});
            $('h1').text('').css('vertical-align', '');
            $('.torch').css({'height': '', 'display':'none'});
            easterEgg = false;
        }
        else {
            $('.main-nav').hide();
            $('.mini-nav').hide();
            $('.page-title').height('150px');
            $('body').not('.button').not('.toggle').not('.down-arrow').not('.select-button').not('.remove-step').not('.select-option').not('.collapse-expand').not('.option-name').not('.option-author').not('.option-industry').css({'background-color': 'black', 'background': 'black', 'color': '#f5c422', 'font-family': 'serif'});
            $('.section').css({'border': '4px ridge #850d0d', 'background-color': 'rgb(34,34,34)'});
            $('div').not('.button').not('.toggle').not('.down-arrow').not('.select-button').not('.remove-step').not('.select-option').not('.collapse-expand').not('.option-name').not('.option-author').not('.option-industry').css({'background-color': 'black', 'color': '', 'text-shadow': 'none'});
            $('.collapse-expand').css('color', 'black');
            $('h1').text('Welcome, Dungeon Master').css('vertical-align', '33px');
            $('.torch').css({'height': '120px', 'display': 'inline-block'});
            easterEgg = true;
        }
    });
});