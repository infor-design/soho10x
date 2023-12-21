/*
* Infor Menu Button
*/
(function ($) {
	$.fn.inforMenuButton = function (options) {
		var settings = {
			menuId: null,
			callback: null,
			source: null, //allows you to do an ajax call.
			delay: 500, //delay for loading indicator when using source
			iframeFix: false, //pass iframe fix to close menus on iframe click
			backgroundIFrame: false // pass backgroundIFrame to open an iFrame overtop of submenus for pdf/applet issues
		};

		return this.each(function () {
			var o = $.extend({}, settings, options),
			$textButton = $(this),
			isIconButton = false,
			menuPosition = {
				my: "center top",
				at: "center bottom",
				of: $textButton,
				offset: "0 0",
				collision: "flipfit"
			},
			html, innerText, arrow, response;

			//handle icon buttons.
			if ($textButton.hasClasses(["exportExcel", "new", "print", "save", "settings", "generate", "help", "favorites", "maintenance"])) {
				isIconButton = true;
			}

			//wrap it
			if ($textButton.find('.inforMenuButtonArrow').length === 0) {
				html = $textButton.attr("aria-haspopup", "true").wrapInner("<span class='innerText'></span>");
				$textButton.append('<span class="inforScreenReaderText">' + Globalize.localize("Menu") + '</span>');
				if (isIconButton) {
					$textButton.addClass("inforIconButton");
					innerText = $textButton.find(".innerText").html();
					if (innerText) {
						$textButton.attr("title", innerText).find(".innerText").html("");
					}
				}

				arrow = $("<div class=\"inforMenuButtonArrow\" />");
				$textButton.append(arrow);

				if (o.source) {
					$textButton.click(function (e) {
						//show loading indicator in the menu
						var menu = $("#" + o.menuId).empty(),
							cancelled = false,
							delay = null;

						delay = setTimeout(function () {
							menu.append("<li style=\"margin-left:20px;\"><a>Loading...</a></li><div id=\"inforLoadingOverlay\" class=\"inforBusyIndicator small\" style=\"position: absolute; top: 7px; left: 5px;\"></div>");
							//show the menu...in loading state
							$textButton.inforContextMenu({
								menu: o.menuId,
								event: e,
								backgroundIFrame: o.backgroundIFrame,
								iframeFix: o.iframeFix,
								invokeMethod: 'immediate',
								position: menuPosition,
								beforeOpening: function () {
									$textButton.attr("aria-expanded", "true").attr("aria-controls",o.menuId);
								},onClose: function () {
									cancelled = true;
									$textButton.attr("aria-expanded", "false");
								}
							});
						}, o.delay);

						//setup a response
						response = function () {
							clearTimeout(delay);

							if (cancelled) {
								return;
							}

							//show menu.
							$textButton.inforContextMenu({
								menu: o.menuId,
								invokeMethod: 'immediate',
								position: menuPosition,
								event: e
							});
						};
						//Wait for the callback...
						o.source(response);
					});
				} else if (o.menuId) {

					$textButton.inforContextMenu({
						menu: o.menuId,
						invokeMethod: 'toggle',
						position: menuPosition,
						iframeFix: o.iframeFix,
						backgroundIFrame: o.backgroundIFrame,
						beforeOpening: function () {
							$(".inforMenuButton").removeClass("active"); //find others and remove.
							$textButton.addClass("active");
						},
						onClose: function () {
							$textButton.removeClass("active");
						}
					}, (!o.callback ? null : function (action, el, pos, item) {
						if ($textButton.hasClass('disabled')) {
							return;
						}
						o.callback(action, el, pos, item);
					}));
				}

				//set the initial disabled state.
				if ($textButton.hasClass('disabled')) {
					$textButton.disable();
				}

				if ($textButton.prop("disabled")) {
					$textButton.disable();
				}
			}
		});
	};
}(jQuery));