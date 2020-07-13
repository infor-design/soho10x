/*
* Infor Toggle Button - A Button set for several related text button options
*/
(function($) {
	$.widget("ui.inforToggleButton", {
		_init: function() {
			this.refresh();
		},
		refresh: function() {
			//move the buttons together and style them...
			var self = this.element,
			buttons = self.find(":button, :submit, :reset, :checkbox, :radio, a, :data(button)")
						.not(".inforTextButton").addClass((self.parent().is(".inforToolbar") ? "inforTextButton" : "inforFormButton")).click(function() {
				buttons.removeClass("checked").attr("aria-pressed", "false");
				$(this).addClass("checked").attr("aria-pressed", "true");
			});
			
			//single click toggle button
			if (self.is(".inforIconButton.inforToggleButton")) {
				self.click(function() {
					var btn = $(this);
					btn.toggleClass("checked");
					btn.attr("aria-pressed", btn.hasClass("checked"));
				});
			}
		}
	});
} (jQuery));