/*
* Infor Validation Plugin.
* A smaller and more focused to infor standards version of jquery.validation.
* For an explanation of the starts of this code see: http://bit.ly/d1YLBM
*/
(function ($) {
	/* Validation Singleton
		TODO: Add some of the rules from: http://ajax.aspnetcdn.com/ajax/jquery.validate/1.9/jquery.validate.js
	*/
	var Validation = function () {
		var rules = {
			email: {
				check: function (value) {
					this.msg = Globalize.localize("EmailValidation");

					if (value) {
						return testPattern(value, "[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])"); //ignore jslint
					} else {
						return true;
					}
				},
				msg: Globalize.localize("EmailValidation")
			},
			url: {
				check: function (value) {
					this.msg = Globalize.localize("UrlValidation");

					if (value) {
						return testPattern(value, "^https?://(.+\.)+.{2,4}(/.*)?$"); //ignore jslint
					} else {
						return true;
					}

				},
				msg: Globalize.localize("UrlValidation")
			},
			required: {
				check: function (value) {
					this.msg = Globalize.localize("Required");

					if (typeof value == "string" && $.trim(value).length === 0) {
						return false;
					}

					if (value) {
						return true;
					} else {
						return false;
					}

				},
				msg: Globalize.localize("Required")
			}
		};

		return {
			addRule: function (name, rule, async) {
				rules[name] = rule;

				if (async) {
					rules[name].async = true;
				}

			},
			getRule: function (name) {
				return rules[name];
			},
			removeMessage: function (selector) {
				selector.each(function () {
					var $field = $(this),
						$selected, $checkbox, $next, tabPanel, tabid, anchor, fieldset, label;

					$field.removeClass("error");
					$("#inforTooltip").hide();

					if ($field.hasClass("inforRadioButton")) {
						var name = $field.attr("name"),
							last = $('input[name="' + name + '"]:last');

						last.parent().next(".inforErrorIcon").remove();
					}
					
					if ($field.hasClass("inforCheckbox")) {
						$field.next(".inforCheckboxLabel").next(".inforErrorIcon").remove();
					}

					if ($field.hasClass("inforListBox")) {
						$field.next(".inforListBox").removeClass("error").next(".inforErrorIcon").remove();
					}

					if ($field.hasClass("inforFieldSet")) {
						$field.find(".inforErrorIcon").remove();
					}

					if ($field.hasClass("inforDropDownList")) {
						$next = $field.next();
						$next.removeClass("error");
						$next.find('.inforErrorIcon').remove();
						$field.removeClass("error");
					}

					if ($field.hasClasses(['inforLookupField', 'inforDateField', 'inforTimeField', 'inforUrlField', 'inforSpinner', 'inforSearchField', 'inforEmailField', 'inforCalculatorField'])) {
						$field.closest(".inforTriggerField").removeClass("error").find('.inforErrorIcon').remove();
					}

					//textbox and textarea fall through
					if (Globalize.culture().isRTL && $field.next().hasClass("isDirty")) {
						$field.next().next(".inforErrorIcon").remove();
					} else {
						$field.next(".inforErrorIcon").remove();
					}

					//if we are in a field set remove error indicator as long as there are no more errors.
					fieldset = $field.closest(".inforFieldSet");
					if (fieldset.length > 0) {
						label = fieldset.find('.inforFieldSetLabel:first');
						if (fieldset.find(".content:first").find(".inforErrorIcon").length === 0) {
							label.find(".inforErrorIcon").remove();
						}
					}

					//if we are on a tab remove it as long as there are no more errors.
					tabPanel = $field.closest(".ui-tabs-panel");
					if (tabPanel.length > 0) {
						tabid = tabPanel.attr("id");
						anchor = $('a[href="#' + tabid + '"]');

						if (anchor.next().hasClass("inforErrorIcon") && tabPanel.find(".inforErrorIcon").length === 0) {
							anchor.next().remove();
						}
					}
					
					if ($field.data("uiInforToolTip")) {
						$field.data("uiInforToolTip").enable();
					}
				});
			},
			showMessage: function (selector, messages, showTooltip) {
				selector.each(function () {
					var $field = $(this),
					icon = $("<div class='inforErrorIcon'></div>"),   //add the div to the page.
					maxW, maxAttr, $selected, $checkbox, tabid, fieldset, label;

					icon.attr("title", messages).css("display", "inline-block");

					//attach the tooltip and positioning - make sure the width is not too much bigger than the field. It will wrap.
					maxW = $field.width() + 20;

					if ($field.hasClass("inforCheckbox")) {
						maxW = $field.closest("div").next().width() + 20; //use the label width as the control width
						if (maxW < 200) {
							maxW = 200;
						}
					}

					if ($field.hasClass("inforRadioButton")) {
						maxW = 200;
					}

					maxAttr = $field.attr("data-tooltip-maxwidth");
					if (maxAttr) {
						maxW = maxAttr;
					}

					icon.data("field", ($field.hasClass("inforDropDownList") ? $field.next().find("input") : $field));
					icon.inforToolTip({ maxWidth: maxW });

					//remove the previous error if any...
					$field.validationMessage('remove');

					if ($field.hasClass("inforRadioButton")) {
						var name = $field.attr("name"),
							last = $('input[name="' + name + '"]:last');

						last.parent().after(icon.css({"left" : "10px" , "top" : "2px"}));
					} else if ($field.hasClass("inforCheckbox")) {
						$field.next(".inforCheckboxLabel").after(icon.css({"margin-top": "-2px", "margin-left": "10px"}));
					} else if ($field.hasClass("inforListBox")) {
						$field.next(".inforListBox").addClass("error").after(icon);
						icon.css({
							"position": "relative",
							"left": (!Globalize.culture().isRTL ? "-3px" : "32px"),
							"top": "-" + ($field.height() - 6) + "px"
						});
					} else if ($field.hasClass("inforFieldSet")) {
						var fs = $field.find(".inforFieldSetLabel:first");
						fs.prepend(icon);
						icon.css({
							"position": "relative",
							"left": "-2px",
							"top": "-1px"
						});
					} else if ($field.hasClass("inforDropDownList")) {
						icon.css({
							"left": "100%",
							"top": "3px",
							"margin-left": "-31px",
							"position": "absolute"
						});
						$field.next().addClass("error").find(".selectedSingle div").after(icon);
					} else if ($field.hasClass("inforFileField")) {
						icon.css({
							"left": (!Globalize.culture().isRTL ? "18px" : "33px"),
							"top": "3px",
							"margin-left": "-12px"
						});
						$field.addClass("error");
						$field.closest(".inforTriggerField").addClass("error").append(icon);
					} else if ($field.hasClass("inforSpinner")) {
						icon.css({
							"left": (!Globalize.culture().isRTL ? "-17px" : "33px"),
							"top": "2px",
							"margin-left": "-12px",
							"margin-bottom": (!Globalize.culture().isRTL ? "-3px" : "-2px"),
							"position": "relative"
						});
						$field.closest(".inforTriggerField").addClass("error").find(".inforTriggerButton:first").before(icon);
					} else if ($field.hasClasses(['inforLookupField', 'inforDateField', 'inforTimeField', 'inforUrlField', 'inforSearchField', 'inforEmailField', 'inforFileField', 'inforCalculatorField'])) {
						icon.css({
							"left":(!Globalize.culture().isRTL ? "-19px" : "33px"),
							"top": "2px",
							"margin-left": "-12px",
							"margin-bottom": (!Globalize.culture().isRTL ? "-3px" : "-2px"),
							"position": "relative"
						});
						$field.closest(".inforTriggerField").addClass("error").find(".inforTriggerButton").before(icon);
					} else {
						$field.after(icon);
						$field.addClass("error");
					}

					//make sure the width is no bigger than the field.
					if ($field.hasClass("inforTextArea")) {
						icon.css({
							"position": "relative",
							"top": "-" + ($field.height() - 10) + "px"
						});
					}

					//if we are on a tab add it
					var tabPanel = $field.closest(".ui-tabs-panel");
					if (tabPanel.length > 0) {
						tabid = tabPanel.attr("id");
						var anchor = $('a[href="#' + tabid + '"]');
						if (!anchor.next().hasClass("inforErrorIcon")) {
							anchor.after('<div class="inforErrorIcon" style="display: inline-block; float: ' + (Globalize.culture().isRTL ? 'right' : 'left') + '; margin: ' + (Globalize.culture().isRTL ? '0px 2px 0px -5px' : '0px 3px 0 0px') + ';' + (Globalize.culture().isRTL ? 'left: -1px;' : 'left: -4px') +'"></div>');
						}
					}

					//if on a field set add it.
					fieldset = $field.closest(".inforFieldSet");
					if (fieldset.length > 0) {
						label = fieldset.find('.inforFieldSetLabel:first');
						if (label.find(".inforErrorIcon").length === 0) {
							label.append('<div class="inforErrorIcon" style="display: inline-block; float: none; left: 0; margin: 0 6px"></div>');
						}
					}

					//hide on focus if too small
					$field.off("focus.error").on("focus.error", function () {
						icon.fadeOut();//css("opacity", 0);
						if (showTooltip) {
							$("#inforTooltip").fadeOut();
						}
						$field.validationMessage('remove');
					});

                    $field.next().find("input").off("focus.error").on("focus.error", function () {
                      icon.fadeOut();//css("opacity", 0);
                      if (showTooltip) {
                        $("#inforTooltip").fadeOut();
                      }
                      $field.validationMessage('remove');
                    });
          
					//Immediately show the tooltip.
					if (showTooltip) {
						//do this on a timeout so the last click doesnt catch and close it immediately.
						var bindClick = function () {
							$(document).unbind("click.tooltip");
							$(document).bind("click.tooltip", function () {
								$("#inforTooltip").hide();
								$(document).unbind("click.tooltip");
							});
						};

						setTimeout(bindClick, 200);
						if (icon.is(":visible")) {
							icon.inforToolTip("open");
						}
					}
					if ($field.data("uiInforToolTip")) {
						$field.data("uiInforToolTip").disable();
					}
				});
			}
		};
	};

	/* Form factory  */
	var Form = function (form) {
		var fields = [];
		form.find("[data-validation]").each(function () {
			var field = $(this);
			if (field.attr('data-validation') !== undefined) {
				fields.push(new Field(field));
			}
		});
		this.fields = fields;
	};

	Form.prototype = {
		validate: function () {
			for (var field = 0; field < this.fields.length; field = field + 1) {
				this.fields[field].validate();
			}
		},
		/*
			Every method we call and are pushing on to deferreds returns in either synchronous
			or async fashion.  If it's synchronous, it acts like a normal sync call would, resolving or rejecting
			the jQuery deferred object before its promise is even returned.  If it's async, the method
			exits and leaves us with a promise, jQuery waits until it is resolved or
			rejected, which we handle based on the state of the validation.
		*/
		validateAsync: function (callback) {
			var deferreds = [];
			for (var field = 0; field < this.fields.length; field++) {
				var dfds = this.fields[field].validate();
				for (var i = 0; i < dfds.length; i++) {
					deferreds.push(dfds[i]);
				}
			}

			$.when.apply($, deferreds).then(function () {
				callback(true);
			}, function () {
				callback(false);
			});
		},
		isValid: function () {
			for (var field = 0; field < this.fields.length; field++) {
				if (!this.fields[field].valid) {
					//this.fields[field].field.focus();
					return false;
				}
			}
			return true;
		}
	};

	/* Field factory */
	var Field = function (field) {
		this.field = field;
		this.valid = false;

		var validationEvents = this.field.attr("data-validation-events");
		if (!validationEvents) {
			validationEvents = "change blur"; //could do keyup
		}

		if (validationEvents == "none") {
			return;
		}

		var events = validationEvents.split(" ");

		for (var i = 0; i < events.length; i++) {
			this.attach(events[i]);
		}
	};

	Field.prototype = {
		attach: function (event) {
			var obj = this,
				fireOnReadonly = obj.field.attr("data-validation-onreadonly");

			if (event == "change") {
				obj.field.unbind("change.validation");
				obj.field.bind("change.validation", function (event) {
					if ($(this).attr("readonly") && fireOnReadonly != "true") {
						return;
					}
					return obj.validate(event);
				});
			}
			if (event == "keyup") {
				obj.field.unbind("keyup.validation");
				obj.field.bind("keyup.validation", function () {
					if ($(this).attr("readonly") && fireOnReadonly != "true") {
						return;
					}

					return obj.validate(event);
				});
			}
			if (event == "blur") {
				var inputElem = obj.field;
				if (obj.field.hasClass("inforDropDownList")) {
					inputElem = obj.field.next().find("input");
				}

				inputElem.unbind("blur.validation");
				inputElem.bind("blur.validation", function () {
					var $this = $(this);

					setTimeout(function () {
						var ac = $this.data("autocomplete"),
							dp = $this.data("datepicker");
						
						if ($("#lookupGridDivId").is(":visible")) {
							return;
						}
						
						if ($this.closest(".isOpen").length == 1) {
							return;
						}
						
						if (ac && ac.menu && ac.menu.element.is(":visible")) {
							return;
						}

						if (dp && $("#inforDatePicker-div").is(":visible")) {
							return;
						}

						if (!ac && $this.attr("readonly") && !$this.hasClass("selectOnly") && fireOnReadonly != "true") {
							return;
						}
						obj.validate(event);
					}, 100);
				});
			}
		},
		/* Test the Field and Add the validation Messages */
		addError: function (obj, errors, errorlist, event) {
			if (errors.length) {
				//Add the error message
				for (var error = 0; error < errors.length; error++) {
					errorlist = errorlist + "<li>" + errors[error] + "</li>";
				}

				var hasErrorBeenShown = obj.field.data("hasErrorBeenShown");
				var showTip = false;
				if (!hasErrorBeenShown && event == "blur") {
					showTip = true;
				}

				obj.field.validationMessage("show", errorlist, showTip);
				obj.field.data("errorlist", errorlist);
				obj.field.data("hasErrorBeenShown", true);
				obj.valid = false;

			} else {
				obj.field.validationMessage("remove");
				obj.valid = true;
			}
		},
		validate: function () {
			var obj = this,
				field = obj.field,
				errorlist = "",
				types = field.attr("data-validation").split(" "),
				container = field.parent(),
				errors = [],
				dfds = [],
				manageResult = function (result) {
					if (!result) {
						container.addClass("error");
						errors.push(rule.msg);
						obj.addError(obj, errors, errorlist);
						dfd.reject();
					} else {
						obj.addError(obj, errors, errorlist);
						dfd.resolve();
					}
				};

			field.next(".errorlist").remove();

			for (var i = 0; i < types.length; i = i + 1) {
				var rule = $.Validation.getRule(types[i]),
					value = field.val(),
					dfd = $.Deferred();

				if (field.attr('placeholder') == value) {
					value = ""; //value showing placeholder in IE.
				}
				
				if (!rule) {
					continue;
				}

				if (rule.async) {
					rule.check(value, manageResult, field);
				} else {
					manageResult(rule.check(value, field));
				}
				dfds.push(dfd);
			}

			obj.addError(obj, errors, errorlist);
			return dfds;
		}
	};

	$.extend($.fn, {    // Validation extends jQuery prototype
		setupValidation: function (callback) {  //set up async type validation using deferred.
			var validator = new Form($(this));
			$.data($(this)[0], 'validator', validator);

			$(this).unbind("submit.validation");
			$(this).bind("submit.validation", function (e) {
				e.preventDefault();
				validator.validateAsync(function (valid) {
					if (!valid) {

						/*TODO: Could show a page level message or add Slide in Panel Here
						$('body').inforPageLevelMessage({
							messageType: 'Alert',
							messageTitle: 'Save failed',
							errorMessage: 'Fix the errors in this page and try again.',
							showClose: true,
							autoDismiss: true
						});*/

						//show the first invalid tooltip
						var firstField = null;
						for (var i = 0; i < validator.fields.length; i++) {
							var fObj = validator.fields[i];
							if (!fObj.valid) {
								firstField = fObj.field;
								break;
							}
						}

						if (firstField) {
							firstField.validationMessage("show", firstField.data("errorlist"), true);
						}
					}

					callback(valid);
				});
			});

			return validator;
		},
		isValid: function () {
			if ($(this).is("form")) {
				var validator = $.data($(this)[0], 'validator');
				return validator.isValid();
			} else {
				//allow this on fields?
				return false;
			}
		},
		validate: function () {
			var validator = $.data($(this)[0], 'validator');
			validator.validate();
			return validator.isValid();
		},
		resetForm: function () {
			var formFields = $(this).find('input, select, textarea'),
				validator;

			//clear errors.
			formFields.validationMessage("remove");

			//clear dirty flag.
			formFields.data("isDirty", false).removeClass("isDirty");
			$(this).find(".isDirty").removeClass("isDirty");
			
			//clear valid flags
			validator = $.data($(this)[0], 'validator');
			if (validator) {
				for (var field = 0; field < validator.fields; field++) {
					validator.fields[field].valid = true;
				}
			}
			//reset form data
			if ($(this).is("form")) {
				$(this)[0].reset();
			}
		},
		validationMessage: function (hideOrShow, messages, showTooltip) {
			if (hideOrShow == "show") {
				$.Validation.showMessage(this, messages, showTooltip);
			}
			if (hideOrShow == "remove") {
				$.Validation.removeMessage(this, messages, showTooltip);
			}
		}
	});
	$.Validation = new Validation();
})(jQuery);