﻿/*
* Infor Split Button
*/
(function ($) {
	$.fn.inforSplitButton = function (options) {
		var settings = {
			menuId: null, //id on the form of the menu
			callback: null, //function to execute on a menu item click
			click: null, //function to execute on button part click
			backgroundIFrame: false, // pass backgroundIFrame to open an iFrame overtop of submenus for pdf/applet issues
			iframeFix: false //pass iframe fix to close menus on iframe click
		};

		return this.each(function () {
			var o = $.extend({}, settings, options),
				$textButton = $(this),
				buttonText = $textButton.html(),
				isIconButton = false,
				isDisabled, classes, $rightButton, container;

			if (!$textButton.parent().is(".inforSplitButtonContainer")) {

				isDisabled = $textButton.hasClass("disabled") || $textButton.is(":disabled");
				classes = $textButton.attr("class").replace("inforSplitButton", "").replace("disabled", "");

				if (classes === "" || classes === " ") {
					isIconButton = false;
				} else {
					$textButton.addClass("inforIconButton");
					if ($textButton.children("span").length === 0) {
						$textButton.append("<span></span>");
					}
					isIconButton = true;
				}

				$rightButton = $("<button type='button' aria-haspopup='true' aria-expanded='false' class=\"inforSplitButtonArrow\"><span>" + Globalize.localize("Menu") + "</span></button>");

				//wrap in a div and add the button on the right.
				container = $("<div class='inforSplitButtonContainer'></div>");
				if (isIconButton) {
					container.addClass("icon");
				}

				$textButton.wrap(container);
				$textButton.parent().append($rightButton);

				//attach the events.
				$textButton.click(function (e) {
					if ($textButton.parent().hasClass("disabled") || $textButton.hasClass("disabled")) {
						return;
					}

					if (o.click) {
						o.click(e);
					}
				});

				if (o.menuId !== null) {
					$rightButton.inforContextMenu({
						menu: o.menuId,
						invokeMethod: 'toggle',
						iframeFix: o.iframeFix,
						backgroundIFrame: o.backgroundIFrame,
						position: {
							my: "left top",
							at: "left bottom",
							of: $textButton,
							offset: "0 1",
							collision: "flip"
						},
						beforeOpening: function () {
							$rightButton.addClass("active").attr("aria-expanded", "true").attr("aria-controls",o.menuId);
						},
						onClose: function () {
							$rightButton.removeClass("active").attr("aria-expanded", "false");
						}
					}, (!o.callback ? null : function (action, el, pos, item) {
						if ($textButton.hasClass('disabled')) {
							return;
						}
						o.callback(action, el, pos, item);
					}));
				}

				//set the initial disabled state.
				if (isDisabled) {
					$textButton.disable();
				} else {
					$textButton.enable();
				}

				//copy tab index..
				if ($textButton.attr("tabindex") == -1) {
					$textButton.parent().find("button").attr("tabindex", -1);
				}
			}
		});
	};

}(jQuery));