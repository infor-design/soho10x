/**
* Validate Plugin
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module depending on jQuery.
      define(['jquery'], factory);
  } else {
      // No AMD. Register plugin with global jQuery object.
      factory(window.jQuery || window.Zepto);
  }
}(function ($) {

  // Plugin Constructor
  function Validator(element) {
    this.element = $(element);
    this.init();
  }

  // Plugin Object
  Validator.prototype = {
    init: function() {
      var fields = 'input, textarea, select, div[data-validate], div[data-validation]';

      //If we initialize with a form find all inputs
      this.inputs = this.element.find(fields);

      //Or Just use the current input
      if (this.element.is(fields)) {
        this.inputs = $().add(this.element);
        if (this.element.is('select')) {
          this.inputs = $().add(this.element.nextAll('input.dropdown'));
        }
      }

      this.scrErrors = $('#scr-errors');
      if (this.scrErrors.length === 0) {
        this.scrErrors = $('<div id="scr-errors" role="alert" class="scr-only"><span id="message"></span></div>').appendTo('body');
      }

      this.tooltip = $('#validation-errors');
      if (this.tooltip.length === 0) {
        this.tooltip = $('<div id="validation-errors" class="tooltip is-error is-clickable is-hidden bottom float" role="tooltip" style="top: 78px; left: 54.2833px;"><div class="arrow"></div><div class="tooltip-content"><p>(Content)</p></div></div>').appendTo('body');
      }

      this.timeout = null;
    },
    attachEvents: function () {
      var self = this,
        attribs = '[data-validate],[data-validation]',
        clickObj = null;

      $(document).on('mousedown.validate',function(e) {
        // The latest element clicked
        clickObj = $(e.target);
      });

      // when 'clickObj == null' on blur, we know it was not caused by a click
      // but maybe by pressing the tab key
      $(document).on('mouseup.validate', function() {
        clickObj = null;
      });

      //Attach required
      this.inputs.each(function () {
        var field = $(this),
        attr = field.attr('data-validate') || field.attr('data-validation');

        if (attr && attr.indexOf('required') > -1) {
          field.required();
        }
      });

      //Link on to the current object and perform validation.
      this.inputs.filter('input, textarea, div').filter(attribs).not('input[type=checkbox]').each(function () {
        var field = $(this),
        attribs = field.attr('data-validation-events'),
        events = (attribs ? attribs : 'blur.validate change.validate');

        field.on(events, function () {
          var field = $(this);
          if ($(this).css('visibility') === 'is-hidden' || !$(this).is(':visible')) {
            return;
          }

          if (clickObj !==null && (clickObj.is('.dropdown-option') || clickObj.is('.inforTriggerButton')
            || clickObj.closest('#inforDatePicker-div').length === 1)) {
            return;
          }

          setTimeout(function () {
            self.validate(field, field.closest('.modal-engaged').length === 1 ? false : true);
          }, 150);
        });
      });

      this.inputs.filter('input[type=checkbox]').filter(attribs).on('click.validate', function () {
        self.validate($(this), true);
      });

      this.inputs.filter('select').filter(attribs).on('change.validate', function () {
        self.validate($(this), true);
      });

      //Attach to Form Submit and Validate
      if (this.element.is('form')) {

        var submitHandler = function (e) {
          e.stopPropagation();
          e.preventDefault();

          self.validateForm(function (isValid) {
            self.element.off('submit.validate');
            self.element.trigger('validated', isValid);
            self.element.data('isValid', isValid);
            self.element.on('submit.validate', submitHandler);
          });
        };

        this.element.on('submit.validate',submitHandler);
      }

      // If element is or has a dropdown, listen for open/close events
      if (this.element.is('.dropdown') || this.element.find('.dropdown').length) {
        this.element.on('open', function() {
          self.hideTooltip();
        });
      }

    },
    validateForm: function (callback) {
      var self = this,
        deferreds = [];

      self.inputs.each(function () {
        var dfds = self.validate($(this), false);
        for (var i = 0; i < dfds.length; i++) {
          deferreds.push(dfds[i]);
        }
      });

      $.when.apply($, deferreds).then(function () {
        callback(true);
      }, function () {
        callback(false);
      });
    },
    value: function(field) {
      if (field.is('input[type=checkbox]')) {
        return field.prop('checked');
      }
      if (field.is('div')) { // contentEditable div (Rich Text)
        return field[0].innerHTML;
      }
      return field.val();
    },
    getTypes: function(field) {
      if (field.is('input.dropdown') && field.prev().prev('select').attr('data-validate')) {
        return field.prev().prev('select').attr('data-validate').split(' ');
      }
      if (field.is('input.dropdown') && field.prev().prev('select').attr('data-validation')) {
        return field.prev().prev('select').attr('data-validation').split(' ');
      }
      if (field.attr('data-validation')) {
        return field.attr('data-validation').split(' ');
      }
      if (!field.attr('data-validate')) {
        return true;
      }
      return field.attr('data-validate').split(' ');
    },
    validate: function (field, showTooltip) {
      //call the validation function inline on the element
      var self = this,
        types = self.getTypes(field),
        rule, dfd,
        dfds = [],
        errors = [],
        i,
        value = self.value(field),
        manageResult = function (result, showTooltip) {
          if (!result) {
            self.addError(field, rule.message, showTooltip);
            errors.push(rule.msg);
            dfd.reject();
          } else if (errors.length === 0) {
            self.removeError(field);
            dfd.resolve();
          }
        };

      self.removeError(field);
      field.removeData('data-errormessage');

      for (i = 0; i < types.length; i++) {
        rule = $.fn.validation.rules[types[i]];
        dfd = $.Deferred();

        if (!rule) {
          continue;
        }

        if (rule.async) {
          rule.check(value, manageResult, field);
        } else {
          manageResult(rule.check(value, field), showTooltip);
        }

        dfds.push(dfd);
      }

      return dfds;
    },
    getField: function(field) {
      if (field.parent().is('.inforTriggerField')) {
        field = field.parent();
      } else if (field.is('.inforListBox')) {
        field = field.next('.inforListBox');
      } else if (field.is('.inforSwapList')) {
        field = field.find('.inforSwapListRight div.inforListBox');
      } else if (field.is('select')) {
        field = $('#'+field.attr('id')+'-shdo');
      }
      return field;
    },
    hasError: function(field) {
      return this.getField(field).hasClass('has-error');
    },
    addError: function(field, message, showTooltip) {
      var loc = this.getField(field).addClass('has-error'),
        self = this,
        icon = $('<i class="icon-error">&nbsp;</i>'),
        appendedMsg = (loc.data('data-errormessage') ? loc.data('data-errormessage') + '<br>' : '') + message;

      loc.data('data-errormessage', appendedMsg);

      if (loc.is('.inforRadioButtonSet')) {
        loc.find('.inforTopLabel').append(icon);
      } else if (!loc.next().is('.icon-error') && !loc.is('input[type=checkbox]')) {
        loc.after(icon);
      } else if (!loc.next().next().is('.icon-error') && loc.is('input[type=checkbox]')) {
        loc.next('.inforCheckboxLabel').after(icon);
      }

      icon.data('field', loc);
      icon.on('mouseenter', function() {
        var field = $(this).data('field');
        self.showTooltip(field.data('data-errormessage'), field);
      }).on('mouseleave', function() {
        self.tooltip.addClass('is-hidden');
      });

      if (showTooltip) {
        this.showTooltip(appendedMsg, field);
      }


        this.inputs.filter('input, textarea').on('focus.validate', function () {
        var field = $(this);
        setTimeout(function () {
          if (self.hasError(field)) {
            self.showTooltip(self.getField(field).data('data-errormessage'), field);
          }
        }, 1);
      });
    },
    positionTooltip: function (field) {
      // position it off to the left so we can get the width
      this.tooltip.css({left: -9999, top: 0});

      var tooltipWidth = this.tooltip.outerWidth(),
        leftPos = field.offset().left + field.outerWidth() - tooltipWidth + 18,
        topPos = field.offset().top + 33;

      if (field.is('input.dropdown')) {
        leftPos += -18; //the button area
      }

      if (field.is('fieldset')) {
        leftPos += -10;
      }

      if (field.is('.inforTriggerField')) {
        leftPos += -26;
      }

      if (field.parent().is('.inforTriggerField')) {
        leftPos += 3;
      }

      if (field.is('input[type=checkbox]')) {
        leftPos += field.next('.inforCheckboxLabel').width() + 5;
        topPos -= 14;
      }

      if (field.is('.inforRichTextEditor')) {
        leftPos += -4;
        topPos += 6;
      }

      if (field.is('.inforRadioButtonSet')) {
        leftPos = field.find('.icon-error').offset().left - tooltipWidth + 36;
        topPos += 6;
      }

      if ($('#dropdown-list').is(':visible') || $('#lookupGridDivId').is(':visible')) {
        return;
      }

      this.tooltip.css({left: leftPos, top: topPos});

      //Make sure its not off the left
      if (leftPos < 0) {
        var newWidth = parseInt(this.tooltip.outerWidth());
          newWidth -= (Math.abs(parseInt(leftPos)) + 13);

        this.tooltip.css({left: 10, maxWidth: newWidth + 'px'});
      }
    },
    hideTooltip: function() {
      this.tooltip.addClass('is-hidden');
      $(document).off('scroll.validation');
      $(window).off('resize.validation');
      this.tooltip.off('click.validation');
    },
    showTooltip: function(message, field) {
      var self = this;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        if (!field.is(':visible')) {
          return;
        }

        //Add Aria Alert
        var messages = self.scrErrors.find('#message').attr('role', 'alert');
        self.scrErrors.css('clip','auto');
        messages.html(message);
        messages.hide().css('display','inline');

        //Show Tooltip
        self.tooltip.removeClass('is-hidden').find('.tooltip-content p').html(message);

        //Set Position
        //Do this after the tooltip becomes visible and the message is populated
        self.positionTooltip(field);

        $(document).on('scroll.validation', function () {
          self.hideTooltip();
        });
        $(window).on('resize.validation', function () {
          self.hideTooltip();
        });
        self.tooltip.on('click.validation', function () {
          self.hideTooltip();
        });
      }, 100);

    },
    removeError: function(field) {
      var loc = this.getField(field),
        self = this;

      this.inputs.filter('input, textarea').off('focus.validate');
      loc.removeClass('has-error');
      loc.removeData('data-errormessage');
      loc.next('.icon-error').remove();
      loc.next('.inforCheckboxLabel').next('.icon-error').remove();
      loc.find('.inforTopLabel .icon-error').remove();

      clearTimeout(this.timeout);
      this.timeout = setTimeout(function () {
        self.tooltip.addClass('is-hidden');
      }, 1);
    }
  };

  //Add a Message to a Field
  $.fn.addError = function(options) {
    var defaults = {message: '', showTooltip: false},
      settings = $.extend({}, defaults, options);

    return this.each(function() {
      var instance = new Validator(this, settings);
      instance.addError($(this), settings.message, settings.showTooltip);
    });
  };

  //Add a Message to a Field
  $.fn.removeError = function(options) {
    var defaults = {message: '', showTooltip: false},
      settings = $.extend({}, defaults, options);

    return this.each(function() {
      var instance = new Validator(this, settings);
      instance.removeError($(this));
    });
  };


  $.fn.validate = function(options, args) {

    // Settings and Options
    var pluginName = 'validate',
      defaults = {
      },
      settings = $.extend({}, defaults, options);

    // Initializing the Control Once or Call Methods.
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (instance) {
        if (typeof instance[options] === 'function') {
          instance[options](args);
        }
        instance.settings = $.extend({}, defaults, options);
      } else {
        instance = $.data(this, pluginName, new Validator(this, settings));
        instance.attachEvents();
      }
    });
  };

  //The validation rules object
  var Validation = function () {
    this.rules = {
      required: {
        check: function (value, input) {
          this.message = Globalize.localize('Required');
          if (typeof value === 'string' && $.trim(value).length === 0) {
            return false;
          }
          if (input.is('.inforRadioButtonSet')) {
            return (input.find('input:checked').length > 0);
          }
          return (value ? true : false);
        },
        message: Globalize.localize('Required')
      }
    };
  };

  //TODO: We will extend this with other settings like accessibility.
  //$.fn.settings = {};
  $.fn.validation = new Validation();

  //Migrate
  $.fn.validationMessage = function(showHide, message, showTooltip) {
    var field = $(this);
    if (showHide === 'show') {
      field.removeError();
      field.addError({message: message, showTooltip: (showTooltip ? true: false)});
    } else {
      field.removeError();
    }
  };

  $.fn.setupValidation = function(callback) {
    $(this).validate().on('validated', function(e, isValid) {
      callback(isValid);
    });
  };

  $.Validation = {
    addRule: function (ruleId, rule, async) {
      if (rule.msg) {
        rule.message = rule.msg;
      }
      rule.async = async ? true : false;
      $.fn.validation.rules[ruleId] = rule;
    }
  };

  $.fn.isValid = function() {
    return ($(this).data('isValid') ? true : false);
  };

  //Clear out the stuff on the Form
  $.fn.resetForm = function() {
    var formFields = $(this).find('input, select, textarea');

    //Clear Errors
    formFields.removeClass('has-error');
    $(this).find('.has-error').removeClass('has-error');
    $(this).find('.icon-error').remove();

    setTimeout(function () {
      $('#validation-errors').addClass('is-hidden');
    }, 300);

    //Remove Dirty
    formFields.data('isDirty', false).removeClass('isDirty');
    $(this).find('.isDirty').removeClass('isDirty');

    //reset form data
    if ($(this).is('form')) {
      $(this)[0].reset();
    }
  };

}));
