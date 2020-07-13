/*
* Infor Swap List
*/
(function ($) {
  $.widget('ui.inforSwapList', {
    options: {
      sortable: true,
      availableItemText: Globalize.localize('Available'), //Translated text for the top headers
      selectedItemText: Globalize.localize('Selected'),
      available: [],
      selected: []
    },
    _init: function () {
      var elem = $(this.element),
        self = this,
        i, leftLabel, rightLabel;

      //Append Structure
      self.leftList = $('<select multiple="multiple" size="5" class="inforListBox" ></select>').uniqueId();
      leftLabel = $('<label class="inforLabel noColon">' + self.options.availableItemText + '</label>').attr('for', self.leftList.attr('id'));
      elem.append($('<div class="inforSwapListLeft"></div>').append(leftLabel, self.leftList));

      self.rightList = $('<select multiple="multiple" size="5" class="inforListBox"></select>').uniqueId();
      rightLabel = $('<label class="inforLabel noColon">' + self.options.selectedItemText + '</label>').attr('for', self.rightList.attr('id'));
      elem.append($('<div class="inforSwapListRight"></div>').append(rightLabel, self.rightList));

      //Add buttons functionality
      self.moveLeft = $('<button type="button" class="inforIconButton moveLeft" disabled><span></span></button>');
      self.moveRight = $('<button type="button" class="inforIconButton moveRight" disabled><span></span></button>');
      elem.find('.inforSwapListLeft').after($('<div class="inforSwapListButtons"></div>').append(self.moveLeft, self.moveRight));

      //Init list Boxes.
      elem.find('.inforListBox').inforListBox({showCheckboxes:false});

      //Clear inline css from listbox control
      elem.find('div.inforListBox:first').css({'height': '', 'width': '', 'display': 'inline-block'});
      elem.find('div.inforListBox:last').css({'height': '', 'width': '', 'display': 'inline-block'});

      //Set Items
      for (i=0; i < self.options.available.length; i++) {
        self.leftList.inforListBox('add', {optionValue: self.options.available[i].value, optionText: self.options.available[i].label});
      }

      for (i=0; i < self.options.selected.length; i++) {
        self.rightList.inforListBox('add', {optionValue: self.options.selected[i].value, optionText: self.options.selected[i].label});
      }

      //Make Drag droppable
      if (self.options.sortable) {
        //append drag handles.
        if (elem.find('.inforListBoxOption .dragHandle').length === 0) {
          elem.find('.inforListBoxOption a').prepend('<span class="dragHandle"></span>');
        }
        elem.find('.inforListBoxOption').addClass('isLinked').sortable({handle: '.dragHandle', placeholder: 'inforSortPlaceHolder', connectWith: '.isLinked' });
      }

      //Add Events
      self.leftList.on('change click', function () {
        self.refreshButtons();
      });

      self.rightList.on('change click', function(){
        self.refreshButtons();
      });

      self.leftList.next().on('dblclick', 'a', function() {
        var elem = $(this).closest('.inforListBox');
        if (elem.hasClass('disabled')) {
          return;
        }
        self.rightList.next().find('ul').append(self.leftList.next().find('.isSelected'));
        self.element.trigger('selected', {selectedItems: self.getSelectedItems()});
        self.refreshButtons();
      });

      self.rightList.next().on('dblclick', 'a', function() {
        var elem = $(this).closest('.inforListBox');
        if (elem.hasClass('disabled')) {
          return;
        }
        self.leftList.next().find('ul').append(self.rightList.next().find('.isSelected'));
        self.element.trigger('selected', {selectedItems: self.getSelectedItems()});
        self.refreshButtons();
      });

      self.moveLeft.on('click', function() {
        var elem = $(this).closest('.inforListBox');
        if (elem.hasClass('disabled')) {
          return;
        }
        self.rightList.next().find('ul').append(self.leftList.next().find('.isSelected'));
        self.element.trigger('selected', {selectedItems: self.getSelectedItems()});
        self.refreshButtons();
      });
      self.moveRight.on('click', function() {
        var elem = $(this).closest('.inforListBox');
        if (elem.hasClass('disabled')) {
          return;
        }
        self.leftList.next().find('ul').append(self.rightList.next().find('.isSelected'));
        self.element.trigger('selected', {selectedItems: self.getSelectedItems()});
        self.refreshButtons();
      });

    },
    getSelectedItems: function () {
      var ul = this.rightList.next().find('ul'),
        self = this;

      this.selectedItems = [];

      ul.find('a').each(function () {
        self.selectedItems.push($(this).attr('rel'));
      });
      return this.selectedItems;
    },
    getAvailableItems: function () {
      var ul = this.leftList.next().find('ul'),
        self = this;

      this.availableItems = [];

      ul.find('a').each(function () {
        self.availableItems.push($(this).attr('rel'));
      });
      return this.availableItems;
    },
    refreshButtons: function() {
      var self = this;
      if (this.element.hasClass('disabled')) {
        return;
      }

      if (self.leftList.next().find('.isSelected').length) {
        self.moveLeft.enable();
      } else {
        self.moveLeft.disable();
      }
      if (self.rightList.next().find('.isSelected').length) {
        self.moveRight.enable();
      } else {
        self.moveRight.disable();
      }
    }
  });
}($));
