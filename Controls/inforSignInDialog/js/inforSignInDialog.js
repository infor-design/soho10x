/*
* Infor Sign in Dialog.
*/
(function ($, undefined) {
	$.widget("ui.inforSignInDialog", {
		options: {
			login: null, // callback that fires when a login occurs.
			title: null,
			enforcePassword: true, //button is disabled until they type
			autoFocus: true //focus the first input field
		},
		_create: function () {
			var self = this,
				password = $("#password"),
				user = $("#userId");
			
			self.element.inforForm({trackDirty: false});
			
			//Set Focus to password field...
			if (self.options.autoFocus) {
				setTimeout(function(){
					var userId = $.cookie("inforSignInDialog:userId");
					if (userId && password.is(":enabled")) {
						password.focus().select();
					} else {
						user.focus().select();
					}
				}, 200);
			}
			
			if (self.options.enforcePassword) {
				password.add(user).keypress(function () {
					if (password.val().length > 0 && user.val().length > 0) {
						$(".inforSignInButton").enable();
					} else {
						$(".inforSignInButton").disable();
					}
				});
			} else {
				$(".inforSignInButton").enable();
			}
			
			//Jack the click 
			$(".inforSignInButton").on("click.inforSigninDialog", function () {
				self.login();
			});
			self._restoreSavedInfo();
		},
		_restoreSavedInfo: function () {
			//Note: There is no way to securely encrypt the data while still having
			//access to it from your Javascript since in order to do so, the (publicly visible) Javascript would have to contain both the decoding algorithm and any secret key used to encrypt the data!
			if (typeof localStorage !== "undefined") {
				var userId = localStorage.getObject("infor.signin.settings");
			}
			
			if (userId) {
				this.element.find("#userId").val(userId);
				this.element.find("#password").focus();
				this.element.find("#rememberPassword").setValue(true);
			}
		},
		saveLoginInfo: function (userId) {
			if (typeof localStorage !== "undefined") {
				localStorage.setObject("infor.signin.settings", userId);
			}
		},
		_clearInfo: function () {
			if (typeof localStorage !== "undefined") {
				localStorage.setObject("infor.signin.settings", null);
			}
			this.element.find("#userId").val("");	//clears the value in the browser
		},
		login: function () {
			if (this.options.login) {
				var idField = this.element.find("#userId"),
				userId = idField.val(),
				password = this.element.find("#password").val(),
				rememberPassword = this.element.find("#rememberPassword").getValue(),
				result = this.options.login(userId, password);

				if (result) {
					$(".inforSignInDialog").hide();
					//Save In a Cookie.
					if (rememberPassword) {
						this.saveLoginInfo(userId,password);
					} else {
						this._clearInfo();
					}
				}
			}
		},
		cancel: function () {
			if (this.options.cancel) {
				this.options.cancel();
			}
			$(".inforSignInDialog").hide();
		},
		showError: function (errorMessage, input) {
			var statusArea = null;

			if (input) {
				input.parent().find(".error").removeClass("error");
				input.validationMessage("remove");
				input.validationMessage("show", errorMessage, true);
				input.parent().find(".inforErrorIcon").css({"margin-left":"-14px", "left":"-11px"});
			} else {	//use status area..
				statusArea = this.element.find(".statusArea");
				if (statusArea.length === 0) {
					//statusArea = $("<div class='statusArea'></div>").append("<div class='inforAlertIcon error'></div>").append($("<div class='errorText'></div>").text(errorMessage)); 
					statusArea = $("<div class='statusArea' role='alert'></div>").append($("<div class='errorText' ></div>").text(errorMessage));
					this.element.find(".inforSignInButton").before(statusArea);
				} else {
					statusArea.find(".errorText").text(errorMessage);
				}
			}
		},
		clearError: function () {
			var statusArea = self.element.find(".statusArea");
			statusArea.remove();

			this.dialog.find("input").validationMessage("remove");
		}
});
})(jQuery);
