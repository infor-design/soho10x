/*
* Infor Spinner  - Numeric Up / Down Editor
*/
(function ($) {
	$.widget("ui.inforSpinner", {
		options: {
			step: 1,	//specifies the legal number intervals
			max: Number.MAX_VALUE,
			min: null
		},
		input: null,
		downButton: null,
		upButton: null,
		_init: function () {
			var self = this,
			upInterval, downInterval, startVal;

			this.input = $(this.element);

			if (this.input.closest(".inforTriggerField").length > 0) {
				return;
			}

			//change attribute or chrome will add its own input
			this.input.get(0).type = 'text';
			
			//add aria tags
			this.input.attr("role", "spinbutton");
			
			//copy html5 attributes to settings.
			if (this.input.attr("step")) {
				this.options.step = parseInt(this.input.attr("step"), 10);
			}
			if (this.input.attr("max")) {
				this.options.max = parseInt(this.input.attr("max"), 10);
			}
			if (this.input.attr("min")) {
				this.options.min = parseInt(this.input.attr("min"), 10);
			}
			this.input.attr("aria-valuemax",this.options.max);
			this.input.attr("aria-valuemin",this.options.min);
			
			//add trigger button styling
			this.input.numericOnly(false).data("isInitialized", true).inforTriggerField();
			this.upButton = this.input.closest(".inforTriggerField").find(".inforSpinnerButtonUp");
			this.downButton = $('<button class="inforTriggerButton inforSpinnerButtonDown" type="button" tabindex="-1"><span></span></button>');
			this.upButton.after(this.downButton);
			this.input.closest(".inforTriggerField").addClass("inforSpinnerContainer");

			//add click - long press events
			this.upButton.on('mousedown', function () {
				upInterval = setInterval(function () { self.increment(self.options.step, upInterval); }, 200);
			}).on('mouseup mouseup mouseout', function () {
				clearInterval(upInterval);
			});

			this.downButton.on('mousedown', function () {
				downInterval = setInterval(function () { self.increment(-(self.options.step), downInterval); }, 200);
			}).on('mouseup mouseup mouseout', function () {
				clearInterval(downInterval);
			});

			this.upButton.click(function () {
				self.increment(self.options.step);
			});
			this.downButton.click(function () {
				self.increment(-(self.options.step));
			});

			//add support for mouse wheel - using the mousewheel plugin in shared.
			this.input.bind('mousewheel', function (event, delta) {
				self.increment(delta * self.options.step);
			});

			//add keyboard support  - using the hotkeys plugin in shared.
			this.input.bind('keydown', 'up', function () {
				self.increment(self.options.step);
			})
			.bind('keydown', 'down', function () {
				self.increment(-(self.options.step));
			})
			.bind('keyup', function (e) {
				self.increment(0);
			})
			.bind('blur', function (e) {
				self.increment(0);
			})
			.bind('focus', function () {
				$(this).select();
			});

			//set initial disabled on min and max
			startVal = parseInt(this.input.val(), 10);
			if (!isNaN(startVal)) {
				if (startVal >= this.options.max) {
					this.upButton.attr("disabled", "");
				}
				if (startVal <= this.options.min) {
					this.downButton.attr("disabled", "");
				}
			}
			this.input.attr("aria-valuemin",startVal);
		},
		increment: function (step, interval) {
			var newVal = parseInt(this.input.val(), 10);
			
			if (this.input.val() === "") {
				newVal = "";
				if (this.options.min !== null) {
					newVal = this.options.min;
					this.input.val(newVal).attr("aria-valuemin",newVal).trigger("change");
				}
				return;
			}
			
			if (isNaN(newVal)) {
				newVal = 0;
			}

			//validate based on max/min options and insert..
			newVal += step;

			this.downButton.removeAttr("disabled");
			this.upButton.removeAttr("disabled");

			if (newVal >= this.options.max) {
				newVal = this.options.max;
				this.upButton.attr("disabled", "");
				clearInterval(interval);
			}
			if (newVal <= this.options.min) {
				newVal = this.options.min;
				this.downButton.attr("disabled", "");
				clearInterval(interval);
			}
			
			this.input.val(newVal).attr("aria-valuemin",newVal).trigger("change");	//trigger dirty indicator.
		}
	});
} (jQuery));
