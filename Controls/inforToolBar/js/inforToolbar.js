$(function ($) {
    $.widget("ui.inforToolbar",
	{
        _create: function()
        {
			var self = this;
            this.element.attr("tabindex", "-1");
			this.element.addClass("inforToolbar").attr("role", "toolbar");

			var buttons = this.element.find("button");
			buttons.attr("tabindex", "-1");
			var first = buttons.first();
			first.attr("tabindex", "0");
			this._setupActiveButton(first);
        },

		_navigate: function (direction)
		{
			var buttons = this.element.find("button").filter(":visible").not("[disabled]");
			var currentIndex = buttons.index(this._activeButton);
			var nextIndex = currentIndex + direction

			if (nextIndex >= 0 && nextIndex < buttons.length)
			{
				var next = $(buttons[nextIndex]);
				this._setupActiveButton(next);
				next.focus();
				return false;
			}
		},
		_setupActiveButton: function (button)
		{
			var self = this;
			if (this._activeButton)
			{
				this._activeButton.off("keydown.inforToolbar");
				this._activeButton.attr("tabindex", "-1");
			}
			this._activeButton = button;
			this._activeButton.attr("tabindex", "0");
			this._activeButton.on("keydown.inforToolbar", function (e)
			{
				if (e.keyCode === $.ui.keyCode.LEFT)
				{
					return self._navigate(-1);
				}
				else if (e.keyCode === $.ui.keyCode.RIGHT)
				{
					return self._navigate(1);
				}
			});
		}
    });
});