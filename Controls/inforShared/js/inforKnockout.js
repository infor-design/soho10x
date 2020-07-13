/*
* Collection of Shared Bindings for use in KnockOut
*/
$(function () {

  //only add this if knockout is present..
  if (typeof ko === 'undefined') {
    return;
  }

  /* Provide the ability to translate and change text bindings on buttons.
  * Note: could also pass in a literal here: translate: 'SearchTreex'
  */
  ko.bindingHandlers.translate = {
    setText: function(element, valueAccessor){
      var key = ko.utils.unwrapObservable(valueAccessor()),
        translatedText = Globalize.localize(key),
        text = (translatedText === undefined ? key  : translatedText);

      if ($(element).find('.innerText').length > 0) {
        $(element).find('.innerText').text(text);
      } else {
        $(element).text(text);
      }
    },
    init: function(element, valueAccessor) {
      ko.bindingHandlers.translate.setText(element, valueAccessor);
    },
    update: function(element, valueAccessor) {
    ko.bindingHandlers.translate.setText(element, valueAccessor);
    }
  };

  /* Provide the ability to bind the code value..
  */
  ko.bindingHandlers.dropdown = {
    init: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element),
		setDataOnInit = true,
		triggerOnInit = true;

	  if (opts.initData != undefined) {
		setDataOnInit = ko.utils.unwrapObservable(opts.initData);
	  }
	  
	  if (opts.triggerInit != undefined) {
		triggerOnInit = ko.utils.unwrapObservable(opts.triggerInit);
	  }
	  
      //set the data
	  if (setDataOnInit) {
        ko.bindingHandlers.dropdown.setData(elem, opts);
	  }

      //init the control
      if (opts.options) {
        elem.dropdown(opts.options);
      } else if (!elem.data('dropdown')) {
        elem.dropdown();
      }

      //set the value
      if (opts.value && triggerOnInit) {
        $(element).val(valueAccessor().value()).trigger('updated');
      }

      //Setup events
      ko.utils.registerEventHandler(element, 'change', function() {
        var value = valueAccessor().value;
        value($(this).val());
      });
    },
    update: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      if (opts.data) {
        ko.bindingHandlers.dropdown.setData(elem, opts);
      }
      $(element).val(ko.utils.unwrapObservable(opts.value)).trigger('updated');
    },
    setData: function(elem, opts) {
      if (opts.data) {
        var data = ko.utils.unwrapObservable(opts.data),
			triggerData = true,
			options = "";
        if (data.length === elem[0].options.length && elem[0].options[0].value === data[0].id) {
          return;
        }

        elem.empty();
        for (var i=0, len=data.length; i < len; i++) {
          options += '<option value=\"' + (opts.optionsValue ? data[i][opts.optionsValue] : data[i].key) + '\">' 
		  + (opts.optionsText ? data[i][opts.optionsText] : data[i].name)
		  + '</option>';
        }
		elem.append(options);	

		if (opts.triggerData != undefined) {
		  triggerData = ko.utils.unwrapObservable(opts.triggerData);
		}

		if (triggerData) {
          elem.trigger('updated');
		}
      }
    }
  };

  //Migrate
  ko.bindingHandlers.inforDropDownList = ko.bindingHandlers.dropdown;

  ko.bindingHandlers.inforSlider = {
    init: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      //Setup events
      ko.utils.registerEventHandler(element, 'slidechange', function(e, ui) {
        var value = valueAccessor().value;
        value(ui.value);
      });

      //init the control
      if (opts.options) {
        elem.inforSlider(opts.options);
      } else if (!elem.data('uiInforSlider')) {
        elem.inforSlider();
      }

      //set the value
      if (opts.value) {
        elem.data('uiInforSlider').value(ko.utils.unwrapObservable(opts.value));
      }
    },
    update: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      elem.data('uiInforSlider').value(ko.utils.unwrapObservable(opts.value));
    }
  };

  ko.bindingHandlers.inforRadioButton = {
    init: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      //Setup events
      ko.utils.registerEventHandler(element, 'change', function() {
        var value = valueAccessor().value;
        value($(this).getValue());
      });

      //init the control
      if (!elem.data('uiInforRadioButton')) {
        elem.find('input').inforRadioButton();
      }

      //set the value
      if (opts.value) {
        elem.setValue(ko.utils.unwrapObservable(opts.value));
      }
    },
    update: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      elem.setValue(ko.utils.unwrapObservable(opts.value));
    }
  };

  ko.bindingHandlers.inforFileField = {
    init: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      //Setup events
      ko.utils.registerEventHandler(element, 'change', function() {
        var value = valueAccessor().value;
        value($(this).getValue());
      });

      //init the control
      if (!elem.data('uiInforFileField')) {
        elem.inforFileField();
      }

      //set the value
      if (opts.value) {
        elem.parent().find('.fileInputField').val(ko.utils.unwrapObservable(opts.value));
      }
    },
    update: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      elem.parent().find('.fileInputField').val(ko.utils.unwrapObservable(opts.value));
    }
  };

  ko.bindingHandlers.inforDateField = {
    init: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      //Setup events
      ko.utils.registerEventHandler(element, 'change', function() {
        var value = valueAccessor().value;
        value($(this).val());
      });

      //init the control
      if (!elem.data('uiInforDateField')) {
        elem.inforDateField();
      }

      //set the value
      if (opts.value) {
        elem.val(ko.utils.unwrapObservable(opts.value));
      }
    },
    update: function(element, valueAccessor) {
      var opts = ko.utils.unwrapObservable(valueAccessor()),
        elem = $(element);

      elem.val(ko.utils.unwrapObservable(opts.value));
    }
  };

});
