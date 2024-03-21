/*
* Infor Form Pattern - A Control to handle Basic Form Functionality.
*/
(function($){
  $.fn.inforForm = function( options ) {
    var settings = {
      trackDirty: true,
      autoWidth: true
    };

    return this.each(function() {
      $('body').addClass("inforHidden");
      var o = $.extend({}, settings, options); //Extend the option if any provided

      $(this).find('*').each(function(){
        var $this = $(this);

        if ($this.hasClass("inforRadioButton")) {
          $this.inforRadioButton();
          return;
        }

        if ($this.hasClass("inforToolbar") && $.fn.inforToolbar) {
          $this.inforToolbar();
          return;
        }

        if ($this.hasClass("inforApplicationNav")) {
          $this.inforApplicationNav();
          return;
        }

        if ($this.hasClass("inforIconButton") && $this.children("span").length==0) {
          $this.append('<span></span>');
          return;
        }

        if ($this.hasClass("inforIconButton") && ($this.hasClass("disabled") || $this.attr("disabled"))) {
          $this.disable();
        }

        if ($this.hasClass("inforColorPicker")) {
          $this.inforColorPicker();
        }

        if ($this.hasClass("inforSplitButton") && $this.children().length === 0) {
          $this.inforSplitButton();
        }

        if ($this.hasClass("inforToggleButton")) {
          $this.inforToggleButton();
        }

        if ($this.hasClass("inforAccordion")) {
          $this.inforAccordion();
          return;
        }

        if ($this.hasClass("inforFieldSet")) {
          $this.inforFieldSet();
          return;
        }

        if ($this.is("select[multiple]") && ($this.hasClass("inforDropDownList") || $this.hasClass("dropdown"))) {
          $this.multiselect();
        }

        if ($this.is("select") && !$this.is("select[multiple]") && ($this.hasClass("inforDropDownList") || $this.hasClass("dropdown"))) {
          $this.dropdown();
        }

        if ($this.hasClass("inforDateField") && $this.closest(".inforTriggerField").length===0) {
          $this.inforDateField();
        }

        if ($this.hasClass("inforTimeField") && $this.closest(".inforTriggerField").length===0) {
          $this.inforTimeField();
        }

        if ($this.hasClass("inforSearchField")) {
          $this.inforSearchField();
        }

        if ($this.hasClass("inforEmailField")) {
          $this.inforTriggerField();
        }

        if ($this.hasClass("inforEmailField")) {
          $this.inforTriggerField();
        }

        if ($this.hasClass("inforUrlField")) {
          $this.inforTriggerField();
        }

        if ($this.hasClass("inforCalculatorField")) {
          $this.inforCalculatorField();
        }

        if ($this.hasClass("inforSpinner")) {
          $this.inforSpinner();
        }

        if ($this.hasClass("inforListBox")) {
          $this.inforListBox();
        }

        if ($this.hasClass("inforRichTextEditor")) {
          $this.inforRichTextEditor();
        }

        if ($this.hasClass("required")) {
          $this.required();
        }

        if ($this.attr("data-mask")) {
          $this.mask($this.attr("data-mask"));
        }

        if ($this.hasClass("inforScrollableArea")) {
          $this.inforScrollableArea();
        }

        if ($this.hasClass("inforTabContainer")) {
          $this.inforTabset();
        }

        if (($this.hasClass("numericOnly") || $this.attr("data-number-format") == "n0") && !$this.parent().is(".slick-headerrow-column")) {
          $this.numericOnly();
        }

        if ($this.hasClass("decimalOnly") || $this.attr("data-number-format")) {
          $this.addClass("decimalOnly").numericOnly(true);
        }

        if ($this.is("button") && ($this.attr("title"))) {
          $this.inforToolTip();
        }

        if ($this.attr("data-localizedText")){
          var attrVal = $this.attr("data-localizedText"),
          properties = attrVal.split(', '),
          obj = {};

          $.each(properties,function(index, property) {
            var tup = property.split(':'),
            target = (tup.length === 1 ? "html" : tup[0]),
            translated = (tup.length === 1 ? Globalize.localize(tup[0]) : Globalize.localize(tup[1]));

            if (target==="html") {
              $this.html(translated);
            }

            if (target==="text") {
              $this.text(translated);
            }

            if (target==="placeholder") {
              $this.attr("placeholder", translated);
            }

            if (target==="title") {
              $this.attr("title", translated).inforToolTip();
            }
          });
        }

      });

      if (o.trackDirty) {
        $(":input").not(".noTrackDirty").not("button").each(function() {
          var input = $(this);
          if (input.closest(".slick-headerrow-column").length === 0) {
            input.trackDirty();
          }
        });
      }

      if (o.autoWidth) {
        $('.autoLabelWidth').each(function() {
          var container = $(this);
          container.find('.inforLabel, .label').autoWidth();
        });
      }

      //testing preventing FOUC - seems to work...Need a loading element
      $('body').css("opacity","").removeClass("inforHidden");
    });
  };

  $.fn.inforScrollableArea = function(  ) {

    return this.each(function() {
      var $area = $(this);
      //set the max height of this area to the bottom of the form and track any resize events...
      handleResize($area);
      $(window).on("throttledresize.inforScrollableArea",function(){
        handleResize($area);
      });

      $area.on("resize",function(){
        handleResize($area);
      });
      $area.data("uiInforScrollableArea",handleResize);
    });

    function handleResize($area) {
      var top = ($area.parent().hasClass("inforWizardPage")) ? $area.closest(".inforWizard").offset().top : $area.offset().top;
      var maxHeight= $(window).height()-top;
      //take into account the next thing below it
      var next = $area.next().not(".popupmenu, div.transparentOverlay, script").height();
      if (next === undefined) {
        next = null;
      }
      maxHeight = maxHeight-next;

      if ($area.parent().attr("id") === "bottomPane") {
        $area.parent().css("overflow", "hidden");
      }

      var bottomMargin = parseInt($area.css("margin-bottom"), 10);
      if (!isNaN(bottomMargin)) {
        maxHeight -= bottomMargin;
      }

      maxHeight = Math.floor(maxHeight);
      $area.css("max-height",maxHeight);
      $area.height(maxHeight);
      var dialog = $area.closest(".inforDialog");

      if (dialog.length>0){
        //size to the bottom of the dialog.
        maxHeight = dialog.find(".inforDialogContent").height()-15;
      }

      if ($area.parent().hasClass("inforWizardPage")) {
        var buttonBar = $area.closest(".inforWizardContainer").children(".inforWizardBottomButtonBar");
        $area.parent().children("div").each(function() {
          var $this = $(this), height = maxHeight-buttonBar.outerHeight()-15;
          $this.css({"max-height":height ,"min-height":height, "height":height});
        });
        $area.css("overflow","auto");
      } else if ($area.hasClass("inforTabContainer") || $area.hasClass("ui-tabs")) {
        $area.children("div").not(".inforTabButton").each(function() {

        var $this = $(this),
          height = maxHeight-($area.hasClass("inforVerticalTabs") ? 15 : $area.hasClass("inforModuleTabs") ? 35 : 32);

        if (navigator.userAgent.toLowerCase().match(/msie 8.0/)) {
          height -= 16;
        }

        $this.css({"max-height": height ,"min-height": height});
        if ($this.css("overflow")!=="hidden") {
          $this.css("overflow" ,"auto");
        }
      });
      $area.css("overflow","hidden");
    } else if (navigator.userAgent.toLowerCase().match(/msie 8.0/) && ($area.parent().attr("id")==="bottomPane" || $area.hasClass("ui-tabs"))) {
      $area.css("max-height", maxHeight-16);
    }
    }
  };
}(jQuery));
