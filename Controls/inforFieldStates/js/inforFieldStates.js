/*
* Various Functions The handle Field states and setting field states.
*/
(function ($) {

  $.fn.getValue = function () {
    var elem = this[0],
      $elem = $(elem),
      api, input, retVal, value;

    if (elem === undefined) {
      return undefined;
    }

    if ($elem.hasClass("inforCheckbox")) {
      return ($elem.prop("checked") ? true : false);
    }

    if ($elem.hasClass("inforRadioButtonSet")) {
      value = $elem.find(".checked input").val();
      return value;
    }
    return $elem.val();
  };

  $.fn.setValue = function (value) {
    return this.each(function () {
      var elem = this,
      $elem = $(elem),
      seekVal, api, retVal, oneToCheck, checked;

      //Drop Downs.
      if ($.nodeName(elem, 'select') || $elem.hasClass('dropdown')) {
        if (value === undefined || value === '') {
          $elem.prop('selectedIndex', -1);
          $elem.nextAll('input.dropdown').first().val('');
          return $elem;
        }

        $elem.find('option').each(function() { this.selected = (this.text === value); });
        $elem.nextAll('input.dropdown').first().text(value);
        return $elem;
      }

      if ($elem.hasClass('inforRadioButtonSet')) {
        $elem.find('input').each(function () {
          var $this = $(this);
          $this.prop('checked', false);
          $this.parent().removeClass('checked');
        });

        oneToCheck = $elem.find('input[value="' + value + '"]');
        oneToCheck.prop('checked', true);
        oneToCheck.parent().addClass('checked');
      }

    });
  };

  /*
  * Jquery Extensions to get the Value or Code of (any control)
  */
  $.fn.getCode = function () {
    var elem = this[0],
      $elem = $(elem),
      api, input, value, seekVal, option, code;

    if ($.nodeName(elem, "select")) {
      return $(elem).find(":selected").attr("value");
    }
    return null;
  };

  /*
  * Infor Required Plugin. Makes any element have a required indicator icon to the top left.
  */
  $.fn.required = function (options) {
    var settings = {
      remove : false // false = default, add required; true = remove required
    };

    if (options) {
      $.extend(settings, options);
    }

    var isAdd = !settings.remove;

    return this.each(function () {
      var required = $('<span class="inforRequiredIndicator"></span>'),
        elem = $(this),
        label = null,
        id,
        trigger = elem.closest(".inforTriggerField"),
        location = (elem.is('select') ? elem.next().next() : elem),
        hasLabel = (trigger.length === 1) ? trigger.prev().is(".inforLabel") || trigger.prev().is(".label") : location.prev().is(".inforLabel") || location.prev().is(".label");

      if (hasLabel) {
        location = (trigger.length === 1) ? trigger.prev() : location.prev();
      }

      if (elem.attr("id")) {
        id = elem.attr("id");
        label = $("label[for='" + id + "']");

        if (label.length === 1){
          hasLabel = true;

          if (!elem.hasClass("inforCheckbox")) {
            location = label;
          }

          if (elem.is('select')) {
            location = label.next('label');
            if (location.length == 0) {
              location = elem.next('label');
            }
          }
        }
      }

      if (isAdd) {
        if (Globalize.culture().isRTL && !hasLabel) {
          required.css({"float": "right", "right": "-14px"});
        }

        if (elem.is("select") && !hasLabel) {
          required.css("top", (!Globalize.culture().isRTL) ? "-6px" : "0px");
        }

        if (elem.is("textarea") && !hasLabel)
        {
          required.css("top", (!Globalize.culture().isRTL) ? "-" + elem.height() + "px" : "0px");
        }

        if (elem.hasClass("inforHyperlink") && !hasLabel)
        {
          required.css("top", (!Globalize.culture().isRTL) ? "-3px" : "0px");
        }

        if (elem.hasClass("inforSlider") && !hasLabel)
        {
          required.css("top", (!Globalize.culture().isRTL) ? "0px" : "-15px");
        }
      }

      if (elem.hasClass("inforRadioButtonSet"))
      {
        location = elem.find(".inforTopLabel");

        if (location.length > 0)
        {
          hasLabel = true;
        }
        else
        {
          // no top label, so find first radio button label for location
          location = elem.find("label").first();
          hasLabel = false;
        }
      }

      if (elem.hasClass("inforCheckbox"))
      {
        location = elem.prev(".inforLabel");

        // no leading label
        if (location.length == 0)
        {
          if (!Globalize.culture().isRTL)
          {
            // no leading label
            location = elem;
            hasLabel = false;
          }
          else
          {
            // if RTL and has trailing label
            if (elem.next().hasClass("inforCheckboxLabel"))
            {
              location = elem.next();
              hasLabel = false;
            }
          }
        }

        if (isAdd && hasLabel)
        {
          required.css((!Globalize.culture().isRTL)
            ? {"top": "-7px", "left": "7px", "margin-left": "-9px"}
            : {"top": "0px",  "left": "0",   "margin-left": "-15px"}
          );
        }
        else
        {
          required.css((!Globalize.culture().isRTL)
            ? {"top": "-6px", "left": "-3px", "margin-left": "-9px"}
            : {"top": "0px",  "left": "0",    "margin-left": "-15px", "float": "right", "right": "-14px"}
          );
        }
      }

      //move the indicator for trigger fields.
      if (trigger.length == 1 && !hasLabel)
      {
        elem = trigger;
        location = elem.closest(".inforTriggerField");

        if (isAdd)
        {
          required.css("top", (!Globalize.culture().isRTL) ? "-6px" : "0px");
        }
      }

      if (location.length == 0)
      {
        return;
      }

      if (isAdd)
      {
        doAdd();
      }
      else
      {
        doRemove();
      }

      function doAdd()
      {
        elem.attr("aria-required", "true");
        if (elem.is('select')) {
          elem.next().next('input').attr("aria-required", "true");
        }

        if (!Globalize.culture().isRTL) {
          if (location.find(".inforRequiredIndicator").length === 0)
          {
            if (hasLabel)
            {
              location.append(required);
            }
            else
            {
              // don't add required if it is already there
              if (!location.prev().hasClass("inforRequiredIndicator"))
              {
                location.before(required);
              }
            }
          }
        }
        else
        {
          if (location.find(".inforRequiredIndicator").length === 0)
          {
            if (hasLabel)
            {
              location.prepend(required);
            }
            else
            {
              // don't add required if it is already there
              if (!location.next().hasClass("inforRequiredIndicator"))
              {
                location.after(required);
              }
            }
          }
        }
      }

      function doRemove()
      {
        elem.removeAttr("aria-required");

        if (!Globalize.culture().isRTL)
        {
          if (hasLabel)
          {
            location.find(".inforRequiredIndicator").remove();
          }
          else
          {
            if (location.prev().hasClass("inforRequiredIndicator"))
            {
              location.prev().remove();
            }
          }
        }
        else
        {
          if (hasLabel)
          {
            location.find(".inforRequiredIndicator").remove();
          }
          else
          {
            if (location.next().hasClass("inforRequiredIndicator"))
            {
              location.next().remove();
            }
          }
        }
      }
    });
  };

  /*
  * Adds a function that can easily disable a complex field to jquery.
  */
  $.fn.disable = function (options) {
    var settings = {
      readonly: false
    };
    return this.each(function () {
      var o = $.extend({}, settings, options),
        $control = $(this),
        targetClass = (!o.readonly ? "disabled" : "readonly"),
        $next;

      if ($control.hasClasses(['inforLookupField', 'inforTimeField', 'inforCalculatorField', 'inforSpinner', 'inforDateField', 'inforUrlField', 'inforSearchField', 'inforFileField', 'inforEmailField'])) {
        if ($control.hasClass(targetClass)) {
          return;
        }

        $control.addClass(targetClass).attr(targetClass, targetClass).closest(".inforTriggerField").addClass(targetClass);
        if ($control.hasClass("inforFileField")) {
          $next = $control.next();
          $next.addClass(targetClass).attr(targetClass, targetClass).data("selectOnly", $next.hasClass("selectOnly"));
          $next.removeClass("selectOnly");
        }
        if ($control.hasClass("inforLookupField")) {
          $control.data("selectOnly", $control.hasClass("selectOnly"));
          $control.removeClass("selectOnly");
        }

        if (!$control.data("backgroundColor")) {
          $control.data("backgroundColor", $control.closest(".inforTriggerField").hasClass("backgroundColor"));
        }
        if ($control.data("backgroundColor")) {
          $control.closest(".inforTriggerField").addClass("backgroundColor");
        }
        return;
      }

      if ($control.hasClass("inforRichTextEditor")) {
        $control.prev(".inforToolbar").fadeOut();
        $control.attr(targetClass, targetClass);
        $control.attr("contenteditable", "false");
      }

      if ($control.hasClass("inforSwapList")) {
        $control.find(".inforListBox").addClass("disabled");
        $control.find("button").attr("disabled","");
        $control.addClass("disabled");
      }

      if ($control.hasClass("dropdown") || $control.hasClass("inforDropDownList")) {
        if (targetClass === 'readonly') {
          $control.next().next('.dropdown').addClass('is-readonly');
          $control.next('.dropdown').addClass('is-readonly');
        }
        $control.next().next('.dropdown').attr(targetClass, targetClass).trigger("updated");
        $control.next('.dropdown').attr(targetClass, targetClass).trigger("updated");
        $control.attr(targetClass, targetClass);
        return;
      }

      if ($control.hasClass("inforRadioButtonSet")) {
        $control.find("input").attr("disabled", "disabled").addClass("disabled").parent().addClass("disabled");
        $control.addClass("disabled");
        return;
      }

      if ($control.hasClasses(["inforCheckbox", "inforRadioButton"])) {
        $control.attr("disabled", "disabled");
        $control.parent().addClass("disabled");
        return;
      }

      if ($control.hasClass("inforIconButton") && !$control.hasClass("inforSplitButton")) {
        $control.attr(targetClass, targetClass).attr("aria-disabled", "true");
        return;
      }

      if ($control.hasClass("inforTextButton")) {
        $control.attr(targetClass, targetClass).attr("aria-disabled", "true").addClass(targetClass);
      }

      if ($control.hasClass("inforSplitButton")) {
        $control.parent(".inforSplitButtonContainer").addClass(targetClass);
        $control.addClass(targetClass).attr(targetClass, "").attr("aria-disabled", "true");
        $control.next().addClass(targetClass).attr(targetClass, "").attr("aria-disabled", "true");
        return;
      }

      if ($control.hasClass("inforMenuButton")) {
        $control.addClass(targetClass).attr(targetClass, targetClass).attr("aria-disabled", "true");
        return;
      }

      if ($control.hasClass("inforFormButton")) {
        $control.attr(targetClass, targetClass).addClass(targetClass).attr("aria-disabled", "true");
        return;
      }

      if ($control.hasClasses(["inforTextbox", "inforTextArea"])) {
        $control.addClass(targetClass);
        $control.attr(targetClass, "");
      }

      if ($control.hasClass("inforTree")) {
        $control.addClass("disabled").bind('before.jstree', function (event, data) {
          var isSelectable = false;
          if (!isSelectable && (data.func == 'select_node' || data.func == 'hover_node')) {
            event.stopImmediatePropagation();
            return false;
          }

          if ($control.hasClass("disabled") && (data.func == 'check_node' || data.func == 'uncheck_node')) {
            event.stopImmediatePropagation();
            return false;
          }
        });
      }
    });
  };

  /*
  * Adds a function that can easily enable a complex field to jquery.
  */
  $.fn.enable = function () {

    return this.each(function () {
      var $control = $(this),
        targetClass = "disabled readonly";

      if ($control.hasClasses(['inforLookupField', 'inforCalculatorField', 'inforSpinner', 'inforDateField', 'inforTimeField', 'inforUrlField', 'inforSearchField', 'inforFileField', 'inforEmailField'])) {
        $control.removeClass(targetClass).removeAttr(targetClass).closest(".inforTriggerField").removeClass(targetClass);
        if ($control.hasClass("inforFileField")) {
          var $next = $control.next();
          $control.removeAttr("disabled");
          $next.removeClass(targetClass).removeAttr(targetClass);
          if ($next.data("selectOnly")) $next.data("selectOnly");
        }

        if ($control.hasClass("inforLookupField") && $control.data("selectOnly")) {
          if ($control.data("autocomplete")) $control.autocomplete("makeSelectOnly", false, $control.data("autocomplete").options.typeAheadSearch);
          else $control.attr("readonly", "").addClass("selectOnly");
        }
        if ($control.data("backgroundColor")) {
          $control.closest(".inforTriggerField").removeClass("backgroundColor");
          $control.removeClass("backgroundColor");
        }
        return;
      }

      if ($control.hasClass("inforSwapList")) {
        $control.find(".inforListBox").removeClass("disabled");
        $control.find("button").removeAttr("disabled","");
        $control.removeClass("disabled");
      }

      if ($control.hasClass("inforRichTextEditor")) {
        $control.prev(".inforToolbar").fadeIn();
        $control.removeAttr(targetClass).attr("contenteditable", "true");
      }

      if ($control.hasClass("dropdown") || $control.hasClass("inforDropDownList")) {
        $control.next().next('.dropdown').removeAttr(targetClass, targetClass).removeClass('is-readonly');
        $control.next('.dropdown').removeAttr(targetClass, targetClass).removeClass('is-readonly');
        $control.removeAttr(targetClass, targetClass);
        $control.next().next('.dropdown').attr('readonly', 'readonly');
        return;
      }

      if ($control.hasClass("inforRadioButtonSet")) {
        $control.find("input").removeAttr("disabled").removeClass("disabled").parent().removeClass("disabled");
        $control.removeClass("disabled");
        return;
      }

      if ($control.hasClasses(["inforCheckbox", "inforRadioButton"])) {
        $control.removeAttr("disabled");
        $control.removeAttr(targetClass);
        $control.parent('.inforRadioButtonLabel').removeClass('disabled');
        return;
      }

      if ($control.hasClass("inforIconButton") && !$control.hasClass("inforSplitButton")) {
        $control.removeAttr(targetClass).attr("aria-disabled", "false");
        return;
      }

      if ($control.hasClass("inforTextButton")) {
        $control.removeAttr(targetClass).removeClass(targetClass).attr("aria-disabled", "false");
        return;
      }

      if ($control.hasClass("inforSplitButton")) {
        $control.removeClass(targetClass).removeAttr(targetClass).attr("aria-disabled", "false");
        $control.next().removeClass(targetClass).removeAttr(targetClass).attr("aria-disabled", "false");
        $control.parent().removeClass(targetClass).attr("aria-disabled", "false");
        return;
      }

      if ($control.hasClass("inforMenuButton")) {
        $control.removeClass(targetClass).removeAttr(targetClass).attr("aria-disabled", "false");
        return;
      }

      if ($control.hasClass("inforFormButton")) {
        $control.removeAttr(targetClass).removeClass(targetClass).attr("aria-disabled", "false");
        return;
      }

      if ($control.hasClasses(["inforTextbox", "inforTextArea"])) {
        $control.removeClass(targetClass);
        $control.removeAttr(targetClass);
      }

      if ($control.hasClass("inforTree")) {
        $control.removeClass("disabled").unbind('before.jstree');
      }
      return;
    });
  };

  /*
  * Makes an object readonly. Fx for the checkboxes and radio buttons
  */

  $.fn.readOnly = function () {
    return this.each(function () {
      $(this).disable({
        readonly: true
      });
    });
  };

  /*
  * Toggles the Checkbox State.
  */
  $.fn.toggleChecked = function () {
    var checkbox = $(this),
      checked = false;

    if (!checkbox.hasClass("inforCheckbox")){
      return false;
    }

    checked = !checkbox.prop('checked');
    checkbox.prop('checked', checked);

    return checked;
  };

  $.fn.formatNumber = function () {
    this.each(function () {
      var $input = $(this),
        format = $input.attr("data-number-format"),
        sourceFormat = $input.attr("data-number-source-format"),
        isDecimal = false,
        isTrim = (format != undefined ? format.substr(0, 1).toLowerCase() === "t" && format !== "n0" : false),
        val = $input.val();

      if  (isTrim) {
        format = format.replace("t","n");
      }

      if (!sourceFormat) $input.attr("data-number-source-format", sourceFormat = "en-US");

      var rawValue = Globalize.parseFloat(val, 10, sourceFormat);

      if (isNaN(rawValue)) //try to format it in current format
        rawValue = Globalize.parseFloat(val, 10);

      if (!format && $input.hasClass("numericOnly")) {
        $input.attr("data-number-format", format = "n0");
      }

      if (!format && $input.hasClass("decimalOnly")) {
        $input.attr("data-number-format", format = "n2");
      }

      isDecimal = $input.hasClass("decimalOnly");

      if (format && val && isDecimal) {
        val = Globalize.format(rawValue, format);
        $input.val(val);
      }

      if (format && val && isDecimal && isTrim) {
        val = val.replace(/0*$/, ''); //remove trailing zeros
        if (val.indexOf(".") == val.length -1) {
          val = val.replace(".", '');
        }
        if (val.indexOf(",") == val.length -1) {
          val = val.replace(",", '');
        }
        $input.val(val);
      }
    });
  };

  /*
  * Get the location of the cursor within the input field
  */
  $.fn.getCursorPosition = function() {
    var input = this.get(0);
    if (!input) return; // No (input) element found
    if ('selectionStart' in input) {
      // Standard-compliant browsers
      return input.selectionStart;
    } else if (document.selection) {
      // IE
      input.focus();
      var sel = document.selection.createRange();
      var selLen = document.selection.createRange().text.length;
      sel.moveStart('character', -input.value.length);
      return sel.text.length - selLen;
    }
  }

  /*
  * Restricts the input on a Input Field to Numeric.
  */
  $.fn.numericOnly = function (allowDecimal, onlyAllowPositive) {
    var $input = $(this),
      format = $input.attr("data-number-format");

    if (format) {
      //prevent pasting in bad values..
      $input.bind('paste', function () {
        var el = $(this);
        setTimeout(function () {
          el.formatNumber();
        }, 100);
      });
    }

    $input.keypress(function (e) {
      var chrTyped, chrCode = 0,
        decimalSeparator = Globalize.culture().numberFormat["."],
        thousandSepartor = Globalize.culture().numberFormat[","];

            if (e.charCode != null) {
        chrCode = e.charCode;
            }
            else if (e.which != null) {
              chrCode = e.which;
            }
            else if (e.keyCode != null) {
              chrCode = e.keyCode;
            }

            if (chrCode == 0) {
              return;
            }

            chrTyped = String.fromCharCode(chrCode);
            //Allow one , and one .
            if (decimalSeparator == chrTyped && allowDecimal) {
              if ($input.val().indexOf(decimalSeparator) > -1) {
                // if the input is not hightlight
                if ($input[0].selectionEnd - $input[0].selectionStart != $input.val().length)
                  e.preventDefault();

                return;
              }
              return;
            }


            if (thousandSepartor == chrTyped  && allowDecimal) {
                //Once a decimal separator has been entered, no thousand separators are allowed.
                if ($input.val().indexOf(decimalSeparator) > -1) {
                       e.preventDefault();
                       return;
                   }
                return;
            }

            //allow one dash (negative) at the start
      if (!onlyAllowPositive && chrTyped == '-') {
        if ($input.getCursorPosition() != 0 || $input.val().indexOf("-") > -1 ) {
          e.preventDefault();
          return;
        }
        return;
      }

      if (!(/^[0-9]+$/.test(chrTyped))) {
        e.preventDefault();
          return;
      }

            return;

    });

    var format = $input.attr("data-number-format");
    if (format) {
      $input.formatNumber();
    }
    return $input;
  };

  /*
  * Allows you to track dirty fields and add the dirty indicator...
  */
  $.fn.trackDirty = function (settings) {
    var isDirty = "isDirty";
    var config = {
      onDirtyChangeCallback: null
    },
    changeCallback = function () {
      var el = this,
        $el = $(el),
        isChangedBack = $el.data("originalValue") === $el.getValue();

      if ($el.hasClass("inforRadioButton")) {
        isChangedBack = $el.parent().parent().find('input:radio:checked') === $el.data("originalValue");
      }

      if (($el.attr("readonly") || $el.attr("disabled")) && !$el.hasClass("selectOnly") && !$el.is("select")) {
        return;
      }

      if ($el.is("input.inforDropDownList")) { //change fires on the select element
        return;
      }

      if ($el.is("select")) {
        isChangedBack = ($el.data("originalValue") === $el.val());
      }

      //Handle Setting back to orginal value - the value is set at plugin initialization
      if (isChangedBack) {
        $el.data(isDirty, false).removeClass("isDirty");
        if ($el.is(".inforCheckbox")) {
          $el.removeClass("isDirty");
        }
        if ($el.is("select")) {
          $el.next().next("input").removeClass("isDirty");
        }
        return;
      }

      if ($el.data(isDirty) === true) {
        return;
      }

      $el.data(isDirty, true).addClass("isDirty");
      if ($el.is(".inforCheckbox")) {
        $el.addClass("isDirty");
      }

      if ($el.is("select")) {
        $el.next().next("input").addClass("isDirty");
      }

      if (config.onDirtyChangeCallback) {
        config.onDirtyChangeCallback.apply(el);
      }
    };

    if (settings) $.extend(config, settings);

    this.each(function () {
      var $this = $(this),
        originalVal = $this.getValue();

      if ($this.is("select")) {
        originalVal = $this.getCode();
      }

      if (originalVal == undefined) {
        originalVal = null;
      }

      if ($this.hasClass("inforRadioButton")) {
        originalVal = $this.parent().parent().find('input:radio:checked');
      }

      $this.data("originalValue", originalVal);
      $this.filter(":input").change(changeCallback);
      $this.find(":input").on("change", changeCallback);
    });

    return this;
  };

  /*
  * Allows you to set field widths to the longest..
  */
  $.fn.autoWidth = function (options) {
    var settings = {
      limitWidth: false
    }

    if (options) {
      $.extend(settings, options);
    }

    var maxWidth = 0,
      isCheckboxLabel = false,
      filtered = this.not(".noAutoWidth");

    filtered.css("width", "auto");

    filtered.each(function () {
      var $this = $(this);
      if ($this.width() > maxWidth) {
        if (settings.limitWidth && maxWidth >= settings.limitWidth) {
          maxWidth = settings.limitWidth;
        } else {
          maxWidth = $this.width();
        }
      }
      if ($this.hasClass("inforCheckboxLabel")) isCheckboxLabel = true;
    });

    filtered.width(maxWidth + (isCheckboxLabel ? 2 : 0));
  }

  // Add :dirty selector
  $.extend($.expr[":"], {
    dirty: function (a) {
      return $(a).is("input") === true && $(a).hasClass("isDirty") === true;
    }
  });

  // Add : hasClasses
  $.fn.extend({
    hasClasses: function (selectors) {
      var self = this, i;

      for (i in selectors) {
        if ($(self).hasClass(selectors[i])) {
          return true;
        }
      }
      return false;
    }
  });

  /* Override the jquery hide function to add better behavior for controls */
  $.fn.baseHide = $.fn.hide;
  $.fn.hide = function (duration, easing, callback) {
    var elem,
    i = 0,
      j = this.length;

    for (; i < j; i++) {
      elem = $(this[i]);
      if (elem.hasClasses(['inforLookupField', 'inforTimeField', 'inforDateField', 'inforUrlField', 'inforSpinner', 'inforSearchField', 'inforEmailField', 'inforCalculatorField'])) {
        elem.closest(".inforTriggerField").hide(duration, easing, callback);

        if (elem.prev().is(".inforRequiredIndicator")) {
          elem.prev().hide();
        }
      } else if (elem.hasClass("inforDropDownList") && elem.data("initialized")) {
        elem.next().hide(duration, easing, callback);

        if (elem.prev().is(".inforRequiredIndicator")) {
          elem.prev().hide();
        }
      } else if (elem.is(".inforCheckbox") && (elem.attr("type") == "checkbox")) {
        elem.baseHide(duration, easing, callback);
        $('label[for=' + elem.attr("id") + ']').baseHide(duration, easing, callback);
      } else {
        elem.baseHide(duration, easing, callback)
      }
    }
    return this;
  };

  /* Override the jquery show function to add better behavior for controls */
  $.fn.baseShow = $.fn.show;
  $.fn.show = function (duration, easing, callback) {
    var elem,
    i = 0,
      j = this.length;

    for (; i < j; i++) {
      elem = $(this[i]);

      if (elem.hasClasses(['inforLookupField', 'inforTimeField', 'inforDateField', 'inforUrlField', 'inforSpinner', 'inforSearchField', 'inforEmailField', 'inforCalculatorField'])) {
        elem.closest(".inforTriggerField").show(duration, easing, callback);
        if (elem.prev().is(".inforRequiredIndicator")) {
          elem.prev().show();
        }
      } else if (elem.hasClass("inforDropDownList") && elem.data("initialized")) {
        elem.next().show(duration, easing, callback);
        if (elem.prev().is(".inforRequiredIndicator")) {
          elem.prev().show();
        }
      } else if (elem.is(".inforCheckbox") && (elem.attr("type") == "checkbox")) {
        elem.baseShow(duration, easing, callback);
        $('label[for=' + elem.attr("id") + ']').baseShow(duration, easing, callback);
      } else {
        elem.baseShow(duration, easing, callback)
      }
    }
    return this;
  };

  /* Add maxlength for ie */
  $.fn.maxLength = function(value) {
    if (!navigator.userAgent.toLowerCase().match(/msie/)) {
      return this;
    }

    this.each(function(){
      var $control = $(this),
        maxlength = $control.attr('maxlength');

      if (typeof maxlength !== 'undefined' && maxlength !== false) {
        $control.on('keydown blur', function() {
          setTimeout(function() {
            // Store the maxlength and value of the field.
            var val = $control.val();

            // Trim the field if it has content over the maxlength.
            if (val.length > maxlength) {
              $control.val(val.slice(0, maxlength)).trigger("change");
            }
          },1);
        }).on("paste", function(){
          $(this).trigger("keydown");
        });
      }
    });

    return this;
  }
})(jQuery);


/*
  Masked Input plugin for jQuery
  Copyright (c) 2007-2013 Josh Bush (digitalbush.com)
  Licensed under the MIT license (http://digitalbush.com/projects/masked-input-plugin/#license)
  Version: 1.3.1
*/
(function($) {
  function getPasteEvent() {
    var el = document.createElement('input'),
        name = 'onpaste';
    el.setAttribute(name, '');
    return (typeof el[name] === 'function')?'paste':'input';
}

var pasteEventName = getPasteEvent() + ".mask",
  ua = navigator.userAgent,
  iPhone = /iphone/i.test(ua),
  android=/android/i.test(ua),
  caretTimeoutId;

$.mask = {
  //Predefined character definitions
  definitions: {
    '9': "[0-9]",
    'a': "[A-Za-z]",
    '*': "[A-Za-z0-9]"
  },
  dataName: "rawMaskFn",
  placeholder: ""
};

$.fn.extend({
  //Helper Function for Caret positioning
  caret: function(begin, end) {
    var range;

    if (this.length === 0 || this.is(":hidden")) {
      return;
    }

    if (typeof begin === 'number') {
      end = (typeof end === 'number') ? end : begin;
      return this.each(function() {
        if (this.setSelectionRange) {
          this.setSelectionRange(begin, end);
        } else if (this.createTextRange) {
          range = this.createTextRange();
          range.collapse(true);
          range.moveEnd('character', end);
          range.moveStart('character', begin);
          range.select();
        }
      });
    } else {
      if (this[0].setSelectionRange) {
        begin = this[0].selectionStart;
        end = this[0].selectionEnd;
      } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        begin = 0 - range.duplicate().moveStart('character', -100000);
        end = begin + range.text.length;
      }
      return { begin: begin, end: end };
    }
  },
  unmask: function() {
    return this.trigger("unmask");
  },
  mask: function(mask, settings) {
    var input,
      defs,
      tests,
      partialPosition,
      firstNonMaskPos,
      len;

    if (!mask && this.length > 0) {
      input = $(this[0]);
      return input.data($.mask.dataName)();
    }
    settings = $.extend({
      placeholder: $.mask.placeholder, // Load default placeholder
      completed: null
    }, settings);


    defs = $.mask.definitions;
    tests = [];
    partialPosition = len = mask.length;
    firstNonMaskPos = null;

    $.each(mask.split(""), function(i, c) {
      if (c === '?') {
        len--;
        partialPosition = i;
      } else if (defs[c]) {
        tests.push(new RegExp(defs[c]));
        if (firstNonMaskPos === null) {
          firstNonMaskPos = tests.length - 1;
        }
      } else {
        tests.push(null);
      }
    });

    return this.trigger("unmask").each(function() {
      var input = $(this),
        buffer = $.map(
        mask.split(""),
        function(c) {
          if (c !== '?') {
            return defs[c] ? settings.placeholder : c;
          }
        }),
        focusText = input.val();

      function seekNext(pos) {
        while (++pos < len && !tests[pos]);
        return pos;
      }

      function seekPrev(pos) {
        while (--pos >= 0 && !tests[pos]);
        return pos;
      }

      function shiftL(begin,end) {
        var i,
          j;

        if (begin<0) {
          return;
        }

        for (i = begin, j = seekNext(end); i < len; i++) {
          if (tests[i]) {
            if (j < len && tests[i].test(buffer[j])) {
              buffer[i] = buffer[j];
              buffer[j] = settings.placeholder;
            } else {
              break;
            }

            j = seekNext(j);
          }
        }
        writeBuffer();
        input.caret(Math.max(firstNonMaskPos, begin));
      }

      function shiftR(pos) {
        var i,
          c,
          j,
          t;

        for (i = pos, c = settings.placeholder; i < len; i++) {
          if (tests[i]) {
            j = seekNext(i);
            t = buffer[i];
            buffer[i] = c;
            if (j < len && tests[j].test(t)) {
              c = t;
            } else {
              break;
            }
          }
        }
      }

      function keydownEvent(e) {
        var k = e.which,
          pos,
          begin,
          end;

        //backspace, delete, and escape get special treatment
        if (k === 8 || k === 46 || (iPhone && k === 127)) {
          pos = input.caret();
          begin = pos.begin;
          end = pos.end;

          if (end - begin === 0) {
            begin=k!==46?seekPrev(begin):(end=seekNext(begin-1));
            end=k===46?seekNext(end):end;
          }
          clearBuffer(begin, end);
          shiftL(begin, end - 1);

          e.preventDefault();
        } else if (k === 27) {//escape
          input.val(focusText);
          input.caret(0, checkVal());
          e.preventDefault();
        }
      }

      function keypressEvent(e) {
        var k = e.which,
          pos = input.caret(),
          p,
          c,
          next;

        if (e.ctrlKey || e.altKey || e.metaKey || k < 32) {//Ignore
          return;
        } else if (k) {
          if (pos.end - pos.begin !== 0){
            clearBuffer(pos.begin, pos.end);
            shiftL(pos.begin, pos.end-1);
          }

          p = seekNext(pos.begin - 1);
          if (p < len) {
            c = String.fromCharCode(k);
            if (tests[p].test(c)) {
              shiftR(p);

              buffer[p] = c;
              writeBuffer();
              next = seekNext(p);

              if(android){
                setTimeout($.proxy($.fn.caret,input,next),0);
              }else{
                input.caret(next);
              }

              if (settings.completed && next >= len) {
                settings.completed.call(input);
              }
            }
          }
          e.preventDefault();
        }
      }

      function clearBuffer(start, end) {
        var i;
        for (i = start; i < end && i < len; i++) {
          if (tests[i]) {
            buffer[i] = settings.placeholder;
          }
        }
      }

      function writeBuffer() { input.val(buffer.join('')); }

      function checkVal(allow) {
        //try to place characters where they belong
        var test = input.val(),
          lastMatch = -1,
          i,
          c;

        for (i = 0, pos = 0; i < len; i++) {
          if (tests[i]) {
            buffer[i] = settings.placeholder;
            while (pos++ < test.length) {
              c = test.charAt(pos - 1);
              if (tests[i].test(c)) {
                buffer[i] = c;
                lastMatch = i;
                break;
              }
            }
            if (pos > test.length) {
              break;
            }
          } else if (buffer[i] === test.charAt(pos) && i !== partialPosition) {
            pos++;
            lastMatch = i;
          }
        }
        if (allow) {
          writeBuffer();
        } else if (lastMatch + 1 < partialPosition) {
          input.val("");
          clearBuffer(0, len);
        } else {
          writeBuffer();
          input.val(input.val().substring(0, lastMatch + 1));
        }
        return (partialPosition ? i : firstNonMaskPos);
      }

      input.data($.mask.dataName,function(){
        return $.map(buffer, function(c, i) {
          return tests[i]&&c!==settings.placeholder ? c : null;
        }).join('');
      });

      if (!input.attr("readonly")) {
        input
        .one("unmask", function() {
          input
            .unbind(".mask")
            .removeData($.mask.dataName);
        })
        .bind("focus.mask", function() {
          clearTimeout(caretTimeoutId);
          var pos;

          focusText = input.val();
          pos = checkVal();

          caretTimeoutId = setTimeout(function(){
            writeBuffer();
            if (pos == mask.length) {
              input.caret(0, pos);
            } else {
              input.caret(pos);
            }
          }, 10);
        })
        .bind("blur.mask", function() {
          checkVal();
          if (input.val() != focusText)
            input.change();
        })
        .bind("keydown.mask", keydownEvent)
        .bind("keypress.mask", keypressEvent)
        .bind(pasteEventName, function() {
          setTimeout(function() {
            var pos=checkVal(true);
            input.caret(pos);
            if (settings.completed && pos == input.val().length)
              settings.completed.call(input);
          }, 0);
        });
      }
      checkVal(); //Perform initial check for existing values
    });
  }
});
})(jQuery);
