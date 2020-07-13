/**
* Autocomplete for inputs and searches
* @name autocomplete
*/
(function (factory) {
  if (typeof define === 'function' && define.amd) {
      // AMD. Register as an anonymous module depending on jQuery.
      define('autocomplete', ['jquery'], factory);
  } else {
      // No AMD. Register plugin with global jQuery object.
      factory(jQuery);
  }
}(function ($) {

  $.fn.autocomplete = function(options) {

    // Settings and Options
    var pluginName = 'autocomplete',
      defaults = {
        source: ['Alabama', 'Alaska', 'California', 'Delaware'], //Defines the data to use, must be specified.
        selectionRequired: false,
        selectLabel: true // selectionRequired must be true when selectLabel: true
      },
      settings = $.extend({}, defaults, options);
    var allowUpdate = false;

    // Plugin Constructor
    function Plugin(element) {
      //TODO: Idea is that data-autocomplete can be a url, 'source' or an array
      this.element = $(element);
      this.init();
    }

    // Plugin Object
    Plugin.prototype = {
      init: function() {
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
        var self = this;

        term = term.toLowerCase();

        //append the list
        this.list = $('#autocomplete-list');
        if (this.list.length === 0) {
          this.list = $('<ul id="autocomplete-list" aria-expanded="true"></ul>').appendTo('body');
        }

        this.list.css({'height': 'auto', 'width': this.element.outerWidth()}).addClass('autocomplete');
        this.list.empty();

        for (var i = 0; i < items.length; i++) {
          var option = (typeof items[i] === 'string' ? items[i] : items[i].label);

          if (option.toLowerCase().indexOf(term) > -1) {
            //Highlight Term
            var exp = new RegExp('(' + term + ')', 'gi') ;
            option = option.replace(exp, '<i>$1</i>');
            var listOption = $('<li id="ac-list-option'+ i +'" role="option" role="listitem" ><a href="#" tabindex="-1">' + option + '</a></li>');
            if (typeof items[i] !== 'string') {
              listOption.attr('data-value', items[i].value);
            }
            self.list.append(listOption);
          }
        }

        this.element.addClass('is-open')
          .popupmenu({menuId: 'autocomplete-list', trigger: 'immediate', autoFocus: false})
          .on('close.autocomplete', function () {
            self.list.parent('.popupmenu-wrapper').remove();
            self.element.removeClass('is-open');
          });

        self.list.off('click.autocomplete').on('click.autocomplete', 'a', function (e) {
          var a = $(e.currentTarget),
            ret = a.text();

          var dataValue = a.parent().attr('data-value');
          self.element.val(a.text())
              .attr('aria-activedescendant', a.parent().attr('id'))
              .attr('data-value', dataValue)
              .trigger('selected', { data: { value: dataValue, label: a.text() }, fireTabEvent: false });

          e.preventDefault();
          return false;
        });

        var all = self.list.find('a').on('focus', function () {
          var anchor = $(this);
          all.parent('li').removeClass('is-selected');
          if (allowUpdate) {
            var dataValue = anchor.parent('li').attr('data-value');
            anchor.parent('li').addClass('is-selected');
            self.element.val(anchor.text())
                .attr('data-value', dataValue)
                .trigger('selected', { data: { value: dataValue, label: anchor.text() }, fireTabEvent: false });
          }
        });

        this.noSelect = true;
        allowUpdate = false;
        this.element.focus();
      },

      updateValue: function (term, items, fireTabEvent, direction) {
        var self = this;
        var isUpdated = false;
        for (var i = 0; i < items.length; i++) {
          var optionLabel = (typeof items[i] === 'string' ? items[i] : items[i].label);
          var optionValue = (typeof items[i] === 'string' ? items[i] : items[i].value);

          if (optionLabel.toLowerCase().indexOf(term) > -1) {
            self.element.val(optionLabel)
                .attr('data-value', optionValue)
                .trigger('selected', { data: { value: optionValue, label: optionLabel }, fireTabEvent: fireTabEvent, direction: direction });

            isUpdated = true;
            break;
          }
        }
        if (!isUpdated)
          self.element.val('').trigger('selected', { data: { value: '', label: '' }, fireTabEvent: fireTabEvent, direction: direction });
      },

      handleEvents: function () {
        //similar code as dropdown but close enough to be dry
        var buffer = '', timer, self = this;

        this.element.on('keyup.autocomplete', function (e) {
          //open list
          if ((e.altKey && e.keyCode === 40) || (e.keyCode === 8 && $(this).val() !== "")) {
            allowUpdate = true;
            buffer = $(this).val();
            if (typeof settings.source === 'function') {
              var response = function (data) {
                $("body").inforBusyIndicator("close");
                self.openList(buffer, data);
              };

              $("body").inforBusyIndicator({ modal: true });
              settings.source(buffer, response);

            } else {
              self.openList(buffer, settings.source);
            }
            return;
          }

        }).on('keydown.autocomplete', function (e) {
          if (e.keyCode === 40) {
            if (self.element.hasClass('is-open')) {
              var itemsList = self.list.find('a');
              allowUpdate = true;
              e.stopPropagation();
              if (itemsList.length > 0)
                itemsList.first().focus();
            }
          }

          if (e.keyCode === 9) {
            clearTimeout(timer);
            var curVal = $(this).val().toLowerCase();
            var dataValue;

            if (!settings.selectionRequired || curVal === "") {
              self.element.attr('data-value', curVal)
                  .trigger('selected', { data: { value: curVal, label: curVal }, fireTabEvent: false });
            }
            else if (settings.selectionRequired) {
              var items;

              if (typeof settings.source === 'function') {
                var response = function (data) {
                  $("body").inforBusyIndicator("close");
                  self.updateValue(curVal, data, true, e.shiftKey);
                };
                $("body").inforBusyIndicator({ modal: true });
                settings.source(curVal, response);
                e.stopPropagation();
              }
              else
                self.updateValue(curVal, settings.source, false);
            }
            if (self.element.hasClass('is-open')) {
              self.list.parent('.popupmenu-wrapper').remove();
              self.element.removeClass('is-open');
            }
          }
        }).on('keypress.autocomplete', function (e) {
          var field = $(this);

          clearTimeout(timer);
          timer = setTimeout(function () {

            buffer = field.val();
            if (buffer === '') {
              return;
            }
            buffer = buffer.toLowerCase();

            //This checks all printable characters
            if (e.which === 0 || e.charCode === 0 || e.ctrlKey || e.metaKey || e.altKey) {
              return;
            }

            if (typeof settings.source === 'function') {
              var response = function(data) {
                $("body").inforBusyIndicator("close");
                self.openList(buffer, data);
              };
              $("body").inforBusyIndicator({ modal: true });
              settings.source(buffer, response);

            } else {
              self.openList(buffer, settings.source);
            }

          }, 500);  //no pref for this lets keep it simple.

        }).on('focus.autocomplete', function () {
          if (self.noSelect) {
            self.noSelect = false;
            return;
          }

          self.element.select();
        });
      },

      destroy: function() {
        $.removeData(this.element[0], pluginName);
        this.element.off('keypress.autocomplete focus.autocomplete');
      }
    };

    // Initialize Once
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        instance = $.data(this, pluginName, new Plugin(this, settings));
      }
    });
  };

}));
