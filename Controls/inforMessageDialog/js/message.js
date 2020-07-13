/**
* Responsive Messages
* Deps: modal
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module depending on jQuery.
      define('message', ['jquery'], factory);
  } else {
      // No AMD. Register plugin with global jQuery object.
      factory(jQuery);
  }
}(function ($) {

  $.fn.message = function(options) {

    // Settings and Options
    var defaults = {
          title: 'Message Title',
          shortMessage: 'Message Summary',
          detailedMessage: '',
          dialogType: 'Information', //Error, Information, Confirmation or Alert
          width: 'auto',
          resize: null,
          remove: false,
          minimizable: false,
          button: []  //Passed through to modal
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Plugin(element) {
      this.element = $(element);
      this.init();
    }

    // Actual Plugin Code
    Plugin.prototype = {
      init: function() {
        var content,
            self = this,
            isWrapped = false;

        //Create the Markup
        this.message = $('<div class="modal"></div>');
        this.messageContent = $('<div class="modal-content"></div>');
        this.title = $('<h1 class="modal-title" tabindex="0">' + settings.title + '</h3>').appendTo(this.messageContent);
        this.content = $('<div class="modal-body"><p class="short-message">'+ settings.shortMessage +'</p></div>').appendTo(this.messageContent);

        //Append The Content if Passed in
        if (!this.element.is('body') && settings.dialogType === 'General') {
          content = this.element;
          isWrapped = content.closest('.modal').length === 1;
          this.content.empty().append(content.show());
        }
        //Add Second Message
        if (settings.detailedMessage !== '') {
          this.content.append('<p class="detailed-message">'+ settings.detailedMessage +'</p>');
        }
        this.closeBtn = $('<button type="button" class="inforFormButton default btn-close">'+Globalize.localize('Close')+'</button>').appendTo(this.content);

        this.message.append(this.messageContent).appendTo('body');
        this.message.modal({trigger: 'immediate', isMessage: true, buttons: settings.buttons, resizable: settings.resizable, close: settings.close, minimizable: settings.minimizable, resize: settings.resize});

        //Adjust Width if Set as a Setting
        if (settings.width !== 'auto') {
          this.content.closest('.modal').css({'max-width': 'none', 'width': settings.width});
        }

        if (settings.dialogType !== 'General' || settings.remove) {
          this.message.on('close.message', function () {
            $(this).remove();
          });

          this.message.on('beforeOpen.message', function () {
            self.element.trigger('beforeOpen');
          });

          this.message.on('open.message', function () {
            self.element.trigger('open');
          });
        }

        //Add the Icons
        if (settings.dialogType === 'Alert') {
          this.title.prepend('<div class="inforIcon alert"></div>');
          this.content.parent().addClass('has-icon');
        }

        if (settings.dialogType === 'Error') {
          this.title.prepend('<div class="inforIcon error"></div>');
          this.content.parent().addClass('has-icon');
        }
      }
    };

    // Support Chaining and Init the Control or Set Settings
    return this.each(function() {
      var instance = $.data(this, 'message');

      if (instance && options.dialogType === 'General') {
        instance.message.data('modal').open();
        return;
      }

      instance = $.data(this, 'message', new Plugin(this, settings));
    });
  };

  //Migrate
  $.fn.inforMessageDialog = $.fn.message;

}));
