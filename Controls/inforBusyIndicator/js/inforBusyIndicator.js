/*
* Infor Busy Indicator
*/
(function ($) {
	$.widget("ui.inforBusyIndicator", {
		options: {
			modal: false,   //Mask the element so that the ui cannot be clicked. Overlays at form level
			delay: 0,   //Delay in milliseconds before element is masked to prevent showing during short operations
			size: "large",	//small or large
			text: "Loading",
			position: {		//specify the position/defaults to center of the element
				my: "center-40 center",
				at: "center center"
			}
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
			
			if (!this.loadingElem)
				this.loadingElem = $('<div id="inforLoadingOverlay" class="inforBusyIndicator"></div>').appendTo(element);

			//center the item and add it to the element.
			this.loadingElem.css("position","absolute");
			this.options.position.of = element;
			
			if (this.options.text === "Loading") {
				text = Globalize.localize(this.options.text);	
			} else {
				text = this.options.text;
			}
			
			if (this.loadingElem.find(".loadingText").length === 0) {
				this.loadingElem.append("<span class='loadingText'>" + text +"</span>"); 
			} else {
				this.loadingElem.find(".loadingText").html(text); 
			}
			
			this.loadingElem.addClass(this.options.size).position(this.options.position);
			
			if (this.options.size == "large") {
				this.loadingElem.addClass("pill");
			} else {
				this.loadingElem.removeClass("pill");
				this.loadingElem.find(".loadingText").html(""); 
			}
			
			if (this.options.modal) {
				this.overlay = $("#inforOverlay");
				if (this.overlay.length === 0) {
					this.overlay = $('<div id="inforOverlay" class="inforOverlay"></div>').css("z-index","2030").css({"height": "100%", "width": "100%"});
					$("body").append(this.overlay);
				}
			}
		},
		close: function () {
			//remove it and reset the delay
			if (this.loadingElem) {
				this.loadingElem.fadeOut().remove();
			}
			this.loadingElem = null;

			clearTimeout(this.delay);
			this.delay = null;

			$("#inforOverlay").fadeOut().remove();
		}
	});
})(jQuery);

