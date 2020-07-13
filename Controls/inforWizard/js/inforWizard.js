/*
* Infor Wizard Control
*/
(function ($) {
  $.widget('ui.inforWizard', {
    options: {
      startPage: 0, //Page to start on
      sequential: false, //should the tabs be disabled and disclosed while progressing
      showTitleBar: true, //should we show the title bar?
      onPageLoad: null, //fires each time a page load is complete
      animate: true,  //animate page transitions
      onShowPage: null, //call back which you can cancel
      buttons: [{
        text: 'Finish',
        click: function () {
          var finish = $(this).data('uiInforWizard').options.onFinish;
          if (finish) {
            finish();
          }
        },
        isDefault: true,
        isFinish: true
      }, {
        text: 'Next',
        click: function (e) {
          var wiz = $(this),
            current = wiz.inforWizard().data('uiInforWizard').currentPage;

          wiz.inforWizard('showPage', current + 1, e);
        },
        isDefault: true,
        isNext: true
      }, {
        text: 'Previous',
        click: function (e) {
          var wiz = $(this),
            current = wiz.inforWizard().data('uiInforWizard').currentPage;

          wiz.inforWizard('showPage', current - 1, e);
        },
        isPrevious: true
      }], //the array of buttons similar to inforMessageDialog
      onFinish: null //Function that fires when the finish button is pressed.
    },
    attrFn: {
      val: true,
      css: true,
      html: true,
      text: true,
      data: true,
      width: true,
      height: true,
      offset: true,
      click: true
    },
    _create: function () {
      var self = this,
        elem = $(this.element),
        otherButtons = null,
        container = $('<div class="inforWizardContainer">');

      elem.wrap(container);
      container = elem.parent();
      if (this.options.showTitleBar) {
        container.prepend('<div class="inforWizardTitleBar"><span class="inforWizardTitle">' + elem.attr('data-title') + '</span></div>');
      }
      self.refresh();

      if (self.options.startPage != 0) {

        buttons = elem.prev().find('.inforWizardButton').eq(self.options.startPage-1);
        buttons.addClass('beforeActive');
        self.currentPage = self.options.startPage;
        self.showPage(self.options.startPage);
      }
    },
    currentPage: 0,
    showPage: function (page, event) {
      var elem = $(this.element),
        self = this,
        okToShow = true,
        activeLi = elem.find('li.inforWizardPage').eq(this.currentPage),
        nextLi = elem.find('li.inforWizardPage').eq(page),
        otherButtons;

      if (self.options.onShowPage) {
        okToShow = self.options.onShowPage(event, activeLi, nextLi);
        if (okToShow === false) {
          return;
        }
      }

      $('#inforTooltip').hide();

      if (parseInt(page, 10) === parseInt(this.currentPage, 10)) {
        return;
      }
      this.currentPage = parseInt(page, 10);

      if (self.options.animate) {

        activeLi.hide('slide', {
          direction: (page > this.currentPage ? 'left' : 'right'),
          easing: 'easeOutQuad',
          duration: 300,
          queue: false
        });

        nextLi.hide().css('opacity', 1).show('slide', {
          direction: (page > this.currentPage ? 'right' : 'left'),
          easing: 'easeOutQuad',
          duration: 300,
          queue: false
        });

      } else {
        activeLi.hide();
        nextLi.show();
      }

      if (self.options.onPageLoad) {
        self.options.onPageLoad(page, nextLi);
      }

      this._showButtons(nextLi);

      otherButtons = elem.prev().find('.inforWizardButton');
      otherButtons.removeClass('active beforeActive');
      otherButtons.each(function () {
        var button = $(this);
        if (button.attr('data-list-element') === self.currentPage.toString()) {
          button.addClass('active exposed');
          button.prev().addClass('beforeActive');
        }
      });

      self._refreshButtons();
    },
    _showButtons: function (panel) {
      var parent = panel.closest('.inforWizard'),
        self = this,
        buttons = this.options.buttons,
        uiButtonBar = parent.find('.inforWizardBottomButtonBar');

      if (uiButtonBar.length === 0) {
        uiButtonBar = $('<div class="inforWizardBottomButtonBar"></div').appendTo(parent);
      }

      uiButtonBar.empty();

      $.each(buttons, function (name, props) {
        props = $.isFunction(props) ? {
          click: props,
          text: name
        } : props;
        var button = $('<button type="button" class="inforFormButton"></button>')
          .click(function () {
            props.click.apply(self.element[0], arguments);
          })
          .appendTo(uiButtonBar);
        $.each(props, function (key, value) {
          if (key === 'click') {
            return;
          }
          if (key === 'text') {
            button.html(Globalize.localize(value) || value);
            return;
          }
          if (key === 'isDefault' && value === true) {
            button.addClass('default');
          }
          if (key === 'isNext' && value === true) {
            button.addClass('next').html('<div class="arrowRight">' + button.html() + '</div>');
            return;
          }
          if (key === 'isPrevious' && value === true) {
            button.addClass('previous').html('<div class="arrowLeft">' + button.html() + '</div>');
            return;
          }
          if (key === 'isFinish' && value === true) {
            button.addClass('finish');
            return;
          }
          if (key in self.attrFn) {
            button[key](value);
          } else {
            button.attr(key, value);
          }
        });
        if ($.fn.button) {
          button.button();
        }
      });
    },
    refresh: function () {
      //scan the ul and hide all but the current page
      var self = this,
        elem = $(this.element),
        listElem = null,
        buttonBar = $('<div class="inforWizardButtonBar"></div>'),
        isActive = false;

      if (elem.prev().is('.inforWizardButtonBar')) {
        elem.prev().remove();
      }

      elem.before(buttonBar);

      elem.find('.inforWizardPage').each(function (index) {
        isActive = (index === self.options.startPage);
        listElem = $(this);

        if (isActive) {
          listElem.addClass('active');
          self._showButtons(listElem);
          if (self.options.onPageLoad) {
            self.options.onPageLoad(index, listElem);
          }
        } else {
          listElem.hide();
        }

        var button = $('<button type="button" class="inforWizardButton"></button>')
          .click(function (e) {
            var button = $(this);
            if (button.hasClass('disabled')) {
              return;
            }
            self.showPage(button.attr('data-list-element'), e);
          })
          .html('<span>' + listElem.attr('data-title') + '</span>')
          .attr('data-list-element', index)
          .addClass(isActive ? 'active' : '');

        buttonBar.append(button);
      });
      self._refreshButtons();

      $(window).on('throttledresize.inforWizard', function () {
        self._refreshButtons();
      });
    },
    _refreshButtons: function () {
      var self = this,
        elem = $(this.element),
        buttons = $(this.element).prev().find('.inforWizardButton'),
        perc = (100/buttons.length),
        activeIndex = buttons.filter('.active').index();

      if (!self.options.sequential) {
        return;
      }
      buttons.each(function (index) {
        var btn = $(this);
        if (index <= activeIndex + 1) {
          btn.removeClass('disabled');
        } else {
          btn.addClass('disabled');
        }
        btn.css('width', perc + '%');
      });

      buttons.filter('.exposed').add(buttons.filter('.exposed').last().next()).removeClass('disabled');
      buttons.filter('.beforeDisabled').removeClass('beforeDisabled');
      buttons.filter('.disabled:first').prev().addClass('beforeDisabled');

      //refresh the prev/next/finish
      if (activeIndex === 0) {
        elem.find('.inforWizardBottomButtonBar .previous').hide();
      }

      if (buttons.length - 1 === activeIndex) {
        elem.find('.inforWizardBottomButtonBar .next').hide();
        elem.find('.inforWizardBottomButtonBar .finish').show();
      } else {
        elem.find('.inforWizardBottomButtonBar .next').show();
        elem.find('.inforWizardBottomButtonBar .finish').hide();
      }
    }
  });
})(jQuery);
