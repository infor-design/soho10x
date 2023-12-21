/*
* Infor Slide In Message 
*/
(function ($) {
	$.widget("ui.inforSlideInMessage", {
		options: {
			autoDismiss: true, // automatically close the message
			autoDismissTimeout: 5000, // time to keep window open if auto dismiss is true - shouldn't need to change this.
			message: null, // actual message to show
			messageType: 'Info', // Info or Alert
			messageTitle: null, // title for message
			showClose: true // show the close "X" or not
		},
		_init: function () {
			var self = this;
			self.open();
		},
		open: function () {
			var self = this,
				options = self.options,
				divTag = $('.inforSlideInMessage'),
				isOpen = divTag.is(":visible"),
				centerWidth, closeButton, severityImage, messageDiv, prevImage, prevclass, currMessage, f;

			//remove the last message
			if (!isOpen) {
				divTag.remove();
				divTag = $('<div style="display:none" class="inforSlideInMessage"><div class="popupMiddleCenter"><div class="popupMiddleCenterInner content"><div class="inforCloseButton"><i>' + Globalize.localize("Close") +'</i></div></div></div>');
			}
			
			if (options.errorMessage) {
				options.message = options.errorMessage;	//backwards support
			}
			
			severityImage = null;
			
			//adjust the images and background - there is a hierarchy

			if (options.messageType == 'Info') {
				severityImage = $("<div class='inforIcon'></div>").removeClass("alert").addClass("info");
				divTag.removeClass("alert").addClass("info");
			}

			if (options.messageType == 'Alert') {
				severityImage = $("<div class='inforIcon'></div>").removeClass("info").addClass("alert");
				divTag.removeClass("info").addClass("alert");
			}

			//Create a message area object
			messageDiv = $('<div class="messageField"><div class="header">' + (options.messageTitle === null ? '' : options.messageTitle) + '</div><div class="body message">' + (options.message === null ? '' : options.message) + '</div></div>');

			divTag.find(".popupMiddleCenterInner").append(messageDiv);
			prevImage = $(".inforIcon").last();

			if (isOpen) {
				messageDiv.addClass("indent");
			}

			prevclass = (prevImage.length === 0 ? "" : prevImage.attr("class").toLowerCase().replace("inforIcon ", ""));
			currMessage = options.messageType.toLowerCase();

			if (prevImage.length === 0 || prevclass != currMessage) {
				if (prevImage.length === 0) {
					messageDiv.before(severityImage).removeClass("indent");
				} else {
					messageDiv.before(severityImage.css("margin-top", "8px")).removeClass("indent").css("margin-top", "10px");
				}
			}

			//setup the auto dismiss...
			if (options.autoDismiss && !isOpen) {
				f = function () {
					if (options.messageType == "Info" || options.messageType == "Alert") {
						self.close();
					} else {
						clearTimeout(f);
					}
				};
				setTimeout(f, options.autoDismissTimeout);
			}

			//setup the close button
			closeButton = divTag.find(".inforCloseButton");
			closeButton.attr("title", Globalize.localize("Close"));

			if (options.showClose) {
				closeButton.show();
				closeButton.click(function () {
					self.close();
				});
			} else {
				if (!isOpen) {
					closeButton.hide();
				}
			}

			//add and animate
			if (!isOpen) {
				$('body').append(divTag);
				divTag.css("opacity", "1").show("slide", {
					direction: 'up',
					duration: 220,
					easing: "linear"
				});
			}
		},
		close: function () {
			var msgDiv = $(".inforSlideInMessage");

			msgDiv.fadeTo('slow', 0, function () {
				msgDiv.hide().css("opacity", "1");
			});
		}
	});
})(jQuery);