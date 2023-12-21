/*
* Infor Splitter
*
* Based on original code by http://krikus.com/js/splitter but now completely overhauled.
*
* Which is Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*/

(function ($) {
  $.widget("ui.inforSplitter", {
    options: {
      splitHorizontal: false, //vertical or horizontal
      splitVertical: true, //vertical or horizontal
      savePosition: true, //Save the split value to a cookie?
      initialSplitPerc: null, //initial split size.
      fixedSide: null //can be left or right. This side will stay exact amount of  pixels while the other side is responsive.
    },
    _splitBar: null,
    _splitButton: null,
    _sideA: null,
    _sideB: null,
    _windowHeight: null,
    _windowWidth: null,
    _perc: null,
    _create: function () {
      var $splitter = $(this.element),
        self = this,
        o = this.options,
        opts, perc, elementId, reinit, storageId, cookieVal, rtl;

      this._windowHeight = $(window).height();
      this._windowWidth = $(window).width();
      $splitter.addClass("inforSplitter").css({ "position": "relative" });

      this._perc = 0.20;
      if (o.initialSplitPerc) {
        this._perc = o.initialSplitPerc;
      }
      this._perc = this._perc * 100;
      
      // Default opts
      o.direction = (o.splitHorizontal ? 'h' : 'v');
      opts = $.extend({
        animSpeed: 100 //animation speed in ms
      }, {
        v: { // Vertical
          moving: "left",
          sizing: "width",
          eventPos: "pageX",
          splitbarClass: "inforSplitBarVertical",
          buttonClass: "inforSplitButtonVertical"
        },
        h: { // Horizontal
          moving: "top",
          sizing: "height",
          eventPos: "pageY",
          splitbarClass: "inforSplitBarHorizontal",
          buttonClass: "inforSplitButtonHorizontal"
        }
      }[o.direction], this.options);

      this.options = opts;
      //Create splitbar and setup elements
      this._splitBar = $("<div><span class='inforSplitButtonTop'></span><span class='inforSplitButtonMiddle'></span></div>");

      if (o.direction == 'v') {
        this._sideA = $('#leftPane');
        this._sideB = $('#rightPane');
        if (this._sideA.length === 0 && this._sideB.length === 0) {
          this._sideA = $splitter.find('>.leftPane');
          this._sideB = $splitter.find('>.rightPane');
        }
        this._sideA.css("width", this._perc + "%");
        this._sideB.css("width", (100 - this._perc) + "%");
        this._splitBar.css({ "left": "calc( " + this._perc + "% - 20px)"});
      } else {
        this._sideA = $('#topPane');
        this._sideB = $('#bottomPane');
        if (this._sideA.length === 0 && this._sideB.length === 0) {
          this._sideA = $splitter.find('>.topPane');
          this._sideB = $splitter.find('>.bottomPane');
        }
        this._sideA.css("height", this._perc + "%");
        this._sideB.css("height", (100 - this._perc) + "%");
        this._splitBar.css({ "top": this._perc + "%" });
      }

      this._sideA.after(this._splitBar);
      this._splitBar.attr({
        "class": opts.splitbarClass,
        unselectable: "on"
      }).css({
        "user-select": "none",
        "-webkit-user-select": "none",
        "-moz-user-select": "none",
        "position": "absolute"
      }).draggable({
        iframeFix: true,
        scroll: false,
        cursor: (o.direction == 'v' ? "ew-resize" : "ns-resize"),
        axis: (o.direction == 'v' ? "x" : "y"),
        containment: this._splitBar.parent(),
        stop: function (event, ui) {
          self._endDrag(event, ui);
          self._splitBar.removeClass("dragging right left up down");
          $('body').enableSelection();
          $('iframe').contents().enableSelection();
        },
        drag: function (event, ui) {
          var thisX, lastX;
          // get the last left position (think x co-ordinate) to switch the styles.
          if (o.direction == 'v') {
            thisX = ui.offset.left;
            lastX = ui.helper.data('lastLeft') || thisX;

            if (thisX < lastX) {
              self._splitBar.removeClass("right").addClass("left");
            }
            if (thisX > lastX) {
              self._splitBar.removeClass("left").addClass("right");
            }
            ui.helper.data('lastLeft', thisX);
          } else {
            thisX = ui.offset.top;
            lastX = ui.helper.data('lastTop') || thisX;

            if (thisX < lastX) {
              self._splitBar.removeClass("down").addClass("up");
            }
            if (thisX > lastX) {
              self._splitBar.removeClass("up").addClass("down");
            }
            ui.helper.data('lastTop', thisX);
          }

          self._splitDrag(event, ui);
        },
        start: function (event, ui) {
          self._splitBar.css("-webkit-user-select", "none");
          $splitter._initPos = self._splitBar.position();
          $splitter._initPos[opts.moving] -= self._splitBar[opts.sizing]();
          self._splitBar.addClass("dragging");
          $('body').disableSelection();
          $('iframe').contents().disableSelection();
        }
      });

      //set up the hover drag
      this._splitButton = $('<div></div>').attr({
        "class": opts.buttonClass,
        unselectable: "on"
      });

      //this._splitBar.append(this._splitButton);
      this._splitBar.append(this._splitButton).append("<span class='inforSplitButtonBottom'></span>");

      //reset size to default.
      this._setDimensions();

      perc = (((this._splitBar.position()[opts.moving] - $splitter.offset()[opts.moving]) / $splitter[opts.sizing]()) * 100).toFixed(1);

      if ($splitter.parent().hasClass("ui-tabs-panel")) {
        $splitter.parent().css({
          "overflow": "hidden",
          "padding": " 1px 0"
        });
      }

      //set size saved in the localStorage
      if (o.savePosition) {
        elementId = $splitter.attr("id");
        rtl = (Globalize.culture().isRTL ? "rtl" : "");

        storageId = window.location.pathname + 'inforSplitter' + rtl + '/#' + (!elementId ? "inforSplitter" + o.direction : elementId);
        storageVal = localStorage.getItem(storageId);
        if (storageVal) {
          perc = storageVal;
          this.splitTo(perc);
        }
      }

      reinit = function () {
        self.splitTo(self._perc);
      };

      this.handleResize = function (e, force) {
        if (self._resizeTimer) {
          clearTimeout(self._resizeTimer);
        }
        if (self._windowHeight != $(window).height() || force) {
          self._setDimensions();
        }

        if (force || (self._windowHeight != $(window).height()) || (self._windowWidth != $(window).width())) {
          self._resizeTimer = setTimeout(reinit, 1);
          self._windowHeight = $(window).height();
          self._windowWidth = $(window).width();
        }
      };

      $(window).bind('throttledresize.inforSplitter', this.handleResize);
      this.handleResize();
    },
    _setDimensions: function () {
      var root = $(this.element),
        h = $(window).height() - root.offset().top,
        w = root.parent().width() - root.offset().left,
        middle = root.find(".inforSplitButtonMiddle:first");


      if (this.options.direction == 'v') {
        //look for content below
        if (root.parent().is(".inforScrollableArea")) {
          h = parseInt(root.parent().height(), 10);
        }
        root.height(h + "px");
        middle.height((h - 200) + "px");
        root.find(".inforSplitBarVertical").height(h);
        root.find(".inforSplitButtonVertical").css("top", (h/2));
        root.find(".inforSplitButtonBottom").height(h-middle.height());
      } else {
        root.height(h + "px");
        if (root.offset().left > 0) {
          w = root.parent().width();
        }
        middle.width((w - 200) + parseInt(root.offset().left, 10) + "px").height("10px");
        root.find(".inforSplitBarHorizontal").width(w);
        root.find(".inforSplitButtonTop").width(w-middle.width()).height(10);
        root.find(".inforSplitButtonBottom").height(10);
      }
    },
    destroy: function () {
      var elem = $(this.element);

      elem.find(".inforSplitBarVertical").remove();
      elem.find(".inforSplitBarHorizontal").remove();

      $(window).unbind('throttledresize.inforSplitter');
      $.Widget.prototype.destroy.apply(this, arguments);
    },
    _splitDrag: function (event, ui) {
      var o = this.options,
      $splitter = $(this.element),
      p = ui.offset, perc;

      perc = (((p[o.moving] - $splitter.offset()[o.moving]) / $splitter[o.sizing]()) * 100).toFixed(1);

      self.fixedRight = parseInt($splitter.width(), 10) - ui.position.left;
      this.splitTo(perc);
    },
    _endDrag: function (event, ui) {
      var o = this.options,
        $splitter = $(this.element),
        p = ui.offset, perc;

      $splitter.children().css("-webkit-user-select", "text"); // let Safari select text again
      $splitter._initPos = 0;
    },
    //Peforms split to a percentage
    getSplitPercentage: function () {
      return (this._perc);
    },
    resizeTimer: null,
    cookieTimer: null,
    //Peforms split to a percentage
    splitTo: function (perc) {
      var o = this.options,
      $splitter = $(this.element),
      percpx, children, savePerc, rtl, elementId, storageId, barsize, splitsize, sizeA, sizeB;

      savePerc = perc;
      if (typeof Globalize != "undefined" && Globalize.culture().isRTL && o.direction === "v") {
        perc = 100 - perc;
      }

      this._perc = perc;
      this._setDimensions();

      clearTimeout(self.cookieTimer);
      self.cookieTimer = setTimeout(function() {
        if (o.savePosition) {
          elementId = $splitter.attr("id"),
          rtl = (Globalize.culture().isRTL ? "rtl" : "");

          storageId = window.location.pathname + 'inforSplitter' + rtl + '/#' + (!elementId ? "inforSplitter" + o.direction : elementId);
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(storageId, savePerc);
          }
        }
      }, 600);

      barsize = this._splitBar[o.sizing]();
      splitsize = $splitter[o.sizing]();

      percpx = Math.max(parseInt((splitsize / 100) * perc, 10), 0);

      if (o.fixedSide == "left" && o.direction == 'v') {
        var left = parseInt(this._splitBar.css("left"), 10);
        if (left >0) {
          percpx = left - 5;
        } else {
          percpx = this._sideA.width();
        }
      }

      if (o.fixedSide == "right" && o.direction == 'v') {
        var left = parseInt(this._splitBar.css("left"), 10);
        if (left > 0) {
          percpx = splitsize - (self.fixedRight);
        } else {
          self.fixedRight = this._sideB.width() + 20;
          percpx = splitsize - this._sideB.width() - 20;
        }
      }

      sizeA = Math.max(0, (perc== 100 ? (percpx - barsize - 5) : percpx));
      sizeB = Math.max(0, (splitsize - (percpx)) - barsize - 5);

      this._sideA.show().css(o.sizing, sizeA + 'px');
      this._sideB.show().css(o.sizing, sizeB + 'px');
      this._splitButton.show();

      if (this._splitBar.css("position") != "absolute") {
        this._splitBar.css("position", "absolute");
      }
      if (o.direction == 'h') {
        this._splitBar.css("top", this._sideA.height());
      } else {
        if (Globalize.culture().isRTL) {
          this._splitBar.css("left", this._sideB.width() + 22);
        } else {
          this._splitBar.css("left", this._sideA.width() + (this.element.closest('.inforVerticalTabs').length === 1 ? 0 : this._sideA.offset().left));
        }
      }

      children = $splitter.children();

      children.trigger("resize");
      clearTimeout(self.resizeTimer);
      self.resizeTimer = setTimeout(function() {
        children.find(".inforDataGrid").each(function () {
          var grid = $(this).data("gridInstance");
          if (grid) {
            grid.resizeCanvas();
          }
        });
      }, 200);

      //call resize on any child splitters
      children.find(".inforSplitter").each(function (e) {
        var splitter = $(this).data("uiInforSplitter"),
          parent = $(this).parent().parent(".inforSplitter");
        if (splitter) {
          splitter.handleResize(e, true);
        }
      });
    }
  });
})(jQuery);
