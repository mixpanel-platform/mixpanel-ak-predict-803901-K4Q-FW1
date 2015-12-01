$(document).ready(function() {
    
    var baseEndpoint = '/admin/internal/dungeon_master_2';

    function getCurrentUser() {
        if (window.location.hostname == 'dm2.dev') {
            window.user = {firstName: "Laura", lastName: "Del Beccaro", email: "laura@mixpanel.com"}
        }
        currentUser = window.user.firstName + ' ' + window.user.lastName[0] + '.';
        mixpanel.dm.people.set({
            '$first_name': window.user.firstName,
            '$last_name': window.user.lastName,
            '$email': window.user.email,
        });
        mixpanel.dm.register({
            'Name': window.user.firstName + ' ' + window.user.lastName,
            'Email': window.user.email,
        });
    }
    getCurrentUser();

    function getAllDungeons() {
        allDungeons = {};
        $('.loading').show();
        $('.no-results').hide();
        $('.your-dungeons').hide();
        $('.other-dungeons').hide();

        $('.fixed-menu .options-list').css('overflow-y', 'hidden');
        // var dungeons = "[{\"industry\": \"Gaming\", \"id\": 2039, \"name\": \"Test\", \"author\": \"Orien W.\"}, {\"industry\": \"Finance\", \"id\": 2061, \"name\": \"Macquarie Bank Mobile App\", \"author\": \"Stephen M.\"}, {\"industry\": \"Travel\", \"id\": 2063, \"name\": \"MoneySuperMarket\", \"author\": \"Stephen M.\"}, {\"industry\": \"Travel\", \"id\": 2065, \"name\": \"MoneySuperMarket Demo\", \"author\": \"Stephen M.\"}, {\"industry\": \"Travel\", \"id\": 2067, \"name\": \"MoneySuperMarket Demo2\", \"author\": \"Stephen M.\"}, {\"industry\": \"Health\", \"id\": 2069, \"name\": \"Beachbody\", \"author\": \"Dan M.\"}, {\"industry\": \"Health\", \"id\": 2071, \"name\": \"Beachbody\", \"author\": \"Dan M.\"}, {\"industry\": \"Marketplace\", \"id\": 2073, \"name\": \"Shift Car Demo\", \"author\": \"Dan M.\"}, {\"industry\": \"Finance\", \"id\": 2075, \"name\": \"Comm Bank Internal\", \"author\": \"Stephen M.\"}, {\"industry\": \"Marketplace\", \"id\": 2079, \"name\": \"ShiftCar Demo\", \"author\": \"Dan M.\"}, {\"industry\": \"Gaming\", \"id\": 2081, \"name\": \"Jump Games Demo - Bo\", \"author\": \"Bowen B.\"}, {\"industry\": \"Gaming\", \"id\": 2083, \"name\": \"Jump Games Demo - Bo\", \"author\": \"Bowen B.\"}, {\"industry\": \"E-Commerce\", \"id\": 2085, \"name\": \"Blake Test\", \"author\": \"Jeff W.\"}, {\"industry\": \"SaaS\", \"id\": 2087, \"name\": \"SaaS Industry Demo\", \"author\": \"Dan M.\"}, {\"industry\": \"SaaS\", \"id\": 2095, \"name\": \"SaaS Industry Demo\", \"author\": \"Alex B.\"}, {\"industry\": \"SaaS\", \"id\": 2097, \"name\": \"SaaS Industry Demo - Fastly\", \"author\": \"Alex B.\"}, {\"industry\": \"Finance\", \"id\": 2099, \"name\": \"MUFG\", \"author\": \"Dan M.\"}, {\"industry\": \"Finance\", \"id\": 2101, \"name\": \"MUFG\", \"author\": \"Dan M.\"}, {\"industry\": \"Finance\", \"id\": 2103, \"name\": \"SMFG Visa Card\", \"author\": \"Dan M.\"}, {\"industry\": \"SaaS\", \"id\": 2107, \"name\": \"Fastly\", \"author\": \"Alex B.\"}, {\"industry\": \"Media\", \"id\": 2111, \"name\": \"Discovery V1\", \"author\": \"Alex B.\"}, {\"industry\": \"Media\", \"id\": 2113, \"name\": \"Discovery V2\", \"author\": \"Alex B.\"}, {\"industry\": \"E-Commerce\", \"id\": 2115, \"name\": \"Julep 10/22 Demo\", \"author\": \"Laura D.\"}, {\"industry\": \"E-Commerce\", \"id\": 2117, \"name\": \"Julep 10/22 Demo\", \"author\": \"Laura D.\"}, {\"industry\": \"E-Commerce\", \"id\": 2119, \"name\": \"Julep 10/22 Demo 2\", \"author\": \"Laura D.\"}, {\"industry\": \"Media\", \"id\": 2121, \"name\": \"Discovery V3\", \"author\": \"Alex B.\"}, {\"industry\": \"E-Commerce\", \"id\": 2123, \"name\": \"Ebay Classifieds\", \"author\": \"Jesse D.\"}, {\"industry\": \"E-Commerce\", \"id\": 2125, \"name\": \"Ebay Classifieds\", \"author\": \"Jesse D.\"}, {\"industry\": \"Finance\", \"id\": 2127, \"name\": \"Monitise (Santander)\", \"author\": \"Diggory R.\"}, {\"industry\": \"Finance\", \"id\": 2131, \"name\": \"Monitise (Santander)\", \"author\": \"Diggory R.\"}, {\"industry\": \"Finance\", \"id\": 2133, \"name\": \"Monitise (Santander) v2\", \"author\": \"Diggory R.\"}, {\"industry\": \"Media\", \"id\": 2135, \"name\": \"Discovery V4\", \"author\": \"Alex B.\"}, {\"industry\": \"E-Commerce\", \"id\": 2137, \"name\": \"Ebay Classifieds\", \"author\": \"Jesse D.\"}, {\"industry\": \"Finance\", \"id\": 2139, \"name\": \"Capital One Mobile\", \"author\": \"Andy K.\"}, {\"industry\": \"Finance\", \"id\": 2141, \"name\": \"Capital One Mobile\", \"author\": \"Andy K.\"}, {\"industry\": \"E-Commerce\", \"id\": 2143, \"name\": \"Ebay Classifieds\", \"author\": \"Jesse D.\"}, {\"industry\": \"Finance\", \"id\": 2145, \"name\": \"Capital One Mobile (v0)\", \"author\": \"Andy K.\"}, {\"industry\": \"Finance\", \"id\": 2147, \"name\": \"Capital One Mobile\", \"author\": \"Addison H.\"}, {\"industry\": \"Finance\", \"id\": 2149, \"name\": \"Capital One Mobile\", \"author\": \"Addison H.\"}, {\"industry\": \"E-Commerce\", \"id\": 2151, \"name\": \"Maui Jim\", \"author\": \"Dan M.\"}, {\"industry\": \"Finance\", \"id\": 2153, \"name\": \"Capital One Mobile v3\", \"author\": \"Andy K.\"}, {\"industry\": \"Photo/Video\", \"id\": 2155, \"name\": \"testing 1023\", \"author\": \"Laura D.\"}, {\"industry\": \"Photo/Video\", \"id\": 2157, \"name\": \"testing 102315\", \"author\": \"Laura D.\"}, {\"industry\": \"E-Commerce\", \"id\": 2159, \"name\": \"HSN demo\", \"author\": \"Dan M.\"}, {\"industry\": \"Finance\", \"id\": 2161, \"name\": \"Capital One Mobile v4\", \"author\": \"Andy K.\"}, {\"industry\": \"Gaming\", \"id\": 2165, \"name\": \"PlayfulBet\", \"author\": \"Diggory R.\"}, {\"industry\": \"E-Commerce\", \"id\": 2171, \"name\": \"Kings Island\", \"author\": \"Giovanni B.\"}, {\"industry\": \"Finance\", \"id\": 2173, \"name\": \"T. Rowe Price demo\", \"author\": \"Dan M.\"}, {\"industry\": \"Marketplace\", \"id\": 2175, \"name\": \"Toll Brothers demo\", \"author\": \"Dan M.\"}, {\"industry\": \"E-Commerce\", \"id\": 2177, \"name\": \"Victoria's Secret Demo\", \"author\": \"Dan M.\"}, {\"industry\": \"E-Commerce\", \"id\": 2179, \"name\": \"FabKids 102715\", \"author\": \"Laura D.\"}, {\"industry\": \"Health\", \"id\": 2185, \"name\": \"Bravo Wellness 01\", \"author\": \"Alex B.\"}, {\"industry\": \"Health\", \"id\": 2191, \"name\": \"Practice Fusion 1027\", \"author\": \"Laura D.\"}, {\"industry\": \"Social/Messaging\", \"id\": 2193, \"name\": \"Social Vertical Demo v1\", \"author\": \"Stephen M.\"}]"
        $.get(baseEndpoint + '/dungeons/', function(result) {
            var dungeons = result;
            dungeons = JSON.parse(dungeons);
            for (var i = 0; i < dungeons.length; i++) {
                var id = dungeons[i]['id'];
                allDungeons[id] = {};
                allDungeons[id]['author'] = dungeons[i]['author'];
                allDungeons[id]['name'] = dungeons[i]['name'];
                allDungeons[id]['industry'] = dungeons[i]['industry']
            }
            displayDungeons(allDungeons);
        });
    }

    function searchDungeons(industries) {
        var dungeonResults = {}
        var dungeonIds = Object.keys(allDungeons);
        for (var key in dungeonIds) {
            var id = dungeonIds[key]
            for (var i = 0; i < industries.length; i++) {
                if (allDungeons[id]['industry'] == industries[i]) {
                    dungeonResults[id] = allDungeons[id];
                }
            }
        }
        return dungeonResults;
    }

    function displayDungeons(dungeonObject) {
        // clear previous results, if any
        $('.fixed-menu').find('.select-option').remove();

        // loop through results in dungeon object
        var keys = Object.keys(dungeonObject);
        for (var i = 0; i < keys.length; i++) {
            var dungeonInfo = dungeonObject[keys[i]]
            var author = dungeonInfo['author'];
            var name = dungeonInfo['name'];
            var industry = dungeonInfo['industry'];

            // append dungeon to correct section
            if (author == currentUser) {
                var optionsMenu = $('.fixed-menu').find('.your-dungeons');
                var deleteDungeon = '<div class="delete-button"></div>';
            }
            else {
                var optionsMenu = $('.fixed-menu').find('.other-dungeons');
                var deleteDungeon = ''
            }
            optionsMenu.append('<div class="select-option multi" id="dungeon' + keys[i] + '"><div class="option-name">' + name + '</div><div class="option-author">' + author + '</div><div class="option-industry">' + industry + '</div>' + deleteDungeon + '</div>');
        }
        setTimeout(function() {
            showSearchSections(false)
        });
    }

    function showSearchSections(filter) {
        var selector = filter ? ':visible' : '';

        // reset visible elements
        $('.your-dungeons').show();
        $('.other-dungeons').show();
        $('.no-results').hide();

        // show applicable sections only if there are results
        if ($('.your-dungeons').children('.select-option' + selector).length > 0) {
            $('.your-dungeons').show();
            $('.fixed-menu .options-list').css('overflow-y', 'scroll');
        } else if ($('.your-dungeons').children('.select-option' + selector).length == 0 && $('.other-dungeons').children('.select-option' + selector).length == 0) {
            // hide both sections and show no results
            $('.no-results').show();
            $('.your-dungeons').hide();
            $('.other-dungeons').hide();
        } else {
            $('.your-dungeons').hide();
        }

        if ($('.other-dungeons').children('.select-option' + selector).length > 0) {
            $('.other-dungeons').show();
            $('.fixed-menu .options-list').css('overflow-y', 'scroll');
        } else {
            $('.other-dungeons').hide();
        }

        $('.loading').hide();
    }

    // show search modal
    $('.search-nav, .search').click(function() {
        mixpanel.dm.track('Click Nav', {
            'Nav Item': 'Search',
        });

    	getAllDungeons();
        $('#all-industries').trigger('click');

    	// collapse other sections
        $('body').trigger('click');
        $('.help').fadeOut(500);

        // show search modal
        $('#search').delay(200).fadeIn(500);
        $('.fade').fadeIn(500);
        setTimeout(function() {
            $('#search').find('.search-box').focus();            
        });
    });

    // search dungeons when search text entered
    $('#search').on('change keydown keyup', '.search-box', function() {
        var searchText = $(this).val().toLowerCase();
        var options = $(this).parent().siblings('.options-list').find('.select-option');
        for (var option = 0; option < options.length; option++) {
            var dungeon = options[option];
            if ($(dungeon).text().toLowerCase().indexOf(searchText) == -1) {
                $(dungeon).hide();
            }
            else {
                $(dungeon).show();
            }
        }
        var filter = searchText.length > 0 ? true : false;
        showSearchSections(filter);
    });

    // show dropdown when button is clicked
    $('body').on('click', '.select-button, .select-button > *:not(.remove-step)', function(e) {
    	e.stopPropagation();
        // hide this menu if open
        if ($(this).parents('.dropdown-parent').find('.select-menu:visible').length > 0) {
            $('.select-menu').hide();
            $('.select-button').removeClass('active');
        }
        else {
            // show applicable menu
            $(this).parents('.dropdown-parent').find('.select-menu').toggle();
            $(this).parents('.dropdown-parent').find('.select-menu').find('.search-box').focus();
            $(this).parents('.dropdown-parent').find('.select-button').toggleClass('active');
        }
        // hide any other open menus
        $('.select-menu').not($(this).parents('.dropdown-parent').find('.select-menu')).hide();
        $('.select-button').not($(this).parents('.dropdown-parent').find('.select-button')).removeClass('active');
    });

    // select industry from dropdown
    $('#search').on('click', '.industry-search .select-option', function() {
        var all = $(this).attr('id') == 'all-industries';
        if (all) {
            $(this).addClass('selected');
            $(this).siblings('.select-option').removeClass('selected');
        } else {
            $(this).toggleClass('selected');
            $('#all-industries').removeClass('selected');
        }
        // find all selected industries
        var selectedDivs = $(this).parent().find('.selected');
        var numSelected = selectedDivs.length;

        if (numSelected == 0 || all) {
            if ($.isEmptyObject(allDungeons) == false) {
                displayDungeons(allDungeons);                
            }
            $(this).parents('.select-menu').siblings('.select-button').removeClass('active').html('<p>ALL INDUSTRIES</p><div class="down-arrow"></div>');
            return;
        }
        var selected = numSelected == 1 ? $(selectedDivs).text() : numSelected + ' selected';
        $(this).parents('.select-menu').siblings('.select-button').removeClass('active').html('<p>' + selected + '</p><div class="down-arrow"></div>');
        $('.select-menu').hide();
        var selectedIndustries = [];
        for (var i = 0; i < selectedDivs.length; i++) {
            if ($(selectedDivs[i]).text().toLowerCase() != 'all industries') {
                selectedIndustries.push($(selectedDivs[i]).text());                
            }
        }
        var results = searchDungeons(selectedIndustries);
        displayDungeons(results);

        // track event
        var industries = [];
        $.each(selectedDivs, function(i, div) {
            industries.push($(div).text());

        });
        mixpanel.dm.track('Filter Search', {
            'Industries': industries,
        });
    });
	
	// select dungeon
    $('#search').on('click', '.select-option.multi:not(.delete-button)', function() {
        var selectedId = $(this).attr('id').substring(7);
        window.location.href = baseEndpoint + '/builder/?id=' + selectedId;
    });

    // show delete button when hovering over a dungeon option
    $('.your-dungeons')
        .on('mouseenter', '.select-option.multi', function() {
            $(this).children('.delete-button').css('display', 'inline-block');
        })
        .on('mouseleave', '.select-option.multi', function() {
            $(this).children('.delete-button').hide();
        });

    // delete dungeon
    $('.your-dungeons').on('click', '.delete-button', function(e) {
        e.stopPropagation();

        var deleteConfirm = window.confirm('Are you sure you want to delete this dungeon? It will be permanently deleted.');
        if (deleteConfirm) {
            var id = $(this).parents('.select-option.multi').attr('id').substring(7);
            var name = $(this).parents('.select-option.multi').find('.option-name').text();
            var industry = $(this).parents('.select-option.multi').find('.option-industry').text();
            
            // track event
            mixpanel.dm.track('Delete Dungeon', {
                'Dungeon Id': id,
                'Dungeon Name': name,
                'Dungeon Author': getCurrentUser(),
                'Industry': industry,
            });

            // delete dungeon
            $.ajax({
                url: baseEndpoint + '/dungeons/' + id + '/',
                type: 'DELETE',
                success: function(result) {
                    console.log(result);
                }
            });
            // remove from results
            $(this).parents('.select-option.multi').remove();
        }
    });

    // click out of dropdowns
	$(document).on('click', ':not(.select-menu, .select-button, .select-button > *)', function(e) {
        e.stopPropagation();
        $('.select-button').removeClass('active');
        $('.select-menu').hide();
    });

    // keyboard shortcuts
    $(document).keydown(function(e) {
        // escape key
        if (e.keyCode == 27) {
            // escape out of dropdowns
            $('.select-button').removeClass('active');
            $('.select-menu').hide();
            // escape out of typecast menu
            $('.typecast').removeClass('active');
            $('.menu').hide();
            // escape out of modals
            $('.fade').trigger('click');
        }
    });
});