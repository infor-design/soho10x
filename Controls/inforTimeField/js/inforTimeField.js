/*
* Infor Time Field
*/
(function ($) {
	$.widget("ui.inforTimeField", {
		options: {
			timeFormat: Globalize.culture().calendar.patterns.t, //Globalize Time Format https://github.com/jquery/globalize#dates
			interval: 30, //Interval in minutes between the times
			range: [8, 20], //Limit the intervals to a range. Fx working hours 9-5 (24 hour clock) 0-23
			disableKeys: [],
		},
		_init: function () {
			var self = this;
			self.input = $(this.element).attr("aria-haspopup", true);

			self.showPeriod = (self.options.timeFormat.indexOf("t") > -1);
			self.isHHLeadingZero = self.options.timeFormat.toLowerCase().indexOf("hh") > -1;
			self.isMMLeadingZero = self.options.timeFormat.toLowerCase().indexOf("mm") > -1;
			self.is24HZero = self.options.timeFormat.indexOf("H") > -1;

			//make sure its not initialized twice.
			if (self.input.data("isInitialized")) {
				return;
			}

			self._refreshTimes();

			//add trigger button styling
			self.input.data("isInitialized", true).inforTriggerField({
				editable: true,
				click: function () {
					var popupContents = self._addDropdowns();

					$(self.input).inforPopover({placement: "right", draggable: false, animate: false,  trigger: "manual", content: popupContents,
						onShow: function (e, ui) {
							ui.find(".inforDropDownList").inforDropDownList();
							ui.find("input:first").focus();
							self.element.addClass('is-open');
						},
						onClose: function (e, ui) {
							var hh = ui.find("select").eq(0).val(),
							mm = ui.find("select").eq(1).val(),
							tt = ui.find("select").eq(2).val(),
							date = "";

							self._setValue(hh, mm, tt); 
							self.element.removeClass('is-open');
						}});

					//adjust width
					$(".inforTimePopup").closest(".inforPopover").width("219px");

					$("#quickTimeSelect").on("click", function(){
						var hh = $(this).closest(".inforTimePopup").children("select")[0].value,
						mm = $(this).closest(".inforTimePopup").children("select")[1].value,
						tt = self.showPeriod ? $(this).closest(".inforTimePopup").children("select")[2].value : "";
						self._setValue(hh, mm, tt);  
					});
					$("#cancelTimeSelect").on("click", function(){
						self.input.focus();
						$(".inforTimePopup").closest(".inforPopover").remove();
						$(document).off('click.inforPopover').off('keydown.inforPopover');
						$(window).off('resize.inforPopover');
					});
				}
			});

		self._handleEdits();
		if (self.element.val()){
			self._validate();
		}
		},
		_setValue: function (hh, mm, tt){
			var self = this;
			var date = hh + ":" + mm;
			if (self.showPeriod) {
				date += " " + tt;
			}
			self.input.val(date).focus();
			$(".inforTimePopup").closest(".inforPopover").remove();
			$(document).off('click.inforPopover').off('keydown.inforPopover');
			$(window).off('resize.inforPopover');
		},
		_addDropdowns: function () {
			//append three drop downs.
			var self = this,
			i,
			hours = $("<select class='inforDropDownList'></select>"),
			mins = $("<select class='inforDropDownList'></select>"),
			ampm = $("<select class='inforDropDownList'></select>"),
			hhAdded = [], mmAdded = [],
			formattedD = self.input.val();
			selhh = formattedD.substr(0, formattedD.indexOf(":"));
			selmm = formattedD.substr(formattedD.indexOf(":")+1,2);
			seltt = formattedD.substr(formattedD.length-2);

			self._refreshTimes();

			for (i = 0; i < self.times.length-1 ; i++) {
				var hh = self.times[i].substr(0, self.times[i].indexOf(":")),
					mm = self.times[i].substr(self.times[i].indexOf(":") + 1, 2),
					tt = self.times[i].substr(self.times[i].length-2),
					opt;

				if (self.showPeriod && ampm.find("option:contains('" + tt + "')").length === 0 ) {
					opt = $("<option>"+ tt +"</option>");
					if (tt === seltt) {
						opt.attr("selected","selected");
					}
					ampm.append(opt);
				}
				if ($.inArray(mm, mmAdded) == -1 ) {
					opt = $("<option>"+ mm +"</option>");
					mmAdded.push(mm);
					if (mm === selmm) {
						opt.attr("selected","selected");
					}
					mins.append(opt);
				}
				if ($.inArray(hh, hhAdded) == -1) {
					opt = $("<option>"+ hh +"</option>");
					hhAdded.push(hh);
					if (hh === selhh) {
						opt.attr("selected","selected");
					}
					hours.append(opt);
				}
			}
			self.popup = $("<div class='inforTimePopup'>").append(hours,  "<span>:</span>", mins)
			if (self.showPeriod) {
				self.popup.append(ampm);
			}

			var saveBtn = "<button class='inforFormButton default' id='quickTimeSelect' type='button'>Set</button>";		
			var cancelBtn = "<button class='inforTextButton' id='cancelTimeSelect' type='button'>Cancel</button>";		
			self.popup.append("<div style='margin-top: 10px;'>" + saveBtn + cancelBtn + "</div>");

			return self.popup;
		},
		_refreshTimes: function() {
			var self = this,
			i = 0,
			hour = 0,
			formattedD = null,
			hh, mm, tt,
			date = new Date(2013, 1, 1, 0, 0, 0, 0);

			self.times = [], self.hours = [], self.minutes = [], self.periods = [];

			for (i = 0; i <= (1440 / self.options.interval) ; i++) {
				hour = date.getHours(),
				formattedD = Globalize.format(date, self.options.timeFormat);
				hh = formattedD.substr(0, formattedD.indexOf(":"));
				mm = formattedD.substr(formattedD.indexOf(":")+1,2);
				tt = formattedD.substr(formattedD.length-2);

				if (hour >= self.options.range[0] && hour <= self.options.range[1]) {
					self.times.push(formattedD);
					if ($.inArray(hh, self.hours) === -1) {
						self.hours.push(hh);
					}
					if ($.inArray(mm, self.minutes) === -1) {
						self.minutes.push(mm);
					}
				}
				date.setMinutes(date.getMinutes() + self.options.interval);
			}

			if (Globalize.culture(Globalize.cultureSelector).calendars.standard.AM) {
				self.periods.push(Globalize.culture(Globalize.cultureSelector).calendars.standard.AM[0]);
				self.periods.push(Globalize.culture(Globalize.cultureSelector).calendars.standard.PM[0])
			}
		},
		_getCursorPosition: function() {
			var self = this,
			input = self.input.get(0);

			if ('selectionStart' in input) {// Standard-compliant browsers
				return input.selectionStart;
			} else if (document.selection) {// IE fix
				input.focus();
				var sel = document.selection.createRange(),
				selLen = document.selection.createRange().text.length;

				sel.moveStart('character', - input.value.length);
				return sel.text.length - selLen;
			}
		},
		_handleEdits: function () {
			var self = this,
			oldValue = self.input.val();

			self.input.on("focus click",function () {
				if (self.input.prop("disabled")) {
					return;
				}

				var pos = self._getCursorPosition();
				self._highlight((pos >= 0 && pos <= 2 ? 'hour' : (pos >= 3 && pos <= 5 ? 'minute' : 'period')));
			});

			self.input.blur(function () {
				if(self.element.val().replace(/\s/g, '') !== "" ){
					self._validate();
				}
				if (oldValue !== self.input.val()) {
					self.input.trigger("change");
				}
			});

			self.input.keydown(function (e) {
				if (self.input.prop("disabled") || self.input.prop("readonly") || self.options.disableKeys.indexOf(e.keyCode) > -1) {
					return;
				}

				//handle keys
				switch (e.keyCode) {
					case 9: //tab
						switch (self.highlightedUnit) {
							case 'hour':
								if (!e.shiftKey) {
									e.preventDefault();
									self._highlight('minute');
								}
								break;
							case 'minute':
								if (e.shiftKey) {
									e.preventDefault();
									self._highlight('hour');
								} else if (self.showPeriod){
									e.preventDefault();
									self._highlight('period');
								}
								break;
							case 'period':
								if (e.shiftKey) {
									self._highlight('minute');
									e.preventDefault();
								}
								break;
						}
						break;
					case 37: // left arrow
						e.preventDefault();
						self._highlight((self.highlightedUnit === "hour" && self.showPeriod ? "period" : (self.highlightedUnit === "minute" ? "hour": "minute")));
						break;
					case 38: // up arrow
						e.preventDefault();
						switch (self.highlightedUnit) {
							case 'hour':
								self._increment('hour', 1);
								break;
							case 'minute':
								self._increment('minute', 1);
								break;
							case 'period':
								self._increment('period', 1);
								break;
						}
						break;
					case 39: // right arrow
						e.preventDefault();
						self._highlight((self.highlightedUnit === "hour" ? "minute" : (self.highlightedUnit === "minute" && self.showPeriod ? "period" : "hour")));
						break;
					case 40: // down arrow
						e.preventDefault();
						switch (self.highlightedUnit) {
							case 'hour':
								self._increment('hour', -1);
								break;
							case 'minute':
								self._increment('minute', -1);
								break;
							case 'period':
								self._increment('period', -1);
								break;
						}
						break;
				}
			});
		},
		_validate: function() {
			var self = this,
				timeArray, hour, min, period,
				time = self.input.val();

			if (self.input.is('[readonly]')) {
				return;
			}

			if (self.showPeriod) {
				timeArray = time.substr(0, time.indexOf(":")+3).split(':');
				var temp = time.substr(time.length-1, time.length);
				period = (temp.toUpperCase() == 'M') ? time.substr(time.length-2, time.length) : temp;
			} else {
				timeArray = time.split(':');
			}

			hour = parseInt(timeArray[0], 10);
			min = parseInt(timeArray[1], 10);

			if (isNaN(hour)) {
				hour = parseInt(self.hours[0], 10);
			}
			if (isNaN(min)) {
				min = parseInt(self.minutes[0], 10);
			}

			if (self.showPeriod) {	//handle over the time
				if (hour > 12) {
					hour = 12;
				} else if (hour < 1) {
					hour = 12;
				}
			}

			var amPers = Globalize.culture(Globalize.cultureSelector).calendars.standard.AM,
				pmPers = Globalize.culture(Globalize.cultureSelector).calendars.standard.AM,
				itsFine = false;

			if ($.inArray(period, amPers) != -1 || $.inArray(period, pmPers) != -1) {
				itsFine = true;
			}

			if (!itsFine) {
				if (period === 'am' || period === 'a') {
					period = 'AM';
				} else if (period === 'pm' || period === 'p') {
					period = 'PM';
				}

				if (period !== 'AM' && period!== 'PM') {
					period = 'AM';
				} else {
					if (hour >= 24) {
						hour= 23;
					} else if (hour < 0) {
						hour = 0;
					}
				}
			}

			if (self.isHHLeadingZero && hour < 9) {
				hour = "0" + hour;
			}

			if (self.isMMLeadingZero && min < 9) {
				min = "0" + min;
			}

			if (min < 0) {
				min = 0;
			} else if (min >= 60) {
				min = 59;
			}

			self.input.val(hour + ":" + min + (self.showPeriod ? " "+ period.toUpperCase() : ""));
		},
		_increment: function(unit, increment) {
			var self = this,
				val = this.input.val(),
				cur, pos;

			if (unit === "hour") {
				increment = (60 / self.options.interval) * increment;
				pos = $.inArray(val, self.times);
				if (self.times[pos + increment]) {
					val = self.times[pos + increment];
					self.input.val(val);
				}
			}
			if (unit === "minute") {
				pos = $.inArray(val, self.times);
				if (self.times[pos + increment]) {
					val = self.times[pos + increment];
					self.input.val(val);
				}
			}
			if (unit === "period") {
				cur = val.substr(val.length-2,2);
				pos = $.inArray(cur, self.periods);
				if (self.periods[pos + increment]) {
					val = val.substr(0, val.length-2) + self.periods[pos + increment] ;
				} else {
					val = val.substr(0, val.length-2) + self.periods[pos - increment] ;
				}
				self.input.val(val);
			}
			self._highlight(unit);
		},
		_select: function(obj, start, end) {
			if (obj !== document.activeElement)
				return;
			if (obj.setSelectionRange) {
				obj.setSelectionRange(start, end);
			} else if (obj.createTextRange) {
				obj = obj.createTextRange();
				obj.collapse(true);
				obj.moveEnd('character', end);
				obj.moveStart('character', start);
				obj.select();
			}
		},
		_highlight: function (unit) {
			var input = this.input.get(0),
				self = this,
				formattedD = $(input).val();

			this.highlightedUnit = unit;

			setTimeout(function () {
				if (unit === "hour") {
					self._select(input, 0, formattedD.indexOf(":"));
				}
				if (unit === "minute") {
					self._select(input, formattedD.indexOf(":")+1, formattedD.indexOf(":")+3);
				}
				if (unit === "period") {
					self._select(input, formattedD.length-2, formattedD.length);
				}
			}, 0);
		}
	});
}(jQuery));