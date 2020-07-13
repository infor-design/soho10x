/*
* Infor Calculator Field - Creates a Popup Calculator Input Field
*/
(function ($) {
  $.widget('ui.inforCalculatorField', {
    _init: function () {
      var self = this,
        $input = $(this.element);

      //add trigger button styling
      $input.numericOnly(true).data('isInitialized', true).inforTriggerField({
        click: function (e) {
          self._openPopup($input, e);
        }
      });
    },
    expression: null, //the full expression - which can be calculated directly with eval
    calcInput: null, //the bottom input - the number
    hiddenInput: null,
    _closePopup: function (cancel) {
      var field = $(this.element);
      var menu = field.data('popupmenu');
      if (menu) {
          menu.close();
      }

      if (!cancel) {
        field.val(this.calcInput.val()).trigger('change');
      }
    },
    _openPopup: function ($input) {
      var $div = $('#inforCalculatorPopup'),
        self = this,
        originalVal = $input.val(),
        cancelButton = null,
        okButton = null,
        tableHtml = '';


      if ($div.length !== 0) {
        return;
      }

      //create a div in which the Calculator goes - stopPropagtion to prevent clicks from carrying through
      $div = $('<div id="inforCalculatorPopup"> </div>').click(function (e) {
        e.stopPropagation();
      });

      //add the Calculator table and buttons html
      tableHtml = '<div class="inforCalculatorTableHeader"><input class="inforCalculatorExpression" readonly><input class="inforTextbox inforCalculatorInput" readonly><input class="inforTextbox inforHiddenInput"></div> <table class="inforCalculatorTable"><tbody><tr><td><button data-calc="(" class="inforTextButton padded">(</button></td><td><button data-calc=")" class="inforTextButton padded">)</button></td><td><button data-calc="clear"  class="inforTextButton">C</button>' +
            '</td><td colspan="2"><button data-calc="back" class="inforTextButton backButton"></button></td></tr><tr><td><button data-calc="7" class="inforTextButton colored">7</button></td><td><button data-calc="8" class="inforTextButton colored">8</button></td><td><button data-calc="9" class="inforTextButton colored">9</button></td><td><button data-calc="/" class="inforTextButton">&divide;</button></td><td><button data-calc="sqRoot" class="inforTextButton">&radic;</button></td></tr><tr><td><button data-calc="4" class="inforTextButton colored">4</button></td><td><button data-calc="5" class="inforTextButton colored">5</button></td><td><button data-calc="6" class="inforTextButton colored">6</button></td><td><button data-calc="*" class="inforTextButton">x</button></td><td><button data-calc="percent" class="inforTextButton">%</button></td></tr><tr><td><button data-calc="1" class="inforTextButton colored">1</button></td><td><button data-calc="2" class="inforTextButton colored">2</button></td><td>' + //ignore jslint
            '<button data-calc="3" class="inforTextButton colored">3</button></td><td><button data-calc="-" class="inforTextButton">-</button></td><td rowspan="2"><button data-calc="=" class="inforTextButton inforEqualsButton">=</button></td></tr><tr><td><button data-calc="0" class="inforTextButton">0</button></td><td><button data-calc="." class="inforTextButton">.</button></td><td><button data-calc="plusMinus" class="inforTextButton">+/-</button></td><td><button data-calc="+" class="inforTextButton">+</button></td></tr></tbody></table>';

      $div.append(tableHtml);

      //copy the input from the field and style the two input fields Expression(Top) and CalcInput(Bottom)
      this.calcInput = $div.find('.inforCalculatorInput').addClass('selectOnly').attr('readonly', '');
      this.calcInput.val($(this.element).val());
      this.expression = $div.find('.inforCalculatorExpression').attr('readonly', '');

      //Create and add events to the buttons
      $div.find('.inforTextButton').add($div.find('.inforFormButton')).on('click', function (e) {
        var calcExpr = $(e.currentTarget).attr('data-calc');
        self._handleKey(calcExpr);
      });

      //equals button
      $div.find('.inforEqualsButton').on('click', function () {
        self._calc();
      });

      //handle the keypresses by filtering only allowed hot keys and calling the _handleClick
      this.hiddenInput = $div.find('.inforHiddenInput');
      $div.bind('keydown', function (e) {
          var charCode = e.charCode || e.keyCode;
          if (charCode == 8) { //backspace to clear one.
            self._handleKey('back');
          }
        })
        .bind('keypress', function (e) {
          var charCode = e.charCode || e.keyCode,
            actualChar = String.fromCharCode(charCode);

          if (charCode == 99) { //c for clear
            self._handleKey('clear');
            return;
          }

          //no letters..(except c for clear)
          if (actualChar.replace(/[a-zA-Z]/g, '') === '' && actualChar.toLowerCase() != 'c') {
            return;
          }

          switch (charCode) {
          case 61:
            //allow = and enter to calculate
            self._calc();
            e.preventDefault();
            break;
          case 13:
            if (self.menu.is(':visible')) {
              self._calc();
              e.preventDefault();
              self._closePopup();
              $(self.element).focus();
            }
            break;
          case 99:
            //upper and lower case c and esc to clear.
          case 67:
          case 27:
            //self._handleKey('clear');
            //e.stopPropagation();
            self._closePopup();
            $(self.element).val(originalVal).trigger('change').focus();
            break;
          case 9:
            //tab to calculate and insert.
            $(document).trigger('click');
            break;
          default:
            //else insert the character.
            self._handleKey(actualChar);
            break;
          }
        });

      //open the popup in a context menu to get the right cross browser image edge styling
      $('body').append($div);

      this.menu = $('#inforCalculatorPopup').parent();
      this.menu.css('border', 'none').css('padding', 0);

      //add ok and cancel buttons
      okButton = $('<button class="inforFormButton default">' + Globalize.localize('Ok') + '</button>').click(function () {
        self._calc();
        self._closePopup();
        $input.focus();
      });
      cancelButton = $('<button class="inforFormButton">' + Globalize.localize('Cancel') + '</button>').click(function () {
        self._closePopup(true);
        $input.val(originalVal).focus();
      });
      $div.find('table').after($('<div class="inforCalculatorTableFooter"></div>').append(okButton, cancelButton));

      $input.popupmenu({
        menu: 'inforCalculatorPopup',
        trigger: 'immediate'
      }).on('destroy.popupmenu', function () {
        //self._closePopup(true);
        $('#inforCalculatorPopup').remove();
      });

      //correct some styling added by the context menu that we dont want to break.
      $div.closest('.menuContent').css('text-indent', '');

      setTimeout(function () {
        self.hiddenInput.focus();
      }, 1);
      this.resetOp = true;  //overright the current value
    },
    firstOp: null, //stores the first operation in the sequence. Used for Percentage Calc.
    resetOp: false, //should we reset the numeric input on next click
    _handleKey: function (key) {
      //Handle Each Key Press or input from the buttons. Similar to Windows Calc Functionality
      var oldOpVal = this.calcInput.val(),
        oldExprVal = this.expression.val(),
        newOp = null;

      switch (key) {
      case '(':
        if (oldOpVal === '' || oldOpVal === '0') {
          this.expression.val(oldOpVal + key);
        }
        else {
          this.expression.val(key + oldOpVal);
        }
        break;
      case ')':
        if ($.inArray('(', oldExprVal) == -1) {
          return;
        }
        this.expression.val(oldExprVal + key);
        break;
      case '=':
        this.isEquals = true;
        /* falls through */
      case '+':
      case '*':
      case '/':
      case '-':
        if (oldExprVal.search('sqrt') == -1) {
          this.expression.val(oldExprVal + oldOpVal + key);
        }
        this.resetOp = true;
        if (!this.firstOp) {
          this.firstOp = oldOpVal;
        }
        break;
      case 'percent':
        this.expression.val(oldExprVal + (parseFloat(this.firstOp) * parseFloat(oldOpVal) / 100));
        break;
      case 'sqRoot':
        this.expression.val('sqrt(' + oldOpVal + ')');
        break;
      case 'back':
        newOp = oldOpVal.substr(0, oldOpVal.length - 1);
        this.calcInput.val(newOp);
        this.expression.val(oldExprVal.substr(0, oldExprVal.length - 1));
        this.firstOp = newOp;
        break;
      case 'clear':
        this.calcInput.val('0');
        this.expression.val('');
        this.firstOp = null;
        break;
      case 'plusMinus':
        this.calcInput.val((-oldOpVal));
        break;
      default:
        //numbers
        if (key.replace(/[0-9.,]/g, '') === '') {
          if (this.resetOp) {
            this.calcInput.val(key);
          } else {
            this.calcInput.val((oldOpVal == '0' ? key : oldOpVal + key)); //reset zero after clear
          }
          this.resetOp = false;
        }
        break;
      }
    },
    _calc: function () {
      if (!this.isEquals) {
        this._handleKey('=');
      }

      if (this.expression.val() === '') {
        return;
      }

      //Replace the visual sqrt with the js executable Math.sqrt
      var result = '',
        calculation = this.expression.val().replace(/sqrt/gi, 'Math.sqrt').replace(/=/gi, '');  //ignore jslint

      //Execute the calc in the expression field - any errors show the visual 'Invalid Input'
      try {
        result = eval(calculation); //ignore jslint
      } catch (err) {
        result = 'Invalid Input';
      }

      //Show Divide By Zero Errors.
      this.calcInput.val((result == Infinity ? 'Cannot Divide By Zero' : result));
      this.expression.val('');
      this.isEquals = false;
    }
  });
}(jQuery));
