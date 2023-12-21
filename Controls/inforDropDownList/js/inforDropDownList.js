/*
 * Infor DropDown List
 */
(function ($) {

  $.fn.inforDropDownList = function( options , parms) {

    // Tab Settings and Options
    var pluginName = 'inforDropDownList',
        args = arguments,
        defaults = {
          propertyName: 'value'
        },
        settings = $.extend({}, defaults, options);

    // Plugin Constructor
    function Plugin(element, options) {
        this.element = $(element);
        this.init();
    }

    // Actual Plugin Code
    Plugin.prototype = {
      init: function(){
        var self = this;

        if (!this.isSupported()) {
          return;
        }
        this.select = this.element;
        if (this.isInitialized) {
          return;
        }
        this.options = options !== undefined ? options : {};
        this.isMultiple = this.select[0].multiple;
        this.setDefaultText();
        this.setDefaultValues();
        this.setup();
        this.setupHtml();
        this.registerObservers();
        this.isInitialized = true;
      },

      isSupported: function() {
        if (window.navigator.appName === "Microsoft Internet Explorer") {
          return document.documentMode >= 8;
        }
        if (/iP(od|hone)/i.test(window.navigator.userAgent)) {
          return false;
        }
        if (/Android/i.test(window.navigator.userAgent)) {
          if (/Mobile/i.test(window.navigator.userAgent)) {
            return false;
          }
        }
        return true;
      },

      setDefaultValues: function() {
          var self = this;

          this.clickTestAction = function(e) {
            return self.testActiveClick(e);
          };
          this.activeAction = function(e) {
            return self.activateField(e);
          };
          this.activeField = false;
          this.mouseOnContainer = false;
          this.resultsShowing = false;
          this.resultHighlighted = null;
          this.resultSingleSelected = null;
          this.allowSingleDeselect = (this.options.allowSingleDeselect !== undefined) && (this.select[0].options[0] !== undefined) && this.select[0].options[0].text === "" ? this.options.allowSingleDeselect : false;
          this.disableSearchThreshold = this.options.disableSearchThreshold || 0;
          this.disableSearch = this.options.disableSearch || false;
          this.enableSplitWordSearch = this.options.enableSplitWordSearch !== undefined ? this.options.enableSplitWordSearch : true;
          this.groupSearch = this.options.groupSearch !== undefined ? this.options.groupSearch : true;
          this.searchContains = this.options.searchContains || false;
          this.singleBackstrokeDelete = this.options.singleBackstrokeDelete !== undefined ? this.options.singleBackstrokeDelete : true;
          this.maxSelectedOptions = this.options.maxSelectedOptions || Infinity;
          this.options.width =   (this.options.width  === undefined ? "205px" : this.options.width);
          this.inheritSelectClasses = this.options.inheritSelectClasses || false;
          this.displaySelectedOptions = this.options.displaySelectedOptions !== undefined ? this.options.displaySelectedOptions : true;
          this.displayDisabledOptions = this.options.displayDisabledOptions !== undefined ? this.options.displayDisabledOptions : true;
          this.source =  this.options.source;
    },

    setDefaultText: function() {

      if (this.select.attr("data-placeholder")) {
        this.defaultText = this.select.attr("data-placeholder");
      } else if (this.isMultiple) {
        this.defaultText = this.options.placeholderTextMultiple || this.options.placeholderText || "";
      } else {
        this.defaultText = this.options.placeholderTextSingle || this.options.placeholderText || "";
      }
      this.resultsNoneFound = this.select.attr("data-no_results_text") || this.options.noResultsText || "No results match";

    },

    setup : function() {
      this.currentSelectedIndex = this.select.selectedIndex;
    },
      containerPosition: function (props) {
        var style="";

        if (this.select[0].style.position === "absolute") {
          style += "position:absolute;";

          if (this.select[0].style.left) {
            style += "left:" + this.select[0].style.left +";";
          }
          if (this.select[0].style.top) {
            style += "top:" + this.select[0].style.top +";";
          }
          if (this.select[0].style.bottom) {
            style += "bottom:" + this.select[0].style.bottom +";";
          }
          if (this.select[0].style.right) {
            style += "right:" + this.select[0].style.right +";";
          }
        }
        return style;
      },
      containerWidth: function() {
        if (this.select[0].style.width) {  //inline width
          return parseInt(this.select[0].style.width, 10) + 30 + "px";
        }
        if (this.options.width !== undefined) {
          return this.options.width;
        } else {
          return "" + this.select[0].offsetWidth + "px";
        }
      },
      setupHtml: function() {
        var classes, props, inputId, isHidden;

        classes = ["inforDropdownContainer"];
        classes.push((this.isMultiple ? "isMulti" : "isSingle"));
        isHidden = this.select.css("display") === "none";

        if (this.inheritSelectClasses && this.select.attr("class")) {
          classes.push(this.select.className);
        }
        props = {
          'class': classes.join(' '),
          'style': "width: " + (this.containerWidth()) + ";",
          'title': this.select[0].title
        };

        props.style += this.containerPosition();

        if (!this.select[0].id) {
          this.select.uniqueId();
        }

        if (this.select[0].id.length) {
          props.id = this.select[0].id.replace(/[^\w]/g, '_') + "Container";
        }
        this.setLabelBehavior();
        inputId = props.id.replace("Container", "Input");
        this.container = $("<div />", props);
        if (this.isMultiple) {
          this.container.html('<ul class="selectedMulti"><li class="searchField"><label for="' + inputId + '" class="inforScreenReaderText">' + this.formFieldLabel.text() + '</label><input role="combobox" id="' + inputId + '" type="text" value="' + this.defaultText + '" class="default" autocomplete="off" style="width:25px;" /><button type="button" class="clearButton"><i></i></button></li></ul><div class="inforDropdownList"><ul class="inforDropResults" role="menu"></ul></div>');
        } else {
          this.container.html('<a class="selectedSingle hasNoValue" tabindex="-1"><span>' + this.defaultText + '</span><div><b></b></div></a><div class="inforDropdownList"><div class="inforDropSearch"><label for="' + inputId + '"class="inforScreenReaderText">' + this.formFieldLabel.text() + '</label><input role="combobox" id="' + inputId + '"type="text" autocomplete="off" /><button type="button" class="clearButton"><i></i></button></div><ul class="inforDropResults" role="menu"></ul></div>');
        }
        this.select.hide().after(this.container);
        this.dropdown = this.container.find('div.inforDropdownList').first();
        this.searchField = this.container.find('input').first();
        this.clearButton = this.container.find('.clearButton').first();
        this.searchResults = this.container.find('ul.inforDropResults').first();
        this.searchFieldScale();
        this.searchNoResults = this.container.find('li.hasNoResults').first();

        if (this.isMultiple) {
          this.searchChoices = this.container.find('ul.selectedMulti').first();
          this.searchContainer = this.container.find('li.searchField').first();
          this.selectedSpan = this.searchContainer.attr("id", props.id.replace("Container", "Span"));
        } else {
          this.searchContainer = this.container.find('div.inforDropSearch').first();
          this.selectedItem = this.container.find('.selectedSingle').first();
          this.selectedSpan = this.selectedItem.find("span").attr("id", props.id.replace("Container", "Span"));
        }

        this.resultsBuild();
        this.setTabIndex();
        if (isHidden) {
          this.container.hide();
        }
      },
      setAria: function(value, id) {
        this.searchField.attr("aria-labelledby", this.selectedSpan.attr("id"));

        if (id) {
          this.searchField.attr("aria-activedescendant", id);
        }

        if (value) {
          this.selectedSpan.text(value);
        }
      },
      searchFieldScale : function() {
        var div, width, h, styleBlock, styles, w, i, len;
        if (this.isMultiple) {
          h = 0;
          w = 0;
          styleBlock = "position:absolute; left: -1000px; top: -1000px; display:none;";
          styles = ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'];
          for (i = 0, len = styles.length; i < len; i++) {
            style = styles[i];
            styleBlock += style + ":" + this.searchField.css(style) + ";";
          }
          div = $('<div />', {
            'style': styleBlock
          });
          div.text(this.searchField.val());
          $('body').append(div);
          w = div.width() + 30;
          div.remove();
          width = this.container.outerWidth();
          if (w > width - 10) {
            w = width - 10;
          }
          return this.searchField.css({
            'width': w + 'px'
          });
        }
      },
      selectParser : function() {
        this.optionsIndex = 0;
        this.parsed = [];
        this.addNode = function(child) {
          if (child.nodeName.toUpperCase() === "OPTGROUP") {
            return this.addGroup(child);
          } else {
            return this.addOption(child);
          }
        };
        this.addGroup = function(group) {
          var groupPosition, option, i, len, ref, results;
          groupPosition = this.parsed.length;
          this.parsed.push({
            arrayIndex: groupPosition,
            group: true,
            label: this.escapeExpression(group.label),
            children: 0,
            disabled: group.disabled
          });
          ref = group.childNodes;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            option = ref[i];
            results.push(this.addOption(option, groupPosition, group.disabled));
          }
          return results;
        };
        this.addOption = function(option, groupPosition, groupDisabled) {
          if (option.nodeName.toUpperCase() === "OPTION") {
            if (option.text !== "") {
              if (groupPosition) {
                this.parsed[groupPosition].children += 1;
              }
              this.parsed.push({
                arrayIndex: this.parsed.length,
                optionsIndex: this.optionsIndex,
                value: option.value,
                text: option.text,
                html: option.innerHTML,
                selected: option.selected,
                disabled: groupDisabled === true ? groupDisabled : option.disabled,
                groupArrayIndex: groupPosition,
                classes: option.className,
                style: option.style.cssText
              });
            } else {
              this.parsed.push({
                arrayIndex: this.parsed.length,
                optionsIndex: this.optionsIndex,
                empty: true
              });
            }
            return this.optionsIndex += 1;
          }
        };
        this.escapeExpression = function(text) {
          var map, unsafeChars;
          if ((text === null) || text === false) {
            return "";
          }
          if (!/[\&\\<\>\"\'\`]/.test(text)) {  //extra \\ on <
            return text;
          }
          map = {
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
          };
          unsafeChars = /&(?!\w+;)|[\\<\>\"\'\`]/g; //extra \\ on <
          return text.replace(unsafeChars, function(chr) {
            return map[chr] || "&amp;";
          });
        };
        this.selectToArray = function(select) {
          var child, parser, i, len, ref;
          ref = select.childNodes;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            this.addNode(child);
          }
          return this.parsed;
        };
      },
      resultsBuild : function() {
        this.parsing = true;
        this.selectedOptionCount = null;
        this.parser = new this.selectParser();
        this.resultsData = this.parser.selectToArray(this.select[0]);
        if (this.isMultiple) {
          this.searchChoices.find("li.searchChoice").remove();
        } else if (!this.isMultiple) {
          this.singleSetSelectedText();
          if (this.disableSearch || this.select[0].options.length <= this.disableSearchThreshold) {
            this.searchField[0].readOnly = true;
            this.container.addClass("disableSearch");
          } else {
            this.searchField[0].readOnly = false;
            this.container.removeClass("disableSearch");
          }
        }
        this.updateResultsContent(this.resultsOptionBuild({
          first: true
        }));
        this.searchFieldDisabled();
        this.showSearchFieldDefault();
        this.searchFieldScale();
        this.parsing = false;
        return this.parsing;
      },
      selectToArray: function(select) {
        var child, i, len, ref;
        ref = this.select.childNodes;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          parser.addNode(child);
        }
        return parser.parsed;
      },
      singleSetSelectedText: function(text) {
        if (!text) {
          text = this.defaultText;
        }
        if (text === this.defaultText) {
          this.selectedItem.addClass("hasNoValue");
        } else {
          this.singleDeselectControlBuild();
          this.selectedItem.removeClass("hasNoValue");
        }
        this.selectedItem.find("span").text(text);
        this.setAria(text);
      },
      resultsOptionBuild: function(options) {
        var content, data, i, len, ref;
        content = '';
        ref = this.resultsData;
        for (i = 0, len = ref.length; i < len; i++) {
          data = ref[i];
          if (data.group) {
            content += this.resultAddGroup(data);
          } else {
            content += this.resultAddOption(data);
          }
          if (options ? options.first : void 0) {
            if (data.selected && this.isMultiple) {
              this.choiceBuild(data);
            } else if (data.selected && !this.isMultiple) {
              this.singleSetSelectedText(data.text);
            }
          }
        }
        return content;
      },
      resultAddOption: function(option) {
        var classes, style, uniqueId;

        if (!option.searchMatch) {
          return '';
        }
        if (!this.includeOptionInResults(option)) {
          return '';
        }
        classes = [];
        if (!option.disabled && !(option.selected && this.isMultiple)) {
          classes.push("activeResult");
        }
        if (option.disabled && !(option.selected && this.isMultiple)) {
          classes.push("disabled-result");
        }
        if (option.selected) {
          classes.push("resultSelected");
        }
        if (option.groupArrayIndex !== undefined) {
          classes.push("groupOption");
        }
        if (option.classes !== "") {
          classes.push(option.classes);
        }
        style = (option.style == undefined || option.style.cssText !== "") ? " style=\"" + option.style + "\"" : "";

        uniqueId = this.searchField.attr("id").replace("Input", "Option") + option.arrayIndex;
        return "<li class=\"" + (classes.join(' ')) + "\"" + style + " role='option' data-option-array-index=\"" + option.arrayIndex + "\" id=\"" + uniqueId + "\">" + (option.searchText == undefined ? '&nbsp;' : option.searchText) + "</li>";
      },
      resultAddGroup: function(group) {
        if (!(group.searchMatch || group.groupMatch)) {
          return '';
        }
        if ((group.activeOptions < 0)) {
          return '';
        }
        return "<li class=\"groupResult\">" + group.searchText + "</li>";
      },
      updateResultsContent: function(content) {
        this.searchResults.html(content);
        var oldWidth = this.container.width();

        if (this.isMultiple) {
          this.container.find(".inforDropdownList").width(oldWidth);
        }

        if (this.options.minWidth) {
          this.container.find(".inforDropdownList").width(this.options.minWidth);
          return;
        }

        //set width
        if (content && parseInt(oldWidth, 10) < 200) {
          this.dropdown.css("width","auto");
        }

        //flip to top if necessary
        if (this.container.hasClass("isOpen")) {
          var top = this.dropdown.offset().top + this.dropdown.outerHeight();
          var ddTopSpace = this.container.offset().top;
          var ddBotSpace = $(window).height() - ddTopSpace - this.container.outerHeight();

          if (top - $(window).scrollTop() + this.container.outerHeight() > $(window).height()) {
            if(ddBotSpace > ddTopSpace){
              this.searchResults.css("height", $(window).height() - ddTopSpace - this.container.outerHeight() - this.searchContainer.outerHeight() - 10);
            }
            else{
              if(this.dropdown.outerHeight() > ddTopSpace)	
                this.searchResults.css("height", ddTopSpace - this.searchContainer.outerHeight() - 10);
              this.dropdown.css("top", parseInt(this.container.offset().top, 10) - $(window).scrollTop() - this.dropdown.height() - 1);
              this.container.addClass("isOpenTop")
            }
          }
          else if (this.container.hasClass("isOpenTop")) {
            this.dropdown.css("top", parseInt(this.container.offset().top, 10) - $(window).scrollTop() - this.dropdown.height() - 1);
          }
        } else {
          this.dropdown.css("top", parseInt(this.container.offset().top, 10) - $(window).scrollTop() - this.dropdown.height() + 24);
          if (this.dropdown.offset().left < 0 && this.container.parent().hasClass('slick-cell')) {
            this.dropdown.css("left", parseInt(this.container.offset().left, 10));
            this.dropdown.css("opacity", 0);
            this.dropdown.mouseover(function () {
              if (!($(this.parentNode).hasClass("isOpen"))) {
                this.style.display = 'none';
              }
            });
          }
        }
      },
      searchFieldDisabled : function() { // Add disabled functionality if the Select is disabled
        this.isDisabled = this.select[0].disabled;
        if (this.isDisabled) {
          this.container.addClass('isDisabled');
          this.searchField[0].disabled = true;
          if (!this.isMultiple) {
            this.selectedItem.unbind("focus", this.activateAction);
          }
          this.closeField();
        } else {
          this.container.removeClass('isDisabled');
          this.searchField[0].disabled = false;
          if (!this.isMultiple) {
            this.selectedItem.bind("focus", this.activateAction);
          }
        }

        this.isReadOnly = this.select.attr("readonly");
        if (this.isReadOnly) {
          this.container.addClass('isReadOnly');
          this.container.find("a:first").attr('tabindex', 0);
          this.searchField[0].readonly = true;
          this.closeField();
        } else {
          this.container.removeClass('isReadOnly');
          this.container.find("a:first").attr('tabindex', -1);
          this.searchField[0].readonly = false;
        }
        if (this.select.hasClass("backgroundColor")) {
          this.container.addClass("backgroundColor");
        }
      },
      // Show text in the search field
      showSearchFieldDefault : function() {
        if (this.isMultiple && this.choicesCount() < 1 && !this.activeField) {
          this.searchField.val(this.defaultText);
          return this.searchField.addClass("default");
        } else {
          this.searchField.val("");
          return this.searchField.removeClass("default");
        }
      },
      // Set the form field tabindex.
      setTabIndex: function(el) {
        var ti;
        if (this.select[0].tabIndex) {
          ti = this.select[0].tabIndex;
          this.select[0].tabIndex = -1;
          this.searchField[0].tabIndex = ti;
        }
      },
      // Set the label click to focus the right field
      setLabelBehavior: function() {
        var self = this;
        this.formFieldLabel = this.select.parents("label");
        if (!this.formFieldLabel.length && this.select[0].id.length) {
          this.formFieldLabel = $("label[for='" + this.select[0].id + "']");
        }
        if (this.formFieldLabel.length > 0) {
          return this.formFieldLabel.bind('click.dropdownlist', function(e) {
            if (self.isMultiple) {
              return self.containerMousedown(e);
            } else {
              return self.activateField();
            }
          });
        }
      },
      registerObservers: function() {
        var self = this;
        this.container.on('mousedown.dropdownlist', function(e) {
          self.containerMousedown(e);
        }).on('mouseup.dropdownlist', function(e) {
          self.containerMouseup(e);
        }).on('mouseenter.dropdownlist', function(e) {
          self.mouseEnter(e);
        }).on('mouseleave.dropdownlist', function(e) {
          self.mouseLeave(e);
        });
        this.searchResults.on('mouseup.dropdownlist', function(e) {
          self.searchResultsMouseup(e);
        }).on('mouseover.dropdownlist', function(e) {
          self.searchResultsMouseover(e);
        }).on('mouseout.dropdownlist', function(e) {
          self.searchResultsMouseout(e);
        }).on('mousewheel.dropdownlist DOMMouseScroll.dropdownlist', function(e) {
          self.searchResultsMousewheel(e);
        });
        this.select.bind("updated", function(e) {
          self.resultsUpdateField(e);
        }).on("activate", function(e) {
          self.activateField(e);
          self.select.trigger("focus");
        }).on("open", function(e) {
          self.containerMousedown(e);
        });
        this.searchField.on('blur.dropdownlist', function(e) {
          self.inputBlur(e);
          self.select.trigger("blur");
        }).on('keyup.dropdownlist', function(e) {
          self.keyupChecker(e);
        }).on('keydown.dropdownlist', function(e) {
          self.keydownChecker(e);
        }).on('focus.dropdownlist', function(e) {
          self.inputFocus(e);
        });

        //for form resets.
        this.select.closest("form").on("reset.dropdownlist", function() {
          setTimeout(function () {
            self.select.trigger("updated").trigger("changed");
          }, 1);
        });

        this.clearButton.on('click.dropdownlist', function(e) {
          self.searchField.val("");
          self.resultsSearch();
          self.searchField.focus();
        });
        if (this.isMultiple) {
          return this.searchChoices.on('click.dropdownlist', function(e) {
            self.choicesClick(e);
          });
        } else {
          return this.container.on('click.dropdownlist', function(e) {
            e.preventDefault();
          });
        }
      },
      mouseEnter: function() {
        this.mouseOnContainer = true;
        return this.mouseOnContainer;
      },
      mouseLeave: function() {
        this.mouseOnContainer = false;
        return this.mouseOnContainer;
      },
      containerMousedown: function(e) {
        if (!this.isDisabled && this.isReadOnly !== 'readonly') {
          if (e && e.type === "mousedown" && !this.resultsShowing) {
            e.preventDefault();
          }
          if (!((e !== null) && ($(e.target).parent().hasClass("searchChoiceClose")))) {
            if (!this.activeField) {
              if (this.isMultiple) {
                this.searchField.val('');
              }
              $(document).on('click.dropdownlist', this.clickTestAction);
              this.resultsShow();
            } else if (!this.isMultiple && e && (($(e.target)[0] === this.selectedItem[0]) || $(e.target).parents("a.selectedSingle").length)) {
              e.preventDefault();
              this.resultsToggle();
            }
            return this.activateField();
          }
        }
      },
      containerMouseup: function(e) {
        if ($(e.target).parent().hasClass("searchChoiceClose") && !this.isDisabled) {
          return this.resultsReset(e);
        }
      },
      resultsReset: function() {
        this.select[0].options[0].selected = true;
        this.selectedOptionCount = null;
        this.singleSetSelectedText();
        this.showSearchFieldDefault();
        this.resultsResetCleanup();
        this.select.trigger("change");
        if (this.activeField) {
          return this.resultsHide();
        }
      },
      resultsResetCleanup: function() {
        this.currentSelectedIndex = this.select[0].selectedIndex;
        return this.selectedItem.find("abbr").remove();
      },
      openIt: function() {
        var self = this;
        if (this.isReadOnly) {
          return;
        }

        if (this.isMultiple && this.maxSelectedOptions <= this.choicesCount()) {
          this.select.trigger("maxselected");
          return false;
        }

        var h = this.isMultiple ? this.container.height() : this.container.height() + 0;

        this.dropdown.css({
          "top": this.container.offset().top + h - $(document).scrollTop(),
          "left": this.container.offset().left - $(document).scrollLeft(),
          "min-width": this.container.width()
        });

        if (this.dropdown[0].style.display = "none") {
          this.dropdown[0].style.display = "";
        }
        if (this.dropdown.css("opacity") == 0) {
          this.dropdown.css("opacity", 1);
        }

        this.container.addClass("isOpen");
        this.select.trigger("opening");
        this.resultsShowing = true;
        this.searchField.focus();
        this.searchField.val(this.searchField.val());
        this.windowResults();
        this.container.find(".selectedSingle span").removeClass("inforBusyIndicator small");
        $(window).on("resize.dropdownlist"+this.select.attr('id'), function () {
          self.closeField();
        });
      },
      resultsShow: function() {
        var self = this;

        if (this.source) {
          var response = function (data) {
            if (self.select[0].length === 0) {
              return;
            }
            //Storing the currently selected value in a temp var
            var prevValue = self.select[0][0].value;
            self.select.empty();
            self.parser.parsed = [];
            self.parser.optionsIndex = 0;
            for (var i=0; i < data.length; i++) {
              var id = (data[i].id === undefined ? data[i].value : data[i].id);
              self.select.append($("<option>" + data[i].label + "</option>").attr("value", id));
              //If its the curr. selected value then set the selected attr to true else false
                if(prevValue === self.select[0][i].value)
                  self.select[0][i].selected = true;
                else
                  self.select[0][i].selected = false;
            }

            //Set the currentSelectedIndex to the currently selectedIndex
            self.currentSelectedIndex = self.select[0].selectedIndex;
            self.resultsData = self.parser.selectToArray(self.select[0]);
            self.openIt();
            return;
          };
          var span = this.container.find(".selectedSingle span");
          span.addClass("inforBusyIndicator small");
          if (span.text() === "") {
            span.append("&nbsp;");
          }
          this.source(this.searchField.val(), response);
          return;
        }
        self.openIt();
      },
      testActiveClick: function(e) {
        if (this.container.is($(e.target).closest('.inforDropdownContainer'))) {
          this.activeField = true;
          return this.activeField;
        } else {
          return this.closeField();
        }
      },
      windowResults: function() {
        var escapedSearchText, option, regex, regexAnchor, results, resultsGroup, searchText, startpos, text, zregex, i, len, ref;
        this.searchResults.find(".hasNoResults").remove();
        results = 0;
        if (this.searchField.val() === this.defaultText) {
          searchText = "";
        } else {
          searchText = $('<div/>').text($.trim(this.searchField.val())).html();
        }
        escapedSearchText = searchText.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        regexAnchor = this.searchContains ? "" : "^";
        regex = new RegExp(regexAnchor + escapedSearchText, 'i');
        zregex = new RegExp(escapedSearchText, 'i');
        ref = this.resultsData;
        for (i = 0, len = ref.length; i < len; i++) {
          option = ref[i];
          option.searchMatch = false;
          resultsGroup = null;
          if (this.includeOptionInResults(option)) {
            if (option.group) {
              option.groupMatch = false;
              option.activeOptions = 0;
            }
            if ((option.groupArrayIndex !== undefined) && this.resultsData[option.groupArrayIndex]) {
              resultsGroup = this.resultsData[option.groupArrayIndex];
              if (resultsGroup.activeOptions === 0 && resultsGroup.searchMatch) {
                results += 1;
              }
              resultsGroup.activeOptions += 1;
            }
            if (!(option.group && !this.groupSearch)) {
              option.searchText = option.group ? option.label : option.html;
              option.searchMatch = this.searchStringMatch(option.searchText, regex);
              if (option.searchMatch && !option.group) {
                results += 1;
              }
              if (option.searchMatch) {
                if (searchText.length) {
                  startpos = option.searchText.search(zregex);
                  text = option.searchText.substr(0, startpos + searchText.length) + '</em>' + option.searchText.substr(startpos + searchText.length);
                  option.searchText = text.substr(0, startpos) + '<em>' + text.substr(startpos);
                }
                if (resultsGroup !== null) {
                  resultsGroup.groupMatch = true;
                }
              } else if ((option.groupArrayIndex !== undefined) && this.resultsData[option.groupArrayIndex].searchMatch) {
                option.searchMatch = true;
              }
            }
          }
        }
        this.resultClearHighlight();
        if (results < 1 && searchText.length) {
          this.updateResultsContent("");
          return this.noResults(searchText);
        } else {
          this.updateResultsContent(this.resultsOptionBuild());
          return this.setHighlight();
        }
      },
      noResults: function(terms) {
        var noResultsHtml;
        noResultsHtml = $('<li class="hasNoResults">' + this.resultsNoneFound + ' "<span></span>"</li>');
        noResultsHtml.find("span").first().html(terms);
        return this.searchResults.append(noResultsHtml);
      },
      noResultsClear: function() {
        return this.searchResults.find(".hasNoResults").remove();
      },
      includeOptionInResults: function(option) {
        if (this.isMultiple && (!this.displaySelectedOptions && option.selected)) {
          return false;
        }
        if (!this.displayDisabledOptions && option.disabled) {
          return false;
        }
        return true;
      },
      searchStringMatch: function(searchString, regex) {
        var part, parts, i, len;
        if (searchString === undefined) {
            searchString = "";
        }
        if (regex.test(searchString)) {
          return true;
        } else if (this.enableSplitWordSearch && searchString != undefined && (searchString.indexOf(" ") >= 0 || searchString.indexOf("[") === 0)) {
          parts = searchString.replace(/\[|\]/g, "").split(" ");
          if (parts.length) {
            for (i = 0, len = parts.length; i < len; i++) {
              part = parts[i];
              if (regex.test(part)) {
                return true;
              }
            }
          }
        }
      },
      resultClearHighlight: function() {
        if (this.resultHighlight) {
          this.resultHighlight.removeClass("isHighlighted");
        }
        this.resultHighlight = null;
        return this.resultHighlight;
      },
      setHighlight: function() {
        var doHigh, selectedResults;
        selectedResults = !this.isMultiple ? this.searchResults.find(".resultSelected.activeResult") : [];
        doHigh = selectedResults.length ? selectedResults.first() : this.searchResults.find(".activeResult").first();
        if (this.searchField.val() != "")
        {
             var currentValue = this.searchField.val();
             var activeList = this.searchResults.find(".activeResult");
             if (activeList.length > 1)  {
var d = $(activeList).filter(function (index) { if (currentValue.toLowerCase() == $(activeList)[index].innerText.toLowerCase()) { return $(activeList).first(); } });
                    if (d.length == 1) {
                           doHigh = d;
                    }
             }
        }
        if (doHigh !== null) {
          return this.resultDoHighlight(doHigh);
        }
      },
      resultDoHighlight: function(el) {
        var highBottom, highTop, maxHeight, visibleBottom, visibleTop;
        if (el.length) {
          this.resultClearHighlight();
          this.resultHighlight = el;
          this.resultHighlight.addClass("isHighlighted");

          this.setAria(null,this.resultHighlight.attr("id"));

          maxHeight = parseInt(this.searchResults.css("maxHeight"), 10);
          visibleTop = this.searchResults.scrollTop();
          visibleBottom = maxHeight + visibleTop;
          highTop = this.resultHighlight.position().top + this.searchResults.scrollTop();
          highBottom = highTop + this.resultHighlight.outerHeight();
          if (highBottom >= visibleBottom) {
            return this.searchResults.scrollTop((highBottom - maxHeight) > 0 ? highBottom - maxHeight : 0);
          } else if (highTop < visibleTop) {
            return this.searchResults.scrollTop(highTop);
          }
        }
      },
      activateField: function() {
        var self = this;
        if (this.isDisabled) {
          return;
        }
        this.container.addClass("isActive");
        this.activeField = true;
        this.searchField.val(this.searchField.val());

        setTimeout(function() {
          //self.searchField.focus();
          if (self.isReadOnly) {
            self.searchField.select();
          }
        }, 10);

        return this.searchField;
      },
      searchResultsMouseup: function(e) {
        var target;
        target = $(e.target).hasClass("activeResult") ? $(e.target) : $(e.target).parents(".activeResult").first();
        if (target.length) {
          this.resultHighlight = target;
          this.resultSelect(e);
          return this.searchField.focus();
        }
      },
      searchResultsMouseover: function(e) {
        var target;
        target = $(e.target).hasClass("activeResult") ? $(e.target) : $(e.target).parents(".activeResult").first();
        if (target) {
          return this.resultDoHighlight(target);
        }
      },
      searchResultsMouseout: function(e) {
        if ($(e.target).hasClass("activeResult" || $(e.target).parents('.activeResult').first())) {
          return this.resultClearHighlight();
        }
      },
      resultSelect: function(e) {
        var high, item, selectedIndex,
            self = this;

        if (this.resultHighlight) {
          high = this.resultHighlight;
          this.resultClearHighlight();
          if (this.isMultiple && this.maxSelectedOptions <= this.choicesCount()) {
            this.select.trigger("maxselected");
            return false;
          }
          if (this.isMultiple) {
            high.removeClass("activeResult");
          } else {
            if (this.resultSingleSelected) {
              this.resultSingleSelected.removeClass("resultSelected");
              selectedIndex = this.resultSingleSelected[0].getAttribute('data-option-array-index');
              this.resultsData[selectedIndex].selected = false;
            }
            this.resultSingleSelected = high;
          }
          high.addClass("resultSelected");
          item = this.resultsData[high[0].getAttribute("data-option-array-index")];
          item.selected = true;
          this.select[0].options[item.optionsIndex].selected = true;
          this.selectedOptionCount = null;
          if (this.isMultiple) {
            this.choiceBuild(item);
          } else {
            this.singleSetSelectedText(item.text);
            this.setAria(item.text, high.attr("id"));
          }

          if (!((e.metaKey || e.ctrlKey) && this.isMultiple)) {
            this.hideResult();
          }
          this.searchField.val("");

          this.select.trigger("change", {
            'selected': self.select[0].options[item.optionsIndex].value
          });

          if (this.dropdown.offset().left > 0) {
            this.dropdown.css("left", "-9999px");
          }
          this.currentSelectedIndex = this.select[0].selectedIndex;
          this.searchFieldScale();
        }
      },
      singleDeselectControlBuild: function() {
        if (!this.allowSingleDeselect) {
          return;
        }
        if (!this.selectedItem.find("abbr").length) {
          this.selectedItem.find("span").first().after("<abbr class=\"searchChoiceClose clearButton\"><i></i></abbr>");
        }
        return this.selectedItem.addClass("selectedSingleWithDeselect");
      },
      hideResult: function() {
        if (this.resultsShowing) {
          this.resultClearHighlight();
          this.container.removeClass("isOpen isOpenTop");
          this.dropdown.css("left", "-9999px");
          this.select.trigger("closed");
        }
        if (this.dropdown.offset().left > 0) {
          this.dropdown.css("left", "-9999px");
        }
        this.resultsShowing = false;
      },
      inputFocus: function(e) {
        var self = this;

        if (this.isMultiple) {
          if (!this.activeField) {
            return setTimeout((function() {
              return self.containerMousedown();
            }), 50);
          }
        } else {
          if (!this.activeField) {
            return this.activateField();
          }
        }
      },
      inputBlur: function(e) {
        var self = this;
        if (!this.mouseOnContainer) {
          this.activeField = false;
          return setTimeout((function() {
            return self.blurTest();
          }), 100);
        }
      },
      keydownChecker: function(e) {
        var stroke, ref;
        stroke = (ref = e.which) !== null ? ref : e.keyCode;
        this.searchFieldScale();
        if (stroke !== 8 && this.pendingBackstroke) {
          this.clearBackstroke();
        }
        switch (stroke) {
        case 8:
          this.backstrokeLength = this.searchField.val().length;
          break;
        case 9:
          if (this.resultsShowing && !this.isMultiple) {
            this.resultSelect(e);
          }
          this.mouseOnContainer = false;
          break;
        case 13:
          e.preventDefault();
          break;
        case 38:
          e.preventDefault();
          this.keyupArrow();
          break;
        case 40:
          e.preventDefault();
          this.keydownArrow();
          break;
        }
      },
      keyupChecker: function(e) {
        var stroke, ref;
        stroke = (ref = e.which) !== null ? ref : e.keyCode;
        this.searchFieldScale();
        switch (stroke) {
        case 8:
          if (this.isMultiple && this.backstrokeLength < 1 && this.choicesCount() > 0) {
            return this.keydownBackstroke();
          } else if (!this.pendingBackstroke) {
            this.resultClearHighlight();
            return this.resultsSearch();
          }
          break;
        case 13:
          e.preventDefault();
          if (this.resultsShowing) {
            return this.resultSelect(e);
          }
          break;
        case 27:
          if (this.resultsShowing) {
            this.resultsHide();
          }
          return true;
        case 9:
        case 38:
        case 40:
        case 16:
        case 91:
        case 17:
          break;
        default:
          return this.resultsSearch();
        }
      },
      blurTest: function(e) {
        if (!this.activeField && this.container.hasClass("isActive")) {
          return this.closeField();
        }
      },
      //Shut the drop down if open.
      closeField: function() {
        $(document).off("click.dropdownlist");
        $(window).off("resize.dropdownlist"+this.select.attr('id'));
        $(window).off("scroll.dropdownlist"+this.select.attr('id'));

        this.activeField = false;
        this.resultsHide();
        this.container.removeClass("isActive");
        this.clearBackstroke();
        this.showSearchFieldDefault();
        return this.searchFieldScale();
      },
      resultsHide: function() {
        if (this.resultsShowing) {
          this.resultClearHighlight();
          this.container.removeClass("isOpen isOpenTop");
          this.dropdown.css("left", "-9999px");
          this.select.trigger("hide");
        }
        if (this.dropdown.offset().left > 0) {
          this.dropdown.css("left", "-9999px");
        }
        this.resultsShowing = false;
      },
      clearBackstroke: function() {
        if (this.pendingBackstroke) {
          this.pendingBackstroke.removeClass("searchChoiceFocus");
        }
        this.pendingBackstroke = null;
        return this.pendingBackstroke;
      },
      resultsToggle: function() {
        if (this.resultsShowing) {
          return this.resultsHide();
        } else {
          return this.resultsShow();
        }
      },
      searchResultsMousewheel: function(e) {
        var delta, ref1, ref2;
        delta = -((ref1 = e.originalEvent) !== null ? ref1.wheelDelta : void 0) || ((ref2 = e.originalEvent) !== null ? ref2.detail : void 0);
        if (delta !== null) {
          e.preventDefault();
          if (e.type === 'DOMMouseScroll') {
            delta = delta * 40;
          }
          return this.searchResults.scrollTop(delta + this.searchResults.scrollTop());
        }
      },
      //Handle Down Arrow
      keydownArrow: function() {
        var nextSibling;
        if (this.resultsShowing && this.resultHighlight) {
          nextSibling = this.resultHighlight.nextAll("li.activeResult").first();
          if (nextSibling) {
            return this.resultDoHighlight(nextSibling);
          }
        } else {
          return this.resultsShow();
        }
      },
      //Handle Arrow up
      keyupArrow: function() {
        var previousSibling;
        if (!this.resultsShowing && !this.isMultiple) {
          return this.resultsShow();
        } else if (this.resultHighlight) {
          previousSibling = this.resultHighlight.prevAll("li.activeResult");
          if (previousSibling.length) {
            return this.resultDoHighlight(previousSibling.first());
          } else {
            if (this.choicesCount() > 0) {
              this.resultsHide();
            }
            return this.resultClearHighlight();
          }
        }
      },
      //Handle Back Key
      keydownBackstroke: function() {
        var nextAvail;
        if (this.pendingBackstroke) {
          this.choiceDestroy(this.pendingBackstroke.find("a").first());
          return this.clearBackstroke();
        } else {
          nextAvail = this.searchContainer.siblings("li.searchChoice").last();
          if (nextAvail.length && !nextAvail.hasClass("searchChoiceDisabled")) {
            this.pendingBackstroke = nextAvail;
            if (this.singleBackstrokeDelete) {
              return this.keydownBackstroke();
            } else {
              return this.pendingBackstroke.addClass("searchChoiceFocus");
            }
          }
        }
      },
      resultsSearch: function() {
        if (this.resultsShowing) {
          this.windowResults();
        } else {
          this.resultsShow();
        }

        if (this.searchField.val().length >0) {
          this.clearButton.show();
        } else {
          this.clearButton.hide();
        }
      },
      /* Multi Select */
      choiceBuild: function(item) {
        var choice, closeLink, self = this;
        choice = $('<li />', {
          "class": "searchChoice"
        }).html("<span>" + item.html + "</span>");
        if (item.disabled) {
          choice.addClass('searchChoiceDisabled');
        } else {
          closeLink = $('<a />', {
            "class": 'searchChoiceClose',
            'data-option-array-index': item.arrayIndex
          });
          closeLink.bind('click.dropdownlist', function(e) {
            return self.choiceDestroyLinkClick(e);
          });
          choice.append(closeLink);
        }
        return this.searchContainer.before(choice);
      },
      choiceDestroyLinkClick: function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.isDisabled && !this.isReadOnly) {
          return this.choiceDestroy($(e.target));
        }
      },
      choiceDestroy: function(link) {
        if (this.resultDeselect(link[0].getAttribute("data-option-array-index"))) {
          this.showSearchFieldDefault();
          if (this.isMultiple && this.choicesCount() > 0 && this.searchField.val().length < 1) {
            this.resultsHide();
          }
          link.parents('li').first().remove();
          return this.searchFieldScale();
        }
      },
      choicesCount: function() {
        var option, i, len, ref;
        if (this.selectedOptionCount !== null) {
          return this.selectedOptionCount;
        }
        this.selectedOptionCount = 0;
        ref = this.select[0].options;
        for (i = 0, len = ref.length; i < len; i++) {
          option = ref[i];
          if (option.selected) {
            this.selectedOptionCount += 1;
          }
        }
        return this.selectedOptionCount;
      },
      choicesClick: function(e) {
        e.preventDefault();
        if (!(this.resultsShowing || this.isDisabled|| this.isReadOnly)) {
          return this.resultsShow();
        }
      },
      resultDeselect: function(pos) {
        var resultData;
        resultData = this.resultsData[pos];
        if (!this.select[0].options[resultData.optionsIndex].disabled) {
          resultData.selected = false;
          this.select[0].options[resultData.optionsIndex].selected = false;
          this.selectedOptionCount = null;
          this.resultClearHighlight();
          if (this.resultsShowing) {
            this.windowResults();
          }
          this.select.trigger("change", {
            deselected: this.select[0].options[resultData.optionsIndex].value
          });
          this.searchFieldScale();
          return true;
        } else {
          return false;
        }
      },
      resultsUpdateField: function() {
        this.setDefaultText();
        if (!this.isMultiple) {
          this.resultsResetCleanup();
        }
        this.resultClearHighlight();
        this.resultSingleSelected = null;
        this.resultsBuild();
        if (this.resultsShowing) {
          return this.windowResults();
        }
      },

      setByValue: function(code) {
        if (code instanceof Array) {
          for (var i=0; i < code.length; i++) {
            this.setSelected(code[i]);
          }
        } else {
          this.setSelected(code);
        }
        this.select.trigger("updated");
        //this.select.trigger("change");
      },
      callSource: function() {
        var self = this;

        if (this.source) {
          var response = function (data) {
            self.select.empty();
            self.parser.parsed = [];
            self.parser.optionsIndex = 0;
            for (var i=0; i < data.length; i++) {
              var id = (data[i].id === undefined ? data[i].value : data[i].id);
              self.select.append($("<option>" + data[i].label + "</option>").attr("value", id));
            }
            self.resultsData = self.parser.selectToArray(self.select[0]);
            return;
          };
          this.source(this.searchField.val(), response);
          return;
        }
      },
      setCode: function(code) {
        this.setByValue(code);
      },
      destroy: function() {
        this.select.next().remove();
        this.select.show();
        $(document).off("click.dropdownlist");
        this.select.closest("form").off("reset.dropdownlist");
      },
      setSelected : function(code) {
        var sel = this.select.find('option').filter(function () { return this.value == code; });
        if (sel.length > 0) {
          sel[0].selected = true;
        }
      }
    };

    // Keep the Chaining and Init the Controls or Settings
    return this.each(function() {
      var instance = $.data(this, pluginName);
      if (!instance) {
        instance = $.data(this, pluginName, new Plugin(this, settings));
        return;
      }
      if (typeof instance[options] === "function") {
        instance[options](args[1]);
        return;
      }
      if (instance && options) {
        instance.settings = $.extend({}, defaults, options);
        return;
      }

    });
  };
})( jQuery );