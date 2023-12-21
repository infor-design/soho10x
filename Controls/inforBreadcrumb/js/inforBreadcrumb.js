/*
* Infor Bread Crumb a Collapsible Breadcrumb
*/
(function ($) {
	$.widget("ui.inforBreadcrumb", {
		options: {
		},
		_create: function () {
			var self = this;

			$(window).bind("throttledresize.inforBreadcrumb", function () {
				self.resize();
			});

			self.resize();
		},
		resize: function () {
			var elem = $(this.element),
			count = elem.find("a").not(":last").length,
			i = 2,
			maxWidth = elem.closest(".inforModuleHeader").find(".inforModuleHeaderRight").offset().left,
			parent = elem.closest(".inforModuleHeaderLeft");

			if (parent.length > 0) {
				parent.css({"overflow" : "hidden", "max-width" : parseInt(maxWidth, 10) - parseInt(parent.offset().left, 10) - 20  + "px"});
			}

			elem.find("a").not(":last").each(function (index, item) {
				var a = $(item);
				if (index < 2 || index > (count - 2)) {
					return;
				}

				a.data("originalText", a.html())
				.width(52)
				.hoverIntent(function () {
					var text = a.data("originalText"),
					width = text.textWidth() + 25;

					a.width(width);
				}, function () {
					a.width(52);
				});
			});
		}
	});
})(jQuery);