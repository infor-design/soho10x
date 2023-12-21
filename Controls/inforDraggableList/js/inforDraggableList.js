/*
* Infor Draggable List
*/
(function ($) {
	$.widget("ui.inforDraggableList", {
		options: {
			dropText: "Drop The Source Here",
			onChange: null
		},
		_create: function () {
			var elem = $(this.element),
			self = this;

			elem.find("ul").sortable({ connectWith: ".connected",
				cursor: "default",
				forcePlaceholderSize: true,
				placeholder: "inforDraggableListPlaceholder",
				cursor: "move",
				start: function(e, ui) {
					ui.placeholder.append("<a>" + self.options.dropText +"</a>");
				},
				change: function(e, ui) {
					if (self.options.onChange) {
						self.options.onChange(e, ui);
					}
				}
			}).disableSelection();
		}
	});
})(jQuery);
