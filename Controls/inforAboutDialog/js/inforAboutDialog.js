/*
* Infor About Dialog
*/
(function($) {
  $.widget('ui.inforAboutDialog', {
	options: {
			productName: '<Product Name>',	//text for product name
			details: null,	//controls full details text text for details text area.
			copyRightYear: null,
			additionalDetails: null,
			version: '10.0.1',
			copyRight: 'Copyright &copy; @year Infor. All rights reserved. ' +
					' The word and design marks set forth herein are trademarks' +
					' and/or registered trademarks of Infor and/or its affiliates and subsidiaries.' +
					' All rights reserved. All other trademarks listed herein are the property of their respective owners. www.infor.com.'
		},
		widgetEventPrefix: 'about',
		close: function() {
			this.destroy();
			this._trigger('close');
		},
		destroy: function() {
			$('#inforAboutDialog').remove();
			$(document).unbind('keypress.inforabout');
		},
		dialog: null,
		_init: function() {
			var self = this,
			o = self.options,
			root = $('<div id="inforAboutDialog" style="display:none"></div>'),
			$productName = $('<h1 class="productName">' + o.productName + '</h1>').uniqueId().append('<br>'),
			$logo = $('<div class="inforLogoTm"></div>'),
			$okbutton = $('<button type="button" class="inforAboutCloseButton" title="' + Globalize.localize('Close') + '"><span></span></button>'),
			details = '',
			$details = null,
			container = null;

			o.copyRight = o.copyRight.replace('@year', (o.copyRightYear ? o.copyRightYear : '2013'));
			details = (o.details ? o.details : o.productName + ' ' + o.version + ' <br> ' + o.copyRight + ' <br> ' + o.additionalDetails);
			$details = $('<p>' + details + '</p><br>');
			container = $("<div class='container'></div>").append($logo, $productName, $details);

			root.append($okbutton, container);
			$('body').append(root);

			//Adjust aria tags
			root.attr({
				'aria-labelledby': $productName.attr('id'),
				'aria-describedby': $('#aboutText').attr('id')
			});


			root.fadeIn('slow', function() {
				if ($details[0].scrollHeight > $details[0].clientHeight || $details[0].scrollWidth > $details[0].clientWidth) {
					$details.addClass('isOverflowed');
				}
			});

			$okbutton.click(function() {
				self.close();
			}).focus();

			//esc closes..
			$(document).bind('keydown.inforabout', function(e) {
				if (e.which === 0 || e.which === 27) {
					self.close();
				}
			});
		}
	});
})(jQuery);
