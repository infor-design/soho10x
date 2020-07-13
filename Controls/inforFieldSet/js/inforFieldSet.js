/*
  Infor FieldSet Control
*/
(function ($) {
  $.widget('ui.inforFieldSet', {
    options: {
      collapsible: true,
      initialState: 'open',
      onExpand: null,
      onCollapse: null,
      animate: true
    },
    _create: function () {
      var $div = $(this.element),
        o = this.options,
        self = this,
        elem = $(this.element),
        expandButton, label;

      self.isInitialized = false;

      //attach the click and logic to the expand button.
      $div.find('.inforExpandButton')
        .unbind('click')
        .attr('title', Globalize.localize('ExpandCollapse'))
        .click(function () {
          var $this = $(this);
          if ($this.hasClass('closed')) {
            self.expand(true);
          } else {
            self.collapse(true);
          }
        });

      //Set the initial state to either open or closed. Could do this by css or by the plugin.
      expandButton = $div.find('.inforExpandButton').first();

      //Aria Tags
      expandButton.attr({'role': 'button', 'aria-disabled': 'false'});

      if (Globalize.culture().isRTL) {
        expandButton.addClass('inforRTLFlip');
      }

      if (expandButton.hasClass('closed') || o.initialState === 'closed') {
        self.collapse(false);
      } else if (expandButton.hasClass('open') || o.initialState === 'open') {
        self.expand(false);
      } else {
        self.expand(false);
      }

      //Hide the expander if we dont need it. Can also set in initial html
      if (!o.collapsible) {
        elem.find('.inforExpandButton:first').remove();
      }

      //Add hover states to releated elements

      if (o.collapsible && expandButton.length !== 0) {
        label = elem.find('.inforFieldSetLabel:first');

        $div.find('.inforFieldSetLabel:first').hover(function () {
          expandButton.addClass('hover');
          label.addClass('hover');
          elem.addClass('hover');
        }, function () {
          expandButton.removeClass('hover');
          label.removeClass('hover');
          elem.removeClass('hover');
        }).click(function () {
        }).click(function () {
          if (expandButton.hasClass('open')) {
            self.collapse(true);
          } else {
            self.expand(true);
          }
        });
      }
      self.isInitialized = true;
    },
    expand: function (animate) {
      var elem = $(this.element).find('.inforExpandButton:first').first(),
        label = $(this.element).find('.inforFieldSetLabel:first').first(),
        self = this,
        content = elem.nextAll('div.content').attr('aria-hidden', 'false');

      elem.removeClass('closed').addClass('open');
      label.removeClass('closed').addClass('open');

      //size hidden grids.
      content.find('.inforDataGrid').each(function () {
        var grid = $(this);
        if (grid.data('gridInstance')) {
          grid.parent().css('opacity',0).show();
          grid.show().data('gridInstance').resizeCanvas();
          grid.parent().css('opacity',1);
        }
      });

      if (elem.length === 0) {
        content = $(this.element).find('.content:first'); //no expand button
      }

      var onComplete = function () {
        var panel = content;
        panel.find('.autoLabelWidth').find('.inforLabel, .label').autoWidth();
        panel.find('.inforTabContainer').trigger('resize');

        if (self.isInitialized && self.options.onExpand) {
          self.options.onExpand(self);
        }

        panel.find('.inforDataGrid').each(function () {
          var grid = $(this);
          if (grid.data('gridInstance')) {
            grid.data('gridInstance').resizeCanvas();
          }
        });
      };

      if (animate && self.options.animate) {
        content.slideDown(function(){
          onComplete();
        });
      } else {
        content.show();
        onComplete();
      }
    },
    collapse: function (animate) {
      var elem = $(this.element).find('.inforExpandButton:first').first(),
        label = $(this.element).find('.inforFieldSetLabel:first').first(),
        self = this,
        content = elem.nextAll('div.content').attr('aria-hidden', 'true');

      elem.removeClass('open').addClass('closed');
      label.removeClass('open').addClass('closed');
      if (animate && self.options.animate) {
        content.slideUp();
      } else {
        content.hide();
      }

      if (self.isInitialized && self.options.onCollapse) {
        self.options.onCollapse(self);
      }
    }
  });
})(jQuery);
