/**
* Autocomplete for inputs and searches
* @name autocomplete
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module depending on jQuery.
    define(['jquery'], factory);
  } else {
    // No AMD. Register plugin with global jQuery object.
    factory(jQuery);
  }
}(function ($) {

  $.fn.autocomplete = function (options) {

    // Settings and Options
    var pluginName = 'autocomplete',
      defaults = {
        source: ['Alabama', 'Alaska', 'California', 'Delaware'], //Defines the data to use, must be specified.
        selectionRequired: false,
        searchInValue: false,
        popupTemplate:
          '<span>{{{label}}}</span>' +
          '{{#hasValue}}<span>{{{value}}}</span>{{/hasValue}}',
        inputMask: '{{{label}}}',
      },
      settings = $.extend({}, defaults, options);
    var allowUpdate = false;
    var isChanged = false;
    var template = 
      '<li id="{{listItemId}}" {{#hasValue}}data-value="{{optionValue}}"{{/hasValue}} data-label="{{optionLabel}}" role="listitem">' + '\n\n' +
        '<a href="#" tabindex="-1">' + '\n\n' +
          '{{{template}}}' + '\n\n' + 
        '</a>' + '\n\n' +
      '</li>';

    // Plugin Constructor
    function Plugin(element) {
      //TODO: Idea is that data-autocomplete can be a url, 'source' or an array
      this.element = $(element);
      this.init();
    }

    // Plugin Object
    Plugin.prototype = {
      init: function () {
        this.addMarkup();
        this.handleEvents();
      },

      addMarkup: function () {
        this.element.addClass('autocomplete')
          .attr('data-value', '')
          .attr('role', 'combobox')
          .attr('aria-owns', 'autocomplete-list')
          .attr('aria-autocomplete', 'list')
          .attr('aria-activedescendant', '');
      },

            openList: function (term, items) {
        var self = this, matchingOptions = [];

        var termCased = term;
        term = term.toLowerCase();

        //append the list
        this.list = $('#autocomplete-list');
        if (this.list.length === 0) {
          this.list = $('<ul id="autocomplete-list" aria-expanded="true"></ul>').appendTo('body');
        }

        this.list.css({ 'height': 'auto', 'width': this.element.outerWidth() }).addClass('autocomplete');
        this.list.empty();

        this.tmpl = template.replace('{{{template}}}', settings.popupTemplate);

        for (var i = 0; i < items.length; i++) {
          var isString = typeof items[i] === 'string',
            hasValue = !isString && items[i].value !== undefined,
            optionLabel = (isString ? items[i] : items[i].label),
            optionValue = (isString ? items[i] : items[i].value),
            baseData = {
              label: optionLabel
            },
            dataset = (isString ? baseData : $.extend(baseData, items[i]));

          if (optionLabel.toLowerCase().indexOf(term) > -1 || ((hasValue && items[i].value.toLowerCase().indexOf(term) > -1) && settings.searchInValue)) {

            dataset.listItemId = 'ac-list-option' + i;
            var hasTerm = optionLabel.toLowerCase().indexOf(term)>=0;
            dataset.label = hasTerm ? optionLabel.replace(termCased, '<i>' + termCased + '</i>') : optionLabel;
            dataset.optionLabel = optionLabel;
            dataset.hasValue = hasValue;
			
            if (hasValue && settings.searchInValue) {
              dataset.optionValue = optionValue;
              dataset.value = !hasTerm && optionValue.toLowerCase().indexOf(term)>=0 ? optionValue.replace(termCased, '<i>' + termCased + '</i>') : optionValue;
            }

            if (typeof Tmpl !== 'undefined') {
              var compiledTmpl = Tmpl.compile(this.tmpl),
                renderedTmpl = compiledTmpl.render(dataset);

              self.list.append(renderedTmpl);
            } else {
              var listItem = $('<li role="listitem"></li>');
              listItem.attr('id', dataset.listItemId);
              listItem.attr('data-value', optionValue);
              listItem.attr('data-label', optionLabel);
              listItem.append('<a href="#" tabindex="-1"><span>' + dataset.label + '</span></a>');
              self.list.append(listItem);
            }
          }
        };

        this.element.addClass('is-open')
          .popupmenu({ menuId: 'autocomplete-list', trigger: 'immediate', autoFocus: false })
          .on('close.autocomplete', function () {
            self.list.parent('.popupmenu-wrapper').remove();
            self.element.removeClass('is-open');
          });

        self.setPosition();

        self.list.off('click.autocomplete').on('click.autocomplete', 'a', function (e) {
          var a = $(e.currentTarget),
            ret = a.text().trim();

        self.element.attr('aria-activedescendant', a.parent().attr('id'));
      
        if (a.parent().attr('data-value')) {
            for (var i = 0; i < items.length; i++) {
              if (items[i].value.toString() === a.parent().attr('data-value') && items[i].label.toString() === a.parent().attr('data-label')) {
                ret = items[i];
                break;
              }
            }
          }
        else
          ret = {value: ret, label: ret};

          self.setValue(ret, false);

          e.preventDefault();
          return false;
        });

        var all = self.list.find('a').on('keydown.popupmenu', function (e) {
          if (e.keyCode === 9) {
            e.preventDefault();
            self.setSelectedElement($(this), items, true, e.shiftKey);
          }
        }).on('focus', function (e) {
          var ret = $(this).text();
          all.parent('li').removeClass('is-selected');
          self.setSelectedElement($(this), items, false);
        });

        this.noSelect = true;
        allowUpdate = false;
        this.element.focus();

        $(document).on('click.popupmenu', function (e) {
          if ($(e.target).closest('.autocomplete .popupmenu').length === 0 && settings.selectionRequired && self.element.hasClass('is-open')) {
            self.getSourceData(self.element.val(), items, self.updateValue, { fireTabEvent: false });
          }
        });
      },

      setSelectedElement: function (e, items, tabKey, shiftTab) {
        var self = this;
        var ret = { value: e.text(), label: e.text() };
        if (allowUpdate) {
          e.parent('li').addClass('is-selected');

        if (e.parent('li').attr('data-value'))
          ret = { value: e.parent('li').attr('data-value'), label: e.parent('li').attr('data-label') };

          self.setValue(ret, tabKey, shiftTab, !tabKey);
        }
    },

    setPosition: function(e) {
        var wrapper = this.list.parent('.popupmenu-wrapper');
    var wrapperTop = this.element.offset().top + this.element.outerHeight();
    var bottomSpace = window.innerHeight - wrapperTop - 27; // leave some space at bottom
    var topSpace = this.element.offset().top;
    var maxHeight = bottomSpace;
    if(bottomSpace < 50){
      maxHeight = topSpace;
      if(this.list.outerHeight() > topSpace)
        wrapperTop = 0;
      else
        wrapperTop = topSpace - this.list.outerHeight();
    }
    wrapper.css({ 'max-height': maxHeight, 'overflow-y': 'auto', 'top':wrapperTop});
      },

      setValue: function (selectedItem, tabEvent, shiftTab, ignoreCellChange) {
        var self = this;
        self.element.val(settings.inputMask.replace('{{{value}}}', selectedItem.value).replace('{{{label}}}', selectedItem.label))
            .attr('data-value', selectedItem.value)
            .trigger('selected', { selectedItem: selectedItem, fireTabEvent: tabEvent, shiftTab: shiftTab, ignoreCellChange: ignoreCellChange });
        isChanged = false;
      },

      updateValue: function (term, items, args) {
        var self = this;
        var optionLabel = '';
        var optionValue = '';
        for (var i = 0; i < items.length; i++) {
          optionLabel = (typeof items[i] === 'string' ? items[i] : items[i].label);
          if (optionLabel.toLowerCase().indexOf(term.toLowerCase()) > -1) {
            optionValue = (typeof items[i] === 'string' ? items[i] : items[i].value);
            break;
          }
          optionLabel = '';
        }
        self.setValue({ value: optionValue, label: optionLabel }, args.fireTabEvent, args.direction);
      },

      getSourceData: function (inputVal, source, exeFunction, args) {
        var self = this;
        if (typeof source === 'function') {
          var response = function (data) {
            $("body").inforBusyIndicator("close");
            exeFunction.call(self, inputVal, data, args);
          };
          $("body").inforBusyIndicator({ modal: true });
          settings.source(inputVal, response, self.element[0]);
        }
        else
          exeFunction.call(self, inputVal, source, args);
      },

      handleEvents: function () {
        var buffer = '', timer, self = this;
        var ctrlV = false;
        this.element.on('keydown.autocomplete', function (e) {
          if (e.ctrlKey && e.keyCode === 86)
            ctrlV = true; // this handle pressing Ctrl + V very fast
          if (e.keyCode === 40) {
            if (self.element.hasClass('is-open')) {
              e.preventDefault(); //this prevent from scrolling. popupmenu will close if page scrolls
              var itemsList = self.list.find('a');
              allowUpdate = true;
              e.stopPropagation();
              if (itemsList.length > 0)
                itemsList.first().focus();
            }
          }

          if ((e.keyCode === 8 || e.keyCode === 46) && $(this).val() !== ''){
              isChanged = true;
          }

          if (e.keyCode === 9) {
            clearTimeout(timer);
            if(isChanged){
              var curVal = $(this).val();

              if (!settings.selectionRequired || (curVal == '' && !self.element.hasClass('is-open'))) {
                self.setValue({ value: curVal, label: curVal }, false);
              }
              else{
                if (typeof settings.source === 'function') {
                  self.getSourceData(curVal, settings.source, self.updateValue, { fireTabEvent: true, direction: e.shiftKey });
                  e.stopPropagation();
                }
                else
                  self.getSourceData(curVal, settings.source, self.updateValue, { fireTabEvent: false, direction: e.shiftKey });
              }
            }

            if (self.element.hasClass('is-open')) {
              self.element.trigger('close');
            }
          }
        }).on('keypress.autocomplete', function (e) {
          var field = $(this);

          //This checks all printable characters
          if (e.which === 0 || e.charCode === 0 || e.ctrlKey || e.metaKey || e.altKey) {
            return;
          }
          isChanged = true;

          clearTimeout(timer);
          timer = setTimeout(function () {
            buffer = field.val();
            if (buffer === '') {
              return;
            }
            self.getSourceData(buffer, settings.source, self.openList);
          }, 500);  //no pref for this lets keep it simple.

        }).on('keyup.autocomplete', function (e) {
          //open list
          if ( ctrlV || (e.ctrlKey && e.keyCode === 86) || (e.altKey && e.keyCode === 40) || ((e.keyCode === 8 || e.keyCode === 46) && $(this).val() !== "")) {
            ctrlV = false;
            isChanged = true;
            allowUpdate = true;
            buffer = $(this).val();
            self.getSourceData(buffer, settings.source, self.openList);
            return;
          }
      else if((e.keyCode === 8 || e.keyCode === 46) && $(this).val() === "") // close list if open
      {
        if (self.element.hasClass('is-open')) {
        self.element.trigger('close');
        self.element.data('popupmenu').close();
            }
      }

        }).on('focus.autocomplete', function () {
          if (self.noSelect) {
            self.noSelect = false;
            return;
          }
          self.element.select();
        });
      },

      destroy: function () {
        $.removeData(this.element[0], pluginName);
        this.element.off('keypress.autocomplete focus.autocomplete');
      }
    };

    // Initialize Once
    return this.each(function () {
      var instance = $.data(this, pluginName);
      if (!instance) {
        instance = $.data(this, pluginName, new Plugin(this, settings));
      }
    });
  };

}));
