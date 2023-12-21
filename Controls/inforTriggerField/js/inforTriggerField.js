/*
* Infor Trigger Field - Handles the base functionality of DropDown/DatePicker and Other Trigger Fields.
*/
(function ($) {
	$.fn.inforTriggerField = function (options) {
		var settings = {
			click: null,
			editable: true	//makes a click only trigger field.
		};
		settings = $.extend(settings, options || {});

		return this.each(function () {
			var $input = $(this);
			if ($input.data("initialized") != undefined)	//is wrapped
				return;

			$input.data("initialized", true);

			//Add the correct classes for this type of button.
			var lookupClass = "";
			if ($input.hasClass("inforLookupField"))
			lookupClass = "inforLookupButton";
			if ($input.hasClass("inforDropDownList"))
				lookupClass = "inforDropDownListButton";
			if ($input.hasClass("inforDateField"))
			lookupClass = "inforDatePickerButton";
			if ($input.hasClass("inforUrlField"))
				lookupClass = "inforUrlButton";
			if ($input.hasClass("inforEmailField"))
				lookupClass = "inforEmailButton";
			if ($input.hasClass("inforSearchField"))
				lookupClass = "inforSearchButton";
			if ($input.hasClass("inforFileField"))
				lookupClass = "inforFileButton";
			if ($input.hasClass("inforCalculatorField"))
				lookupClass = "inforCalculatorButton";
			if ($input.hasClass("inforSpinner"))
				lookupClass = "inforSpinnerButtonUp";
			if ($input.hasClass("inforTimeField"))
				lookupClass = "inforTimeButton";
			if ($input.hasClass("inforColorPicker"))
				lookupClass = "inforColorButton";

			var wrapper = $input.parent(".inforTriggerField");
			var $triggerButton;
			if (wrapper.length == 0) {
				//wrap it in the correct html using a div and a table.
				wrapper = $input.wrap('<div class="inforTriggerField"></div>').parent();
				$triggerButton = $('<button class="inforTriggerButton ' + lookupClass + '" type="button" ><span>' + Globalize.localize("Open") + '</span></button>').attr("tabIndex","-1");
				wrapper.append($triggerButton);
			} else {
				$triggerButton = wrapper.children(".inforTriggerButton");
			}

			//attach click event
			if (settings.click != undefined) {
				if (!$input.hasClass("fileInputField")) {	//bound inside the file field control.
					$input.on("keypress.triggerfield",function(event) {
						if (event.keyCode==13 && $triggerButton.is('.inforSearchButton')) {
							$triggerButton.trigger("click");
							event.stopPropagation();
							event.preventDefault();
							return false;
						}
					});
				}
				$triggerButton.on("touchstart click", function (e) {
					e.inputId = $input.attr("id");
					e.input = $input;
					settings.click(e);
					$("#inforTooltip").hide();
				});
			}

			//setup focus functionality...Need to also change state of the button.
			$input
				.addClass("inforTextbox")
				.focusin(function (e) {
					var $this = $(this);
					$this.parent().find(".inforTriggerButton").addClass("focus");
					$this.closest(".inforTriggerField").addClass("focus");
				}).focusout(function (e) {
					var $this = $(this);
					$this.parent().find(".inforTriggerButton").removeClass("focus");
					$this.closest(".inforTriggerField").removeClass("focus");
				});

			var root = $input.closest(".inforTriggerField");

			//setup disabled and readonly functionality
			var isEnabled = true;

			if ($input.attr("readonly") == "readonly") {
				root.addClass("readonly");
				isEnabled = false;
			}

			if ($input.is(":disabled")) {
				root.addClass("disabled");
				isEnabled = false;
			}

			if ($input.hasClass("backgroundColor")) {
				$input.closest('.inforTriggerField').addClass("backgroundColor");
				$input.data("backgroundColor", true);
			}

			//add tooltip
			var tooltip=$input.attr("title");
			if (tooltip!=undefined) {
				$triggerButton.attr("title",tooltip);
				$input.attr("title","");
			}

			//handle absolute positioning.
			if ($input.css("position") == "absolute" && !Globalize.culture().isRTL) {
				root.css({ position: "absolute", left: $input.css("left"), top: $input.css("top"), bottom: $input.css("bottom") });
				$input.css({ position: "", left: "", top: "", bottom: "" });
			}
			else if ($input.css("position") == "absolute") {
				root.css({ position: "absolute", right: $input.css("right"), top: $input.css("top"), bottom: $input.css("bottom") });
				$input.css({ position: "", left: "", top: "", bottom: "" });
			}

			//create a root id off this id to use style sheet css.
			if ($input.attr("id"))
				$input.parent().attr("id", $input.attr("id")+"Container");

			if (!settings.editable) {
				$input.attr("readonly","").addClass("selectOnly");
			}

			//look for inline width and subtract 7 for the padding on the right
			if ($input.attr("style")) {
				$input.width(parseInt($input.width(), 10));
			}
			//see if disabled and hide the parent..
			if ($input.css("display") === "none") {
				$input.css("display","").hide();
			}
		});
	};

	$.fn.inforSearchField = function (options) {
		var settings = {
			click: null,
			cancel: null	//fires when cancel is clicked.
		};
		settings = $.extend(settings, options || {});

		return this.each(function () {
			var $input = $(this);

			//make sure its not initialized twice.
			if ($input.data("isInitialized"))
				return;

			//add trigger button styling
			$input.data("isInitialized",true)
					.addClass("noTrackDirty")
					.inforTriggerField({click: settings.click})
					.keyup(function(event){
						var term = $(this).val();
						_displayCancelButton($(this),"Cancel");

						if (term === "")
							_displayCancelButton($(this),"Search");
					})
					.blur(function(event){
						if ($(this).val() === "")
							_displayCancelButton($(this),"Search");
					});

			$input.closest("div").addClass("inforSearchFieldContainer");

			if ($input.attr("placeholder")=="Search") {
				$input.attr("placeholder", Globalize.localize("Search"));
			}
			
			_displayCancelButton($(this), "Search");
			
		});

		function _displayCancelButton(field, icon){
			if (field.attr("readonly"))
				return;

			var triggerButton = field.closest(".inforTriggerField").find(".inforTriggerButton").not(".inforCancelButton"),
				cancelButton = triggerButton.prev();

			if (!cancelButton.hasClass("inforCancelButton")) {
				cancelButton = $("<button type='button' class='inforCancelButton inforTriggerButton'><span></span></button>");
				triggerButton.before(cancelButton);

				cancelButton.attr("title",Globalize.localize("Cancel"));
				cancelButton.click(function(event) {
					$(this).hide().closest(".inforTriggerField").find("input").val("");
					$("#inforTooltip").hide();
					if (settings.cancel)
						settings.cancel(event);
				});
			}

			if (icon=="Search") {
				cancelButton.hide();
				if (field.val() !== "") {
					cancelButton.show();	
				}
			} else {
				cancelButton.show();	
			}
		}
	};

	$.fn.inforFileField = function (options) {
		var settings = {
			editable: false
		};

		settings = $.extend(settings, options || {});

		return this.each(function () {
			var $input = $(this);

			//make sure its not initialized twice.
			if ($input.data("isInitialized"))
				return;

			//add trigger button styling
			$input.data("isInitialized",true).inforTriggerField();

			//add another visable and styled textbox
			var $fileInput = $("<input type='text' class='inforTextbox fileInputField'/></input>");
			$input.after($fileInput);

			//position the file input underneath the button and opace.
			$input.attr("tabindex","-1").css({"position":"absolute"});
			
			$fileInput.blur(function() {
				$(this).parent().removeClass("focus");
			}).focus(function() {
				$(this).parent().addClass("focus");
			});
			
			var $button = $input.parent().find(".inforTriggerButton");

			//attach visual events.
			if (!settings.editable) {
				$input.mousedown(function() {
					$button.addClass("active");
				}).mouseup(function() {
					$button.removeClass("active");
				})
				.mouseenter(function () {
					$button.addClass("hover");
				})
				.mouseleave(function () {
					$button.removeClass("hover");
				});
			}
			
			$input.change(function (event) {
				$fileInput.val($(this).val());
			});

			//handle readonly and disabled styling.
			if ($input.is(":disabled")) {
				$fileInput.addClass("disabled");
				$fileInput.attr("disabled","");
			}

			if (!$input.isReadOnly()) {
				$fileInput.attr("readonly","").addClass("selectOnly");
			}

			if (settings.editable) {
				$fileInput.attr("id",$input.attr("id"))
					.attr("name",$input.attr("name"))
					.removeAttr("readonly")
					.removeClass("selectOnly");

				var css = $input.attr("style");
				$input.removeAttr("id").removeAttr("name").attr("style",css+";cursor: default;width: 10px !important");
				$input.css("left" , "").prependTo($button.parent());
			}
			
			//look for inline width and subtract 7 for the padding on the right
			if ($input.attr("style")) {
				$input.parent().width(parseInt($input.width(), 10) + 24);
				$input.parent().find("input").width(parseInt($input.parent().width(), 10) - 24);
				$input.parent().find("button").css("float", "right");
			}
	
			$input.css("width", "25px");
			$input.insertAfter($input.parent().find("button"));//.css("margin-left", $fileInput.width());
			
			//see if disabled and hide the parent..
			if ($input.css("display") === "none") {
				$input.parent().css("display","").hide();
			}
			
			//make more compliant
			$fileInput.uniqueId();
			var id = $input.attr("id"),
				label = $('label[for="' + id + '"]').text();
			
			$fileInput.before("<label class='inforScreenReaderText' for='" + $fileInput.attr("id") + "'>" + label + "</label>")
						.attr("aria-labelledby", $fileInput.attr("id"));
		});
	};
} (jQuery));
