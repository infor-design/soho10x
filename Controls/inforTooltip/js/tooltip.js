/**
* Responsive Tooltip and Popover Control
* @name tooltip
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module depending on jQuery.
      define('tooltip', ['jquery'], factory);
  } else {
      // No AMD. Register plugin with global jQuery object.
      factory(window.jQuery || window.Zepto);
  }
}(function ($) {

  $.fn.tooltip = function(options, args) {

    // Settings and Options
    var pluginName = 'tooltip',
      defaults = {
        content: null, //Takes title attribute or feed content. Can be a function or jQuery markup
        offset: 20, //how much room to leave
        placement: 'bottom',  //can be top/left/bottom/right
        trigger: 'hover', //supports click and manual and hover (future focus)
        title: null, //Title for Infor Tips
        popover: null , //force it to be a popover (no content)
        isError: false //Add error classes
      },
      settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Plugin(element) {
      this.element = $(element);
      this.init();
    }

    // Plugin Object
    Plugin.prototype = {
      init: function() {
        this.appendTooltip();
        this.handleEvents();
        this.addAria();
        this.isPopover = (settings.content !== null && typeof settings.content === 'object') || settings.popover;
      },

      addAria: function() {
        this.content =  this.element.attr('title');
        this.element.removeAttr('title').attr('aria-describedby', 'tooltip');
        if (this.isPopover && settings.trigger === 'click') {
          this.element.attr('aria-haspopup', true);
        }
      },

      appendTooltip: function() {
        this.tooltip = $('#tooltip');
        if (this.tooltip.length === 0) {
          this.tooltip = $('<div class="tooltip bottom is-hidden" role="tooltip" id="tooltip"><div class="arrow"></div><div class="tooltip-content"><p>(Content)</p></div></div>').appendTo('body');
        }
      },

      handleEvents: function() {
        var self = this, timer, delay = 400;

        if (settings.trigger === 'hover' && !settings.isError) {
          this.element
            .on('mouseenter.tooltip', function() {
              timer = setTimeout(function() {
                self.show();
              }, delay);
            })
            .on('mouseleave.tooltip mousedown.tooltip', function() {
                clearTimeout(timer);
                setTimeout(function() {
                  self.hide();
                }, delay);
            });
        }

        if (settings.trigger === 'click') {
          this.element.on('click.tooltip', function() {
            if (self.tooltip.hasClass('is-hidden')) {
              self.show();
            } else {
              self.hide();
            }
          });
        }

        if (settings.trigger === 'immediate') {
           timer = setTimeout(function() {
            self.show();
          }, delay);
        }

        this.element.on('focus.tooltip, click.tooltip', function() {
          if (!self.isPopover) {
            self.setContent(self.content);
          }
        });
      },

      setContent: function (content) {
        if (this.isPopover) {
          this.tooltip.find('.tooltip-content').html(settings.content);
          this.tooltip.addClass('popover');

          if (settings.title !== null) {
            var title = this.tooltip.find('.tooltip-title');
            if (title.length === 0) {
              title = $('<div class="tooltip-title"></div>').prependTo(this.tooltip);
            }
            title.html(settings.title).show();
          } else {
            this.tooltip.find('.tooltip-title').hide();
          }
          return;
        } else {
          this.tooltip.find('.tooltip-title').hide();
        }

        this.tooltip.removeClass('popover');
        if (typeof settings.content === 'function') {
          content = this.content = settings.content.call(this.element);
        }

        this.tooltip.find('.tooltip-content').html('<p>' + (content === undefined ? '(Content)' : content) + '</p>');
      },

      show: function(newSettings) {
        var self = this;
        this.isInPopup = false;

        if (newSettings) {
          settings = newSettings;
        }

        this.setContent(this.content);
        this.element.trigger('beforeOpen', [this.tooltip]);

        this.tooltip.removeAttr('style');
        this.tooltip.removeClass('bottom right left top is-error').addClass(settings.placement);
        this.position();
        if (settings.isError) {
          this.tooltip.addClass('is-error');
        }
        this.tooltip.removeClass('is-hidden');
        this.element.trigger('open', [this.tooltip]);

        setTimeout(function () {
          $(document).on('click.tooltip', function (e) {
            if (settings.isError) {
             return;
            }
            if ($(e.target).closest('.popover').length === 0
                && $(e.target).closest('.dropdown-list').length === 0) {
              self.hide();
            }
          })
          .on('keydown.tooltip', function (e) {
            if (e.which === 27 || settings.isError) {
              self.hide();
            }
          });
          $(window).on('resize.tooltip', function() {
            self.hide();
          });
        }, 400);

        if (self.isPopover) {
          this.tooltip.on('mouseenter.tooltip', function() {
            self.isInPopup = true;
          }).on('mouseleave.tooltip', function(e) {
            self.isInPopup = false;
            if ($(e.relatedTarget).is('.dropdown-list, .dropdown-option, .inforTimeField')) {
              return false;
            }
            setTimeout(function() {
              if (!self.isInPopup) {
                self.hide();
              }
            }, 400);
          });
        }
      },

      position: function () {
        var self = this,
          winH = window.innerHeight,
          // subtract 2 from the window width to account for the tooltips
          // resizing themselves to fit within the CSS overflow boundary.
          winW = window.innerWidth - 2;

        switch(settings.placement) {
          case 'bottom':
            self.placeBelow();
            var bottomOffset = self.tooltip.offset().top + self.tooltip.outerHeight();
            if (bottomOffset >= winH) {
              self.tooltip.removeClass('bottom').addClass('top');
              self.placeAbove();
            }
            break;
          case 'top':
            self.placeAbove();
            if (this.tooltip.offset().top <= 0) {
              self.tooltip.removeClass('top').addClass('bottom');
              self.placeBelow();
            }
            break;
          case 'right':
            self.placeToRight();
            var rightOffset = self.tooltip.offset().left + self.tooltip.outerWidth();
            if (rightOffset >= winW) {
              self.tooltip.removeClass('right').addClass('left');
              self.placeToLeft();
            }
            break;
          default: //left
            self.placeToLeft();
            if (this.tooltip.offset().left <= 0) {
              self.tooltip.removeClass('left').addClass('right');
              self.placeToRight();
            }
            break;
        }

        // secondary check on bottom/top placements to see if the tooltip width is long enough
        // to bleed off the edge of the page.
        if (settings.placement === 'bottom' ||
            settings.placement === 'top' ) {
              if ( self.tooltip.offset().left <= 0 ) {
                self.tooltip.removeClass('top bottom').addClass('right');
                self.placeToRight();
              }
              if ( (self.tooltip.offset().left + self.tooltip.outerWidth()) >= winW ) {
                self.tooltip.removeClass('top bottom').addClass('left');
                self.placeToLeft();
              }
        }

      },
      placeBelow: function () {
        this.tooltip.css({'top': this.element.offset().top + this.element.outerHeight() + settings.offset,
                          'left': this.element.offset().left + (this.element.outerWidth()/2) - (this.tooltip.outerWidth() / 2)});
      },
      placeAbove: function () {
        this.tooltip.css({'top': this.element.offset().top - settings.offset - this.tooltip.outerHeight(),
                          'left': this.element.offset().left + (this.element.outerWidth()/2) - (this.tooltip.outerWidth() / 2)});
      },
      placeToRight: function () {
        this.tooltip.removeAttr('style');
        this.tooltip.css({'top': this.element.offset().top - (this.tooltip.outerHeight() / 2) + (this.element.outerHeight() / 2),
                          'left': this.element.offset().left + this.element.outerWidth() + settings.offset});
      },
      placeToLeft: function () {
        this.tooltip.removeAttr('style');
        this.tooltip.css({'top': this.element.offset().top - (this.tooltip.outerHeight() / 2) + (this.element.outerHeight() / 2),
                          'left': this.element.offset().left - (settings.offset + this.tooltip.outerWidth()) });
      },

      hide: function() {
        if (this.isInPopup) {
          settings.content.addClass('hidden');
          return;
        }
        this.tooltip.addClass('is-hidden');
        $(document).off('click.tooltip');
        $(window).off('resize.tooltip');

        this.element.trigger('hide', [this.tooltip]);

      },

      destroy: function() {
        this.element.removeData(pluginName);
        this.hide();
        this.element.off('mouseenter.tooltip mouseleave.tooltip mousedown.tooltip click.tooltip');
      }
    };

    // Initializing the Control Once or Call Methods.
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (instance) {
        if (typeof instance[options] === 'function') {
          instance[options](args);
        }

        instance.settings = $.extend({}, defaults, options);
        if (settings.trigger === 'immediate') {
         setTimeout(function() {
            instance.show(settings);
          }, 100);
        }
      } else {
        instance = $.data(this, pluginName, new Plugin(this, settings));
      }
    });
  };

  //Migrate
  $.fn.inforToolTip = $.fn.tooltip;
  $.fn.popover = $.fn.tooltip;

}));
