/*
* Infor Split Button
*/
(function ($) {
  $.fn.inforSplitButton = function (options) {
    var settings = {
      menuId: null, //id on the form of the menu
      callback: null, //function to execute on a menu item click
      click: null
    };

    return this.each(function () {
      var o = $.extend({}, settings, options),
        $textButton = $(this),
        isIconButton = false,
        isDisabled, classes, $rightButton, container;

      if (!$textButton.parent().is('.inforSplitButtonContainer')) {

        isDisabled = $textButton.hasClass('disabled') || $textButton.is(':disabled');
        classes = $textButton.attr('class').replace('inforSplitButton', '').replace('disabled', '');

        if (classes === '' || classes === ' ') {
          isIconButton = false;
        } else {
          $textButton.addClass('inforIconButton');
          if ($textButton.children('span').length === 0) {
            $textButton.append('<span></span>');
          }
          isIconButton = true;
        }

        $rightButton = $('<button type="button" aria-haspopup="true" aria-expanded="false" class="inforSplitButtonArrow"><i></i><span class="scr-only">' + Globalize.localize('Menu') + '</span></button>');

        //wrap in a div and add the button on the right.
        container = $('<div class="inforSplitButtonContainer"></div>');
        if (isIconButton) {
          container.addClass('icon');
        }

        $textButton.wrap(container);
        $textButton.parent().append($rightButton);

        //attach the events.
        $textButton.click(function (e) {
          if ($textButton.parent().hasClass('disabled') || $textButton.hasClass('disabled')) {
            return;
          }

          if (o.click) {
            o.click(e);
          }
        });

        if (o.menuId !== null) {
          $rightButton.popupmenu({
            menu: o.menuId});
        }

        //set the initial disabled state.
        if (isDisabled) {
          $textButton.disable();
        } else {
          $textButton.enable();
        }

        //copy tab index..
        if ($textButton.attr('tabindex') === -1) {
          $textButton.parent().find('button').attr('tabindex', -1);
        }
      }
    });
  };

}(jQuery));
