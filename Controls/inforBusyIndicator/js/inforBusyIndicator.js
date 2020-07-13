/*
* Infor Busy Indicator
*/
(function ($) {
	$.widget('ui.inforBusyIndicator', {
		options: {
			modal: false,   //Mask the element so that the ui cannot be clicked. Overlays at form level
			delay: 0,   //Delay in milliseconds before element is masked to prevent showing during short operations
			size: 'large',	//small or large
			text: 'Loading'
		},
		loadingElem : null,	//the element.
		overlay : null,
		delay : null,	//The Timeout.
		_init: function () {
		var self = this;
			self.open();
		},
		open: function () {
		var self = this,
				options = self.options;

			//handle the delay
			if (options.delay>0) {
				this.delay = setTimeout(function() {self.show();}, options.delay);
			} else {
				self.show();
			}
		},
		show: function() {
			var element = this.element,
				text;

			if (!this.loadingElem) {
				this.loadingElem = $('<div id="inforLoadingOverlay" class="inforBusyIndicator"></div>').appendTo(element);
			}

			if (this.options.text === 'Loading') {
				text = Globalize.localize(this.options.text);
			} else {
				text = this.options.text;
			}

			if (this.loadingElem.find('.loadingText').length === 0) {
				this.loadingElem.append('<span class="loadingText">' + text +'</span>');
			} else {
				this.loadingElem.find('.loadingText').html(text);
			}

			this.loadingElem.addClass(this.options.size);

			if (this.options.size === 'large') {
				this.loadingElem.addClass('pill');
			} else {
				this.loadingElem.removeClass('pill');
				this.loadingElem.find('.loadingText').html('');
			}

      this.loadingElem.wrap('<div class="inforBusyIndicatorContainer"></div>');

			if (this.options.modal) {
				this.overlay = $('#inforOverlay');
				if (this.overlay.length === 0) {
					this.overlay = $('<div id="inforOverlay" class="inforOverlay"></div>').css('z-index','2030').css({'position': 'fixed', 'left': '0px', 'top': '0px', 'height': '100%', 'width': '100%'});
					$('body').append(this.overlay);
				}
			}

			var wrapper = this.loadingElem.parent();
			if (wrapper.parent().is('body') || wrapper.parent().is('.ui-tabs')) {
				wrapper.css({'position': 'fixed', 'left': '50%', 'margin-left': - (wrapper.find('.inforBusyIndicator').width())/2});
			}

		},
		close: function () {
      var elem = this.loadingElem;

			//remove it and reset the delay
			if (elem) {
        if (elem.parent().hasClass('inforBusyIndicatorContainer')) {
          elem.parent().fadeOut().remove();
        } else {
          elem.fadeOut().remove();
        }
			}

      $('#inforOverlay').fadeOut().remove();
      this.loadingElem = null;
      clearTimeout(this.delay);
			this.delay = null;
		}
	});
})(jQuery);

