/*
* Infor Date Field Control.
*
*/
(function ($) {
	$.fn.inforDateField = function (options) {
		var settings = {
			buttonText: Globalize.localize('SelectDate'),
			dateFormat: Globalize.culture().calendar.patterns.d,	//use current short date format unless its set by the control prefs.
			openOnEnter: true,	//If the user hits enter the drop down will open when in the field.
			showQuickDates: false, //Changes the Today button to a Menu Button with additional input options
			quickDateOptions: [
				{label: Globalize.localize('Today'), offset: 0, period: 'T' },
				{label: Globalize.localize('OneWeekAgo'), offset: -7, period: 'D' },
				{label: Globalize.localize('OneMonthAgo'), offset: -1, period: 'M' },
				{label: Globalize.localize('SixMonthsAgo'), offset: -6, period: 'M' },
				{label: Globalize.localize('LastYear'), offset: -1, period: 'Y' },
				{label: Globalize.localize('NextWeek'), offset: 7, period: 'D' },
				{label: Globalize.localize('NextMonth'), offset: 1, period: 'M' },
				{label: Globalize.localize('NextYear'), offset: 1, period: 'Y' }
			],		//Overridable list of options for the quick dates menu
			isHijri : (Globalize.culture().calendar.name == "UmAlQura" || Globalize.culture().calendar.name == "Hijri" || Globalize.culture().calendar.name == "UmAlQura_TransliteratedEnglish"),
			showTimeInput: false, //Adds a simple input field for time (You should use a format that supports time as well).
			timeFormat: Globalize.culture().calendar.patterns.t, //Separated Globalize time format to use in the date picker time picker - should also be in the dateFormat
			validateInput: true,
			position: null,
			mask: null, //input mask
			showUTCTime: false,	//if true any selected days will be shown and adjusted to UTC time
			showTimezone: false	//show a time zone selector and related options kick in for time zones.
		};

		return this.each(function () {
			var o = $.extend({}, settings, options), //Extend the options if any provided
			$dateField = $(this);

			if ($dateField.data("initialized")) {
				return;
			}

			$dateField.inforTriggerField();
			$dateField.datepicker(o);

			if (o.mask) {
				$dateField.mask(o.mask);
			}

			if (o.validateInput) {
				$dateField.data("lastValue", $dateField.val()).focus(function () {
					var field = $(this);
					field.data("lastValue", field.val());
				}).off("blur.validate").on("blur.validate", function () {
					var field = $(this),
						parsedDate = Globalize.parseDate(field.val());

					if (parsedDate === null && o.dateFormat) {
						parsedDate = Globalize.parseDate(field.val(), o.dateFormat);
					}

					if (parsedDate === null && field.val() !== "") {
						field.val(field.data("lastValue"));
					}
				});
			}
		});
	};
} (jQuery));

/*
* jQuery UI Datepicker 1.8.13 - Completely Modified from this version.
*
* Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*
* http://docs.jquery.com/UI/Datepicker
*
* Depends:
*	jquery.ui.core.js
*/
(function ($) {

	var PROP_NAME = 'datepicker';
	var dpuuid = new Date().getTime();

	/* Date picker manager.
	Use the singleton instance of this class, $.datepicker, to interact with the date picker.
	Settings for (groups of) date pickers are maintained in an instance object,
	allowing multiple different settings on the same page. */

	function Datepicker() {
		this.debug = false; // Change this to true to start debugging
		this._curInst = null; // The current instance in use
		this._keyEvent = false; // If the last event was a key event
		this._disabledInputs = []; // List of date picker inputs that have been disabled
		this._datepickerShowing = false; // True if the popup picker is showing , false if not
		this._mainDivId = 'inforDatePicker-div'; // The ID of the main datepicker division
		this._inlineClass = 'inforDatePicker-inline'; // The name of the inline marker class
		this._appendClass = 'inforDatePicker-append'; // The name of the append marker class
		this._triggerClass = 'inforDatePickerButton'; // The name of the trigger marker class
		this._dialogClass = 'inforDatePicker-dialog'; // The name of the dialog marker class
		this._disableClass = 'inforDatePicker-disabled'; // The name of the disabled covering marker class
		this._unselectableClass = 'inforDatePicker-unselectable'; // The name of the unselectable cell marker class
		this._currentClass = 'inforDatePicker-current-day'; // The name of the current day marker class
		this._dayOverClass = 'inforDatePicker-days-cell-over'; // The name of the day hover marker class
		this._defaults = { // Global defaults for all the date picker instances
			culture: '', // use jQuery.culture by default
			showOn: 'button', // 'focus' for popup on focus,
			// 'button' for trigger button, or 'both' for either
			showAnim: 'fadeIn', // Name of jQuery animation for popup
			showOptions: {}, // Options for enhanced animations
			defaultDate: null, // Used when field is blank: actual date,
			// +/-number for offset from today, null for today
			appendText: '', // Display text following the input box, e.g. showing the format
			buttonText: '...', // Text for trigger button
			buttonImage: '', // URL for trigger button image
			buttonImageOnly: true, // True if the image appears alone, false if it appears on a button
			hideIfNoPrevNext: false, // True to hide next/previous month links
			// if not applicable, false to just disable them
			navigationAsDateFormat: false, // True if date formatting applied to prev/today/next links
			gotoCurrent: false, // True if today link goes back to current selection instead
			showOtherMonths: true, // True to show dates in other months, false to leave blank
			selectOtherMonths: true, // True to allow selection of dates in other months, false for unselectable
			showWeek: false, // True to show week of the year, false to not show it
			calculateWeek: this.iso8601Week, // How to calculate the week of the year,
			// takes a Date and returns the number of the week for it
			shortYearCutoff: '+10', // Short year values < this are in the current century,
			minDate: null, // The earliest selectable date, or null for no limit
			maxDate: null, // The latest selectable date, or null for no limit
			duration: 'fast', // Duration of display/closure
			beforeShowDay: null, // Function that takes a date and returns an array with
			// [0] = true if selectable, false if not, [1] = custom CSS class name(s) or '',
			// [2] = cell title (optional), e.g. $.datepicker.noWeekends
			beforeShow: null, // Function that takes an input field and
			// returns a set of custom settings for the date picker
			onSelect: null, // Define a callback function when a date is selected
			onChangeMonthYear: null, // Define a callback function when the month or year is changed
			onClose: null, // Define a callback function when the datepicker is closed
			numberOfMonths: 1, // Number of months to show at a time
			showCurrentAtPos: 0, // The position in multipe months at which to show the current month (starting at 0)
			stepMonths: 1, // Number of months to step back/forward
			stepBigMonths: 12, // Number of months to step back/forward for the big links
			altField: '', // Selector for an alternate field to store selected dates into
			altFormat: '', // The date format to use for the alternate field
			altField2: '', // Selector for an alternate field to store selected dates into
			altFormat2: '', // The date format to use for the alternate field
			constrainInput: true, // The input is constrained by the current date format
			showButtonPanel: false, // True to show button panel, false to not show it
			openOnEnter: true //If the user hits enter the drop down will open when in the field.
		};
		this.dpDiv = $('<div id="' + this._mainDivId + '" class="inforDatePicker inforDatePicker-widget inforDatePicker-widget-content"></div>');
	}

	$.extend(Datepicker.prototype, {
		/* Class name added to elements to indicate already configured with a date picker. */
		markerClassName: 'hasDatepicker',

		_widgetDatepicker: function () {
			return this.dpDiv;
		},

		/* Override the default settings for all instances of the date picker.
		@param  settings  object - the new settings to use as defaults (anonymous object)
		@return the manager object */
		setDefaults: function (settings) {
			extendRemove(this._defaults, settings || {});
			return this;
		},

		/* Attach the date picker to a jQuery selection.
		@param  target    element - the target input field or division or span
		@param  settings  object - the new settings to use for this date picker instance (anonymous) */
		_attachDatepicker: function (target, settings) {
			// check for settings on the control itself - in namespace 'date:'
			var inlineSettings = null;
			for (var attrName in this._defaults) {
				var attrValue = target.getAttribute('date:' + attrName);
				if (attrValue) {
					inlineSettings = inlineSettings || {};
					try {
						inlineSettings[attrName] = eval(attrValue);
					} catch (err) {
						inlineSettings[attrName] = attrValue;
					}
				}
			}
			var nodeName = target.nodeName.toLowerCase();
			var inline = (nodeName === 'div' || nodeName === 'span');
			if (!target.id) {
				this.uuid += 1;
				target.id = 'dp' + this.uuid;
			}
			var inst = this._newInst($(target), inline);
			inst.settings = $.extend({}, settings || {}, inlineSettings || {});
			if (nodeName === 'input') {
				this._connectDatepicker(target, inst);
			} else if (inline) {
				this._inlineDatepicker(target, inst);
				}
	},

		/* Create a new instance object. */
		_newInst: function (target, inline) {
			var id = target[0].id; //.replace(/([^A-Za-z0-9_])/g, '\\\\$1'); // escape jQuery meta chars
			return {id: id, input: target, // associated target
				selectedDay: 0, selectedMonth: 0, selectedYear: 0, // current selection
				drawMonth: 0, drawYear: 0, // month being drawn
				inline: inline, // is datepicker inline or not
				dpDiv: (!inline ? this.dpDiv : // presentation div
				$('<div class="' + this._inlineClass + ' ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all"></div>'))
			};
		},

		/* Attach the date picker to an input field. */
		_connectDatepicker: function (target, inst) {
			var input = $(target),
				self = this;

			inst.append = $([]);
			inst.trigger = $([]);

			if (input.data(this.markerClassName)) {
				return;
			}

			this._attachments(input, inst);

			input.data(this.markerClassName, true).keydown(this._doKeyDown).keypress(this._doKeyPress).keyup(this._doKeyUp).
				bind("setData.datepicker", function (event, key, value) {
					inst.settings[key] = value;
				}).bind("getData.datepicker", function (event, key) {
					return this._get(inst, key);
				});

			var altFields = $(this._get(inst, 'altField')).add(this._get(inst, 'altField2'));
			altFields.keydown(function (e) {
				e.target = input[0];
				self._doKeyDown(e, inst);
			}).keypress(function (e) {
				e.target = input[0];
				self._doKeyPress(e, inst);
			}).keyup(function (e) {
				e.target = input[0];
				self._doKeyUp(e, inst);
			});
			$.data(target, PROP_NAME, inst);
		},

		/* Make attachments based on settings. */
		_attachments: function (input, inst) {
			var appendText = this._get(inst, 'appendText');
			var isRTL = this._get(inst, 'isRTL');
			if (inst.append) {
				inst.append.remove();
			}

			if (appendText) {
				inst.append = $('<span class="' + this._appendClass + '">' + appendText + '</span>');
				input[isRTL ? 'before' : 'after'](inst.append);
			}
			input.unbind('focus', this._showDatepicker);
			if (inst.trigger) {
				inst.trigger.remove();
			}
			var showOn = this._get(inst, 'showOn');
			if (showOn == 'focus' || showOn == 'both') // pop-up date picker when in the marked field
				input.focus(this._showDatepicker);
			if (showOn == 'button' || showOn == 'both') { // pop-up date picker when button clicked
				var buttonText = this._get(inst, 'buttonText');
				var buttonImage = this._get(inst, 'buttonImage');
				inst.trigger = $(inst.input).closest(".inforTriggerField").find(".inforTriggerButton");
				inst.trigger.addClass(this._triggerClass).attr("tabIndex", -1).
					attr({ src: buttonImage, alt: buttonText, title: buttonText });

				inst.trigger.inforToolTip();
				input.parent().after(inst.trigger.parent());	//move the td
				input.focus(function () {
					if ($.datepicker._datepickerShowing && $.datepicker._lastInput != input[0]) {
						$.datepicker._hideDatepicker($.datepicker._lastInput, true);
					}
				});

				inst.trigger.click(function () {
					if ($.datepicker._datepickerShowing && $.datepicker._lastInput == input[0])
						$.datepicker._hideDatepicker();
					else
						$.datepicker._showDatepicker(input[0]);
					return false;
				});
			}
		},

		/* Attach an inline date picker to a div. Might be needed for standalone calendar. */
		_inlineDatepicker: function (target, inst) {
				var divSpan = $(target);
			if (divSpan.data(this.markerClassName))
				return;
			divSpan.data(this.markerClassName, true).append(inst.dpDiv).
			bind("setData.datepicker", function (event, key, value) {
				inst.settings[key] = value;
			}).bind("getData.datepicker", function (event, key) {
				return this._get(inst, key);
			});
			$.data(target, PROP_NAME, inst);
			this._setDate(inst, this._getDefaultDate(inst), true);
			this._updateDatepicker(inst);
			this._updateAlternate(inst);
		},

		/* Is the first field in a jQuery collection disabled as a datepicker?
		@param  target    element - the target input field or division or span
		@return boolean - true if disabled, false if enabled */
		_isDisabledDatepicker: function (target) {
			if (!target) {
				return false;

			}
			for (var i = 0; i < this._disabledInputs.length; i++) {
				if (this._disabledInputs[i] == target)
					return true;

			}
			return false;
		},

		/* Retrieve the instance data for the target control.
		@param  target  element - the target input field or division or span
		@return  object - the associated instance data
		@throws  error if a jQuery problem getting data */
		_getInst: function (target) {
			try {
				return $.data(target, PROP_NAME);
			}
			catch (err) {
				throw 'Missing instance data for this datepicker';

			}
		},

		/* Redraw the date picker attached to an input field or division.
		@param  target  element - the target input field or division or span */
		_refreshDatepicker: function (target) {
			var inst = this._getInst(target);
			if (inst) {
				this._updateDatepicker(inst);
			}
		},

		/* Set the dates for a jQuery selection.
		@param  target   element - the target input field or division or span
		@param  date     Date - the new date */
		_setDateDatepicker: function (target, date) {
			var inst = this._getInst(target);
			if (inst) {
				this._setDate(inst, date);
				this._updateDatepicker(inst);
				this._updateAlternate(inst);
			}
		},

		/* Get the date(s) for the first entry in a jQuery selection.
		@param  target     element - the target input field or division or span
		@param  noDefault  boolean - true if no default date is to be used
		@return Date - the current date */
		_getDateDatepicker: function (target, noDefault) {
			var inst = this._getInst(target);
			if (inst && !inst.inline)
				this._setDateFromField(inst, noDefault);
			return (inst ? this._getDate(inst) : null);
		},

		/* Handle keystrokes. */
		_doKeyDown: function (event, inst) {
			if (!inst ) {
				inst = $.datepicker._getInst(event.target);
			}
			var handled = true;
			var isRTL = inst.dpDiv.is('.inforDatePicker-rtl');
			inst._keyEvent = true;
			if ($.datepicker._datepickerShowing)
				switch (event.keyCode) {

				case 9:
					$.datepicker._hideDatepicker();
					handled = false;
					break; // hide on tab out
				case 13:
					if (inst.input.closest("div").parent().hasClass("slick-headerrow-column"))	//let enter run the filter in the grid
						return;

					var sel = $('td.inforDatePicker-current-day' , inst.dpDiv);

					if (sel[0])
						$.datepicker._selectDay(event.target, inst.selectedMonth, inst.selectedYear, sel[0]);
					else
						$.datepicker._hideDatepicker();
					return false; // don't submit the form
				case 27:
					$.datepicker._hideDatepicker();
					break; // hide on escape
				case 33: $.datepicker._adjustDate(event.target, (event.ctrlKey ?
							-$.datepicker._get(inst, 'stepBigMonths') :
							-$.datepicker._get(inst, 'stepMonths')), 'M');
					break; // previous month/year on page up/+ ctrl
				case 34: $.datepicker._adjustDate(event.target, (event.ctrlKey ?
							+$.datepicker._get(inst, 'stepBigMonths') :
							+$.datepicker._get(inst, 'stepMonths')), 'M');
					break; // next month/year on page down/+ ctrl
				case 35: if (event.ctrlKey || event.metaKey) $.datepicker._clearDate(event.target);
					handled = event.ctrlKey || event.metaKey;
					break; // clear on ctrl or command +end
				case 36: if (event.ctrlKey || event.metaKey) $.datepicker._gotoToday(event.target);
					handled = event.ctrlKey || event.metaKey;
					break; // current on ctrl or command +home
				case 37:
					$.datepicker._adjustDate(event.target, (isRTL ? +1 : -1), 'D');
					break; // -1 day on left
				case 38:
					$.datepicker._adjustDate(event.target, -7, 'D');

					break; // -1 week on up
				case 39:
					$.datepicker._adjustDate(event.target, (isRTL ? -1 : +1), 'D');
					break; // +1 day on right
			case 40:
					$.datepicker._adjustDate(event.target, +7, 'D');
					handled = event.ctrlKey || event.metaKey;
					break; // +1 week on down
				default: handled = false;

			}
			else if (event.keyCode == $.ui.keyCode.ENTER || event.keyCode == $.ui.keyCode.DOWN ) // display the date picker on enter
			{
				if (inst.input.closest("div").parent().hasClass("slick-headerrow-column")) {	//let enter run the filter in the grid
					return;
				}
				if (inst.input.attr("readonly") || inst.input.attr("disabled")){
					return;
				}

				if (inst.settings.openOnEnter) {
					$.datepicker._showDatepicker(event.target);
				} else {
					handled = false;
				}
			}
			else {
				handled = false;
			}
			if (handled) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		_quickDates: function (target, button){
			//open a menu on the menu button with some options for date input
			var menu = $("#inforQuickDatesMenu"),
				$button = $(button),
				inst = this._getInst($(target)[0]),
				options = this._get(inst, "quickDateOptions");

			//Add item if not there
			if (menu.length === 0) {
				$('<ul id="inforQuickDatesMenu" class="inforContextMenu"></ul>').appendTo("body");
				menu = $("#inforQuickDatesMenu");
			}

			//Clear the menu
			menu.empty();

			//loop the configurable options and add them
			$.map( options, function (opt) {
				//add the option and maybe a generic click handler function...
				var li = $("<li></li>"),
					a = $("<a></a>").attr("href","#").text(opt.label).attr("onclick",
						'DP_jQuery_' + dpuuid + '.datepicker._quickDateSelect(\'#' +inst.id + '\',' + opt.offset + ',\'' + opt.period + '\')');

				li.append(a);
				menu.append(li);
			});

			//show the menu...
			$button.inforContextMenu({
					menu: 'inforQuickDatesMenu',
					invokeMethod: 'immediate',
					position: {
						my: (Globalize.culture().isRTL ? "right top" : "left top"),
						at: (Globalize.culture().isRTL ? "right bottom" : "left bottom"),
						of: $button,
						offset: (Globalize.culture().isRTL ? "0 -2" : "0 -2")
					}
			});
		},
		_quickDateSelect: function (id, offset, period) {
			var target = $(id);
				inst = this._getInst(target[0]);

			if (period=="T") {
				this._selectToday(target);
				return;
			}

			this._selectToday(target);
			this._adjustDate(id, offset, period);
			this._selectDate(id);
		},
		selectToday: function (target){
			this._selectToday(target);
		},
		_selectToday: function (target){
			var todayDate = new Date(),
				target = $(target),
				inst = this._getInst(target[0]);

			inst.selectedHours = inst.drawHours = inst.currentHours = todayDate.getHours();
			inst.selectedMinutes = inst.drawMinutes= inst.currentMinutes = todayDate.getMinutes();
			inst.selectedSeconds = inst.drawSeconds = inst.selectedSeconds =  todayDate.getSeconds();

			if (this._get(inst,'showUTCTime')) {
				todayDate = new Date(todayDate.getUTCFullYear(), todayDate.getUTCMonth(), todayDate.getUTCDate(), todayDate.getUTCHours(), todayDate.getUTCMinutes(), todayDate.getUTCSeconds(), todayDate.getUTCMilliseconds());
			}

			if (this._get(inst, 'isHijri')) {
				todayDate = Globalize.culture().calendar.convert.fromGregorian(todayDate);
				inst.selectedDay = todayDate[2];
				inst.selectedMonth = todayDate[1];
				inst.selectedYear = todayDate[0];
				$.datepicker._selectDate(target, $.datepicker._formatDate(inst,
					todayDate[2], todayDate[1], todayDate[0]), inst.selectedHours, inst.selectedMinutes,inst.selectedSeconds);
				return;
			}

			inst.selectedDay = inst.drawDay  = inst.currentDay  = todayDate.getDate();
			inst.selectedMonth = inst.drawMonth = inst.currentMonth = todayDate.getMonth();
			inst.selectedYear = inst.drawYear = inst.currentYear = todayDate.getFullYear();

			$.datepicker._selectDate(target, $.datepicker._formatDate(inst,
					todayDate.getDate(), todayDate.getMonth(), todayDate.getFullYear(), inst.selectedHours, inst.selectedMinutes,inst.selectedSeconds));
		},
		/* Filter entered characters - based on date format. */
		_doKeyPress: function (event, inst) {
			if (!inst) {
				inst = $.datepicker._getInst(event.target);
			}
			if ($.datepicker._get(inst, 'constrainInput')) {

				var chars = $.datepicker._possibleChars(inst.settings.culture || $.datepicker._defaults.culture, $.datepicker._get(inst, 'dateFormat'));
				var chr = String.fromCharCode(event.charCode == undefined ? event.keyCode : event.charCode);

				//insert current date with a T
				if (chr.toLowerCase()=="t") {
					$.datepicker._selectToday(event.target);
					event.preventDefault();
				}
				if (chr.toLowerCase()=="-") {
					$.datepicker._quickDateSelect("#" + inst.id, -1, "D");
					event.preventDefault();
				}
				if (chr.toLowerCase()=="+") {
					$.datepicker._quickDateSelect("#" + inst.id, 1, "D");
					event.preventDefault();
				}

				return event.ctrlKey || (chr < ' ' || !chars || chars.indexOf(chr) > -1);
			}
		},

		/* Synchronise manual entry and field/alternate field. */
		_doKeyUp: function (event, inst) {
			if (!inst) {
				inst = $.datepicker._getInst(event.target);
			}

			if (inst.input.val() != inst.lastVal) {
				try {
				var date = $.datepicker.parseDate(
								(inst.input ? inst.input.val() : null),
								$.datepicker._get(inst, 'dateFormat'),
								inst.settings.culture)

				if (date) { // only if valid
						$.datepicker._setDateFromField(inst);
					//$.datepicker._updateAlternate(inst);
						$.datepicker._updateDatepicker(inst);
					}
				}
				catch (e) {
				}
			}
			return true;
		},

		/* Pop-up the date picker for a given input field.
		@param  input  element - the input field attached to the date picker or
		event - if triggered by focus */
		_showDatepicker: function (input) {
			$(".inforMenu").hide();
			input = input.target || input;
			if (input.nodeName.toLowerCase() != 'input') // find from button/image trigger
				input = $('input', input.parentNode)[0];
			if ($.datepicker._isDisabledDatepicker(input) || $.datepicker._lastInput == input) // already here
				return;
			var inst = $.datepicker._getInst(input);

			if ($.datepicker._curInst && $.datepicker._curInst != inst) {
				$.datepicker._curInst.dpDiv.stop(true, true);
			}
			var beforeShow = $.datepicker._get(inst, 'beforeShow');
			extendRemove(inst.settings, (beforeShow ? beforeShow.apply(input, [input, inst]) : {}));
			inst.lastVal = null;
			$.datepicker._lastInput = input;
			$.datepicker._setDateFromField(inst);

			//position beside.
			if (!$.datepicker._pos) {
				var pos = $(input).offset();
				$.datepicker._pos = [pos.left, pos.top-1];//$.datepicker._findPos(input);
				$.datepicker._pos[0] += input.offsetWidth+14; // add the width + trigger width
			}

			//position otherside
			if (Globalize.culture().isRTL) {
				var pos = $(input).offset();

				inst.dpDiv.hide().css("opacity", 1);
				$.datepicker._pos = [pos.left, pos.top-1];//$.datepicker._findPos(input);
				$.datepicker._pos[0] -= ($(input).width() + 26); // add the width + trigger width
			}

			var isFixed = false;
			$(input).parents().each(function () {
				isFixed |= $(this).css('position') == 'fixed';
				return !isFixed;
			});
			var leftVal = $.datepicker._pos[0] + (Globalize.culture().isRTL ? 2 : -2);
			var offset = {left: leftVal, top: $.datepicker._pos[1] };

			$.datepicker._pos = null;

			//to avoid flashes on Firefox
			inst.dpDiv.empty();
			inst.dpDiv.hide();

			// determine sizing offscreen
			inst.dpDiv.css({ position: 'absolute', display: 'block', top: '-1000px' });
			//fire before show.
			beforeShow = $.datepicker._get(inst, 'beforeShow');
			extendRemove(inst.settings, (beforeShow ? beforeShow.apply(input, [input, inst]) : {}));

			$.datepicker._updateDatepicker(inst);
			// fix width for dynamic number of date pickers
			// and adjust position before showing
			offset = $.datepicker._checkOffset(inst, offset, isFixed);
			inst.dpDiv.css({ position: (isFixed ? 'fixed' : 'absolute'), display: 'none',
				left: offset.left + 'px', top: offset.top + 'px'
			});
			if (!inst.inline) {
				var showAnim = $.datepicker._get(inst, 'showAnim');
				var duration = $.datepicker._get(inst, 'duration');
				var postProcess = function () {
					var cover = inst.dpDiv.find('iframe.inforDatePicker-cover'); // IE6- only
					if (!!cover.length) {
						var borders = $.datepicker._getBorders(inst.dpDiv);

						cover.css({ left: -borders[0], top: -borders[1],
							width: inst.dpDiv.outerWidth(), height: inst.dpDiv.outerHeight()
						});
					}
				};
				inst.dpDiv.zIndex($(input).zIndex() + 3000);

				$.datepicker._datepickerShowing = true;
				if ($.effects && $.effects[showAnim]) {
					inst.dpDiv.show(showAnim, $.datepicker._get(inst, 'showOptions'), duration, postProcess);
				} else {
					inst.dpDiv[showAnim || 'show']((showAnim ? duration : null), postProcess);
				}

				if (!showAnim || !duration) {
					postProcess();
				}

				if (inst.input.is(':visible') && !inst.input.is(':disabled')) {
					inst.input.focus();
				}
				$.datepicker._curInst = inst;
			}

			var position = $.datepicker._get(inst, 'position');
			if (position) { // position as defined
				position.of = $(input);
				$.datepicker.dpDiv.position(position);
			}

			//hide any tooltips
			setTimeout(function () {
				$("#inforTooltip").hide();
			},200);
		},
		_updateYearPanel: function (table,inst, centerYear) {
			//Add the formatted years in - 5 up and down from the current selected year
			var todayDate = new Date(),
				todayYear = (todayDate).getFullYear(),
				minDate = this._getMinMaxDate(inst, 'min'),
				maxDate = this._getMinMaxDate(inst, 'max');

			//corrects draw year for Hijri (Arabic) calendar
			todayYear = parseInt(Globalize.format(todayDate,'yyyy'), 10);

			var selectedYear = inst.selectedYear;
			//corrects year for Hijri (Arabic) calendar
			selectedYear = parseInt(Globalize.format(new Date(inst.selectedYear,inst.selectedMonth ,inst.selectedDay),'yyyy'), 10);

			//the click callback
			function selectYear() {
				table.find(".datePickerYear-selected").removeClass("datePickerYear-selected");
				$(this).addClass("datePickerYear-selected");
			}

			table.find(".datePickerYear-selected").removeClass("datePickerYear-selected");
			table.find(".datePickerMonthYearYear-current").removeClass("datePickerMonthYearYear-current");

			var i=0;
			centerYear = centerYear-4;
			table.find(".datePickerMonthYearGrid tr").each(function(index) {
				if (index <= 3) {
					return;
				}
				var row = $(this);
				row.find("td").each(function(index2) {
					var col = $(this).find("div");
					col.html(centerYear+i).click(selectYear);

					if (centerYear+i === todayYear) {
						col.addClass("datePickerMonthYearYear-current");
					}

					if (centerYear+i === selectedYear) {
						col.addClass("datePickerYear-selected");
					}
					i++;
				});
			});
		},
		_showDateMonthPanel: function (inst) {
			var self = this;
			inst.dpDiv.empty();
			inst.dpDiv.hide();
			//find the years and months and build the html
			var monthNamesShort  = this._get(inst, 'months').namesAbbr,
				okText  = this._get(inst, 'Ok'),
				nextText  = this._get(inst, 'Next'),
				prevText  = this._get(inst, 'Previous'),
				cancelText  = this._get(inst, 'Cancel'),
				table = $('<table cellspacing="0" cellpadding="0" class="inforDatePickerPanel"><tbody><tr><td align="left" style="vertical-align: top;"><table cellspacing="0" cellpadding="0" class="datePickerMonthYearPanel"><tbody><tr><td align="left" style="vertical-align: top;"><table class="datePickerMonthYearGrid"><tbody><tr><td><div class="datePickerMonthYearMonth">Jan</div></td><td><div class="datePickerMonthYearMonth">Apr</div></td><td> <div class="datePickerMonthYearMonth">Jul</div> </td><td><div class="datePickerMonthYearMonth">Oct</div></td></tr><tr><td><div class="datePickerMonthYearMonth">Feb</div></td><td><div class="datePickerMonthYearMonth">May</div></td><td><div class="datePickerMonthYearMonth">Aug</div></td><td><div class="datePickerMonthYearMonth">Nov</div></td></tr><tr class="inforBeforeYearButtonRow"><td><div class="datePickerMonthYearMonth">Mar</div></td><td><div class="datePickerMonthYearMonth">Jun</div></td><td><div class="datePickerMonthYearMonth">Sep</div></td><td><div class="datePickerMonthYearMonth">Dec</div></td></tr><tr class="inforYearButtonRow"><td></td><td class="datePickerPreviousYearCell"> <button type="button" title="'+prevText+'" class="inforPrevYearButton"><i></i></button> </td><td class="datePickerNextYearCell"> <button type="button" title="'+nextText+'" class="inforNextYearButton"><i></i></button> </td><td></td></tr><tr ><td><div class="datePickerMonthYearYear">2008</div></td><td><div class="datePickerMonthYearYear">2010</div></td><td><div class="datePickerMonthYearYear">2012</div></td><td><div class="datePickerMonthYearYear">2014</div></td></tr><tr class="inforYearLastRow"><td><div class="datePickerMonthYearYear">2009</div></td><td><div class="datePickerMonthYearYear">2011</div></td><td><div class="datePickerMonthYearYear">2013</div></td><td><div class="datePickerMonthYearYear">2015</div></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr ><td align="left" style="vertical-align: top;"><div class="inforDatePickerButtonPanel inforDatePickerMonthYearButtonPanel"><button style="display: inline-block;" class="inforFormButton default" type="button">'+okText+'</button><button style="display: inline-block;" class="inforFormButton" type="button">'+cancelText+'</button></div></td></tr></tbody></table> ');

			var todayDate = new Date(),
				todayYear = (todayDate).getFullYear(),
				currentYear = (inst.currentYear),
				minDate = this._getMinMaxDate(inst, 'min'),
				maxDate = this._getMinMaxDate(inst, 'max');

			//corrects draw year for Hijri (Arabic) calendar
			if (this._get(inst, 'isHijri')) {
				todayDate = Globalize.culture().calendar.convert.fromGregorian(todayDate);
				todayYear = todayDate[0];
			}

			if (currentYear==0) {
				currentYear = todayYear;
			} else {
				currentYear = parseInt(Globalize.format(new Date(inst.currentYear, inst.currentMonth, inst.currentDay), 'yyyy'), 10);
			}

			if (inst.settings.defaultDate) {	//center on default date if provided.
				currentYear = inst.settings.defaultDate.getFullYear();
			}

			self._updateYearPanel(table, inst, currentYear);

			//Add the formatted months in.
			var todayMonth = (new Date()).getMonth();
			if (this._get(inst, 'isHijri'))
				todayMonth = todayDate[1];

			var selectedMonth = inst.selectedMonth,
				i=0;

			function selectMonth(){
				table.find(".datePickerMonth-selected").removeClass("datePickerMonth-selected");
				$(this).addClass("datePickerMonth-selected");
			}

			table.find(".datePickerMonthYearGrid tr").each( function (index, ui) {
				if (index >= 3) {
					return;
				}
				var row = $(this);

				row.find("td").each(function(index2) {
					var col = $(this).find("div");
					col.data("month",i).html(monthNamesShort[i]).click(selectMonth);

					if (i==todayMonth) {
						col.addClass("datePickerMonthYearMonth-current");
					}

					if (i==selectedMonth) {
						col.addClass("datePickerMonth-selected");
					}
					i++;
				});
			});

			//set up the buttons...
			table.find(".inforFormButton:eq(0)").click(function () {
					//update selected month and year..and return
					var month = table.find(".datePickerMonth-selected").data("month");
					var year = table.find(".datePickerYear-selected").html();
					self._selectMonthYear(inst,month,year);
					self._updateDatepicker(inst);
			});
			table.find(".inforFormButton:eq(1)").click(function () {
					self._updateDatepicker(inst);
			});
			table.find(".inforPrevYearButton").click(function () {
				currentYear=currentYear-1;
				self._updateYearPanel(table,inst,currentYear);
			});
			table.find(".inforNextYearButton").click(function () {
				currentYear=currentYear+1;
				self._updateYearPanel(table,inst,currentYear);
			});

			//add and animate..
			inst.dpDiv.append(table);
			inst.dpDiv.show();
			inst.dpDiv.find('[title]').inforToolTip();
		},
		_selectMonthYear: function (inst, month, year) {

			inst._selectingMonthYear = false;
			if (month!=undefined) {
				inst['selectedMonth' ] =
				inst['drawMonth'] = month;
			}

			if (year!=undefined) {
				inst['selectedYear' ] =
				inst['drawYear'] = parseInt(year, 10);
			}

			this._notifyChange(inst);
			this._adjustDate($("#"+inst.id));
		},
		/* Generate the date picker content. */
		_updateDatepicker: function (inst) {
			var self = this;
			var borders = $.datepicker._getBorders(inst.dpDiv);

			instActive = inst; // for delegate hover events
			inst.dpDiv.empty().append(this._generateHTML(inst));
			inst.dpDiv.find('[title]').inforToolTip();

			inst.dpDiv.find(".inforDatePickerPanelButton").show().click(function ()
			{
				self._showDateMonthPanel(inst);
			});

			var cover = inst.dpDiv.find('iframe.inforDatePicker-cover'); // IE6- only
			if (!!cover.length) { //avoid call to outerXXXX() when not in IE6
				cover.css({ left: -borders[0], top: -borders[1], width: inst.dpDiv.outerWidth(), height: inst.dpDiv.outerHeight() });
			}

			inst.dpDiv.find('.' + this._dayOverClass + ' a').mouseover();

			var numMonths = this._getNumberOfMonths(inst);
			var cols = numMonths[1];
			var width = 17;

			inst.dpDiv.removeClass('inforDatePicker-multi-2 inforDatePicker-multi-3 inforDatePicker-multi-4').width('');
			if (cols > 1)
				inst.dpDiv.addClass('inforDatePicker-multi-' + cols).css('width', (width * cols) + 'em');

			inst.dpDiv[(numMonths[0] != 1 || numMonths[1] != 1 ? 'add' : 'remove') +
			'Class']('inforDatePicker-multi');
			inst.dpDiv[(this._get(inst, 'isRTL') ? 'add' : 'remove') +
			'Class']('inforDatePicker-rtl');
			if (inst == $.datepicker._curInst && $.datepicker._datepickerShowing && inst.input &&


			// #6694 - don't focus the input if it's already focused
			// this breaks the change event in IE
			inst.input.is(':visible') && !inst.input.is(':disabled') && inst.input[0] != document.activeElement)
			inst.input.focus();

			if (this._get(inst, 'showUTCTime')) {
				var dFormat = this._get(inst, 'dateFormat');
				inst.input.off('change.datepicker').on('change.datepicker', function (e) {
					var field = $(this),
						parsedDate = Globalize.parseDate(field.val(), dFormat);

					self._setUtcMillis(inst, parsedDate);
				});
			}

			if (this._get(inst, 'showTimeInput')) {
				//attach validation on the date field and an event to update internal values for select
				$("#inforTimeInput").bind("change", function () {
					var format = self._get(inst, 'timeFormat');
						date = Globalize.parseDate($(this).val(), format);

					inst.drawHours = inst.selectedHours = parseInt((Globalize.format(date, "HH")==null ? 0 :Globalize.format(date, "HH")) , 10);
					inst.drawMinutes = inst.selectedMinutes = parseInt((Globalize.format(date, "mm")==null ? 0 :Globalize.format(date, "mm")), 10);
					inst.drawSeconds = inst.selectedSeconds = parseInt((Globalize.format(date, "ss")==null ? 0 :Globalize.format(date, "ss")), 10);
				}).bind("keypress", function (event) {
						if (event.keyCode == $.ui.keyCode.ENTER) {
							$(this).trigger("change");
							$.datepicker._selectDate("#"+inst.id,$.datepicker._formatDate(inst, inst.selectedDay, inst.selectedMonth, inst.selectedYear, inst.selectedHours, inst.selectedMinutes,inst.selectedSeconds) );
							return;
						}
						if ($.datepicker._get(inst, 'constrainInput')) {
							var chars = $.datepicker._possibleChars(inst.settings.culture || $.datepicker._defaults.culture, $.datepicker._get(inst, 'dateFormat'));
							var chr = String.fromCharCode(event.charCode == undefined ? event.keyCode : event.charCode);

							return event.ctrlKey || (chr < ' ' || !chars || chars.indexOf(chr) > -1);
						}
				});
			}

			if (this._get(inst, 'showTimezone')) {
				$("#inforTimezone").inforDropDownList({editable : false, typeAheadSearch: false});
			}
		},

		/* Retrieve the size of left and top borders for an element.
		@param  elem  (jQuery object) the element of interest
		@return  (number[2]) the left and top borders */
		_getBorders: function (elem) {
			var convert = function (value) {
				return { thin: 1, medium: 2, thick: 3}[value] || value;
			};
			return [parseFloat(convert(elem.css('border-left-width'))),
			parseFloat(convert(elem.css('border-top-width')))];
		},

		/* Check positioning to remain on screen. */
		_checkOffset: function (inst, offset, isFixed) {
			var dpWidth = inst.dpDiv.outerWidth();
			var dpHeight = inst.dpDiv.outerHeight();
			var inputWidth = inst.input ? inst.input.outerWidth() : 0;
			var inputHeight = inst.input ? inst.input.outerHeight() : 0;
			var viewWidth = document.documentElement.clientWidth + $(document).scrollLeft();
			var viewHeight = document.documentElement.clientHeight + $(document).scrollTop();


      offset.left -= (this._get(inst, 'isRTL') ? (dpWidth - inputWidth) : 0);
			offset.left -= (isFixed && offset.left == inst.input.offset().left) ? $(document).scrollLeft() : 0;
			offset.top -= (isFixed && offset.top == (inst.input.offset().top + inputHeight)) ? $(document).scrollTop() : 0;

			// now check if datepicker is showing outside window viewport - move to a better place if so.
			offset.left -= Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ? Math.abs(offset.left + dpWidth - viewWidth) : 0);
			offset.left -= 10;

      offset.top -= Math.min(offset.top, (offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
			Math.abs(dpHeight + inputHeight) : 0);

			return offset;
		},

		/* Find an object's position on the screen. */
		_findPos: function (obj) {
			var inst = this._getInst(obj);
			var isRTL = this._get(inst, 'isRTL');
			while (obj && (obj.type == 'hidden' || obj.nodeType != 1 || $.expr.filters.hidden(obj))) {
				obj = obj[isRTL ? 'previousSibling' : 'nextSibling'];
			}
			var position = $(obj).offset();
			return [position.left, position.top];
		},

		/* Hide the date picker from view.
		@param  input  element - the input field attached to the date picker */
		_hideDatepicker: function (input, noFocus) {
			var inst = this._curInst;
			if (!inst || (input && inst != $.data(input, PROP_NAME)))
				return;
			if (this._datepickerShowing) {
				var showAnim = this._get(inst, 'showAnim');
				var duration = this._get(inst, 'duration');
				var postProcess = function () {
					$.datepicker._tidyDialog(inst);
					this._curInst = null;
				};
				if ($.effects && $.effects[showAnim])
					inst.dpDiv.hide(showAnim, $.datepicker._get(inst, 'showOptions'), duration, postProcess);
				else
					inst.dpDiv[(showAnim == 'slideDown' ? 'slideUp' :
					(showAnim == 'fadeIn' ? 'fadeOut' : 'hide'))]((showAnim ? duration : null), postProcess);
				if (!showAnim)
					postProcess();
				var onClose = this._get(inst, 'onClose');
				if (onClose) {
					onClose.apply((inst.input ? inst.input[0] : null), [(inst.input ? inst.input.val() : ''), inst]);  // trigger custom callback
				}

				this._datepickerShowing = false;
				this._lastInput = null;
			}
		},

		/* Tidy up after a dialog display. */
		_tidyDialog: function (inst) {
			inst.dpDiv.removeClass(this._dialogClass).unbind('.inforDatePicker-calendar');
		},

		/* Close date picker if clicked elsewhere. */
		_checkExternalClick: function (event) {
			if (!$.datepicker._curInst)
				return;

			var $target = $(event.target);


			function hasScroll(el, direction) {
				direction = (direction === 'vertical') ? 'scrollTop' : 'scrollLeft';
				var result = !! el[direction];

				if (!result) {
					el[direction] = 1;
					result = !!el[direction];
					el[direction] = 0;
				}
				return result;
			}

			if ($target.is("html") && $("body").css("overflow")=="scroll") {	//ignore click on scrollbar
				return;
			}

			if ($target.closest(".inforMenu").length == 1) {	//ignore click on drop down.
				return;
			}

			if ($target[0].id != $.datepicker._mainDivId &&
				$target.parents('#' + $.datepicker._mainDivId).length == 0 &&
				!$target.data($.datepicker.markerClassName) &&
				!$target.hasClass($.datepicker._triggerClass) &&
				$.datepicker._datepickerShowing) {
					$.datepicker._hideDatepicker();
				}
		},

		/* Adjust one of the date sub-fields. */
		_adjustDate: function (id, offset, period) {
			var target = $(id);
			var inst = this._getInst(target[0]);
			if (this._isDisabledDatepicker(target[0])) {
				return;
			}
			this._adjustInstDate(inst, offset +
			(period == 'M' ? this._get(inst, 'showCurrentAtPos') : 0), // undo positioning
			period);
			this._updateDatepicker(inst);
		},

		/* Action for current link. */
		_gotoToday: function (id) {
			var target = $(id);
			var inst = this._getInst(target[0]);
			if (this._get(inst, 'gotoCurrent') && inst.currentDay) {
				inst.selectedDay = inst.currentDay;
				inst.drawMonth = inst.selectedMonth = inst.currentMonth;
				inst.drawYear = inst.selectedYear = inst.currentYear;
			}
			else {
				var date = new Date();
				inst.selectedDay = date.getDate();
				inst.drawMonth = inst.selectedMonth = date.getMonth();
				inst.drawYear = inst.selectedYear = date.getFullYear();
			}
			this._notifyChange(inst);
			this._adjustDate(target);
		},

		/* Restore input focus after not changing month/year. */
		_clickMonthYear: function (id) {
			var target = $(id);
			var inst = this._getInst(target[0]);
			if (inst.input && inst._selectingMonthYear) {
				setTimeout(function () {
					inst.input.focus();
				}, 0);
			}
			inst._selectingMonthYear = !inst._selectingMonthYear;
		},
		/* Action for selecting a day. */
		_selectDay: function (id, month, year, td) {
			var target = $(id),
				inst = this._getInst(target[0]),
				formattedDate,
				utcDate;

			if ($(td).hasClass(this._unselectableClass) || this._isDisabledDatepicker(target[0])) {
				return;
			}

			inst.selectedDay = inst.currentDay = $('a', td).html();
			inst.selectedMonth = inst.currentMonth = month;
			inst.selectedYear = inst.currentYear = year;
			formattedDate = this._formatDate(inst, inst.currentDay, inst.currentMonth, inst.currentYear, inst.selectedHours, inst.selectedMinutes,inst.selectedSeconds);
			this._selectDate(id, formattedDate);
		},

		/* Erase the input field and hide the date picker. */
		_clearDate: function (id) {
			var target = $(id);
			this._selectDate(target, '');
		},
		_setUtcMillis: function (inst, selectedDate) {
			if (this._get(inst, 'showUTCTime')) {
				if (selectedDate) {
					selectedDate.setMinutes(selectedDate.getMinutes() - selectedDate.getTimezoneOffset());
					inst.input.attr("data-utcmillis", selectedDate.getTime());
				} else {
					inst.input.attr("data-utcmillis", null);
				}
			}
		},
		setUtcDate: function(id, millis) {
			var target = $(id),
				utcDate = null;

			if (millis) {
				utcDate = new Date(millis);
				utcDate.setMinutes(utcDate.getMinutes() + utcDate.getTimezoneOffset());
			}

			var inst = this._getInst(target[0]),
				dateStr = $.datepicker.formatDate(utcDate, this._get(inst, 'dateFormat')),
				dFormat = this._get(inst, 'dateFormat');

			if (dFormat.indexOf("zzz") > -1) {
				dateStr = dateStr.substr(0, dateStr.length - 6) + "+00:00";
			}

			inst.input.val(dateStr).attr("data-utcmillis", millis);
		},
		/* Update the input field with the selected date. */
		_selectDate: function (id, dateStr) {
			var target = $(id),
				dFormat = '',
				inst = this._getInst(target[0]);

			dateStr = (dateStr != null ? dateStr : this._formatDate(inst));

			//change the time zone format and set millis data attr
			if (this._get(inst, 'showUTCTime')) {
				//this._setUtcMillis(inst, selectedDate);
				dFormat = this._get(inst, 'dateFormat');
				if (dFormat.indexOf("zzz") > -1) {
					dateStr = dateStr.substr(0, dateStr.length - 6) + "+00:00";
				}
			}

			if (inst.input) {
				inst.input.val(dateStr);
			}

			this._updateAlternate(inst);

			var onSelect = this._get(inst, 'onSelect');
			if (onSelect) {
				onSelect.apply((inst.input ? inst.input[0] : null), [dateStr, inst]);  // trigger custom callback
			} else if (inst.input) {
				inst.input.trigger('change'); // fire the change event
			}

			if (inst.inline) {
				this._updateDatepicker(inst);
			} else {
				this._hideDatepicker();
				this._lastInput = inst.input[0];
				inst.input.focus().select(); // restore focus
				this._lastInput = null;
			}
		},

		/* Update any alternate field to synchronise with the main field. */
		_updateAlternate: function (inst) {
			var altField = this._get(inst, 'altField'),
				date, dateStr, altField2;

			if (altField) { // update alternate field too
				altFormat = this._get(inst, 'altFormat') || this._get(inst, 'dateFormat');
				date = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
				dateStr = this.formatDate(date, altFormat, inst.settings.culture);
				$(altField).each(function () { $(this).val(dateStr); });
			}

			altField2 = this._get(inst, 'altField2');
			if (altField2) { // update alternate field too
				altFormat2 = this._get(inst, 'altFormat2') || this._get(inst, 'dateFormat');
				date = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
				dateStr = this.formatDate(date, altFormat2, inst.settings.culture);
				$(altField2).each(function () {  $(this).val(dateStr); });
			}
		},

		/* Set as beforeShowDay function to prevent selection of weekends.
		@param  date  Date - the date to customise
		@return [boolean, string] - is this date selectable?, what is its CSS class? */
		noWeekends: function (date) {
			var day = date.getDay();
			return [(day > 0 && day < 6), ''];
		},

		/* Set as calculateWeek to determine the week of the year based on the ISO 8601 definition.
		@param  date  Date - the date to get the week for
		@return  number - the number of the week within the year that contains this date */
		iso8601Week: function (date) {
			var checkDate = new Date(date.getTime());
			// Find Thursday of this week starting on Monday
			checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
			var time = checkDate.getTime();
			checkDate.setMonth(0); // Compare with Jan 1
			checkDate.setDate(1);
			return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
		},

		/* Parse a string value into a date object.
		See formatDate below for the possible formats.

		@param  format    string - the expected format of the date
		@param  value     string - the date in the above format


		@param  settings  Object - attributes include:
		shortYearCutoff  number - the cutoff year for determining the century (optional)
		dayNamesShort    string[7] - abbreviated names of the days from Sunday (optional)
		dayNames         string[7] - names of the days from Sunday (optional)
		monthNamesShort  string[12] - abbreviated names of the months (optional)
		monthNames       string[12] - names of the months (optional)
		@return  Date - the extracted date value or null if value is blank */
		parseDate: function (value, format, culture) {
			return Globalize.parseDate(value, format, culture || this._defaults.culture);
	},

		/* Standard date formats. */
		ATOM: 'yyyy-mm-dd', // RFC 3339 (ISO 8601)
		COOKIE: 'ddd, dd mmm yyyy',
		ISO_8601: 'yyyy-mm-dd',
		RFC_822: 'ddd, d mmm yy',
		RFC_850: 'dddd, dd-mmm-yy',
		RFC_1036: 'ddd, d mmm yy',
		RFC_1123: 'ddd, d mmm yyyy',
		RFC_2822: 'ddd, d mmm yyyy',
		RSS: 'ddd, d mmm yy', // RFC 822
		TICKS: '!',
		TIMESTAMP: '@',
		W3C: 'yyyy-mm-dd', // ISO 8601

		_ticksTo1970: (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
		Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000),

	/*
@param  value     string - the date to format
@param  formats   string - the format of the date
@param  culture   string - the culture to format the date as, omit to use the datepicker default culture.
@return  string - the date in the above format */
	formatDate: function (date, format, culture) {
		return Globalize.format(date, format, culture || this._defaults.culture);
	},
	/* Extract all possible characters from the date format. */
	_possibleChars: function (culture, format) {
		var chars = '';
		var literal = false;
		// Check whether a format character is doubled
		var lookAhead = function (match) {
			var matches = (iFormat + 1 < format.length && format.charAt(iFormat + 1) == match);
			if (matches)
				iFormat++;
			return matches;
		};
		for (var iFormat = 0; iFormat < format.length; iFormat++)
			if (literal)
				if (format.charAt(iFormat) == "'" && !lookAhead("'"))
					literal = false;
				else
					chars += format.charAt(iFormat);
			else
				switch (format.charAt(iFormat)) {
				case 'd': case 'm': case 'y': case '@':
					chars += '0123456789';
					break;
				case 'D': case 'M':
					chars += '0123456789';
					break;
				case ':':
					chars += ':';
					break;
				case 't':
					if (lookAhead("t"))
						chars += "PMA";
					break;
				case '/':
					chars += Globalize.culture().calendar["/"];
					break;
				case "'":
					if (lookAhead("'"))
						chars += "'";
					else
						literal = true;
					break;
				default:
					chars += format.charAt(iFormat);
			}
		return chars;
	},

	/* Get a setting value, defaulting if necessary. */
	_get: function (inst, name) {
			// try instance settings
			var val = inst.settings[name];
			if (typeof val === "undefined") {
				// then try global defaults
				val = this._defaults[name];
				if (typeof val === "undefined") {
					var cultureName = inst.settings.culture || this._defaults.culture,
						culture = Globalize.findClosestCulture(cultureName);
					// try a culture value or a culture calendar value
					// e.g. 'isRTL' (culture.isRTL) or 'days' (culture.calendar.days)
					val = culture[name];
					if (typeof val === "undefined") {
						val = culture.calendar[name];
						if (typeof val === "undefined") {
							// then try datepicker specific data for the culture
						val =  Globalize.localize(name, cultureName || this._defaults.culture);
						}
					}
				}
			}
			return val;
		},

		/* Parse existing date and initialise date picker. */
		_setDateFromField: function (inst, noDefault) {
			if (inst.input.val() == inst.lastVal) {
				return;
			}
			var dateFormat = this._get(inst, 'dateFormat');
			var dates = inst.lastVal = inst.input ? inst.input.val() : null;
			var date, defaultDate;
			date = defaultDate = this._getDefaultDate(inst);

			try {
				date = this.parseDate(dates, dateFormat, inst.settings.culture) || defaultDate;
			} catch (event) {
				dates = (noDefault ? '' : dates);
			}
			//parse the date using format for isHijri
			inst.selectedDay = parseInt(Globalize.format(date, "dd"), 10);	//date.getDate();
			inst.drawMonth = inst.selectedMonth = parseInt(Globalize.format(date, "MM")-1, 10);
			inst.drawYear = inst.selectedYear = parseInt(Globalize.format(date, "yyyy"), 10);

			inst.drawHours = inst.selectedHours = parseInt(Globalize.format(date, "HH"), 10);
			inst.drawMinutes = inst.selectedMinutes = parseInt(Globalize.format(date, "mm"), 10);
			inst.drawSeconds = inst.selectedSeconds = parseInt(Globalize.format(date, "ss"), 10);

			if (dateFormat.indexOf("zzz") > -1) {
				var dateStr = inst.input.val();
				inst.selectedTimezone =  dateStr.substr(dateStr.length - 5);
			}

			inst.currentDay = (dates ? parseInt(Globalize.format(date, "dd"), 10) : 0);
			inst.currentMonth = (dates ? parseInt(Globalize.format(date, "MM")-1, 10) : 0);
			inst.currentYear = (dates ? parseInt(Globalize.format(date, "yyyy"), 10) : 0);
			this._adjustInstDate(inst);
		},

		/* Retrieve the default date shown on opening. */
		_getDefaultDate: function (inst) {
			var defaultDate = new Date();
			if (this._get(inst, 'showUTCTime')) {
				defaultDate.setMinutes(defaultDate.getMinutes() + defaultDate.getTimezoneOffset());
			}
			return this._restrictMinMax(inst, this._determineDate(inst, this._get(inst, 'defaultDate'), defaultDate));
		},

		/* A date may be specified as an exact value or a relative one. */
		_determineDate: function (inst, date, defaultDate) {
			var offsetNumeric = function (offset) {
				var date = new Date();
				date.setDate(date.getDate() + offset);
				return date;
			};
			var offsetString = function (offset) {
				try {
					return $.datepicker.parseDate(offset, $.datepicker._get(inst, 'dateFormat'),
						inst.settings.culture);
				}
				catch (e) {
					// Ignore
				}
				var date = (offset.toLowerCase().match(/^c/) ?
					$.datepicker._getDate(inst) : null) || new Date();
				var year = date.getFullYear();
				var month = date.getMonth();
				var day = date.getDate();
				var pattern = /([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;
				var matches = pattern.exec(offset);
				while (matches) {
					switch (matches[2] || 'd') {
						case 'd' : case 'D' :
							day += parseInt(matches[1], 10); break;
						case 'w' : case 'W' :
							day += parseInt(matches[1], 10) * 7; break;
						case 'm' : case 'M' :
							month += parseInt(matches[1], 10);
							day = Math.min(day, $.datepicker._getDaysInMonth(year, month, false));
							break;
						case 'y': case 'Y' :
							year += parseInt(matches[1], 10);
							day = Math.min(day, $.datepicker._getDaysInMonth(year, month, false));
							break;

					}
					matches = pattern.exec(offset);

				}
				return new Date(year, month, day);
			};
			date = (date == null ? defaultDate : (typeof date == 'string' ? offsetString(date) :
				(typeof date == 'number' ? (isNaN(date) ? defaultDate : offsetNumeric(date)) : date)));
			date = (date && date.toString() == 'Invalid Date' ? defaultDate : date);

			if (this._get(inst, 'showTimeInput')) {
				return date;
			}

			if (date) {
					date.setHours(0);
					date.setMinutes(0);
					date.setSeconds(0);
					date.setMilliseconds(0);
			}
			return this._daylightSavingAdjust(date);
	},

		/* Handle switch to/from daylight saving.
		Hours may be non-zero on daylight saving cut-over:
		> 12 when midnight changeover, but then cannot generate
		midnight datetime, so jump to 1AM, otherwise reset.
		@param  date  (Date) the date to check
		@return  (Date) the corrected date */
		_daylightSavingAdjust: function (date) {
			if (!date) return null;
			date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
			return date;
		},

		/* Set the date(s) directly. */
		_setDate: function (inst, date, noChange) {
			var clear = !(date);
			var origMonth = inst.selectedMonth;
			var origYear = inst.selectedYear;
			date = this._restrictMinMax(inst, this._determineDate(inst, date, new Date()));
			inst.selectedDay = inst.currentDay = date.getDate();
			inst.drawMonth = inst.selectedMonth = inst.currentMonth = date.getMonth();
			inst.drawYear = inst.selectedYear = inst.currentYear = date.getFullYear();

			inst.selectedHours = date.getHours();
			inst.selectedMinutes = date.getMinutes();
			inst.selectedSeconds = date.getSeconds();

			if ((origMonth != inst.selectedMonth || origYear != inst.selectedYear) && !noChange)
				this._notifyChange(inst);
			this._adjustInstDate(inst);
			if (inst.input) {
				inst.input.val(clear ? '' : this._formatDate(inst));
			}
		},

		/* Retrieve the date(s) directly. */
		_getDate: function (inst) {
			var startDate = (!inst.currentYear || (inst.input && inst.input.val() == '') ? null :
				this._daylightSavingAdjust(new Date(
				inst.currentYear, inst.currentMonth, inst.currentDay)));
				return startDate;
		},

		/* Generate the HTML for the current state of the date picker. */
		_generateHTML: function (inst) {
			var today = new Date();
			today = this._daylightSavingAdjust(new Date(today.getFullYear(), today.getMonth(), today.getDate())); // clear time

			if (this._get(inst, 'isHijri'))
				today = Globalize.culture().calendar.convert.fromGregorian(today);

			var isRTL = this._get(inst, 'isRTL');
			var showButtonPanel = this._get(inst, 'showButtonPanel');
			var hideIfNoPrevNext = this._get(inst, 'hideIfNoPrevNext');
			var navigationAsDateFormat = this._get(inst, 'navigationAsDateFormat');
			var numMonths = this._getNumberOfMonths(inst);
			var showCurrentAtPos = this._get(inst, 'showCurrentAtPos');
			var stepMonths = this._get(inst, 'stepMonths');
			var currentDate = this._daylightSavingAdjust((!inst.currentDay ? new Date(9999, 9, 9) :	new Date(inst.currentYear, inst.currentMonth, inst.currentDay)));

			var minDate = this._getMinMaxDate(inst, 'min');
			var maxDate = this._getMinMaxDate(inst, 'max');

			var drawMonth = inst.drawMonth - showCurrentAtPos;
			var drawYear = inst.drawYear;
			if (drawMonth < 0) {
				drawMonth += 12;
				drawYear--;
			}
			if (maxDate) {
				var maxDraw = this._daylightSavingAdjust(new Date(maxDate.getFullYear(),
				maxDate.getMonth() - (numMonths[0] * numMonths[1]) + 1, maxDate.getDate()));
				maxDraw = (minDate && maxDraw < minDate ? minDate : maxDraw);
				while (this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1)) > maxDraw) {
					drawMonth--;
					if (drawMonth < 0) {
						drawMonth = 11;
						drawYear--;
					}
				}
			}
			inst.drawMonth = drawMonth;
			//localize draw year...
			inst.drawYear = drawYear;

			var prevText = this._get(inst, 'Previous');
			prevText = (!navigationAsDateFormat ? prevText : this.formatDate(prevText,
			this._daylightSavingAdjust(new Date(drawYear, drawMonth - stepMonths, 1)),
			this._getFormatConfig(inst)));
			var prev = (this._canAdjustMonth(inst, -1, drawYear, drawMonth, this._get(inst, 'isHijri')) ?
			'<a class="inforDatePicker-prev l" onclick="DP_jQuery_' + dpuuid +
			'.datepicker._adjustDate(\'#' + inst.id + '\', -' + stepMonths + ', \'M\');"' +
			' title="' + prevText + '"><button type="button" class="' + (isRTL ? 'inforNextMonthButton' : 'inforPrevMonthButton') + '" title="' + prevText  + '"><i></i></button></a>' :
			(hideIfNoPrevNext ? '' : '<a class="inforDatePicker-prev inforDatePicker-state-disabled" title="' + prevText + '"><span class="' + (isRTL ? 'inforNextMonthButton' : 'inforPrevMonthButton') + '">' + '</span></a>'));	//prevText - may need for screen reader
			var nextText = this._get(inst, 'Next');
			nextText = (!navigationAsDateFormat ? nextText : this.formatDate(nextText,
			this._daylightSavingAdjust(new Date(drawYear, drawMonth + stepMonths, 1)),
			this._getFormatConfig(inst)));
			var next = (this._canAdjustMonth(inst, +1, drawYear, drawMonth, this._get(inst, 'isHijri')) ?
			'<a class="inforDatePicker-next " onclick="DP_jQuery_' + dpuuid +
			'.datepicker._adjustDate(\'#' + inst.id + '\', +' + stepMonths + ', \'M\');"' +
			' title="' + nextText + '"><button type="button"  class="' + (isRTL ? 'inforPrevMonthButton' : 'inforNextMonthButton') + '" title="' + nextText + '"><i></i></button></a>' :
			(hideIfNoPrevNext ? '' : '<a class="inforDatePicker-next inforDatePicker-state-disabled" title="' + nextText + '"><span class="inforIconButton ' + (isRTL ? 'inforPrevMonthButton' : 'inforNextMonthButton') + '">' + '</span></a>')); //nextText - may need for screen reader
			var currentText = this._get(inst, 'Today');
			var gotoDate = (this._get(inst, 'gotoCurrent') && inst.currentDay ? currentDate : today);
			currentText = (!navigationAsDateFormat ? currentText :
			this.formatDate(currentText, gotoDate, this._getFormatConfig(inst)));
			var controls = (!inst.inline ? '<button type="button" class="inforDatePicker-close inforDatePicker-state-default inforDatePicker-priority-primary inforDatePicker-corner-all" onclick="DP_jQuery_' + dpuuid +
			'.datepicker._hideDatepicker();">' + this._get(inst, 'closeText') + '</button>' : '');
			var buttonPanel = (showButtonPanel) ? '<div class="inforDatePicker-buttonpane inforDatePicker-widget-content">' + (isRTL ? controls : '') +
			(this._isInRange(inst, gotoDate) ? '<button type="button" class="inforDatePicker-current inforDatePicker-state-default inforDatePicker-priority-secondary inforDatePicker-corner-all" onclick="DP_jQuery_' + dpuuid +
			'.datepicker._gotoToday(\'#' + inst.id + '\');"' +
			'>' + currentText + '</button>' : '') + (isRTL ? '' : controls) + '</div>' : '';
			var firstDay = parseInt(this._get(inst, 'firstDay'), 10);
			firstDay = (isNaN(firstDay) ? 0 : firstDay);
			var showWeek = this._get(inst, 'showWeek');
			var dayNames = this._get(inst, 'days').names;
			var dayNamesMin = this._get(inst, 'days').namesShort;

			var monthNames = this._get(inst, 'months').names;
			var monthNamesShort = this._get(inst, 'months').namesAbbr;

			var beforeShowDay = this._get(inst, 'beforeShowDay');
			var showOtherMonths = this._get(inst, 'showOtherMonths');
			var selectOtherMonths = this._get(inst, 'selectOtherMonths');
			var defaultDate = this._getDefaultDate(inst);
			var html = '';
			var showTime = this._get(inst, 'showTimeInput');
			var showTimezone = this._get(inst, 'showTimezone');

			for (var row = 0; row < numMonths[0]; row++) {
				var group = '';
				for (var col = 0; col < numMonths[1]; col++) {
					var selectedDate = this._daylightSavingAdjust(new Date(drawYear, drawMonth, inst.selectedDay));

					if (showTime) {
						selectedDate = new Date(drawYear, drawMonth, inst.selectedDay, inst.selectedHours, inst.selectedMinutes, inst.selectedSeconds);
					}

					var cornerClass = ' inforDatePicker-corner-all';
					var calender = '';
					calender += '<div class="inforDatePicker-header">' +
					(/all|left/.test(cornerClass) && row == 0 ? (isRTL ? next : prev) : '') +
					(/all|right/.test(cornerClass) && row == 0 ? (isRTL ? prev : next) : '') +
					this._generateMonthYearHeader(inst, drawMonth, drawYear, minDate, maxDate,
					row > 0 || col > 0, monthNames, monthNamesShort) + // draw month headers
					'</div><table class="inforDatePicker-calendar"><thead class="inforDatePickerDaysOfWeek">' +
					'<tr>';
					var thead = (showWeek ? '<th class="inforDatePicker-week-col">' + this._get(inst, 'weekHeader') + '</th>' : '');
					for (var dow = 0; dow < 7; dow++) { // days of the week
						var day = (dow + firstDay) % 7;
						thead += '<th' + ((dow + firstDay + 6) % 7 >= 5 ? ' class="inforDatePicker-week-end"' : '') + '>' +
						'<span title="' + dayNames[day] + '">' + dayNamesMin[day] + '</span></th>';
					}
					calender += thead + '</tr></thead><tbody>';
					var daysInMonth = this._getDaysInMonth(drawYear, drawMonth, this._get(inst, 'isHijri'));
					if (drawYear == inst.selectedYear && drawMonth == inst.selectedMonth)
						inst.selectedDay = Math.min(inst.selectedDay, daysInMonth);
                    var dayOfFirstDayOfMonth = this._getFirstDayOfMonth(drawYear, drawMonth, this._get(inst, 'isHijri'));
                    var leadDays = (dayOfFirstDayOfMonth - firstDay + 7) % 7;
					var numRows = Math.ceil((leadDays + daysInMonth) / 7); // calculate the number of rows to generate
					var printDate = this._getCalDate(drawYear, drawMonth, 1, -leadDays, this._get(inst, 'isHijri'));	//this._daylightSavingAdjust(new Date(drawYear, drawMonth, 1 - leadDays));

					for (var dRow = 0; dRow < numRows; dRow++) { // create date picker rows
						calender += '<tr>';
						var tbody = (!showWeek ? '' : '<td class="inforDatePicker-week-col">' + this._get(inst, 'calculateWeek')(printDate) + '</td>');
						for (var dow = 0; dow < 7; dow++) { // create date picker days
							var daySettings = (beforeShowDay ? beforeShowDay.apply((inst.input ? inst.input[0] : null), [new Date(printDate[0], printDate[1],printDate[2])]) : [true, '']);
							var otherMonth = (printDate[1] != drawMonth);

							var checkDate = new Date(printDate[0],printDate[1],printDate[2]);
							var unselectable = (otherMonth && !selectOtherMonths) || !daySettings[0] ||
							(minDate && checkDate < minDate) || (maxDate && checkDate > maxDate);

							tbody += '<td class="' +
							((dow + firstDay + 6) % 7 >= 5 ? ' inforDatePicker-week-end' : '') + // highlight weekends
							(otherMonth ? ' inforDatePicker-other-month' : '') + // highlight days from other months
							((printDate[3] == selectedDate.getTime() && drawMonth == inst.selectedMonth && inst._keyEvent) || // user pressed key
							(defaultDate.getTime() == printDate[3] && defaultDate.getTime() == selectedDate.getTime()) ?
							// or defaultDate is current printedDate and defaultDate is selectedDate
							' ' + this._dayOverClass : '') + // highlight selected day
							(unselectable ? ' ' + this._unselectableClass + ' inforDatePicker-state-disabled' : '') +  // highlight unselectable days
							(otherMonth && !showOtherMonths ? '' : ' ' + daySettings[1] + // highlight custom dates
							(this._equalDates(printDate,selectedDate) ? ' ' + this._currentClass : '') + // highlight selected day
							(this._equalDates(printDate,today) ? ' isToday' : '')) + '"' + // highlight today (if different)
							((!otherMonth || showOtherMonths) && daySettings[2] ? ' title="' + daySettings[2] + '"' : '') + // cell title
							(unselectable ? '' : ' onclick="DP_jQuery_' + dpuuid + '.datepicker._selectDay(\'#' +
							inst.id + '\',' + printDate[1]+ ',' + printDate[0] + ', this);return false;"') + '>' + // actions
							(otherMonth && !showOtherMonths ? '&#xa0;' : // display for other months
							(unselectable ? '<span class="inforDatePicker-state-default">' + printDate[2] + '</span>' :
							'<a class="inforDatePicker-state-default'   + // highlight selected day
							(otherMonth ? ' inforDatePicker-priority-secondary' : '') + // distinguish dates from other months
							'" id="' +
							((dow + firstDay + 6) % 7 >= 5 ? 'inforDatePicker-week-end' : 'inforDatePicker-week-day') +
							'" href="#">' + printDate[2]  + '</a>')) + '</td>';

							printDate = this._getCalDate(printDate[0], printDate[1], printDate[2], 1 , this._get(inst, 'isHijri'));
						}
						calender += tbody + '</tr>';
					}
					drawMonth++;
					if (drawMonth > 11) {
						drawMonth = 0;
						drawYear++;
					}
					calender += '</tbody></table>';
				}
				group += calender;

				//if today is restricted disable the button...
				var enableToday = (beforeShowDay ? beforeShowDay.apply((inst.input ? inst.input[0] : null), [today]) : [true, '']);

				// add the today bar
				var todayBar = '';
				todayBar += '<div class="inforDatePickerButtonPanel">';

				todayBar += '<button class="inforDatePickerTodayButton inforFormButton '+(!enableToday[0] ? ' disabled"': '"') +'type="button" style="display: inline-block;"';
				if (enableToday[0])
					todayBar += 'onclick="DP_jQuery_' + dpuuid + '.datepicker._selectToday(\'#' +inst.id + '\');return false;")';
				todayBar += '>'+currentText+'</button>'

				if (this._get(inst, 'showQuickDates')) {
					todayBar += '<button id="quickDates" class="inforMenuButton inforFormButton" type="button"'
					todayBar += 'onclick="DP_jQuery_' + dpuuid + '.datepicker._quickDates(\'#' +inst.id + '\', this );")';
					todayBar += '><span class="innerText">' + Globalize.localize("QuickDates")+'</span><div class="inforMenuButtonArrow"></div></button>';
				}
				todayBar += '</div>';

				if (showTime) {
					var curTime = Globalize.format(selectedDate, this._get(inst, 'timeFormat'));
					todayBar += '<div class="dateTimePanel"><label class="inforLabel" style="float:none;width:auto;">'+Globalize.localize('Time')+'</label><input id="inforTimeInput" class="inforTextbox" style="width:80px" value="'+curTime+'"/>';

					if (showTimezone) {
						var zones = this._get(inst, 'timezones'),
							options = "";

						for (var i=0; i < zones.length; i++) {
							options += "<option value='" + zones[i].offset +"'"+ (inst.selectedTimezone === zones[i].offset  ? "selected" : "" ) +">" + zones[i].label +"</option>";
						}

						todayBar += '<br><label class="inforLabel" style="float:none;width:auto;">'+Globalize.localize('Timezone')+'</label><select id="inforTimezone" class="inforDropdownlist" style="width:80px" >' + options + '</select>';
					}
					todayBar += (this._get(inst, 'showUTCTime') ? " UTC" : "") +'</div>';
				}

				group += todayBar
				html += group;
			}

			html += buttonPanel;

			inst._keyEvent = false;
			return html;
		},
		/* Return if the mm/yy/dd is all the same..*/
	_equalDates: function (date1, date2) {
			var d1 = null, d2=null;

			if (Object.prototype.toString.call(date1) === '[object Date]') {//is a date object
				d1 = date1.getFullYear().toString() + date1.getMonth().toString() + date1.getDate().toString();
			} else {
				d1 = date1[0].toString() + date1[1].toString() + date1[2].toString();
			}

			if (Object.prototype.toString.call(date2) === '[object Date]') {
				d2 = date2.getFullYear().toString() + date2.getMonth().toString() + date2.getDate().toString();
			} else {
				d2 = date2[0].toString() + date2[1].toString() + date2[2].toString();
			}

			return d1==d2;
		},
		/* Return the next day no matter what calendar (Hijri) */
		_getCalDate: function (syear, smonth, sday, adjust, isHijri) {
			if (!isHijri) {
				var startDate = new Date(syear, smonth, sday);
				var newDate = null;
				if (Object.prototype.toString.call(startDate) === '[object Date]') {	//is a date
					newDate  = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()+(adjust==undefined ? 0 : adjust));
				} else {
					newDate  = new Date(startDate[0], startDate[1], startDate[2] + (adjust==undefined ? 0 : adjust));
				}

				newDate = this._daylightSavingAdjust(newDate);
				return [newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), newDate.getTime()];
			}
			else {
				return this._incrementHijriDate(syear, smonth, sday, adjust);
			}
		},
		/* Generate the month and year header. */
		_generateMonthYearHeader: function (inst, drawMonth, drawYear, minDate, maxDate,
			secondary, monthNames, monthNamesShort) {
			var html = '<div class="inforDatePicker-title">';
			var monthHtml = '',
				yearThenMonth = inst.settings.dateFormat.substr(0,1).toLowerCase() === "y",
				display = [];

			if (yearThenMonth) {
				display[1] = monthNames[drawMonth];
				display[0] = drawYear;
			} else {
				display[0] = monthNames[drawMonth];
				display[1] = drawYear;
			}

			// month selection
			monthHtml += '<span class="inforDatePicker-month">' + display[0] + '</span>';

			html += monthHtml + '&#xa0;';
			html += '<span class="inforDatePicker-year">' + display[1] + '</span><button type="button" title="'+ Globalize.localize("SelectMonthYear") +'" class="inforIconButton settings inforDatePickerPanelButton"><span></span></button>';
			html += '</div>';
			return html;
		},

		/* Adjust one of the date sub-fields. */
		_adjustInstDate: function (inst, offset, period) {
			var year = inst.drawYear + (period == 'Y' ? offset : 0);
			var month = inst.drawMonth + (period == 'M' ? offset : 0);

			var day = Math.min(inst.selectedDay, this._getDaysInMonth(year, month, false)) +
			(period == 'D' ? offset : 0);
			var date = this._restrictMinMax(inst,
			this._daylightSavingAdjust(new Date(year, month, day)));
			inst.selectedDay = date.getDate();
			inst.drawMonth = inst.selectedMonth = date.getMonth();
			inst.drawYear = inst.selectedYear = date.getFullYear();

			//corrects draw year for Hijri (Arabic) calendar
			inst.drawYear = parseInt(Globalize.format(date,'yyyy'), 10);

			if (period == 'M' || period == 'Y')
				this._notifyChange(inst);
		},

		/* Ensure a date is within any min/max bounds. */
		_restrictMinMax: function (inst, date) {
			var minDate = this._getMinMaxDate(inst, 'min');
			var maxDate = this._getMinMaxDate(inst, 'max');
			var newDate = (minDate && date < minDate ? minDate : date);
			newDate = (maxDate && newDate > maxDate ? maxDate : newDate);

			return newDate;
		},

		/* Notify change of month/year. */
		_notifyChange: function (inst) {
			var onChange = this._get(inst, 'onChangeMonthYear');
			if (onChange)
				onChange.apply((inst.input ? inst.input[0] : null),
				[inst.selectedYear, inst.selectedMonth + 1, inst]);
		},

		/* Determine the number of months to show. */
		_getNumberOfMonths: function (inst) {
			var numMonths = this._get(inst, 'numberOfMonths');
			return (numMonths == null ? [1, 1] : (typeof numMonths == 'number' ? [1, numMonths] : numMonths));
		},

		/* Determine the current maximum date - ensure no time components are set. */
		_getMinMaxDate: function (inst, minMax) {
			return this._determineDate(inst, this._get(inst, minMax + 'Date'), null);
		},
		/* Detach a datepicker from its control.
		@param  target    element - the target input field or division or span */
		_destroyDatepicker: function (target) {
			var $target = $(target);
			var inst = $.data(target, PROP_NAME);
			if (!$target.data(this.markerClassName)) {
				return;
			}
			var nodeName = target.nodeName.toLowerCase();
			$.removeData(target, PROP_NAME);
			if (nodeName == 'input') {
				if (inst && inst.append)
					inst.append.remove();

				if (inst  && inst.trigger)
					inst.trigger.remove();
				$target.removeData(this.markerClassName).
				unbind('focus', this._showDatepicker).
				unbind('keydown', this._doKeyDown).
				unbind('keypress', this._doKeyPress).
				unbind('keyup', this._doKeyUp);
			} else if (nodeName == 'div' || nodeName == 'span')
				$target.removeData(this.markerClassName).empty();
		},
		/* Find the number of days in a given month. */
		_getDaysInMonth: function (year, month, isHijriCal) {
			if (isHijriCal) {
				return this._getDaysInMonthHijri(year, month);
			} else {
			    var daysinMonth = 32 - new Date(year, month, 32).getDate();
			    return daysinMonth;
			}
		},
		/* Find the day of the week of the first of a month. */
		_getFirstDayOfMonth: function (year, month, isHijriCal) {
			if (isHijriCal) {
				return this._getFirstDayOfMonthHijri(year, month);
			} else {
				return new Date(year, month, 1).getDay();
			}
		},

		 /* In the Hijri bitmap calendar array ("convert._yearInfo") calculate its index; revert to 0 if out-of-range */
		 _getHijriYearIndex: function (hijriYear) {
			var yrIx = hijriYear - 1318;
			if (yrIx < 0 || yrIx >= Globalize.culture().calendar.convert._yearInfo.length)
				return 0; // for an out-of-range year, simply returns 0
			else
				return yrIx;
		 },

		 /* Get the month pattern for the specified year */
		 _getDaysInMonthForHijriYear: function (hijriYear) {
		    var monthLengthBitmap = Globalize.culture().calendar.convert._yearInfo[this._getHijriYearIndex(hijriYear)][0];
			for (var M = 0; M < 12; M++)
			{
				monthDayCounts[M] = 29 + (monthLength & 1);
				monthLength = monthLength >> 1;
			}
			return monthDayCounts;
		 },

		/* For the Hijri calendar, find the number of days in the Hijri year,month; Month is 0-based */
		 _getDaysInMonthHijri: function (year, month) {
			var monthLengthBitmap = Globalize.culture().calendar.convert._yearInfo[this._getHijriYearIndex(year)][0];
			var monthDayCount = 0;
			for (var M = 0; M <= month; M++) {
				monthDayCount = 29 + (monthLengthBitmap & 1);
				if (M == month) {
					return monthDayCount;
				}
				monthLengthBitmap = monthLengthBitmap >> 1;
			}
			return 0;
		 },

        /* For the Hijri calendar, find the day of the week of the first of a month. */
        _getFirstDayOfMonthHijri: function (year, month) {
			var firstDayInGregorian = Globalize.culture().calendar.convert.toGregorian(year, month, 1);
			return (firstDayInGregorian === null ? 1 : firstDayInGregorian.getDay());
		 },

		 /* For the Hijri calendar, do LIMITED date increment/decrement (within next or prior month, only); returns a date-style array */
		 _incrementHijriDate: function(year, month, day, increment) {
			 var newDay = day + increment; //increment can be negative
			 if (newDay < 1) {
				 month--;
				 if (month < 0) {
					 month = 12 + month;
					 year--;
				 }
				 var daysInMo = this._getDaysInMonthHijri(year, month);
				 newDay = daysInMo + newDay;
			 } else {
				 var daysInMo = this._getDaysInMonthHijri(year, month);
				 if (newDay > daysInMo) {
					 newDay -= daysInMo;
					 month++;
					 if (month > 11) {
						 year++;
						 month -= 12;
					 }
				 }
			 }
			 var pseudoDate = new Array();
			 pseudoDate[0] = year;
			 pseudoDate[1] = month;
			 pseudoDate[2] = newDay;
			 return pseudoDate;
		 },

		/* Determines if we should allow a "next/prev" month display change. */
		_canAdjustMonth: function (inst, offset, curYear, curMonth, isHijriCal) {
			var numMonths = this._getNumberOfMonths(inst);
			var date = this._daylightSavingAdjust(new Date(curYear, curMonth + (offset < 0 ? offset : numMonths[0] * numMonths[1]), 1));
			if (offset < 0)
				date.setDate(this._getDaysInMonth(date.getFullYear(), date.getMonth(), isHijriCal));
			return this._isInRange(inst, date);
		},

		/* Is the given date in the accepted range? */
		_isInRange: function (inst, date) {
			var minDate = this._getMinMaxDate(inst, 'min');
			var maxDate = this._getMinMaxDate(inst, 'max');
			return ((!minDate || date.getTime() >= minDate.getTime()) &&
			(!maxDate || date.getTime() <= maxDate.getTime()));
		},

		/* Provide the configuration settings for formatting/parsing. */
		_getFormatConfig: function (inst) {
			var shortYearCutoff = this._get(inst, 'shortYearCutoff');
			shortYearCutoff = (typeof shortYearCutoff != 'string' ? shortYearCutoff :
			new Date().getFullYear() % 100 + parseInt(shortYearCutoff, 10));
			return { shortYearCutoff: shortYearCutoff,
				dayNamesShort: this._get(inst, 'dayNamesShort'), dayNames: this._get(inst, 'dayNames'),
				monthNamesShort: this._get(inst, 'monthNamesShort'), monthNames: this._get(inst, 'monthNames')
			};
		},
		/* Format the given date for display. */
		_formatDate: function (inst, day, month, year) {
			if (!day) {
				day = inst.currentDay = inst.selectedDay;
				month = inst.currentMonth = inst.selectedMonth;
				year = inst.currentYear = inst.selectedYear;
			}

			var date = null,
				formattedDate = "",
				format = this._get(inst, 'dateFormat');

			if (!this._get(inst, 'isHijri')) {
				date = (day ? (typeof day == 'object' ? day :
					this._daylightSavingAdjust(new Date(year, month, day))) :
					this._daylightSavingAdjust(new Date(inst.currentYear, inst.currentMonth, inst.currentDay)));

				if (this._get(inst, 'showTimeInput'))  {
					date = new Date(year, month, day, inst.selectedHours, inst.selectedMinutes, inst.selectedSeconds);
				}

			}else {
				date = Globalize.culture().calendar.convert.toGregorian(year, month, parseInt(day, 10), inst.selectedHours, inst.selectedMinutes, inst.selectedSeconds);
			}


			formattedDate = this.formatDate(date, format , inst.settings.culture);
			if (this._get(inst, 'showTimezone')) {
				var format = format.split('z').length -1,
					zone = $("#inforTimezone").val();

				if (format == 3) {
					formattedDate = formattedDate.substr(0, formattedDate.length - 6) + zone;
				}
			}

			//Check if the date is over max
			if (this._get(inst, 'isHijri')) {
				var maxYear = "1450",
					curYear = this.formatDate(date, "yyyy", inst.settings.culture);

				if (curYear > maxYear) {
					formattedDate = null;
				}
			}
			return formattedDate;
		}
	});

	/* jQuery extend now ignores nulls! */
	function extendRemove(target, props) {
		$.extend(target, props);
		for (var name in props)
			if (props[name] == null || props[name] == undefined)
				target[name] = props[name];
		return target;
	};

	$.fn.datepicker = function (options) {

		/* Verify an empty collection wasn't passed - Fixes #6976 */
		if (!this.length) {
			return this;
		}

		/* Initialise the date picker. */
		if (!$.datepicker.initialized) {
			$(document).mousedown($.datepicker._checkExternalClick).
			find('body').append($.datepicker.dpDiv);
			$.datepicker.initialized = true;
		}

		var otherArgs = Array.prototype.slice.call(arguments, 1);
		if (typeof options == 'string' && (options == 'isDisabled' || options == 'getDate' || options == 'widget'))
			return $.datepicker['_' + options + 'Datepicker'].
			apply($.datepicker, [this[0]].concat(otherArgs));
		if (options == 'option' && arguments.length == 2 && typeof arguments[1] == 'string')
			return $.datepicker['_' + options + 'Datepicker'].
			apply($.datepicker, [this[0]].concat(otherArgs));
		return this.each(function () {
			if (options==undefined)
				return;

			typeof options == 'string' ?
			$.datepicker['_' + options + 'Datepicker'].
				apply($.datepicker, [this].concat(otherArgs)) :
			$.datepicker._attachDatepicker(this, options);
		});
	};

	$.datepicker = new Datepicker(); // singleton instance
	$.datepicker.initialized = false;
	$.datepicker.uuid = new Date().getTime();

	// Add another global to avoid noConflict issues with inline event handlers
	window['DP_jQuery_' + dpuuid] = $;
})(jQuery);
