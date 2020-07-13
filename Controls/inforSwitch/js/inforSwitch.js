/*
* Infor Switch - On/Off Switch
*/

(function ($) {
	$.widget("ui.inforSwitch", {
		options: {
		},
		_create: function () {
			var elem = $(this.element),
				self = this;

			//only needed for IE8 since it doesnt support the :checked selector.
			//So use the conditional import
			elem.find("label").click(function(){
				self._toggleChecked($(this));
			});

			elem.find("input:checked").each(function() {
				elem.find(".inforSwitchInner").css("margin-left",0);
				elem.find(".inforSwitchSwitch").css("right",0);
			});
		},
		_toggleChecked: function(label) {
			var input = label.parent().find("input");
			if (input.attr("checked")) {
				input.removeAttr("checked");
				input.parent().find(".inforSwitchInner").animate({marginLeft : "-100%"}, 200);
				input.parent().find(".inforSwitchSwitch").animate({right : "20px"}, 200);
			} else {
				input.attr("checked","");
				input.parent().find(".inforSwitchInner").animate({marginLeft : 0}, 200);
				input.parent().find(".inforSwitchSwitch").animate({right : 0}, 200);
			}
		}
});
})(jQuery);
