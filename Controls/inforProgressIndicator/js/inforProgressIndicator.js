/*
* Infor Progress Indicator
*/
(function ($) {
	$.widget("ui.inforProgressIndicator", {
		options: {
			value: 0,
			max: 100,
			overage: 0,
			title: null,
			showCancel: true,
			showTitleClose: true,
			onCancel: null,
			progressText: null,
			detailText: null,
			indefinite: false,
			buttons: null
		},
		min: 0,
		_init: function () {
			var self = this,
				o = self.options,
				isDialog = this.element.is("body");

			//translate the prefs..
			if (o.title === null) {
				o.title = Globalize.localize("StatusIndicator");
			}

			if (o.progressText === null) {
				o.progressText = Globalize.localize("PleaseWait");
			}

			if (o.detailText === null) {
				o.detailText = Globalize.localize("LoadingItem");
			}

			if (o.indefinite) {
				o.value = 100;
			}
			
			//add the progress bar.
			if (isDialog) {
				this.contentArea = $('<div class="inforProgressIndicatorTextArea"></div>');
				this.progressText = $('<h1 class="inforProgressIndicatorStatusText">' + o.progressText + '</h1>').appendTo(this.contentArea);
				this.detailText = $('<h2 class="inforProgressIndicatorDetailText">' + o.detailText + '</h2>').appendTo(this.contentArea);
				this.valueDiv = $('<div class="' + (o.indefinite ? "inforStatusIndefiniteValue" : "inforProgressIndicatorValue") + '"></div>').appendTo(this.contentArea);
				this.valueDiv.wrap('<div class="inforProgressIndicatorBar"></div>');
				this.contentArea.appendTo(this.element);
				this.dialog = this.contentArea.inforMessageDialog({
					title: o.title,
					dialogType: "General",
					width: 361,
					height: 158,
					buttons: o.buttons,
					showTitleClose: o.showTitleClose
				});
				
				this.root = this.dialog.closest("div.inforDialog").addClass("inforProgressIndicator")
					.attr({
						role: "progressbar",
						"aria-valuemin": this.min,
						"aria-valuemax": this.options.max,
						"aria-valuenow": this._value()
					});

				this.root.hide();

				this.root.find(".inforCloseButton").click(function () {
					self.destroy();
					if (o.onCancel) {
						o.onCancel(new $.Event(), this);
					}
				});

				if (!o.showCancel) {
					this.root.find(".dialogButtonBar").hide();
				} else {
					this.root.find(".dialogButtonBar").find("button:contains('"+ Globalize.localize("Cancel") +"')").on("click", function() {
						if (o.onCancel) {
							o.onCancel(new $.Event(), this);
						}
					});
				}

				if (o.detailText === "" || o.progressText === "") {
					this.root.height("92px");
				} else {
					this.root.css("height", "auto");
					this.root.find(".inforDialogContent").css("height", "auto");
				}

			} else {
				this.contentArea = this.root = this.element;
				this.valueDiv = $('<div class="' + (o.indefinite ? "inforStatusIndefiniteValue" : "inforProgressIndicatorValue") + '"></div>').appendTo(this.contentArea);
				this.valueDiv.wrap('<div class="inforProgressIndicatorBar"></div>');
			}

			this._refreshValue();

			if (isDialog) {
				this.root.fadeIn("slow");
			}
		},
		destroy: function () {
			this.valueDiv.remove();
			this.contentArea.remove();

			// call the original destroy method but based on timing it might not exist
			try {
				this.dialog.inforDialog("destroy");
				$.Widget.prototype.destroy.call(this);
			} catch (e){
			}
		},
		value: function (newValue) {
			if (newValue === undefined) {
				return this._value();
			}

			this._setOption("value", newValue);
			return this;
		},
		_setOption: function (key, value) {
			switch (key) {
			case "max":
				this.options.max = value;
				break;
			case "value":
				this.options.value = value;
				this._trigger("change");
				break;
			case "detailText":
				this.options.detailText = value;
				this.detailText.html(value);
				break;
			case "progressText":
				this.options.progressText = value;
				this.progressText.html(value);
				break;
			}
			this._refreshValue();
		},
		_value: function () {
			var val = this.options.value;
			// normalize invalid value
			if (typeof val !== "number") {
				val = 0;
			}

			if (this.options.overage > 0) {
				return val;
			} else {
				return Math.min(this.options.max, Math.max(this.min, val));
			}
		},
		_percentage: function () {
			return 100 * this._value() / this.options.max;
		},
		_refreshValue: function (animate) {
			var value = this.value(),
				o = this.options,
				percentage = this._percentage();

			if (this.oldValue !== value) {
				this.oldValue = value;
				this._trigger("change");
			}

			this.valueDiv.toggle(value > this.min);
			if (this.progressText) {
				this.progressText.html(o.progressText);
			}
			if (this.detailText) {
				this.detailText.html(o.detailText);
			}
			
			if (animate) {
				this.valueDiv.animate({
					width: percentage.toFixed(0) + "%"
				});
			} else {
				this.valueDiv.width(percentage.toFixed(0) + "%");
			}

			this.root.attr("aria-valuenow", value);
			if (this.options.closeWhenComplete && value === this.options.max) {
				this.destroy();
			}
		}
	});

})(jQuery);
