/*
* Infor MessageDialog and Dialog is heavily based on jQuery UI Dialog 1.8.13
*/
(function ($, undefined) {
	var uiDialogClasses =
		'inforDialog' ,
	sizeRelatedOptions = {
		buttons: true,
		height: true,
		maxHeight: true,
		maxWidth: true,
		minHeight: true,
		minWidth: true,
		width: true
	},
	resizableRelatedOptions = {
		maxHeight: true,
		maxWidth: true,
		minHeight: true,
		minWidth: true
	},
	attrFn = $.attrFn || {
		val: true,
		css: true,
		html: true,
		text: true,
		data: true,
		width: true,
		height: true,
		offset: true,
		click: true
	};
	$.widget("ui.inforDialog", {
		options: {
			autoOpen: true,
			buttons: {},
			closeOnEscape: false,
			closeText: 'Close',
			dialogType: 'General',
			draggable: true,
			hide: null,
			height: 'auto',
			maxHeight: false,
			maxWidth: false,
			messageTitle: '',
			minHeight: 150,
			minWidth: 150,
			modal: false,
			icon: 'blank',
			minimizable: false, //Adds a min and max button
			detailedMessage: '',
			autoFocus: true,	//focus the first tabbable field.
			position: {
				my: 'center',
				at: 'center',
				collision: 'fit',
				using: function (pos) {
					var $this = $(this);

					$this.css({
						position: 'absolute',
						left: '48%',
						'margin-left': 0 - ($(this).width() / 2),
						top: '38%',
						'margin-top': (0 - ($(this).height() / 3))
					});

					/*nned to call twice for some reason to center in the page...*/
					$this.css({
						position: 'absolute',
						left: '48%',
						'margin-left': 0 - ($(this).width() / 2),
						top: '38%',
						'margin-top': (0 - ($(this).height() / 3))
					});

					//center in a scrollable area.
					if ($this.parent().is("body") && $this.parent().height() > $(window).height()+5 && $(window).scrollTop()>0) {
						$this.css("margin-top",0);
						$this.css("top", $(window).scrollTop() + Math.max($(window).height()/2 - $this.height()/2 - 20 ,5) + "px");
						return;
					}
				}
			},
			resizable: false,
			show: null,
			stack: true,
			title: '',
			width: 300,
			zIndex: 2000,
			close: null,	//a call back that fires when the close x is clicked.
			beforeClose: null //a callback that fires when the close button is clicked.
		},
		_create: function () {
		var self = this,
			options = self.options,
			title = options.title || '&#160;',
			uiDialog = (self.uiDialog = $('<div><div class="inforDialogTitleBar"></div></div>'))
				.appendTo(document.body)
				.hide()
				.addClass(uiDialogClasses)
				.css({
					zIndex: options.zIndex
				})
				// setting tabIndex makes the div focusable
				// setting outline to 0 prevents a border on focus in Mozilla
				.attr('tabIndex', -1).css('outline', 0).keydown(function (event) {
					if (options.closeOnEscape && event.keyCode &&
						event.keyCode === $.ui.keyCode.ESCAPE) {

						self.close(event);
						event.preventDefault();
					}
				})
				.mousedown(function (event) {
					self.moveToTop(false, event);
				});

				this.element.addClass("inforDialogContent");

				var titlebar = uiDialog.find(".inforDialogTitleBar")
				if (options.icon || options.dialogType!="General") {
					titlebar.append("<div class='inforIcon "+options.icon+"'></div>");
				}
				titlebar.append($('<div class="caption"></div>').html(title));
				titlebar.append('<button type="button" class="inforCloseButton"><i>close</i></button>');

				if (options.messageTitle)
					uiDialog.append('<div class="shortMessage"></div>');

				uiDialog.append('<div class="detailedMessage"></div>');

				self.element.show()
					.removeAttr('title')
					.appendTo(uiDialog);

				if (options.buttons)
					uiDialog.append('<div class="dialogButtonBar"></div>');

				//Add remove events for the inforCloseButton
				uiDialogTitlebarClose = uiDialog.find(".inforCloseButton");
				uiDialogTitlebarClose.attr("title",Globalize.localize(options.closeText))
					.inforToolTip()
					.click(function (event) {
							self.close(event);
							return false;
						});

				if (options.resizable && $.fn.resizable) {
					self._makeResizable();
				}

				self._isOpen = false;

				if (options.minimizable) {
					self._makeMinimizable();
				}
	},
	_init: function () {
		if (this.options.autoOpen) {
				this.open();
			}
		},
		widgetEventPrefix : 'dialog',
		destroy: function () {
			var self = this;

			if (self.overlay) {
				self.overlay.destroy();
			}
			self.uiDialog.hide();
			self.element
			.unbind('.dialog')
			.removeData('dialog')
			.hide().appendTo('body');
			self.uiDialog.remove();
			return self;
		},

		widget: function () {
			return this.uiDialog;
		},

		close: function (event) {
			var self = this,
			maxZ, thisZ;

			if (false === self._trigger('beforeClose', event)) {
				return;
			}

			if (self.overlay) {
				self.overlay.destroy();
			}

			$(document).unbind('keydown.inforDialog'+self.uiDialog.find(".inforDialogContent").attr("id"));

			if (self.firstTabbable)
				self.firstTabbable.remove();

			self._isOpen = false;

			if (self.options.hide) {
				self.options.hide.complete = function() {
					self._trigger('close', event);
				};
				self.uiDialog.hide(self.options.hide);
			} else {
				self.uiDialog.hide();
				self._trigger('close', event);
			}

			// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
			if (self.options.modal) {
				maxZ = 0;
				$('.inforDialog').each(function () {
					if (this !== self.uiDialog[0]) {
						thisZ = $(this).css('z-index');
						if (!isNaN(thisZ)) {
							maxZ = Math.max(maxZ, thisZ);
						}
					}
				});
				$.ui.inforDialog.maxZ = maxZ;
			}

			self.options.position = '';         // reset any previously sent dialog positions

			if (self.options.minimizable && self.isMinimized) {
				self.maximize(true);
			}

			return self;
		},

		isOnTop: function () {
			var isLast = $('.inforDialog:visible').last()[0]==this.uiDialog[0];
			return isLast;
			},

		isOpen: function () {
			return this._isOpen;
		},

		// the force parameter allows us to move modal dialogs to their correct
		// position on open
		moveToTop: function (force, event) {
			var self = this,
			options = self.options;

			if ((options.modal && !force) ||
			(!options.stack && !options.modal)) {
				return self._trigger('focus', event);
			}

			if (options.zIndex > $.ui.inforDialog.maxZ) {
				$.ui.inforDialog.maxZ = options.zIndex;
			}
			if (self.overlay) {
				$.ui.inforDialog.maxZ += 1;
				self.overlay.$el.css('z-index', $.ui.inforDialog.overlay.maxZ = $.ui.inforDialog.maxZ);
			}
			$.ui.inforDialog.maxZ += 1;
			self.uiDialog.css('z-index', $.ui.inforDialog.maxZ);
			self._trigger('focus', event);

			return self;
		},
		firstTabbable: null,
		open: function () {
			if (this._isOpen) { return; }

			var self = this,
				uiDialogTitle,
				$topDiv = $(self.element.parent()),
				options = self.options,
				uiDialog = self.uiDialog;

			//set messages
			if (self.options.messageTitle!='')
				uiDialog.find(".shortMessage").html(self.options.messageTitle);

			uiDialogTitle = uiDialog.find(".caption").uniqueId().html(self.options.title);

			uiDialog.attr({
				role: "dialog",
				"aria-labelledby": uiDialogTitle.attr( "id" )
			});

			//for any of the message types - info/error/confirmation/warning show an icon
			var imageClass = "";
			if (options.dialogType == "Information")
				imageClass = "blank";

			if (options.dialogType == "Confirmation")
				imageClass = "blank";

			if (options.dialogType == "Error")
				imageClass = "error";

			if (options.dialogType == "Alert")
				imageClass = "alert";

			if (options.dialogType == "General") {
				imageClass = options.icon;
			}

			self._createButtons(options.buttons);

			//hide/show the close button
			if (!self.options.showTitleClose)
				uiDialog.find(".inforCloseButton").hide();
			else
				uiDialog.find(".inforCloseButton").show();

			//add/update remove the severity image.
			if (imageClass) {
				var severityImage = uiDialog.find(".inforIcon");
				if (imageClass == "") {
					severityImage.remove();
				} else {
					severityImage.attr("class", "").addClass("inforIcon "+imageClass);
				}
			}

			//Add/update remove the Detail Message
			//detailedMessage
			if (options.dialogType =="General")
				uiDialog.find(".detailedMessage").remove();
			else
				uiDialog.find(".detailedMessage").html(self.options.detailedMessage);

			self.overlay = options.modal ? new $.ui.inforDialog.overlay(self) : null;
			//set the title
			$topDiv.find(".caption").html(self.options.title);

			self.moveToTop(true);
			//options.show
			self._size();
			uiDialog.show().css("visibility","");
			self._position(options.position);

			if (options.draggable && $.fn.draggable) {
				self._makeDraggable();
			} else {
				self.uiDialog.find(".inforDialogTitleBar").wrap("<div class='noDragHandle'></div>");
			}

			self.uiDialog.find('.autoLabelWidth').find('.inforLabel').autoWidth();
			uiDialog.hide();
			uiDialog.show("fade", 300, function(){
				self._sizeToFit();
				self._isOpen = true;
				setTimeout(function () {
					self._trigger('open');
					//find and refresh all grids..
					uiDialog.find(".inforDataGrid").each(function () {
						var grid = $(this).data("gridInstance");
						if (grid) {
							grid.reinit();
						}
					});
				}, 10);
			});

			self.firstTabbable = $("<button type='button' id='tabFocusField' ></button>")
				.css({"opacity":"0" ,"position":"absolute" ,"left":"-400px"})
				.focus(function(e) {
					self.uiDialog.find(':tabbable:first').focus();
					return;
				}).prependTo("body");

			// prevent tabbing out of modal and non-modal dialogs
			var content = self.uiDialog.find(".inforDialogContent");
				uid = content.attr("id");
			if (!uid){
				uid = content.uniqueId();
			}

			$(document).bind('keydown.inforDialog'+content.attr("id"), function (event) {
					var isSignIn = self.uiDialog.hasClass("inforSignInDialog"),
						defaButton = self.uiDialog.find(".inforFormButton.default"),
            isLookup = self.uiDialog.parent().find(".inforLookupGridBoxShadow");

					if ($(event.target).is("textarea") || $(event.target).hasClass("inforDropDownList")) {
						return; 	//ignore enter if in a text area.
					}

					if (event.keyCode==13 && !$(event.target).is(":button") && !$(event.target).is(".inforSearchField") && $(event.target).closest(".inforDataGrid").length === 0) {

						if (isLookup.length > 0 || (!self.isOnTop() && !isSignIn))
							return;

						//find the default button and press it...
						if (!defaButton.is(":focus") && defaButton.is(":visible")) {
							defaButton.trigger('click');
						}
						return;
					}

					if (event.keyCode !== $.ui.keyCode.TAB) {
						return;
					}

					var tabbables = $(':tabbable', self.uiDialog),
					first = tabbables.filter(':first'),
					last = tabbables.filter(':last');

					if (event.target.nodeName =="HTML") {
						//tabbed in from the address bar to the page
						first.focus(1);
						return false;
					}
					if (event.target === last[0] && !event.shiftKey) {
						first.focus(1);
						return false;
					} else if (event.target === first[0] && event.shiftKey) {
						last.focus(1);
						return false;
					}
			});

			// set focus to the first tabbable element in the content area or the first button
			// if there are no tabbable elements, set focus on the dialog itself
			if (self.options.autoFocus) {
				setTimeout(function(){
					var firstInput = self.uiDialog.find('input:first:visible:tabbable');

					if (firstInput.length==0)
						firstInput= self.uiDialog.find('textarea:first:visible:tabbable');

					if (firstInput.length==0)
						firstInput = self.uiDialog.find('button.default');

					if (firstInput.length>0) {
						firstInput.focus();
						firstInput.select();
					} else {
						self.uiDialog.focus();
					}
				}, 100);
			}

			setTimeout(function(){
				$("#inforTooltip").hide();
			}, 300);

			//refresh any grids.
			self.uiDialog.find(".inforDataGrid").each(function() {
					var grid = $(this).data("gridInstance");
					if (grid)
						grid.resizeCanvas();
			});

			return self;
		},
		_sizeToFit: function() {	//size to fit the window.
			var padding = 110,	//top header and bottom buttons.
				elem = this.element,
				options = this.options,
				topDiv = $(elem.parent()),
				autoHeight = elem.height(),
				isFixedSize = (options.minWidth == options.width && options.minHeight == options.height);

			//center in a scrollable area.
			if (topDiv.parent().is("body") && topDiv.parent().parent().height() > $(window).height()+5 && $(window).scrollTop()>0) {
				topDiv.css("top",$(window).scrollTop() + Math.max($(window).height()/2 - topDiv.height()/2 - 20),5);
				return;
			}

			if (isFixedSize && options.height!="auto" && options.width!="auto") {
				return;
			}

			if (topDiv.length==0) {
				return;
			}

			var topPos = topDiv.offset().top;

			if (autoHeight + padding > $(window).height() ) {
				//shrink and add scrolling..
				autoHeight = $(window).height() - padding - 38;
				elem.height(autoHeight);
				elem.css({"overflow-y" : "scroll", "padding-right" : "20px"});
				topDiv.css({"top": "5px", "margin-top":"0"});
			}
		},
		_createButtons: function (buttons) {
			var self = this,
				hasButtons = false,
				uiButtonBar = self.uiDialog.find(".dialogButtonBar");

			// if we already have a button pane, remove it
			uiButtonBar.empty();

			if (typeof buttons === 'object' && buttons !== null) {
				$.each(buttons, function () {
					return !(hasButtons = true);
				});
			}
			if (hasButtons) {
				$.each(buttons, function (name, props) {
					props = $.isFunction(props) ?
					{ click: props, text: name} :
					props;
					var button = $('<button type="button" class="inforFormButton"></button>')
					.click(function () {
						props.click.apply(self.element[0], arguments);
					})
					.appendTo(uiButtonBar);
				$.each(props, function (key, value) {
						if (key === "click") {
							return;
						}
						if (key === "text") {
						button.html(value);
						return
						}
						if (key === "isDefault" && value==true) {
							button.addClass("default");
						}
						if (key in attrFn) {
						button[key](value);
						} else {
						button.attr(key, value);
						}
					});
					if ($.fn.button) {
						button.button();
					}
				});
			}
		},
		minimize: function() {
			var self = this;

			self.isMinimized = true;
			self.normalStyle = self.uiDialog.attr('style');
			self.normalWidth = self.uiDialog[0].style.width;

			self.uiDialog.css({"height":"16px",
							"min-height": "16px",
							"width": self.uiDialog.find(".caption").html().textWidth()+150,
							"bottom": 0,
							"left": "",
							"top": "",
							"margin-left": "",
							"margin-top": "",
							"position": "fixed"
			});
			self.uiDialog.contents().not(".dragHandle").hide();
			self.uiDialog.find(".inforDialogTitleBar").css("border-bottom","none");

			self.maxButton.removeAttr("disabled").focus();
			self.minButton.attr("disabled",'');
		},
		maximize: function(hidden) {
			var self = this;
			self.isMinimized = false;
			if (hidden)
				self.normalStyle += ";visibility:hidden";

			self.uiDialog.attr('style',self.normalStyle).css("width",self.normalWidth);
			self.uiDialog.contents().not(".dragHandle").show();
			self.uiDialog.find(".inforDialogTitleBar").css("border-bottom","1px solid #B3B3B3");

			self.maxButton.attr("disabled",'');
			self.minButton.removeAttr("disabled",'').focus();
		},
		_makeMinimizable: function() {
			var self = this;

			self.minButton = $('<button class="inforMinimizeButton" type="button"><i></i></button>').attr("title", Globalize.localize("Minimize")).inforToolTip(),
      self.maxButton = $('<button class="inforMaximizeButton" type="button" disabled><i></i></button>').attr("title", Globalize.localize("Maximize")).inforToolTip(),
      self.isMinimized = false;
			self.normalStyle = {};

			self.uiDialog.find(".inforCloseButton").after(self.maxButton,self.minButton);
			self.minButton.click(function(){
				self.minimize();
			});

			self.maxButton.click(function(){
				self.maximize();
			});
		},
		_makeDraggable: function () {
			var self = this,
			options = self.options,
			doc = $(document),
			containmentCoords,
			heightBeforeDrag;

			function filteredUi(ui) {
				return {
					position: ui.position,
					offset: ui.offset
				};
			}

			if (!self.uiDialog.find(".inforDialogTitleBar").parent().is(".dragHandle")) {
				self.uiDialog.find(".inforDialogTitleBar").wrap("<div class='dragHandle'></div>");
			}

			containmentCoords = [
				Math.abs(parseInt(self.uiDialog.css("margin-left"), 10)),
				Math.abs(parseInt(self.uiDialog.css("margin-top"), 10)),
				($(document).width() - self.uiDialog.width() - parseInt(self.uiDialog.css("margin-left"), 10) - 30),
				($(document).height() - self.uiDialog.height() - parseInt(self.uiDialog.css("margin-top"), 10) - 45)
			];

			self.uiDialog.draggable({
				cancel: '.inforCloseButton,.inforMaximizeButton,.inforMinimizeButton',
				handle: '.dragHandle',
				containment: containmentCoords,	//'document'
				scroll: false,
				start: function (event, ui) {
					heightBeforeDrag = options.height === "auto" ? "auto" : $(this).height();
					$(this).height($(this).height());
					self._trigger('dragStart', event, filteredUi(ui));
					$(".inforDropdownList").css("left","-9999px");
					$(".inforMenu").hide();	//closes any open drop downs or menus.
				},
				drag: function (event, ui) {
					self._trigger('drag', event, filteredUi(ui));
				},
				stop: function (event, ui) {
					options.position = [ui.position.left - doc.scrollLeft(),
					ui.position.top - doc.scrollTop()];
					if (!self.isMinimized)
						$(this).height(heightBeforeDrag);
					self._trigger('dragStop', event, filteredUi(ui));
				}
			});
		},

		_makeResizable: function (handles) {
			var self = this;

			self.uiDialog.resizable({
				handles: "se",
				minWidth: (self.options.minWidth < 250 ? 250 : self.options.minWidth),
				minHeight: (self.options.minHeight < 100 ? 100 : self.options.minHeight),
				maxWidth: self.options.maxWidth,
				maxHeight: self.options.maxHeight,
				alsoResize: $(self.element, self.element.parent()),
				start: function() {
					var ifr = self.element.find('iframe'),
						overlay = $("<div id='rsOverlay'></div>");

					if (ifr.length > 0) {
						overlay.css({height: ifr.height(), position:"absolute", top: ifr.position().top, left:0, width: "100%"});
						ifr.parent().append(overlay);
					}
				},
				stop: function(){
					$('#rsOverlay').remove();
				}
			});

			//move the resize element so its placed in the right spot
			var bottom = self.uiDialog.find(".dialogBottomRight");
			self.uiDialog.find(".ui-resizable-handle").appendTo(bottom).css({"position":"relative", "top":"1px" , "left": "5px"});
		},

		_minHeight: function () {
			var options = this.options;

			if (options.height === 'auto') {
				return options.minHeight;
			} else {
				return Math.min(options.minHeight, options.height);
			}
		},

		_position: function (position) {
		var myAt = [],
			offset = [0, 0],
			isVisible;

			if (position) {
				if (typeof position === 'string' || (typeof position === 'object' && '0' in position)) {
					myAt = position.split ? position.split(' ') : [position[0], position[1]];
					if (myAt.length === 1) {
						myAt[1] = myAt[0];
					}

					$.each(['left', 'top'], function (i, offsetPosition) {
						if (+myAt[i] === myAt[i]) {
							offset[i] = myAt[i];
							myAt[i] = offsetPosition;
						}
					});

					position = {
						my: myAt.join(" "),
						at: myAt.join(" "),
						offset: offset.join(" ")
					};
				}

				position = $.extend({}, $.ui.inforDialog.prototype.options.position, position);
			} else {
				position = $.ui.inforDialog.prototype.options.position;
			}

			// need to show the dialog to get the actual offset in the position plugin
			isVisible = this.uiDialog.is(':visible');
			if (!isVisible) {
				this.uiDialog.show();
			}

			this.uiDialog.position($.extend({ of: window }, position));

			if (!isVisible) {
				this.uiDialog.hide();
			}
		},

		_setOptions: function (options) {
			var self = this,
			resizableOptions = {},
			resize = false;

			$.each(options, function (key, value) {
				self._setOption(key, value);

				if (key in sizeRelatedOptions) {
					resize = true;
				}
				if (key in resizableRelatedOptions) {
					resizableOptions[key] = value;
				}
			});

			if (resize) {
				this._size();
			}
			if (this.uiDialog.is(":data(ui-resizable)")) {
				this.uiDialog.resizable("option", resizableOptions);
			}
		},

		_setOption: function (key, value) {
			var self = this,
			uiDialog = self.uiDialog;

			switch (key) {
				//handling of deprecated beforeclose (vs beforeClose) option
				//Ticket #4669 http://dev.jqueryui.com/ticket/4669
				//TODO: remove in 1.9pre
				case "beforeclose":
					key = "beforeClose";
					break;
				case "buttons":
					self._createButtons(value);
					break;
				case "disabled":
					if (value) {
						uiDialog.addClass('inforMessageDialogDisabled');
					} else {
						uiDialog.removeClass('inforMessageDialogDisabled');
					}
					break;
				case "draggable":
					var isDraggable = uiDialog.is(":data(draggable)");
					if (isDraggable && !value) {
						uiDialog.draggable("destroy");
					}

					if (!isDraggable && value) {
						self._makeDraggable();
					}
					break;
				case "position":
					self._position(value);
					break;
				case "resizable":
					// currently resizable, becoming non-resizable
					var isResizable = uiDialog.is(":data(resizable)");
					if (isResizable && !value) {
						uiDialog.resizable('destroy');
					}

					// currently resizable, changing handles
					if (isResizable && typeof value === 'string') {
						uiDialog.resizable('option', 'handles', value);
					}

					// currently non-resizable, becoming resizable
					if (!isResizable && value !== false) {
						self._makeResizable(value);
					}
					break;
				case "title":
					// convert whatever was passed in o a string, for html() to not throw up
					$(".inforMessageDialogTitle", self.uiDialogTitlebar).html("" + (value || '&#160;'));
					break;
			}

			$.Widget.prototype._setOption.apply(self, arguments);
		},

		_size: function () {
			/* If the user has resized the dialog, the .inforDialog and .inforMessageDialogContent
			* divs will both have width and height set, so we need to reset them
			*/
			var options = this.options,
				nonContentHeight,
				minContentHeight,
				isVisible = this.uiDialog.is(":visible"),
				isFixedSize = !("auto" == options.width && options.height == "auto");

			// reset content sizing
			this.element.show().css({
				width: 'auto',
				minHeight: 0,
				height: 0
			});

			// reset wrapper sizing
			// determine the height of all the non-content elements
			nonContentHeight = this.uiDialog.css({
				height: 'auto',
				width: options.width
			})
			.height();

			if (options.maxWidth && options.width == "auto" && parseInt(this.uiDialog.width(),10) > options.maxWidth) {
				this.element.css("width", options.maxWidth);
			}
			minContentHeight = Math.max(0, (options.minHeight=="auto" ? 0 : options.minHeight) - nonContentHeight);

			if (options.height === "auto") {
				this.uiDialog.show();
				var autoHeight = this.element.css("height", "auto").height();

				if (!isVisible) {
					this.uiDialog.hide();
				}

				this.element.height(Math.max(autoHeight, minContentHeight));

			} else {
				this.element.height(Math.max(options.height - nonContentHeight, 0));
			}

			if (this.uiDialog.is(':data(resizable)')) {
				this.uiDialog.resizable('option', 'minHeight', this._minHeight());
			}

			if (isFixedSize) {
				this.uiDialog.css({
					height: options.height,
					width: options.width
				});
			}
		}
	});

	$.extend($.ui.inforDialog, {
		maxZ: 0,

		overlay: function (dialog) {
			this.$el = $.ui.inforDialog.overlay.create(dialog);
		}
	});

	$.extend($.ui.inforDialog.overlay, {
		instances: [],
		// reuse old instances due to IE memory leak with alpha transparency (see #5185)
		oldInstances: [],
		maxZ: 0,
		events: $.map('focus,mousedown,mouseup,keydown,keypress,click'.split(','),
		function (event) { return event + '.inforOverlay'; }).join(' '),
		create: function (dialog) {
			if (this.instances.length === 0) {
				// allow closing by pressing the escape key
				$(document).on('keydown.dialog-overlay', function (event) {
					if (dialog.options.closeOnEscape && event.keyCode &&
					event.keyCode === $.ui.keyCode.ESCAPE) {

						dialog.close(event);
						event.preventDefault();
					}
				});
				$(document).on('click.dialog-overlay', function (event) {
					if ($(event.target).is(".inforFileField") && $(event.target).closest(".inforDialog").length === 0) {
						event.preventDefault();
					}
				});
			}

			var $el = (this.oldInstances.pop() || $('<div></div>').addClass('inforOverlay'))
			.appendTo(document.body)
			.css({
				width: "100%",
				height: $(document).height() + 'px'
			});

			if ($.fn.bgiframe) {
				$el.bgiframe();
			}

			this.instances.push($el);
			return $el;
		},

		destroy: function ($el) {
			var indexOf = $.inArray($el, this.instances);
			if (indexOf != -1) {
				this.oldInstances.push(this.instances.splice(indexOf, 1)[0]);
			}

			if (this.instances.length === 0) {
				$([document, window]).off('.dialog-overlay');
			}

			$el.remove();

			// adjust the maxZ to allow other modal dialogs to continue to work (see #4309)
			var maxZ = 0;
			$.each(this.instances, function () {
				maxZ = Math.max(maxZ, this.css('z-index'));
			});
			this.maxZ = maxZ;
		}
	});

	$.extend($.ui.inforDialog.overlay.prototype, {
		destroy: function () {
		$.ui.inforDialog.overlay.destroy(this.$el);
		}
	});

	function closeWindow(windowDtl) {
		windowDtl.close(windowDtl);
	}

	function f_clientWidth() {
		return f_filterResults(
						window.innerWidth ? window.innerWidth : 0,
						document.documentElement ? document.documentElement.clientWidth : 0,
						document.body ? document.body.clientWidth : 0
					);
	}

	function f_filterResults(n_win, n_docel, n_body) {
		var n_result = n_win ? n_win : 0;
		if (n_docel && (!n_result || (n_result > n_docel)))
			n_result = n_docel;
		return n_body && (!n_result || (n_result > n_body)) ? n_body : n_result;
	}

} (jQuery));

/*
* Infor Message Dialog Plugin
*/
(function ($) {
	$.fn.inforMessageDialog = function (options) {
		var settings = {
			title: "Error Dialog",
			shortMessage: "An Error Occured",
			detailedMessage: "Longer text related to the error.",
			dialogType: "Error",
			buttons: null,
			dialogHtml: null,
			modal: true,
			resizable: false,
			minimizable: false, //Adds a min and max button
			width: null, //allows you to specify a fixed height/width
			height: null,	//allows you to specify a fixed height/width
			showTitleClose: true, //allows you to hide the close button.
			beforeClose: null, //allows you to fire events on close
			closeOnEscape: true, //allows the user to hit escape to cancel
			draggable: true, //can the user drag around the dialog
			position: null,	//set the position...
			autoFocus: true //set focus to first
			//Not possible to change due to new styles innerPadding: true
		};

		return this.each(function() {
			$.fx.speeds._default = 200;	//adjusts anmiation speed.

			var	o = $.extend({}, settings, options);

			if (o.dialogType=='General')
			{
				elementToAdd=$(o.dialogHtml);
				o.shortMessage='';
				dialogArea = $(this);
			} else {
				if ($("#inforMessageDialog").length==0)
					$('body').append('<div id="inforMessageDialog"></div>');

				var dialogArea = $("#inforMessageDialog");
				dialogArea.empty();
			}

			o.buttons=createMessageButtons(o.buttons,o.dialogType);
			dialogArea.inforDialog({
					autoOpen: true,                        // auto open the dialog, usually set to false otherwise the popup appears when the page is loaded
					show: ({effect: 'fade',  duration: 300}),	//effect: 'drop', direction: "up"
					hide: ({effect: 'fade', duration: 300}),
					resizable: o.resizable,                        // can the popup be re-sized
					title: o.title,                  // title for the popup
					messageTitle: o.shortMessage,        // message for the error
					showTitleClose: o.showTitleClose,                   // show the close "X" in the title bar
					dialogType: o.dialogType,                    // what type of dialog to show - General/Info/Error/Confirmation/Warning
					buttons: o.buttons,
					draggable: o.draggable,                         // can the popup be moved around the screen
					modal: o.modal,
					icon: o.icon,
					minWidth: (o.minWidth!=undefined ? o.minWidth : (o.width!=undefined ? o.width : 'auto')),
					minHeight: (o.minHeight!=undefined ? o.minHeight : (o.height!=undefined ? o.height : 'auto')),
					maxHeight: (o.maxHeight!=undefined ? o.maxHeight : ( o.dialogType=="General" ? undefined : 400)),
					maxWidth: (o.maxWidth!=undefined ? o.maxWidth : ( o.dialogType=="General" ? undefined : 600)),
					height: (o.height!=undefined ? o.height : 'auto'),
					width : (o.width!=undefined ? o.width : 'auto'),
					detailedMessage: o.detailedMessage,
					beforeClose: o.beforeClose,
					close: o.close,
					closeOnEscape: o.closeOnEscape,
					position: o.position,
					open: o.open,
					autoFocus: o.autoFocus,
					minimizable: o.minimizable
				});

			return ;
		});

		function createMessageButtons(buttons,dialogType){
		/*Set the right type of button*/
			if (buttons!=null)
				return buttons;

			switch(dialogType)
			{
			case "Information":
			return [{
							text: Globalize.localize("Close"),
							click: function() { $(this).inforDialog("close"); },
							isDefault: true
						}];
			break;
			case "General":
				return [{
							text: Globalize.localize("Ok"),
							click: function() { $(this).inforDialog("close"); },
							isDefault: true
						},{
							text: Globalize.localize("Cancel"),
							click: function() { $(this).inforDialog("close"); }
						}];
				break;
			case "Confirmation":
				return  [{
							text: Globalize.localize("Yes"),
							click: function() { $(this).inforDialog("close"); },
							isDefault: true
						},{
							text: Globalize.localize("No"),
							click: function() { $(this).inforDialog("close"); }
						},{
							text: Globalize.localize("Cancel"),
							click: function() { $(this).inforDialog("close"); }
						}];
				break;
			case "Alert":
				return [{
							text: Globalize.localize("Ok"),
							click: function() { $(this).inforDialog("close"); },
							isDefault: true
						}];
				break;
			case "Error":
				return [{
							text: Globalize.localize("Ok"),
							click: function() { $(this).inforDialog("close"); },
							isDefault: true
						}];
				break;
			default:
				break;
			}
			return buttons;
		}
};
})(jQuery);