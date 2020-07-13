/**
* Responsive and Accessible Modal Control
* @name Tabs
* @param {string} propertyName - The Name of the Property
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module depending on jQuery.
      define('modal', ['jquery'], factory);
  } else {
      // No AMD. Register plugin with global jQuery object.
      factory(jQuery);
  }
}(function ($) {

  $.fn.modal = function(options) {

    // Settings and Options
    var pluginName = 'modal',
        defaults = {
          trigger: 'click', //TODO: supports click, immediate,  manual
          draggable: true,  //Can Drag the Dialog around.
          resizable: false, //Depricated - Resizable Dialogs.
          buttons: null,
          title: null,
          minimizable: false,
          isMessage: false
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Plugin(element) {
        this.element = $(element);
        this.init();
    }

    // Actual Plugin Code
    Plugin.prototype = {
      init: function(){
        var self = this;

        try {
          this.oldActive = document.activeElement;  //Save and restore focus for A11Y
        } catch( e ) {
          this.oldActive = parent.document.activeElement; //iframe
        }

        this.trigger = $('button[ data-modal="' + this.element.attr('id') + '"]');  //Find the button with same dialog ID
        this.overlay = $('<div class="overlay"></div>');
        this.id = 'modal-' +$ ('.modal').length+1;

        if (settings.trigger === 'click') {
          this.trigger.on('click.modal', function() {
            self.open();
          });
        }

        if (settings.trigger === 'immediate') {
          setTimeout(function () {
            self.open();
          },1);
        }

        if (settings.draggable) {
          this.element.draggable({handle: '.modal-title', containment: 'document', start: function() {
            self.revertTransition();
            $('#dropdown-list').hide();
          }});
        }

        if (settings.resizable) {
          this.element.resizable();

          if (settings.resize) {
            this.element.on('resize', function (e, ui) {
              settings.resize(e, ui);
            });
          }

          this.element.find('.ui-resizable-handle').on('mousedown', function () {
            self.revertTransition(true);
          });
        }

        $('<button class="inforCloseButton" type="button"><i>close</i></button>')
          .appendTo(this.element.find('.modal-title'))
          .on('click.modal', function() {
            self.close();
          });

        this.element.find('.btn-close').on('click.modal', function() {
          self.close();
        });


        if (settings.minimizable) {
          this.element.find('.modal-title').append('<button class="inforMaximizeButton" disabled type="button"><i>Maximize</i></button><button class="inforMinimizeButton" type="button"><i>Minimize</i></button>');

          self.minButton = this.element.find('.inforMinimizeButton').on('click.modal', function() {
            self.isMinimized = true;
            self.normalStyle = self.element.attr('style');
            self.normalWidth = self.element[0].style.width;

            self.element.addClass('is-minimized');

            self.maxButton.removeAttr('disabled').focus();
            self.minButton.attr('disabled','');
          });

          self.maxButton = this.element.find('.inforMaximizeButton').on('click.modal', function() {
          });
        }
        if (settings.buttons) {
          self.addButtons(settings.buttons);
        }
      },
      revertTransition: function (doTop) {
        //Revert the transform so drag and dropping works as expected
        var elem = this.element,
          parentRect = elem.parent()[0].getBoundingClientRect(),
          rect = elem[0].getBoundingClientRect();

        elem.css({'transition': 'all 0 ease 0', 'transform': 'none',
          'left': rect.left-parentRect.left});

        if (doTop) {
          elem.css('top', rect.top-parentRect.top+11);
        }
      },
      addButtons: function(buttons){
        var body = this.element.find('.modal-body'),
            self = this,
            buttonset = $('<div class="modal-buttonset"></div>').appendTo(body);

        buttonset.find('button').remove();
        body.find('.inforFormButton.default.btn-close').remove();

        $.each(buttons, function (name, props) {
          var btn = $('<button type="button" class="inforFormButton"></button>');
          btn.text(props.text);
          if (props.isDefault) {
            btn.addClass('default');
          }
          if (props.id) {
            btn.attr('id', props.id);
          }
          btn.on('click.modal', function() {
            if (props.click) {
              props.click.apply(self.element[0], arguments);
              return;
            }
            self.close();
          });
          buttonset.append(btn);
        });
      },
      sizeInner: function () {
        var messageArea;
        messageArea = this.element.find('.detailed-message');
        //Set a max width
        var h = $(window).height() - messageArea.offset().top - 150;
        messageArea.css({'max-height': h, 'overflow': 'auto', 'width': messageArea.width()});
      },
      open: function () {
        var self = this,
          messageArea,
          grid = self.element.find('.inforDataGrid').data('gridInstance');

        var elemCanOpen = this.element.triggerHandler('beforeOpen'),
          bodyCanOpen = this.element.find('.modal-body > div').first().triggerHandler('beforeOpen');

        if (elemCanOpen === false || bodyCanOpen === false) {
          return false;
        }

        this.overlay.appendTo('body');

        messageArea = self.element.find('.detailed-message');
        if (messageArea.length === 1) {
          $(window).on('resize.modal', function () {
            self.sizeInner();
          });
          self.sizeInner();
        }

        this.element.addClass('is-visible').attr('role', 'dialog');

        //Look for other nested dialogs and adjust the zindex.
        $('.modal').each(function (i) {
          var modal = $(this);
          modal.css('z-index', '100' + (i + 1));

          if (modal.data('modal') && modal.data('modal').overlay) {
            modal.data('modal').overlay.css('z-index', '100' + i);
          }
        });

        self.element.find('.autoLabelWidth').find('.inforLabel, .label').autoWidth();

        setTimeout(function () {
          self.element.find('.modal-title').focus();
          self.keepFocus();
          self.element.triggerHandler('open');
          self.element.find('.modal-body > div').first().triggerHandler('open');
          if (grid) {
            grid.resizeCanvas();
          }
        }, 300);

        $('body > *').not(self.element).not('.modal, .overlay').attr('aria-hidden', 'true');
        $('body').addClass('modal-engaged');
        self.element.attr('aria-hidden', 'false');
        self.overlay.attr('aria-hidden', 'false');

        //Center
        self.element.css({top:'50%',left:'50%', margin:'-'+(self.element.find('.modal-content').outerHeight() / 2)+'px 0 0 -'+(self.element.outerWidth() / 2)+'px'});

        // Add the 'modal-engaged' class after all the HTML markup and CSS classes have a chance to be established
        // (Fixes an issue in non-V8 browsers (FF, IE) where animation doesn't work correctly).
        // http://stackoverflow.com/questions/12088819/css-transitions-on-new-elements
        var x = this.overlay.width();
        $('body').addClass('modal-engaged');
        x = null;

        //Handle Default button.
        $(this.element).on('keypress.modal keydown.modal', function (e) {
          var target = $(e.target);

          if (target.is('.inforRichTextEditor') || target.is('textarea') ||      target.is(':button') || target.is('.inforDropDownList')
              || target.is('.inforSearchField') || target.closest('.inforDataGrid').length > 0) {
            return;
          }

          if (e.which === 13 && self.isOnTop()) {
            e.stopPropagation();
            e.preventDefault();
            self.element.find('button.default').trigger('click');
           }
        });

      },

      isOnTop: function () {
        var max = 0,
          dialog = this.element;

        $('.modal:visible').each(function () {
          if (max < $(this).css('z-index')) {
            max = $(this).css('z-index');
          }
        });

        return max === dialog.css('z-index');
      },

      keepFocus: function() {
        var self = this,
          allTabbableElements = $(self.element).find(':tabbable'),
          firstTabbableElement = allTabbableElements[0],
          lastTabbableElement = allTabbableElements[allTabbableElements.length - 1];

          $(self.element).on('keypress.modal keydown.modal', function (e) {
            var keyCode = e.which || e.keyCode;

            if (keyCode === 27) {
              self.close();
            }

            if (keyCode === 9) {
              // Move focus to first element that can be tabbed if Shift isn't used
              if (e.target === lastTabbableElement && !e.shiftKey) {
                e.preventDefault();
                firstTabbableElement.focus();
              } else if (e.target === firstTabbableElement && e.shiftKey) {
                e.preventDefault();
                lastTabbableElement.focus();
              }
            }
          });
      },

      close: function () {
        var elemCanClose = this.element.triggerHandler('beforeClose'),
          bodyCanClose = this.element.find('.modal-body > div').first().triggerHandler('beforeClose'),
          self = this;


        if (elemCanClose === false || bodyCanClose === false) {
          return false;
        }

        this.element.removeClass('is-visible');
        this.element.off('keypress.modal keydown.modal');

        this.overlay.remove();
        self.element.attr('aria-hidden', 'true');
        if ($('.modal[aria-hidden="false"]').length < 1) {
          $('body').removeClass('modal-engaged');
          $('body > *').not(this.element).not('.modal, .overlay').removeAttr('aria-hidden');
        }

        //Fire Events
        this.element.find('.modal-body > div').first().trigger('close');
        self.element.trigger('close');

        if (this.oldActive && $(this.oldActive).is('button:visible')) {
          this.oldActive.focus();
          this.oldActive = null;
        } else {
          this.trigger.focus();
        }

        //close tooltips
        $('#validation-errors, #tooltip').addClass('is-hidden');

      },

      destroy: function(){
        this.close();
        $.removeData($(this.element),'modal');
      }
    };

    // Support Chaining and Init the Control or Set Settings
    return this.each(function() {
      var instance = $.data(this, pluginName),
        elem = $(this);

      if (!elem.is('.modal')) {
        instance = elem.closest('.modal').data(pluginName);
      }

      if (instance) {
        if (typeof instance[options] === 'function') {
          instance[options]();
        }
        instance.settings = $.extend({}, defaults, options);

        if (settings.trigger === 'immediate') {
          instance.open();
        }
        return;
      }

      instance = $.data(this, pluginName, new Plugin(this, settings));
    });
  };

  //Migrate
  $.fn.inforDialog = $.fn.modal;

}));
