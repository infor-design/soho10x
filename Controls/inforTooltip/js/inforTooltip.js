/*
* Infor Tooltips - Based on jQuery UI Tooltip 1.9m2
*
* Copyright (c) 2009 AUTHORS.txt (http://jqueryui.com/about)
* Dual licensed under the MIT (MIT-LICENSE.txt)
* and GPL (GPL-LICENSE.txt) licenses.
*
* http://docs.jquery.com/UI/Tooltip
*/
(function ($) {

	// role=application on body required for screenreaders to correctly interpret aria attributes
	if (!$(document.body).is('[role]')) {
		$(document.body).attr('role', 'application');
	}

	$.widget("ui.inforToolTip", {
		options: {
			tooltipClass: "inforTooltip",
			content: function () {
				return $(this).attr("title");
			}, //content of the tooltip (can be html_ by default it will pick up the title)
			position: null, //the position of the tooltip using jquery ui position options
			maxWidth: null, //the max width of the tooltip before wrapping
			isErrorTooltip: false, //is it an error (red style tooltip?). this is usually managed internally
			delay: 150, //delay before the tooltip will appear
			show : false,	//show the top immediately
			arrowClass: null
		},
		isRTL: false,
		_init: function () {
			var self = this,
			isSvg = false,
			tooltipText = this.element.attr("title"),
			translatedTip;

			if (!tooltipText) {	//look for a title element (svg format)
				tooltipText = this.element.find("title").text();
				isSvg = true;
			}

			if (!tooltipText) {
				return;
			}

			this.element.attr("aria-label", tooltipText);
			
			//try to translate the tooltip
			translatedTip = Globalize.localize(tooltipText);
			if (translatedTip) {
				tooltipText = translatedTip;
			}

			if (!this.element.hasClass("inforErrorIcon")) {
				this.element.attr("title", tooltipText);
			}

			//save the tooltip
			this.element.data("currentTitle", tooltipText);
			this.element.attr("title", "");
			if (isSvg) {
				this.element.find("title").remove();
			}

			this.tooltip = $("#inforTooltip");
			this.tooltipContent = this.tooltip.find("div.content");

			if (this.tooltip.length === 0) { //add it once to the dom.
				this.tooltip = $("<div></div>")
					.attr("id", "inforTooltip")
					.attr("role", "tooltip")
					.attr("aria-hidden", "true")
					.addClass(this.options.tooltipClass)
					.appendTo(document.body)
					.mousedown(function () {
						$(this).hide();
					})
					.hide();

				this.tooltipContent = $("<div class='content'></div>").appendTo(this.tooltip);
			}

			this.isRTL = this.tooltip.css("direction") == "rtl";

			//handle error Behavior
			if (this.element.hasClass("inforErrorIcon")) {
				this.tooltip.addClass("inforErrorTooltip");
				this.options.isErrorTooltip = true;
			}

			this.opacity = 1;
			if (!this.options.isErrorTooltip || (this.options.isErrorTooltip && this.element.parent().hasClass("status-indicator"))) {
				this.element.hoverIntent({
					over: function (event) {
						self.open(event);
					},
					timeout: this.options.delay,
					interval: this.options.delay,
					out: function (event) {
						self.close(event);
					}
				}).click(function() {
					self.tooltip.stop().hide();
				});

			} else {
				var elem = this.element,
					field = elem.data("field");

				if (field) {
					field.on("mouseenter.tooltip", function (e) {
						self._show(e, elem, elem.data("currentTitle"));
						this.current = elem;
					}).on("mouseleave.tooltip", function () {
						self.tooltip.stop().hide();
					});
				}

				if (elem.is(".slick-cell")) {
					return;
				}

				elem.on("click.tooltip", function (e) {
					self._show(e, elem, elem.data("currentTitle"));
					this.current = elem;
				}).on("mouseenter.tooltip", function (e) {
					self._show(e, elem, elem.data("currentTitle"));
					this.current = elem;
				}).on("mouseleave.tooltip", function () {
					self.tooltip.stop().hide();
				});
			}

			if (this.options.show) {
				this.open();
			}
		},
		enable: function () {
			this.options.disabled = false;
		},
		disable: function () {
			this.options.disabled = true;
		},
		_setOption: function (key, value) { //ignore jslint
			$.Widget.prototype._setOption.apply(this, arguments);
		},
		destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		},
		widget: function () {
			return this.tooltip;
		},
		open: function (event) {
			var self = this,
				target = this.element, content;

			this.current = target;
			this.currentTitle = target.attr("title");

			content = this.options.content.call(target[0], function (response) {
				// ignore async responses that come in after the tooltip is already hidden
				if (self.current == target) {
					self._show(event, target, response);
				}
			});

			if (!content) {//use the data for error tooltips.
				content = target.data("currentTitle");
			}
			
			if (content) {
				self.element.attr("aria-label", content);
				self._show(event, target, content);
			}
		},
		_show: function (event, target, content) {
			var self = this,
				width = 0, offset, leftVal,
				allArrowClasses = "arrowTop arrowBottom arrowLeft arrowRight arrowTopLeft arrowBottomRight arrowLeftDown arrowLeftUp arrowBottomLeft arrowRightDown arrowRightUp arrowTopRigh arrowTopLeft";

			if (!content) {
				return;
			}

			target.attr("title", "");

			if (this.options.disabled) {
				return;
			}

			this.tooltipContent.html(content);

			if (this.options.isErrorTooltip) {
				this.tooltip.addClass("inforErrorTooltip");
			} else {
				this.tooltip.removeClass("inforErrorTooltip");
			}

			if (this.options.maxWidth) {
				this.tooltip.find(".content").css("max-width", this.options.maxWidth + "px");
			}

			var pos = this.options.position;
			if (this.element.next().hasClass("inforCheckbox")) {//flow to other side
				pos.my = (!this.isRTL ? "left top" : "right top");
			}

			if (this.options.isErrorTooltip) {
				offset = (!this.isRTL ? "+10" : "-6");
				if (target.closest(".inforTriggerField").length > 0) {
					offset = "+17";
				}
				if (target.prev().is(".inforListBox")) {
					offset = "+10";
				}
				if (target.is(".slick-cell")) {
					offset = "+5";
				}

				pos = {
					my:  (!this.isRTL ? "left" + offset : "right" + offset),
					at: (!this.isRTL ? "right" + offset : "left" + offset),
					collision: "fit flip",
					of: target
				};
				this.tooltip.removeClass(allArrowClasses).addClass((!this.isRTL ? "arrowLeft" : "arrowRight"));
			} else {
				this.tooltip.removeClass(allArrowClasses).addClass("arrowTop");
			}

			if (!pos) {
				pos = {
					of: target, //(this.options.isErrorTooltip ? target : event)	//event for mouse - target for button
					collision: "fit flip",
					my: "top+19",
					at: "bottom"
				};
			}
			
			this.tooltip.css({
				top: 0,
				left: 0
			}).show().position(pos);

			if (target.offset().top > this.tooltip.offset().top && !this.options.isErrorTooltip) { //opened on top
				this.tooltip.removeClass(allArrowClasses).addClass("arrowBottom");
			}

			if (target.is("button")) {
				target.mousedown(function () {
					self.tooltip.hide();
				});
			}

			//position the arrow.
			width = (this.tooltip.width()) / 2;
			width = width - (width < 20 ? 9 : 11); //center the arrow
			
			//see if it flowed of the right side. if so show it under...
			if (this.options.isErrorTooltip) {
				if (target.data("field") && parseInt(this.tooltip.offset().left, 10) < parseInt(target.data("field").offset().left, 10) + parseInt(target.data("field").width(), 10)) {
					var pos = this.options.position;
					if (!pos) {
						pos = {
							of :  target.data("field"),
							my : "center top+10",
							at : "center bottom",
							collision: "fit flip"
						   };
					}
					this.tooltip.removeClass(allArrowClasses).addClass("arrowTop");
					this.tooltip.show().position(pos);
					
					//Check if we flipped and reverse the arrow.
					if (this.tooltip.offset().top < target.data("field").offset().top) {
						this.tooltip.removeClass(allArrowClasses).addClass("arrowBottom");
					}
				}
			}

			//detect if it overflowed the left side and the tip is too big
			if (parseInt(this.tooltip.css("left"), 10) == 0 && this.tooltip.width()/2 > target.offset().left + 25) {
				this.tooltip.removeClass(allArrowClasses).addClass("arrowTopLeft");
				this.tooltip.css("top",  '+=10px');
			}
			
			//add the aria accessability stuff
			this.tooltip.attr("aria-hidden", "false");
			target.attr("aria-describedby", this.tooltip.attr("id"));
			
			if (this.options.arrowClass) {
				this.tooltip.removeClass(allArrowClasses).addClass(this.options.arrowClass);
			}
			
			if (this.options.position) {
				if (!this.options.position.of) {
					this.options.position.of = target;
				}

				this.tooltip.position(this.options.position);
			}
			
			this.tooltip.hide().delay(this.options.delay).fadeIn();
			this._trigger("open", event);
		},
		close: function (event) {
			if (!this.current) {
				return;
			}

			var current = this.current.attr("title", this.currentTitle);
			this.current = null;
			if (!current) {
				return;
			}

			if (this.options.disabled) {
				return;
			}

			current.removeAttr("aria-describedby");
			this.tooltip.attr("aria-hidden", "true");

			if (this.tooltip.is(':animated')) {
				this.tooltip.stop().fadeTo("normal", 0, function () {
					$(this).hide().css("opacity", "");
				});
			} else {
				this.tooltip.stop().fadeOut();
			}
			this._trigger("close", event);
		}
	});

})(jQuery);