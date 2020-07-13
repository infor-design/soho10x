/*
* Infor Color Picker Control
*/
(function ($) {
  $.widget('ui.inforColorPicker', {
    options: {
      mode: 'basic',
      title: Globalize.localize('SetTextColor'),
      colors: ['#61c5ff', '#9ed927', '#ffd500', '#ff574d', '#ff80a2', '#c680ff', '#6dd9d1', '#666666', '#ffffff',
           '#13a3f7', '#2db329', '#ffaa00', '#d5000e', '#e63262', '#a352cc', '#00c2b4', '#444444', '#CCCCCC',
           '#005ce6', '#00733a', '#ff6400', '#b3000c', '#bf2951', '#7533a6', '#00898c', '#000000', '#666']
    },
    _create: function () {
      var self = this,
        startVal;

      self.input = $(this.element);
      self.popup = $('#inforColorPopup');
      if(self.popup.length === 0) {
        self.popup = $('<ul class="popupmenu colorpicker" id="inforColorPopup"></ul>');
      }

      //make sure its not initialized twice.
      if (self.input.data('isInitialized')) {
        return;
      }

      //add trigger button styling
      self.input.data('isInitialized', true).inforTriggerField({
        editable: false,
        click: function () {
          if (!self.popup.hasClass('is-open')) {
            $(document).trigger('click');

            self.popup.appendTo('body');
            self._addColors();

            self.popup.find('a').focus(function () {
              $(this).closest('td').addClass('focus');
            }).blur(function () {
              $(this).closest('td').removeClass('focus');
            }).on('click', function () {
              self.setValue($(this).attr('title'));
              self.input.focus();
            });

            self.button = self.input.prev();
            self.button.popupmenu({
              menu: 'inforColorPopup',
              trigger: 'immediate'
            }).on('destroy.popupmenu', function() {
              self.popup.find('a').off('focus blur click');
              self.popup.remove();
            });
          }
        }
      });

      //move button to other side.
      self.input.parent().append(self.input);
      self.input.parent().find('.inforTriggerButton').removeClass('inforTriggerButton');

      //read the value
      startVal = self.input.val();
      if (startVal) {
        self.setValue(startVal);
      }
      self.popup.find('a:first').focus();

    },
    setValue: function (color) {
      var self = this;
      self.input.val(color === 'No Color' ? '' : color).trigger('change');
      self.input.parent().find('.inforColorButton').css('background-color', color === 'No Color' ? '' : color);
    },
    _addColors: function() {
      var self = this,
        i = 0,
        html = '',
        gap = false,
        color;

      html += '<span class="inforColorPopupLabel">' + self.options.title + '</span><li><a href="#" style="background-color:transparent" title="No Color" class="noColor"></a></li><table role="presentation" class="inforColorPopupColors"><tr>';
      html += '<tr><td class="spacer"></td><td class="spacer"></td><td class="spacer"></td><td class="spacer"></td><td class="spacer"></td><td class="spacer"></td><td class="spacer"></td><td class="spacer"></td><td><li><a href="#" title="No Color" class="noColor"></a></li></td></tr>';

      for (i = 0; i < self.options.colors.length ; i++) {
        gap = (i%9 === 0 && i !== 0);
        color = self.options.colors[i];

        if (color !== 'No Color') {
          html += (gap ? '</tr><tr>' : '') + '<td><li><a href="#" style="background-color:' + color +
            (color ==='#ffffff' ? ';border: 1px solid #d9d9d9; border-radius: 4px' : '') + '" title="' + color + '"' + (color === 'No Color' ? ' class="noColor"' : '')  +'></a></li></td>';
        }
      }

      html += '</table>';

      self.popup.empty().append(html);
    }
  });
})(jQuery);
