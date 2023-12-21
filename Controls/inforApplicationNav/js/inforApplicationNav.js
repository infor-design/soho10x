/*
* Infor Application Navigation
*/
(function ($) {
	$.widget("ui.inforApplicationNav", {
		options: {
			loadMenu: null, //Adds the ability to refresh menu items with an ajax call.
			showSessionMenu: false, //adds the session navigation menu and api.
			onSessionMenuOpen: null,
			sortable: false,        //sort overflow items by drag and drop
			backgroundIFrame: false,    //opens an iFrame overtop of submenus. Use this if having issues with pdf/applets in the page
			callback: null  //a function that fires when a menu item is selected
		},
		pending: 0,
		elementId: null,
		resizeTimer: null,
		windowHeight: $(window).height(),
		windowWidth: $(window).width(),
		_sessionInfo: [],
		//the array of sessions.
		_create: function () {
			var self = this,
				elem = this.element;

			this.elementId = elem.attr("id");
			elem.css({
				"overflow": "hidden"
			});

			//add the <br> to clear at the end if its not there.
			if (!elem.children().last().is("br")) {
				elem.append('<br style="clear: left" />');
			}
			this.buildmenu(this.elementId);

			$(window).bind("throttledresize.inforApplicationNav", function () {
				if (elem.is(":visible")) {
					self._resizeAndRender();
				}
			});

			this._setOverflow();
			this._renderMegaMenus();
			//keyboard
			elem.on("keypress", function (e) {
				self._handleKeys(e, elem);
			});
		},
		_handleKeys: function (e, elem) {
			var self = this,
				focusd =  $(':focus'),
				li = focusd.parent(),
				isTop = focusd.parent().parent().parent().hasClass("inforApplicationNav"),
				next, prev;

			switch (e.keyCode) {
						case 9: //tab
							break;
						case 37: //left
							if (isTop) {
								prev = li.prev(":visible");
								if (prev.length === 0) {
									prev = li.prevAll(":visible:first");
									if (prev.length === 0) {
										prev = li.parent().find("li:visible:last");
									}
								}
								self.closeOpenMenus(elem);
								prev.children("a").focus().trigger("click");
							} else {
								if (li.index() === 0 && li.parent().is("ul")) {
									li.parent().prev("a").focus();
									li.parent().hide();
								}
							}
							break;
						case 38: //up
							if (!isTop) {
								prev = li.prev();
								if (prev.length === 0) {
									prev = li.parent().children("li:last");
								}
								prev.find("a").focus();
							}
							break;
						case 39: //right
							//open menu to right
							if (isTop) {
								next = li.next(":visible");
								if (next.length === 0) {
									next = li.nextAll(":visible:first");
									if (next.length === 0) {
										next = li.parent().find("li:visible:first");
									}
								}
								self.closeOpenMenus(elem);
								next.children("a").focus().trigger("click");
							} else {
								if (li.find("ul:first").length > 0) {
									self.openMenu(li.find("ul:first"), li);
									li.find("ul:first").find("a:first").focus();
								}
							}
							break;
						case 40: //down
							if (isTop) {
								li.find("ul a:first").focus();
							} else {
								next = li.next();
								if (next.length === 0) {
									next = li.parent().find("li").eq(0);
								}
								next.find("a").focus();
							}
							break;
					}
		},
		_renderMegaMenus: function () {
			this.element.find(".inforMegaMenuColumn").show();
		},
		render: function () {
			this._setOverflow();
		},
		_resizeAndRender: function () {
			var self = this;
			if (this.resizeTimer) {
				clearTimeout(this.resizeTimer);
			}

			if (this.windowHeight !== $(window).height() || this.windowWidth !== $(window).width()) {
				this.resizeTimer = setTimeout(function () {
					self._setOverflow();
				}, 10);
				this.windowHeight = $(window).height();
				this.windowWidth = $(window).width();
			}
		},
		/* Initial Menu Build Out. Should only be called once. */
		buildmenu: function (elementId) {
			var $mainmenu = $("#" + elementId + ">ul"),
			$headers = null;

			//add some html as a placeholder for the overflowmenu
			$mainmenu.find("#overFlowMenu").remove();
			$mainmenu.append("<li id=\"overFlowMenu\"><a href='#'>" + Globalize.localize("More") + "</a><ul></ul></li>");

			if (this.options.showSessionMenu) {
				//add some html as a placeholder for the sessionNavMenu
				$mainmenu.find("#sessionNavMenu").remove();
				$mainmenu.prepend('<li id ="sessionNavMenu"><a></a><ul><li id="sessionNavLi"><a>Sessions</a></li></ul></li>');
			}

			this._setOverflow();
			$headers = $mainmenu.children("li").has('ul');
			$mainmenu.find("a").hover(function () {
				$(this).addClass("hover");
			}, function () {
				$(this).removeClass("hover");
			});

			this._attachSubMenus($headers);
			this._setupSessionNav();
		},
		_setupSessionNav: function () {
			if (!this.options.showSessionMenu) {
				return;
			}

			var self = this,
			sessionButton = $("#sessionNavMenu"),
			$li = null,
			$ul = null,
			clickFunc = function () {
				//close the menu
				self._closeSiblingMenus($ul.parent());
				//do the action
				var action = $(this).data("action");

				if ($(this).children(":first").hasClasses(["disabledSession", "disabledText"])) {
					return;
				}

				if (action !== null) {
					action();
				}
			};

			//add a button first thing in the menu
			sessionButton.click(function () {
				var session = null,
					anchor = null,
					li = null,
					ul = null,
					parent = null,
					i = null;

				if (self.options.onSessionMenuOpen !== null) {
					self._sessionInfo = self.options.onSessionMenuOpen(self._sessionInfo);
				}

				//hide it if already visible. (toggled the button)
				$li = $(".inforApplicationNav>ul").find("#sessionNavMenu");
				$ul = $li.children("ul");

				if ($ul.is(":visible")) {
					$ul.hide();
					return;
				}

				self._closeSiblingMenus($li);

				//remove the old ones
				$ul.children().remove();

				//refresh the menu elements
				for (i = 0; i < self._sessionInfo.length; i += 1) {
                    session = self._sessionInfo[i];
					li = $("<li></li>");
					anchor = $("<a>" + (session.text === undefined ? "": session.text) + "</a>").attr("id", (session.id === undefined ? session.text: session.id));

					if (anchor === undefined) {
						continue;
					}

					//style with the css classes.
					if (session.id === "navSessionSpacer") {
						anchor.prepend("<div class='navSessionSpacer'></div>");
						anchor.css({
							"height": "6px"
						});
					}

					//add disabled text.
					if (session.cssClass === "disabledSession" || session.cssClass === "disabledText") {
						anchor.addClass("disabledText");
					}

					if (session.cssClass !== undefined && session.id !== "navSessionSpacer") {
						anchor.prepend("<div class='sessionIcon " + session.cssClass + "'></div>");
					}

					if (session.id !== "navSessionSpacer") {
						anchor.click(clickFunc);
					}

					//add it to the dom.
					li.append(anchor);

					if (session.parent !== null) {
						//presumably the parent was added first but we could code a new loop
						//find the parent element
                        parent = $("a#" + session.parent);
                        ul = parent.next("ul");
						//add a ul if not there..
						if (ul.length === 0) {
							ul = $("<ul></ul>");
							parent.after(ul);
						}
						//add it..
						ul.append(li);
					} else {
						$ul.append(li);
					}
					anchor.data("action", session.action);
					//save for the click.
				}

				self._attachSubMenus($li);
				self.openMenu($li.children("ul:first"), $li);
			});
		},
		decorateMenu: function (subMenu) {
			// Can be called to add need styling and elements to a new submenu piece. Eg:
			//$("#inforApplicationNav1").inforApplicationNav("decorateMenu",<newMenuSection>);
			this._attachSubMenus(subMenu);
		},
		close: function () {
			this.closeOpenMenus($(this.element).closest('.inforApplicationNav'));
		},
		sessionInfo: function (updatedInfo) {
			if (updatedInfo !== undefined) {
				this._sessionInfo = updatedInfo;
			}

			return this._sessionInfo;
		},
		_attachSubMenus: function ($headers) {
			var self = this,
				mainMenu = $headers.closest(".inforApplicationNav ul");

			if ($headers.data("attached") !== undefined) {
				return;
			}

			$headers.data("attached", true);

			$headers.each(function (i) {
				var overLay = null,
					$this = $(this),
					$curobj = null,
					$subul = null;

				if ($.data(this, "processed") !== undefined) {
					return;	//continue
				}

				$.data(this, "processed", true);

				$curobj = $this.css({
					zIndex: Math.abs(2000 - i)
				});
				$subul = $this.find('ul:eq(0)').css({
					display: 'block'
				});

				this._dimensions = {
					w: this.offsetWidth,
					h: 30,
					subulw: $subul.outerWidth(),
					subulh: $subul.outerHeight()
				};
				this.istopheader = ($curobj.parents("ul").length === 1 ? true: false);

				//is top level header?
				$subul.css({
					top: this.istopheader ? this._dimensions.h + 2 + "px": 0
				});

				//add arrow images
				if (this.istopheader) {
					$curobj.children("a:eq(0):not(.scrollDown)").append('<div class="downArrow" />');
				} else {
					$curobj.children("a:eq(0):not(.scrollDown)").addClass("rightArrow");
				}

				if (this.istopheader) {
					$curobj.not("#sessionNavMenu").click(function () {
						if ($subul.is(":visible")) {
							//click when open closes the menu
							$curobj.removeClass("activeHeader");
							var rootDiv = $subul.closest(".inforApplicationNav");
							if (rootDiv.length === 0) {	//no css.
								return;
							}
							$subul.hide();
							if (self.options.backgroundIFrame) {
								$(".inforBkgrndIFrame").remove();
							}
							//to speed normal animation
							return;
						}
						self.openMenu($subul, $curobj);
					});
				}

				//Add or ensure there is an overlay
				overLay = $('body').find(".transparentOverlay");
				if (overLay.length === 0) {
					$('<div></div>').addClass('transparentOverlay').appendTo('body').data("openMenus", []).css({
						'width': '100%',
						'height': '100%',
						'top': '-30px',
						'position': 'absolute',
						'display': 'none',
						'z-index': '-1'
					}).mousedown(function () {
						//Serves to close with click like other menus and also closes menu item when its clicked.
						self.closeOpenMenus($headers.closest('.inforApplicationNav'));
					});
				}

				//open submenus on a hover or if one menu on the top level is open.
				$curobj.hover(function () {
					if (this.istopheader) {
						var openMenus = $curobj.closest(".inforApplicationNav").find('ul li ul').filter(":visible");

						if ($curobj.closest(".inforApplicationNav").data("dragging")) {
							return;
						}

						if (openMenus.length > 0 && !$subul.is(":visible")) {
							$headers.removeClass("activeHeader");
							$curobj.addClass("activeHeader").focus();
							mainMenu.find(".hover").removeClass("hover");
							self._closeSiblingMenus($curobj);
							self.openMenu($subul, $curobj);
						}
					}
				});

				$curobj.hoverIntent(function () {
					if (!this.istopheader) {
						self._closeSiblingMenus($curobj);
						self.openMenu($subul, $curobj);
						$curobj.find('a.rightArrow:first').addClass("selected");
					}
				}, function () {
					//We also close on a click out closeMenu($subul,$curobj);
					$curobj.find('a.rightArrow:first').removeClass("selected");
				});
				//end hoverIntent
			});
			//end $headers.each()

			mainMenu.find("ul").css({
				display: 'none',
				visibility: 'visible'
			});

			//close sibling menus when hovering Li's at the same level.
			mainMenu.find("li").each(function () {
				var $this = $(this);
				if ($(this).children("ul").length === 0) {
					$this.hoverIntent(function () {
						self._closeSiblingMenus($(this));
					}, function () {});
				}
			});
		},
		_setVerticalOverflow: function (submenu) {
			//*If more then the number of vertical menu items fit in the page and scrollbars */
			//find the bottom of the window
			var winOffset = $(window).height(),
			rootDiv = $(submenu).closest(".inforApplicationNav"),
			bottomOfNav = rootDiv.position().top + 45,
			//(from the top page to the top of the control)
			allowableHeight = (winOffset - (bottomOfNav)) - 46,
			//add height of the scrollbar buttons..
			fittingMenus = allowableHeight / 34,
			//each menu is 30 in height
			menuCounter = 1,
			hiddenTopItems = [],
			hiddenBottomItems = [],
			visibleSubMenus = [],
			topOfNav = null;

			$(submenu).children().each(function () {
				var $li = $(this);
        $li.show();

				if ($li.hasClass("scrollUp") || $li.hasClass("scrollDown")) {
					return;
				}

				if ($li.css("display") == "none") {
					return;
				}

				if (menuCounter <= fittingMenus) {
					$li.show();
					visibleSubMenus.push($li);
				} else {
					$li.hide();
					hiddenBottomItems.push($li);
				}
				menuCounter += 1;
			});

			if (hiddenBottomItems.length > 0) {
				topOfNav = rootDiv.position().top;
				//(from the top page to the top of the control)
				if ($(submenu).parent().position().top > topOfNav && $(submenu).parent().attr("id") !== "overFlowMenu") {
					$(submenu).css("top", -($(submenu).offset().top - 30) + "px");
				}
				this._addVerticalScrollbars($(submenu), hiddenTopItems, hiddenBottomItems, visibleSubMenus);
			}
		},
		_addVerticalScrollbars: function (submenu, hiddenTopItems, hiddenBottomItems, visibleSubMenus) {
			//add to scrollbar
			this._removeVerticalScrollbars(submenu);

			//Add the vertical scroll styling/elements to the page.
			var up = $("<li class='scrollUp'><div class='scrollArrow'/></li>").prependTo(submenu),
			down = $("<li class='scrollDown'><div class='scrollArrow'/></li>").appendTo(submenu),
			self = this;

			up.attr("disabled", "disabled").unbind('mouseenter mouseleave');
			submenu.width(submenu.width());	//make a fixed with or size changes during scroll.

			//Attach the hover events on a timer
			up.mouseenter(function () {
				submenu.everyTime(200, 'up', function () {
					self._moveUp(submenu);
				}, 0);
			}).mouseleave(function () {
				submenu.stopTime("up");
			});

			//Attach the hover events on a timer
			down.mouseenter(function () {
				submenu.everyTime(200, 'down', function () {
					self._moveDown(submenu);
				}, 0);
			}).mouseleave(function () {
				submenu.stopTime("down");
			});

			//Save to each menu
			this._saveDataToMenu(submenu, hiddenTopItems, hiddenBottomItems, visibleSubMenus, up, down);
		},
		_moveUp: function (submenu) {
			//Scroll up one element
			var hiddenTopItems = $.data(submenu, "hiddenTopItems"),
			hiddenBottomItems = $.data(submenu, "hiddenBottomItems"),
			visibleSubMenus = $.data(submenu, "visibleSubMenus"),
			upButton = $.data(submenu, "upButton"),
			downButton = $.data(submenu, "downButton"),
			topElem = null,
			bottomElem = null;

			if (!upButton.isEnabled()) {
				submenu.stopTime("up");
				return;
			}

			if ($.data(submenu, "hiddenTopItems").length === 0) {
				this._enableVerticalScrollBars(submenu);
				submenu.stopTime("up");
				return;
			}

			//remove an item from the bottom of the hidden top items and  show it
			topElem = hiddenTopItems.splice(hiddenTopItems.length - 1, 1)[0];

			topElem.show();
			visibleSubMenus.splice(0, 0, topElem);

			//remove last item from the visible items and hide it.
			bottomElem = visibleSubMenus.pop();

			bottomElem.hide();
			hiddenBottomItems.push(bottomElem);

			//disable if there are no more.
			this._enableVerticalScrollBars(submenu);
			this._saveDataToMenu(submenu, hiddenTopItems, hiddenBottomItems, visibleSubMenus, upButton, downButton);
		},
		_moveDown: function (submenu) {
			//Move down one element
			var hiddenTopItems = $.data(submenu, "hiddenTopItems"),
			hiddenBottomItems = $.data(submenu, "hiddenBottomItems"),
			visibleSubMenus = $.data(submenu, "visibleSubMenus"),
			upButton = $.data(submenu, "upButton"),
			downButton = $.data(submenu, "downButton"),
			bottomElem = null,
			topElem = null;

			if (!downButton.isEnabled()) {
				submenu.stopTime("down");
				return;
			}

			if (hiddenBottomItems.length === 0) {
				this._enableVerticalScrollBars(submenu);
				submenu.stopTime("down");
				return;
			}

			//remove an item from the bottom - show it
			bottomElem = hiddenBottomItems.splice(0, 1)[0];

			bottomElem.show();
			visibleSubMenus.push(bottomElem);

			//remove an item from top - hide it
			topElem = visibleSubMenus.splice(0, 1)[0];

			topElem.hide();
			hiddenTopItems.push(topElem);

			//disable if there are no more.
			this._enableVerticalScrollBars(submenu);
			this._saveDataToMenu(submenu, hiddenTopItems, hiddenBottomItems, visibleSubMenus, upButton, downButton);
		},
		_saveDataToMenu: function (submenu, hiddenTopItems, hiddenBottomItems, visibleSubMenus, upButton, downButton) {
			$.data(submenu, "hiddenTopItems", hiddenTopItems);
			$.data(submenu, "hiddenBottomItems", hiddenBottomItems);
			$.data(submenu, "visibleSubMenus", visibleSubMenus);
			$.data(submenu, "upButton", upButton);
			$.data(submenu, "downButton", downButton);
		},
		_removeVerticalScrollbars: function (subMenu) {
			subMenu.find('.scrollUp').remove();
			subMenu.find('.scrollDown').remove();
		},
		hiddenLeftItems : [],
		hiddenRightItems : [],
		visibleItems: [],
		_setOverflow: function () {
			//Determine if there is overflow and add the scroll/overflow buttons if needed
			var self = this,
				rootDiv = self.element.closest(".inforApplicationNav"),
				expectedOffset = Math.round(rootDiv.position().top),
				itemCount = 1,
				overflow = $("#overFlowMenu");

			//show all items..
			$(".inforApplicationNav>ul>li").show();
			self.hiddenRightItems = [];

			//hide the elements that are off screen .
			$(".inforApplicationNav>ul>li").each(function () {
				var $this = $(this),
					isTopElement = (!$this.hasClass("headerDividerContainer") && !$this.hasClass("topNavSpacer")) && !$this.is("#sessionNavMenu");

				if ($this.attr("id") === "overFlowMenu") {
					return;
				}
				//(the height of the control)
				if (this.offsetTop > expectedOffset)
				//if greater than the height of the control
				{
					if (isTopElement) {
						self.hiddenRightItems.push({idx: itemCount, elm: $this});
						itemCount++;
					}

					$this.hide();
				} else {
					if (isTopElement) {
						self.visibleItems.push({idx: itemCount, elm: $this});
						itemCount++;
					}
				}
			});

			//if overflow is still hidden in an edge case on zoom then show it..
			if (overflow.length == 1 && rootDiv.is(":visible")) {
				while (!overflow.is(":visible") || Math.round(overflow.position().top) > expectedOffset) { //hide last visible.
					var hd = overflow.parent().children("li:visible").not("#overFlowMenu").last();
					hd.hide();
					self.hiddenRightItems.push({idx: itemCount, elm: hd});
					itemCount++;
				}
			}

			//add scrollbars if needed
			if (self.hiddenRightItems.length > 0) {
				self._addScrollbars();
			} else {
				self._removeScrollbars();
			}

			itemCount--;
		},
		_removeScrollbars: function () {
			//Remove the overflow (and formerly scroll buttons) from the dom
			$("#overFlowMenu").hide();
		},
		_hideLast: function () {
			//Bump first element off of visible Items and hide it
			var self = this,
				lastVisible = self.visibleItems.splice(self.visibleItems.length - 1, 1)[0];

			if (lastVisible === undefined) {
				return;
			}

			lastVisible.elm.hide();
			this.visibleItems.sort(this._sortByIdx);
			this.hiddenRightItems.push(lastVisible);
			this.hiddenRightItems.sort(this._sortByIdx);
		},
		_checkButtonOverFlow: function () {
			//Additional Check on the left scroll button itself is overflowing. if it is hide the last visible item.
			var rightbutton = $("#overFlowMenu"),
			rootDiv = rightbutton.closest(".inforApplicationNav"),
			bottomOfNav = (rightbutton.length > 0 ? rootDiv.offset().top + 30 : 30),
			overFlow = $("#overFlowMenu"),
			rightArea = rootDiv.find(".inforApplicationNavRight");

			if (rightbutton.length === 0) {    //no overflow. empty div
				return;
			}

			if (rightbutton.length > 0 && rightbutton.offset().top >= bottomOfNav) {
				this._hideLast();
			}

			if (overFlow.length > 0 && overFlow.offset().top >= bottomOfNav) {
				this._hideLast();
			}

			if (overFlow.length > 0 && overFlow.offset().top >= bottomOfNav) {
				this._hideLast();
			}
			//look for a special area and hide an item if need be

			if (rightArea.length > 0) {
				rightArea.show();
				if (rightbutton.offset().top >= bottomOfNav) {
					this._hideLast();
				}
			}

			//if they are still off hide them
			if (rightbutton.length > 0 && rightbutton.offset().top >= bottomOfNav) {
				this._hideLast();
				//rightbutton.hide();
			}

			if (overFlow.length > 0 && overFlow.offset().top >= bottomOfNav) {
				overFlow.hide();
			}

			if (rightArea.length > 0 && rightArea.children().first().offset().top >= bottomOfNav) {
				this._hideLast();
			}
			rightArea.show();
		},
		_addScrollbars: function () {
			//Add the scroll buttons (horizontal) to the dom and add events.
			this._removeScrollbars();
			this._addOverflow();
			this._checkButtonOverFlow();
		},
		_enableVerticalScrollBars: function (submenu) {
			var up = $.data(submenu, "upButton"),
			down = $.data(submenu, "downButton"),
			hiddenBottomItems = $.data(submenu, "hiddenBottomItems"),
			hiddenTopItems = $.data(submenu, "hiddenTopItems");

			if (hiddenBottomItems.length === 0) {
				down.attr("disabled", "disabled");
			} else {
				down.removeAttr("disabled");
			}

			if (hiddenTopItems.length === 0) {
				up.attr("disabled", "disabled");
			} else {
				up.removeAttr("disabled");
			}
		},
		_sortByIdx: function (a, b) {
			//Sort Method for the scrolling arrays.
			var x = a.idx,
				y = b.idx;
			return ((x < y) ? -1: ((x > y) ? 1: 0));
		},
		_addOverflow: function () {
			//Find all of the items including those taht arent visible and add them to the overflow menu button
			var overflow = $("#overFlowMenu"),
			root = overflow.closest(".inforApplicationNav"),
			self = this,
			$ul = overflow.children("ul"),
			originalIndex;

			overflow.show();

			if ($ul.is(":visible")) {
				$ul.hide();
				return;
			}

			self._closeSiblingMenus(overflow);

			//add the menu items
			$ul.children().remove();

			//build the submenu
			$(".inforApplicationNav>ul>li").each(function () {
				var $this = $(this),
					clone = null;

				if ($this.attr("id") === "overFlowMenu") {
					return true;
				}

				clone = $this.clone();
				clone.data("menuItem", $this);
				$ul.append(clone);
				overflow.find("ul .downArrow").remove();
			});

			if (self.options.sortable) {
				$ul.sortable({
					placeholder: 'inforDragPlaceholder',
					helper: 'clone',
					forcePlaceholderSize: true,
					connectWith: 'ul',
					revert: 100,
					start: function (event, ui) {
						root.data("dragging", true);
						originalIndex = ui.item.index();
					},
					stop: function (event, ui) {
						var elem = ui.item.data("menuItem");

						if (originalIndex === ui.item.index()) {
							return;
						}
						if (ui.originalPosition.top > ui.position.top) {
							elem.parent().children().eq(ui.item.index()).before(elem);
						} else {   //dragged up
							elem.parent().children().eq(ui.item.index()).after(elem);
						}
						//dragged down
						root.data("dragging", false);
					}
				});
			}
		},
		_checkOverflowContent: function (ul) {
			var self = this;
			if (self.options.sortable) {
				ul.find("li").show();
				return;
			}

			ul.find("li").each(function () {
				var li =  $(this),
					menuItem = li.data("menuItem");
				li.show();
				if (menuItem && menuItem.is(":visible")) {
					li.hide();
				}
			});
		},
		closeOpenMenus: function (root) {
			if (root.length === 0) {	//no css.
				return;
			}
			this.isOpenedFromOverFlow = false;
			//Close all menus and hide the overlay
			root.find('ul li ul').filter(":visible").not(".inforMegaMenuColumn").hide();
			root.find(".activeHeader").removeClass("activeHeader");

			$('body').find(".transparentOverlay").css({
				'z-index': '-1',
				'display': 'none'
			});
			$("#inforObjectOverlay").hide();

			root.css({
				"overflow": "hidden"
			});

			$(".inforBkgrndIFrame").remove();
		},
		_closeSiblingMenus: function ($curobj) {     //Close ALL Menus at the same level (no animation)
			var rootDiv = $curobj.closest(".inforApplicationNav");
			if (rootDiv.length === 0) {	//no css.
				return;
			}
			$curobj.siblings("li").removeClass("activeHeader").children("ul").filter(":visible").not(".inforMegaMenuColumn").each(function () {
				var $targetul = $(this);
				$targetul.hide();
				$targetul.find("ul").hide();
				$targetul.find(".activeHeader").removeClass("activeHeader");

				//close any child menus of these
				$targetul.children("ul").filter(":visible").not(".inforMegaMenuColumn").hide();
				$targetul.find("ul").each(function () {
					var ul = $(this);
					if (ul.data("iFrame")) {
						ul.data("iFrame").remove();
					}
				});
				if ($targetul.data("iFrame")) {
					$targetul.data("iFrame").remove();
				}
			});
		},
		timeout: null,
		openMenu: function ($subul, $curobj, isCallback) {
			var $headers = $subul.children("li").has('ul'),
			self = this,
			subLis = $subul.find('ul li'),
			expectedHeight = null,
			header = null,
			isOpen = null,
			response = null,
			menuleft = null,
			rootDiv = null,
			bottomOfNav = null,
			offSetTop = null,
			winHeight = null;

			rootDiv = $subul.closest(".inforApplicationNav");
			if (rootDiv.length === 0) {	//no css.
				return;
			}

			$curobj.closest(".inforApplicationNav").css({
				"height": "",
				"overflow": ""
			});
			this._attachSubMenus($headers);

			$('body').find(".transparentOverlay").css({
				'z-index': '2',
				'display': ''
			});
			$("#inforObjectOverlay").show();

			//Add Click Event to each menu item
			//For now this helps close the menu and remove the overlay - later we can use this to track session info.
			subLis.each(function () {
				var $this = $(this);
				$this.off('click');
				$this.on('click', 'a', function (e) {
					self.closeOpenMenus($(this).closest('.inforApplicationNav'));
					e.stopPropagation();
					//prevent from reopening on header click event which will fire.
					if (self.options.callback) {
						self.options.callback(e);
					}
				});
			});

			//Click on the items that have submenus
			$subul.off('click');
			$subul.on('click', 'a', function (e) {
				self.closeOpenMenus($(this).closest('.inforApplicationNav'));
				e.stopPropagation();
				//prevent from reopening on header click event which will fire.
				if (self.options.callback) {
					self.options.callback(e);
				}
			});

			header = $curobj.get(0);
			//reference header LI as DOM object
			isOpen = $subul.is(":visible");
			if (isOpen) {
				return;
			}

			if ($(header).is("#overFlowMenu")) {
				self._checkOverflowContent($subul);
			}

			//May have a dynamic call setup
			if (!isCallback && self.options.loadMenu !== null && header.id !== "overFlowMenu") {

				// Call back for the Ajax Call.
				response = function ($subul, $curobj) {
					//Add The new content
					var newSubmenus = $subul.find("ul");
					if (newSubmenus.length > 0) {
						self._attachSubMenus(newSubmenus.parent());
					}
					$curobj.removeClass("inforBusyIndicator appNav");
					self.openMenu($subul, $curobj, true);
				};

				$curobj.addClass("inforBusyIndicator appNav");
				self.options.loadMenu($subul, $curobj, response);
				return;
			}

			header._offsets = {
				left: $curobj.offset().left,
				top: $curobj.offset().top
			};

			menuleft = header.istopheader ? 0: header._dimensions.w;
			//calculate this sub menu's offsets from its parent
			if (!header.istopheader) {
				menuleft = menuleft - 2;     //padding.
			}

			//if 1 or less queued animations
			if ($subul.queue().length <= 1) {
				if (!Globalize.culture().isRTL) {
					$subul.css({
						left: menuleft + 14 + "px"
					}).animate({
						height: 'show',
						opacity: 'show'
					}, 100, function () {
						//append an iFrame so it opens up over applets ect
						if (self.options.backgroundIFrame) {
							self._addIFrame($subul);
						}
					});
				}
				else {
					if (menuleft <= 0) {
						menuleft = "-3";
					}

					$subul.css({
						right: menuleft + "px",
						width: $subul.width()
					}).animate({
						height: 'show',
						opacity: 'show'
					}, 3);
				}
			}

			bottomOfNav = rootDiv.position().top + 20;

			if (!header.istopheader) {
				if (Globalize.culture().isRTL) {
					$subul.css({
						right: parseInt($subul.parent("li").width(), 10) + 6 + "px"
					});

					if ($subul.offset().left < 0) {
						$subul.css({
							"top": "10px",
							"right": - (parseInt($subul.css("right"), 10) + 2) + "px"
						});
					}

					if (parseInt($subul.parent().parent().css("right"), 10) < -3) {
						$subul.css("right", -(parseInt($subul.css("right"), 10) + 2) + "px");
						if ($subul.offset().left + $subul.width() > $(window).width()) {
							$subul.css("right", Math.abs(parseInt($subul.css("right"), 10) + 2) + "px");
						}
					}
				} else {
					$subul.position({
						my: "left top",
						at: "right top",
						of: $subul.parent("li"),
						collision: "flip"
					});

					$subul.find(".leftArrow").addClass("rightArrow").removeClass("leftArrow");

					if ($subul.position().left < 0) {
						$subul.find(".rightArrow").addClass("leftArrow").removeClass("rightArrow");
					}
					if ($(window).width() - $subul.width() < $subul.offset().left + $subul.width()) {
						$subul.find(".rightArrow").addClass("leftArrow").removeClass("rightArrow");
					}
					//see if the last open flowed left - continue left until we reach the left edge
					if ($subul.parent().parent().position().left < -6) {
						$subul.position({
							my: "right top",
							at: "left top",
							of: $subul.parent(),
							collision: "fit"
						});
						$subul.find(".rightArrow").addClass("leftArrow").removeClass("rightArrow");

						if ($subul.offset().left <= 0) {
							$subul.position({
								my: "left top",
								at: "right top",
								of: $subul.parent(),
								collision: "fit"
							});

							$subul.parent().find(".leftArrow").addClass("rightArrow").removeClass("leftArrow");
							$subul.find(".leftArrow").addClass("rightArrow").removeClass("leftArrow");
						}
					}
				}
			}

			if (header.istopheader && ($subul.offset().left + $subul.width()) > ($(window).width() - ($subul.width() * 2))) {
				$subul.find(".rightArrow").addClass("leftArrow").removeClass("rightArrow");
			}

			if ($(header).is("#overFlowMenu")) {
				$subul.find(".rightArrow").addClass("leftArrow").removeClass("rightArrow");
			}

			//See if it wont fit on the right and move it over.. Use offet+width+padding
			if ($subul.offset().left + $subul.width() + 28 > $(window).width()) {
				$subul.css("left", ($(window).width() - ($subul.offset().left + $subul.width() + (header.istopheader ? 30 : 0))) + "px");

				if (!header.istopheader) {
					$subul.position({
						my: "right",
						at: "left-10",
						collision: "fit flip",
						of: $subul.parent()
					});
				}
			}

			//this is the expected height of the menu numItems*30 (the width of each li)+10 (the bottom padding)
			expectedHeight = ($subul.children("li:visible").length * 30) + 10;
			offSetTop = $subul.offset().top;
			if (offSetTop < 0) {
				offSetTop = bottomOfNav;
			}
			winHeight = $(window).height() - (bottomOfNav);

			//overflow expected and won't fit
			if ((offSetTop + expectedHeight > winHeight) || winHeight < expectedHeight) {
      	//move menu to just under the top
				self._setVerticalOverflow($subul);
			} else {
				if (offSetTop + expectedHeight > winHeight) {   //see if it will oveflow past the bottom and fit if to be moved up
					$subul.css("top", "-" + (offSetTop + expectedHeight - winHeight) + "px");

					if ($subul.offset().top < 30) {
						$subul.css("top", "22px");
					}
				}
			}

			if ($subul.parent().parent().parent().hasClass("inforApplicationNav")) {
				rootDiv.find(".activeHeader").removeClass("activeHeader");
			}
			$subul.parent("li").addClass("activeHeader").focus();
			rootDiv.find("a.hover").removeClass("hover");
			$subul.find(".inforMegaMenuColumn").show();
		},
		_addIFrame: function (elem) {
			var bkgrndIFrame = $('<div style="position:absolute" class="inforBkgrndIFrame"><iframe title="empty" frameborder="0" style="height:100px;width:100px;"></iframe></div>').appendTo("body");
			bkgrndIFrame.css({
				"left": elem.offset().left,
				"top": elem.offset().top,
				"z-index": 1
			});
			bkgrndIFrame.children().eq(0).height(elem.height()).width(elem.width() + 38);
			//padding
			bkgrndIFrame.show();
			elem.data("iFrame", bkgrndIFrame);
		}
	});

})(jQuery);