/*
* Infor Carousel Control
*/
(function ($) {
	$.widget("ui.inforCarousel", {
		options: {
			scrollBar: true,
			showItemCount: true,
			onSelect: null	//fires when an item is selected.
		},
		_create: function () {
			var elem = $(this.element),
			self = this,
			scroller = $("<div class=\"inforCarouselScroller\"></div>");

			elem.wrap(scroller);
			this.resize();

			if (!this.options.scrollBar) {
				elem.parent(".inforCarouselScroller").css("overflow-x", "hidden");
			} else {
				elem.parent(".inforCarouselScroller").scroll(function () {
					self._updateItemCount(elem);
				});
			}

			this._addButtons(elem);
			this._updateItemCount(elem);
			this._updateTooltips();
			
			elem.parent().find(".inforCarouselLabel").attr("tabindex", 0).focus(function () {
				var item = $(this).parent(".inforCarouselItem");
				item.find(".inforCarouselOverlay").show();
				item.find(".inforCarouselToolbar").show();
			}).blur(function () {
				var item = $(this).parent(".inforCarouselItem");
				item.find(".inforCarouselOverlay").hide();
				item.find(".inforCarouselToolbar").hide();
			});
		},
		resize: function () {
			var elem = $(this.element),
			item, toolbar,
			width = 0,
			self = this,
			parent = elem.parent(),
			hoverConfig = {
				timeout: 500,
				over: function () {
					var item = $(this);
					item.find(".inforCarouselOverlay").fadeIn("slow");
					item.find(".inforCarouselToolbar").fadeIn("slow");
				},
				out: function () {
					var item = $(this);
					item.find(".inforCarouselOverlay").fadeOut("slow");
					item.find(".inforCarouselToolbar").fadeOut("slow");
				}
			};

			elem.find('.inforCarouselItem').each(function () {
				item = $(this);
				width += item.outerWidth(true),
				toolbar = $(this).find(".inforCarouselToolbar");
				item.find(".inforCarouselOverlay").remove();

				if (toolbar.length > 0) {
					toolbar.before("<div class=\"inforCarouselOverlay\"></div>");
				} else {
					item.append("<div class=\"inforCarouselOverlay\"></div>");
				}
			}).hoverIntent(hoverConfig);

			elem.css('width', width + "px");
			parent = elem.parent().parent();

			//set field set width
			//todo: test this in a card stack/splitter/pane
			self._sizeParent();
			//handle resize for field set width
			$(window).bind("throttledresize.inforCarousel", function () {
				self._sizeParent();
				self._updateItemCount(elem);
			});
		},
		_sizeParent: function () {
			var elem = $(this.element),
			parent = elem.parent().parent();

			if (parent.width !== undefined) {
				parent.width($(window).width() - 20).css({"padding": "0", "margin-left": "0"});
			}
		},
		refresh: function () {
			var elem = $(this.element);

			this.resize();
			this._sizeParent();
			this._updateItemCount(elem);
			this._updateTooltips();
		},
		_updateTooltips: function () {
			var elem = $(this.element);
			elem.find('.inforCarouselItem').each(function () {
				var item = $(this).find(".inforCarouselTooltip").hide(),
				img = $(this).find(".inforCarouselImage");

				if (item.length > 0 && !item.data("uiInforToolTip")) {
					img.attr("title", item.html()).inforToolTip({delay: 750});	//should be two seconds but that seems too long
				}
			});
		},
		scrollOne: function (direction, animate) {
			var elem = $(this.element),
			scroller = $(this.element).parent(),
			self = this,
			itemWidth = elem.find('.inforCarouselItem:first').outerWidth(true) + 32,
			distance = scroller.scrollLeft() + (direction == "right" ? itemWidth : -itemWidth);

			scroller.animate({
				scrollLeft:  distance
			}, (animate ? 300 : 300), "easeOutQuad", function () {
				self._updateItemCount(elem);
			});
		},
		_addButtons: function (elem) {
			var self = this,
				isScrolling = false,
				container = $("<div class=\"inforCarouselScrollerContainer\"></div>"),
				left = $("<button type='button'><span></span></button>").addClass("inforIconButton inforCarouselScrollLeft").attr("title", Globalize.localize("Previous")),
				right = $("<button type='button'><span></span></button>").addClass("inforIconButton inforCarouselScrollRight").attr("title", Globalize.localize("Next"));

			elem.parent().wrap(container);
			container = elem.closest(".inforCarouselScrollerContainer");
			container.append(right).prepend(left);

			left.inforToolTip().click(function () {
				if (isScrolling) {
					isScrolling = false;
					return;
				}
				self.scrollOne("left", true);
				isScrolling = false;
			});

			right.inforToolTip().click(function () {
				if (isScrolling) {
					isScrolling = false;
					return;
				}
				self.scrollOne("right", true);
			});

			/*add click - long press events
			left.on('mousedown', function () {
				self.leftInterval = setInterval(function () {
					self.scrollOne("left");
					isScrolling = true;
				}, 200);
			}).on('mouseup mouseup mouseout', function () {
				clearInterval(self.leftInterval);
			});

			right.on('mousedown', function () {
				self.rightInterval = setInterval(function () {
					self.scrollOne("right");
					isScrolling = true;
				}, 200);
			}).on('mouseup mouseup mouseout', function () {
				clearInterval(self.rightInterval);
			});*/
		},
		isElementInViewPort: function (el) {
			var rect = el.getBoundingClientRect();
			return (
				rect.top >= 0 &&
				rect.left >= 0 &&
				rect.bottom <= window.innerHeight &&
				rect.right <= window.innerWidth
			);
		},
		_updateItemCount: function (elem) {
			if (!this.options.showItemCount) {
				return;
			}
			var container = elem.closest(".inforCarouselScrollerContainer"),
				countElem = container.find(".inforCarouselItemCount"),
				start = 1,
				end = 0,
				foundStart = false,
				self = this;

			if (countElem.length === 0) {
				countElem = $("<div class='inforCarouselItemCount'></div>");
				container.find(".inforCarouselScrollRight").after(countElem);
				if (!this.options.scrollBar) {
					countElem.css("margin-top", "-25px");
				}
			}

			elem.children().each(function () {
				if (self.isElementInViewPort($(this)[0])) {
					end++;
					foundStart = true;
				} else {
					if (!foundStart) {
						start++;
					}
				}
			});

			countElem.html(start + "-" + (end + start - 1) + " of " + elem.children().length);
			this._refreshScroll(elem);
		},
		_refreshScroll: function (elem) {
			var left = elem.closest(".inforCarouselScrollerContainer").find(".inforCarouselScrollLeft"),
			right = elem.closest(".inforCarouselScrollerContainer").find(".inforCarouselScrollRight"),
			scroller = elem.closest(".inforCarouselScroller")[0];

			if (scroller.scrollLeft === 0) {
				left.attr("disabled", "");
				clearInterval(this.leftInterval);
			} else {
				left.removeAttr("disabled");
			}

			if ((scroller.scrollWidth - scroller.clientWidth) === scroller.scrollLeft) {
				right.attr("disabled", "");
				clearInterval(this.rightInterval);
			} else {
				right.removeAttr("disabled");
			}
		}
	});
})(jQuery);