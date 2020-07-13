/*
* Infor Radio Button
*/
(function ($) {
	$.widget( "ui.inforRadioButton", {
		_init: function() {
			this.create();
		},
		create: function() {
			//Wrap the buttons in a label
			var radio = this.element,
			label = null,
			startLabel = radio.next("label"),
			groupName = radio.attr("name");

			if (radio.parent().hasClass("inforRadioButtonSet")) {
				radio.parent().attr("role","radiogroup");
			}
			radio.parent().find("br, span, label").attr("role", "presentation");
			radio.addClass("inforRadioButton");

			if (!radio.parent().hasClass("inforRadioButtonLabel")) {
				label = $('<label class="inforRadioButtonLabel" for="'+radio.attr("id")+'"></label>');
				radio.empty();

				if (radio.is(":checked")) {
					label.addClass("checked");
					radio.attr("aria-checked","true").attr("role", "radio");
				}

				if (radio.is(":disabled")) {
					label.addClass("disabled");
					radio.attr("aria-disabled","true");
				}

				//set initial states and values
				radio.wrap(label);

				radio.on("change", function () {
					var $this=$(this),
						others = $('input[name="'+groupName+'"]');

          //uncheck everything else in that group
					others.parent().removeClass("checked");
					others.attr("aria-checked", "false");
					$this.parent().addClass("checked").removeClass("hover");
					$this.attr("aria-checked","true");
				});

				radio.focusin(function () {
					var $this=$(this);
					//unfocus everything else in that group
					$('input[name="'+groupName+'"]').parent().removeClass("focus");
					$this.parent().addClass("focus");
				});

				radio.focusout(function () {
					$(this).parent().removeClass("focus");
				});

				//add hover states
				radio.hover(function() {
					$(this).parent().addClass("hover");
				}, function() {
					$(this).parent().removeClass("hover");
				});

				label = $("<span class='labelText'>"+startLabel.html()+"</span>");
				//update label
				radio.after(label);

				label.hover(function() {
					if (!$(this).parent().hasClass("disabled")) {
						$(this).parent().addClass("hover");
					}
				}, function() {
					if (!$(this).parent().hasClass("disabled")) {
						$(this).parent().removeClass("hover");
					}
				});

				startLabel.remove();
			}
		}
	});
})(jQuery);
