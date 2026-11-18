/////////////////////////////////////////////////////////////////////////////////////////
// GLOBALS
/////////////////////////////////////////////////////////////////////////////////////////
var institutions = new Array();
var sequence = 1;
var is_local = false;
var version = "";
var version_date = "";

var INSURANCE_LIMIT = 250000;
var ERR_INC = 0x1;
var ERR_INV = 0x2;
var ERR_BAD = 0x4;
var error_tracker = {};

var new_institution = new Institution();
var new_personal_account = new PersonalAccount();
var new_business_account = new BusinessAccount();
var new_public_account = new PublicAccount();

new_personal_account.id = "new";
new_business_account.id = "new";
new_institution.id = "new";
new_public_account.id = "new";

var institution_helped = false;
var should_warn = false;
var doing_edit = false;
var headerbuttons = [];
var headerlis = [];
var footerbuttons = [];
var footerlis = [];
var known_people = new Array();
var known_eins = new Array();
var known_public_accts = new Array();
var known_business_accts = new Array();
var calculate_insurance_flag = false;
var selected_account_type = '';
var edit_hash = {};
var changing_proprietorship = false;
var selected_proprietorship = false;
var currentCluetipElem = null;
var same_owner_name = false;
//var nibta_header_flag=false; //R5.7.3: flag for nibta report header -- R5.8.4 Remove NIBTA logic

/////////////////////////////////////////////////////////////////////////////////////////
// CLASSES
/////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function () {

    var ein_inputmast = function (event) {

        // 1.
        var selection = window.getSelection().toString();
        if (selection !== '') {
            return;
        }

        // 2.
        if ($.inArray(event.keyCode, [38, 40, 37, 39]) !== -1) {
            return;
        }

        // 1
        var $this = $(this);
        var input = $this.val();

        // 2
        input = input.replace(/[\W\s\._\-]+/g, '');

        // 3
        var split = 1;
        var chunk = [];

        for (var i = 0, len = input.length; i < len; i += split) {
            split = (i >= 2) ? 7 : 2;
            chunk.push(input.substr(i, split));
        }

        // 4
        $this.val(function () {
            return chunk.join("-").toUpperCase().substring(0, 10);
        });

    }

    $("input[name*='trustein']").on("keyup", ein_inputmast);
    $("input[name*='ein']").on("keyup", ein_inputmast);
    $("input[name*='publicein']").on("keyup", ein_inputmast);

    setHeaderFooterLinksWarnings();

    $('#account_type').bind("blur", function (e) {
        if (!$("#account_type").val()) {
            validate_account_type()
        }
    });

    //	var ww = document.body.clientWidth;
    //    if (ww < 720) {

    //		let a = document.getElementsByClassName( "col-2" );
    //[...a].forEach( x => x.className += " col-xs-2" );
    //[...a].forEach( x => x.className += " padding15left" );
    //[...a].forEach( x => x.classList.remove("col-2") );
    //let b = document.getElementsByClassName( "col-10" );
    //[...b].forEach( x => x.className += " col-xs-10" );
    //[...b].forEach( x => x.classList.remove("col-10") );
    //let c = document.getElementsByClassName( "col-3" );
    //[...c].forEach( x => x.className += " col-xs-3" );
    //[...c].forEach( x => x.className += " padding15left" );
    //[...c].forEach( x => x.classList.remove("col-3") );
    //let d = document.getElementsByClassName( "col-4" );
    //[...d].forEach( x => x.className += " col-xs-4" );
    //[...d].forEach( x => x.classList.remove("col-4") );
    //let e = document.getElementsByClassName( "colsmall" );
    //[...e].forEach( x => x.className += " col-xs" );
    //[...e].forEach( x => x.className += " padding15left" );
    //[...e].forEach( x => x.classList.remove("col") );

    //	}

});

function track_analytics_link_click(linkName) {
    try {
        if (typeof s === 'undefined' || !s || typeof s.tl !== 'function') {
            return;
        }

        var previousLinkTrackVars = s.linkTrackVars;
        var previousLinkTrackEvents = s.linkTrackEvents;

        s.linkTrackVars = 'None';
        s.linkTrackEvents = 'None';
        s.tl(true, 'o', linkName);

        s.linkTrackVars = previousLinkTrackVars;
        s.linkTrackEvents = previousLinkTrackEvents;
    } catch (e) {
        // Analytics errors should never block account submission.
    }
}

function track_add_to_report_click() {
    track_analytics_link_click('EDIE:Add to Report');
}

function track_save_edits_click() {
    track_analytics_link_click('EDIE:Save Edits');
}

function track_calculate_coverage_click() {
    track_analytics_link_click('EDIE:Calculate Coverage');
}

var alterClass = function () {
    var ww = document.body.clientWidth;
    if (ww < 720) {

        let a = document.getElementsByClassName("col-2");
        [...a].forEach(x => x.className += " col-xs-2");
        [...a].forEach(x => x.className += " padding15left");
        [...a].forEach(x => x.classList.remove("col-2"));
        let b = document.getElementsByClassName("col-10");
        [...b].forEach(x => x.className += " col-xs-10");
        [...b].forEach(x => x.classList.remove("col-10"));
        let c = document.getElementsByClassName("col-3");
        [...c].forEach(x => x.className += " col-xs-3");
        [...c].forEach(x => x.className += " padding15left");
        [...c].forEach(x => x.classList.remove("col-3"));
        let d = document.getElementsByClassName("col-4");
        [...d].forEach(x => x.className += " col-xs-4");
        [...d].forEach(x => x.classList.remove("col-4"));
        let e = document.getElementsByClassName("colsmall");
        [...e].forEach(x => x.className += " col-xs");
        [...e].forEach(x => x.className += " padding15left");
        [...e].forEach(x => x.classList.remove("col"))
        let o = document.getElementsByClassName("summaryor");
        [...o].forEach(x => x.className += " col-xs-1");
        [...o].forEach(x => x.className += " mobileORCenter");
        [...o].forEach(x => x.classList.remove("col-1"));


    } else if (ww >= 720) {

        let a = document.getElementsByClassName("col-xs-2");
        [...a].forEach(x => x.className += " col-2");
        [...a].forEach(x => x.classList.remove("col-xs-2"));
        [...a]
        let b = document.getElementsByClassName("col-xs-10");
        [...b].forEach(x => x.className += " col-10");
        [...b].forEach(x => x.classList.remove("col-xs-10"));
        let c = document.getElementsByClassName("col-xs-3");
        [...c].forEach(x => x.className += " col-3");
        [...c].forEach(x => x.classList.remove("col-xs-3"));
        [...c].forEach(x => x.classList.remove("padding15left"));

        let d = document.getElementsByClassName("col-xs-4");
        [...d].forEach(x => x.className += " col-4");
        [...d].forEach(x => x.classList.remove("col-xs-4"));
        let e = document.getElementsByClassName("colsmall");
        [...e].forEach(x => x.className += " col");
        [...e].forEach(x => x.classList.remove("col-xs"));
        [...e].forEach(x => x.classList.remove("padding15left"));

        let o = document.getElementsByClassName("summaryor");
        [...o].forEach(x => x.className += " col-1");
        [...o].forEach(x => x.classList.remove("mobileORCenter"));
        [...o].forEach(x => x.classList.remove("col-xs-1"));
    };
};
$(window).resize(function () {
    //alterClass();
});

// Add down arrow icon for collapse element which is open by default
$(".collapse.show").each(function () {
    $(this).prev(".card-header").find(".fa").addClass("fa-angle-down").removeClass("fa-angle-right");
});

// Toggle right and down arrow icon on show hide of collapse element
$(".collapse").on('show.bs.collapse', function () {
    $(this).prev(".card-header").find(".fa").removeClass("fa-angle-right").addClass("fa-angle-down");
}).on('hide.bs.collapse', function () {
    $(this).prev(".card-header").find(".fa").removeClass("fa-angle-down").addClass("fa-angle-right");
});
function Institution(name) {

    this.id = get_sequence();
    this.name = name;
    this.personal_accounts = new Array();
    this.business_accounts = new Array();
    this.public_accounts = new Array();

    this.add_personal_account = function (account) {
        this.personal_accounts.push(account);
    }

    this.remove_personal_account = function (accountid) {
        var new_array = new Array();
        for (var i = 0; i < this.personal_accounts.length; i++) {
            if (this.personal_accounts[i].id != accountid) {
                new_array.push(this.personal_accounts[i]);
            }
        }

        this.personal_accounts = new_array;
    }

    this.add_business_account = function (account) {
        this.business_accounts.push(account);
    }

    this.remove_business_account = function (accountid) {
        var new_array = new Array();
        for (var i = 0; i < this.business_accounts.length; i++) {
            if (this.business_accounts[i].id != accountid) {
                new_array.push(this.business_accounts[i]);
            }
        }

        this.business_accounts = new_array;
    }

    this.add_public_account = function (account) {
        this.public_accounts.push(account);
    }

    this.remove_public_account = function (accountid) {
        var new_array = new Array();
        for (var i = 0; i < this.public_accounts.length; i++) {
            if (this.public_accounts[i].id != accountid) {
                new_array.push(this.public_accounts[i]);
            }
        }

        this.public_accounts = new_array;
    }

}

function PersonalAccount(name) {

    this.id = get_sequence();
    this.name = name;
    this.owners = new Array();
    this.balance = null;
    this.type = null;
    this.beneficiaries = new Array();
    this.trustees = new Array();
    this.grantors = new Array();
    this.trustein = null;
    this.deposit_type = null;

    this.add_owner = function (owner) {
        this.owners.push(owner);
    }

    this.remove_owner = function (ownerid) {
        var new_array = new Array();
        for (var i = 0; i < this.owners.length; i++) {
            if (this.owners[i].id != ownerid) {
                new_array.push(this.owners[i]);
            }
        }

        this.owners = new_array;
    }

    this.add_grantor = function (grantor) {
        this.grantors.push(grantor);
    }

    this.remove_grantor = function (settid) {
        var new_array = new Array();
        for (var i = 0; i < this.grantors.length; i++) {
            if (this.grantors[i].id != settid) {
                new_array.push(this.grantors[i]);
            }
        }

        this.grantors = new_array;
    }

    this.add_beneficiary = function (ben) {
        this.beneficiaries.push(ben);
    }

    this.remove_beneficiary = function (benid) {
        var new_array = new Array();
        for (var i = 0; i < this.beneficiaries.length; i++) {
            if (this.beneficiaries[i].id != benid) {
                new_array.push(this.beneficiaries[i]);
            }
        }

        this.beneficiaries = new_array;
    }

    this.add_trustee = function (trustee) {
        this.trustees.push(trustee);
    }

    this.remove_trustee = function (trusteeid) {
        var new_array = new Array();
        for (var i = 0; i < this.trustees.length; i++) {
            if (this.trustees[i].id != trusteeid) {
                new_array.push(this.trustees[i]);
            }
        }

        this.trustees = new_array;
    }
}

function BusinessAccount(name) {

    this.id = get_sequence();
    this.name = name;
    this.balance = null;
    this.ein = null;
    this.account_name = null;
    this.owner = null;
    this.deposit_type = null;

}

function PublicAccount(name) {

    this.id = get_sequence();
    this.name = name;
    this.balance = null;
    this.ein = null;
    this.account_name = null;
    this.custodian = null;
    this.account_holder = null;
    this.deposit_type = null;
    this.state_match = null;

}

function Owner(name) {
    this.id = get_sequence();
    this.name = name;
}

function Beneficiary(name) {
    this.id = get_sequence();
    this.name = name;
    this.type = null;
}

function Trustee(name) {
    this.id = get_sequence();
    this.name = name;
}

function Grantor(name) {
    this.id = get_sequence();
    this.name = name;
    this.living = null;
}

/////////////////////////////////////////////////////////////////////////////////////////
// CONTROLLER FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function populate_calculator(inst, p_acct, b_acct, pub_acct, noscroll) {

    var institution = inst;
    var account = p_acct;
    var baccount = b_acct;
    var paccount = pub_acct;

    var validate_institutionfield = true;

    if (!institution) {
        if (institutions.length) {
            institution = institutions[0];
        } else {
            institution = new_institution;
            var validate_institutionfield = false;
        }
    }

    var validate_after_populate = true;

    selected_account_type = '';

    if (baccount || account || paccount) {
        $('#business_personal_chooser').hide();
        $('.soleprop').hide();
    } else {
        if (institution.personal_accounts.length + institution.public_accounts.length + institution.business_accounts.length > 49) {
            $('#business_personal_chooser').hide();
            $('#account_limit').show();
        } else {
            $('#business_personal_chooser').show();
            $('#account_limit').hide();
        }

        $('.soleprop').show();
        $('#business_div').hide();
        $('#personal_div').hide();
        $('#public_div').hide();
        $('#button_div').hide();
		$('#ein_tin').hide();
        $('input[name=business_personal]').prop('checked', false);
        if (institution.personal_accounts.length + institution.public_accounts.length + institution.business_accounts.length) {
            $('#add_account_text').text("Add next account");
            $('#add_another_account_btn').show();
        } else {
            $('#add_account_text').text("Add first account");
            $('#add_another_account_btn').hide();
        }
        validate_after_populate = false;
    }

    if (baccount) {
        $('#active_account_id').val(baccount.id);
        account = new_personal_account;
        paccount = new_public_account;
        $('input[name=business_personal]').filter('[value=business]').click();
    } else if (paccount) {
        $('#active_account_id').val(paccount.id);
        account = new_personal_account;
        baccount = new_business_account;
        $('input[name=business_personal]').filter('[value=public]').click();
    } else if (account) {
        $('input[name=business_personal]').filter('[value=personal]').click();
        $('#active_account_id').val(account.id);
        baccount = new_business_account;
        paccount = new_public_account;
    } else {
        $('#active_account_id').val("new");
        account = new_personal_account;
        baccount = new_business_account;
        paccount = new_public_account;

        //R5.7.3: hide side question for nibta
        reset_deposit_type_nibta('deposit_type');
        reset_deposit_type_nibta('business_deposit_type');
        reset_deposit_type_nibta('public_deposit_type');

        //R5.8.0: hide side question for now deposit type (business accounts only)
        reset_deposit_type_now('business_deposit_type');

    }

    //$('#institution').val(institution.name || "");

    // Setup the personal account fields

    $('#account_name').val(account.name || "");
    $('#account_balance').val(account.balance || "");
    $('#account_type').val(account.type || "");
    $('#deposit_type').val(account.deposit_type || "");
    $('#ein_irt').val(account.ein || "");
    $('#owner_tmpl').hide();

    if (account.owners.length == 1) {

        $('input[name=owner_last]').val(account.owners[0].name);
        //$('input[name=owner_last_living]').val(['yes']);

    } else if (account.owners.length > 1) {

        for (var i = 0; i < account.owners.length; i++) {
            $('input[name=owner_last]').val(account.owners[i].name);
            $('input[name=owner_last_living]').val([account.owners[i].living]);

            if (i != account.owners.length - 1) {
                add_additional_owner();
            }
        }

    } else {
        var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });

        $.each(owner_ids, function () { if (this != 'owner_last') remove_owner(this); });
        reset_owner_all('owner_last');
        $('#add_additional_owner_btn').hide();
    }

    if (account.trustees.length == 1) {
        $('input[name=trustee_last]').val(account.trustees[0].name);

    } else if (account.trustees.length > 1) {

        for (var i = 0; i < account.trustees.length; i++) {

            $('input[name=trustee_last]').val(account.trustees[i].name);

            if (i != account.trustees.length - 1) {
                add_additional_trustee();
            }
        }

    } else {
        var trustee_ids = $.map($('input.trusteeclass'), function (e) { return e.name; });
        $.each(trustee_ids, function () { if (this != 'trustee_last') remove_trustee(this); });
        reset_trustee_all('trustee_last');
    }

    if (account.grantors.length == 1) {
        $('input[name=grantor_last]').val(account.grantors[0].name);
        $('input[name=grantor_last_living]').val([account.grantors[0].living]);

    } else if (account.grantors.length > 1) {

        for (var i = 0; i < account.grantors.length; i++) {
            $('input[name=grantor_last]').val(account.grantors[i].name);
            $('input[name=grantor_last_living]').val([account.grantors[i].living]);

            if (i != account.grantors.length - 1) {
                add_additional_grantor();
            }
        }

    } else {
        var grantor_ids = $.map($('input.grantorclass'), function (e) { return e.name; });
        $.each(grantor_ids, function () { if (this != 'grantor_last') remove_grantor(this); });
        reset_grantor_all('grantor_last');
    }

    $('input[name=trustein]').val(account.trustein || "");

    if (account.type == 'IRT') {
        show_grantors();
        show_trustees();
        show_trustein();
        hide_owners();
    } else {
        hide_grantors();
        hide_trustees();
        hide_trustein();
        show_owners();
		$('#institution_valid').hide(); 
    }

    if (account.type == "Trust" || account.type == "ITF" || account.type == "IrrevocableTrust") {
        show_beneficiaries();
        var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });

        if (account.beneficiaries.length == 1) {
            var beneficiary = account.beneficiaries[0];

            $('input[name=beneficiary_last]').val(beneficiary.name);
            if (beneficiary.type == "person") $('input[name=beneficiary_last_living]').val(['yes']);
            if (beneficiary.type == "charity") $('input[name=beneficiary_last_charity]').val(['yes']);
            if (account.type == "IrrevocableTrust") {
                if (beneficiary.type == "person") $('input[name=beneficiary_last1_living]').val(['yes']);
                if (beneficiary.type == "charity") $('input[name=beneficiary_last1_charity]').val(['yes']);
            }

            if (account.type == "ITF") {

                $('select[name=beneficiary_last_type]').val(beneficiary.type);
            }
            else {

                $('select[name=beneficiary_last1_type]').val(beneficiary.type);
            }

        } else if (account.beneficiaries.length > 1) {

            for (var i = 0; i < account.beneficiaries.length; i++) {
                var beneficiary = account.beneficiaries[i];

                $('input[name=beneficiary_last]').val(beneficiary.name);
                if (beneficiary.type == "person") $('input[name=beneficiary_last_living]').val(['yes']);
                if (beneficiary.type == "charity") $('input[name=beneficiary_last_charity]').val(['yes']);

                if (account.type == "ITF") {

                    $('select[name=beneficiary_last_type]').val(beneficiary.type);
                }
                else {

                    $('select[name=beneficiary_last1_type]').val(beneficiary.type);
                    if (beneficiary.type == "person") $('input[name=beneficiary_last1_living]').val(['yes']);
                    if (beneficiary.type == "charity") $('input[name=beneficiary_last1_charity]').val(['yes']);
                }


                if (i != account.beneficiaries.length - 1) {
                    add_additional_beneficiary();
                }
            }

        } else {
            var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
            $.each(ben_ids, function () { if (this != "beneficiary_last") remove_beneficiary(this); });
            reset_beneficiary_all('beneficiary_last');
        }

    } else {
        var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
        $.each(ben_ids, function () { if (this != "beneficiary_last") remove_beneficiary(this); });
        reset_beneficiary_all('beneficiary_last');
        hide_beneficiaries();
        hide_beneficiaries_irt();
    }

    // setup the business account fields

    $('#business_account_type').val(baccount.account_type || "");
    $('#business_account_name').val(baccount.account_name || "");
    $('#business_name').val(baccount.name || "");
    $('#business_account_balance').val(baccount.balance || "");
    $('#ein').val(baccount.ein || "");
    $('#business_deposit_type').val(baccount.deposit_type || "");

    if (baccount.id != 'new') {
        $('input[name=sole_proprietorship]').filter('[value=no]').click();
    } else {
        $('input[name=sole_proprietorship]').attr('checked', false);
    }

    // setup the public account fields

    $('#public_unit_name').val(paccount.name || "");
    $('#public_account_balance').val(paccount.balance || "");
    $('#publicein').val(paccount.ein || "");
    $('#public_account_name').val(paccount.account_name || "");
    $('#custodian').val(paccount.custodian || "");
    $('#account_holder').val(paccount.account_holder || "");
    $('#public_deposit_type').val(paccount.deposit_type || "");

    if (paccount.id != 'new') {
        if (paccount.state_match) $('input[name=state_match]').val(['yes']);
        else $('input[name=state_match]').val(['no']);

        $('input[name=public_unit_definition]').filter('[value=yes]').click();
        $('input[name=custodian_definition]').filter('[value=yes]').click();

    } else {
        $('input[name=state_match]').attr('checked', false);
        $('input[name=custodian_definition]').attr('checked', false);
        $('input[name=public_unit_definition]').attr('checked', false);
    }

    // If we're editing, validate, otherwise skip validation and reset the validation markers

    if (validate_after_populate) {
        error_tracker = {};
        validate_calculator();
        $('#button_div').empty();
        $('<input type="button" class="usa-button usa-button--primary  margin-bottom-3 margin-x-auto text-uppercase"  btn title="Save Edits" value="Save Edits"/>&nbsp;').appendTo('#button_div').bind('click', function (e) {
            track_save_edits_click();
            process_calculator();
        });

        var remove_account_func = function () { remove_account($('#active_account_id').val()); };

        // also change button wording and add a remove from report button for both business and personal
    } else {
        $('img[alt=Status]').attr("src", 'images/check_grey.gif');
        $('img[alt=Status]').attr('title', 'Status');
        $('#button_div').empty();
        $('<input type="button" title="Add to report" class="usa-button usa-button--primary  margin-bottom-3 margin-x-auto text-uppercase"  btn value="Add to report"/>&nbsp;').appendTo('#button_div').bind('click', function (e) {
            track_add_to_report_click();
            process_calculator();
        });

        if (validate_institutionfield) validate_institution();

    }

    wlabelize();

    if (!noscroll) scroll_up();

    edit_hash = getInputsHash(account.id || baccount.id || paccount.id || -1);
}

//R5.7.3: if deposit type is Noninterst-bearing checking Account, confirm whether it's full coverage, yes->continue, no->pick another account
function process_calculator_new() {
    error_tracker = {};
    if (!validate_calculator()) {
        show_save_error();
        return;
    }
    else {
        var account_deposit_type;
        if (get_account_type() == "personal") {
            account_deposit_type = $('#deposit_type').val();
        } else if (get_account_type() == "public") {
            account_deposit_type = $('#public_deposit_type').val();
        } else {
            account_deposit_type = $('#business_deposit_type').val();
        }

        if (account_deposit_type == "non_interest") {
            show_yesno("%meet_unlimited_coverage%",
                function () {
                    tb_remove();
                    setTimeout("process_calculator()", 1000);
                },
                function () {
                    tb_remove();
                    setTimeout("show_alert('<p>' + '%select_now_int_account%' + '</p>');", 1000);
                }
            );
            return;
        }
        else {
            process_calculator();
        }
    }
}

function process_calculator() {
    error_tracker = {};

    if (!validate_calculator()) {
        show_save_error();
        return;
    }

	process_calculator_m();

	/**
    var account = null;
    var institution = null;

    var accountid = $('#active_account_id').val();

    if (accountid && accountid != 'new') {
        account = find_account(accountid);
        institution = institutions[0];
        if (!institution) { alert('An error occurred: Missing institution.'); return }

    } else if (accountid == 'new') {
        if (get_account_type() == "personal") account = new PersonalAccount();
        if (get_account_type() == "business") account = new BusinessAccount();
        if (get_account_type() == "public") account = new PublicAccount();

        if (institutions.length)
            institution = institutions[0];
        else {
            institution = new Institution(htmlEntities($('#institution').text()));
            institutions.push(institution);
        }

        if (get_account_type() == "personal") institution.add_personal_account(account);
        if (get_account_type() == "business") institution.add_business_account(account);
        if (get_account_type() == "public") institution.add_public_account(account);
    }

    if (!account) { alert("An error occurred: Couldn't process form."); return; }

    if (get_account_type() == "personal") {

        account.name = $('#account_name').val();
        account.balance = $('#account_balance').val();
        account.type = $('#account_type').val();
        account.deposit_type = $('#deposit_type').val();

        account.owners = new Array();
        account.beneficiaries = new Array();
        account.grantors = new Array();
        account.trustees = new Array();

        if (account.type != "IRT") {
            var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });

            for (var i = 0; i < owner_ids.length; i++) {
                var owner = new Owner();
                owner.name = $('input[name=' + owner_ids[i] + ']').val();
                owner.living = $("input[name=" + owner_ids[i] + "_living]:checked").val(); 
                account.add_owner(owner);
            }
        } else {
            var trustee_ids = $.map($('input.trusteeclass'), function (e) { return e.name; });

            for (var i = 0; i < trustee_ids.length; i++) {
                var trustee = new Trustee();
                trustee.name = $('input[name=' + trustee_ids[i] + ']').val();
                account.add_trustee(trustee);
            }

            var grantor_ids = $.map($('input.grantorclass'), function (e) { return e.name; });

            for (var i = 0; i < grantor_ids.length; i++) {
                var grantor = new Grantor();
                grantor.name = $('input[name=' + grantor_ids[i] + ']').val();
                grantor.living = $("input[name=" + grantor_ids[i] + "_living]:checked").val();
                account.add_grantor(grantor);
            }

            account.trustein = $('input[name=trustein]').val();
        }
        if (account.type == "IrrevocableTrust") {
            account.ein = $('#ein_irt').val();
        }
        if (account.type == 'Trust' || account.type == 'ITF' || account.type == "IrrevocableTrust") {
            var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });

            for (var i = 0; i < ben_ids.length; i++) {
                var ben = new Beneficiary();
                ben.name = $('input[name=' + ben_ids[i] + ']').val();
                if (account.type == 'ITF') {                       
                    ben.type = $('select[name=' + ben_ids[i] + '_type]').val();
                }
                else {
                    if (ben_ids[i] == 'beneficiary_last') {
                        ben.type = $('select[name=' + ben_ids[i] + '1_type]').val();
                    }
                    else {
                        ben.type = $('select[name=' + ben_ids[i] + '_type]').val();
                    }
                }
                account.add_beneficiary(ben);
            }
        }
    } else if (get_account_type() == "public") {

        institution.name = htmlEntities($('#institution').text());
        account.balance = $('#public_account_balance').val();
        account.name = $('#public_unit_name').val();
        account.ein = $('#publicein').val();
        account.deposit_type = $('#public_deposit_type').val();
        account.account_name = $('#public_account_name').val();
        account.custodian = $('#custodian').val();
        account.account_holder = $('#account_holder').val();

        if ($("input[name=state_match]:checked").val() == 'yes') {
            account.state_match = true;
        } else {
            account.state_match = false;
        }

    } else {

        institution.name = htmlEntities($('#institution').text());
        account.balance = $('#business_account_balance').val();
        account.name = $('#business_name').val();
        account.ein = $('#ein').val();
        account.deposit_type = $('#business_deposit_type').val();
        account.account_name = $('#business_account_name').val();

    }

    doing_edit = false;

    populate_calculator(null, null, null, null, true);

    calculate_insurance_flag = false;
    render_report();
	**/
}

function hasData() {

    if ((selected_account_type || '') == '') {
        return false;
    }

    var accountid = $('#active_account_id').val() || '';

    if (accountid != 'new') {
        return false;
    }

    if (selected_account_type == "personal") {

        var personalaccountname = $('#account_name').val();
        var personalaccountbalance = $('#account_balance').val();
        var personalaccounttype = $('#account_type').val();
        var personalaccountdeposit_type = $('#deposit_type').val();
        var trustein = '';

        var owners = new Array();
        var beneficiaries = new Array();
        var grantors = new Array();
        var trustees = new Array();

        var hasBen = false;
        var hasOwner = false;
        var hasTrustee = false;
        var hasGrantor = false;

        var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });

        if (owner_ids) {
            for (var i = 0; i < owner_ids.length; i++) {
                var ownername = $('input[name=' + owner_ids[i] + ']').val() || '';
                var ownerliving = $("input[name=" + owner_ids[i] + "_living]:checked").val() || '';

                if ((ownername || '') != '' ||
                    (ownerliving || '') != '') {
                    hasOwner = true;
                }
            }
        }

        var trustee_ids = $.map($('input.trusteeclass'), function (e) { return e.name; });

        if (trustee_ids) {
            for (var i = 0; i < trustee_ids.length; i++) {
                var trusteename = $('input[name=' + trustee_ids[i] + ']').val() || '';

                if ((trusteename || '') != '') {
                    hasTrustee = true;
                }
            }
        }

        var grantor_ids = $.map($('input.grantorclass'), function (e) { return e.name; });

        if (grantor_ids) {
            for (var i = 0; i < grantor_ids.length; i++) {
                var grantorname = $('input[name=' + grantor_ids[i] + ']').val() || '';
                var grantorliving = $("input[name=" + grantor_ids[i] + "_living]:checked").val() || '';

                if ((grantorname || '') != '' ||
                    (grantorliving || '') != '') {
                    hasGrantor = true;
                }
            }
        }

        trustein = $('input[name=trustein]').val() || '';

        var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });

        if (ben_ids) {
            for (var i = 0; i < ben_ids.length; i++) {
                var benname = $('input[name=' + ben_ids[i] + ']').val() || '';
                var bentype = $('select[name=' + ben_ids[i] + '_type]').val() || '';
                var benliving = $("input[name=" + ben_ids[i] + "_living]:checked").val() || '';
                var bencharity = $("input[name=" + ben_ids[i] + "_charity]:checked").val() || '';

                if ((benname || '') != '' ||
                    (bentype || '') != '' ||
                    (benliving || '') != '' ||
                    (bencharity || '') != '') {
                    hasBen = true;
                }
            }
        }

        if ((personalaccountname || '') != '' ||
            (personalaccountbalance || '') != '' ||
            (personalaccountdeposit_type || '') != '' ||
            (personalaccounttype || '') != '' ||
            (trustein || '') != '' ||
            hasBen == true ||
            hasOwner == true ||
            hasTrustee == true ||
            hasGrantor == true) {
            return true;
        }

    } else if (selected_account_type == "public") {

        var publicaccountbalance = $('#public_account_balance').val();
        var publicaccountname = $('#public_unit_name').val();
        var publicaccountein = $('#publicein').val();
        var publicaccountdeposit_type = $('#public_deposit_type').val();
        var publicaccountaccount_name = $('#public_account_name').val();
        var publicaccountcustodian = $('#custodian').val();
        var publicaccountaccount_holder = $('#account_holder').val();
        var publicaccountcustodian_definition = $("input[name=custodian_definition]:checked").val();
        var publicaccountpublic_unit_definition = $("input[name=public_unit_definition]:checked").val();
        var publicaccountstate_match = $("input[name=state_match]:checked").val();

        if ((publicaccountbalance || '') != '' ||
            (publicaccountname || '') != '' ||
            (publicaccountein || '') != '' ||
            (publicaccountdeposit_type || '') != '' ||
            (publicaccountaccount_name || '') != '' ||
            (publicaccountcustodian || '') != '' ||
            (publicaccountaccount_holder || '') != '' ||
            (publicaccountcustodian_definition || '') != '' ||
            (publicaccountpublic_unit_definition || '') != '' ||
            (publicaccountstate_match || '') != '') {
            return true;
        }

    } else if (selected_account_type == "business") {

        var businessaccountbalance = $('#business_account_balance').val();
        var businessaccountname = $('#business_name').val();
        var businessaccountein = $('#ein').val();
        var businessaccountdeposit_type = $('#business_deposit_type').val();
        var businessaccountaccount_name = $('#business_account_name').val();

        if ((businessaccountbalance || '') != '' ||
            (businessaccountname || '') != '' ||
            (businessaccountein || '') != '' ||
            (businessaccountdeposit_type || '') != '' ||
            (businessaccountaccount_name || '') != '') {
            return true;
        }

    }

    return false;

}

function show_save_error() {
    var error_msg = "";
    var error_msg_trust1 = "";
    var error_msg_trust2 = "";
    var error_msg_pod1 = "";
    var error_msg_pod2 = "";
	var error_msg_beneficiary_living ="";
    var error_flags = 0x0;
    var error_msg_same_owner = "";
    var error_msg_beneficiary = "";
    var error_msg_owner_last_living = "";
    var error_msg_same_ein_trust = "";
    var error_msg_same_ein_business = "";
    var error_msg_same_ein_business_business = "";
    same_owner_name = false;
    for (var key in error_tracker) {
        error_flags |= error_tracker[key];
    }

    if (error_flags == 0x7) error_msg = 'The information in one or more fields is either missing, incorrect, or indicates an account EDIE cannot process. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    else if (error_flags == 0x3) error_msg = 'The information in one or more fields is missing and/or invalid. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    else if (error_flags == 0x5) error_msg = 'The information in one or more fields is missing and/or indicates that EDIE may not be able to calculate the insurance coverage of this account group. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    else if (error_flags == 0x6) error_msg = 'The information in one or more fields is invalid and/or indicates that EDIE may not be able to calculate the insurance coverage of this account group. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    else if (error_flags == 0x1) error_msg = 'The information in one or more fields is missing. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    else if (error_flags == 0x2) error_msg = 'The information in one or more fields is invalid. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    else if (error_flags == 0x4) error_msg = '<center>The information in one or more fields indicates that EDIE may not be able to calculate the insurance coverage of this account group. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.</center>';

    if (!error_msg) error_msg = 'The information in one or more fields is either missing, incorrect, or indicates an account EDIE cannot process. Move the arrow over any red <img src="images/check_red.gif"/> icons for detailed instructions.';
    error_msg_trust1 = 'You have indicated that an owner of this formal revocable trust is not living. Only living owners of revocable trust accounts are included in the calculation.  If this is the only owner of this trust, please return to the Ownership Category drop-down menu and enter the account as an <b>Irrevocable Trust</b>. If there is a living owner, please add that owner and delete the deceased owner to continue.  If this owner is alive, change your response to <b>Yes</b> to continue. If you have questions, please contact <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.';
    error_msg_trust2 = 'You have indicated that both owners of this formal revocable trust are not living. Only living owners of revocable trust accounts are included in the calculation. If both owners of this trust are deceased, please return to the <b>Ownership Category</b> drop-down menu and enter the account as an <b>Irrevocable Trust, <u> with the last living owner as the sole owner of the account</u></b>. If there is a living owner, please delete the deceased owner and add the living owner to continue.  If this owner is alive, change your response to <b>Yes</b> to continue. If you have questions, please contact <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.';
    error_msg_pod1 = 'You have indicated that an owner of this POD/ITF account is not living. Only living owners of POD/ITF accounts are included in the calculation. If there is a living owner, please add that owner and delete the deceased owner to continue.  If this owner is alive, please change your response to <b>Yes</b> to continue.  If you have questions, please contact <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.';
    error_msg_pod2 = 'You have indicated that both owners of this POD/ITF account are not living.  Only living owners of POD/ITF accounts are included in the calculation.  If there is a living owner, please delete the deceased owner and add the living owner to continue. If an owner is alive, correct your response to <b>Yes</b> to continue.  If you have questions, please contact <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.';
    error_msg_beneficiary_living = 'Only living beneficiaries of Trust accounts are included in the calculation.  Please delete the deceased beneficiary to continue with the report.  If you selected that a beneficiary is deceased in error, correct your response to <b>YES</b> to continue. If you have questions, please contact <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.';
    error_msg_same_owner = 'You have indicated that an owner is living on one account and deceased on another account.  Please change your response to continue.';
    error_msg_beneficiary = 'You entered the same person as both the owner and beneficiary of this account. For deposit insurance purposes, the FDIC considers a trust beneficiary to be the person or entity who receives the trust deposits after the death of the last owner. Please correct your response to continue.';
    error_msg_owner_last_living = 'You did not answer the question &#8220;Is the Owner Living?&#8221;.   Respond to the question using the radio buttons provided.';
    error_msg_same_ein_trust = 'You have entered the same EIN number for a Trust Account and a Business Account. Please modify the EIN number.';
    error_msg_same_ein_business = 'You have entered the same EIN number for a Business Account and a Trust Account. Please modify the EIN number.';
    error_msg_same_ein_business_business = 'You have entered the same EIN number for separate businesses. Please change the EIN number to continue.';

    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF') {
        if (!validate_calculator_personal_main()) {
            show_alert('<p>' + error_msg + '</p>');
        }
        else {
            if ((!validate_calculator_personal_living()) && (validate_calculator_beneficiary_living()) && (validate_calculator_personal_living_null() == 0)) {
                if (validate_calculator_personal_living_no() == 0) {
                    show_alert('<p>' + error_msg + '</p>');
                }
                if (validate_calculator_personal_living_no() == 1) {
                    if ($('#account_type').val() == 'Trust') {
                        show_alert('<p>' + error_msg_trust1 + '</p>');
                    }
                    else {
                        show_alert('<p>' + error_msg_pod1 + '</p>');
                    }

                }

                if (validate_calculator_personal_living_no() == 2) {
                    if ($('#account_type').val() == 'Trust') {
                        show_alert('<p>' + error_msg_trust2 + '</p>');
                    }
                    else {
                        show_alert('<p>' + error_msg_pod2 + '</p>');
                    }
                }
            }
            else {
			   if  (validate_calculator_personal_living() &&  validate_calculator_beneficiary_no() == 1 &&  validate_calculator_beneficiary_living_no() == 1 ){
                show_alert('<p>' + error_msg_beneficiary_living  + '</p>');
                
               }
               else{
                   if (validate_calculator_personal_living() && validate_calculator_beneficiary_name_no() == 1 && validate_calculator_beneficiary_living_no() == 0) {
                       show_alert('<p>' + error_msg_beneficiary + '</p>');
                   }
                   else {
                       if ((!validate_calculator_personal_living()) && validate_owner_name_only() && validate_calculator_beneficiary_living() && (validate_calculator_personal_living_no() == 0) && (validate_calculator_personal_living_null() == 1)) {
                           show_alert('<p>' + error_msg_owner_last_living + '</p>');
                       }
                       else {
                           show_alert('<p>' + error_msg + '</p>');
                       }
                   }
              }
                
            }
        }

    }
    else if ($('#account_type').val() == 'IrrevocableTrust')

        if (!validate_calculator_personal_main()) {
            if (account_same_ein()) {
                show_alert('<p>' + error_msg_same_ein_trust + '</p>');
            }
            else {
                show_alert('<p>' + error_msg + '</p>');
            }
        }
        else {
            if ((!validate_calculator_personal_living()) && (validate_calculator_personal_living_null() == 0) && validate_calculator_beneficiary_living() ) {

                if (validate_calculator_personal_living_no() == 0) {
                    show_alert('<p>' + error_msg + '</p>');
                }
                if (validate_calculator_personal_living_no() == 1) {
                    if (same_owner_name) {
                        show_alert('<p>' + error_msg_same_owner + '</p>');
                    }
                    else {
                        
                            setTimeout(show_yesno("<span>Were both owners living when the irrevocable trust was created?</span>",
                                function () {
                                    tb_remove();
                                    process_calculator_m();
                                },
                                function () {
                                    tb_remove();
                                    setTimeout("display_irt_one_alert()", 1000);
                                }), 1000);

                    }

                }

                if (validate_calculator_personal_living_no() == 2) {
                    if (same_owner_name) {
                        show_alert('<p>' + error_msg_same_owner + '</p>');
                    }
                    else {
                  
                            setTimeout(show_yesno("<span>Were both owners living when the irrevocable trust was created?</span>",
                                function () {
                                    tb_remove();
                                    process_calculator_m();
                                },
                                function () {
                                    tb_remove();
                                    setTimeout("display_irt_two_alert()", 1000);
                                }), 1000);
                   
                    }
                }

            }
            else {
			   if  (validate_calculator_personal_living() &&  validate_calculator_beneficiary_no() == 1 && validate_calculator_beneficiary_living_no() == 1 ){
                show_alert('<p>' + error_msg_beneficiary_living  + '</p>');
                
               }
              else{
                   if (validate_calculator_personal_living() && validate_calculator_beneficiary_name_no() == 1 && validate_calculator_beneficiary_living_no() == 0) {
                       show_alert('<p>' + error_msg_beneficiary + '</p>');
                   }
                   else {
                       if ((!validate_calculator_personal_living()) && validate_owner_name_only() && validate_calculator_beneficiary_living() && (validate_calculator_personal_living_no() == 0) && (validate_calculator_personal_living_null() == 1)) {
                           show_alert('<p>' + error_msg_owner_last_living + '</p>');
                       }
                       else {
                           if (validate_calculator_beneficiary_name_no() == 1 && validate_calculator_beneficiary_living_no() == 0) {
                               show_alert('<p>' + error_msg_beneficiary + '</p>');
                           }
                           else {
                               show_alert('<p>' + error_msg + '</p>');
                           }
                       }
                   }
               }
     
            }
        }
    else {
        if ((!validate_calculator_personal_living()) && validate_owner_name_only() && validate_calculator_beneficiary_living() && (validate_calculator_personal_living_no() == 0) && (validate_calculator_personal_living_null() == 1) && (get_account_type() == "personal")) {
            show_alert('<p>' + error_msg_owner_last_living + '</p>');
        }
        else {
            if (account_same_ein()) {
                show_alert('<p>' + error_msg_same_ein_business + '</p>');
            }
            else {
                if (account_same_ein_business()) {
                    show_alert('<p>' + error_msg_same_ein_business_business + '</p>'); 
                     }
                else {
                    show_alert('<p>' + error_msg + '</p>');
                    }
             }
        }

    }
}

function display_irt_one_alert() {
    show_alert('<p>' + 'You have indicated an owner of this irrevocable trust is living.  Please delete the living owner and keep the deceased owner as the sole owner of the trust. If the living owner has use of the funds in the trust, enter the living owner as one of the beneficiaries.   If both owners are deceased, please correct your response to <b>NO</b> to continue.  If you have questions, please contact <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
}

function display_irt_two_alert() {
    show_alert('<p>' + 'You have indicated that both owners of this irrevocable trust are not living. Please enter the <u><b>last living owner as the sole owner of the account</b></u>.  If the owner(s) are alive, correct your response to <b>Yes</b> to continue.  If you have questions, please contact <br><a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
}

function process_calculator_m() {
    error_tracker = {};

    // if (!validate_calculator()) {
    //     show_save_error();
    //     return;
    // }

    var account = null;
    var institution = null;

    var accountid = $('#active_account_id').val();

    if (accountid && accountid != 'new') {
        account = find_account(accountid);
        institution = institutions[0];
        if (!institution) { alert('An error occurred: Missing institution.'); return }

    } else if (accountid == 'new') {
        if (get_account_type() == "personal") account = new PersonalAccount();
        if (get_account_type() == "business") account = new BusinessAccount();
        if (get_account_type() == "public") account = new PublicAccount();

        if (institutions.length)
            institution = institutions[0];
        else {
            institution = new Institution(htmlEntities($('#institution').text()));
            institutions.push(institution);
        }

        if (get_account_type() == "personal") institution.add_personal_account(account);
        if (get_account_type() == "business") institution.add_business_account(account);
        if (get_account_type() == "public") institution.add_public_account(account);
    }

    if (!account) { alert("An error occurred: Couldn't process form."); return; }

    if (get_account_type() == "personal") {

        account.name = $('#account_name').val();
        account.balance = $('#account_balance').val();
        account.type = $('#account_type').val();
        account.deposit_type = $('#deposit_type').val();

        account.owners = new Array();
        account.beneficiaries = new Array();
        account.grantors = new Array();
        account.trustees = new Array();

        if (account.type != "IRT") {
            var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });

            for (var i = 0; i < owner_ids.length; i++) {
                var owner = new Owner();
                owner.name = $('input[name=' + owner_ids[i] + ']').val();
                owner.living = $("input[name=" + owner_ids[i] + "_living]:checked").val();
                account.add_owner(owner);
            }
        } else {
            var trustee_ids = $.map($('input.trusteeclass'), function (e) { return e.name; });

            for (var i = 0; i < trustee_ids.length; i++) {
                var trustee = new Trustee();
                trustee.name = $('input[name=' + trustee_ids[i] + ']').val();
                account.add_trustee(trustee);
            }

            var grantor_ids = $.map($('input.grantorclass'), function (e) { return e.name; });

            for (var i = 0; i < grantor_ids.length; i++) {
                var grantor = new Grantor();
                grantor.name = $('input[name=' + grantor_ids[i] + ']').val();
                grantor.living = $("input[name=" + grantor_ids[i] + "_living]:checked").val();
                account.add_grantor(grantor);
            }

            account.trustein = $('input[name=trustein]').val();
        }
        if (account.type == "IrrevocableTrust") {
            account.ein = $('#ein_irt').val();
        }
        if (account.type == 'Trust' || account.type == 'ITF' || account.type == "IrrevocableTrust") {
            var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });

            for (var i = 0; i < ben_ids.length; i++) {
                var ben = new Beneficiary();
                ben.name = $('input[name=' + ben_ids[i] + ']').val();
                if (account.type == 'ITF') {
                    ben.type = $('select[name=' + ben_ids[i] + '_type]').val();
                }
                else {
                    if (ben_ids[i] == 'beneficiary_last') {
                        ben.type = $('select[name=' + ben_ids[i] + '1_type]').val();
                    }
                    else {
                        ben.type = $('select[name=' + ben_ids[i] + '_type]').val();
                    }
                }
                account.add_beneficiary(ben);
            }
        }
    } else if (get_account_type() == "public") {

        institution.name = htmlEntities($('#institution').text());
        account.balance = $('#public_account_balance').val();
        account.name = $('#public_unit_name').val();
        account.ein = $('#publicein').val();
        account.deposit_type = $('#public_deposit_type').val();
        account.account_name = $('#public_account_name').val();
        account.custodian = $('#custodian').val();
        account.account_holder = $('#account_holder').val();

        if ($("input[name=state_match]:checked").val() == 'yes') {
            account.state_match = true;
        } else {
            account.state_match = false;
        }

    } else {

        institution.name = htmlEntities($('#institution').text());
        account.balance = $('#business_account_balance').val();
        account.name = $('#business_name').val();
        account.ein = $('#ein').val();
        account.deposit_type = $('#business_deposit_type').val();
        account.account_name = $('#business_account_name').val();

    }

    doing_edit = false;

    populate_calculator(null, null, null, null, true);

    calculate_insurance_flag = false;
    render_report();
}



function remove_account(accountid) {
    var institution = institutions[0];

    institution.remove_personal_account(accountid);
    institution.remove_business_account(accountid);
    institution.remove_public_account(accountid);

    populate_calculator();
    calculate_insurance_flag = false;
    render_report();
}

function start_over() {
    institutions = new Array();
    $('#printme').hide();
    $('#other_calculate_btn').hide();
    calculate_insurance_flag = false;
    swap_institution_back();
    show_calculator();
    populate_calculator();
    render_report();
    check_whitelabel();
    selected_account_type = '';
    doing_edit = false;
}

function check_local() {
    is_local = !(/^https?:\/\/([a-zA-Z0-9\.-]+\.)?fdic\.gov\//.test(window.location.href)
        || /[a-zA-Z0-9-]*edie[a-zA-Z0-9-]*\.app\.cloud\.gov/.test(window.location.href)
        // delete following line before shipping to prod
        || /127.0.0.1/.test(window.location.href)
    );

    local_version = version;
    local_version_date = version_date;

    if (is_local) {
        document.title = document.title.replace("Online Version", "Download Version " + version);

        $('#bankfinddiv').hide();

        version = "";
        var oScript = document.createElement("script");
        oScript.src = "https://www.fdic.gov/edie/current_version.js";
        document.body.appendChild(oScript);

        setTimeout('check_expiration()', 2000);
    }
}

function check_expiration() {

    var today = new Date();
    var version_date_obj = Date.parse(local_version_date);
    // about 6 months
    var max_time = 6 * 30 * 24 * 60 * 60 * 1000;
    var message = "";
    var expired = false;

    if (today - version_date_obj > max_time) {
        message += "<br>Your version of EDIE is over 6 months old and may no longer be up-to-date.";
    }

    if (version) {
        var lcomponents = local_version.split('.');
        var rcomponents = version.split('.');

        if (rcomponents[0] > lcomponents[0])
            expired = true;

        if (rcomponents[0] == lcomponents[0] && rcomponents[1] > lcomponents[1])
            expired = true;

        if (rcomponents[0] == lcomponents[0] && rcomponents[1] == lcomponents[1] && rcomponents[2] > lcomponents[2])
            expired = true;
    }

    if (expired) {
        message += "<br>A newer version of EDIE is now available.";
    }

    if (message) {
        $('#local_alert_div').html("<b>Note:</b>" + message + "<br>Please visit <a href=\"http://www.fdic.gov\" target=\"new\">http://www.fdic.gov</a> to download the latest version.");
        $('#local_alert_div').show();
    }

    version = local_version;
}

function render_actions() {

    //$('<table border="0" cellpadding="5" cellspacing="0" width="100%" role="presentation" ><tr><td align="center"><input id="print_button" type="button" value="Print this report" class="actionbutton"></td></tr><tr><td align="center"><input type="button" value="Create a new report" class="actionbutton" id="start_over_button"></td></tr></table>').appendTo('#actions_div');

    $('#print_button').bind('click', function () { print_report(); });

    var callback = function () { start_over(); };

    $('#start_over_button').bind('click', function () { show_confirm('If you start the EDIE program over again, you will lose all data entered in this session.', callback); });

}

/////////////////////////////////////////////////////////////////////////////////////////
// REPORT RENDERING / CALCULATION FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function render_report_override(insurance_limit) {
    if (insurance_limit) INSURANCE_LIMIT = insurance_limit;
    calculate_insurance_flag = true;
    render_report(true);
}

function render_report_override2(insurance_limit) {
    if (insurance_limit) INSURANCE_LIMIT = insurance_limit;
    calculate_insurance_flag = true;
    render_report(true, true);
}

function scroll_to_step2_top() {
    var step2Anchor = $('#step2_anchor');
    var top = 0;
    var step2TopPadding = 84;

    if (step2Anchor.length) {
        top = step2Anchor.offset().top;
    } else if ($('#report_div').length) {
        top = $('#report_div').offset().top;
    }

    if (top > step2TopPadding) {
        top = top - step2TopPadding;
    } else {
        top = 0;
    }

    $('html, body').scrollTop(top);
}

function render_report(skip_interests_check, skip_public_check) {

    $('#report_div').empty();
    known_people = new Array();
    known_eins = new Array();
    known_public_accts = new Array();
    known_business_accts = new Array();

    var eins = new Array();
    var people_map = new Array();
    var public_accts = new Array();
    var have_accounts = false;
    //R5.7.3: autocomplete for Business name
    var business_name = new Array();

    for (var i = 0; i < institutions.length; i++) {
        var institution = institutions[i];

        if (institution.personal_accounts.length == 0 && institution.public_accounts.length == 0 && institution.business_accounts.length == 0) {
            //$('#printme').hide();
            continue;
        }

        have_accounts = true;

        for (var j = 0; j < institution.personal_accounts.length; j++) {
            var account = institution.personal_accounts[j];
            var names = $.map(account.owners, function (e) { return e.name });
            for (var k = 0; k < names.length; k++) people_map[names[k].toLowerCase()] = names[k];

            names = $.map(account.beneficiaries, function (e) { return e.name });
            for (var k = 0; k < names.length; k++) people_map[names[k].toLowerCase()] = names[k];

            names = $.map(account.grantors, function (e) { return e.name });
            for (var k = 0; k < names.length; k++) people_map[names[k].toLowerCase()] = names[k];

            names = $.map(account.trustees, function (e) { return e.name });
            for (var k = 0; k < names.length; k++) people_map[names[k].toLowerCase()] = names[k];

            if (account.trustein) eins[account.trustein] = 1;
        }

        for (var j = 0; j < institution.business_accounts.length; j++) {
            var account = institution.business_accounts[j];
            if (account.owner) people_map[account.owner.name.toLowerCase()] = account.owner.name;
            if (account.ein) eins[account.ein] = 1;
            //R5.7.3: autocomplete for Business name
            if (account.name) business_name[account.name] = 1;
        }

        for (var j = 0; j < institution.public_accounts.length; j++) {
            var account = institution.public_accounts[j];
            if (account.custodian) people_map[account.custodian.toLowerCase()] = account.custodian;
            if (account.account_holder) people_map[account.account_holder.toLowerCase()] = account.account_holder;
            if (account.ein) eins[account.ein] = 1;
            if (account.name) public_accts[account.name.toLowerCase()] = account.name;
        }

        render_institution(institution, skip_interests_check, skip_public_check);
    }

    for (var n in people_map) {
        known_people.push(people_map[n]);
    }
    for (var n in eins) {
        known_eins.push(n);
    }
    //R5.7.3: autocomplete for Business name
    for (var n in business_name) {
        known_business_accts.push(n);
    }
    for (var n in public_accts) {
        known_public_accts.push(public_accts[n]);
    }

    if (have_accounts) {
        show_report();
        scroll_to_step2_top();
        if (calculate_insurance_flag) {
            $('#print_button').attr('disabled', false);
            $('#print_button').css("color", "white");
            $('#add_another').show();
        } else {
            $('#print_button').attr('disabled', true);
            $('#print_button').css("color", "black");
            $('#add_another').hide();
        }
        show_actions();
    } else {
        hide_report();
        $('#print_button').attr('disabled', true);
        $('#print_button').css("color", "black");
        $('#add_another').hide();
        //hide_actions();
    }

    setup_autocompletes();

    wlabelize();
}

function setup_autocompletes() {
    $('input[name=owner_last]').autocomplete(known_people);
    $('input[name=beneficiary_last]').autocomplete(known_people);
    $('input[name=trustee_last]').autocomplete(known_people);
    $('input[name=grantor_last]').autocomplete(known_people);
    $('input[name=custodian]').autocomplete(known_people);
    $('input[name=account_holder]').autocomplete(known_people);
    $('input[name=trustein]').autocomplete(known_eins);
    $('input[name=publicein]').autocomplete(known_eins);
    $('input[name=ein]').autocomplete(known_eins);
    $('input[name=public_unit_name]').autocomplete(known_public_accts);
    //R5.7.3: autocomplete for business_name
    $('input[name=business_name]').autocomplete(known_business_accts);

}

function print_generic_window(source_selector) {
    var template = 'printgeneric.html';
    if (whitelabel) { template = 'wlprintgeneric.html'; }
    var generic_win = window.open(template, 'popwin', 'status=0,toolbar=0,location=0,menubar=1,directories=0,resizable=1,scrollbars=1,height=550,width=700');

    $(generic_win.document).ready(function () {

        setTimeout(function () {
            var clone = $(source_selector).clone();
            $(generic_win.document.body).find('#main_area').html(clone.html());
            $(generic_win.document.body).find('.help_button_div').remove();
            if (whitelabel) {
                $(generic_win.document.body).find('#wllogo').html(get_wllogo());
                $(generic_win.document.body).find('#fdiclogo').html(get_wlfdiclogo());
            }
        }, 1000);

        setTimeout(function () {
            generic_win.print();
        }, 2000);

    });

}

function print_report() {
    var template = 'print.html';
    if (whitelabel) { template = 'wlprint.html'; }
    var report_win = window.open(template, 'reportwin', 'status=0,toolbar=0,location=0,menubar=1,directories=0,resizable=1,scrollbars=1,height=550,width=700');

    setTimeout(function () {
        var clone = $('#report_div').clone();

        $(report_win.document.body).find('#main_area').html(clone.html());
        $(report_win.document.body).find('.pointer').remove();
        $(report_win.document.body).find('.recalc_link').remove();
        $(report_win.document.body).find('.displaymobile').remove();

        $(report_win.document.body).find('.displaydesktop').removeClass('displaydesktop');

        if (whitelabel) {
            $(report_win.document.body).find('#wllogo').html(get_wllogo());
            $(report_win.document.body).find('#fdiclogo').html(get_wlfdiclogo());
        }
    }, 3000);

    setTimeout(function () {
        report_win.print();
    }, 4000);

}

function render_institution(institution, skip_interests_check, skip_public_check) {

    var total_accounts = institution.business_accounts.length + institution.personal_accounts.length + institution.public_accounts.length;
    var status_graphic = '<img src="images\/report_green.gif" alt="Checkmark" id="institution_' + institution.id + '_status" width="28" height="28" border="0" class="institution_' + institution.id + '_status">';

    var institution_name = institution.name;
    institution_name = institution_name.replace(/\(Cert/, '<br>(Cert');
    //possibly turn those tbodys to something else
    $('<div class="displaydesktop"  id="institution_report_' + institution.id + '">' +
        '<div class="row padding10bottom"><div class="col inst_100"><div class="row"><div class="col inst_60" valign="top" align="left" style="font-size: 16px; font-weight: bold;">Bank Name: ' + institution_name + '</div>' +
        '<div class="col inst_40" valign="top" align="right" style="font-size: 16px; font-weight: bold;"><nobr>Number of Accounts: ' + total_accounts + '</nobr></div></br></div></div></div><div><div><div class="row padding10top"><p>' + status_graphic + '<p><div class="col padding0left padding0right" valign="top"  align="left" id="report_summary"></div></div></div></div></div>').appendTo('#report_div');

    $('<div class="displaymobile"  id="institution_report_mobile' + institution.id + '">' +
        '<div class="row padding10bottom"><div class="col inst_100"><div class="row"><div class="col inst_60" valign="top" align="left" style="font-size: 16px; font-weight: bold;">Bank Name: ' + institution_name + '</div>' +
        '<div class="col inst_40" valign="top" align="right" style="font-size: 16px; font-weight: bold;"><nobr>Number of Accounts: ' + total_accounts + '</nobr></div></br></div></div></div><div><div><div class="row padding10top"><p>' + status_graphic + '<p><div class="col padding0left padding0right" valign="top"  align="left" id="report_summary_moible"></div></div></div></div></div>').appendTo('#report_div');
    var covered = true;

    var single_ownership_accounts = new Array();
    var joint_ownership_accounts = new Array();
    var retirement_accounts = new Array();
    var trust_accounts = new Array();
    var irrevocable_accounts = new Array();
    var business_accounts = institution.business_accounts;
    var public_accounts = institution.public_accounts;
    var show_extended_coverage = false;

    for (var i = 0; i < institution.personal_accounts.length; i++) {
        var account = institution.personal_accounts[i];
        if (account.deposit_type == "non_interest") show_extended_coverage = true;
        if (account.type == 'Trust' || account.type == 'ITF' || account.type == "IrrevocableTrust") {
            trust_accounts.push(account);
        } else if (account.type == "Retirement") {
            retirement_accounts.push(account);
        } else if (account.type == "Single") {
            single_ownership_accounts.push(account);
        } else if (account.type == "Joint") {
            joint_ownership_accounts.push(account);
        } else if (account.type == "IRT") {
            irrevocable_accounts.push(account);
        }
    }

    for (var i = 0; i < business_accounts.length; i++) {
        var account = business_accounts[i];
        if (account.deposit_type == "non_interest") show_extended_coverage = true;
    }

    for (var i = 0; i < public_accounts.length; i++) {
        var account = public_accounts[i];
        if (account.deposit_type == "non_interest") show_extended_coverage = true;
    }

    var check_equal_interests = false;

    if (calculate_insurance_flag && trust_accounts.length) {

        for (var i = 0; i < trust_accounts.length; i++) {

            var account = trust_accounts[i];
            var owners = account.owners;

            for (var j = 0; j < owners.length; j++) {

                var owner_name = owners[j].name;

                var algo = check_special_cases(owner_name);

                if (algo == "verify_equal" || algo == "over_limit") {
                    check_equal_interests = true;
                }
            }
        }
    }

	//if(check_equal_interests && !skip_interests_check) {
	//    show_yesno("Do all of the named beneficiaries have an equal interest in their respective ITF/POD/Formal Revocable Trust Accounts?",
    //        function() {
    //            tb_remove();
    //            setTimeout("render_report_override()", 1000);
    //        },
    //        function() {
    //            tb_remove();
    //            setTimeout("display_unequal_coverage_alert()", 1000);     
    //        }
    //    );

    //    calculate_insurance_flag = false;
    //}

    var check_public_account = false;

    if (calculate_insurance_flag && public_accounts.length) {
        check_public_account = true;
    }

    if (check_public_account && !skip_public_check) {
        show_yesno("Please confirm all deposits held by this public unit at this bank are included in this EDIE report.",
            function () {
                tb_remove();
                setTimeout("render_report_override2()", 1000);
            },
            function () {
                tb_remove();
                setTimeout("display_public_accounts_alert()", 1000);
            }
        );

        calculate_insurance_flag = false;
    }

    var balance = 0;
    var insured = 0;
    var uninsured = 0;
    var coverage = 0;

    var res = render_ownership(single_ownership_accounts, institution, "Single Accounts", "Single", INSURANCE_LIMIT, trust_accounts, irrevocable_accounts);

    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
    }

    res = render_ownership(joint_ownership_accounts, institution, "Joint Accounts", "Joint", INSURANCE_LIMIT);
    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
    }

    res = render_ownership(retirement_accounts, institution, "IRA Accounts", "IRA Account", 250000);
    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
    }

    /// if (account.type == 'IrrevocableTrust') {    
    //     var types = 'Irrevocable';
    //  }
    //  else {
    //      var types = 'Revocable';
    //  }
    
    res = render_living_trust(trust_accounts, institution);
    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
        coverage += res[3];
    }

    res = render_irrevocable_trust(irrevocable_accounts, institution);
    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
    }

    res = render_business(business_accounts, institution);
    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
    }

    res = render_public(public_accounts, institution);
    if (res) {
        balance += res[0];
        insured += res[1];
        uninsured += res[2];
    }

    //R5.7.3: nibta report--- begin -- R5.8.1 Remove NIBTA logic
    // nibta_header_flag=false;

    //single account
    // var res = render_ownership_nibta(single_ownership_accounts, institution, "Noninterest-bearing Transaction Accounts", "Single", INSURANCE_LIMIT, trust_accounts, irrevocable_accounts);

    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }

    //joint account
    // res = render_ownership_nibta(joint_ownership_accounts, institution, "Noninterest-bearing Transaction Accounts", "Joint", INSURANCE_LIMIT);
    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }

    //retirement account
    // res = render_ownership_nibta(retirement_accounts, institution, "Noninterest-bearing Transaction Accounts", "Retirement Account", 250000);
    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }

    //trust account
    // res = render_living_trust_nibta(trust_accounts, institution);
    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }

    //irrevocale trust account
    // res = render_irrevocable_trust_nibta(irrevocable_accounts, institution);
    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }

    //business account
    // res = render_business_nibta(business_accounts, institution);
    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }

    //public account
    // res = render_public_nibta(public_accounts, institution);
    // if(res) {
    // balance += res[0];
    // insured += res[1];
    // uninsured += res[2];
    // }
    //R5.7.3: nibta report--- end

    var content = render_institution_summary("Total for all accounts at " + institution.name + ".", balance, insured, uninsured);
    content.appendTo('#institution_report_' + institution.id);
    render_institution_summary_mobile("Total for all accounts at " + institution.name + ".", balance, insured, uninsured, institution);
    ;

    var summary = render_report_summary(uninsured);
    var summary_mobile = render_report_summary(uninsured);
    summary.appendTo('#report_summary').show();
    summary_mobile.appendTo('#report_summary_moible').show();
    //fix cols starting on mobile first
    if (document.body.clientWidth < 720) {
        let o = document.getElementsByClassName("summaryor");
        [...o].forEach(x => x.className += " col-xs-1");
        [...o].forEach(x => x.className += " mobileORCenter");
        [...o].forEach(x => x.classList.remove("col-1"));
    }


    if (!calculate_insurance_flag)
        summary.effect("highlight", { "color": "#ffff99" }, 1500);

    // set status graphic
     
    if (!calculate_insurance_flag) {
        $('#printme').hide();
        $('#institution_' + institution.id + '_status').remove();

    } else if (uninsured > 0) {
        if (account.type == 'Trust' || account.type == 'ITF' || account.type == "IrrevocableTrust") {
            if (coverage > 0) {
                    $('<div class="row"><div class="col-2 paddingwidth10" valign="top"  align="left"></div><div class="col" valign="top"  align="left"><b>The maximum deposit insurance coverage per trust owner when there are 5 or more beneficiaries is $1,250,000.</b><br/><br/></div></div>').appendTo('#institution_report_' + institution.id);
            }
        }
        $('#printme').show();
        $('.institution_' + institution.id + '_status').attr('src', 'images/report_alert.gif');
        //2nd col span 4
        //$('<div class="row"><div class="col-2 paddingwidth10" valign="top"  align="left"></div><div class="col" valign="top"  align="left"><b>If you&#8217;d like to learn more about what you can do to protect your deposits, please visit the <a class="inlineanchor" style="text-decoration:underline;" href="https://www.fdic.gov/resources/deposit-insurance/index.html" target="new" title="Deposit insurance homepage">deposit insurance homepage</a> or contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a>.</b><br/><br/></div></div>').appendTo('#institution_report_' + institution.id);
        //} else if (total_accounts == 0) {
        //    $('#printme').hide();
    } else {
        $('#printme').show();
    }

	    $('<div class="row"><div class="col-2 paddingwidth10" valign="top"  align="left"></div><div class="col" align="left"><b>If you&#8217;d like to learn more about what you can do to protect your deposits, please visit the <a class="inlineanchor" style="text-decoration:underline;" href="https://www.fdic.gov/resources/deposit-insurance/index.html" target="new" title="Deposit insurance homepage">deposit insurance homepage</a> or contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a>.</b><br/><br/></div></div>').appendTo('#institution_report_' + institution.id);

    if ($('.calculate_btn').length) {
        $('.calculate_btn')
            .off('click')
            .on('click', function (e) {
                track_calculate_coverage_click();

                var a = function () {
                    calculate_insurance_flag = true;
                    //if($('#set100').filter(":checked").length) {
                    //	INSURANCE_LIMIT = 100000;
                    //} else {
                    INSURANCE_LIMIT = 250000;
                    //}
                    render_report();
                };

                if (doing_edit && isEditDirty()) {
                    //var callback = function () { a(); };

                    //if (!show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', callback)) {
                    //    return;
                    //}
                    show_alert('<p>' + 'You have not yet saved your edits. Please save your edits before calculating your coverage.' + '</p>');
                }
                else {
                    a();
                }

            });
    }

    if ($('.recalculate_btn').length) {
        $('.recalculate_btn').bind('click', function (e) {
            calculate_insurance_flag = true;
            //if($('#set100').filter(":checked").length) {
            //	INSURANCE_LIMIT = 100000;
            //} else {
            INSURANCE_LIMIT = 250000;
            //}
            render_report_override2();
        });
    }
    if (!calculate_insurance_flag) {
         $('#institution_' + institution.id + '_status').hide();}

    else{
         $('#institution_' + institution.id + '_status').show();
        }
    // if any of the accounts are not interest-bearing show the extra coverage info 
    // if(show_extended_coverage)
    // if(is_local)
    // $('<tr><td valign="top" width="80" align="left"></td><td valign="top" colspan="4" align="left"><img src="images/img_asterisk.gif" width="7" alt="Note" height="10">The coverage amounts displayed for the account(s) with asterisks above only apply if the account(s) meet the requirements as noninterest-bearing transaction accounts.  This unlimited coverage is in effect through December 31, 2012. <a href="http://www.fdic.gov/news/news/financial/2010/fil10076.html" target="new">Read More</a></td></tr>').appendTo('#institution_report_'+institution.id);
    // else
    // $('<tr><td valign="top" width="80" align="left"></td><td valign="top" colspan="4" align="left"><img src="images/img_asterisk.gif" width="7" alt="Note" height="10">The coverage amounts displayed for the account(s) with asterisks above only apply if the account(s) meet the requirements as noninterest-bearing transaction accounts.  This unlimited coverage is in effect through December 31, 2012. <a href="http://www.fdic.gov/news/news/financial/2010/fil10076.html" target="new">Read More</a></td></tr>').appendTo('#institution_report_'+institution.id);

    // End table
    //2nd col span 4
    $('<div style="padding-bottom: 1.25rem" class="row"><div class="col-2 paddingwidth10" valign="top"  align="left"></div><div class="col" valign="top" align="left"><b>This calculation assumes that all of the above accounts are on deposit in an FDIC-insured bank, and that the account owners do not have accounts other than those listed above at ' + institution.name + '.</b></div></div>').appendTo('#institution_report_' + institution.id);
	    $('<div style="padding-bottom: 1.25rem" class="row"><div class="col-2 paddingwidth10" valign="top"  align="left"></div><div class="col" valign="top" align="left"><b>Please note that deposits in different banks are separately insured.  You will need to create a separate report for each bank where you have deposits' + '.</b></div></div>').appendTo('#institution_report_' + institution.id);
    //2nd col span 4
    if (calculate_insurance_flag) {
        $('<div style="padding-bottom: 1.25rem" class="row"><div class="col-2 paddingwidth10" valign="top" align="left"></div><div class="col" valign="top"  align="left">Report generated on: ' + get_date() + '</div></div>').appendTo('#institution_report_' + institution.id);
    }
}

function render_ownership(accounts, institution, header, type, insured_per_owner, trust_accounts, irrevocable_accounts) {

    if (!trust_accounts) trust_accounts = new Array();
    if (!irrevocable_accounts) irrevocable_accounts = new Array();

    if (accounts.length || trust_accounts.length || irrevocable_accounts.length) {
        var singleaccountsid = header.replace(/ /g, "_") + institution.id;
        var singleaccountsmobileid = header.replace(/ /g, "_") + "Mobile" + institution.id;
        var tbodyid = header.replace(/ /g, "_") + "body"
        var tableid = header.replace(/ /g, "_") + "table"
        var tempid = get_sequence();
        var account_header = render_account_header(header, 'temp_header' + tempid);
        $('<div id="' + singleaccountsid + '"class="SingleAccounts"> </div>').appendTo('#institution_report_' + institution.id);
        $('<div id="' + singleaccountsmobileid + '"class="SingleAccountsMobile"> </div>').appendTo('#institution_report_mobile' + institution.id);
        //mobile header
        if (accounts.length > 0) {
            $('<table id="' + tableid + '" class="fdic-table" border="0" cellspacing="1" cellpadding="4" role="presentation">' +
                '<thead> ' +
                '<tr class=" temp_header' + tempid + '"> ' +
                '<th scope="col" colspan="12" class="text-light text-left width-card font-size-12px" style="padding: 7px;border:none"> ' +
                '<div valign="top" class="col accounttype" align="left"><b>' + header + '</b></div> </th ></tr > ' +
                '<tr class="bgltgreen font-size-12px font-family-serif">' +
                '<td valign="top" colspan="2">&nbsp;</td>' +
                '<td valign="top" align="left" class=" accountinfo padding0"><b>Account Nickname</b></td>' +
                '<td valign="top" align="right" class=" accountinfo"><b>Balance</b></td>' +
                '<td valign="top" align="right" class=" accountinfo"><b>Owner(s)</b></td>' +
                '<td valign="top" align="right" class=" accountinfo"><b>Beneficiaries</b></td></tr> </thead>').appendTo('#' + singleaccountsmobileid);
        }
        //account_header.appendTo('#institution_report_'+institution.id);
        account_header.appendTo('#' + singleaccountsid);

        var distinct_owners = [];

        var running_balance = 0;

        //R5.7.3: flag whether there's nibta -- R5.8.4 Remove NIBTA logic
        //var int_and_nibta=false;

        for (var i = 0; i < accounts.length; i++) {
            var account = accounts[i];
            //if(account.deposit_type != "non_interest") {//R5.7.3: add this check to exclude nibta -- R5.8.1 Remove NIBTA logic
            for (var j = 0; j < account.owners.length; j++) {

                var owner = account.owners[j];
                if (!distinct_owners[owner.name.toLowerCase()]) distinct_owners[owner.name.toLowerCase()] = 0;
                distinct_owners[owner.name.toLowerCase()] += money_to_float(account.balance) / account.owners.length;
            }

            running_balance += money_to_float(account.balance);

            render_account(institution, account, tbodyid, tableid, singleaccountsid);
            //}
            //R5.7.3: flag there's nibta -- R5.8.1 Remove NIBTA logic
            // else{
            // if(money_to_float(account.balance)>0) int_and_nibta=true;
            // }
        }

        for (var i = 0; i < irrevocable_accounts.length; i++) {
            var account = irrevocable_accounts[i];
            var found = false;

            //if(account.deposit_type != "non_interest") {//R5.7.3: add this check to exclude nibta -- R5.8.1 Remove NIBTA logic
            for (var j = 0; j < account.grantors.length; j++) {
                var s = account.grantors[j];
                if (s.living == "yes1") {
                    if (!distinct_owners[s.name.toLowerCase()]) distinct_owners[s.name.toLowerCase()] = 0;
                    distinct_owners[s.name.toLowerCase()] += money_to_float(account.balance) / account.grantors.length;
                    found = true;
                    running_balance += money_to_float(account.balance) / account.grantors.length;
                }
            }

            if (found) render_irrevocable_account(institution, account);
            //}
            //R5.7.3: flag there's nibta -- R5.8.1 Remove NIBTA logic
            // else{
            // if(!int_and_nibta){
            // for(var j = 0; j < account.grantors.length; j++) {
            // var s = account.grantors[j];
            // if(s.living == "yes1") {found = true;}
            // }
            // if(money_to_float(account.balance)>0 && found) int_and_nibta=true;
            // }
            // }
        }

        for (var i = 0; i < trust_accounts.length; i++) {
            var account = trust_accounts[i];
            var account_balance = 0;

            //if(account.deposit_type != "non_interest") {//R5.7.3: add this check to exclude nibta -- R5.8.1 Remove NIBTA logic
            var slice = money_to_float(account.balance) / (account.owners.length * account.beneficiaries.length);
            for (var j = 0; j < account.owners.length; j++) {
                var owner = account.owners[j];
                for (var k = 0; k < account.beneficiaries.length; k++) {
                    var bene = account.beneficiaries[k];

                    if (bene.type == 'other') {
                        if (!distinct_owners[owner.name.toLowerCase()]) distinct_owners[owner.name.toLowerCase()] = 0;
                        distinct_owners[owner.name.toLowerCase()] += slice;

                        running_balance += slice;
                        render_trust_account(institution, account, owner.name.toLowerCase(), bene.name.toLowerCase(), slice);

                    }
                }
            }
            //}
            //R5.7.3: flag there's nibta -- R5.8.1 Remove NIBTA logic
            // else{
            // if(!int_and_nibta){
            // var found = false;
            // for(var j = 0; j < account.owners.length; j++) {
            // var owner = account.owners[j];
            // for(var k = 0; k < account.beneficiaries.length; k++) {
            // var bene = account.beneficiaries[k];
            // if(bene.type == 'other') {found=true;}
            // }
            // }
            // if(money_to_float(account.balance)>0 && found) int_and_nibta=true;
            // }
            // }
        }

        if (!running_balance) { $('.temp_header' + tempid).remove(); return null; }

        $('<div class="row"><div class="col-2 paddingwidth10" valign="top"></div>' +
            '<div valign="top" class="summary col padding0" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="summary col" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="summary col" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="summary col" align="right"><b>Uninsured</b></div>' +
            '</div > ').appendTo('#' + singleaccountsid);
        $('<tr class="">' +
            '<td colspan="2" class="" valign="top"></td> ' +
            '<td valign="top" class="summary padding0" align="left"><b>Insurance Summary</b></td> ' +
            '<td valign="top" class="summary " align="right"><b>Balance</b></td> ' +
            '<td valign="top" class="summary " align="right"><b>Insured</b></td> ' +
            '<td valign="top" class="summary " align="right"><b>Uninsured</b></td>' +
            '</tr > ').appendTo('#' + tbodyid);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ownername in distinct_owners) {
            var total = distinct_owners[ownername];
            var classname = "line";
            var totalclassname = "";
            var paddingw = " padding1";
            var insured = total;
            var uninsured = 0;
            var apostrophe ="";
            if (total > insured_per_owner) {
                classname = "uninsured";
                totalclassname = "uninsuredtotal";
                insured = insured_per_owner;
                uninsured = total - insured_per_owner;
            }
            total_insured += insured;
            total_uninsured += uninsured;
		
		    if (location.pathname == '/esp/calculator.html') {
			    ownername = type + ' de ' + cap_firsts(ownername);           
            }
            else{
                if (ownername.slice(-1) == 's'){  
                    apostrophe = '&#8217;';
                }
                else{
                    apostrophe ='&#8217;s';
                }
               ownername = cap_firsts(ownername) + apostrophe + ' ' + type;
            }

            if (calculate_insurance_flag) {
                $('<div class="row"><div class="col-2 paddingwidth10" valign="top"  align="left"></div>' +
                    '<div valign="top" class="col ' + classname + paddingw + '" align="left">' + (ownername) + '</div> ' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(total)) + '</div> ' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(insured)) + '</div> ' +
                    '<div valign="top" class="col ' + classname + ' padding0left" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div> ').appendTo('#' + singleaccountsid);
                $(' <tr class=" ">' +
                    '<td colspan="2" class="" valign="top" align="left"></td> ' +
                    '<td valign="top" class=" ' + classname + paddingw + '" align="left">' + (ownername) + '</td> ' +
                    '<td valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(total)) + '</td> ' +
                    '<td valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</td> ' +
                    '<td valign="top" class=" ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></td>' +
                    '</tr> ').appendTo('#' + tbodyid);

            } else {
                $('<div class="row "><div class="col-2 paddingwidth10" valign="top"  align="left"></div>' +
                    '<div class="col padding0" valign="top" align="left">' + (ownername) + '</div> ' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div> ' +
                    '<div class="col" valign="top" align="right"> <a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div> ' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div> ').appendTo('#' + singleaccountsid);
                $('<tr class=" ">' +
                    '<td colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td class="" valign="top" align="left">' + cap_firsts(ownername) + '</td>' +
                    '<td class="" valign="top" align="right">' + currency_format(roundit(total)) + '</td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            }
        }

		//R5.7.3: add note if there's nibta account
		// if(int_and_nibta){
			// $('<tr><td  colspan="5" valign="top" class="summary" align="left"><b>Note: Noninterest-bearing Transaction Accounts are displayed in a separate section below.</b></td></tr>').appendTo('#institution_report_'+institution.id);
		// }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }


        return [running_balance, total_insured, total_uninsured];

    }

    return null;
}

//R5.7.3: nibta calulator and report for single/joint/Retirement account
function render_ownership_nibta(accounts, institution, header, type, insured_per_owner, trust_accounts, irrevocable_accounts) {

    if (!trust_accounts) trust_accounts = new Array();
    if (!irrevocable_accounts) irrevocable_accounts = new Array();

    if (accounts.length || trust_accounts.length || irrevocable_accounts.length) {
        var tempid = get_sequence();
        if (!nibta_header_flag) {
            var account_header = render_header_nibta(header, 'temp_header' + tempid);
            account_header.appendTo('#institution_report_' + institution.id);
        }

        var distinct_owners = [];

        var running_balance = 0;

        var account_column_header_flag = false;
        var account_column_header;

        for (var i = 0; i < accounts.length; i++) {
            var account = accounts[i];

            if (account.deposit_type == "non_interest") {
                for (var j = 0; j < account.owners.length; j++) {

                    var owner = account.owners[j];
                    if (!distinct_owners[owner.name.toLowerCase()]) distinct_owners[owner.name.toLowerCase()] = 0;
                    distinct_owners[owner.name.toLowerCase()] += money_to_float(account.balance) / account.owners.length;
                }

                running_balance += money_to_float(account.balance);
                if (!account_column_header_flag) {
                    account_column_header = render_account_header_nibta('temp_header' + tempid);
                    account_column_header.appendTo('#institution_report_' + institution.id);
                    account_column_header_flag = true;
                }
                render_account(institution, account);
            }
        }

        for (var i = 0; i < irrevocable_accounts.length; i++) {
            var account = irrevocable_accounts[i];
            var found = false;
            if (account.deposit_type == "non_interest") {
                for (var j = 0; j < account.grantors.length; j++) {
                    var s = account.grantors[j];
                    if (s.living == "yes1") {
                        if (!distinct_owners[s.name.toLowerCase()]) distinct_owners[s.name.toLowerCase()] = 0;
                        distinct_owners[s.name.toLowerCase()] += money_to_float(account.balance) / account.grantors.length;
                        found = true;
                        running_balance += money_to_float(account.balance) / account.grantors.length;
                    }
                }

                if (found) {
                    if (!account_column_header_flag) {
                        account_column_header = render_account_header_nibta('temp_header' + tempid);
                        account_column_header.appendTo('#institution_report_' + institution.id);
                        account_column_header_flag = true;
                    }
                    render_irrevocable_account(institution, account);
                }
            }
        }

        for (var i = 0; i < trust_accounts.length; i++) {
            var account = trust_accounts[i];
            var account_balance = 0;

            if (account.deposit_type == "non_interest") {
                var slice = money_to_float(account.balance) / (account.owners.length * account.beneficiaries.length);
                for (var j = 0; j < account.owners.length; j++) {
                    var owner = account.owners[j];
                    for (var k = 0; k < account.beneficiaries.length; k++) {
                        var bene = account.beneficiaries[k];

                        if (bene.type == 'other') {
                            if (!distinct_owners[owner.name.toLowerCase()]) distinct_owners[owner.name.toLowerCase()] = 0;
                            distinct_owners[owner.name.toLowerCase()] += slice;

                            running_balance += slice;

                            if (!account_column_header_flag) {
                                account_column_header = render_account_header_nibta('temp_header' + tempid);
                                account_column_header.appendTo('#institution_report_' + institution.id);
                                account_column_header_flag = true;
                            }

                            render_trust_account(institution, account, owner.name.toLowerCase(), bene.name.toLowerCase(), slice);

                        }
                    }
                }
            }
        }

        if (!running_balance) {
            if (!nibta_header_flag) {
                $('.temp_header' + tempid).remove();
            }
            return null;
        }

        nibta_header_flag = true;

        $('<div class="row"><div class="col-2" valign="top"></div>' +
            '<div valign="top" class="summary col-3" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="summary col" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="summary col" align="right"><b>Insured</b></div>' +
            '<div  valign="top" class="summary col" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ownername in distinct_owners) {
            var total = distinct_owners[ownername];
            var classname = "line";
            var totalclassname = "";
            var insured = total;
            var uninsured = 0;

            total_insured += insured;
            total_uninsured += uninsured;

            if (calculate_insurance_flag) {
                $('<div class="row">' +
                    '<div class="col-2" valign="top" align="left"></div>' +
                    '<div valign="top" class="col-3 ' + classname + '" align="left">' + cap_firsts(ownername) + ' ' + type + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);

            } else {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top" align="left"></div>' +
                    '<div class="col-3" valign="top" align="left">' + cap_firsts(ownername) + ' ' + type + '</div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
            }
        }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }

        return [running_balance, total_insured, total_uninsured];

    }

    return null;
}

function render_living_trust(trust_accounts, institution) {

    if (trust_accounts.length) {
        var MAX_INSURED_LIMIT = 1250000;
        var singletrustid = "Singletrust" + institution.id;
        var singletrustmobileid = "SingletrustMobile" + institution.id;
        var tbodyid = "singletrustbody"
        var tempid = get_sequence();
        ///  if (types == 'Irrevocable') {
        //     var account_header = render_account_header("Irrevocable Trust Accounts", "lt_header");
        //  }
        //  else {
        var account_header = render_account_header("Trust Accounts", "lt_header");
            // }
        $('<div id="' + singletrustid + '"class="SingleAccounts"> </div>').appendTo('#institution_report_' + institution.id);
        $('<div id="' + singletrustmobileid + '"class="SingleTrustMobile"> </div>').appendTo('#institution_report_mobile' + institution.id);
        //mobile header
        $('<table id="singleTrusttable" class="fdic-table" border="0" cellspacing="1" cellpadding="4" role="presentation">' +
            '<thead>' +
            '<tr class=" temp_header' + tempid + '">' +
            '<th  scope="col" colspan="12" class="text-light text-left width-card font-size-12px" style="padding: 7px;border:none">' +
            '<div valign="top" class="col accounttype" align="left"><b>Trust Accounts</b></div>' +
            '</th>' +
            '</tr> ' +
            '<tr class="bgltgreen font-size-12px font-family-serif">' +
            '<td valign="top" colspan="2" >&nbsp;</td>' +
            '<td valign="top" align="left" class=" accountinfo padding0"><b>Account Nickname</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Balance</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Owner(s)</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Beneficiaries</b></td>' +
            '</tr> </thead>').appendTo('#' + singletrustmobileid);
        //account_header.appendTo('#institution_report_'+institution.id);
        account_header.appendTo('#' + singletrustid);
        //account_header.appendTo('#institution_report_'+institution.id);

        var combinations = [];

        var running_balance = 0;

        var insured_per_owner_bene = INSURANCE_LIMIT;

        var types = [];
		var types_order = [];

        //R5.7.3: flag whether there's nibta -- R5.8.1 Remove NIBTA logic
        //var int_and_nibta=false;

        for (var i = 0; i < trust_accounts.length; i++) {
            var account = trust_accounts[i];
            var account_balance = 0;
            var benes = new Array();

            //R5.7.3: exclude amount from nibta -- R5.8.1 Remove NIBTA logic
            var slice = money_to_float(account.balance) / (account.owners.length * account.beneficiaries.length);
            // var slice=0;
            // if(account.deposit_type != "non_interest") slice = money_to_float(account.balance) / (account.owners.length * account.beneficiaries.length);

            for (var j = 0; j < account.owners.length; j++) {
                var owner = account.owners[j];
                if (!combinations[owner.name.toLowerCase()]) combinations[owner.name.toLowerCase()] = [];
                if (!types[owner.name.toLowerCase()]) types[owner.name.toLowerCase()] = [];
				if (!types_order[owner.name.toLowerCase()]) types_order[owner.name.toLowerCase()] = [];

                //R5.7.3: exclude nibta -- R5.8.1 Remove NIBTA logic
                types[owner.name.toLowerCase()][account.type] = 1;
				types_order[owner.name.toLowerCase()][account.type] = i;
                //if(account.deposit_type != "non_interest") types[owner.name.toLowerCase()][account.type] = 1;

                for (var k = 0; k < account.beneficiaries.length; k++) {
                    var bene = account.beneficiaries[k];
                    // these get thrown in with single ownership
                    if (bene.type == "other") continue;

                    if (!combinations[owner.name.toLowerCase()][bene.name.toLowerCase()])
                        combinations[owner.name.toLowerCase()][bene.name.toLowerCase()] = 0;
                    combinations[owner.name.toLowerCase()][bene.name.toLowerCase()] += slice;

                    running_balance += slice;
                    account_balance += slice;
                }
            }

            //R5.7.3: flag if there's nibta
            // if(account.deposit_type == "non_interest" && money_to_float(account.balance)>0) {
            // int_and_nibta=true;
            // }

            if (account_balance)
                render_account(institution, account, tbodyid, "singleTrusttable", singletrustid);
        }

        if (!running_balance) { $('.lt_header').remove(); return null; }

        $('<div class="row">' +
            '<div class="col-2 paddingwidth10" valign="top">' +
            '</div><div valign="top" class="col summary padding0" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $('<tr class="">' +
            '<td  colspan="2" class="" valign="top"></td>' +
            '<td  valign="top" class="summary padding0" align="left"><b>Insurance Summary</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Balance</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Insured</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Uninsured</b></td>' +
            '</tr>').appendTo('#' + tbodyid);

        var total_insured = 0;
        var total_uninsured = 0;
        var ownerCount = 0;
        var coverage_true = 0;
        for (var ownername in combinations) {
            var total_for_owner = 0;
            var total_benes_for_owner = 0;
            ownerCount++;
            var bene_names = new Array();
            for (var benename in combinations[ownername]) {
                var total = combinations[ownername][benename];
                total_for_owner += total;
                total_benes_for_owner += 1;

                bene_names.push(('<b style=" font-size: 1.3em; "><li></b> ' + cap_firsts(benename)));
            }

            total_for_owner = Math.round(total_for_owner * 100) / 100

            if (total_for_owner == 0) continue;

            // default methodology
            var insured = 0;
            var uninsured = 0;

            if (check_special_cases(ownername) == "over_limit") {
                var initial_uninsured_amount = 0;

                for (var benename in combinations[ownername]) {
                    var bene_total = combinations[ownername][benename];
                    if (bene_total > insured_per_owner_bene) {
                        initial_uninsured_amount += bene_total - insured_per_owner_bene;
                    }
                }

                var actual_insured_balance = total_for_owner - initial_uninsured_amount;
                //if the uninsured is less than the insurance limit * 5
                if (actual_insured_balance < INSURANCE_LIMIT * 5) {
                    insured = Math.min(INSURANCE_LIMIT * 5, MAX_INSURED_LIMIT);
                } else {
                    insured = Math.min(actual_insured_balance, MAX_INSURED_LIMIT);
                }
                //calc uninsured amount
                uninsured = total_for_owner - insured;
                //uninsured cant go negative
                if (uninsured < 0) uninsured = 0;
                //insured equals total_for_owner when total_for_owner is less than Max_insured_limt
                if (total_for_owner <= MAX_INSURED_LIMIT) insured = total_for_owner;
            } else {
                insured = Math.min(total_benes_for_owner * insured_per_owner_bene, MAX_INSURED_LIMIT);
                uninsured = total_for_owner - insured;
                if (uninsured < 0) uninsured = 0;

            }
            if (types[ownername]['Trust'] == 1 || types[ownername]['ITF'] == 1 || types[ownername]['IrrevocableTrust'] == 1)
            {
                if (total_benes_for_owner >= 5) {
                    if (uninsured > 0 || total_for_owner >= 1250000) {
                        coverage_true += 1;
                    }
                }
            }


            total_insured += insured;
            total_uninsured += uninsured;
            if (total_for_owner <= insured) {
                insured = total_for_owner;
            }

            var classname = "line";
            var paddingw = " padding1";
            var totalclassname = "";
            if (uninsured > 0) {
                classname = "uninsured";
                totalclassname = "uninsuredtotal";
            }

            var benestring = bene_names.join("<br/>");
            var typestring = 'POD/ITF, Formal Revocable Trust, Irrevocable Trust';
			var typestring1 = '';
            var typestring2 = '';
            var typestring3 = '';
			var typestring4 = '';
			var typestring5 = '';
			var typestring6 = '';
			var typestring7 = '';
            var typestring8 = '';
            var typestring9 = '';
			var typestring10 = '';
			var typestring11 = '';
			var typestring12 = '';
            var apostrophe = "";

            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 0) typestring1 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 1) typestring2 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 2) typestring3 = 'Formal Revocable Trust' + ', ';
			if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 3) typestring4 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 4) typestring5 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 5) typestring6 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 6) typestring7 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 7) typestring8 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 8) typestring9 = 'Formal Revocable Trust' + ', ';
			if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 9) typestring10 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 10) typestring11 = 'Formal Revocable Trust' + ', ';
            if (types[ownername]['Trust'] == 1 && types_order[ownername]['Trust'] == 11) typestring12 = 'Formal Revocable Trust' + ', ';

            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 0) typestring1 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 1) typestring2 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 2) typestring3 = 'POD/ITF' + ', ';
			if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 3) typestring4 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 4) typestring5 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 5) typestring6 = 'POD/ITF' + ', ';
			if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 6) typestring7 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 7) typestring8 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 8) typestring9 = 'POD/ITF' + ', ';
			if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 9) typestring10 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 10) typestring11 = 'POD/ITF' + ', ';
            if (types[ownername]['ITF'] == 1 && types_order[ownername]['ITF'] == 11) typestring12 = 'POD/ITF' + ', ';

            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 0) typestring1 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 1) typestring2 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 2) typestring3 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 3) typestring4 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 4) typestring5 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 5) typestring6 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 6) typestring7 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 7) typestring8 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 8) typestring9 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 9) typestring10 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 10) typestring11 = 'Irrevocable Trust' + ', ';
            if (types[ownername]['IrrevocableTrust'] == 1 && types_order[ownername]['IrrevocableTrust'] == 11) typestring12 = 'Irrevocable Trust' + ', ';
			
            typestring = typestring1 + typestring2 + typestring3 + typestring4 + typestring5 + typestring6 + typestring7 + typestring8 + typestring9 + typestring10 + typestring11 + typestring12;
            typestring = typestring.substring(0,typestring.length-2);

			if (types_order[ownername]['Trust'] > 11 || types_order[ownername]['ITF'] > 11 || types_order[ownername]['IrrevocableTrust'] > 11) {
				if (types[ownername]['Trust'] == 1 && types[ownername]['ITF'] != 1 && types[ownername]['IrrevocableTrust'] != 1) typestring = 'Formal Revocable Trust';
				if (types[ownername]['Trust'] != 1 && types[ownername]['ITF'] == 1 && types[ownername]['IrrevocableTrust'] != 1) typestring = 'POD/ITF';
				if (types[ownername]['Trust'] != 1 && types[ownername]['ITF'] != 1 && types[ownername]['IrrevocableTrust'] == 1) typestring = 'Irrevocable Trust';
				if (types[ownername]['Trust'] == 1 && types[ownername]['ITF'] == 1 && types[ownername]['IrrevocableTrust'] != 1) typestring = 'POD/ITF, Formal Revocable Trust';
				if (types[ownername]['Trust'] == 1 && types[ownername]['ITF'] != 1 && types[ownername]['IrrevocableTrust'] == 1) typestring = 'Formal Revocable Trust, Irrevocable Trust';
				if (types[ownername]['Trust'] != 1 && types[ownername]['ITF'] == 1 && types[ownername]['IrrevocableTrust'] == 1) typestring = 'POD/ITF, Irrevocable Trust'
            }
	
			if (location.pathname == '/esp/calculator.html') {
			    ownername = typestring + ' de ' + cap_firsts(ownername);           
            }
            else{
                if (ownername.slice(-1) == 's'){  
                    apostrophe = '&#8217;';
                }
                else{
                    apostrophe ='&#8217;s';
                }
               ownername = cap_firsts(ownername) + apostrophe + ' ' + typestring; 
            }

            if (calculate_insurance_flag) {
                $('<div class="row ">' +
                    '<div class="col-2 paddingwidth10" valign="top"  align="left"></div>' +
                    '<div valign="top" class="col ' + classname + paddingw + '" align="left">' + (ownername) + ' ' + '<div><ul style="margin-left:1em;padding-left:0.5em">' + benestring + '</ul></div></div>' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(total_for_owner)) + '</div>' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right" >' + currency_format(roundit(insured)) + '</div>' +
                    '<div valign="top" class="col ' + classname + ' padding0left" align="right" ><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
                $('<tr class=" ">' +
                    '<td  colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td  valign="top" class=" ' + classname + paddingw + '" align="left">' + (ownername)  + ' ' + '<div><ul style="margin-left:1em;padding-left:0.5em">' + benestring + '</ul></div></td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right" >' + currency_format(roundit(total_for_owner)) + '</td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            } else {
                $('<div class="row " >' +
                    '<div class="col-2 paddingwidth10" valign="top"  align="left"></div>' +
                    '<div class="col padding0" valign="top" align="left">' + (ownername)  + ' ' + '<div><ul style="margin-left:1em;padding-left:0.5em">' + benestring + '</ul></div></div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total_for_owner)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
                $('<tr class=" ">' +
                    '<td colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td class="" valign="top" align="left">' + (ownername)  + ' ' + '<div><ul style="margin-left:1em;padding-left:0.5em">' + benestring + '</ul></div></td>' +
                    '<td class="" valign="top" align="right" >' + currency_format(roundit(total_for_owner)) + '</td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            }
        }

        $(window).scrollTop(640);
        //R5.7.3: add note if there's nibta account -- R5.8.1 Remove NIBTA logic
        // if(int_and_nibta){
			// $('<tr><td  colspan="5" valign="top" class="summary" align="left"><b>Note: Noninterest-bearing Transaction Accounts are displayed in a separate section below.</b></td></tr>').appendTo('#institution_report_'+institution.id);
        // }

        // fix rounding errors
        if (total_uninsured == 0) {
            total_insured = Math.min(running_balance, MAX_INSURED_LIMIT * ownerCount);
        }

       // return [running_balance, total_insured, total_uninsured, coverage_true];
	   return [running_balance, running_balance-total_uninsured, total_uninsured, coverage_true];

    }

    return null;

}

//R5.7.3: Nibta calculator and report for trust account
function render_living_trust_nibta(trust_accounts, institution) {

    if (trust_accounts.length) {

        if (!nibta_header_flag) {
            var account_header = render_header_nibta("Noninterest-bearing Transaction Accounts", "nibta_lt_header");
            account_header.appendTo('#institution_report_' + institution.id);
        }
        var account_column_header_flag = false;

        var nibta_combinations = [];
        var nibta_running_balance = 0;
        var nibta_types = [];
        var nibta_amount_per_owner = [];
        for (var i = 0; i < trust_accounts.length; i++) {
            var account = trust_accounts[i];
            var account_balance = 0;
            var benes = new Array();

            if (account.deposit_type == "non_interest") {
                var slice = 0;
                slice = money_to_float(account.balance) / account.owners.length;
                for (var j = 0; j < account.owners.length; j++) {
                    var owner = account.owners[j];
                    if (!nibta_combinations[owner.name.toLowerCase()]) nibta_combinations[owner.name.toLowerCase()] = [];
                    if (!nibta_types[owner.name.toLowerCase()]) nibta_types[owner.name.toLowerCase()] = [];
                    if (!nibta_amount_per_owner[owner.name.toLowerCase()]) nibta_amount_per_owner[owner.name.toLowerCase()] = 0;

                    nibta_types[owner.name.toLowerCase()][account.type] = 1;

                    nibta_amount_per_owner[owner.name.toLowerCase()] += slice;

                    for (var k = 0; k < account.beneficiaries.length; k++) {
                        var bene = account.beneficiaries[k];
                        // these get thrown in with single ownership
                        if (bene.type == "other") continue;

                        if (!nibta_combinations[owner.name.toLowerCase()][bene.name.toLowerCase()])
                            nibta_combinations[owner.name.toLowerCase()][bene.name.toLowerCase()] = 0;
                        nibta_combinations[owner.name.toLowerCase()][bene.name.toLowerCase()] += 0;

                    }

                }
                nibta_running_balance += money_to_float(account.balance);

                if (money_to_float(account.balance) > 0) {

                    if (!account_column_header_flag) {
                        var account_column_header = render_account_header_nibta("nibta_lt_header");
                        account_column_header.appendTo('#institution_report_' + institution.id);
                        account_column_header_flag = true;
                    }
                    render_account(institution, account);
                }
            }
        }

        if (!nibta_running_balance) {
            if (!nibta_header_flag) {
                $('.nibta_lt_header').remove();
            }
            return null;
        }
        nibta_header_flag = true;

        $('<div class="row">' +
            '<div class="col-2" valign="top"></div>' +
            '<div valign="top" class="col summary padding0" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);

        for (var ownername in nibta_combinations) {
            var total_for_owner = 0;
            var total_benes_for_owner = 0;
            var bene_names = new Array();
            for (var benename in nibta_combinations[ownername]) {
                bene_names.push(cap_firsts(benename));
            }

            total_for_owner = nibta_amount_per_owner[ownername];

            if (total_for_owner == 0) continue;

            // full insured for nibta

            var classname = "line";
            var paddingw = ' padding1';
            var totalclassname = "";

            var benestring = bene_names.join(", ");
            var typestring = 'POD/ITF, Formal Revocable Trust, Irrevocable Trust';

            if (types[ownername]['Trust'] == 1) typestring = 'Formal Revocable Trust';

            if (types[ownername]['ITF'] == 1) typestring = 'POD/ITF';

            if (types[ownername]['IrrevocableTrust'] == 1) typestring = 'Irrevocable Trust';

            if (calculate_insurance_flag) {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top" align="left"></div>' +
                    '<div valign="top" class="col ' + classname + paddingw + '" align="left">' + cap_firsts(ownername) + ' ' + typestring + '<div>' + benestring + '</div></div>' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(total_for_owner)) + '</div>' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(total_for_owner)) + '</div>' +
                    '<div valign="top" class="col ' + classname + ' padding0left" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(0)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
            } else {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top" align="left"></div>' +
                    '<div class="col padding0" valign="top" align="left">' + cap_firsts(ownername) + ' ' + typestring + '<div>' + benestring + '</div></div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total_for_owner)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
            }
        }

        return [nibta_running_balance, nibta_running_balance, 0];

    }

    return null;

}

function render_irrevocable_trust(accounts, institution) {
    var insured_per_grantor = INSURANCE_LIMIT;

    if (accounts.length) {
        var single_irrevocable_trustid = "Single_irrevocable_trust" + institution.id;
        var single_irrevocable_trustsmobileid = "Single_irrevocable_trust_Mobile" + institution.id;
        var tbodyid = "single_irrevocable_trust_body"
        var tempid = get_sequence();
        var account_header = render_irt_account_header("Irrevocable Trust Accounts", 'temp_header' + tempid);
        $('<div id="' + single_irrevocable_trustid + '"class="SingleAccounts"> </div>').appendTo('#institution_report_' + institution.id);
        $('<div id="' + single_irrevocable_trustsmobileid + '"class="SingleAccountsMobile"> </div>').appendTo('#institution_report_mobile' + institution.id);
        //mobile header
        $('<table id="Single_irrevocable_trust_table" class="fdic-table" border="0" cellspacing="1" cellpadding="4" role="presentation">' +
            '<thead>' +
            '<tr class=" temp_header' + tempid + '">' +
            '<th  scope="col" colspan="12" class="text-light text-left width-card font-size-12px" style="padding: 7px;border:none">' +
            '<div valign="top" class="col accounttype"  align="left"><b>Irrevocable Trust Accounts</b></div>' +
            '</th>' +
            '</tr>' +
            '<tr class="bgltgreen font-size-12px font-family-serif">' +
            '<td valign="top" colspan="2" >&nbsp;</td>' +
            '<td valign="top" align="left" class=" accountinfo"><b>Account Nickname</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Balance</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Owner(s)</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Beneficiaries</b></td>' +
            '</tr>' +
            '</thead>').appendTo('#' + single_irrevocable_trustsmobileid);
        //account_header.appendTo('#institution_report_'+institution.id);
        account_header.appendTo('#' + single_irrevocable_trustid);
		//account_header.appendTo('#institution_report_'+institution.id);

        var distinct_owners = [];
        var running_balance = 0;

        //R5.7.3: flag whether there's nibta
        //var int_and_nibta=false;

        for (var i = 0; i < accounts.length; i++) {
            var account = accounts[i];
            var found = false;
            //if(account.deposit_type != "non_interest") { //R5.7.3: exclude nibta
            for (var j = 0; j < account.grantors.length; j++) {
                var s = account.grantors[j];
                if (s.living == "yes2" || s.living == "no") {
                    var name = s.name.toLowerCase();
                    if (!distinct_owners[name]) distinct_owners[name] = 0;
                    distinct_owners[name] += money_to_float(account.balance) / account.grantors.length;
                    running_balance += money_to_float(account.balance) / account.grantors.length;
                    found = true;
                }
            }

            if (found) render_irrevocable_account(institution, account, false, true);
            //}
            //R5.7.3: flag there's nibta
            // else{
            // for(var j = 0; j < account.grantors.length; j++) {
            // var s = account.grantors[j];
            // if(s.living == "yes2" || s.living == "no") {
            // found = true;
            // }
            // }
            // if(money_to_float(account.balance)>0 && found) int_and_nibta=true;
            // }
        }

        if (!running_balance) { $('.temp_header' + tempid).remove(); return null; }

        $('<div class="row">' +
            '<div class="col-2" valign="top"></div>' +
            '<div valign="top" class="col-3 summary" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $('<tr class="">' +
            '<td  colspan="2" class="" valign="top"></td>' +
            '<td  valign="top" class="summary " align="left"><b>Insurance Summary</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Balance</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Insured</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Uninsured</b></td>' +
            '</tr>').appendTo('#' + tbodyid);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ownername in distinct_owners) {
            var total = distinct_owners[ownername];
            var classname = "line";
            var totalclassname = "";
            var insured = total;
            var uninsured = 0;
            if (total > insured_per_grantor) {
                classname = "uninsured";
                totalclassname = "uninsuredtotal";
                insured = insured_per_grantor;
                uninsured = total - insured_per_grantor;
            }
            total_insured += insured;
            total_uninsured += uninsured;

            if (calculate_insurance_flag) {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top"  align="left"></div>' +
                    '<div valign="top" class="col-3 ' + classname + '" align="left">' + cap_firsts(ownername) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
                $('<tr class=" ">' +
                    '<td  colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td  valign="top" class=" ' + classname + '" align="left">' + cap_firsts(ownername) + ' </td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right" >' + currency_format(roundit(total)) + '</td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right"><span class="' + totalclassname + '>' + currency_format(roundit(uninsured)) + '</span></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            } else {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top" align="left"></div>' +
                    '<div class="col-3" valign="top" align="left">' + cap_firsts(ownername) + '</div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
                $('<tr class=" ">' +
                    '<td colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td class="" valign="top" align="left">' + cap_firsts(ownername) + '</td>' +
                    '<td class="" valign="top" align="right">' + currency_format(roundit(total)) + '</td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            }
        }

		//R5.7.3: add note if there's nibta account
		// if(int_and_nibta){
			// $('<tr><td  colspan="5" valign="top" class="summary" align="left"><b>Note: Noninterest-bearing Transaction Accounts are displayed in a separate section below.</b></td></tr>').appendTo('#institution_report_'+institution.id);
		// }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }

        return [running_balance, total_insured, total_uninsured];

    }

    return null;
}

//R5.7.3: nibta calculator and report for Irrevocable Trust Accounts 
function render_irrevocable_trust_nibta(accounts, institution) {

    if (accounts.length) {
        var tempid = get_sequence();
        if (!nibta_header_flag) {
            var account_header = render_header_nibta("Noninterest-bearing Transaction Accounts", 'temp_header' + tempid);
            account_header.appendTo('#institution_report_' + institution.id);
        }

        var distinct_owners = [];
        var running_balance = 0;
        var account_column_header_flag = false;

        for (var i = 0; i < accounts.length; i++) {
            var account = accounts[i];
            var found = false;

            if (account.deposit_type == "non_interest") {
                for (var j = 0; j < account.grantors.length; j++) {
                    var s = account.grantors[j];
                    if (s.living == "yes2" || s.living == "no") {
                        var name = s.name.toLowerCase();
                        if (!distinct_owners[name]) distinct_owners[name] = 0;
                        distinct_owners[name] += money_to_float(account.balance) / account.grantors.length;
                        running_balance += money_to_float(account.balance) / account.grantors.length;
                        found = true;
                    }
                }

                if (found) {
                    if (!account_column_header_flag) {
                        var account_column_header = render_irt_account_header_nibta('temp_header' + tempid);
                        account_column_header.appendTo('#institution_report_' + institution.id);
                        account_column_header_flag = true;
                    }
                    render_irrevocable_account(institution, account, false, true);
                }
            }
        }

        if (!running_balance) {
            if (!nibta_header_flag) { $('.temp_header' + tempid).remove(); }
            return null;
        }
        nibta_header_flag = true;

        $('<div class="row">' +
            '<div class="col-2" valign="top"></div>' +
            '<div valign="top" class="col-3 summary" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ownername in distinct_owners) {
            var total = distinct_owners[ownername];
            var classname = "line";
            var totalclassname = "";
            var insured = total;
            var uninsured = 0;

            total_insured += insured;
            total_uninsured += uninsured;

            if (calculate_insurance_flag) {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top"  align="left"></div>' +
                    '<div valign="top" class="col-3 ' + classname + '" align="left">' + cap_firsts(ownername) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
            } else {
                $('<div class="row ">' +
                    '<div class="col-2" valign="top"  align="left"></div>' +
                    '<div class="col-3" valign="top" align="left">' + cap_firsts(ownername) + '</div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
            }
        }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }

        return [running_balance, total_insured, total_uninsured];

    }

    return null;
}


function render_business(business_accounts, institution) {

    if (business_accounts.length) {

        //R5.7.3:Business header
        //var account_header = render_business_account_header("Business Accounts");
        var singlebusinessid = "Singlebusinessid" + institution.id;
        var singlebusinessmobileid = "Singlebusinessmobileid" + institution.id;
        var tbodyid = "singlebusinessbody"
        var tempid = get_sequence();
        var account_header = render_business_account_header("Business Accounts", 'temp_header' + tempid);
        $('<div id="' + singlebusinessid + '"class="Singlebusiness"> </div>').appendTo('#institution_report_' + institution.id);
        $('<div id="' + singlebusinessmobileid + '"class="SinglebusinessMobile"> </div>').appendTo('#institution_report_mobile' + institution.id);
        //mobile header

        $('<table id="Singlebusinesstable" class="fdic-table" border="0" cellspacing="1" cellpadding="4" role="presentation">' +
            '<thead>' +
            '<tr class=" temp_header' + tempid + '">' +
            '<th  scope="col" colspan="12" class="text-light text-left width-card font-size-12px" style="padding: 7px;border:none">' +
            '<div valign="top" class="col accounttype"  align="left"><b>Business Accounts</b></div>' +
            '</th>' +
            '</tr> ' +
            '<tr class="bgltgreen font-size-12px font-family-serif">' +
            '<td valign="top" colspan="2" >&nbsp;</td>' +
            '<td valign="top" align="left" class=" accountinfo"><b>Account Nickname</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Balance</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Business Name</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>EIN</b></td>' +
            '</tr>' +
            '</thead>').appendTo('#' + singlebusinessmobileid);
        //account_header.appendTo('#institution_report_'+institution.id);
        account_header.appendTo('#' + singlebusinessid);

        var distinct_eins = [];

        var running_balance = 0;
        var insured_per_ein = INSURANCE_LIMIT;

		//R5.7.3: flag whether there's nibta -- R5.8.1 Remove NIBTA logic
		//var int_and_nibta=false;

        for (var i = 0; i < business_accounts.length; i++) {
            var account = business_accounts[i];
            var ein = account.ein;
            //if(account.deposit_type != "non_interest") { //R5.7.3: exclude nibta -- R5.8.1 Remove NIBTA logic
            if (!distinct_eins[ein]) distinct_eins[ein] = 0;
            distinct_eins[ein] += money_to_float(account.balance);

            running_balance += money_to_float(account.balance);
            render_business_account(institution, account);
            //}
            //R5.7.3: flag there's nibta
            // else{
            // if(money_to_float(account.balance)>0) int_and_nibta=true;
            // }
        }

        //R5.7.3: remove header if there's no bussiness account with interest bearing account
        if (!running_balance) { $('.temp_header' + tempid).remove(); return null; }

        $('<div class="row">' +
            '<div class="col-2 paddingwidth10" valign="top"></div>' +
            '<div valign="top" class="col summary padding0" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $('<tr class="">' +
            '<td  colspan="2" class="" valign="top"></td>' +
            '<td  valign="top" class="summary " align="left"><b>Insurance Summary</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Balance</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Insured</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Uninsured</b></td>' +
            '</tr>').appendTo('#' + tbodyid);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ein in distinct_eins) {
            var total = distinct_eins[ein];
            var classname = "line";
            var paddingw = " padding1";
            var insured = total;
            var uninsured = 0;
            var totalclassname = "";
            if (total > insured_per_ein) {
                classname = "uninsured";
                totalclassname = "uninsuredtotal";
                insured = insured_per_ein;
                uninsured = total - insured_per_ein;
            }
            total_insured += insured;
            total_uninsured += uninsured;

            if (calculate_insurance_flag) {
                $('<div class="row ">' +
                    '<div class="col-2 paddingwidth10" valign="top"  align="left"></div>' +
                    '<div valign="top" class="col ' + classname + paddingw + '" align="left">EIN: <nobr>' + ein + '</nobr></div>' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(insured)) + '</div>' +
                    '<div valign="top" class="col ' + classname + ' padding0left" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
                $('<tr class=" ">' +
                    '<td  colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td  valign="top" class=" ' + classname + '" align="left"><span class="do-word-wrap">EIN:&nbsp;' + ein + '</span></td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(total)) + '</td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</td>' +
                    '<td  valign="top" class=" ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            } else {
                $('<div class="row ">' +
                    '<div class="col-2 paddingwidth10" valign="top" align="left"></div>' +
                    '<div class="col padding0" valign="top" align="left">EIN: <nobr>' + ein + '</nobr></div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
                $('<tr class=" ">' +
                    '<td colspan="2" class="" valign="top"  align="left"></td>' +
                    '<td class="" valign="top" align="left"><span class="do-word-wrap">EIN:&nbsp;' + ein + '</span></td>' +
                    '<td class="" valign="top" align="right">' + currency_format(roundit(total)) + '</td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
                    '</tr>').appendTo('#' + tbodyid);

            }
        }

		//R5.7.3: add note if there's nibta account -- R5.8.1 Remove NIBTA logic
		// if(int_and_nibta){
			// $('<tr><td  colspan="5" valign="top" class="summary" align="left"><b>Note: Noninterest-bearing Transaction Accounts are displayed in a separate section below.</b></td></tr>').appendTo('#institution_report_'+institution.id);
		// }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }

        return [running_balance, total_insured, total_uninsured];

    }

    return null;
}

//R5.7.3: nibta calculator and report for business account 
function render_business_nibta(business_accounts, institution) {

    if (business_accounts.length) {
        var tempid = get_sequence();
        if (!nibta_header_flag) {
            var account_header = render_header_nibta("Noninterest-bearing Transaction Accounts", 'temp_header' + tempid);
            account_header.appendTo('#institution_report_' + institution.id);
        }

        var distinct_eins = [];

        var running_balance = 0;
        var account_column_header_flag = false;

        for (var i = 0; i < business_accounts.length; i++) {
            var account = business_accounts[i];
            var ein = account.ein;
            if (account.deposit_type == "non_interest") {
                if (!distinct_eins[ein]) distinct_eins[ein] = 0;
                distinct_eins[ein] += money_to_float(account.balance);

                running_balance += money_to_float(account.balance);

                if (!account_column_header_flag) {
                    var account_column_header = render_business_account_header_nibta('temp_header' + tempid);
                    account_column_header.appendTo('#institution_report_' + institution.id);
                    account_column_header_flag = true;
                }
                render_business_account(institution, account);
            }
        }

        if (!running_balance) {
            if (!nibta_header_flag) { $('.temp_header' + tempid).remove(); }
            return null;
        }

        nibta_header_flag = true;

        $('<div class="row">' +
            '<div class="col-2" valign="top"></div>' +
            '<div valign="top" class="col-3 summary" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ein in distinct_eins) {
            var total = distinct_eins[ein];
            var classname = "line";
            var insured = total;
            var uninsured = 0;
            var totalclassname = "";

            total_insured += insured;
            total_uninsured += uninsured;

            if (calculate_insurance_flag)
                $('<div class="row ">' +
                    '<div class="col-2" valign="top"  align="left"></div>' +
                    '<div valign="top" class="col ' + classname + '" align="left">EIN: ' + ein + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</div>' +
                    '<div valign="top" class="col ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
            else
                $('<div class="row ">' +
                    '<div class="col-2" valign="top"  align="left"></div>' +
                    '<div class="col-3" valign="top" align="left">EIN: ' + ein + '</div>' +
                    '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                    '</div>').appendTo('#institution_report_' + institution.id);
        }


        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }

        return [running_balance, total_insured, total_uninsured];

    }

    return null;
}

//R5.7.3: business account header
//function render_business_account_header(title) {
function render_business_account_header(title, id) {
    if (!id) id = "";
    //colspan="5"
    return $('<div class="row ' + id + '"><div valign="top" class="col accounttype" align="left"><b>' + title + '</b></div></div>' +
        '<div class="row ' + id + '"><div class="col-2 paddingwidth10" valign="top" >&nbsp;</div>' +
        '<div valign="top" class="col accountinfo padding0" align="left"><b>Account Nickname</b></div>' +
        '<div valign="top" class="col accountinfo" align="right"><b>Balance</b></div>' +
        '<div valign="top" class="col accountinfo" align="right"><b>Business Name</b></div>' +
        '<div valign="top" class="col accountinfo" align="right"><b>EIN</b></div></div>');
}

//R5.7.3: nibta report column header for business account
function render_business_account_header_nibta(id) {
    if (!id) id = "";
    return $('<div class="row ' + id + '"><div class="col-2 paddingwidth10" valign="top" >&nbsp;</div>' +
        '<div valign="top" align="left" class="col accountinfo padding0" align="left"><b>Account Nickname</b></div>' +
        '<div valign="top" class="col accountinfo" align="right"><b>Balance</b></div>' +
        '<div valign="top" class="col accountinfo" align="right"><b>Business Name</b></div>' +
        '<div valign="top" class="col accountinfo" align="right"><b>EIN</b></div></div>');
}

function render_public(public_accounts, institution) {

    if (public_accounts.length) {
        var singlepubilcid = "SinglePublic" + institution.id;
        var singlepublicmobileid = "SinglePublicMobile" + institution.id;
        var tbodyid = "singlepublicbody"
        //R5.7.3: public accounts header
        //var account_header = render_public_account_header("Government Accounts");
        var tempid = get_sequence();
        var account_header = render_public_account_header("Government Accounts", 'temp_header' + tempid);

        $('<div id="' + singlepubilcid + '"class="SinglePublic"> </div>').appendTo('#institution_report_' + institution.id);
        $('<div id="' + singlepublicmobileid + '"class="SinglePublicMobile"> </div>').appendTo('#institution_report_mobile' + institution.id);
        //mobile header
        $('<table id="singlepublictable" class="fdic-table" border="0" cellspacing="1" cellpadding="4" role="presentation">' +
            '<thead>' +
            '<tr class=" temp_header' + tempid + '">' +
            '<th  scope="col" colspan="12" class="text-light text-left width-card font-size-12px" style="padding: 7px;border:none">' +
            '<div valign="top" class="col accounttype"  align="left"><b>Government Accounts</b></div>' +
            '</th>' +
            '</tr> ' +
            '<tr class="bgltgreen font-size-12px font-family-serif">' +
            '<td valign="top" colspan="2" >&nbsp;</td>' +
            '<td valign="top" align="left" class=" accountinfo padding0"><b>Account Nickname (Official Custodian)</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Balance</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>Name of Public Unit</b></td>' +
            '<td valign="top" align="right" class=" accountinfo"><b>EIN</b></td>' +
            '</tr>' +
            '</thead>').appendTo('#' + singlepublicmobileid);
        //account_header.appendTo('#institution_report_'+institution.id);
        account_header.appendTo('#' + singlepubilcid);
		//account_header.appendTo('#institution_report_'+institution.id);



        var distinct_aggregates = [];

        var running_balance = 0;
        var insured_per_aggregate = INSURANCE_LIMIT;

        //R5.7.3: flag whether there's nibta  -- R5.8.1 Remove NIBTA logic
        //var int_and_nibta=false;

        for (var i = 0; i < public_accounts.length; i++) {
            var account = public_accounts[i];
            var ein = account.ein;
            //if(account.deposit_type != "non_interest") { //R5.7.3: exclude nibta -- R5.8.1 Remove NIBTA logic
            if (!distinct_aggregates[ein]) distinct_aggregates[ein] = [];
            if (!distinct_aggregates[ein][account.custodian.toLowerCase()]) distinct_aggregates[ein][account.custodian.toLowerCase()] = [];
            if (!distinct_aggregates[ein][account.custodian.toLowerCase()][account.deposit_type]) distinct_aggregates[ein][account.custodian.toLowerCase()][account.deposit_type] = 0;

            distinct_aggregates[ein][account.custodian.toLowerCase()][account.deposit_type] += money_to_float(account.balance);

            distinct_aggregates[ein]["STATE_MATCH_FLAG"] = account.state_match;

            running_balance += money_to_float(account.balance);
            render_public_account(institution, account);
            //}
            //R5.7.3: flag there's nibta -- R5.8.1 Remove NIBTA logic
            // else{
            // if(money_to_float(account.balance)>0) int_and_nibta=true;
            // }
        }
        //R5.7.3: remove header if there's no public account with interest bearing account
        if (!running_balance) { $('.temp_header' + tempid).remove(); return null; }

        $('<div class="row">' +
            '<div class="col-2 paddingwidth10" valign="top"></div>' +
            '<div valign="top" class="col summary padding0" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $('<tr class="">' +
            '<td  colspan="2" class="" valign="top"></td>' +
            '<td  valign="top" class="summary " align="left"><b>Insurance Summary</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Balance</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Insured</b></td>' +
            '<td  valign="top" class="summary " align="right"><b>Uninsured</b></td>' +
            '</tr>').appendTo('#' + tbodyid);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ein in distinct_aggregates) {
            for (var custodian in distinct_aggregates[ein]) {
                if (custodian == "STATE_MATCH_FLAG") continue;

                var interest_total = 0;
                var noninterest_total = 0;
                //added for :new accout interest bearing DDA for Government
                var interest_dda_total = 0;

                //updated: removing NOW account from drop down, change Intersting-bearing account to Time or Savings/NOW account
                //interest_total += (distinct_aggregates[ein][custodian]["non_interest_2"] || 0) + (distinct_aggregates[ein][custodian]["interest"] || 0);
                interest_total += (distinct_aggregates[ein][custodian]["interest"] || 0);

                noninterest_total += (distinct_aggregates[ein][custodian]["non_interest"] || 0);
                //added for :new accout interest bearing DDA for Government
                interest_dda_total += (distinct_aggregates[ein][custodian]["interest_dda"] || 0);

                if (!distinct_aggregates[ein]["STATE_MATCH_FLAG"]) {
                    //updated for :new accout interest bearing DDA for Government-
                    //if not located in same state as Public Unit, add balances of all Interest-bearing/Now Accounts and Interesting-bearing DDA 
                    //var total = interest_total + noninterest_total;
                    var total = interest_total + noninterest_total + interest_dda_total;
                    var res = render_public_summary(total, ein, ein + ", " + cap_firsts(custodian), insured_per_aggregate, institution);
                    if (res) {
                        total_insured += res[0];
                        total_uninsured += res[1];
                    }
                } else {
                    var res = null;
                    if (interest_total) {
                        res = render_public_summary(interest_total, ein, ein + ", " + cap_firsts(custodian) + " (Time or Savings Account)", insured_per_aggregate, institution);
                        if (res) {
                            total_insured += res[0];
                            total_uninsured += res[1];
                        }
                    }
                    if (noninterest_total) {
                        res = render_public_summary(noninterest_total, ein, ein + ", " + cap_firsts(custodian) + " (Noninterest-bearing checking account)", insured_per_aggregate, institution);

                        if (res) {
                            total_insured += res[0];
                            total_uninsured += res[1];
                        }
                    }
                    //updated for :new accout interest bearing DDA for Government-
                    //if located in same state as Public Unit,Interesting-bearing DDA insured to $250,000; 
                    //Interest-bearing/Now Accounts Insured to $250,000
                    if (interest_dda_total) {
                        res = render_public_summary(interest_dda_total, ein, ein + ", " + cap_firsts(custodian) + " (Demand Deposit Account)", insured_per_aggregate, institution);
                        if (res) {
                            total_insured += res[0];
                            total_uninsured += res[1];
                        }
                    }
                }
            }
        }

        //R5.7.3: add note if there's nibta account
		// if(int_and_nibta){
			// $('<tr><td  colspan="5" valign="top" class="summary" align="left"><b>Note: Noninterest-bearing Transaction Accounts are displayed in a separate section below.</b></td></tr>').appendTo('#institution_report_'+institution.id);
		// }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }
        return [running_balance, total_insured, total_uninsured];
    }

    return null;

}

//R5.7.3: nibta report for public account
function render_public_nibta(public_accounts, institution) {

    if (public_accounts.length) {

        var tempid = get_sequence();
        if (!nibta_header_flag) {
            var account_header = render_header_nibta("Noninterest-bearing Transaction Accounts", 'temp_header' + tempid);
            account_header.appendTo('#institution_report_' + institution.id);
        }

        var distinct_aggregates = [];

        var running_balance = 0;
        var insured_per_aggregate = INSURANCE_LIMIT;
        var account_column_header_flag = false;

        for (var i = 0; i < public_accounts.length; i++) {
            var account = public_accounts[i];
            var ein = account.ein;
            if (account.deposit_type == "non_interest") {
                if (!distinct_aggregates[ein]) distinct_aggregates[ein] = [];
                if (!distinct_aggregates[ein][account.custodian.toLowerCase()]) distinct_aggregates[ein][account.custodian.toLowerCase()] = [];
                if (!distinct_aggregates[ein][account.custodian.toLowerCase()][account.deposit_type]) distinct_aggregates[ein][account.custodian.toLowerCase()][account.deposit_type] = 0;

                distinct_aggregates[ein][account.custodian.toLowerCase()][account.deposit_type] += money_to_float(account.balance);

                distinct_aggregates[ein]["STATE_MATCH_FLAG"] = account.state_match;

                running_balance += money_to_float(account.balance);

                if (!account_column_header_flag) {
                    var account_column_header = render_public_account_header_nibta('temp_header' + tempid);
                    account_column_header.appendTo('#institution_report_' + institution.id);
                    account_column_header_flag = true;
                }
                render_public_account(institution, account);
            }
        }

        //remove header if there's no bussiness account with interest bearing account
        if (!running_balance) {
            if (!nibta_header_flag) { $('.temp_header' + tempid).remove(); }
            return null;
        }

        $('<div class="row">' +
            '<div class="col-2" valign="top"></div>' +
            '<div valign="top" class="col-3 summary" align="left"><b>Insurance Summary</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col summary" align="right"><b>Uninsured</b></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);

        var total_insured = 0;
        var total_uninsured = 0;

        for (var ein in distinct_aggregates) {
            for (var custodian in distinct_aggregates[ein]) {
                if (custodian == "STATE_MATCH_FLAG") continue;

                var noninterest_total = 0;

                noninterest_total += (distinct_aggregates[ein][custodian]["non_interest"] || 0);

                var total = noninterest_total;
                var classname = "line";
                var totalclassname = "";
                var insured = total;
                var uninsured = 0;
                var title = ein + ", " + cap_firsts(custodian);

                if (calculate_insurance_flag)
                    $('<div class="row ">' +
                        '<div class="col-2" valign="top"  align="left"></div>' +
                        '<div valign="top" class="col-3 ' + classname + '" align="left">' + title + '</div>' +
                        '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(total)) + '</div>' +
                        '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</div>' +
                        '<div valign="top" class="col ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
                        '</div>').appendTo('#institution_report_' + institution.id);
                else
                    $('<div class="row ">' +
                        '<div class="col-2" valign="top" align="left"></div>' +
                        '<div class="col-3" valign="top" align="left">' + title + '</div>' +
                        '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
                        '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                        '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
                        '</div>').appendTo('#institution_report_' + institution.id);

                total_insured += insured;
            }
        }

        // fix rounding errors
        if (total_uninsured == 0) { total_insured = running_balance; }
        return [running_balance, total_insured, total_uninsured];
    }

    return null;

}

function render_public_summary(total, ein, title, insured_limit, institution) {
    var classname = "line";
    var paddingw = " padding1";
    var totalclassname = "";
    var insured = total;
    var uninsured = 0;
    var tbodyid = "singlepublicbody";
    if (total > insured_limit) {
        totalclassname = "uninsuredtotal";
        classname = "uninsured";
        insured = insured_limit;
        uninsured = total - insured_limit;
    }

    if (calculate_insurance_flag) {
        $('<div class="row ">' +
            '<div class="col-2 paddingwidth10" valign="top" align="left"></div>' +
            '<div valign="top" class="col ' + classname + paddingw + '" align="left">' + title + '</div>' +
            '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(total)) + '</div>' +
            '<div valign="top" class="col ' + classname + ' padding0" align="right">' + currency_format(roundit(insured)) + '</div>' +
            '<div  valign="top" class="col ' + classname + ' padding0left" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $('<tr class=" ">' +
            '<td  colspan="2" class="" valign="top"  align="left"></td>' +
            '<td  valign="top" class=" ' + classname + '" align="left"> ' + title + '</td>' +
            '<td  valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(total)) + '</td>' +
            '<td  valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(insured)) + '</td>' +
            '<td  valign="top" class=" ' + classname + '" align="right"><span class="' + totalclassname + '">' + currency_format(roundit(uninsured)) + '</span></td>' +
            '</tr>').appendTo('#' + tbodyid);

    }
    else {
        $('<div class="row ">' +
            '<div class="col-2 paddingwidth10" valign="top"  align="left"></div>' +
            '<div class="col padding0" valign="top" align="left">' + title + '</div>' +
            '<div class="col" valign="top" align="right">' + currency_format(roundit(total)) + '</div>' +
            '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
            '<div class="col" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $('<tr class=" ">' +
            '<td colspan="2" class="" valign="top"  align="left"></td>' +
            '<td class="" valign="top" align="left"> ' + title + '</td>' +
            '<td class="" valign="top" align="right" >' + currency_format(roundit(total)) + '</td>' +
            '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
            '<td class="" valign="top" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
            '</tr>').appendTo('#' + tbodyid);

    }

    return [insured, uninsured];

}

//R5.7.3: public account
//function render_public_account_header(title) {
function render_public_account_header(title, id) {
    if (!id) id = "";
    //colspan="5"
    return $('<div class="row ' + id + '"><div valign="top" class="col accounttype"  align="left"><b>' + title + '</b></div></div>' +
        '<div class="row ' + id + '"><div class="col-2 paddingwidth10" valign="top">&nbsp;</div>' +
        '<div valign="top" align="left" class="col accountinfo padding0"><b>Account Nickname (Official Custodian)</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Balance</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Name of Public Unit</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>EIN</b></div></div>');
}

//R5.7.3: nibta report column header for public account
function render_public_account_header_nibta(id) {

    if (!id) id = "";

    return $('<div class="row ' + id + '">' +
        '<div class="col-2" valign="top" >&nbsp;</div>' +
        '<div valign="top" align="left" class="col accountinfo"><b>Account Nickname (Official Custodian)</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Balance</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Name of Public Unit</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>EIN</b></div></div>');
}

function render_account_header(title, id) {

    if (!id) id = "";
    //colspan="5"
    var headerdesktop = $('<div class="row ' + id + '"><div valign="top" class="col accounttype" align="left"><b>' + title + '</b></div></div>' +
        '<div class="row ' + id + '">' +
        '<div class="col-2 paddingwidth10" valign="top" >&nbsp;</div>' +
        '<div valign="top" align="left" class="col accountinfo padding0"><b>Account Nickname</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Balance</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Owner(s)</b></div>' +
        '<div valign="top" align="left" class="col accountinfo"><b>Beneficiaries</b></div>' +
        '</div>');


    return headerdesktop;
}

//R5.7.3: nibta account report top line
function render_header_nibta(title, id) {

    if (!id) id = "";
    //colspan="5"
    return $('<div class="row ' + id + '"><div valign="top" class="col accounttype"  align="left"><b>' + title + '</b></div></div>');
}

//R5.7.3: nibta report column header for single/joint/retirement account  
function render_account_header_nibta(id) {

    if (!id) id = "";

    return $('<div class="row ' + id + '">' +
        '<div valign="top" class="col-2" >&nbsp;</div>' +
        '<div valign="top" align="left"  class="col accountinfo"><b>Account Nickname</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Balance</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Owner(s)</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Beneficiaries</b></div>' +
        '</div>');
}

function render_irt_account_header(title, id) {

    if (!id) id = "";
    //colspan="5"
    return $('<div class="row ' + id + '"><div valign="top" class="col accounttype" align="left"><b>' + title + '</b></div></div>' +
        '<div class="row ' + id + '">' +
        '<div valign="top" class="col-2" >&nbsp;</div>' +
        '<div valign="top" align="left" class="col accountinfo"><b>Account Nickname</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Balance</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Owner(s)</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Trustee(s)</b></div>' +
        '</div>');
}

//R5.7.3: nibta report column header for irt account
function render_irt_account_header_nibta(id) {

    if (!id) id = "";

    return $('<div class="row ' + id + '">' +
        '<div valign="top" class="col-2">&nbsp;</div>' +
        '<div valign="top" align="left" class="col accountinfo"><b>Account Nickname</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Balance</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Owner(s)</b></div>' +
        '<div valign="top" align="right" class="col accountinfo"><b>Trustee(s)</b></div></div>');
}
//renders report
function render_account(institution, account, bodyid, tableid, rowid, balance_override) {
    var owner_names = $.map(account.owners, function (e) { return cap_firsts(e.name.toLowerCase()) });
    var name_string = owner_names.join("<br/>");
    var balance_string = balance_override ? currency_format(balance_override) : account.balance

    var bene_names = $.map(account.beneficiaries, function (e) { return ('<b style=" font-size: 1.3em; "><li></b> ' +  cap_firsts(e.name.toLowerCase())) });
    var bene_string = bene_names.join("<br/>");
    if (!bene_string) bene_string = "N/A";

    var extra_coverage = "";
	//if(account.deposit_type == "non_interest") extra_coverage = '<img src="images/img_asterisk.gif" alt="Note" width="7" height="10">';

    var edit_btn = "btn_edit.gif";
    var delete_btn = "btn_delete.gif";
  
    if (whitelabel) { edit_btn = "btn_edit_wl.gif"; delete_btn = "btn_delete_wl.gif"; }
    if (account.type == 'IrrevocableTrust') {
        $('<div class="row">' +
            '<div class="col-2 paddingwidth10 padding0left" valign="top" align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button" class="pointer" title="Edit" width="25" height="25" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button" class="pointer" title="Delete" width="25" height="20" tabindex="0">' +
            '</nobr>' +
            '</div>' +
            '<div valign="top" class="col account line padding0" align="left" style="word-break: break-word">' + account.name + '<br>' + 'EIN: ' + account.ein + extra_coverage + '</div>' +
            '<div valign="top" class="col account line" align="right"><nobr>' + balance_string + '</nobr></div>' +
            '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + name_string + '</div>' + ' ' +
            '<div valign="top" class="col account line" align="left" style="word-break: break-word"><ul style="margin-left:1em;padding-left:0.5em">' + bene_string + '</ul></div>' +
            '</div>').appendTo('#' + rowid);
    }
    else {
        $('<div class="row">' +
            '<div class="col-2 paddingwidth10 padding0left" valign="top" align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button" class="pointer" title="Edit" width="25" height="25" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button" class="pointer" title="Delete" width="25" height="20" tabindex="0">' +
            '</nobr>' +
            '</div>' +
            '<div valign="top" class="col account line padding0" align="left" style="word-break: break-word">' + account.name + extra_coverage + '</div>' +
            '<div valign="top" class="col account line" align="right"><nobr>' + balance_string + '</nobr></div>' +
            '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + name_string + '</div>' + ' ' +
            '<div valign="top" class="col account line" align="left" style="word-break: break-word"><ul style="margin-left:1em;padding-left:0.5em">' + bene_string + '</ul></div>' +
            '</div>').appendTo('#' + rowid);
    }
    if ($("#" + bodyid).length == 0) {
        //it doesn't exist
        $(' <tbody id="' + bodyid + '" >' +
            '<tr id="ownershiprow' + bodyid + '">' +
            '<td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' +
            account.name + extra_coverage +
            '</td>' +
            '<td valign="top" class="account" align="right">' +
            '<nobr>' + balance_string + '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + name_string + '</td>' + ' ' +
            '<td valign="top" class=" account" align="right" style="word-break: break-word"><ul style="margin-left:1em;padding-left:0.5em">' + bene_string + '</ul></td>' +
            '</tr>').appendTo('#' + tableid);

    }
    else {
        $('<tr>' +
            '<td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' +
            account.name + extra_coverage +
            '</td>' +
            '<td valign="top" class="account" align="right">' +
            '<nobr>' + balance_string + '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + name_string + '</td>' + ' ' +
            '<td valign="top" class=" account" align="right" style="word-break: break-word"><ul style="margin-left:1em;padding-left:0.5em">' + bene_string + '</ul></td>' +
            '</tr>').insertAfter('#ownershiprow' + bodyid);

    }

    var edit_account_func = function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        doing_edit = true;
        populate_calculator();
        populate_calculator(institution, account);
    }

    $('#account_' + account.id + '_edit_button').bind('click', edit_account_func);
    $('#account_' + account.id + '_edit_button_mobile').bind('click', edit_account_func);
    
    $('#account_' + account.id + '_edit_button').on('keydown', function(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault();
            $(this).click();
        }
    });
    $('#account_' + account.id + '_edit_button_mobile').on('keydown', function(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault();
            $(this).click();
        }
    });

    var remove_account_func = function () {
        remove_account(account.id);
        doing_edit = false;
    };


     
    $('#account_' + account.id + '_remove_button').on('keydown', function(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault();
            $(this).click();
        }
    });
    $('#account_' + account.id + '_remove_button_mobile').on('keydown', function(event) {
        if (event.key === "Enter" || event.keyCode === 13) {
            event.preventDefault();
            $(this).click();
        }
    });

    $('#account_' + account.id + '_remove_button').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });
    $('#account_' + account.id + '_remove_button_mobile').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });

}

function render_trust_account(institution, account, name, bene_name, amount) {

    var seq = get_sequence();
    var extra_coverage = "";
	//if(account.deposit_type == "non_interest") extra_coverage = '<img src="images/img_asterisk.gif" alt="Note" width="7" height="10">';

    var edit_btn = "btn_edit.gif";
    var delete_btn = "btn_delete.gif";
    if (whitelabel) { edit_btn = "btn_edit_wl.gif"; delete_btn = "btn_delete_wl.gif"; }

    $('<div class="row">' +
        '<div class="col-2" valign="top"  align="left">' +
        '<nobr>' +
        '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_' + seq + '" class="pointer" title="Edit" width="25" height="25" tabindex="0">&nbsp;' +
        '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_' + seq + '" class="pointer" title="Delete" width="25" height="20" tabindex="0">' +
        '</nobr>' +
        '</div>' +
        '<div valign="top" class="col-3 account line" align="left" style="word-break: break-word">' +
        account.name + extra_coverage +
        '</div>' +
        '<div valign="top" class="col account line" align="right">' +
        '<nobr>' + currency_format(amount) + '</nobr>' +
        '</div>' +
        '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + cap_firsts(name) + '</div>' +
        '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + cap_firsts(bene_name) + '  (ineligible beneficiary)</div>' +
        '</div>').appendTo('#institution_report_' + institution.id);

    var edit_account_func = function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        doing_edit = true;
        populate_calculator();
        populate_calculator(institution, account);
    }

    $('#account_' + account.id + '_edit_button_' + seq).bind('click', edit_account_func);

    var remove_account_func = function () {
        remove_account(account.id);
        doing_edit = false;
    };

    $('#account_' + account.id + '_remove_button_' + seq).bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });

}

function render_irrevocable_account(institution, account, balance_override, distinct_section) {

    var owner_names = new Array();
    for (var i = 0; i < account.grantors.length; i++) {
        owner_names.push(cap_firsts(account.grantors[i].name));
    }

    var name_string = owner_names.join("<br/>");
    var balance_string = balance_override ? currency_format(balance_override) : account.balance;
    var bene_string = "N/A";
    var trustee_names = $.map(account.trustees, function (e) { return cap_firsts(e.name) });
    var trustee_string = trustee_names.join("<br/>");

    var extra_coverage = "";
	//if(account.deposit_type == "non_interest") extra_coverage = '<img src="images/img_asterisk.gif" alt="Note" width="7" height="10">';

    var edit_btn = "btn_edit.gif";
    var delete_btn = "btn_delete.gif";
    if (whitelabel) { edit_btn = "btn_edit_wl.gif"; delete_btn = "btn_delete_wl.gif"; }

    if (distinct_section) {
        $('<div class="row">' +
            '<div class="col-2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button" class="pointer" title="Edit" width="25" height="25" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button" class="pointer" title="Delete" width="25" height="20" tabindex="0">' +
            '</nobr>' +
            '</div>' +
            '<div valign="top" class="col-3 account line" align="left" style="word-break: break-word">' +
            account.name + extra_coverage +
            '</div>' +
            '<div valign="top" class="col account line" align="right">' +
            '<nobr>' + balance_string + '</nobr>' +
            '</div>' +
            '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + name_string + '</div>' +
            '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + trustee_string + '</div>' +
            '</div>').appendTo('#institution_report_' + institution.id);

        if ($("#single_irrevocable_trust_body").length == 0) {
            //it doesn't exist
            $(' <tbody id="single_irrevocable_trust_body" >' +
                '<tr id="irrevocabletrustrow">' +
                '<td colspan="2" valign="top"  align="left">' +
                '<nobr>' +
                '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
                '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
                '</nobr>' +
                '</td>' +
                '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.name + extra_coverage + '</td>' +
                '<td valign="top" class="account" align="right" ><nobr>' + balance_string + '</nobr></td>' +
                '<td valign="top" class="account" align="right" style="word-break: break-word">' + name_string + '</td>' +
                '<td valign="top" class=" account" align="right" style="word-break: break-word">' + trustee_string + '</td>' +
                '</tr>').appendTo('#Single_irrevocable_trust_table');

        }
        else {
            $(' <tr id="">' +
                '<td colspan="2" valign="top"  align="left">' +
                '<nobr>' +
                '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
                '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
                '</nobr>' +
                '</td>' +
                '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.name + extra_coverage + '</td>' +
                '<td valign="top" class="account" align="right"><nobr>' + balance_string + '</nobr></td>' +
                '<td valign="top" class="account" align="right" style="word-break: break-word">' + name_string + '</td>' +
                '<td valign="top" class=" account" align="right" style="word-break: break-word">' + trustee_string + '</td>' +
                '</tr>').insertAfter('#irrevocabletrustrow');

        }

    } else { //col span 4 on last div
        $('<div class="row">' +
            '<div class="col-2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button" class="pointer" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button" class="pointer" tabindex="0">' +
            '</nobr>' +
            '</div>' +
            '<div valign="top" class="col-3 account line" align="left" style="word-break: break-word">' + account.name + extra_coverage + '</div>' +
            '<div valign="top" class="col account line" align="right"><nobr>' + balance_string + '</nobr></div>' +
            '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + name_string + '</div>' +
            '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + bene_string + '</div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-2"></div>' +
            '<div valign="top" class="col account" align="left"><span style="font-size: .8em">FDIC regulations insure a retained interest in an irrevocable trust account as the &#8220;single ownership&#148 deposits of the Grantor, and therefore the deposits are added together with any other &#8220;single ownership&#8221; deposits.</span></div>' +
            '</div>').appendTo('#institution_report_' + institution.id);
        $(' <tbody id="single_irrevocable_trust_body" >' +
            '<tr>' +
            '<td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.name + extra_coverage + '</td>' +
            '<td valign="top" class="account" align="right"><nobr>' + balance_string + '</nobr></td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + name_string + '</td>' +
            '<td valign="top" class=" account" align="right" style="word-break: break-word">' + bene_string + '</td>' +
            '<td valign="top" class=" account" align="left"><span style="font-size: .8em">FDIC regulations insure a retained interest in an irrevocable trust account as the &#8220;single ownership&#148 deposits of the Grantor, and therefore the deposits are added together with any other &#8220;single ownership&#8221; deposits.</span></td>' +
            '</tr>').appendTo('#Single_irrevocable_trust_table');

    }

    var edit_account_func = function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        doing_edit = true;
        populate_calculator();
        populate_calculator(institution, account);
    }

    $('#account_' + account.id + '_edit_button').bind('click', edit_account_func);
    $('#account_' + account.id + '_edit_button_mobile').bind('click', edit_account_func);

    var remove_account_func = function () {
        remove_account(account.id);
        doing_edit = false;
    };

    $('#account_' + account.id + '_remove_button').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });
    $('#account_' + account.id + '_remove_button_mobile').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });

}

function render_business_account(institution, account) {
    var extra_coverage = "";
 	//if(account.deposit_type == "non_interest") extra_coverage = '<img src="images/img_asterisk.gif" alt="Note" width="7" height="10">';

    var edit_btn = "btn_edit.gif";
    var delete_btn = "btn_delete.gif";
    if (whitelabel) { edit_btn = "btn_edit_wl.gif"; delete_btn = "btn_delete_wl.gif"; }

    $('<div class="row">' +
        '<div class="col-2 paddingwidth10 padding0left" valign="top"  align="left">' +
        '<nobr>' +
        '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button" class="pointer" title="Edit" width="25" height="25" tabindex="0">&nbsp;' +
        '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button" class="pointer" title="Delete" width="25" height="20" tabindex="0">' +
        '</nobr>' +
        '</div>' +
        '<div valign="top" class="col account line padding0" align="left" style="word-break: break-word">' + account.account_name + extra_coverage + '</div>' +
        '<div valign="top" class="col account line" align="right"><nobr>' + account.balance + '</nobr></div>' +
        '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + account.name + '</div>' +
        '<div valign="top" class="col account line do-word-wrap" align="right"><nobr>' + account.ein + '</nobr></div>' +
        '</div>').appendTo('#institution_report_' + institution.id);

    if ($("#singlebusinessbody").length == 0) {
        //it doesn't exist
        $(' <tbody id="singlebusinessbody" >' +
            '<tr id="buisnessrow">' +
            '<td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.account_name + extra_coverage + '</td>' +
            '<td valign="top" class="account" align="right"><nobr>' + account.balance + '</nobr></td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + account.name + '</td>' +
            '<td valign="top" class=" account do-word-wrap" align="right"><nobr>' + account.ein + '</nobr></td>' +
            '</tr>').appendTo('#Singlebusinesstable');

    }
    else {
        $('<tr>' +
            '<td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.account_name + extra_coverage + '</td>' +
            '<td valign="top" class="account" align="right"><nobr>' + account.balance + '</nobr></td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + account.name + '</td>' +
            '<td valign="top" class=" account do-word-wrap" align="right"><nobr>' + account.ein + '</nobr></td>' +
            '</tr>').insertAfter('#buisnessrow');

    }

    var edit_account_func = function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        doing_edit = true;
        populate_calculator();
        populate_calculator(institution, null, account);
    }

    $('#account_' + account.id + '_edit_button').bind('click', edit_account_func);
    $('#account_' + account.id + '_edit_button_mobile').bind('click', edit_account_func);

    var remove_account_func = function () {
        remove_account(account.id);
        doing_edit = false;
    };

    $('#account_' + account.id + '_remove_button').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });
    $('#account_' + account.id + '_remove_button_mobile').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });

}

function render_public_account(institution, account) {

    var edit_btn = "btn_edit.gif";
    var delete_btn = "btn_delete.gif";
    if (whitelabel) { edit_btn = "btn_edit_wl.gif"; delete_btn = "btn_delete_wl.gif"; }

    var extra_coverage = "";
    if (account.deposit_type == "non_interest") extra_coverage = '<img src="images/img_asterisk.gif" alt="Note" width="7" height="10">';
//singlepublictable
    $('<div class="row">' +
        '<div class="col-2 paddingwidth10 padding0left" valign="top"  align="left">' +
        '<nobr>' +
        '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button" class="pointer" title="Edit" width="25" height="25" tabindex="0">&nbsp;' +
        '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button" class="pointer" title="Delete" width="25" height="20" tabindex="0">' +
        '</nobr>' +
        '</div>' +
        '<div valign="top" class="col account line padding0" align="left" style="word-break: break-word">' + account.account_name + extra_coverage + ' (' + cap_firsts(account.custodian) + ')</div>' +
        '<div valign="top" class="col account line" align="right"><nobr>' + account.balance + '</nobr></div>' +
        '<div valign="top" class="col account line" align="right" style="word-break: break-word">' + account.name + '</div>' +
        '<div valign="top" class="col account line do-word-wrap" align="right"><nobr>' + account.ein + '</nobr></div>' +
        '</div>').appendTo('#institution_report_' + institution.id);

    if ($("#singlepublicbody").length == 0) {
        //it doesn't exist
        $(' <tbody id="singlepublicbody" >' +
            '<tr id="publicrow"><td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.account_name + extra_coverage + ' (' + cap_firsts(account.custodian) + ')</td>' +
            '<td valign="top" class="account" align="right"><nobr>' + account.balance + '</nobr></td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + account.name + '</td>' +
            '<td valign="top" class=" account do-word-wrap" align="right"><nobr>' + account.ein + '</nobr></td>' +
            '</tr>').appendTo('#singlepublictable');

    }
    else {
        $(' <tr>' +
            '<td colspan="2" valign="top"  align="left">' +
            '<nobr>' +
            '<img src="images\/' + edit_btn + '" alt="Edit" hspace="1" border="0" id="account_' + account.id + '_edit_button_mobile" class="pointer" title="Edit" style="max-width: none; width:25px" tabindex="0">&nbsp;' +
            '<img src="images\/' + delete_btn + '" alt="Delete" border="0" id="account_' + account.id + '_remove_button_mobile" class="pointer" title="Delete" style="max-width: none; width:25px" tabindex="0">' +
            '</nobr>' +
            '</td>' +
            '<td valign="top" class="account" align="left" style="word-break: break-word">' + account.account_name + extra_coverage + ' (' + cap_firsts(account.custodian) + ')</td>' +
            '<td valign="top" class="account" align="right"><nobr>' + account.balance + '</nobr></td>' +
            '<td valign="top" class="account" align="right" style="word-break: break-word">' + account.name + '</td>' +
            '<td valign="top" class="account do-word-wrap" align="right"><nobr>' + account.ein + '</nobr></td>' +
            '</tr>').insertAfter('#publicrow');

    }

    var edit_account_func = function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        doing_edit = true;
        populate_calculator();
        populate_calculator(institution, null, null, account);
    }

    $('#account_' + account.id + '_edit_button').bind('click', edit_account_func);
    $('#account_' + account.id + '_edit_button_mobile').bind('click', edit_account_func);

    var remove_account_func = function () {
        remove_account(account.id);
        doing_edit = false;
    };

    $('#account_' + account.id + '_remove_button').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });
    $('#account_' + account.id + '_remove_button_mobile').bind('click', function (e) {
        if (!doAction(account.id || -1)) {
            return;
        }

        show_confirm("Do you really want to remove this account?", remove_account_func)
    });

}

function render_institution_summary(title, balance, insured, uninsured) {

    var classname = "line";
    var paddingw = " padding0";
    var unclassname = "";

    if (uninsured) unclassname = "uninsuredtotal";

    if (calculate_insurance_flag)
        //colspan="5"   last div colspan5 = col-2
        return $('<div class="row ">' +
            '<div valign="top" align="left" class="col allaccounts"><b>' + title + ' <span >Totals will be rounded.</b></span></div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-2 paddingwidth10">&nbsp;</div>' +
            '<div valign="top" class="col balanceinfo padding0"></div>' +
            '<div valign="top" class="col balanceinfo" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col balanceinfo" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col balanceinfo" align="right"><b>Uninsured</b></div>' +
            '</div>' +
            '<div class="row" style="padding-bottom:1rem;">' +
            '<div class="col-2 paddingwidth10" ></div>' +
            '<div valign="top" class="col ' + classname + paddingw + '"></div>' +
            '<div valign="top" class="col ' + classname + '" align="right"><span id="final_balance">' + currency_format(roundit(balance)) + '</span></div>' +
            '<div valign="top" class="col ' + classname + '" align="right"><span id="final_insured">' + currency_format(roundit(insured)) + '</span></div>' +
            '<div valign="top" class="col ' + classname + '" align="right"><span class="' + unclassname + '" id="final_uninsured">' + currency_format(roundit(uninsured)) + '</span></div>' +
            '</div>');
    else    //colspan 2 = col-1
        return $('<div class="row ">' +
            '<div valign="top" align="left" class="col allaccounts"><b>' + title + ' <span >Totals will be rounded.</b></span></div>' +
            '</div>' +
            '<div class="row">' +
            '<div class="col-2 paddingwidth10">&nbsp;</div>' +
            '<div valign="top" class="col balanceinfo padding0"></div>' +
            '<div valign="top" class="col balanceinfo" align="right"><b>Balance</b></div>' +
            '<div valign="top" class="col balanceinfo" align="right"><b>Insured</b></div>' +
            '<div valign="top" class="col balanceinfo" align="right"><b>Uninsured</b></div>' +
            '</div>' +
            '<div class="row" style="padding-bottom:1rem;">' +
            '<div class="col-2 paddingwidth10"></div>' +
            '<div valign="top" class="col ' + classname + paddingw + '"></div>' +
            '<div valign="top" class="col ' + classname + '" align="right">' + currency_format(roundit(balance)) + '</div>' +
            '<div valign="top" class="col ' + classname + '" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
            '<div valign="top" class="col ' + classname + '" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></div>' +
            '</div>');
}

function render_institution_summary_mobile(title, balance, insured, uninsured, institution) {

    var classname = "line";
    var unclassname = "";
    var tempid = get_sequence();
    if (uninsured) unclassname = "uninsuredtotal";
    var Instution_summary_mobile_id = "Instution_summary_mobile" + institution.id;
    $('<div id="' + Instution_summary_mobile_id + '"class="SingleinstitutionMobile" style="padding-bottom:1rem;"> </div>').appendTo('#institution_report_mobile' + institution.id);
    //mobile header
    $('<table id="singleinstitutiontable" class="fdic-table" border="0" cellspacing="1" cellpadding="4" role="presentation">' +
        '<thead>' +
        '<tr class=" temp_header' + tempid + '">' +
        '<th  scope="col" colspan="12" class="text-light text-left width-card font-size-12px" style="padding: 7px;border:none">' +
        '<div valign="top" class="col accounttype"  align="left"><b>' + title + ' <span>Totals will be rounded.</span></b></div>' +
        '</th>' +
        '</tr> ' +
        '<tr class="bgltgreen font-size-12px font-family-serif">' +
        '<td valign="top" colspan="2">&nbsp;</td>' +
        '<td valign="top"  class=" balanceinfo" align="right"><b>Balance</b></td>' +
        '<td valign="top"  class=" balanceinfo" align="right"><b>Insured</b></td>' +
        '<td valign="top"  class=" balanceinfo" align="right"><b>Uninsured</b></td>' +
        '</tr>' +
        '</thead>').appendTo('#' + Instution_summary_mobile_id);

    //<tr class=" padding10top"><td valign="top" align="left" class=" allaccounts"><b>'+title+'</b> <span style="font-weight: normal">Totals will be rounded.</span></td></tr><tr class=""><td class="" style="border-top: 15px solid #ffffff">&nbsp;</td><td valign="top"  class="  balanceinfo"></td><td valign="top"  class=" balanceinfo"><b>Balance</b></td><td valign="top"  class=" balanceinfo"><b>Insured</b></td><td valign="top"  class=" balanceinfo"><b>Uninsured</b></td></tr>
    //<div class="row padding10top"><div valign="top" align="left" class="col allaccounts"><b>'+title+'</b> <span style="font-weight: normal">Totals will be rounded.</span></div></div><div class="row"><div class="col-2" style="border-top: 15px solid #ffffff">&nbsp;</div><div valign="top"  class=" col balanceinfo"></div><div valign="top"  class=" col balanceinfo"><b>Balance</b></div><div valign="top" class="col balanceinfo"><b>Insured</b></div><div valign="top"  class="col balanceinfo"><b>Uninsured</b></div></div>
    if (calculate_insurance_flag) {
        //colspan="5"   last div colspan5 = col-2
        $('<tbody id="singleinstiutionbody" >' +
            '<tr class="">' +
            '<td colspan="2" class="" ></td>' +
            //'<td valign="top"  class=" ' + classname + '"></td>' +
            '<td valign="top"  class=" ' + classname + '" align="right"><span id="final_balance">' + currency_format(roundit(balance)) + '</span></td>' +
            '<td valign="top"  class=" ' + classname + '" align="right"><span id="final_insured">' + currency_format(roundit(insured)) + '</span></td>' +
            '<td valign="top"  class=" ' + classname + '" align="right"><span class="' + unclassname + '" id="final_uninsured">' + currency_format(roundit(uninsured)) + '</span></td>' +
            '</tr>' +
            '</tbody>').appendTo('#singleinstitutiontable');
    }
    else {
        //colspan 2 = col-1
        $('<tbody id="singleinstiutionbody" >' +
            '<tr class="">' +
            '<td colspan="2" class=""></td>' +
            //'<td valign="top" class=" ' + classname + '"></td>' +
            '<td valign="top" class=" ' + classname + '" align="right">' + currency_format(roundit(balance)) + '</td>' +
            '<td valign="top" class=" ' + classname + '" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
            '<td valign="top" class=" ' + classname + '" align="right"><a href="javascript:void(0)" class="calculate_btn" style="color:#003256; text-decoration: underline" title="Calculate Coverage">Calculate<br/>Coverage</a></td>' +
            '</tr>' +
            '</tbody>').appendTo('#singleinstitutiontable');;
    }
}



function render_report_summary(uninsured) {

    $('#other_calculate_btn').hide();

    if (!calculate_insurance_flag) {
        report_status = '<div class="whats_next container padding5">' +
            '<p style="font-size: 16px; font-weight: bold; text-align: center; margin: 0; padding: 0;">What\'s Next?&nbsp;</p>' +
            '<div class="row whats_next_row">' +
            '<div class="col-lg-5 whats_next_desc_col">' +
            '<p></p>' +
            '<input type="button" class="usa-button usa-button--primary width-full whats_next_button" btn value="Add New Account" class="actionbutton_wide" onclick="do_scroll_up()" title="Add New Account"/>' +
            '</div>' +
            '<div class="col-lg-2 whats_next_or_col padding10top">' +
            '<p></p>' +
            '<p></p>' +
            '<p></p>' +
            '<p><b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Or&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b></p>' +
            '</div>' +
            '<div class="col-lg-5 whats_next_desc_col">' +
            '<p></p>' +
            '<input type="button" class="usa-button usa-button--primary width-full whats_next_button calculate_btn"  btn value="Calculate Coverage" title="Calculate Coverage" >' +
            '</div>' +
            '</div>' +
            '</div>';

        $('#other_calculate_btn').show();

        //<input type="radio" value="0" id="set250" name="set100" checked onclick="$(\'#set250b\').click();"/></td>
        //<td valign="top"><label for="set250">%option_250%</label></td></tr><tr><td valign="top" align="right">
        //<input type="radio" value="1" id="set100" name="set100" onclick="$(\'#set100b\').click();"/></td><td valign="top">
        //<label for="set100">%option_100%</label></td></tr></table><p style="text-align: center">
    } else if (uninsured) {
        report_status = '<div class="uninsured-no-bottom-line"><p>ATTENTION: EDIE estimates that a portion of your deposits at this financial institution exceeds FDIC insurance limits and is currently uninsured. To ensure your funds remain fully protected, review your FDIC coverage regularly. Use EDIE whenever you make changes to your accounts to confirm that all your deposits fall within insured limits.</p><p id="whitelabel_addon" style="display: none;"></p></p></div>';

        //<p><table class="recalc_link"><tr><td valign="top">
        //<input type="radio" value="0" id="set250" name="set100" onclick="$(\'.recalculate_btn\').hide();" checked/></td>
        //<td valign="top"><label for="set250">%report_reflects%: %recalculate_250%</label></td></tr>
        //<tr><td valign="top"><input type="radio" value="1" id="set100" name="set100" onclick="$(\'.recalculate_btn\').show();"/></td>
        //<td valign="top"><label for="set100">Recalculate for: %recalculate_100%</label></td></tr></table></p>
        //<p class="recalc_link" style="text-align: center"><input type="button" value="Recalculate" class="recalculate_btn" style="display: none;">		
    } else {
        report_status = '<div><p>Looks good! Based on the information you entered, EDIE estimates that your deposit accounts at this financial institution are fully insured. Remember to stay familiar with your FDIC coverage limits.  Use EDIE whenever you update or change your accounts to ensure your deposits remain fully protected.</p><p id="whitelabel_addon" style="display: none;"></p></p></div>';
		//<p><table class="recalc_link"><tr><td valign="top">
        //<input type="radio" value="0" id="set250" name="set100" onclick="$(\'.recalculate_btn\').hide();" checked/></td>
        //<td valign="top"><label for="set250">%report_reflects%: %recalculate_250%</label></td></tr>
        //<tr><td valign="top"><input type="radio" value="1" id="set100" name="set100" onclick="$(\'.recalculate_btn\').show();"/></td>
        //<td valign="top"><label for="set100">Recalculate for: %recalculate_100%</label></td></tr></table></p><p class="recalc_link" style="text-align: center">
        //<input type="button" value="Recalculate" class="recalculate_btn" style="display: none;">;		

    }

    return $(report_status);
}

// function render_report_summary (previous version)
// before $250k rule made permenant
function render_report_summary2(uninsured) {

    if (!calculate_insurance_flag) {
        report_status = '<div class="whats_next"><p style="font-size: 16px; font-weight: bold; text-align: center; margin: 0; padding: 0;">What\'s Next?&nbsp;</p><<div class="row"><div class="col" style="padding: 0 10px;" ><p style="text-align: center">Continue to enter additional accounts you hold at this bank (if any)</p><p style="text-align: center"><input type="button" value="Add Another Account" class="actionbutton" onclick="scroll_up()" /></p></div><div class="summaryor col-1 "> <br><br> <p style="font-size: 16px; font-weight: bold; text-align: center; margin: 0; padding: 0;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Or&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p></div><div class="col" style="padding: 0 10px;"><p style="text-align: center">Calculate your insurance coverage</p><div class="row"><div class="col" valign="top" ><input type="radio" value="0" id="set250" name="set100" checked onclick="$(\'#set250b\').click();"/></div><div class="col" valign="top"><label for="set250">%option_250%</label></div></div><div class="row"><div class="col" valign="top"><input type="radio" value="1" id="set100" name="set100" onclick="$(\'#set100b\').click();"/></div><div class="col" valign="top"><label for="set100">%option_100%</label></div></div><p style="text-align: center"><input type="button" value="Calculate Coverage" class="calculate_btn usa-button usa-button--primary  margin-bottom-3 margin-x-auto text-uppercase"  btn></p></div></div></div>';
    } else if (uninsured) {
        if (INSURANCE_LIMIT == 100000) {
            report_status = '<div class="uninsured-no-bottom-line"><p>%status_uninsured_100%</p><p>%verify_coverage%</p><p id="whitelabel_addon" style="display: none;"></p><p><div class="row"><div class="col" valign="top"><input type="radio" value="1" id="set250" name="set250" onclick="$(\'.recalculate_btn\').show();"/></div><div class="col" valign="top"><label for="set250">Recalculate for: %recalculate_250%</label></div></div><div class="row"><div class="col" valign="top"><input type="radio" value="0" id="set100" name="set250" onclick="$(\'.recalculate_btn\').hide();" checked/></div><div class="col" valign="top"><label for="set100">%report_reflects%: %recalculate_100%</label></div></div></p><p class="recalc_link" style="text-align: center"><input type="button" value="Recalculate" class="recalculate_btn" style="display: none;"></p></div>';

        } else {
            report_status = '<div class="uninsured-no-bottom-line"><p>ATTENTION: EDIE estimates that a portion of your deposits at this financial institution exceeds FDIC insurance limits and is currently uninsured. To ensure your funds remain fully protected, review your FDIC coverage regularly. Use EDIE whenever you make changes to your accounts to confirm that all your deposits fall within insured limits.</p><p>%verify_coverage%</p><p id="whitelabel_addon" style="display: none;"></p><p><div class="row"><div class="col" valign="top"><input type="radio" value="0" id="set250" name="set100" onclick="$(\'.recalculate_btn\').hide();" checked/></div><div class="col" valign="top"><label for="set250">%report_reflects%: %recalculate_250%</label></div></div><div class="row"><div class="col" valign="top"><input type="radio" value="1" id="set100" name="set100" onclick="$(\'.recalculate_btn\').show();"/></div><div class="col" valign="top"><label for="set100">Recalculate for: %recalculate_100%</label></div></div></p><p class="recalc_link" style="text-align: center"><input type="button" value="Recalculate" class="recalculate_btn" style="display: none;"></p></div>';
        }
    } else {
        if (INSURANCE_LIMIT == 100000) {
            report_status = '<div><p>%status_insured_100% %verify_coverage%</p><p id="whitelabel_addon" style="display: none;"></p><p><div class="row"><div class="col" valign="top"><input type="radio" value="1" id="set250" name="set250" onclick="$(\'.recalculate_btn\').show();"/></div><div class="col" valign="top"><label for="set250">Recalculate for: %recalculate_250%</label></div></div><div class="row"><div class="col" valign="top"><input type="radio" value="0" id="set100" name="set250" onclick="$(\'.recalculate_btn\').hide();" checked/></div><div class="col" valign="top"><label for="set100">%report_reflects%: %recalculate_100%</label></div></div></p><p class="recalc_link" style="text-align: center"><input type="button" value="Recalculate" class="recalculate_btn" style="display: none;"></p></div>';

        } else {
            report_status = '<div><p>Looks good! Based on the information you entered, EDIE estimates that your deposit accounts at this financial institution are fully insured. Remember to stay familiar with your FDIC coverage limits.  Use EDIE whenever you update or change your accounts to ensure your deposits remain fully protected. %verify_coverage%</p><p id="whitelabel_addon" style="display: none;"></p><p><div class="row"><div class="col" valign="top"><input type="radio" value="0" id="set250" name="set100" onclick="$(\'.recalculate_btn\').hide();" checked/></div><div class="col" valign="top"><label for="set250">%report_reflects%: %recalculate_250%</label></div></div><div class="row"><div class="col" valign="top"><input type="radio" value="1" id="set100" name="set100" onclick="$(\'.recalculate_btn\').show();"/></div><div class="col" valign="top"><label for="set100">Recalculate for: %recalculate_100%</label></div></div></p><p class="recalc_link" style="text-align: center"><input type="button" value="Recalculate" class="recalculate_btn" style="display: none;"></p></div>';
        }
    }

    return $(report_status);
}

/////////////////////////////////////////////////////////////////////////////////////////
// VALIDATION FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function clear_error(elem_id) {
  
      if (elem_id == 'institution') {
        $('#' + elem_id + '_valid').attr('src', 'images/check_red.gif');
      }
      else
      {
        $('#' + elem_id + '_valid').attr('src', 'images/check_grey.gif');
      }
      $('#' + elem_id + '_valid').attr('role', 'img');
      $('#' + elem_id + '_valid').attr('title', 'Status');
      clear_error_message(elem_id + '_valid');
    
}

function validate_money(val) {

    if (val.match(/^\$?[0-9,]+(.\d\d)?$/)) {
        val = val.replace(/[^0-9\.]/g, "");

        var dec = val.indexOf(".");
        var test = ((dec > -1) ? val.substring(0, dec) : val);
        if (test.length > 15) { return "overflow"; }

        return currency_format(val);
    }

    return "";
}

function validate_calculator() {

    if (get_account_type() == "personal") {
        return validate_calculator_personal();
    } else if (get_account_type() == "public") {
        return validate_calculator_public();
    } else {
        return validate_calculator_business();
    }
}

function check_special_cases(name) {

    var institution = null;
    if (institutions.length) {
        institution = institutions[0];
    } else {
        institution = new Institution();
    }

    var beneficiaries = new Array();
    var total_balance = 0;

    for (var i = 0; i < institution.personal_accounts.length; i++) {
        var account = institution.personal_accounts[i];

        //R5.7.3: exclude amount from nibta -- R5.8.1 Remove NIBTA logic
        var balance = money_to_float(account.balance);
        var slice = balance / (account.owners.length * account.beneficiaries.length);
        // var balance =0; 
        // var slice=0;
        // if(account.deposit_type != "non_interest") {
        // balance = money_to_float(account.balance);
        // slice = balance / (account.owners.length * account.beneficiaries.length);
        // }

        for (var j = 0; j < account.owners.length; j++) {
            var owner = account.owners[j];
            if (owner.name.toLowerCase() != name.toLowerCase()) continue;

            for (var k = 0; k < account.beneficiaries.length; k++) {
                var bene = account.beneficiaries[k];
                if (bene.type == 'other') continue;
                if (!beneficiaries[bene.name.toLowerCase()]) beneficiaries[bene.name.toLowerCase()] = 0;
                beneficiaries[bene.name.toLowerCase()] += slice;
                total_balance += slice;
            }
        }
    }


    var bene_count = 0;
    for (var bname in beneficiaries) {
        bene_count += 1;
    }

    var unequal = false;
    var over_limit = false;
    var verify_equal = false;

    total_balance = Math.round(total_balance * 100) / 100

    if (total_balance <= INSURANCE_LIMIT * 5 && bene_count > 5) {
        verify_equal = true;
    }

    if (total_balance > INSURANCE_LIMIT * 5 && bene_count > 5) {
        var last_amount = null;
        verify_equal = true;

        for (var bname in beneficiaries) {
            var interest = beneficiaries[bname];
            if (last_amount != null && interest != last_amount) {
                unequal = true;
            }

            if (interest > INSURANCE_LIMIT) {
                over_limit = true;
            }

            last_amount = interest;
        }

    }

    // possible return values:
    // "use_alternate", "over_limit"
    if (unequal && over_limit) return "over_limit";
    if (verify_equal) return "verify_equal";

    // use normal flow
    return "";
}

function validate_calculator_business() {

    var valid = true;

    if (!validate_institution()) valid = false;
    if (!validate_sole_proprietorship()) valid = false;
    if (!validate_business_name()) valid = false;
    if (!validate_ein()) valid = false;
    if (!validate_business_account_name()) valid = false;
    if (!validate_business_account_balance()) valid = false;
    //if(!validate_business_deposit_type()) valid = false;
    //R5.7.3: check nibta deposit type
    //if(!validate_deposit_type_nibta('business_deposit_type')) valid = false;
    //R5.8.0: check now deposit type
    //if(!validate_deposit_type_now('business_deposit_type')) valid = false;

    return valid;
}

function validate_calculator_public() {

    var valid = true;

    if (!validate_institution()) valid = false;
    if (!validate_account_holder()) valid = false;
    if (!validate_custodian()) valid = false;
    if (!validate_custodian_definition()) valid = false;
    if (!validate_public_unit_name()) valid = false;
    if (!validate_public_unit_definition()) valid = false;
    if (!validate_publicein()) valid = false;
    if (!validate_state_match()) valid = false;
    if (!validate_public_account_name()) valid = false;
    if (!validate_public_account_balance()) valid = false;
    if (!validate_public_deposit_type()) valid = false;
    //R5.7.3: check nibta deposit type
    //if(!validate_deposit_type_nibta('public_deposit_type')) valid = false;	

    return valid;
}

function validate_calculator_personal() {

    var valid = true;
    if (!validate_calculator_personal_main()) valid = false;
    if (!validate_calculator_personal_living()) valid = false;
	if (!validate_calculator_beneficiary_living()) valid = false;
    return valid;
}

function validate_calculator_personal_main() {

    var valid = true;
    if (!validate_institution()) valid = false;
    if (!validate_account_name()) valid = false;
    if (!validate_account_balance()) valid = false;
    if (!validate_account_type(true)) valid = false;
    //if(!validate_deposit_type()) valid = false;
	   
    if ($('#account_type').val() == 'IrrevocableTrust') {
        if (!validate_ein_irt()) valid = false;
    }

    return valid;
}

function validate_calculator_beneficiary_living() {

    var valid = true;

    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });   
        for (var i = 0; i < b_ids.length; i++) {

            if (!validate_beneficiary_all(b_ids[i])) {
                    valid = false;
            }
        }
    }
    return valid;
}

function validate_calculator_personal_living() {

    var valid = true;
   // if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
        for (var i = 0; i < b_idso.length; i++) {
            if (!validate_owner_all(b_idso[i])) {
                valid = false;
            }
        }

   // }

    if ($('#account_type').val() == 'IrrevocableTrust') {
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
        if (b_idso.length == 2) {
            for (var i = 0; i < b_idso.length; i++) {
                if (!validate_owner_all_irt(b_idso[i])) {
                    valid = false;
                }
            }
        }
    }

    return valid;
}

function validate_calculator_personal_living_no() {
    var count = 0;
  //  if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
        for (var i = 0; i < b_idso.length; i++) {
            if (!validate_owner_all_irt(b_idso[i])) {
                count++;
            }
        }

 //   }
    return count;
}

function validate_calculator_beneficiary_living_no() {
    var count = 0;
    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
        for (var i = 0; i < b_ids.length; i++) {
            if (!validate_beneficiary_only_living(b_ids[i])) {
                count++;
            }
        }

    }

    return count;
}

function validate_calculator_beneficiary_no() {
    var count = 0;
    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
        for (var i = 0; i < b_ids.length; i++) {
            if (!validate_beneficiary_all(b_ids[i])) {
                count++;
            }
        }

    }

    return count;
}

function validate_calculator_beneficiary_name_no() {                 
    var counts = 0;
    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
        for (var i = 0; i < b_ids.length; i++) {
            for (var j = 0; j < b_idso.length; j++) {
                if (($('input[name=' + b_ids[i] + ']').val()) == ($('input[name=' + b_idso[j] + ']').val())) {
                    counts++;
                }
            }
        }

    }

    return counts;
}


function validate_calculator_personal_living_countowner() {
    var count = 0;
    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
        for (var i = 0; i < b_idso.length; i++) {
            if (!validate_owner_all_countowner(b_idso[i])) {
                count++;
            }
        }

    }
    return count;
}


function validate_calculator_personal_living_null() {
    var count = 0;
  //  if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
        for (var i = 0; i < b_idso.length; i++) {
            if (validate_owner_all_null(b_idso[i])) {
                count++;
            }
        }

  //  }
    return count;
}

function validate_owner_name_only() {
    var valid = true;
    // if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {                  // red x
    var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
    for (var i = 0; i < b_idso.length; i++) {
        if (!validate_owner_only(b_idso[i])) {
            valid = false;
        }
    }

    // }
    return valid;
}

function validate_owner_only(oid) {
    var valid = true;

    if (!validate_owner_name(oid)) {
        valid = false;
    }
    return valid;
}

function validate_owner_all_irt(oid) {
    var valid = true;

    // if (!validate_owner_name(oid)) {
    //     valid = false;
    //  }

    if (!validate_owner_living_irt(oid)) {
        valid = false;
    }

    return valid;
}

function validate_owner_all_countowner(oid) {
    var valid = true;

    if (!validate_owner_living_countowner(oid)) {
        valid = false;
    }

    return valid;
}
function validate_owner_all_null(oid) {
    var valid = false;
    if (validate_owner_living_null(oid)) {
        valid = true;
    }

    return valid;
}

function validate_owner_living_null(oid) {

    if ($("input[name=" + oid + "_living]:checked").length == 0) {
        return true;
    }

}

function validate_owner_living_irt(oid) {

    if ($("input[name=" + oid + "_living]:checked").length == 0) {
        $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(oid + '_living_valid', ERR_INC, 'owner_last_living_valid');
        return true;
    } else if ($("input[name=" + oid + "_living]:checked").val() != 'yes') {
        if ($('#account_type').val() == 'IrrevocableTrust') {
            if (owner_same_name(oid)) {
                $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
                set_error_message(oid + '_living_valid', ERR_INC, 'same_owner_last_living_valid');
                return false;
            }
            else {
                $('#' + oid + '_living_valid').attr('src', 'images/check_green.gif');
                $('#' + oid + '_living_valid').attr('title', 'Valid Status');
                clear_error_message(oid + '_living_valid');
                return false;
            }
        }
        else {
            $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
            if ($('#account_type').val() == 'Trust') {
			  if (validate_calculator_personal_living_countowner() == 1) {
			  set_error_message(oid + '_living_valid', ERR_BAD, 'trust_owner_last_living_valid_deceased');
			  }
			  else {
			  set_error_message(oid + '_living_valid', ERR_BAD, 'trust_both_owner_last_living_valid_deceased');
			  }
            }
			else if ($('#account_type').val() == 'ITF') {
			  if (validate_calculator_personal_living_countowner() == 1) {
			    set_error_message(oid + '_living_valid', ERR_BAD, 'itf_owner_last_living_valid_deceased');
			  }
			  else {
			    set_error_message(oid + '_living_valid', ERR_BAD, 'itf_both_owner_last_living_valid_deceased');
			  }
            }
            else {
                set_error_message(oid + '_living_valid', ERR_BAD, 'owner_last_living_valid_deceased');
            }
            return false;
        }
    } else {
        if (owner_same_name(oid)) {
            same_owner_name = false;
        }
        $('#' + oid + '_living_valid').attr('src', 'images/check_green.gif');
        $('#' + oid + '_living_valid').attr('title', 'Valid Status');
        clear_error_message(oid + '_living_valid');
        return true;
    }

}

function validate_owner_living_countowner(oid) {

   // if ($("input[name=" + oid + "_living]:checked").length == 0) {
  //      return true;
  //  }
	//else 
	if ($("input[name=" + oid + "_living]:checked").val() == 'no') { 
            return false;
        }
    else {
        return true;
    }

}


function set_error_message(name, type, clone) {
    currentCluetipElem = null; // this is to disable the auto focus of the image when cluetip close
    $("#cluetip-close").click();

    var key = name;
    if (clone) key = clone;

    error_tracker[name] = type;

    $('#' + name).attr('title', 'Error Status');
    $('#' + name).attr('rel', 'messages/' + key + '.txt');
    $('#' + name).attr('role', 'img');

    //if (!$('#' + name).data("is-cluetip-set"))
    {
        $('#' + name).data("is-cluetip-set", true);

        var onShow = function () {
            let a = document.getElementsByClassName("cluetip-jtipgreen");
            [...a].forEach(x => x.classList.remove("cluetip-jtipgreen"));
            let b = document.getElementsByClassName("clue-left-jtipgreen");
            [...b].forEach(x => x.classList.remove("clue-left-jtipgreen"));
            let c = document.getElementsByClassName("clue-right-jtipgreen");
            [...c].forEach(x => x.classList.remove("clue-right-jtipgreen"));
            let d = document.getElementsByClassName("clue-bottom-jtipgreen");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipgreen"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    currentCluetipElem = null; // this is to disable the auto focus of the image when cluetip close
                    hideCluetip();
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //  $(document).click(function (e) {
            //      if (!(e.target.id || '').startsWith("cluetip")) {
            //          $("#cluetip-close").click();
            //          //$('#cluetip').hide();
            //      }
            //});

        }

        $('#' + name).cluetip('destroy');

        $('#' + name).cluetip({
            arrows: true,
            dropShadow: false,
            cluetipClass: 'jtipred',
            activation: 'hover',
            sticky: true,
            closeText: 'Close',
            onActivate: function () { if ($('#' + name).attr('rel')) { return true; } else { return false; } },
            onShow: onShow
        }).cluetip({
            arrows: true,
            dropShadow: false,
            cluetipClass: 'jtipred',
            activation: 'click',
            sticky: true,
            closeText: 'Close',
            onActivate: function () { if ($('#' + name).attr('rel')) { return true; } else { return false; } },
            onShow: onShow
        });
    }
}

function clear_error_message(val) {
    currentCluetipElem = null; // this is to disable the auto focus of the image when cluetip close
    $("#cluetip-close").click();
    if (val) $('#' + val).attr('rel', '');

    error_tracker[val] = 0;
}

function glink(anchor) {
    var link = encodeURIComponent(anchor);
    var classname = whitelabel ? "grey" : "green";
    var width = whitelabel ? "570" : "650";

    setTimeout(
        function () {
            $('#generic_trigger').attr('href', 'glossary_calculator.html?height=400&width=' + width + '&style=' + classname + '&atarget=' + link);
            $('#generic_trigger').click();

            resetModal();

            $('#generic_trigger').attr('href', '');

        }, 500);
}

function resetModal() {
    var width = parseInt($("#TB_window").css("width"), 10);

    if (width) {
        width = width - 10;
        $('#TB_ajaxContent').css("width", width.toString() + "px");
    }
}

function set_help_messages_all(classoverride, titlecolor) {

    if (!classoverride) {
        classoverride = 'jtipgreen';
    }

    if (!titlecolor) {
        titlecolor = '#ffffff';
    }

    $('span[class=help]').attr('title', 'Help');

    //R5.7.3: add "deposit_type_nibta_help", "business_deposit_type_nibta_help", "public_deposit_type_nibta_help"
    //R5.8.0: add "business_deposit_type_now_help"
    $.each(["institution_help", "account_balance_help", "business_account_balance_help",
        "business_account_name_help", "account_name_help", "account_type_help",
        "owner_help", "owner_living_help", "beneficiary_help", "beneficiary_living_help", "beneficiary1_living_help",
        "beneficiary_charity_help", "beneficiary1_charity_help", "sole_proprietorship_help", "business_name_help", "ein_help",
        "deposit_type_help", "business_deposit_type_help", "trustee_help",
        "grantor_help", "grantor_living_help", "trustein_help", "custodian_help", "account_holder_help",
        "custodian_definition_help", "public_unit_name_help", "public_unit_definition_help",
        "state_match_help", "publicein_help", "public_account_name_help", "public_account_balance_help",
        "public_deposit_type_help", "personal_account_help", "business_account_help", "public_account_help",
        "irrevocable_trust_help", "corporation_help", "public_help",
        "deposit_type_nibta_help", "business_deposit_type_nibta_help", "public_deposit_type_nibta_help",
        "business_deposit_type_now_help", "Personal_ein_help"],


        function () {
            var onShow = function () {
                if (classoverride == 'jtipred') {
                    let a = document.getElementsByClassName("cluetip-jtipgreen");
                    [...a].forEach(x => x.classList.remove("cluetip-jtipgreen"));
                    let b = document.getElementsByClassName("clue-left-jtipgreen");
                    [...b].forEach(x => x.classList.remove("clue-left-jtipgreen"));
                    let c = document.getElementsByClassName("clue-right-jtipgreen");
                    [...c].forEach(x => x.classList.remove("clue-right-jtipgreen"));
                    let d = document.getElementsByClassName("clue-bottom-jtipgreen");
                    [...d].forEach(x => x.classList.remove("clue-bottom-jtipgreen"));
                }
                else if (classoverride == 'jtipgreen') {
                    let a = document.getElementsByClassName("cluetip-jtipred");
                    [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
                    let b = document.getElementsByClassName("clue-left-jtipred");
                    [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
                    let c = document.getElementsByClassName("clue-right-jtipred");
                    [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
                    let d = document.getElementsByClassName("clue-bottom-jtipred");
                    [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));
                }

                var handler = function (e) {
                    if (!(e.target.id || '').startsWith("cluetip")) {
                        currentCluetipElem = null; // this is to disable the auto focus of the image when cluetip close
                        hideCluetip();
                    }
                }

                var hideCluetip = function () {
                    $('#cluetip').hide();
                    $(document).unbind("click", handler);
                }

                $(document).bind("click", handler);

                //$(document).click(function (e) {
                //    if (!(e.target.id || '').startsWith("cluetip")) {
                //        $('#cluetip').hide();
                //    }
                //});
            };

            var helpMessageFile = this;
            if (this == 'beneficiary1_charity_help') {
                helpMessageFile = 'beneficiary_charity_help';
            }
            $('#' + this).attr('rel', 'messages/' + helpMessageFile + '.txt');

            $('#' + this).cluetip({
                arrows: true,
                dropShadow: false,
                cluetipClass: classoverride,
                activation: 'hover',
                sticky: true,
                titleColor: titlecolor,
                closeText: 'Close',
                width: 400,
                onShow: onShow
            }).cluetip({
                arrows: true,
                dropShadow: false,
                cluetipClass: classoverride,
                activation: 'click',
                sticky: true,
                titleColor: titlecolor,
                closeText: 'Close',
                width: 400,
                onShow: onShow
            });

			  var capture = $("#cluetip")
                        .attr("tabindex", "-1")
                        .focus()                      
                        .keydown(
                            function handleKeydown(event){
                                if (event.key.toLowerCase() !=="tab"){
                                    
                                    if (event.keyCode === 13 ){                                       
                                        $("#cluetip").hide();
                                    }
                                    return; 
                                }                              

                                var target = $(event.target);

                                var tabbable = $()
                                                .add(capture.find("button, input, select, textare"))
                                                .add(capture.find("[href]"))
                                                .add(capture.find("[tabindex]:not([tabindex='-1']"));

                                var target = $(event.target);

                                //reverse tabbing (key: shift+ tab)
                                if (event.shiftKey){
                                    if (target.is(capture) || target.is(tabbable.first())){
                                        //Force focus to last element in container 
                                        event.preventDefault();
                                        tabbable.last().focus();
                                    }
                                }else {
                                    //Forward tabbing (key: tab)
                                    if (target.is(tabbable.last())){
                                        //Force forcus to first element in container 
                                        event.preventDefault();
                                        tabbable.first().focus();
                                    }
                                }
                            }
                        )
        });

}

function validate_sole_proprietorship() {
    if ($('#active_account_id').val() != 'new') return true;

    changing_proprietorship = true;

    var cancelSoleProprietorshipSelection = function () {
        if (selected_proprietorship != 'business') {
            $("input:radio[name=sole_proprietorship]:checked")[0].checked = false;
        }
        else {
            $("#b_corporation").attr("checked", true);
        }
    }

    if (!$("input[name=sole_proprietorship]:checked").val()) {
        $('#sole_proprietorship_valid').attr('src', 'images/check_red.gif');
        set_error_message('sole_proprietorship_valid', ERR_INC);

        changing_proprietorship = false;
        selected_proprietorship = '';

        return false;

    } else if ($("input[name=sole_proprietorship]:checked").val() == "personal") {
        var isDirty = hasData();
        var showPersonal = function () {
            if ($('input[name=business_account_name]').val()) {
                $('input[name=account_name]').val($('input[name=business_account_name]').val());
                validate_account_name();
            }
            if ($('input[name=business_account_balance]').val()) {
                $('input[name=account_balance]').val($('input[name=business_account_balance]').val());
                validate_account_balance();
            }

            $('input[name=business_personal]').filter('[value=personal]').click();
            $('#sole_proprietorship_valid').attr('src', 'images/check_grey.gif');
            $('#sole_proprietorship_valid').attr('title', 'Status');
            clear_error_message('sole_proprietorship_valid');
            $("input[name=sole_proprietorship]").attr("checked", false);

            changing_proprietorship = false;
            selected_proprietorship = 'personal';
        }

        if (isDirty) {
            show_confirm("If you continue you’ll lose all the information you’ve entered.", showPersonal, cancelSoleProprietorshipSelection);
        }
        else {
            showPersonal();
        }

        return true;
    } else if ($("input[name=sole_proprietorship]:checked").val() == "public") {
        var isDirty = hasData();
        var showPublic = function () {
            if ($('input[name=business_account_name]').val()) {
                $('input[name=public_account_name]').val($('input[name=business_account_name]').val());
                validate_public_account_name();
            }
            if ($('input[name=business_account_balance]').val()) {
                $('input[name=public_account_balance]').val($('input[name=business_account_balance]').val());
                validate_public_account_balance();
            }

            $('input[name=business_personal]').filter('[value=public]').click();
            $('#sole_proprietorship_valid').attr('src', 'images/check_grey.gif');
            $('#sole_proprietorship_valid').attr('title', 'Status');
            clear_error_message('sole_proprietorship_valid');
            $("input[name=sole_proprietorship]").attr("checked", false);

            changing_proprietorship = false;
            selected_proprietorship = 'public';
        }

        if (isDirty) {
            show_confirm("If you continue you’ll lose all the information you’ve entered.", showPublic, cancelSoleProprietorshipSelection);
        }
        else {
            showPublic();
        }

        return true;
    } else {
        $('#sole_proprietorship_valid').attr('src', 'images/check_green.gif');
        $('#sole_proprietorship_valid').attr('title', 'Valid Status');
        clear_error_message('sole_proprietorship_valid');

        changing_proprietorship = false;
        selected_proprietorship = 'business';

        return true;
    }
}

function validate_state_match() {

    if (!$("input[name=state_match]:checked").val()) {
        $('#state_match_valid').attr('src', 'images/check_red.gif');
        set_error_message('state_match_valid', ERR_INC);
        return false;
    } else {
        if ($('#publicein').val() != "" && institutions.length && institutions[0].public_accounts.length) {
            for (var i = 0; i < institutions[0].public_accounts.length; i++) {
                var account = institutions[0].public_accounts[i];
                if (account.id != $('#active_account_id').val()) {
                    if (account.ein == $('#publicein').val()) {
                        var form_state_match = false;
                        if ($("input[name=state_match]:checked").val() == 'yes') form_state_match = true;
                        if (account.state_match != form_state_match) {
                            $('#state_match_valid').attr('src', 'images/check_red.gif');
                            set_error_message('state_match_valid', ERR_INV, 'state_match_valid_inconsistent');
                            return false;
                        }
                    }
                }
            }
        }

        $('#state_match_valid').attr('src', 'images/check_green.gif');
        $('#state_match_valid').attr('title', 'Valid Status');
        clear_error_message('state_match_valid');
        return true;
    }
}

function validate_ein() {
    trim_spaces($('input[name=ein]'));

    var ein = $('input[name=ein]').val();
    var einvalid = false;

    if (!ein) {
        $('#ein_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_valid', ERR_INC);
        return false;
    }

    if (ein.match(/\d{3}(-|\s)\d{2}(-|\s)\d{4}/)) {
        $('#ein_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_valid', ERR_INV, 'ein_valid_format');
        return false;
    }

    if (ein.match(/^\d{9}$/)) {
        $('#ein_valid').attr('src', 'images/check_green.gif');
        $('#ein_valid').attr('title', 'Valid Status');
        clear_error_message('ein_valid');
        var formatted = ein.substr(0, 2) + "-" + ein.substr(2, 7);
        $('input[name=ein]').val(formatted);
        einvalid = true;
    }

    if (ein.match(/^\d{2}\s\d{7}$/)) {
        $('#ein_valid').attr('src', 'images/check_green.gif');
        $('#ein_valid').attr('title', 'Valid Status');
        clear_error_message('ein_valid');
        var formatted = ein.replace(/\s/, '-');
        $('input[name=ein]').val(formatted);
        einvalid = true;
    }

    if (!einvalid && !ein.match(/^\d{2}-\d{7}$/)) {
        $('#ein_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_valid', ERR_INV, 'ein_valid_format');
        return false;
    }

    if (account_same_ein()) {
        $('#ein_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_valid', ERR_INV, 'same_ein_business_valid_format');
        return false;
    }

    if (account_same_ein_business()) {
        $('#ein_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_valid', ERR_INV, 'same_ein_business_business_valid_format');
        return false;
    }

    if (institutions.length) {
        var inst = institutions[0];
        if (inst.public_accounts.length) {
            for (var i = 0; i < inst.public_accounts.length; i++) {
                var pacct = inst.public_accounts[i];
                if (pacct.ein == ein) {
                    $('#ein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('ein_valid', ERR_INV, 'ein_valid_dupe1');
                    return false;
                }
            }
        }
        if (inst.personal_accounts.length) {
            for (var i = 0; i < inst.personal_accounts.length; i++) {
                var pacct = inst.personal_accounts[i];
                if (pacct.trustein == ein) {
                    $('#ein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('ein_valid', ERR_INV, 'ein_valid_dupe2');
                    return false;
                }
            }
        }
    }

    return validate_ein_names();

}

function validate_ein_names_irt() {

    var ein = $('input[name=ein_irt]').val();
    var institution = institutions.length ? institutions[0] : null;

    if (ein && institution) {
        var accounts = institution.public_accounts;

        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].id != $('#active_account_id').val()) {
                if (accounts[i].name.toLowerCase() == accounts[i].ein != ein) {
                    $('#ein_irt_valid').attr('src', 'images/check_red.gif');
                    set_error_message('ein_irt_valid', ERR_INV, 'ein_valid_namedupe');
                    return false;
                }
            }
        }
    }

    if (ein) {
        $('#ein_irt_valid').attr('src', 'images/check_green.gif');
        $('#ein_irt_valid').attr('title', 'Valid Status');
        clear_error_message('ein_irt_valid');
    }

    return true;
}


function validate_ein_irt() {
    trim_spaces($('input[name=ein_irt]'));

    var ein = $('input[name=ein_irt]').val();
    var einvalid = false;

    if (!ein) {
        $('#ein_irt_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_irt_valid', ERR_INC);
        return false;
    }

    if (ein.match(/\d{3}(-|\s)\d{2}(-|\s)\d{4}/)) {
        $('#ein_irt_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_irt_valid', ERR_INV, 'ein_irt_valid_format');
        return false;
    }

    if (ein.match(/^\d{9}$/)) {
        $('#ein_irt_valid').attr('src', 'images/check_green.gif');
        $('#ein_irt_valid').attr('title', 'Valid Status');
        clear_error_message('ein_irt_valid');
        var formatted = ein.substr(0, 2) + "-" + ein.substr(2, 7);
        $('input[name=ein_irt]').val(formatted);
        einvalid = true;
    }

    if (ein.match(/^\d{2}\s\d{7}$/)) {
        $('#ein_irt_valid').attr('src', 'images/check_green.gif');
        $('#ein_irt_valid').attr('title', 'Valid Status');
        clear_error_message('ein_irt_valid');
        var formatted = ein.replace(/\s/, '-');
        $('input[name=ein_Irt]').val(formatted);
        einvalid = true;
    }

    if (!einvalid && !ein.match(/^\d{2}-\d{7}$/)) {
        $('#ein_irt_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_irt_valid', ERR_INV, 'ein_irt_valid_format');
        return false;
    }

    if (account_same_ein()) {
        $('#ein_irt_valid').attr('src', 'images/check_red.gif');
        set_error_message('ein_irt_valid', ERR_INV, 'same_ein_trust_valid_format');
        return false;
    }

    if (institutions.length) {
        var inst = institutions[0];
        if (inst.public_accounts.length) {
            for (var i = 0; i < inst.public_accounts.length; i++) {
                var pacct = inst.public_accounts[i];
                if (pacct.ein == ein) {
                    $('#ein_irt_valid').attr('src', 'images/check_red.gif');
                    set_error_message('ein_irt_valid', ERR_INV, 'ein_valid_dupe1');
                    return false;
                }
            }
        }
        if (inst.personal_accounts.length) {
            for (var i = 0; i < inst.personal_accounts.length; i++) {
                var pacct = inst.personal_accounts[i];
                if (pacct.trustein == ein) {
                    $('#ein_irt_valid').attr('src', 'images/check_red.gif');
                    set_error_message('ein_irt_valid', ERR_INV, 'ein_valid_dupe2');
                    return false;
                }
            }
        }
    }

    return validate_ein_names_irt();

}
function validate_custodian() {
    trim_spaces($('input[name=custodian]'));

    if (!$('input[name=custodian]').val()) {
        $('#custodian_valid').attr('src', 'images/check_red.gif');
        set_error_message('custodian_valid', ERR_INC);
        return false;
    }
    $('#custodian_valid').attr('src', 'images/check_green.gif');
    $('#custodian_valid').attr('title', 'Valid Status');
    clear_error_message('custodian_valid');
    return true;
}

function validate_account_holder() {
    trim_spaces($('input[name=account_holder]'));

    if (!$('input[name=account_holder]').val()) {
        $('#account_holder_valid').attr('src', 'images/check_red.gif');
        set_error_message('account_holder_valid', ERR_INC);
        return false;
    }
    $('#account_holder_valid').attr('src', 'images/check_green.gif');
    $('#account_holder_valid').attr('title', 'Valid Status');
    clear_error_message('account_holder_valid');
    return true;
}

function validate_public_unit_name() {
    trim_spaces($('input[name=public_unit_name]'));

    if (!$('input[name=public_unit_name]').val()) {
        $('#public_unit_name_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_unit_name_valid', ERR_INC);
        return false;
    }
    $('#public_unit_name_valid').attr('src', 'images/check_green.gif');
    $('#public_unit_name_valid').attr('title', 'Valid Status');
    clear_error_message('public_unit_name_valid');
    return true;
}

function validate_public_account_name() {
    trim_spaces($('input[name=public_account_name]'));

    if (!$('input[name=public_account_name]').val()) {
        $('#public_account_name_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_account_name_valid', ERR_INC);
        return false;
    }
    $('#public_account_name_valid').attr('src', 'images/check_green.gif');
    $('#public_account_name_valid').attr('title', 'Valid Status');
    clear_error_message('public_account_name_valid');
    return true;
}


function validate_business_name() {
    trim_spaces($('input[name=business_name]'));

    if (!$('input[name=business_name]').val()) {
        $('#business_name_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_name_valid', ERR_INC);
        return false;
    } else {

        if (!validate_ein_names()) {
            return false;
        }

        $('#business_name_valid').attr('src', 'images/check_green.gif');
        $('#business_name_valid').attr('title', 'Valid Status');
        clear_error_message('business_name_valid');
        return true;
    }
}

function validate_ein_names() {
    var bname = $('input[name=business_name]').val();
    var ein = $('input[name=ein]').val();
    var institution = institutions.length ? institutions[0] : null;

    if (bname && ein && institution) {
        var accounts = institution.business_accounts;

        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].id != $('#active_account_id').val()) {
                if (accounts[i].name.toLowerCase() == bname && accounts[i].ein != ein) {
                    $('#ein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('ein_valid', ERR_INV, 'ein_valid_namedupe');
                    return false;
                }
            }
        }
    }

    if (ein) {
        $('#ein_valid').attr('src', 'images/check_green.gif');
        $('#ein_valid').attr('title', 'Valid Status');
        clear_error_message('ein_valid');
    }

    return true;
}

function validate_business_account_name() {
    trim_spaces($('input[name=business_account_name]'));

    if (!$('input[name=business_account_name]').val()) {
        $('#business_account_name_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_account_name_valid', ERR_INC);
        return false;
    } else {
        $('#business_account_name_valid').attr('src', 'images/check_green.gif');
        $('#business_account_name_valid').attr('title', 'Valid Status');
        clear_error_message('business_account_name_valid');
        return true;
    }
}

function validate_business_account_balance() {
    trim_spaces($('input[name=business_account_balance]'));

    if ($('input[name=business_account_balance]').val() == "" || $('input[name=business_account_balance]').val() == null) {
        $('#business_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_account_balance_valid', ERR_INC);
        return false;
    }

    var balance = validate_money($('input[name=business_account_balance]').val() || "");

    if (balance == "") {
        $('#business_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_account_balance_valid', ERR_INV, 'business_account_balance_valid_non_numeric');
        return false;
    } else if (balance == "overflow") {
        $('#business_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_account_balance_valid', ERR_INV, 'business_account_balance_valid_overflow');
        return false;
    } else if (balance == "$0.00") {
        $('#business_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_account_balance_valid', ERR_INV);
        return false;
    } else {
        $('#business_account_balance_valid').attr('src', 'images/check_green.gif');
        $('#business_account_balance_valid').attr('title', 'Valid Status');
        $('input[name=business_account_balance]').val(balance);
        clear_error_message('business_account_balance_valid');
        return true;
    }
}

function validate_public_account_balance() {
    trim_spaces($('input[name=public_account_balance]'));

    if ($('input[name=public_account_balance]').val() == "" || $('input[name=public_account_balance]').val() == null) {
        $('#public_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_account_balance_valid', ERR_INC);
        return false;
    }

    var balance = validate_money($('input[name=public_account_balance]').val() || "");

    if (balance == "") {
        $('#public_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_account_balance_valid', ERR_INV, 'public_account_balance_valid_non_numeric');
        return false;
    } else if (balance == "overflow") {
        $('#public_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_account_balance_valid', ERR_INV, 'public_account_balance_valid_overflow');
        return false;
    } else if (balance == "$0.00") {
        $('#public_account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_account_balance_valid', ERR_INV);
        return false;
    } else {
        $('#public_account_balance_valid').attr('src', 'images/check_green.gif');
        $('#public_account_balance_valid').attr('title', 'Valid Status');
        $('input[name=public_account_balance]').val(balance);
        clear_error_message('public_account_balance_valid');
        return true;
    }
}

function validate_account_name() {
    trim_spaces($('input[name=account_name]'));

    if (!$('input[name=account_name]').val()) {
        $('#account_name_valid').attr('src', 'images/check_red.gif');
        set_error_message('account_name_valid', ERR_INC);
        return false;
    } else {
        $('#account_name_valid').attr('src', 'images/check_green.gif');
        $('#account_name_valid').attr('title', 'Valid Status');
        clear_error_message('account_name_valid');
        return true;
    }
}

function validate_institution() {
    should_warn = true;

    if (!$('input[name=institution]').length) {
      //  $('#institution_valid').attr('src', 'images/check_green.gif');
        $('#institution_valid').attr('title', 'Valid Status');
        clear_error_message('institution_valid');
        return true;
    }

    trim_spaces($('input[name=institution]'));
	$('#institution_valid').hide(); 
    if (!$('input[name=institution]').val()) {
	    $('#institution_valid').show(); 
        $('#institution_valid').attr('src', 'images/check_red.gif');
        set_error_message('institution_valid', ERR_INC);
        return false;
    } else {
        if ($('input[name=business_personal]:checked').length) swap_institution();

      //  $('#institution_valid').attr('src', 'images/check_green.gif');
        $('#institution_valid').attr('title', 'Valid Status');
        clear_error_message('institution_valid');
        return true;
    }
}

function validate_account_balance() {

    if ($('input[name=account_balance]').val() == "" || $('input[name=account_balance]').val() == null) {
        $('#account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('account_balance_valid', ERR_INC);
        return false;
    }

    trim_spaces($('input[name=account_balance]'));

    var balance = validate_money($('input[name=account_balance]').val() || "");

    if (balance == "") {
        $('#account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('account_balance_valid', ERR_INV, 'account_balance_valid_non_numeric');
        return false;
    } else if (balance == "overflow") {
        $('#account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('account_balance_valid', ERR_INV, 'account_balance_valid_overflow');
        return false;
    } else if (balance == "$0.00") {
        $('#account_balance_valid').attr('src', 'images/check_red.gif');
        set_error_message('account_balance_valid', ERR_INC);
        return false;
    } else {
        $('input[name=account_balance]').val(balance);
        clear_error_message('account_balance_valid');
        $('#account_balance_valid').attr('src', 'images/check_green.gif');
        $('#account_balance_valid').attr('title', 'Valid Status');
        return true;
    }
}

//R5.7.3: add check for nibta type
function toggle_deposit_type_checks(bid, manualchange) {

    $('#' + bid + '_nibta_div').hide();

    if (manualchange) {
        $('input[name=' + bid + '_nibta]').attr('checked', false);
        $('#' + bid + '_nibta_valid').attr('src', 'images/check_grey.gif');
        $('#' + bid + '_nibta_valid').attr('title', 'Status');
        clear_error_message(bid + '_nibta_valid');
    }
    var value = $('select[name=' + bid + ']').val();
	// R5.8.1 Remove NIBTA logic
	// if(value == 'non_interest') {
		// $('#'+bid+'_nibta_div').show();
	// }
    //R5.8.0: show/hide now deposit type question for business accounts
    if (bid == 'business_deposit_type') {
        if (manualchange) {
            $('input[name=' + bid + '_now]').attr('checked', false);
            $('#' + bid + '_now_valid').attr('src', 'images/check_grey.gif');
            $('#' + bid + '_now_valid').attr('title', 'Status');
            clear_error_message(bid + '_now_valid');
        }
        $('#' + bid + '_now_div').hide();
        if (value == 'non_interest_2') {
            $('#' + bid + '_now_div').show();
        }
    }
}

//R5.7.3: add check for nibta type
//function validate_deposit_type() {
function validate_deposit_type(manualchange) {
    toggle_deposit_type_checks('deposit_type', manualchange);

    if (!$("#deposit_type").val()) {
        $('#deposit_type_valid').attr('src', 'images/check_red.gif');
        set_error_message('deposit_type_valid', ERR_INC);
        return false;
    }

    $('#deposit_type_valid').attr('src', 'images/check_green.gif');
    $('#deposit_type_valid').attr('title', 'Valid Status');
    clear_error_message('deposit_type_valid');
    return true;
}

//R5.7.3: add check for nibta type
//function validate_business_deposit_type() {
function validate_business_deposit_type(manualchange) {
    toggle_deposit_type_checks('business_deposit_type', manualchange);

    if (!$("#business_deposit_type").val()) {
        $('#business_deposit_type_valid').attr('src', 'images/check_red.gif');
        set_error_message('business_deposit_type_valid', ERR_INC);
        return false;
    }

    $('#business_deposit_type_valid').attr('src', 'images/check_green.gif');
    $('#business_deposit_type_valid').attr('title', 'Valid Status');
    clear_error_message('business_deposit_type_valid');
    return true;
}

//R5.7.3: add check for nibta type
//function validate_public_deposit_type() {
function validate_public_deposit_type(manualchange) {
    toggle_deposit_type_checks('public_deposit_type', manualchange);

    if (!$("#public_deposit_type").val()) {
        $('#public_deposit_type_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_deposit_type_valid', ERR_INC);
        return false;
    }

    $('#public_deposit_type_valid').attr('src', 'images/check_green.gif');
    $('#public_deposit_type_valid').attr('title', 'Valid Status');
    clear_error_message('public_deposit_type_valid');
    return true;
}

//R5.7.3: reset check for nibta type
function reset_deposit_type_nibta(bid) {

    //$('input[name='+bid+'_nibta]').attr('checked',false);
    //$('select[name='+bid+']').val('');
    $('#' + bid + '_nibta_div').hide();

    //$('input[name='+bid+']').val('');

    //$('#'+bid+'_valid').attr('src', 'images/check_grey.gif');
    //clear_error_message(bid+'_nibta_valid');
}

//R5.8.0: reset check for now deposit type
function reset_deposit_type_now(bid) {

    $('#' + bid + '_now_div').hide();
}

function validate_account_type(submitted, manual_select) {

    if (!submitted) submitted = false;

    if (!$("#account_type").val() && !manual_select) {
        $('#account_type_valid').attr('src', 'images/check_red.gif');
        $('#account_type_valid').data("is-cluetip-set", false);
        set_error_message('account_type_valid', ERR_INC);
        return false;
    } else {

        var hasOwnershipType = true;

        if (!$("#account_type").val()) {
            $('#account_type_valid').attr('src', 'images/check_red.gif');
            $('#account_type_valid').data("is-cluetip-set", false);
            set_error_message('account_type_valid', ERR_INC);
            hasOwnershipType = false;
        }

        if ($('#account_type').val() == 'IRT') {
            show_grantors();
            show_trustees();
            show_trustein();
            hide_owners();
            hide_beneficiaries();
            hide_beneficiaries_irt();

        } else {
            show_owners();
            hide_beneficiaries();
            hide_beneficiaries_irt();
            hide_grantors();
            hide_trustees();
            hide_trustein();
        }

        if (($('#account_type').val() == 'Retirement' || $('#account_type').val() == 'Single' || !hasOwnershipType) && $('.ownerclass').length > 1) {
            if (!$('input[name=owner_last]').val()) { remove_owner('owner_last', true); }
        }

        if ($('#account_type').val() == 'Retirement' && $('.ownerclass').length > 1) {
            $('#account_type_valid').attr('src', 'images/check_red.gif');
            $('#account_type_valid').data("is-cluetip-set", false);
            set_error_message('account_type_valid', ERR_INV, 'account_type_valid_retirement');
            return false;
        }

        if ($('#account_type').val() == 'Single' && $('.ownerclass').length > 1) {
            $('#account_type_valid').attr('src', 'images/check_red.gif');
            $('#account_type_valid').data("is-cluetip-set", false);
            set_error_message('account_type_valid', ERR_INV, 'account_type_valid_single');
            return false;
        }

        if ($('#account_type').val() == 'Retirement' || $('#account_type').val() == 'Single' || !hasOwnershipType) {
            $('#add_additional_owner_btn').hide();
        } else {
            $('#add_additional_owner_btn').show();
        }

        if ($('#account_type').val() == 'IrrevocableTrust') {
            $('#ein_tin').show();
        }
        else {
            $('#ein_tin').hide();
        }

        if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && $('.ownerclass').length > 2) {
            show_alert('<p>' + 'EDIE cannot calculate the insurance coverage of Trust accounts with more than 2 owners. Contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
            $('#account_type').val('');
            return validate_account_type(submitted);
        }

        if (submitted) {
            if ($('#account_type').val() == 'Joint' && $('.ownerclass').length == 1) {
                $('#account_type_valid').attr('src', 'images/check_red.gif');
                $('#account_type_valid').data("is-cluetip-set", false);
                set_error_message('account_type_valid', ERR_INV, 'account_type_valid_joint');
                return false;
            }
        }

        if (manual_select) {
            if ($('#account_type').val() == 'Joint' && $('.ownerclass').length == 1) {
                add_additional_owner(true);
            }
        }

        if ($("#account_type").val() == 'Other') {
            $('#account_type_valid').attr('src', 'images/check_red.gif');
            $('#account_type_valid').data("is-cluetip-set", false);
            set_error_message('account_type_valid', ERR_BAD, 'account_type_valid_other');
            return false;
        }

        if (hasOwnershipType) {
            $('#account_type_valid').attr('src', 'images/check_green.gif');
            $('#account_type_valid').attr('title', 'Valid Status');
            clear_error_message('account_type_valid');
        }

        if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
            show_beneficiaries();
            if ($('input[name=owner_last]').val() != '') {
                validate_calculator_personal_living();
            }
            if ($('#account_type').val() == 'IrrevocableTrust' || $('#account_type').val() == 'Trust') {
                $('#beneficiary_last_type_div').hide();
                $('#beneficiary_last_type_div_irt').show();
                $('#beneficiary_last_living_div').hide();
				$('#beneficiary_last1_living_div').hide();
                $('#beneficiary_last1_charity_div').hide();
                if ($('#beneficiary_last1_type').val() == 'person') {
                    if ($('input[name=beneficiary_last1_living]').val() == 'yes') {
                        $('#beneficiary_last1_living_div').show();
                        $('#beneficiary_last1_type_valid').attr('src', 'images/check_green.gif');
           
                    }

                }

                $('#beneficiary_last_charity_div').hide();
                if ($('#beneficiary_last1_type').val() == 'charity') {
                    if ($('input[name=beneficiary_last1_charity]').val() == 'yes') {
                        $('#beneficiary_last1_charity_div').show();
                        $('#beneficiary_last1_type_valid').attr('src', 'images/check_green.gif');

                    }  
                }
            }
            else {
                if ($('#beneficiary_last1_type').val() == 'person') {     
                    if ($('#beneficiary_last_type').val() == '') {
                        $('#beneficiary_last_type').val('person');
                    }
                }
                if ($('#beneficiary_last1_type').val() == 'charity') {
                    if ($('#beneficiary_last_type').val() == '') {
                        $('#beneficiary_last_type').val('charity');
                    }
                }

                $('#beneficiary_last_type_div_irt').hide();
                $('#beneficiary_last_type_div').show();
                $('#beneficiary_last1_living_div').hide();
                if ($('#beneficiary_last_type').val() == 'person') {
                    if ($('input[name=beneficiary_last_living]').val() == 'yes') {
                        $('#beneficiary_last_living_div').show();
                        $('#beneficiary_last_type_valid').attr('src', 'images/check_green.gif');
    
                    }
  
                }
                $('#beneficiary_last1_charity_div').hide();
                if ($('#beneficiary_last_type').val() == 'charity') {
                    if ($('input[name=beneficiary_last_charity]').val() == 'yes') {
                        $('#beneficiary_last_charity_div').show();
                        $('#beneficiary_last_type_valid').attr('src', 'images/check_green.gif');
    
                    }
 
                }
            }
        }

        return true;
    }
}
function validate_owner_all(oid) {
    var valid = true;

    if (!validate_owner_name(oid)) {
        valid = false;
    }

    if (!validate_owner_living(oid)) {
        valid = false;
    }

    return valid;
}

function validate_trustee_all(tid) {
    var valid = true;

    if (!validate_trustee_name(tid)) {
        valid = false;
    }

    return valid;
}

function validate_grantor_all(sid) {
    var valid = true

    if (!validate_grantor_name(sid)) {
        valid = false;
    }

    if (!validate_grantor_living(sid)) {
        valid = false;
    }

    return valid;
}

function check_for_compound_owner(eid) {
    var value = $('input[name=' + eid + ']').val();

    if (value.match(/(\sand\s|&)/i)) {
        show_alert('<p>' + "It appears you're trying to put two owners in the same field. Each person's name must be added separately.<br/><br/>Click OK, and enter one name per field to continue.  Click on &#8220;Add Additional Owner&#8221; if you need an additional Owner field." + '</p>',
            function () {
                $('input[name=' + eid + ']').focus()
            });

        return true;
    }
}

function check_for_trust_owner(eid) {
    var value = $('input[name=' + eid + ']').val();

    if (value.match(/\btrust\b/i)) {
        show_alert('<p>' + "It appears you're trying to enter a trust as the owner of this account. You should enter the name of the person who is the owner of this revocable trust in this field. You can enter the name of the trust in the Account Nickname field.<br/><br/>Click OK and edit your response to continue." + '</p>',
            function () {
                $('input[name=' + eid + ']').focus()
            });

        return true;
    }
    if (value.match(/\band\b/i)) {
        show_alert('<p>' + "&#8220;And&#8221; cannot be used as an owner. Click OK, and correct your entry to continue." + '</p>',
            function () {
                $('input[name=' + eid + ']').focus()
            });

        return true;
    }
}

function check_for_compound_beneficiary(eid) {
    var value = $('input[name=' + eid + ']').val();

    if (value.match(/(\sand\s|&)/i)) {
        show_alert('<p>' + "It appears you're trying to put two beneficiaries in the same field. Each beneficiary's name must be added separately.<br/><br/>Click OK, and enter one name per field to continue.  Click on &#8220;Add Additional Beneficiary&#8221; if you need an additional Beneficiary field." + '</p>',
            function () {
                $('input[name=' + eid + ']').focus()
            });

        return true;
    }
}

function check_for_trust_beneficiary(eid) {
    var value = $('input[name=' + eid + ']').val();

    if (value.match(/\btrust\b/i)) {
        show_alert('<p>' + "It appears you're trying to enter a trust as the beneficiary of this account. If the name entered is the owner's revocable trust, enter the name of the trust beneficiary in this field. If the trust names more than one beneficiary, enter each beneficiary's name in a different box.<br/><br/>Click OK and edit your response to continue. Click on &#8220;Add Additional Beneficiary&#8221; if you need additional Beneficiary fields." + '</p>',
            function () {
                $('input[name=' + eid + ']').focus()
            });

        return true;
    }

    if (value.match(/\band\b/i)) {
        show_alert('<p>' + "&#8220;And&#8221; cannot be used as a beneficiary. Click OK, and correct your entry to continue." + '</p>',
            function () {
                $('input[name=' + eid + ']').focus()
            });

        return true;
    }
}

function validate_owner_name(oid, do_compound_check) {

    let result;

    trim_spaces($('input[name=' + oid + ']'));

    if (do_compound_check && check_for_compound_owner(oid)) {
        return false;
    }

    if (do_compound_check && check_for_trust_owner(oid)) {
        return false;
    }

    if (!$('input[name=' + oid + ']').val()) {
        $('#' + oid + '_valid').attr('src', 'images/check_red.gif');
        set_error_message(oid + '_valid', ERR_INC, 'owner_last_valid');
        return false;
    } else {
       // return cross_validate_all_names();
        var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });
        var seen = get_owner_name_counts();

        if ($('#account_type').val() != "IRT") {                                                           // #9  
            for (var i = 0; i < owner_ids.length; i++) {
                var oid = owner_ids[i];
                if (seen[$('input[name=' + oid + ']').val().toLowerCase()] > 1) {
                    $('#' + oid + '_valid').attr('src', 'images/check_red.gif');
                    set_error_message(oid + '_valid', ERR_INV, 'owner_last_valid_dupe');
                    result =  false;
                } else if ($('input[name=' + oid + ']').val()) {
                    $('#' + oid + '_valid').attr('src', 'images/check_green.gif');
                    $('#' + oid + '_valid').attr('title', 'Valid Status');
                    clear_error_message(oid + '_valid');
                    result =  true;
                }
            }
        }
    }
    return result;
}

function validate_trustee_name(tid) {

    trim_spaces($('input[name=' + tid + ']'));

    if (!$('input[name=' + tid + ']').val()) {
        $('#' + tid + '_valid').attr('src', 'images/check_red.gif');
        set_error_message(tid + '_valid', ERR_INC, 'trustee_last_valid');
        return false;
    } else {
        return cross_validate_all_names();
    }

}

function validate_grantor_name(sid) {

    trim_spaces($('input[name=' + sid + ']'));

    if (!$('input[name=' + sid + ']').val()) {
        $('#' + sid + '_valid').attr('src', 'images/check_red.gif');
        set_error_message(sid + '_valid', ERR_INC, 'grantor_last_valid');
        return false;
    }

    return cross_validate_all_names();
}

function cross_validate_all_names() {
    var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });
    var bene_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
    var trustee_ids = $.map($('input.trusteeclass'), function (e) { return e.name; });
    var grantor_ids = $.map($('input.grantorclass'), function (e) { return e.name; });
    var seen = get_owner_name_counts();
    var benes = get_beneficiary_name_counts();
    var trustees = get_trustee_name_counts();
    var grantors = get_grantor_name_counts();

    var valid = true;

    if ($('#account_type').val() != "IRT") {
        for (var i = 0; i < owner_ids.length; i++) {
            var oid = owner_ids[i];
            if (seen[$('input[name=' + oid + ']').val().toLowerCase()] > 1) {
                $('#' + oid + '_valid').attr('src', 'images/check_red.gif');
                set_error_message(oid + '_valid', ERR_INV, 'owner_last_valid_dupe');
                valid = false;
            } else if ($('input[name=' + oid + ']').val()) {
                $('#' + oid + '_valid').attr('src', 'images/check_green.gif');
                $('#' + oid + '_valid').attr('title', 'Valid Status');
                clear_error_message(oid + '_valid');
            }
        }
    } else {
        for (var i = 0; i < trustee_ids.length; i++) {
            var oid = trustee_ids[i];
            if (trustees[$('input[name=' + oid + ']').val().toLowerCase()] > 1) {
                $('#' + oid + '_valid').attr('src', 'images/check_red.gif');
                set_error_message(oid + '_valid', ERR_INV, 'trustee_last_valid_dupe');
                valid = false;
            } else if ($('input[name=' + oid + ']').val()) {
                $('#' + oid + '_valid').attr('src', 'images/check_green.gif');
                $('#' + oid + '_valid').attr('title', 'Valid Status');
                clear_error_message(oid + '_valid');
            }
        }
        for (var i = 0; i < grantor_ids.length; i++) {
            var oid = grantor_ids[i];
            if (grantors[$('input[name=' + oid + ']').val().toLowerCase()] > 1) {
                $('#' + oid + '_valid').attr('src', 'images/check_red.gif');
                set_error_message(oid + '_valid', ERR_INV, 'grantor_last_valid_dupe');
                valid = false;
            } else if ($('input[name=' + oid + ']').val()) {
                $('#' + oid + '_valid').attr('src', 'images/check_green.gif');
                $('#' + oid + '_valid').attr('title', 'Valid Status');
                clear_error_message(oid + '_valid');
            }
        }

        var tracker = [];

        if (institutions.length) {
            for (var i = 0; i < institutions[0].personal_accounts.length; i++) {
                var acct = institutions[0].personal_accounts[i];
                if ($('#active_account_id').val() == acct.id) continue;
                if (acct.grantors.length) {
                    for (var j = 0; j < acct.grantors.length; j++) {
                        if (acct.grantors[j].living == "yes2") {

                            if (!tracker[acct.grantors[j].name.toLowerCase()]) tracker[acct.grantors[j].name.toLowerCase()] = [];
                            tracker[acct.grantors[j].name.toLowerCase()][acct.trustein] = 1;
                        }
                    }
                }
            }
        }

        if ($('input[name=trustein]').val() != "") {

            for (var k = 0; k < grantor_ids.length; k++) {
                var sid = grantor_ids[k];
                if (!$('input[name=' + sid + ']').val()) continue;
                if ($('input[name=' + sid + '_living]:checked').val() != "yes2") continue;
                var name = $('input[name=' + sid + ']').val().toLowerCase();

                if (!tracker[name]) tracker[name] = [];
                tracker[name][$('input[name=trustein]').val()] = 1;

                var count = 0;
                for (var t in tracker[name]) {
                    count++;
                }

                if (count >= 2) {
                    $('#' + sid + '_valid').attr('src', 'images/check_red.gif');
                    set_error_message(sid + '_valid', ERR_INV, 'grantor_last_ein_violation');
                    valid = false;
                }
            }
        }

        if (grantor_ids.length == 1 && $('input[name=' + grantor_ids[0] + '_living]:checked').val()) {
            if ($('#' + grantor_ids[0] + '_living_valid').attr('src') == 'images/check_red.gif') {
                $('#' + grantor_ids[0] + '_living_valid').attr('src', 'images/check_green.gif');
                $('#' + grantor_ids[0] + '_living_valid').attr('title', 'Valid Status');
                clear_error_message(grantor_ids[0] + '_living_valid');
            }
        }

        for (var k = 0; k < grantor_ids.length; k++) {
            var sid = grantor_ids[k];
            var livingstate = $('input[name=' + sid + '_living]:checked').val();
            if (!livingstate) continue;

            if (institutions.length) {
                for (var i = 0; i < institutions[0].personal_accounts.length; i++) {
                    var acct = institutions[0].personal_accounts[i];
                    if ($('#active_account_id').val() == acct.id) continue;
                    if (acct.grantors.length) {
                        for (var j = 0; j < acct.grantors.length; j++) {
                            if (acct.grantors[j].name.toLowerCase() != $('input[name=' + sid + ']').val().toLowerCase()) continue;
                            var storedstate = acct.grantors[j].living;
                            if (storedstate == livingstate) continue;

                            if (livingstate == "no" || storedstate == "no") {
                                $('#' + sid + '_living_valid').attr('src', 'images/check_red.gif');
                                set_error_message(sid + '_living_valid', ERR_INV, 'grantor_last_living_deceased_match');
                                valid = false;
                            } else if ($('input[name=trustein]').val() != "" && $('input[name=trustein]').val() == acct.trustein) {
                                $('#' + sid + '_living_valid').attr('src', 'images/check_red.gif');
                                set_error_message(sid + '_living_valid', ERR_INV, 'grantor_last_living_interest_match');
                                valid = false;
                            }
                        }
                    }
                    if (acct.owners.length) {
                        for (var j = 0; j < acct.owners.length; j++) {
                            if (acct.owners[j].name.toLowerCase() != $('input[name=' + sid + ']').val().toLowerCase()) continue;
                            if (livingstate == "no") {
                                $('#' + sid + '_living_valid').attr('src', 'images/check_red.gif');
                                set_error_message(sid + '_living_valid', ERR_INV, 'grantor_last_living_deceased_match');
                                valid = false;
                            }
                        }
                    }
                }
            }
        }

        if (grantor_ids.length == 2 && $('input[name=' + grantor_ids[0] + '_living]:checked').val() == "no" && ($('input[name=' + grantor_ids[1] + '_living]:checked').val() == "yes1" || $('input[name=' + grantor_ids[1] + '_living]:checked').val() == "yes2")) {
            $('#' + grantor_ids[1] + '_living_valid').attr('src', 'images/check_red.gif');
            set_error_message(grantor_ids[1] + '_living_valid', ERR_INC, 'grantor_last_living_deceased_stop');
            valid = false;
        } else if (grantor_ids.length == 2 && $('input[name=' + grantor_ids[1] + '_living]:checked').val() == "no" && ($('input[name=' + grantor_ids[0] + '_living]:checked').val() == "yes1" || $('input[name=' + grantor_ids[0] + '_living]:checked').val() == "yes2")) {
            $('#' + grantor_ids[0] + '_living_valid').attr('src', 'images/check_red.gif');
            set_error_message(grantor_ids[0] + '_living_valid', ERR_INC, 'grantor_last_living_deceased_stop');
            valid = false;
        } else if (grantor_ids.length == 2 && $("input[name=" + grantor_ids[0] + "_living]:checked").length && $("input[name=" + grantor_ids[1] + "_living]:checked").length) {
            $('#' + grantor_ids[0] + '_living_valid').attr('src', 'images/check_green.gif');
            $('#' + grantor_ids[0] + '_living_valid').attr('title', 'Valid Status');
            clear_error_message(grantor_ids[0] + '_living_valid');
            $('#' + grantor_ids[1] + '_living_valid').attr('src', 'images/check_green.gif');
            $('#' + grantor_ids[1] + '_living_valid').attr('title', 'Valid Status');
            clear_error_message(grantor_ids[1] + '_living_valid');
            valid = true;
        }

    }

    if ($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') {
        for (var i = 0; i < bene_ids.length; i++) {
            var bid = bene_ids[i];
            var bidvalid = true;

            if (benes[$('input[name=' + bid + ']').val().toLowerCase()] > 1) {
                $('#' + bid + '_valid').attr('src', 'images/check_red.gif');
                set_error_message(bid + '_valid', ERR_INV, 'beneficiary_last_valid_dupe');
                valid = false;
                bidvalid = false;
            }

            if (seen[$('input[name=' + bid + ']').val().toLowerCase()]) {
                $('#' + bid + '_valid').attr('src', 'images/check_red.gif');
                set_error_message(bid + '_valid', ERR_INV, 'beneficiary_owner_dupe');
                valid = false;
                bidvalid = false;
            }

            if (bidvalid && $('input[name=' + bid + ']').val()) {
                $('#' + bid + '_valid').attr('src', 'images/check_green.gif');
                $('#' + bid + '_valid').attr('title', 'Valid Status');
                clear_error_message(bid + '_valid');
            }
        }
    }

    return valid;

}

function owner_same_name(oid) {
 var institution = institutions[0];

    if (institution !== undefined) {
        for (var i = 0; i < institutions[0].personal_accounts.length; i++) {

            for (var j = 0; j < institutions[0].personal_accounts[i].owners.length; j++) {
                if (cap_firsts(institutions[0].personal_accounts[i].owners[j].name.toLowerCase()) == cap_firsts($('input[name=' + oid + ']').val().toLowerCase()) && (institutions[0].personal_accounts[i].type !== 'IrrevocableTrust')) {
                    if (($('#account_type').val() == 'IrrevocableTrust') ) { 
                        same_owner_name = true;
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }
        }

    }
    else {
        return false;
    }

}

function account_same_ein() {
    var institution = institutions[0];
    var same_ein = false;
    if (institution !== undefined) {

        if (institutions[0].business_accounts[0] !== undefined) {
            for (var i = 0; i < institutions[0].business_accounts.length; i++) {

                if (get_account_type() == "personal" && ($('#account_type').val() == 'IrrevocableTrust')) {
                    if (institutions[0].business_accounts[0] && (institutions[0].business_accounts[i].ein == ($('#ein_irt').val()))) {
                        same_ein = true;
                    }
                }
            }
        }
        if (institutions[0].personal_accounts[0] !== undefined) {

            for (var i = 0; i < institutions[0].personal_accounts.length; i++) {

                if (get_account_type() == "business" && (institutions[0].personal_accounts[0].type == 'IrrevocableTrust')) {
                    if (institutions[0].personal_accounts[i].ein == ($('#ein').val())) {
                        same_ein = true;
                    }
                }
            }
        }

        if (same_ein == true) {
            return true;
        }
        else {
            return false;
        }

    }

}

function account_same_ein_business() {
    var institution = institutions[0];
    var same_ein = false;

    if (institution !== undefined) {

        if (institutions[0].business_accounts[0] !== undefined) {
            for (var i = 0; i < institutions[0].business_accounts.length; i++) {
                if (get_account_type() == "business") {
                    if ((institutions[0].business_accounts[i].ein == ($('#ein').val())) && ($('#business_name').val() != institutions[0].business_accounts[i].name)) {
                        same_ein = true;
                    }

                }
            }

        }
        if (same_ein == true) {
            return true;
        }
        else {
            return false;
        }


    }

}

function validate_owner_living(oid) {
    var b_idso = $.map($('input.ownerclass'), function (e) { return e.name; });
              if (b_idso.length == 2 && $("input[name=" + oid + "_living]:checked").val() == 'no') {
	            
				 if ($('#account_type').val() == 'Trust') {
			      set_error_message(oid + '_living_valid', ERR_BAD, 'trust_both_owner_last_living_valid_deceased');
				 }
					            
				 if ($('#account_type').val() == 'ITF') {
				  set_error_message(oid + '_living_valid', ERR_BAD, 'itf_both_owner_last_living_valid_deceased');
				 }
			  }

	if ($("input[name=" + oid + "_living]:checked").val() == 'no') {
	 
            if ($('#account_type').val() == 'Trust') {
			
			  if (validate_calculator_personal_living_countowner() == 1) {
			  set_error_message(oid + '_living_valid', ERR_BAD, 'trust_owner_last_living_valid_deceased');
			  }
			  else {
			  set_error_message(oid + '_living_valid', ERR_BAD, 'trust_both_owner_last_living_valid_deceased');
			  }
			   $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
			  return false;
            }
			else if ($('#account_type').val() == 'ITF') {

			  if (validate_calculator_personal_living_countowner() == 1) {
			    set_error_message(oid + '_living_valid', ERR_BAD, 'itf_owner_last_living_valid_deceased');

			  }
			  else {
			    set_error_message(oid + '_living_valid', ERR_BAD, 'itf_both_owner_last_living_valid_deceased');
			  }
		
			  $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
			  return false;
            }
			else if ($('#account_type').val() == 'IrrevocableTrust') {
                if (owner_same_name(oid)) {
                    $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
                    set_error_message(oid + '_living_valid', ERR_INC, 'same_owner_last_living_valid');
                    return false;
                }
                else {
                    $('#' + oid + '_living_valid').attr('src', 'images/check_green.gif');
                    $('#' + oid + '_living_valid').attr('title', 'Valid Status');
                    clear_error_message(oid + '_living_valid');
                    return true;
                }
            }
            else 
			{
			    $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
                set_error_message(oid + '_living_valid', ERR_BAD, 'owner_last_living_valid_deceased');
				return false;
            }
            
    }
	else if ($("input[name=" + oid + "_living]:checked").length == 0) {
        $('#' + oid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(oid + '_living_valid', ERR_INC, 'owner_last_living_valid');
        return false;
    } else

    {
        if (owner_same_name(oid)) {
            same_owner_name = false;
        }
        $('#' + oid + '_living_valid').attr('src', 'images/check_green.gif');
        $('#' + oid + '_living_valid').attr('title', 'Valid Status');
        clear_error_message(oid + '_living_valid');
        return true;
    }

}

function validate_grantor_living(sid) {

    if ($("input[name=" + sid + "_living]:checked").length == 0) {
        $('#' + sid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(sid + '_living_valid', ERR_INC, 'grantor_last_living_valid');
        return false;
    }

    $('#' + sid + '_living_valid').attr('src', 'images/check_green.gif');
    $('#' + sid + '_living_valid').attr('title', 'Valid Status');
    clear_error_message(sid + '_living_valid');


    return cross_validate_all_names();

}

function validate_custodian_definition() {

    if ($("input[name=custodian_definition]:checked").length == 0) {
        $('#custodian_definition_valid').attr('src', 'images/check_red.gif');
        set_error_message('custodian_definition_valid', ERR_INC);
        return false;
    } else if ($("input[name=custodian_definition]:checked").val() != 'yes') {
        $('#custodian_definition_valid').attr('src', 'images/check_red.gif');
        set_error_message('custodian_definition_valid', ERR_BAD, 'custodian_definition_valid_failed');
        return false;
    } else {
        $('#custodian_definition_valid').attr('src', 'images/check_green.gif');
        $('#custodian_definition_valid').attr('title', 'Valid Status');
        clear_error_message('custodian_definition_valid');
        return true;
    }

}

function validate_public_unit_definition() {

    if ($("input[name=public_unit_definition]:checked").length == 0) {
        $('#public_unit_definition_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_unit_definition_valid', ERR_INC);
        return false;
    } else if ($("input[name=public_unit_definition]:checked").val() != 'yes') {
        $('#public_unit_definition_valid').attr('src', 'images/check_red.gif');
        set_error_message('public_unit_definition_valid', ERR_BAD, 'public_unit_definition_valid_failed');
        return false;
    } else {
        $('#public_unit_definition_valid').attr('src', 'images/check_green.gif');
        $('#public_unit_definition_valid').attr('title', 'Valid Status');
        clear_error_message('public_unit_definition_valid');
        return true;
    }

}


function validate_trustein() {
    trim_spaces($('input[name=trustein]'));

    var ein = $('input[name=trustein]').val();
    var einvalid = false;

    if (!ein) {
        $('#trustein_valid').attr('src', 'images/check_red.gif');
        set_error_message('trustein_valid', ERR_INC);
        return false;
    }

    if (ein.match(/\d{3}(-|\s)\d{2}(-|\s)\d{4}/)) {
        $('#trustein_valid').attr('src', 'images/check_red.gif');
        set_error_message('trustein_valid', ERR_INV, 'trustein_valid_format');
        return false;
    }

    if (ein.match(/^\d{9}$/)) {
        $('#trustein_valid').attr('src', 'images/check_green.gif');
        $('#trustein_valid').attr('title', 'Valid Status');
        clear_error_message('trustein_valid');
        var formatted = ein.substr(0, 2) + "-" + ein.substr(2, 7);
        $('input[name=trustein]').val(formatted);
        einvalid = true;
    }

    if (ein.match(/^\d{2}\s\d{7}$/)) {
        $('#trustein_valid').attr('src', 'images/check_green.gif');
        $('#trustein_valid').attr('title', 'Valid Status');
        clear_error_message('trustein_valid');
        var formatted = ein.replace(/\s/, '-');
        $('input[name=trustein]').val(formatted);
        einvalid = true;
    }

    if (!einvalid && !ein.match(/^\d{2}-\d{7}$/)) {
        $('#trustein_valid').attr('src', 'images/check_red.gif');
        set_error_message('trustein_valid', ERR_INV, 'trustein_valid_format');
        return false;
    }

    if (institutions.length) {
        var inst = institutions[0];
        if (inst.business_accounts.length) {
            for (var i = 0; i < inst.business_accounts.length; i++) {
                var bacct = inst.business_accounts[i];
                if (bacct.ein == ein) {
                    $('#trustein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('trustein_valid', ERR_INV, 'ein_valid_dupe2');
                    return false;
                }
            }
        }
        if (inst.public_accounts.length) {
            for (var i = 0; i < inst.public_accounts.length; i++) {
                var pacct = inst.public_accounts[i];
                if (pacct.ein == ein) {
                    $('#trustein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('trustein_valid', ERR_INV, 'ein_valid_dupe3');
                    return false;
                }
            }
        }
    }

    var s_ids = $.map($('input.grantorclass'), function (e) { return e.name; });
    var grantor_valid = true;

    for (var i = 0; i < s_ids.length; i++) {
        if (!validate_grantor_name(s_ids[i])) {
            grantor_valid = false;
        }
        $('#trustein_valid').attr('src', 'images/check_green.gif');
        $('#trustein_valid').attr('title', 'Valid Status');
        clear_error_message('trustein_valid');
        if (!grantor_valid) return false;
    }

    $('#trustein_valid').attr('src', 'images/check_green.gif');
    $('#trustein_valid').attr('title', 'Valid Status');
    clear_error_message('trustein_valid');
    return true;
}

function validate_publicein() {
    trim_spaces($('input[name=publicein]'));

    var ein = $('input[name=publicein]').val();
    var einvalid = false;

    if ($("input[name=state_match]:checked").val()) {
        validate_state_match();
    }

    if (!ein) {
        $('#publicein_valid').attr('src', 'images/check_red.gif');
        set_error_message('publicein_valid', ERR_INC);

        return false;
    }

    if (ein.match(/\d{3}(-|\s)\d{2}(-|\s)\d{4}/)) {
        $('#publicein_valid').attr('src', 'images/check_red.gif');
        set_error_message('publicein_valid', ERR_INV, 'publicein_valid_format');
        return false;
    }

    if (ein.match(/^\d{9}$/)) {
        $('#publicein_valid').attr('src', 'images/check_green.gif');
        $('#publicein_valid').attr('title', 'Valid Status');
        clear_error_message('publicein_valid');
        var formatted = ein.substr(0, 2) + "-" + ein.substr(2, 7);
        $('input[name=publicein]').val(formatted);
        einvalid = true;
    }

    if (ein.match(/^\d{2}\s\d{7}$/)) {
        $('#publicein_valid').attr('src', 'images/check_green.gif');
        $('#publicein_valid').attr('title', 'Valid Status');
        clear_error_message('publicein_valid');
        var formatted = ein.replace(/\s/, '-');
        $('input[name=publicein]').val(formatted);
        einvalid = true;
    }

    if (!einvalid && !ein.match(/^\d{2}-\d{7}$/)) {
        $('#publicein_valid').attr('src', 'images/check_red.gif');
        set_error_message('publicein_valid', ERR_INV, 'publicein_valid_format');
        return false;
    }

    if (institutions.length) {
        var inst = institutions[0];
        if (inst.business_accounts.length) {
            for (var i = 0; i < inst.business_accounts.length; i++) {
                var bacct = inst.business_accounts[i];
                if (bacct.ein == ein) {
                    $('#publicein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('publicein_valid', ERR_INV, 'ein_valid_dupe1');
                    return false;
                }
            }
        }
        if (inst.personal_accounts.length) {
            for (var i = 0; i < inst.personal_accounts.length; i++) {
                var pacct = inst.personal_accounts[i];
                if (pacct.trustein == ein) {
                    $('#publicein_valid').attr('src', 'images/check_red.gif');
                    set_error_message('publicein_valid', ERR_INV, 'ein_valid_dupe3');
                    return false;
                }
            }
        }
    }
    $('#publicein_valid').attr('src', 'images/check_green.gif');
    $('#publicein_valid').attr('title', 'Valid Status');
    clear_error_message('publicein_valid');

    if ($("input[name=state_match]:checked").val()) {
        validate_state_match();
    }

    return true;
}


function validate_beneficiary_all(bid) {
    var valid = true;

    if ($('#account_type').val() == 'IrrevocableTrust' && (bid == 'beneficiary_last') ) {
            bid == 'beneficiary_last1'
    }
    if (!validate_beneficiary_name(bid)) {
        valid = false;
    }

    if (!validate_beneficiary_type(bid)) {
        valid = false;
    }

    if (!validate_beneficiary_charity(bid)) {
        valid = false;
    }

    if (!validate_beneficiary_living(bid)) {
        valid = false;
    }

    return valid;
}

function validate_beneficiary_only_living(bid) {
    var valid = true;

    if (!validate_beneficiary_living_message(bid)) {
        valid = false;
    }

    return valid;
}

function validate_beneficiary_living_message(bid) {
    if ($('#account_type').val() == 'IrrevocableTrust' || $('#account_type').val() == 'Trust') {
        if (bid == 'beneficiary_last') {
            bid = 'beneficiary_last1';
        }
    }

    if ($('select[name=' + bid + '_type]').val() != "person") return true;
    if ($("input[name=" + bid + "_living]:checked").length == 0) {
        $('#' + bid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_living_valid', ERR_INC, 'beneficiary_last_living_valid');
        return true;
    } else if ($("input[name=" + bid + "_living]:checked").val() != 'yes') {
        $('#' + bid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_living_valid', ERR_BAD, 'beneficiary_last_living_valid_deceased');
        return false;
    } else {
        $('#' + bid + '_living_valid').attr('src', 'images/check_green.gif');
        $('#' + bid + '_living_valid').attr('title', 'Valid Status');
        clear_error_message(bid + '_living_valid');
        return true;
    }

}

function validate_beneficiary_name(bid, do_compound_check) {

    trim_spaces($('input[name=' + bid + ']'));

    if (do_compound_check && check_for_compound_beneficiary(bid)) {
        return false;
    }

    if (do_compound_check && check_for_trust_beneficiary(bid)) {
        return false;
    }

    if (!$('input[name=' + bid + ']').val()) {
        $('#' + bid + '_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_valid', ERR_INC, 'beneficiary_last_valid');
        return false;
    } else {

        return cross_validate_all_names();
    }

}

function validate_beneficiary_type(bid, manualchange) {
    if ($('#account_type').val() == 'IrrevocableTrust' || $('#account_type').val() == 'Trust') {
        if (bid == 'beneficiary_last1') {
            $('#beneficiary_last_type_div').show();
            $('#beneficiary_last_type').val($('#beneficiary_last1_type').val());
            $('#beneficiary_type_valid').attr('src', 'images/check_green.gif');
            $('#beneficiary_last_type_div').hide();

            $('#beneficiary_last_living_div').show();
            $('input[name=beneficiary_last_living]').val(['yes']);

            $('#beneficiary_last_living_div').hide();

            $('#beneficiary_last_charity_div').show();
            $('input[name=beneficiary_last_charity]').val(['yes']);
   
            $('#beneficiary_last_charity_div').hide();

            $('input[name=beneficiary_last1_living]').val(['']);
            $('input[name=beneficiary_last1_charity]').val(['']);
        }
        if (bid == 'beneficiary_last') {
            bid = 'beneficiary_last1';
        }
    }
    else {
        if (bid == 'beneficiary_last') {

            $('#beneficiary_last_type_div_irt').show();
            $('#beneficiary_last1_type').val($('#beneficiary_last_type').val());
            $('#beneficiary_last1_type_valid').attr('src', 'images/check_green.gif');
            $('#beneficiary_last_type_div_irt').hide();

            $('#beneficiary_last1_living_div').show();
            $('input[name=beneficiary_last1_living]').val(['yes']);
           // $('#beneficiary_last1_living_valid').attr('src', 'images/check_green.gif');
            $('#beneficiary_last1_living_div').hide();

            $('#beneficiary_last1_charity_div').show();
            $('input[name=beneficiary_last1_charity]').val(['yes']);
   
            $('#beneficiary_last1_charity_div').hide();
        }
    }

    toggle_beneficiary_type_checks(bid, manualchange);

    if (!$("select[name=" + bid + "_type]").val()) {
        $('#' + bid + '_type_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_type_valid', ERR_INC, 'beneficiary_last_type_valid');
        return false;
    }

    if ($("select[name=" + bid + "_type]").val() == 'trust') {
        $('#' + bid + '_type_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_type_valid', ERR_BAD, 'beneficiary_last_type_valid_trust');
        return false;
    }

    if ($("select[name=" + bid + "_type]").val() == 'other') {
        $('#' + bid + '_type_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_type_valid', ERR_BAD, 'beneficiary_last_type_valid_other');
        return false;
    }

    $('#' + bid + '_type_valid').attr('src', 'images/check_green.gif');
    $('#' + bid + '_type_valid').attr('title', 'Valid Status');
    clear_error_message(bid + '_type_valid');
    return true;
}

function validate_beneficiary_living(bid) {
    if ($('#account_type').val() == 'IrrevocableTrust' || $('#account_type').val() == 'Trust') {
        if (bid == 'beneficiary_last') {
            bid = 'beneficiary_last1';
        }
    }

    if ($('select[name=' + bid + '_type]').val() != "person") return true;
    if ($("input[name=" + bid + "_living]:checked").length == 0) {
        $('#' + bid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_living_valid', ERR_INC, 'beneficiary_last_living_valid');
        return false;
    } else if ($("input[name=" + bid + "_living]:checked").val() != 'yes') {
        $('#' + bid + '_living_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_living_valid', ERR_BAD, 'beneficiary_last_living_valid_deceased');
        return false;
    } else {
        $('#' + bid + '_living_valid').attr('src', 'images/check_green.gif');
        $('#' + bid + '_living_valid').attr('title', 'Valid Status');
        clear_error_message(bid + '_living_valid');
        return true;
    }

}

function validate_beneficiary_charity(bid) {
    if ($('#account_type').val() == 'IrrevocableTrust' || $('#account_type').val() == 'Trust') {
        if (bid == 'beneficiary_last') {
            bid = 'beneficiary_last1';
        }
    }

    if ($('select[name=' + bid + '_type]').val() != "charity") return true;
    if ($("input[name=" + bid + "_charity]:checked").length == 0) {
        $('#' + bid + '_charity_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_charity_valid', ERR_INC, 'beneficiary_last_charity_valid');
        return false;
    } else if ($("input[name=" + bid + "_charity]:checked").val() != 'yes') {
        $('#' + bid + '_charity_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_charity_valid', ERR_BAD, 'beneficiary_last_charity_valid_no');
        return false;
    } else {
        $('#' + bid + '_charity_valid').attr('src', 'images/check_green.gif');
        $('#' + bid + '_charity_valid').attr('title', 'Valid Status');
        clear_error_message(bid + '_charity_valid');
        return true;
    }

}

//R5.7.3: check nibta deposit type
function validate_deposit_type_nibta(bid) {

    if ($('select[name=' + bid + ']').val() != "non_interest") return true;
    if ($("input[name=" + bid + "_nibta]:checked").length == 0) {
        $('#' + bid + '_nibta_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_nibta_valid', ERR_INC, 'deposit_type_nibta_valid');
        return false;
    } else if ($("input[name=" + bid + "_nibta]:checked").val() != 'yes') {
        $('#' + bid + '_nibta_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_nibta_valid', ERR_BAD, bid + '_nibta_valid_no');
        return false;
    } else {
        $('#' + bid + '_nibta_valid').attr('src', 'images/check_green.gif');
        $('#' + bid + '_nibta_valid').attr('title', 'Valid Status');
        clear_error_message(bid + '_nibta_valid');
        return true;
    }

}

//R5.8.0: check now deposit type
function validate_deposit_type_now(bid) {

    if ($('select[name=' + bid + ']').val() != "non_interest_2") return true;
    if ($("input[name=" + bid + "_now]:checked").length == 0) {
        $('#' + bid + '_now_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_now_valid', ERR_INC, 'deposit_type_now_valid');
        return false;
    } else if ($("input[name=" + bid + "_now]:checked").val() != 'yes') {
        $('#' + bid + '_now_valid').attr('src', 'images/check_red.gif');
        set_error_message(bid + '_now_valid', ERR_BAD, 'deposit_type_now_valid_no');
        return false;
    } else {
        $('#' + bid + '_now_valid').attr('src', 'images/check_green.gif');
        $('#' + bid + '_now_valid').attr('title', 'Valid Status');
        clear_error_message(bid + '_now_valid');
        return true;
    }

}


/////////////////////////////////////////////////////////////////////////////////////////
// DOM FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function reset_trustee_all(tid) {
    $('input[name=' + tid + ']').val('');
    $('#' + tid + '_valid').attr('src', 'images/check_grey.gif');
    $('#' + tid + '_valid').attr('title', 'Status');
    clear_error_message(tid + '_valid');
}

function add_additional_trustee(skip_previous_validation) {

    // R5.7.3: no longer being triggered
    // var trustee_ids = $.map($('input.trusteeclass'), function(e) { return e.name; });

    // if(trustee_ids.length >= 2) {
    // show_alert("<p>%too_many_trustees%</p>");
    // return;
    // }

    validate_trustee_all('trustee_last');

    var new_id = 'trustee_' + get_sequence();
    $('#trustee_last_tr_line').clone().attr('id', new_id + '_tr_line').insertBefore('#trustee_last_tr_line');

    var tmp = "What's&nbsp;This?";
    $('<div id="' + new_id + '_tr" class="trustee row">' +
        '<div class="col-md-3 edie-labels" valign="top" align="right">Trustee</div>' +
        '<div class="col-md-5" valign="top" align="left" >' +
        '<input name="' + new_id + '" maxlength="25" size="30" type="text"  class="trusteeclass"><br>' +
        '<div style=" text-align: right;"><nobr><span class="help" role="link" tabindex="0" title="' + tmp + '" id="' + new_id + '_help">' + tmp + '</span></nobr></div>' +
        '</div>' +
        '<div class="col" valign="top" align="left">' +
        '<img src="images/check_grey.gif" tabindex="0" width="22" height="20" alt="Status" border="0" class="status valid" id="' + new_id + '_valid">' +
        '</div>').insertBefore('#trustee_last_tr_line');

    if ($('input[name=trustee_last]').val())
        $('input[name=' + new_id + ']').val($('input[name=trustee_last]').val());

    $('input[name=' + new_id + ']').bind("blur", function (e) { validate_trustee_name(new_id, true); });
    $('input[name=' + new_id + ']').bind("focus", function (e) { clear_error(new_id); });

    $('#' + new_id + '_help').attr('rel', 'messages/trustee_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('&nbsp;<a style="display: inline;" href="javascript:remove_trustee(\'' + new_id + '\')">' +
        '<img src="images\/delete.gif" title="Delete Trustee" alt="Delete Trustee" width="22" height="20" border="0" vertical-align="baseline"/>' +
        '</a>').insertAfter('#' + new_id + '_tr .valid');
    if (!$('#trustee_last_tr #trustee_last_link').length) $('<a style="display: inline;" id="trustee_last_link" href="javascript:remove_trustee(\'trustee_last\')">' +
        '<img src="images\/delete.gif" title="Delete Trustee" alt="Delete Trustee" width="22" height="20" border="0" vertical-align="baseline" />' +
        '</a>').insertAfter('#trustee_last_tr .valid');

    $('#add_additional_trustee_btn').hide();

    reset_trustee_all('trustee_last');
    if (!skip_previous_validation) {
        validate_trustee_all(new_id);
    } else {
        if ($('input[name=' + new_id + ']').val()) {
            validate_trustee_name(new_id);
        }
    }

    $('input[name=' + new_id + ']').autocomplete(known_people);
    wlabelize();
}



function remove_trustee(trustee_id, skip_previous_validation) {

    if (trustee_id == 'trustee_last') {
        var trustee_ids = $.map($('input.trusteeclass'), function (e) { if (e.name != 'trustee_last') return e.name; });
        var source_id = trustee_ids.pop();

        $("input[name=trustee_last]").val([$("input[name=" + source_id + "]").val()] || "");

        $('#' + source_id + '_tr_line').remove();
        $('#' + source_id + '_tr').remove();

        if (!skip_previous_validation) {
            validate_trustee_all('trustee_last');
        } else {
            if ($('input[name=trustee_last]').val()) {
                validate_trustee_name('trustee_last');
            }
        }

    } else {
        $('#' + trustee_id + '_tr_line').remove();
        $('#' + trustee_id + '_tr').remove();
        cross_validate_all_names();
    }

    var trustee_ids = $.map($('input.trusteeclass'), function (e) { return e.name; });
    if (trustee_ids.length == 1) {
        $('#trustee_last_link').remove();
        $('#add_additional_trustee_btn').show();
    }

    if ($("select[name=account_type]").val()) {
        validate_account_type();
    }
    wlabelize();
}

function reset_grantor_all(sid) {
    $('input[name=' + sid + '_living]').attr('checked', false);
    $('input[name=' + sid + ']').val('');
    $('#' + sid + '_valid').attr('src', 'images/check_grey.gif');
    $('#' + sid + '_valid').attr('title', 'Status');
    $('#' + sid + '_living_valid').attr('src', 'images/check_grey.gif');
    $('#' + sid + '_living_valid').attr('title', 'Status');
    clear_error_message(sid + '_valid');
    clear_error_message(sid + '_living_valid');
}

function add_additional_grantor(skip_previous_validation) {

    // R5.7.3: no longer being triggered
    // var grantor_ids = $.map($('input.grantorclass'), function(e) { return e.name; });

    // if(grantor_ids.length >= 2) {
    // show_alert("<p>%too_many_grantors%</p>");
    // return;
    // }

    validate_grantor_all('grantor_last');

    var new_id = 'grantor_' + get_sequence();
    $('#grantor_last_tr_line').clone().attr('id', new_id + '_tr_line').insertBefore('#grantor_last_tr_line');

    var tmp = "What's&nbsp;This?";
    $('<div  id="' + new_id + '_tr" class="grantor row ">' +
        '<div class="col" valign="top" >Grantor</div>' +
        '<div class="col" valign="top" align="left">' +
        '<input name="' + new_id + '" maxlength="25" size="30" type="text" class="grantorclass" title="Grantor"><br>' +
        '<div style=" text-align: right;"><nobr><span class="help" role="link" tabindex="0" title="' + tmp + '" id="' + new_id + '_help">' + tmp + '</span></nobr></div><br>' +
        '</div>' +
        '<div class="col" valign="top"  align="left">' +
        '<nobr>' +
        '<img src="images/check_grey.gif" tabindex="0" width="22" height="20" alt="Status" border="0" class="status valid" id="' + new_id + '_valid">' +
        '</nobr>' +
        '</div>' +
        '<div class="col" valign="top" align="left">' +
        '<div class="row">' +
        '<div class="col" valign="top" align="left">' +
        '<nobr><span tabindex="0">Is the grantor living?</span></nobr><br>' +
        '<div style=" text-align: right;"><span class="help" role="link" tabindex="0" title="' + tmp + '" id="' + new_id + '_living_help">' + tmp + '</span></div>' +
        '</div>' +
        '<div class="col" valign="top" align="left">' +
        '<img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_living_valid">' +
        '</div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="col" valign="top">' +
        '<input name="' + new_id + '_living" type="radio" value="no" id="' + new_id + '_living_no"></div>' +
        '<div class="col">' +
        '<label for="' + new_id + '_living_no">No</label>' +
        '</div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="col" valign="top">' +
        '<input name="' + new_id + '_living" type="radio" value="yes1" id="' + new_id + '_living_yes_1">' +
        '</div>' +
        '<div class="col">' +
        '<label for="' + new_id + '_living_yes_1">Yes, and grantor has retained an interest in trust</label>' +
        '</div>' +
        '</div>' +
        '<div class="row">' +
        '<div class="col" valign="top">' +
        '<input name="' + new_id + '_living" type="radio" value="yes2" id="' + new_id + '_living_yes_2">' +
        '</div>' +
        '<div class="col">' +
        '<label for="' + new_id + '_living_yes_2">Yes, but grantor has <b>not</b> retained an interest in trust</label>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>').insertBefore('#grantor_last_tr_line');

    if ($("input[name=grantor_last_living]:checked").val())
        $("input[name=" + new_id + "_living]").val([$("input[name=grantor_last_living]:checked").val()]);
    if ($('input[name=grantor_last]').val())
        $('input[name=' + new_id + ']').val($('input[name=grantor_last]').val());

    $("input[name=" + new_id + "_living]").bind("click", function (e) { validate_grantor_living(new_id); });
    $('input[name=' + new_id + ']').bind("blur", function (e) { validate_grantor_name(new_id, true); });
    $('input[name=' + new_id + ']').bind("focus", function (e) { clear_error(new_id); });

    $('#' + new_id + '_help').attr('rel', 'messages/grantor_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('#' + new_id + '_living_help').attr('rel', 'messages/grantor_living_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('&nbsp;<a style="display: inline;" href="javascript:remove_grantor(\'' + new_id + '\')">' +
        '<img src="images\/delete.gif" title="Delete Grantor" alt="Delete Grantor" width="22" height="20" border="0" vertical-align="baseline"/>' +
        '</a>').insertAfter('#' + new_id + '_tr .valid');
    if (!$('#grantor_last_tr #grantor_last_link').length) $('<a style="display: inline;" id="grantor_last_link" href="javascript:remove_grantor(\'grantor_last\')">' +
        '<img src="images\/delete.gif" title="Delete Grantor" alt="Delete Grantor" width="22" height="20" border="0" vertical-align="baseline"/>' +
        '</a>').insertAfter('#grantor_last_tr .valid');

    $('#add_additional_grantor_btn').hide();

    reset_grantor_all('grantor_last');
    if (!skip_previous_validation) {
        validate_grantor_all(new_id);
    } else {
        if ($('input[name=' + new_id + ']').val()) {
            validate_grantor_name(new_id);
        }
        if ($('input[name=' + new_id + '_living]:checked').val()) {
            validate_grantor_living(new_id);
        }
    }

    $('input[name=' + new_id + ']').autocomplete(known_people);
    wlabelize();
}



function remove_grantor(grantor_id, skip_previous_validation) {

    if (grantor_id == 'grantor_last') {
        var grantor_ids = $.map($('input.grantorclass'), function (e) { if (e.name != 'grantor_last') return e.name; });
        var source_id = grantor_ids.pop();

        $("input[name=grantor_last]").val([$("input[name=" + source_id + "]").val()] || "");
        if ($('input[name=' + source_id + '_living]:checked').val())
            $('input[name=grantor_last_living]').val([$('input[name=' + source_id + '_living]:checked').val()]);
        else
            $('input[name=grantor_last_living]').attr("checked", false);

        $('#' + source_id + '_tr_line').remove();
        $('#' + source_id + '_tr').remove();

        if (!skip_previous_validation) {
            validate_grantor_all('grantor_last');
        } else {
            if ($('input[name=grantor_last]').val()) {
                validate_grantor_name('grantor_last');
            }
            if ($('input[name=grantor_last_living]:checked').val()) {
                validate_grantor_living('grantor_last');
            }
        }

    } else {
        $('#' + grantor_id + '_tr_line').remove();
        $('#' + grantor_id + '_tr').remove();
        cross_validate_all_names();
    }

    var grantor_ids = $.map($('input.grantorclass'), function (e) { return e.name; });
    if (grantor_ids.length == 1) {
        $('#grantor_last_link').remove();
        $('#add_additional_grantor_btn').show();
    }

    if ($("select[name=account_type]").val()) {
        validate_account_type();
    }
    wlabelize();
}

function reset_owner_all(oid) {

    $('input[name=' + oid + '_living]').attr('checked', false);
    $('input[name=' + oid + ']').val('');
    $('#' + oid + '_valid').attr('src', 'images/check_grey.gif');
    $('#' + oid + '_valid').attr('title', 'Status');
    $('#' + oid + '_living_valid').attr('src', 'images/check_grey.gif');
    $('#' + oid + '_living_valid').attr('title', 'Status');
    clear_error_message(oid + '_valid');
    clear_error_message(oid + '_living_valid');
}

function add_additional_owner(skip_previous_validation) {

    if ($('#account_type').val() == 'Retirement') {
        show_alert('<p>' + 'An IRA can only have one owner.' + '</p>');
        return;
    }

    if ($('#account_type').val() == 'Single') {
        show_alert('<p>' + 'A single account can only have one owner.  If this account has more than one owner and does not name beneficiaries, select Joint Account in the Ownership Type field in order to add an additional owner.' + '</p>');
        return;
    }

    var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });

    if ($('#account_type').val() == 'Joint' && owner_ids.length >= 10) {
        show_alert('<p>' + 'Joint Ownership Accounts may only have a maximum of 10 owners.' + '</p>');
        return;
    }

    if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && owner_ids.length >= 2) {
        show_alert('<p>' + 'EDIE cannot calculate the insurance coverage of Trust accounts with more than 2 owners. Contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
        return;
    }

    validate_owner_all('owner_last');

    var new_id = 'owner_' + get_sequence();
    $('#owner_last_tr_line').clone().attr('id', new_id + '_tr_line').insertBefore('#owner_last_tr_line');

    var tmp = "What's&nbsp;This?";

    $('<div id="' + new_id + '_tr" class="owner row">' +
        '<div class="col-md-3 edie-labels" valign="top" >Owner</div>' +
        '<div class="col-md-5 benewidth" valign="top" align="left">' +
        '<nobr><input name="' + new_id + '" maxlength="25" size="30" type="text" style="width:180px;border-width: 1px;border-style:solid;" class="ownerclass" title="Owner">' + ' ' +
        '<img src="images/check_grey.gif" tabindex="0" width="22" height="20" alt="Status" border="0" class="status valid" id="' + new_id + '_valid"></nobr><br>' +
        '<div style="width: 180px; text-align: right;">' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp + '" id="' + new_id + '_help">' + tmp + '</span></nobr>' +
        '</div>' +
        '</div>' +
        '<div class="col-md-4" valign="top" align="left">' +
        '<nobr><span tabindex="0">Is the owner living?</span></nobr>' + ' ' +
        '<img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_living_valid"><br>' +
        '<div >' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp + '" id="' + new_id + '_living_help">' + tmp + '</span></nobr>' +
        '</div>' +
        '<label for="' + new_id + '_living_yes"><input name="' + new_id + '_living" type="radio" value="yes" id="' + new_id + '_living_yes" title="Yes"> Yes</label><br>' +
        '<label for="' + new_id + '_living_no"><input name="' + new_id + '_living" type="radio" value="no" id="' + new_id + '_living_no" title="No"> No</label>' +
        '</div>' +
        '</div>').insertBefore('#owner_last_tr_line');

    if ($("input[name=owner_last_living]:checked").val())
        $("input[name=" + new_id + "_living]").val([$("input[name=owner_last_living]:checked").val()]);
    if ($('input[name=owner_last]').val())
        $('input[name=' + new_id + ']').val($('input[name=owner_last]').val());

    $("input[name=owner_last_living]").prop('checked', false);
    $("input[name=" + new_id + "_living]").bind("click", function (e) { validate_owner_living(new_id); });

    $('input[name=' + new_id + ']').bind("blur", function (e) { validate_owner_name(new_id, true); });

    $('input[name=' + new_id + ']').bind("focus", function (e) { clear_error(new_id); });

    $('#' + new_id + '_help').attr('rel', 'messages/owner_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('#' + new_id + '_living_help').attr('rel', 'messages/owner_living_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('&nbsp;<a style="display: inline;" href="javascript:remove_owner(\'' + new_id + '\')">' +
        '<img src="images\/delete.gif" alt="Delete Owner" title="Delete Owner" width="22" height="20" border="0" vertical-align="baseline" />' +
        '</a>').insertAfter('#' + new_id + '_tr .valid');
    if (!$('#owner_last_tr #owner_last_link').length) $('<a style="display: inline;" id="owner_last_link" href="javascript:remove_owner(\'owner_last\')">' + ' ' +
        '<img src="images\/delete.gif" alt="Delete Owner" title="Delete Owner" width="22" height="20" border="0" vertical-align="baseline" />' +
        '</a>').insertAfter('#owner_last_tr .valid');

    reset_owner_all('owner_last');
    if (!skip_previous_validation) {
        validate_owner_all(new_id);
    } else {
        if ($('input[name=' + new_id + ']').val()) {
            validate_owner_name(new_id);
        }
        if ($('input[name=' + new_id + '_living]:checked').val()) {
            validate_owner_living(new_id);
        }
    }

    $('input[name=' + new_id + ']').autocomplete(known_people);
    wlabelize();

    $("input[name=owner_last_living]").val([''])
}

function remove_owner(owner_id, skip_previous_validation) {

    if (owner_id == 'owner_last') {
        var owner_ids = $.map($('input.ownerclass'), function (e) { if (e.name != 'owner_last') return e.name; });
        var source_id = owner_ids.pop();

        $("input[name=owner_last]").val([$("input[name=" + source_id + "]").val()] || "");
        if ($('input[name=' + source_id + '_living]:checked').val())
            $('input[name=owner_last_living]').val([$('input[name=' + source_id + '_living]:checked').val()]);
        else
            $('input[name=owner_last_living]').attr("checked", false);

        $('#' + source_id + '_tr_line').remove();
        $('#' + source_id + '_tr').remove();

        if (!skip_previous_validation) {
            validate_owner_all('owner_last');
        } else {
            if ($('input[name=owner_last]').val()) {
                validate_owner_name('owner_last');
            }
            if ($('input[name=owner_last_living]:checked').val()) {
                validate_owner_living('owner_last');
            }
        }

    } else {
        $('#' + owner_id + '_tr_line').remove();
        $('#' + owner_id + '_tr').remove();
        cross_validate_all_names();
    }


    var owner_ids = $.map($('input.ownerclass'), function (e) { return e.name; });
    if (owner_ids.length == 1) {
        $('#owner_last_link').remove();
    }

    if ($("select[name=account_type]").val()) {
        validate_account_type();
    }
    wlabelize();
}
var alertDisplayed = false;


function add_additional_beneficiary() {
    var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });

    if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && ben_ids.length >= 5) {
        if (!alertDisplayed) {
            //  show_alert("<p>Insurance amount will not increase when there are more than 5 beneficiaries.</p>");
            alertDisplayed = true;
        }
    }

    if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && ben_ids.length >= 20) {
        show_alert('<p>' + 'EDIE cannot calculate the insurance coverage of Formal Revocable Trust or ITF/POD accounts with more than 20 beneficiaries. Contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
        return;
    }
    // if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && ben_ids.length >= 20) {	
    validate_beneficiary_all('beneficiary_last');

    var new_id = 'beneficiary_' + get_sequence();
    $('#beneficiary_last_tr_line').clone().attr('id', new_id + '_tr_line').insertBefore('#beneficiary_last_tr_line');

    var tmp = "Owner's Formal Revocable Trust";
    var tmp2 = "What's&nbsp;This?";
    if ($('#account_type').val() == 'ITF') {
        var tmp3 = '<option value="trust">' + tmp + '</option>';
        $('#beneficiary_last1_living_div').hide();
        $('#beneficiary_last1_charity_div').hide(); 
    }
    else {
        tmp3 = '';
        $('#beneficiary_last_living_div').hide();
        $('#beneficiary_last_charity_div').hide(); 
    }

    //      }

    $('<div  id="' + new_id + '_tr" class="beneficiary row">' +
        '<div class="col-md-3 edie-labels" valign="top" >Beneficiary</div>' +
        '<div class="col-md-5 benewidth" valign="top" align="left" >' +
        '<nobr><input name="' + new_id + '" maxlength="25" size="30" type="text" style="width:180px;border-width: 1px;border-style:solid;"  class="beneficiaryclass" title="Beneficiary">' + ' ' +
        '<img src="images/check_grey.gif" tabindex="0" width="22" height="20" alt="Status" border="0" class="status valid" id="' + new_id + '_valid"></nobr><br>' +
        '<div style="width: 180px; text-align: right;">' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp2 + '" id="' + new_id + '_help">' + tmp2 + '</span></nobr>' +
        '</div>' +

        '<div id="' + new_id + '_type_div">' +
        '<nobr>' +
        '<select style="width:180px;" id="' + new_id + '_type" name="' + new_id + '_type" title="Beneficiary Type">' +
        '<option value="">Beneficiary Type...</option>' +
        '<option value="person">Person</option>' +
        '<option value="charity">Charity/Non-Profit Organization</option>' +
        //'<option value="trust">' + tmp + '</option>' +
        tmp3 +
        '<option value="other">Other</option>' +
        '</select>' + ' ' +
        '<img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_type_valid">' +
        '</nobr>' +
        '</div>' +


        '</div>' +
        '<div class="col-md-4" valign="top" align="left" >' +
        '<div id="' + new_id + '_living_div" style="display: none">' +
        '<nobr>Is the beneficiary living?' +
        '<img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_living_valid">' +
        '</nobr><br>' +
        '<div >' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp2 + '" id="' + new_id + '_living_help">' + tmp2 + '</span></nobr>' +
        '</div>' +
        '<label for="' + new_id + '_living_yes"><input name="' + new_id + '_living" type="radio" value="yes" id="' + new_id + '_living_yes" title="Yes"> Yes</label><br>' +
        '<label for="' + new_id + '_living_no"><input name="' + new_id + '_living" type="radio" value="no" id="' + new_id + '_living_no" title="No"> No</label>' +
        '</div>' +
        '<div id="' + new_id + '_charity_div" style="display: none">' +
        '<nobr><span tabindex="0">Is this charity/non-profit organization</span> </nobr><br/>' +
        '<span tabindex="0">recognized by the IRS?</span><img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_charity_valid"><br/>' +
        '<div >' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp2 + '" id="' + new_id + '_charity_help">' + tmp2 + '</span></nobr>' +
        '</div>' +
        '<label for="' + new_id + '_charity_yes"><input  name="' + new_id + '_charity" type="radio" value="yes" id="' + new_id + '_charity_yes" title="Yes"> Yes</label> <br>' +
        '<label for="' + new_id + '_charity_no"><input name="' + new_id + '_charity" type="radio" value="no" id="' + new_id + '_charity_no" title="No"> No</label>' +
        '</div>' +
        '</div>' +
        '</div>' + ''

        //'<div  class="beneficiary row" id="' + new_id + '_tr2">' +
        //'<div class="col-3" valign="top"></div>' +
        //'<div class="col" valign="top"  align="left">' +
        //// the add beneficiary button was in here
        //'</div>' +
        //'</div>'

    ).insertBefore('#beneficiary_last_tr_line');
    if ($('#account_type').val() == 'ITF') {
        if ($("input[name=beneficiary_last_living]:checked").val())
            $("input[name=" + new_id + "_living]").val([$("input[name=beneficiary_last_living]:checked").val()]);

        if ($("input[name=beneficiary_last_charity]:checked").val())
            $("input[name=" + new_id + "_charity]").val([$("input[name=beneficiary_last_charity]:checked").val()]);
        if ($("select[name=beneficiary_last_type]").val())
            $("select[name=" + new_id + "_type]").val($("select[name=beneficiary_last_type]").val());
        //if($("input[name=beneficiary_last]").val()) 
        ///	$("input[name="+new_id+"]").val([$("input[name=beneficiary_last]").val()]);

    }
    else {
         if ($("input[name=beneficiary_last1_living]:checked").val())
          $("input[name=" + new_id + "_living]").val([$("input[name=beneficiary_last1_living]:checked").val()]);

        if ($("input[name=beneficiary_last1_charity]:checked").val())
            $("input[name=" + new_id + "_charity]").val([$("input[name=beneficiary_last1_charity]:checked").val()]);
        if ($("select[name=beneficiary_last1_type]").val())
            $("select[name=" + new_id + "_type]").val($("select[name=beneficiary_last1_type]").val());
        //if($("input[name=beneficiary_last1]").val()) 
        //	$("input[name="+new_id+"]").val([$("input[name=beneficiary_last1]").val()]);	
     //   if ($("input[name=beneficiary_last1_living]:checked").val() != 'no') {
     //       $("input[name=" + new_id + "_living]").val(['yes']);
     //   }
    //    if ($("input[name=beneficiary_last1_charity]:checked").val() != 'no') {
    //        $("input[name=" + new_id + "_charity]").val(['yes']);
     //   }
    }


    if ($("input[name=beneficiary_last]").val())
        $("input[name=" + new_id + "]").val([$("input[name=beneficiary_last]").val()]);


    $("input[name=" + new_id + "_living]").bind("click", function (e) { validate_beneficiary_living(new_id); });
    $('input[name=' + new_id + ']').bind("blur", function (e) { validate_beneficiary_name(new_id, true); return true; });
    $('input[name=' + new_id + ']').bind("focus", function (e) { clear_error(new_id); });

    $('input[name=' + new_id + '_charity]').bind("click", function (e) { validate_beneficiary_charity(new_id); });
    $('select[name=' + new_id + '_type]').bind("change", function (e) { validate_beneficiary_type(new_id, true); });

    toggle_beneficiary_type_checks(new_id);

    $('#' + new_id + '_help').attr('rel', 'messages/beneficiary_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('#' + new_id + '_living_help').attr('rel', 'messages/beneficiary_living_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        closeText: 'Close',
        sticky: true,
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('#' + new_id + '_charity_help').attr('rel', 'messages/beneficiary_charity_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        closeText: 'Close',
        sticky: true,
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    if ($('#account_type').val() == 'ITF') {
        $('&nbsp;<a style="display: inline;" href="javascript:remove_beneficiary(\'' + new_id + '\')">' +
            '<img src="images\/delete.gif" alt="Delete Beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#' + new_id + '_tr .valid');
        if (!$('#beneficiary_last_tr #beneficiary_last_link').length) $('<a style="display: inline;" id="beneficiary_last_link" href="javascript:remove_beneficiary(\'beneficiary_last\')">' + ' ' + 
            '<img src="images\/delete.gif" alt="Delete %beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#beneficiary_last_tr .valid');

        reset_beneficiary_all('beneficiary_last');
        validate_beneficiary_all(new_id);
        $('input[name=' + new_id + ']').autocomplete(known_people);
        wlabelize();

        $("input[name=beneficiary_last_living]").val(['']);
        $("input[name=beneficiary_last_charity]").val(['']);
        //$("input[name=beneficiary_last]").val(['']);
    }
    else {

        $('&nbsp;<a style="display: inline;" href="javascript:remove_beneficiary(\'' + new_id + '\')">' +
            '<img src="images\/delete.gif" alt="Delete Beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#' + new_id + '_tr .valid');
        if (!$('#beneficiary_last_tr #beneficiary_last_link').length) $('<a style="display: inline;" id="beneficiary_last_link" href="javascript:remove_beneficiary(\'beneficiary_last1\')">' + ' ' +
            '<img src="images\/delete.gif" alt="Delete %beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#beneficiary_last_tr .valid');

        reset_beneficiary_all('beneficiary_last1');
        $("input[name=beneficiary_last]").val(['']);
        validate_beneficiary_all(new_id);
        $('input[name=' + new_id + ']').autocomplete(known_people);
        wlabelize();
       // $("input[name=beneficiary_last1_living]").val(['']);
      //  $("input[name=beneficiary_last1_charity]").val(['']);
        //$("input[name=beneficiary_last1_living]").val(['']);
        //$("input[name=beneficiary_last]").val(['']);
    }

}

//}

function add_additional_beneficiary_irt() {

    var ben_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });

    if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && ben_ids.length >= 5) {
        if (!alertDisplayed) {
            //  show_alert("<p>Insurance amount will not increase when there are more than 5 beneficiaries.</p>");
            alertDisplayed = true;
        }
    }

    if (($('#account_type').val() == 'Trust' || $('#account_type').val() == 'ITF' || $('#account_type').val() == 'IrrevocableTrust') && ben_ids.length >= 20) {
        show_alert('<p>' + 'EDIE cannot calculate the insurance coverage of Formal Revocable Trust or ITF/POD accounts with more than 20 beneficiaries. Contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
        return;
    }

    //validate_beneficiary_all('beneficiary_last');

    var new_id = 'beneficiary_' + get_sequence();
    $('#beneficiary_last_tr_line').clone().attr('id', new_id + '_tr_line').insertBefore('#beneficiary_last_tr_line');

    var tmp = "Owner's Formal Revocable Trust";
    var tmp2 = "What's&nbsp;This?";
    if ($('#account_type').val() == 'ITF') {
        var tmp3 = '<option value="trust">' + tmp + '</option>';
        validate_beneficiary_all('beneficiary_last');
    }
    else {
        var tmp3 = '';
        validate_beneficiary_all('beneficiary_last1');
    }

    $('<div  id="' + new_id + '_tr" class="beneficiary row">' +
        '<div class="col-md-3 edie-labels" valign="top" >Beneficiary</div>' + 
        '<div class="col-md-5" valign="top" align="left" >' +
        '<nobr><input name="' + new_id + '" maxlength="25" size="30" type="text" style="width:180px"  class="beneficiaryclass" title="Beneficiary">' +
        '<img src="images/check_grey.gif" tabindex="0" width="22" height="20" alt="Status" border="0" class="status valid" id="' + new_id + '_valid"></nobr><br>' +
        '<div style="width: 180px; text-align: right;">' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp2 + '" id="' + new_id + '_help">' + tmp2 + '</span></nobr>' +
        '</div>' +

        '<div id="' + new_id + '_type_div">' +
        '<nobr>' +
        '<select style="width:180px;" id="' + new_id + '_type" name="' + new_id + '_type" title="Beneficiary Type">' +
        '<option value="">Beneficiary Type...</option>' +
        '<option value="person">Person</option>' +
        '<option value="charity">Charity/Non-profit Org</option>' +
        //'<option value="trust">' + tmp + '</option>' +
        tmp3 +
        '<option value="other">Other</option>' +
        '</select>' +
        '<img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_type_valid">' +
        '</nobr>' +
        '</div>' +

        '</div>' +
        '<div class="col-md-4" valign="top" align="left" >' +
        '<div id="' + new_id + '_living_div" style="display: none">' +
        '<nobr>Is the beneficiary living?' +
        '<img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_living_valid">' +
        '</nobr><br>' +
        '<div>' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp2 + '" id="' + new_id + '_living_help">' + tmp2 + '</span></nobr>' +
        '</div>' +
        '<label for="' + new_id + '_living_yes"><input name="' + new_id + '_living" type="radio" value="yes" id="' + new_id + '_living_yes" title="Yes"> Yes</label><br>' +
        '<label for="' + new_id + '_living_no"><input name="' + new_id + '_living" type="radio" value="no" id="' + new_id + '_living_no" title="No"> No</label>' +
        '</div>' +
        '<div id="' + new_id + '_charity_div" style="display: none">' +
        '<nobr><span tabindex="0">Is this charity/non-profit org.</span> </nobr><br/>' +
        '<span tabindex="0">recognized by the IRS?</span><img src="images/check_grey.gif" tabindex="0" class="status" role="button" width="22" height="20" alt="Status" border="0" id="' + new_id + '_charity_valid"><br/>' +
        '<div style="width: 144px; text-align: right;">' +
        '<nobr><span class="help" role="link" tabindex="0" title="' + tmp2 + '" id="' + new_id + '_charity_help">' + tmp2 + '</span></nobr>' +
        '</div>' +
        '<label for="' + new_id + '_charity_yes"><input  name="' + new_id + '_charity" type="radio" value="yes" id="' + new_id + '_charity_yes" title="Yes"> Yes</label> <br>' +
        '<label for="' + new_id + '_charity_no"><input name="' + new_id + '_charity" type="radio" value="no" id="' + new_id + '_charity_no" title="No"> No</label>' +
        '</div>' +
        '</div>' +
        '</div>' + ''

        //'<div  class="beneficiary row" id="' + new_id + '_tr2">' +
        //'<div class="col-3" valign="top"></div>' +
        //'<div class="col" valign="top"  align="left">' +
        //// the add beneficiary button was in here
        //'</div>' +
        //'</div>'

    ).insertBefore('#beneficiary_last_tr_line');

    if ($('#account_type').val() == 'ITF') {
        if ($("input[name=beneficiary_last_living]:checked").val())
            $("input[name=" + new_id + "_living]").val([$("input[name=beneficiary_last_living]:checked").val()]);

        if ($("input[name=beneficiary_last_charity]:checked").val())
            $("input[name=" + new_id + "_charity]").val([$("input[name=beneficiary_last_charity]:checked").val()]);
        if ($("select[name=beneficiary_last_type]").val())
            $("select[name=" + new_id + "_type]").val($("select[name=beneficiary_last_type]").val());
        if ($("input[name=beneficiary_last]").val())
            $("input[name=" + new_id + "]").val([$("input[name=beneficiary_last]").val()]);

    }
    else {
        if ($("input[name=beneficiary_last1_living]:checked").val())
            $("input[name=" + new_id + "_living]").val([$("input[name=beneficiary_last1_living]:checked").val()]);

        if ($("input[name=beneficiary_last1_charity]:checked").val())
            $("input[name=" + new_id + "_charity]").val([$("input[name=beneficiary_last1_charity]:checked").val()]);
        if ($("select[name=beneficiary_last1_type]").val())
            $("select[name=" + new_id + "_type]").val($("select[name=beneficiary_last1_type]").val());
        if ($("input[name=beneficiary_last1]").val())
            $("input[name=" + new_id + "]").val([$("input[name=beneficiary_last1]").val()]);

    }

    $("input[name=" + new_id + "_living]").bind("click", function (e) { validate_beneficiary_living(new_id); });
    $('input[name=' + new_id + ']').bind("blur", function (e) { validate_beneficiary_name(new_id, true); return true; });
    $('input[name=' + new_id + ']').bind("focus", function (e) { clear_error(new_id); });

    $('input[name=' + new_id + '_charity]').bind("click", function (e) { validate_beneficiary_charity(new_id); });
    $('select[name=' + new_id + '_type]').bind("change", function (e) { validate_beneficiary_type(new_id, true); });

    toggle_beneficiary_type_checks(new_id);

    $('#' + new_id + '_help').attr('rel', 'messages/beneficiary_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        sticky: true,
        closeText: 'Close',
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('#' + new_id + '_living_help').attr('rel', 'messages/beneficiary_living_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        closeText: 'Close',
        sticky: true,
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });

    $('#' + new_id + '_charity_help').attr('rel', 'messages/beneficiary_charity_help.txt').cluetip({
        arrows: true,
        dropShadow: false,
        cluetipClass: 'jtipgreen',
        closeText: 'Close',
        sticky: true,
        onShow: function () {

            let a = document.getElementsByClassName("cluetip-jtipred");
            [...a].forEach(x => x.classList.remove("cluetip-jtipred"));
            let b = document.getElementsByClassName("clue-left-jtipred");
            [...b].forEach(x => x.classList.remove("clue-left-jtipred"));
            let c = document.getElementsByClassName("clue-right-jtipred");
            [...c].forEach(x => x.classList.remove("clue-right-jtipred"));
            let d = document.getElementsByClassName("clue-bottom-jtipred");
            [...d].forEach(x => x.classList.remove("clue-bottom-jtipred"));

            var handler = function (e) {
                if (!(e.target.id || '').startsWith("cluetip")) {
                    hideCluetip();;
                }
            }

            var hideCluetip = function () {
                $('#cluetip').hide();
                $(document).unbind("click", handler);
            }

            $(document).bind("click", handler);

            //$(document).click(function (e) {
            //    if (!(e.target.id || '').startsWith("cluetip")) {
            //        $('#cluetip').hide();
            //    }
            //});
        }
    });


    if ($('#account_type').val() == 'ITF') {
        $('&nbsp;<a style="display: inline;" href="javascript:remove_beneficiary(\'' + new_id + '\')">' +
            '<img src="images\/delete.gif" alt="Delete Beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#' + new_id + '_tr .valid');
        if (!$('#beneficiary_last_tr #beneficiary_last_link').length) $('<a style="display: inline;" id="beneficiary_last_link" href="javascript:remove_beneficiary(\'beneficiary_last\')">' +
            '<img src="images\/delete.gif" alt="Delete %beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#beneficiary_last_tr .valid');

        reset_beneficiary_all('beneficiary_last');
        validate_beneficiary_all(new_id);
        $('input[name=' + new_id + ']').autocomplete(known_people);
        wlabelize();

        $("input[name=beneficiary_last_living]").val(['']);
    }
    else {

        $('&nbsp;<a style="display: inline;" href="javascript:remove_beneficiary(\'' + new_id + '\')">' +
            '<img src="images\/delete.gif" alt="Delete Beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#' + new_id + '_tr .valid');
        if (!$('#beneficiary_last_tr #beneficiary_last_link').length) $('<a style="display: inline;" id="beneficiary_last_link" href="javascript:remove_beneficiary(\'beneficiary_last1\')">' +
            '<img src="images\/delete.gif" alt="Delete %beneficiary" title="Delete Beneficiary" width="22" height="20" border="0" vertical-align="baseline"/>' +
            '</a>').insertAfter('#beneficiary_last_tr .valid');

        reset_beneficiary_all('beneficiary_last1');
        validate_beneficiary_all(new_id);
        $('input[name=' + new_id + ']').autocomplete(known_people);
        wlabelize();

        $("input[name=beneficiary_last1_living]").val(['']);

    }

}

function toggle_beneficiary_type_checks(bid, manualchange) {
    $('#' + bid + '_living_div').hide();
    $('#' + bid + '_charity_div').hide();

    var value = $('select[name=' + bid + '_type]').val();
    if (value == 'person') {
        if (manualchange) {
            $('input[name=' + bid + '_living]').attr('checked', false);
            $('#' + bid + '_living_valid').attr('src', 'images/check_grey.gif');
            $('#' + bid + '_living_valid').attr('title', 'Status');
            clear_error_message(bid + '_living_valid');
        }
        $('#' + bid + '_living_div').show();
    }
    if (value == 'charity') {
        if (manualchange) {
            $('input[name=' + bid + '_charity]').attr('checked', false);
            $('#' + bid + '_charity_valid').attr('src', 'images/check_grey.gif');
            $('#' + bid + '_charity_valid').attr('title', 'Status');
            clear_error_message(bid + '_charity_valid');
        }
        $('#' + bid + '_charity_div').show();
    }


}

function reset_beneficiary_all(bid) {

    $('input[name=' + bid + '_living]').attr('checked', false);
    $('input[name=' + bid + '_charity]').attr('checked', false);
    $('select[name=' + bid + '_type]').val('');
    $('#' + bid + '_living_div').hide();
    $('#' + bid + '_charity_div').hide();

    $('input[name=' + bid + ']').val('');
    $('#' + bid + '_valid').attr('src', 'images/check_grey.gif');
    $('#' + bid + '_valid').attr('title', 'Status');
    clear_error_message(bid + '_valid');
    $('#' + bid + '_living_valid').attr('src', 'images/check_grey.gif');
    $('#' + bid + '_living_valid').attr('title', 'Status');
    clear_error_message(bid + '_living_valid');
    $('#' + bid + '_charity_valid').attr('src', 'images/check_grey.gif');
    $('#' + bid + '_charity_valid').attr('title', 'Status');
    clear_error_message(bid + '_charity_valid');
    $('#' + bid + '_type_valid').attr('src', 'images/check_grey.gif');
    $('#' + bid + '_type_valid').attr('title', 'Status');
    clear_error_message(bid + '_type_valid');
}

function remove_beneficiary(beneficiary_id) {
    if (beneficiary_id == 'beneficiary_last') {
        var beneficiary_ids = $.map($('input.beneficiaryclass'), function (e) { if (e.name != 'beneficiary_last') return e.name; });
        var source_id = beneficiary_ids.pop();

        $("input[name=beneficiary_last]").val([$("input[name=" + source_id + "]").val()] || "");
        if ($('input[name=' + source_id + '_living]:checked').val())
            $('input[name=beneficiary_last_living]').val([$('input[name=' + source_id + '_living]:checked').val()]);
        else
            $('input[name=beneficiary_last_living]').attr("checked", false);

        if ($('input[name=' + source_id + '_charity]:checked').val())
            $('input[name=beneficiary_last_charity]').val([$('input[name=' + source_id + '_charity]:checked').val()]);
        else
            $('input[name=beneficiary_last_charity]').attr("checked", false);


        $('input[name=beneficiary_last]').val($('input[name=' + source_id + ']').val() || "");

        if ($("select[name=" + source_id + "_type]").val())
            $('select[name=beneficiary_last_type]').val($("select[name=" + source_id + "_type]").val());

        toggle_beneficiary_type_checks('beneficiary_last');

        $('#' + source_id + '_tr_line').remove();
        $('#' + source_id + '_tr').remove();
        $('#' + source_id + '_tr2').remove();

        validate_beneficiary_all('beneficiary_last');

    }
    else {

        if (beneficiary_id == 'beneficiary_last1') {
            var beneficiary_ids = $.map($('input.beneficiaryclass'), function (e) { if (e.name != 'beneficiary_last') return e.name; });
            var source_id = beneficiary_ids.pop();

            $("input[name=beneficiary_last]").val([$("input[name=" + source_id + "]").val()] || "");
            if ($('input[name=' + source_id + '_living]:checked').val())
                $('input[name=beneficiary_last1_living]').val([$('input[name=' + source_id + '_living]:checked').val()]);
            else
                $('input[name=beneficiary_last1_living]').attr("checked", false);

            if ($('input[name=' + source_id + '_charity]:checked').val())
                $('input[name=beneficiary_last1_charity]').val([$('input[name=' + source_id + '_charity]:checked').val()]);
            else
                $('input[name=beneficiary_last1_charity]').attr("checked", false);


            $('input[name=beneficiary_last]').val($('input[name=' + source_id + ']').val() || "");

            if ($("select[name=" + source_id + "_type]").val())
                $('select[name=beneficiary_last1_type]').val($("select[name=" + source_id + "_type]").val());

            toggle_beneficiary_type_checks('beneficiary_last');

            $('#' + source_id + '_tr_line').remove();
            $('#' + source_id + '_tr').remove();
            $('#' + source_id + '_tr2').remove();

            validate_beneficiary_all('beneficiary_last');


        } else {
            $('#' + beneficiary_id + '_tr_line').remove();
            $('#' + beneficiary_id + '_tr').remove();
            $('#' + beneficiary_id + '_tr2').remove();

            cross_validate_all_names();

        }

        if ($('#account_type').val() == 'IrrevocableTrust') {
            $('#beneficiary_last_living_div').hide();
            $('#beneficiary_last_charity_div').hide();

        } else {
            $('#beneficiary_last1_living_div').hide();
            $('#beneficiary_last1_charity_div').hide();
        }

    }


    var beneficiary_ids = $.map($('input.beneficiaryclass'), function (e) { return e.name; });
    if (beneficiary_ids.length == 1) {
        $('#beneficiary_last_link').remove();
    }
    wlabelize();

}

function show_owners() {
    $('.owner').show();
    wlabelize();
}

function hide_owners() {
    $('.owner').hide();
    wlabelize();
}

function show_beneficiaries() {
    $('.beneficiary').show();
    wlabelize();
}

function hide_beneficiaries() {
    $('.beneficiary').hide();
    wlabelize();
}

function show_beneficiaries_irt() {
    $('.beneficiary_irt').show();
    wlabelize();
}

function hide_beneficiaries_irt() {
    $('.beneficiary_irt').hide();
    wlabelize();
}
function hide_trustees() {
    $('.trustee').hide();
    wlabelize();
}

function show_trustees() {
    $('.trustee').show();
    wlabelize();
}

function show_trustein() {
    $('.trustein').show();
    wlabelize();
}

function hide_trustein() {
    $('.trustein').hide();
    wlabelize();
}

function hide_grantors() {
    $('.grantor').hide();
    wlabelize();
}

function show_grantors() {
    $('.grantor').show();
    wlabelize();
}

function setHeaderFooterLinksWarnings() {
    var container, links, buttons, divs, index;

    container = document.getElementById('div_fdic_standard_header');

    if (container) {
        links = container.getElementsByTagName('a');

        if (links) {
            for (index = 0; index < links.length; ++index) {
                var href = $(links[index]).attr("href") || "";

                if (href != "") {
                    $(links[index]).bind('click', function () {
                        if (should_warn) {
                            show_warning($(this).attr("href"));
                            return false;
                        }
                        else {
                            return true;
                        }
                    });
                }
            }
        }

        buttons = container.getElementsByTagName('button');

        if (buttons) {
            for (index = 0; index < buttons.length; ++index) {
                if ($(buttons[index])) {
                    var events = $._data(buttons[index], 'events');

                    if (events) {
                        var click_handler = events.click || null;

                        if (click_handler != null) {
                            var cloned_ele = $(buttons[index]).clone(true);

                            $(buttons[index]).unbind('click');
                            $(buttons[index]).data("header-index", index);

                            headerbuttons.push({ id: index, ele: cloned_ele });

                            $(buttons[index]).bind('click', function () {
                                var headerIndex = $(this).data('header-index');
                                var h = headerbuttons.find(p => p.id == headerIndex);

                                if (should_warn) {
                                    show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', function () { h.ele.click(); });
                                    return false;
                                }
                                else {
                                    return h.ele.click();
                                }
                            });
                        }
                    }
                }
            }
        }

        lis = container.getElementsByClassName('usa-nav__primary-item');

        if (lis) {
            for (index = 0; index < lis.length; ++index) {
                if ($(lis[index]) && (lis[index].type || '') != 'button') {
                    var events = $._data(lis[index], 'events');

                    if (events) {
                        var click_handler = events.click || null;

                        if (click_handler != null) {
                            var cloned_ele = $(lis[index]).clone(true);

                            $(lis[index]).unbind('click');
                            $(lis[index]).data("header-index", index);

                            headerlis.push({ id: index, ele: cloned_ele });

                            $(lis[index]).bind('click', function () {
                                var headerIndex = $(this).data('header-index');
                                var h = headerlis.find(p => p.id == headerIndex);

                                if (should_warn) {
                                    show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', function () { h.ele.click(); });
                                    return false;
                                }
                                else {
                                    return h.ele.click();
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    container = document.getElementById('div_fdic_standard_footer');

    if (container) {
        links = container.getElementsByTagName('a');

        if (links) {
            for (index = 0; index < links.length; ++index) {
                var href = $(links[index]).attr("href") || "";

                if (href != "") {
                    $(links[index]).bind('click', function () {
                        if (should_warn) {
                            show_warning($(this).attr("href"));
                            return false;
                        }
                        else {
                            return true;
                        }
                    });
                }
            }
        }

        buttons = container.getElementsByTagName('button');

        if (buttons) {
            for (index = 0; index < buttons.length; ++index) {
                if ($(buttons[index])) {
                    var events = $._data(buttons[index], 'events');

                    if (events) {
                        var click_handler = events.click || null;

                        if (click_handler != null) {
                            var cloned_ele = $(buttons[index]).clone(true);

                            $(buttons[index]).unbind('click');
                            $(buttons[index]).data("footer-index", index);

                            footerbuttons.push({ id: index, ele: cloned_ele });

                            $(buttons[index]).bind('click', function () {
                                var headerIndex = $(this).data('footer-index');
                                var h = footerbuttons.find(p => p.id == headerIndex);

                                if (should_warn) {
                                    show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', function () { h.ele.click(); });
                                    return false;
                                }
                                else {
                                    return h.ele.click();
                                }
                            });
                        }
                    }
                }
            }
        }

        lis = container.getElementsByClassName('usa-nav__primary-item');

        if (lis) {
            for (index = 0; index < lis.length; ++index) {
                if ($(lis[index]) && (lis[index].type || '') != 'button') {
                    var events = $._data(lis[index], 'events');

                    if (events) {
                        var click_handler = events.click || null;

                        if (click_handler != null) {
                            var cloned_ele = $(lis[index]).clone(true);

                            $(lis[index]).unbind('click');
                            $(lis[index]).data("footer-index", index);

                            footerlis.push({ id: index, ele: cloned_ele });

                            $(lis[index]).bind('click', function () {
                                var headerIndex = $(this).data('footer-index');
                                var h = footerlis.find(p => p.id == headerIndex);

                                if (should_warn) {
                                    show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', function () { h.ele.click(); });
                                    return false;
                                }
                                else {
                                    return h.ele.click();
                                }
                            });
                        }
                    }
                }
            }
        }
    }
}


function getInputsHash(id) {
    var container, inputs, index;
    var hash = '{';
    var counter = 1;

    container = document.getElementById('inputs_div');
    inputs = container.getElementsByTagName('input');

    for (index = 0; index < inputs.length; ++index) {
        if (inputs[index].type == "text") {
            hash += counter.toString() + ':' + (inputs[index].value || '') + ',';
            counter += 1;
        }
        if (inputs[index].type == "radio") {
            hash += counter.toString() + ':' + ((inputs[index].checked || false) == true ? '1' : '0') + ',';
            counter += 1;
        }
    }

    inputs = container.getElementsByTagName('select');

    for (index = 0; index < inputs.length; ++index) {
        if (inputs[index].type == "select-one") {
            hash += counter.toString() + ':' + (inputs[index].value || '') + ',';
            counter += 1;
        }
    }

    hash += '}';

    return { id: id, hash: hash };
}

//this function is used to control the edit and delete functions of the added accounts
function doAction(id) {
    //var isDirty = hasData();

    if (doing_edit) { //|| (should_warn && isDirty)
        //var current_input_hash = getInputsHash(id);

        //if ((current_input_hash.id || -1) != (edit_hash.id || -1) &&
        //    (current_input_hash.hash || '') != (edit_hash.hash || '')) {
        show_alert('<p>' + 'You have not yet saved your edits. Please save your edits to continue.' + '</p>');
        return false;
        //}
    }

    return true;
}

function isEditDirty() {
    //var current_edit_hash = getInputsHash(-1);

    //if (doing_edit && (current_edit_hash.hash || '') != (edit_hash.hash || '')) {
    return true;
    //}

    //return false;
}

function clearFields(fieldid) {
    var container, inputs, index;

    container = document.getElementById(fieldid);
    inputs = container.getElementsByTagName('input');

    for (index = 0; index < inputs.length; ++index) {
        if (inputs[index].type == "text") {
            inputs[index].value = '';
            clear_error(inputs[index].id);
            clear_error(inputs[index].name);
            clear_error_message(inputs[index].id + '_definition_valid');
        }
        if (inputs[index].type == "radio") {
            inputs[index].checked = false;
            clear_error(inputs[index].id);
            clear_error(inputs[index].name);
            clear_error_message(inputs[index].id + '_definition_valid');
        }
    }

    inputs = container.getElementsByTagName('select');

    for (index = 0; index < inputs.length; ++index) {
        if (inputs[index].type == "select-one") {
            resetSelectElement(inputs[index]);
            clear_error(inputs[index].id);
            clear_error(inputs[index].name);
            clear_error_message(inputs[index].id + '_definition_valid');
        }
    }
}

function resetSelectElement(selectElement) {
    var options = selectElement.options;

    // Look for a default selected option
    for (var i = 0, iLen = options.length; i < iLen; i++) {

        if (options[i].defaultSelected) {
            selectElement.selectedIndex = i;
            return;
        }
    }

    // If no option is the default, select first or none as appropriate
    selectElement.selectedIndex = 0; // or -1 for no option selected
}

function cancelAccountTypeSelectionChange() {
    if (selected_account_type == "personal") {
        $('#business_personal_personal').attr('checked', 'checked');
    }
    else if (selected_account_type == "business") {
        $('#business_personal_business').attr('checked', 'checked');
    }
    else if (selected_account_type == "public") {
        $('#business_personal_public').attr('checked', 'checked');
    }
}

function show_personal() {

    var isDirty = hasData();
    var showPersonal = function () {
        should_warn = true;

        if (!doing_edit) {
            populate_calculator(null, null, null, null, true);

            $('#business_personal_personal').attr('checked', 'checked');

            clearFields('personal_div');
        }

        if ($('input[name=institution]').length && $('input[name=institution]').val()) swap_institution();

        $('#personal_div').show();
        $('#button_div').show();
        $('#business_div').hide();
        $('#public_div').hide();
        clear_error_message();
        wlabelize();
		validate_institution();
        if (!doing_edit) {
            selected_account_type = 'personal';
        }

        changing_proprietorship = false;
    }

    if (isDirty && should_warn && !changing_proprietorship) {
        show_confirm("If you change the account type, you’ll lose all the information you’ve entered.", showPersonal, cancelAccountTypeSelectionChange);
    }
    else {
        showPersonal();
    }

}

function show_business() {

    var isDirty = hasData();
    var showBusiness = function () {
        should_warn = true;

        if (!doing_edit) {
            populate_calculator(null, null, null, null, true);

            $('#business_personal_business').attr('checked', 'checked');

            clearFields('business_div');
        }

        if ($('input[name=institution]').length && $('input[name=institution]').val()) swap_institution();

        $('#business_div').show();
        $('#button_div').show();
        $('#personal_div').hide();
        $('#public_div').hide();
        clear_error_message();
        wlabelize();
		validate_institution();
        if (!doing_edit) {
            selected_account_type = 'business';
        }

        changing_proprietorship = false;
    }

    if (isDirty && should_warn && !changing_proprietorship) {
        show_confirm("If you change the account type, you’ll lose all the information you’ve entered.", showBusiness, cancelAccountTypeSelectionChange);
    }
    else {
        showBusiness();
    }

}

function show_public() {

    var isDirty = hasData();
    var showPublic = function () {
        should_warn = true;

        if (!doing_edit) {
            populate_calculator(null, null, null, null, true);

            $('#business_personal_public').attr('checked', 'checked');

            clearFields('public_div');
        }

        if ($('input[name=institution]').length && $('input[name=institution]').val()) swap_institution();

        $('#public_div').show();
        $('#button_div').show();
        $('#personal_div').hide();
        $('#business_div').hide();
        clear_error_message();
        wlabelize();
		validate_institution();
        if (!doing_edit) {
            selected_account_type = 'public';
        }

        changing_proprietorship = false;
    }

    if (isDirty && should_warn && !changing_proprietorship) {
        show_confirm("If you change the account type, you’ll lose all the information you’ve entered.", showPublic, cancelAccountTypeSelectionChange);
    }
    else {
        showPublic();
    }

}

function show_calculator() {
    var gfx = whitelabel ? 'img_' : 'hdg_calculator_';

    $('#calculator_banner').attr('src', 'images/' + gfx + 'downarrow.gif');
    $('#calculator_div').show();
    clear_error_message();
    wlabelize();

}

function hide_calculator() {
    var gfx = whitelabel ? 'img_' : 'hdg_calculator_';

    $('#calculator_banner').attr('src', 'images/' + gfx + 'sidearrow.gif');
    $('#calculator_div').hide();
    clear_error_message();
    wlabelize();

}

function toggle_calculator() {
    if ($('#calculator_div').css('display') == 'none') {
        show_calculator();
    } else {
        hide_calculator()
    }
}

function show_report() {
    var gfx = whitelabel ? 'img_' : 'hdg_report_';

    $('#report_banner').attr('src', 'images/' + gfx + 'downarrow.gif');

    $('#report_div').show();
    clear_error_message();
    wlabelize();

}


function hide_report() {
    var gfx = whitelabel ? 'img_' : 'hdg_report_';

    $('#report_banner').attr('src', 'images/' + gfx + 'sidearrow.gif');

    $('#report_div').hide();
    clear_error_message();
    wlabelize();

}

function toggle_report() {
    if ($('#report_div').css('display') == 'none') {
        show_report();
    } else {
        hide_report();
    }
}

function show_actions() {
    var gfx = whitelabel ? 'img_' : 'hdg_actions_';

    $('#actions_banner').attr('src', 'images/' + gfx + 'downarrow.gif');
    $('#actions_div').show();
    clear_error_message();
    wlabelize();

}

function hide_actions() {
    var gfx = whitelabel ? 'img_' : 'hdg_actions_';

    $('#actions_banner').attr('src', 'images/' + gfx + 'sidearrow.gif');
    $('#actions_div').hide();
    clear_error_message();
    wlabelize();

}
function toggle_actions() {
    if ($('#actions_div').css('display') == 'none') {
        show_actions();
    } else {
        hide_actions();
    }
}

function scroll_up() {
    if (whitelabel) {
        post_msg({ 'action': 'scrollup' });
    } else {
        window.scrollTo(-50, 0);
    }
}

function do_scroll_up() {
    if (doing_edit && isEditDirty()) {
        //var callback = function () { scroll_up(); };

        //if (!show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', callback)) {
        //    return;
        //}
        show_alert('<p>' + 'You have not yet saved your edits. Please save your edits before adding a new account.' + '</p>');
        return;
    }
    else {
        scroll_up();
    }
}

/////////////////////////////////////////////////////////////////////////////////////////
// UTILITY FUNCTIONS
/////////////////////////////////////////////////////////////////////////////////////////

function get_date() {

    var m_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
    var today = new Date();
    var month = today.getMonth();
    var date = today.getDate();
    var year = today.getFullYear();

    return m_names[month] + ' ' + date + ', ' + year;
}

function get_owner_name_counts() {
    var owner_names = $.map($('.ownerclass'), function (e) { return e.value.toLowerCase() });
    var seen = new Array();
    for (var i = 0; i < owner_names.length; i++) {
        var name = owner_names[i];
        if (!name) continue;

        if (!seen[name])
            seen[name] = 1;
        else
            seen[name] += 1;
    }

    return seen;
}

function get_trustee_name_counts() {
    var trustee_names = $.map($('.trusteeclass'), function (e) { return e.value.toLowerCase() });
    var seen = new Array();
    for (var i = 0; i < trustee_names.length; i++) {
        var name = trustee_names[i];
        if (!name) continue;

        if (!seen[name])
            seen[name] = 1;
        else
            seen[name] += 1;
    }

    return seen;
}

function get_grantor_name_counts() {
    var grantor_names = $.map($('.grantorclass'), function (e) { return e.value.toLowerCase() });
    var seen = new Array();
    for (var i = 0; i < grantor_names.length; i++) {
        var name = grantor_names[i];
        if (!name) continue;

        if (!seen[name])
            seen[name] = 1;
        else
            seen[name] += 1;
    }

    return seen;
}

function get_beneficiary_name_counts() {
    var ben_names = $.map($('.beneficiaryclass'), function (e) { return e.value.toLowerCase() });
    var seen = new Array();
    for (var i = 0; i < ben_names.length; i++) {
        var name = ben_names[i];
        if (!name) continue;

        if (!seen[name])
            seen[name] = 1;
        else
            seen[name] += 1;
    }

    return seen;
}

function get_sequence() {
    sequence = sequence + 1;
    return sequence;
}

function get_account_type() {
    return $('input[name=business_personal]:checked').val();
}

function find_account(id) {
    for (var i = 0; i < institutions.length; i++) {
        var institution = institutions[i];
        for (var j = 0; j < institution.personal_accounts.length; j++) {
            var account = institution.personal_accounts[j];
            if (account.id == id) {
                return account;
            }
        }
        for (var j = 0; j < institution.business_accounts.length; j++) {
            var account = institution.business_accounts[j];
            if (account.id == id) {
                return account;
            }
        }
        for (var j = 0; j < institution.public_accounts.length; j++) {
            var account = institution.public_accounts[j];
            if (account.id == id) {
                return account;
            }
        }
    }

    return null;
}

function cap_firsts(val) {

    new_val = '';
    val = val.split(' ');
    for (var c = 0; c < val.length; c++) {
        new_val += val[c].substring(0, 1).toUpperCase() +
            val[c].substring(1, val[c].length) + ' ';
    }

    return trim_spaces(new_val);
}


function money_to_float(val) {

    if (!val) { val = "0"; }
    val = val.replace(/[^0-9\.]/g, "");
    return parseFloat(val);
}

function currency_format(number, remove_cents) {

    number = "" + number;
    if (!number) number = "0";

    var dec = number.indexOf(".");
    var end = ((dec > -1) ? "" + number.substring(dec, number.length) : ".00");

    number = ((dec > -1) ? number.substring(0, dec) : number);

    var temp1 = "";
    var temp2 = "";

    if (end.length == 2) end += "0";
    if (end.length == 1) end += "00";
    if (end.length > 2) end = end.substring(0, 3);

    if (end == "") end += ".00";

    var count = 0;

    for (var k = number.length - 1; k >= 0; k--) {
        var one_char = number.charAt(k);
        if (count == 3) {
            temp1 += ",";
            temp1 += one_char;
            count = 1;
            continue;
        } else {
            temp1 += one_char;
            count++;
        }
    }

    for (var k = temp1.length - 1; k >= 0; k--) {
        var one_char = temp1.charAt(k);
        temp2 += one_char;
    }

    if (!remove_cents) temp2 = "$" + temp2 + end;
    else temp2 = "$" + temp2;

    return temp2;
}

function trim_spaces(obj) {

    if (typeof (obj) == "string") {
        obj = obj.replace(/^\s+/, '');
        obj = obj.replace(/\s+$/, '');
        return obj;
    } else {
        var value = obj.val();
        if (value) {
            value = value.replace(/^\s+/, '');
            value = value.replace(/\s+$/, '');
            obj.val(value);
        }
    }
}

function display_unequal_coverage_alert() {
    show_alert('<p>' + 'Sorry, EDIE cannot calculate the insurance coverage of revocable trust accounts with more than 5 beneficiaries who have unequal interests. Contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
}

function display_public_accounts_alert() {
    show_alert('<p>' + 'In order for the EDIE report to be accurate, all deposit accounts held by the same public unit at the same bank must be entered into EDIE.  Enter the remaining accounts to continue.  Otherwise, contact the FDIC at <a style="text-decoration: underline; display: inline; color: #007bff;" href="tel:18772753342">1-877-275-3342</a> for assistance.' + '</p>');
}

//R5.7.3: if  beneficiary name is trust or and, show alert and set focus on the bene textbox
/*
function show_alert(mesg) {
	$('#error_validation_content').empty();
	$('#validation_buttons_area').empty();
	
	$('#error_validation_content').html(mesg);
	$('<input type="button" id="validation_ok" value="&nbsp;&nbsp;Ok&nbsp;&nbsp;"/>').appendTo('#validation_buttons_area');
	$('#validation_ok').bind('click', function() { tb_remove(); });
	
	$('#validation_trigger').click();
}*/
function show_alert(mesg, callback) {

    var proceedfunc = function () { tb_remove(); do_init(); };

    if (callback != null) proceedfunc = function () { callback(); tb_remove(); };

    $('#error_validation_content').empty();
    $('#validation_buttons_area').empty();

    $('#error_validation_content').attr("align", "center");
    $('#error_validation_content').attr("tabindex", "0");
    //$('#error_validation_content p').css("text-align", "center");

    $('#error_validation_content').html(mesg);
    $('<input type="button" id="validation_ok" value="&nbsp;&nbsp;Ok&nbsp;&nbsp;"/>').appendTo('#validation_buttons_area');
    $('#validation_ok').bind('click', proceedfunc);

    $('#validation_trigger').click();

    //$('#TB_window').css("display", "table !important");
    //$('#TB_window').css("width", "430px !important");
    $('#TB_window').addClass("edie-message");

    //$('#TB_ajaxContent').css("height", "170px !important");
    //$('#TB_ajaxContent').css("display", "table-cell !important");
    //$('#TB_ajaxContent').css("vertical-align", "middle !important");
    //$('#TB_ajaxContent').css("width", "430px !important");
    $('#TB_ajaxContent').addClass("edie-message-content");

    //$('#error_validation_content').css("width", "100%");
    //$('#error_validation_content').css("display", "inline-block");

    $('#error_validation_content').focus();

}


function show_init_alert(mesg) {

    $('#error_validation_content').empty();
    $('#validation_buttons_area').empty();

    $('#error_validation_content').attr("align", "center");
    $('#error_validation_content').attr("tabindex", "0");
    //$('#error_validation_content p').css("text-align", "center");

    $('#error_validation_content').html(mesg);
    $('<input type="button" id="validation_ok" value="&nbsp;&nbsp;Ok&nbsp;&nbsp;"/>').appendTo('#validation_buttons_area');
    $('#validation_ok').bind('click', function () { tb_remove(); do_init(); });

    $('#validation_trigger').click();

    //$('#TB_window').css("display", "table !important");
    //$('#TB_window').css("width", "430px !important");
    $('#TB_window').addClass("edie-message");

    //$('#TB_ajaxContent').css("height", "170px !important");
    //$('#TB_ajaxContent').css("display", "table-cell !important");
    //$('#TB_ajaxContent').css("vertical-align", "middle !important");
    //$('#TB_ajaxContent').css("width", "430px !important");
    $('#TB_ajaxContent').addClass("edie-message-content");

    //$('#error_validation_content').css("width", "100%");
    //$('#error_validation_content').css("display", "inline-block");

    $('#error_validation_content').focus();

}

function show_confirm(mesg, callback, callback_cancel) {

    var proceedfunc = function () { callback(); tb_remove(); };
    var cancelfunc = function () { tb_remove(); };

    if (callback_cancel != null) cancelfunc = function () { callback_cancel(); tb_remove(); };

    $('#confirm_content').empty();
    $('#confirm_buttons_area').empty();

    $('#confirm_content').attr("align", "center");
    $('#confirm_content').attr("tabindex", "0");

    $('#confirm_content').html(mesg);
    $('<input id="confirm_button" type="button" value="&nbsp;&nbsp;Proceed&nbsp;&nbsp;" /><input type="button" value="&nbsp;&nbsp;Cancel&nbsp;&nbsp;" id="cancel_button" />').appendTo('#confirm_buttons_area');

    $('#confirm_button').bind('click', proceedfunc);
    $('#cancel_button').bind('click', cancelfunc);
    $('#confirm_trigger').click();

    //$('#TB_window').css("display", "table !important");
    //$('#TB_window').css("width", "430px !important");
    $('#TB_window').addClass("edie-message");

    //$('#TB_ajaxContent').css("height", "170px !important");
    //$('#TB_ajaxContent').css("display", "table-cell !important");
    //$('#TB_ajaxContent').css("vertical-align", "middle !important");
    //$('#TB_ajaxContent').css("width", "430px !important");
    $('#TB_ajaxContent').addClass("edie-message-content");

    //$('#confirm_content').css("width", "100%");
    //$('#confirm_content').css("display", "inline-block");

    $('#confirm_content').focus();

}

function show_yesno(mesg, callback_yes, callback_no) {

    $('#confirm_content').empty();
    $('#confirm_buttons_area').empty();

    $('#confirm_content').attr("align", "center");
    $('#confirm_content').attr("tabindex", "0");

    $('#confirm_content').html(mesg);
    $('<input id="yes_button" type="button" value="&nbsp;&nbsp;Yes&nbsp;&nbsp;" /><input type="button" value="&nbsp;&nbsp;No&nbsp;&nbsp;" id="no_button" />').appendTo('#confirm_buttons_area');

    $('#yes_button').bind('click', callback_yes);
    $('#no_button').bind('click', callback_no);
    $('#confirm_trigger').click();

    //$('#TB_window').css("display", "table !important");
    //$('#TB_window').css("width", "430px !important");
    $('#TB_window').addClass("edie-message");

    //$('#TB_ajaxContent').css("height", "170px !important");
    //$('#TB_ajaxContent').css("display", "table-cell !important");
    //$('#TB_ajaxContent').css("vertical-align", "middle !important");
    //$('#TB_ajaxContent').css("width", "430px !important");
    $('#TB_ajaxContent').addClass("edie-message-content");

    //$('#confirm_content').css("width", "100%");
    //$('#confirm_content').css("display", "inline-block");

    $('#confirm_content').focus();

}

function contact_trigger(lang) {
    tb_remove();
    setTimeout(function () {
        if (lang == 'esp') {
            show_warning('https://ask.fdic.gov/FDICDepositInsuranceForm?lang=esp_ES');
        } else {
            show_warning('https://ask.fdic.gov/fdicinformationandsupportcenter/s/');
        }
    }, 500);
}

function swap_institution() {
    var institution_name = htmlEntities($('#institution').val());
    institution_name = institution_name.replace(/\(Cert/, '<br>(Cert');

    $('#institution').replaceWith($('<span id="institution" style="font-weight: bold;" tabIndex="0">' + institution_name + '</span>'));
    $('#institution_valid').attr('src', 'images/check_green.gif');
    $('#institution_valid').attr('title', 'Valid Status');
    $('#institution_note').html("This bank name will be set for the duration of your session or until you click 'CREATE A NEW REPORT'.");
    $('#bankfinddiv').hide();
    $('#institution_help').hide();
}

function swap_institution_back() {
    if (whitelabel) { return; }
    $('#institution').replaceWith($('<input id="institution" title="Bank Name" maxlength="75" size="30" type="text" style="width: 393px;" name="institution">'));
    $('#institution').bind('blur', function (e) { validate_institution(); });
    $('#institution_valid').attr('src', 'images/check_grey.gif');
    $('#institution_valid').attr('title', 'Status');
    $('#institution_note').html("Because EDIE only calculates coverage for one bank at a time, the bank name you enter will be set for the duration of your session or until you click 'CREATE A NEW REPORT'.");
    clear_error_message('institution_valid');
    $('#bankfinddiv').show();
    $('#institution_help').show();



}

function show_warning(target) {

    if (is_local && /^http/.test(target)) {
        var opener = window.open(target);
        return;
    }

    if (should_warn) {
        show_confirm('If you move away from EDIE you\'ll lose all of the information you\'ve entered.', function () {
            // window.top.location.replace(target);
            window.location.href = target;
        });
    } else {
        //window.top.location.replace(target);
        window.location.href = target;
    }
    return;

}

//R 5.8.0 New Window for tutorial from calculation page.
function show_tutorial() {

    var tutorial_window = window.open('tutorial_window.html', '', 'status=1,toolbar=0,location=0,menubar=0,directories=0,resizable=1,scrollbars=1,width=840,height=620,top=25,left=25');
    //tutorial_window.moveTo(25,25);
    return;

}

function check_popups() {

    if (($.browser && $.browser.msie) && $.browser.version.substr(0, 1) == "6") {
        var win = window.open('printgeneric.html', 'popwin', 'status=0,toolbar=0,location=0,menubar=1,directories=0,resizable=1,scrollbars=1,height=50,width=50');
        if (win) {
            win.close();
        } else {
            show_init_alert("It appears you are using Internet Explorer 6 with the popup-blocker enabled. Unfortunately, EDIE will not function correctly with this setting. Please disable it from the browser's Tools menu before using EDIE.");
            return false;
        }
    }

    return true;

}

function roundit(value) {

    //var string = value+"";
    //if(string.match(/\.99/)) {
    return Math.round(value * 100) / 100;
    //}
    //return value;
}

function go_newrules() {

    tb_remove();
    var newwin = window.open('http://www.fdic.gov/news/news/press/2008/pr08100.html', 'ruleswin');

}

function do_init() {
    // comment this out if you don't want to pop this up by default

    //$('#rulechange_trigger').click();
    //tb_show('Changes','changes.html?height=120&width=400');
}

function set_insurance_limit(limit) {
    INSURANCE_LIMIT = limit;
}

/////////////////////////////////////////////////////////////////////////////////////////
// MAIN
/////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(function () {
    $('#javascript_div').show();
    $('#printme').hide();
    check_local();
    if (!is_local) get_json_url();
    set_help_messages_all();
    populate_calculator();
    render_actions();
    render_report();
    set_caller('calculator');
    check_whitelabel();

    if (check_popups())
        do_init();

    $('.help').bind('keyup', showHelp)
    $('.status').bind('keyup', showHelp)
});

/////////////////////////////////////////////////////////////////////////////////////////
// AUTOREFRESH (this was move here because the strings.txt replacements were not working on different js files works only on edie.js not sure why)
/////////////////////////////////////////////////////////////////////////////////////////

// Refresh Rate is how often you want to refresh the page 
// bassed off the user inactivity. 
var refresh_rate = 900; //<-- In seconds, change to your needs
var last_user_action = 0;

// Reset the Timer on users last action
function resetSessionActivity() {
    last_user_action = 0;
}

// The code that checks if the window needs to reload
function refreshCheck() {
    if (last_user_action >= refresh_rate && document.readyState == "complete") {
        var proceedCallback = function () { resetSessionActivity(); };
        var cancelCallback = function () { window.location.reload(); };

        show_confirm('<p>Your user session has expired, To continue on the same session select "Proceed" or to start a new session select "Cancel".</p>', proceedCallback, cancelCallback);
    }

}

function init_session() {
    // Count Down that executes ever second
    setInterval(function () {
        last_user_action++;
        refreshCheck();
    }, 1000);

    window.addEventListener("click", resetSessionActivity, false);
    window.addEventListener("mousemove", resetSessionActivity, false);
    window.addEventListener("keypress", resetSessionActivity, false);
    window.addEventListener("scroll", resetSessionActivity, false);
    document.addEventListener("touchMove", resetSessionActivity, false);
    document.addEventListener("touchEnd", resetSessionActivity, false);
}

// Uncomment below to enabled the session timeout
// init_session();

/////////////////////////////////////////////////////////////////////////////////////////
// AUTOREFRESH end...
/////////////////////////////////////////////////////////////////////////////////////////

function showHelp(e) {
    e.preventDefault();

    if (e.keyCode === 13) {
        var obj = $(this);

        obj.click();
    }
}