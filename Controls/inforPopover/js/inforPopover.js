/*
 * Infor Inline Popup
 */
(function($) {
	$.widget('ui.inforPopover', {
		options: {
			content: null,
			//internal html to show.
			autoClose: true,
			//remove it when it is closed
			onClose: null,
      doFocus: true,
			//call back when dialog is closed
			onShow: null,
			//call back when dialog is shown (after animation)
			placement: 'bottom',
			//can be top/left/bottom/right or none
			draggable: true,
			remove: false,
			width: '276',
			maxWidth: '276',
			animate: true,
			title: null,
			//optional title for info tip
			trigger: 'click' //supports click and manual (future hover and focus)
		},
		_init: function() {
			//Wrap contents in the styled popup
			var wrapper = $('<div></div>').addClass('inforPopover').append(this.options.content).appendTo('body'),
				self = this;
			if (self.options.placement !== 'none') {
				wrapper.addClass(self.options.placement);
			}
			if (self.options.width) {
				wrapper.css('width', self.options.width);
			}
			if (self.options.width) {
				wrapper.css('max-width', self.options.maxWidth);
			}
			if (self.options.title) {
				wrapper.append($('<h3 class="inforPopoverTitle"></h3>').append(self.options.title));
			}
			wrapper.append($('<div></div>').addClass('arrow'));
			wrapper.append($('<div></div>').addClass('inforPopoverContent').append(self.options.content).clone());
			if (self.options.draggable) {
				wrapper.draggable();
			}
			if (self.options.trigger == 'click') {
				self.element.attr('aria-haspopup', 'true').click(function(e) {
					self._open(e);
				});
			}
			self.wrapper = wrapper;
			if (self.options.trigger == 'manual') {
				self._open(null);
			}
			if (self.options.trigger == 'hover') {
				var isInPopup = false;

				wrapper.on("mouseenter", function(e) {
					isInPopup = true;
				}).on("mouseleave", function(e) {
					isInPopup = false;
					setTimeout(function() {
						if (!isInPopup) {
							self._close(e);
						}
					}, 300);
				});

				self.element.attr('aria-haspopup', 'true').hover(function(e) {
					if (!isInPopup && !wrapper.is(":visible")) {
						self._open(e);
					} else {
						isInPopup = true;
					}
				}, function(e) {
					isInPopup = false;
					if (self.options.autoClose) {
						setTimeout(function() {
							if (!isInPopup) {
								self._close(e);
							}
						}, 300);
					}
				});
			}
		},
		_open: function(e) {
			var self = this,
				elem = $(this.element);
			if (self.options.placement === 'right') {
				self.options.position = {
					my: 'left center',
					at: 'right+18 center'
				};
			}
			if (self.options.placement === 'bottom') {
				self.options.position = {
					my: 'center top',
					at: 'center bottom+18'
				};
			}
			if (self.options.placement === 'left') {
				self.options.position = {
					my: 'right center',
					at: 'left-18 center'
				};
			}
			if (self.options.placement === 'top') {
				self.options.position = {
					my: 'center bottom',
					at: 'center top-18'
				};
			}
			if (self.options.position.of === undefined) {
				self.options.position.of = elem;
			}
			//click to close
			if (self.options.autoClose) {
				setTimeout(function(e) {
					$(document).on('click.inforPopover', function(e) {
						if ($(e.target).closest('.inforPopover').length === 0 && self.element[0] != $(e.target)[0]) {
							self._close(e);
						}
					}).on('keydown.inforPopover', function(e) {
						if (e.which == 27) {
							self._close(e);
						}
					});
				}, 100);
			}
			if (self.wrapper.is(':visible')) {
				self._close(e);
			} else {
				self.wrapper.fadeIn((self.options.animate ? 'slow' : 0), function(e) {
					if (self.options.onShow) {
						self.options.onShow(e, self.wrapper);
					}
				}).position(self.options.position);
			}
			$(window).on('resize.inforPopover', function(e) {
				self._close(e);
			});
		},
		_close: function(e) {
			var self = this;
			if (self.options.onClose) {
				self.options.onClose(e, self.wrapper);
			}
			self.wrapper.fadeOut((self.options.animate ? 'slow' : 0));
			if (self.options.remove) {
				self.wrapper.remove();
			}
			if (self.options.doFocus && self.options.position.of) {
				self.options.position.of.focus();
			}
			$(document).off('click.inforPopover').off('keydown.inforPopover');
			$(window).off('resize.inforPopover');
		}
	});
}(jQuery));