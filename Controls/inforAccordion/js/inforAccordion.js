/*
* Infor Accordion
*/
(function($) {
	$.widget('ui.inforAccordion', {
		options: {
			onExpand: null,
			onCollapse: null,
			selectOnClick: true
		},
		_init: function() {
			var elem = $(this.element),
				o = this.options;

			elem.find('.inforFieldSet').inforFieldSet({onExpand: o.onExpand,
														onCollapse: o.onCollapse});
			if (o.selectOnClick) {
				elem.find('.inforAccordionSubmenu').click(function() {
					//optionally add a selected class
					elem.find('.inforAccordionSubmenu.selected').removeClass('selected');
					$(this).addClass('selected');
					elem.find('legend.selected').removeClass('selected');
					$(this).parent().parent().find('legend').addClass('selected');
				});
			}
		}
	});
})(jQuery);
