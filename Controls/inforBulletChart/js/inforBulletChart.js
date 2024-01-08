/*
* Infor Status Indicator Chart - a Form chart showing static or changing progress
*/

(function($) {
	$.widget('ui.inforBulletChart', $.ui.inforProgressIndicator, {
		options: {
			value: 0,
			max: 100,
			title: null,
			subTitle: null,
			color: 'azure',
			valueLabel: '',
			target: null
		},
		_init: function() {
			var elem = $(this.element),
				o = this.options,
				statusVal = null,
				target = null,
				overage = null;

			if (o.target) {
				o.max = o.target;
			}

			$.ui.inforProgressIndicator.prototype._init.apply(this, arguments);

			if (o.subTitle) {
				elem.prepend("<span class='subTitle'>" + o.subTitle + '</span><br>');
			}

			if (o.title) {
				elem.prepend("<span class='title'>" + o.title + '</span><br>');
			}

			statusVal = elem.find('.inforProgressIndicatorValue').addClass('inforColor ' + o.color);
			statusVal.append("<div class='valueLabel'><div class='line1'>" + "</div><div class='line2'></div></span>");

			if (o.target) {
				target = $('<div class=\"targetBar\"></div>').css('left', (o.target / this.options.max) * 100 + '%');
				statusVal.after(target);
			}

			if (o.overage) {
				overage = $('<div class="inforProgressIndicatorValue overage"></div>').css('width', (o.overage / this.options.max) * 100 + '%');
				target.before(overage);
			}

			this._refreshValue(false);
		},
		_refreshValue: function(animate) {
			var elem = $(this.element),
				valueLabel = this.options.valueLabel.replace('%max%', this.options.max).replace('%target%', this.options.target);

			if (animate === undefined) {
				animate = true;
			}

			$.ui.inforProgressIndicator.prototype._refreshValue.apply(this, [animate]);

			//update labels.
			elem.find('.line1').html(Globalize.format(this.value() / this.options.max, 'p0'));
			elem.find('.line2').html(valueLabel);
		}
	});
})(jQuery);
