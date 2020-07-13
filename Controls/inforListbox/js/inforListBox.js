/*
* Infor ListBox Plugin. Credits to
*  jQuery selectBox (version 1.0.7): https://github.com/claviska/jquery-selectBox
*/
(function ($) {
  $.widget("ui.inforListBox", {
    options: {
      showCheckboxes: false
    },
    _init: function () {
      var self = this,
        select = $(this.element),
        control, options, size, optionHeight, padding;

      // Disable for iOS devices (their native controls are more suitable for a touch device)
      if (navigator.userAgent.match(/iPad|iPhone|Android/i)) {
        return false;
      }

      //already initialized..
      if (select.data('selectBoxControl') || !select.is("select")) {
        return false;
      }

      control = $('<div/>');
      // Inherit class names, style, and title attributes
      // Generate control
      options = self.getOptions();
      control.addClass(select.attr('class'))
        .addClass('inforListBox')
        .append(options)
        .data('inforListBoxOption', options)
        .attr('style', select.attr('style') || '')
        .attr('title', select.attr('title') || '')
        .attr('tabindex', '0')
        .css('display', 'inline-block')
        .on('focus.inforListBox', function () {
          control.addClass('focus');
          select.trigger('focus');
        })
        .on('blur.inforListBox', function () {
          control.removeClass('focus');
          select.trigger('blur');
        })
        .on('keypress.inforListBox', function (event) {
          self._handleKeyPress(event);
        })
        .on('keydown.inforListBox', function (event) {
          self._handleKeyDown(event);
        }).bind('mousedown.inforListBox', function () {
          control.addClass("focus").focus();
        })
        .insertAfter(select);

      if (self.options.showCheckboxes) {
        control.addClass("showCheckboxes");
      }

      if (select.attr('disabled')) {
        control.addClass('inforListBoxDisabled');
      }

      // Auto-height based on size attribute
      if (!select[0].style.height) {
        size = select.attr('size') ? parseInt(select.attr('size'), 10) : 7;
        optionHeight = (this.options.showCheckboxes ? 20 : 18);
        padding = 10; //top and bottom padding

        control.height((optionHeight * size) + padding);
      }

      this._disableSelection(control);

      // Store data for later use and show the control
      select.addClass('selectBox')
        .data('selectBoxControl', control)
        .hide();

      if (select.attr("disabled")) {
        control.attr("disabled", "");
      }

    },
    getOptions: function () {
      var options = $('<ul class="inforListBoxOption" />'),
        select = $(this.element),
        hasOptGroups = select.find('OPTGROUP').length,
        self = this, text;

      if (hasOptGroups) {
        select.find('OPTGROUP').each(function () {
          var optgroup = $('<li class="inforListBoxOptGroup" />'),
            checkbox;

          optgroup.text($(this).attr('label'));
          options.append(optgroup);

          $(this).find('OPTION').each(function () {
            var li = $('<li />'),
              a = $('<a />'),
              $this = $(this);
            li.addClass($this.attr('class'));

            text = $this.html();
            if (text === "" || text === undefined) {  //ignore jslint
              text = '\xa0';
            }
            a.attr('rel', $this.val()).html(text).appendTo(li);

            if ($this.attr("title")) {
              a.attr("title", $this.attr("title")).inforToolTip();
            }

            options.append(li);

            if (self.options.showCheckboxes) {
              checkbox = $('<input type="checkbox" tabindex="-1" class="inforCheckbox noTrackDirty" />');
              a.prepend(checkbox);
              checkbox.bind("click", function () {
                self.isCheckClick = true;
              });
            }

            if ($this.attr('disabled')) {
              li.addClass('inforListBoxDisabled');
            }

            if ($this.prop('selected')) {
              li.addClass('isSelected');
              li.find("input.inforCheckbox").prop('checked', true);
            }
          });

        });

      } else {

        select.find('OPTION').each(function () {
          var li = $('<li />'),
            a = $('<a />'),
            $this = $(this);

          li.addClass($this.attr('class'));
          var text = $this.html();
          if (!text) {
            text = '\xa0';
          }

          a.attr('rel', $this.val()).html(text);
          if ($this.attr("title")) {
            a.attr("title", $this.attr("title")).inforToolTip();
          }

          li.append(a);
          if (self.options.showCheckboxes) {
            var checkbox = $('<input type="checkbox" tabindex="-1" class="inforCheckbox noTrackDirty" /><label style="font-size:12px;" class="inforCheckboxLabel">' + '&nbsp;' + '</label>');
            a.prepend(checkbox);
            checkbox.bind("click", function () {
              self.isCheckClick = true;
            });
          }
          if ($this.attr('disabled')) {
            li.addClass('inforListBoxDisabled');
          }
          if ($this.prop('selected')) {
            li.addClass('isSelected');
            li.find("input.inforCheckbox").prop('checked', true);
          }
          options.append(li);
        });

      }

      options.find('A')
      .bind('click.selectBox', function (event) {
        self._selectOption($(this).parent(), event);
      });

      this._disableSelection(options);
      return options;
    },
    isCheckClick: false,
    _selectOption: function (li, event) {
      var select = $(this.element),
        control = select.data('selectBoxControl');

      if (control.hasClass('inforListBoxDisabled')) {
        return false;
      }

      if (li.length === 0 || li.hasClass('inforListBoxDisabled')) {
        return false;
      }


      // If event.shiftKey is true, this will select all options between li and the last li selected
      if ((event.shiftKey) && control.data('selectBox-last-selected')) {
        li.toggleClass('isSelected');

        var affectedOptions;
        if (li.index() > control.data('selectBox-last-selected').index()) {
          affectedOptions = li.siblings().slice(control.data('selectBox-last-selected').index(), li.index());
        } else {
          affectedOptions = li.siblings().slice(li.index(), control.data('selectBox-last-selected').index());
        }

        affectedOptions = affectedOptions.not('.inforListBoxOptGroup, .inforListBoxDisabled');

        if (li.hasClass('isSelected')) {
          affectedOptions.addClass('isSelected');
        } else {
          affectedOptions.removeClass('isSelected');
        }
      } else if (event.ctrlKey || event.metaKey || this.isCheckClick) {
        li.toggleClass('isSelected');
        this.isCheckClick = false;
      } else {
        li.siblings().removeClass('isSelected');
        li.addClass('isSelected');
      }

      if (control.hasClass('selectBox-dropdown')) {
        control.find('.selectBox-label').text(li.text());
      }

      li.siblings().each(function () {
        var $li = $(this);
        if ($li.hasClass('isSelected')) {
          $li.find("input.inforCheckbox").prop('checked', true);
        } else {
          $li.find("input.inforCheckbox").prop('checked', false);
        }
      });

      if (li.hasClass('isSelected')) {
        li.find("input.inforCheckbox").prop('checked', true);
      } else {
        li.find("input.inforCheckbox").prop('checked', false);
      }

      // Update original control's value
      var i = 0,
        selection = [];

      select.find("option").removeProp("selected");

      control.find('.isSelected A').each(function () {
        selection[i++] = $(this).attr('rel');
        select.find("option[value='"+ $(this).attr('rel') +"']").prop("selected", true);
      });

      // Remember most recently selected item
      control.data('selectBox-last-selected', li);
      select.trigger('change');
    },
    _disableSelection: function (selector) {
      $(selector)
        .css('MozUserSelect', 'none')
        .bind('selectstart', function (event) {
          event.preventDefault();
        });
    },
    typeTimer: null,
    typeSearch: '',
    _handleKeyPress: function (event) {
      var select = $(this.element),
        control = select.data('selectBoxControl'),
        options = control.data('inforListBoxOption'),
        self = this;

      if (control.hasClass('inforListBoxDisabled')) {
        return;
      }
      switch (event.keyCode) {
        case 9:
          // tab
        case 27:
          // esc
        case 13:
          // enter
        case 37:
          // left
        case 39:
          // right
          // Don't interfere with the keydown event!
          break;
        default:
          // Type to find
          event.preventDefault();

          clearTimeout(self.typeTimer);
          self.typeSearch += String.fromCharCode(event.charCode || event.keyCode);

          options.find('A').each(function () {
            if ($(this).text().substr(0, self.typeSearch.length).toLowerCase() === self.typeSearch.toLowerCase()) {
              self._selectOption($(this).parent(), event);
              self._scrollTo($(this).parent());
              return false;
            }
          });
          // Clear after a brief pause
          self.typeTimer = setTimeout(function () {
            self.typeSearch = '';
          }, 1000);
          break;
      }
    },
    _scrollTo: function (li) {
      if (!li || li.length === 0) {
        return;
      }

      var select = $(this.element),
        scrollBox = select.data('selectBox-control'),
        top = parseInt(li.offset().top - scrollBox.position().top, 10),
        bottom = parseInt(top + li.outerHeight(), 10);

      if (top < 0) {
        scrollBox.scrollTop(li.offset().top - scrollBox.offset().top + scrollBox.scrollTop());
      }
      if (bottom > scrollBox.height()) {
        scrollBox.scrollTop((li.offset().top + li.outerHeight()) - scrollBox.offset().top + scrollBox.scrollTop() - scrollBox.height());
      }
    },
    _handleKeyDown: function (event) {
      var select = $(this.element),
        control = select.data('selectBoxControl'),
        self = this;

      if (control.hasClass('inforListBoxDisabled')) {
        return;
      }

      switch (event.keyCode) {
        case 8:
          // backspace
          event.preventDefault();
          self.typeSearch = '';
          break;
        case 27:
          // esc
          break;
        case 40:
          // down
          var next = control.find(".isSelected:last").nextAll(":not(.inforListBoxDisabled)").first();
          this._scrollTo(next);
          this._selectOption(next, event);
          event.preventDefault();
          break;
        case 38:
          // up
          var prev = control.find(".isSelected:first").prevAll(":not(.inforListBoxDisabled)").first();
          this._scrollTo(prev);
          this._selectOption(prev, event);
          event.preventDefault();
          break;
      }
    },
    setOptions: function () {
      var $select = $(this.element),
        control = $select.data('selectBoxControl');

      if (!control) {
        return;
      }

      // Remove old options
      control.data('inforListBoxOption').remove();

      // Generate new options
      var options = this.getOptions($select);
      control.data('inforListBoxOption', options);
      control.append(options);
    },
    refresh: function () {
      this.setOptions($(this.element).html());
    },
    clear: function () {
      var $select = $(this.element);

      $select.children().remove();
      this.refresh();
    },
    clearSelected: function () {
      var $select = $(this.element), control,
        options, i;

      control = $select.data('selectBoxControl');
      options = control.data('inforListBoxOption');

      options.find('A').each(function () {
        var $li = $(this).parent();
        $li.removeClass('isSelected');
      });

      $select.find("option").removeProp("selected");
      this.refresh();
    },
    add: function (data, suppressRefresh) {
      var $select = $(this.element),
        option = $('<option value="' + data.optionValue + '">' + data.optionText + '</option>');

      if (data.optionId) {
        option.attr("id", data.optionId);
      }
      if (data.selected) {
        option.prop("selected", true);
      }
      if (data.optionTitle) {
        option.attr("title", data.optionTitle);
      }
      $select.append(option);

      if (suppressRefresh) {
        return;
      }
      this.refresh();
    },
    rename: function (data) {
      var $select = $(this.element),
        option = $select.find('option[value="' + data.optionValue + '"]');

      option.html(data.optionText);
      if (data.optionTitle) {
        option.attr("title", data.optionTitle);
      }
      this.refresh();
    },
    remove: function (data) {
      var $select = $(this.element);

      $select.find('option[value="' + data.optionValue + '"]').remove();
      this.refresh();
    },
    removeSelected: function () {
      var $select = $(this.element),
        selectedOptions = $select.children('option:selected');

      selectedOptions.remove();
      this.refresh();
    },
    moveSelectedUp: function () {
      var $select = $(this.element),
        $selectedOptions = $select.children('option:selected'),
        prev = $selectedOptions.first().prev();

      $selectedOptions.insertBefore(prev);
      this.refresh();
    },
    moveSelectedDown: function () {
      var $select = $(this.element),
        $selectedOptions = $select.children('option:selected'),
        next = $selectedOptions.last().next();

      $selectedOptions.insertAfter(next);
      this.refresh();
    },
    value: function (value) {
      var $select = $(this.element),
        li, control,
        options, i;

      control = $select.data('selectBoxControl');
      options = control.data('inforListBoxOption');
      li = options.find( "[rel='"+ value + "']" ).parent();
      if ($select.is("[multiple]"))
        this.isCheckClick = true;
      this._selectOption(li, $.Event('click'));

    },
    destroy: function () {
      var select = $(this.element),
        control = select.data('selectBoxControl'),
        options;

      if (!control) {
        return;
      }
      options = control.data('inforListBoxOption');

      options.remove();
      control.remove();
      select.removeClass('selectBox')
        .removeData('selectBoxControl')
        .removeData('selectBoxSettings')
        .show();
    }
  });
}(jQuery));
