/*
  Infor Context Menu
*/
(function ($) {
  $.extend($.fn, {
    inforContextMenu: function (o, callback) {
      var settings = {
        menu: false,
        blockContextMenu: true,
        invokeMethod: "rightClick",
        positionBelowElement: false,
        offsetLeft: null,
        offsetTop: null,
        position: null,
        event: null,
        srcElement: null,
        beforeOpening: null,
        backgroundIFrame: false,
        iframeFix: false
      },
      self = $(this),
      openFunc;

      // Defaults
      o = $.extend({}, settings, o);

      // Loop each context menu
      self.each(function () {
        var el = $(this),
          offset = el.offset();

        el.wrapMenu(o);

        // Simulate a true right click
        if (o.invokeMethod == "rightClick") {
          el.mousedown(function (e) {
            var evt = e;
            if (evt.button == 2) {
              evt.stopPropagation();
              $(this).mouseup(function (e) {
              e.stopPropagation();
              var elem = $(this);
              elem.off('mouseup');
              if (evt.button == 2) {
                if (o.beforeOpening) {
                  o.beforeOpening(e, el);
                }
                elem.openMenu(e, o, el, callback, offset, evt, elem);
              }
            });
            }
          });
        } else if (o.invokeMethod == "click") {
          el.click(function (e) {
            var evt = e,
              elem = $(this);

            e.stopPropagation();
            if (evt.button === 0) {
              if (o.beforeOpening) {
                o.beforeOpening(e, el);
              }
              elem.openMenu(e, o, el, callback, offset, evt, elem);
            }
          });
        } else if (o.invokeMethod == "submenu") {
          el.data("open", function (e) {
            var srcElement = el;
            if (o.beforeOpening) {
              o.beforeOpening(e, el);
            }
            srcElement.openMenu(e, o, el, callback, offset, e, srcElement);
            return $('#' + o.menu);
          });

          el.hover(function (e) {
            openFunc = el.data("open");
            openFunc(e);
            e.stopPropagation();
          });

          el.find("ul").hover(function (e) {
            e.stopPropagation();
          });

          $('#' + o.menu).addClass("submenu");
          el.siblings("li:not(.arrow)").hoverIntent(function (e) {
            var li = $(this);
            if ($(this).hasClass("arrow")) {
              return;
            }
            li.parent().find(".inforMenu.submenu").hide();
          }, function () { });

        } else if (o.invokeMethod == "toggle") {
          el.click(function (e) {
            var menu = $('#' + o.menu),
            isOpen = menu.data("isOpen"),
            menusOnForm = $(".inforMenuOptions"),
            evt = e,
            srcElement = $(this);

            $('#' + o.menu).parent().hide();
            if (!$(this).is(":enabled") && $(this).is("button")) {
              return;
            }
            if (o.beforeOpening) {
              o.beforeOpening(e, el);
            }

            menusOnForm.hide();
            menusOnForm.data("isOpen", false);

            if (isOpen === true) {
              menu.data("isOpen", false);
            } else {


              e.stopPropagation();
              if (evt.button === 0) {
                $(this).openMenu(e, o, el, callback, offset, evt, srcElement);
              }
              menu.data("isOpen", true);
            }
          });
        } else if (o.invokeMethod == "immediate") {
          if (!offset) {
            offset = $('body').offset();
          }
          el.openMenu(o.event, o, el, callback, offset, o.event, o.srcElement);
        }


        // Disable browser context menu (requires both selectors to work in IE/Safari + FF/Chrome)
        if (o.blockContextMenu) {
          $(el).add($('.inforMenu')).on('contextmenu.inforcontextmenu', function () {
            return false;
          });
        }
      });
      return self;
    },
    _addIFrame: function (elem) {
      var bkgrndIFrame = $('<div style="position:absolute" class="inforBkgrndIFrame"><iframe frameborder="0" style="height:100px;width:100px;"></iframe></div>').appendTo("body");
      bkgrndIFrame.css({
        "left": elem.offset().left,
        "top": elem.offset().top,
        "z-index": 1
      });
      bkgrndIFrame.children().eq(0).height(elem.outerHeight()).width(elem.outerWidth());
      bkgrndIFrame.show();
      elem.data("iFrame", bkgrndIFrame);
    },
    wrapMenu: function (o) {
      var $menuElem = $('#' + o.menu);

      // Add contextMenu class
      if (!$menuElem.hasClass('inforMenuOptions')) {  //already wrapped..
        $menuElem.addClass('inforMenuOptions').wrap("<div class='inforMenu'></div>");
      }
    },
    destroy: function () {
      $(el).add($('.inforMenu')).off('contextmenu.inforcontextmenu');
    },
    closeMenu: function (o, el) {
      var $menu = $(this),
        menu = $('#' + o.menu),
        menusOnForm = $(".inforMenuOptions");

      if (!$menu.hasClass("submenu")) {
        $(document).off("keydown.inforcontextmenu" + o.menu);

        if (o.iframeFix) {
          $("iframe").contents().find("body").off("click.inforcontextmenu");
        }
      }

      //$(el).add($('.inforMenu')).off('contextmenu.inforcontextmenu');
      $(".inforTabset").find("a").off('mousedown');

      $menu.fadeOut(150);
      $menu.parent(".inforMenu").fadeOut(150);
      $menu.data("isOpen", false);
      menu.data("isOpen", false);

      $('#' + o.menu).hide();
      menusOnForm.hide();
      menusOnForm.data("isOpen", false);
      menusOnForm.closest(".inforMenu").hide();

      if (o.backgroundIFrame) {
        $(".inforBkgrndIFrame").remove();
      }

      if (o.onClose) {
        o.onClose(menu);
      }
      return true;
    },
    handleKeyPress: function (e, $menu) {
      var openSubs = $(".inforMenu.submenu:visible"),
        $activeElement = null,
        $li = null, openFunc, subMenu;
      switch (e.keyCode) {
      case 38:
        // up
        e.stopPropagation();
        e.preventDefault();
        if ($menu.find('LI.focus').size() === 0) {
          $activeElement = $menu.find('LI:not(.headerText):not(.separator):last').addClass("focus");
        } else {
          $activeElement = $menu.find('LI.focus').removeClass("focus").prevAll('LI:not(.disabled):not(.headerText):not(.separator)').eq(0).addClass("focus");
          if ($menu.find('LI.focus').size() === 0) {
            $activeElement = $menu.find('LI:not(.headerText):not(.separator):last').addClass("focus");
          }
        }
        $activeElement.find("a").focus();
        break;
      case 40:
        // down
        e.stopPropagation();
        e.preventDefault();
        if ($menu.find('LI.focus').size() === 0) {
          $activeElement = $menu.find('LI:not(.headerText):not(.separator):first').addClass("focus");
        } else {
          $activeElement = $menu.find('LI.focus').removeClass("focus").nextAll('LI:not(.disabled):not(.headerText):not(.separator)').eq(0).addClass("focus");
          if ($menu.find('LI.focus').size() === 0) {
            $activeElement = $menu.find('LI:not(.headerText):not(.separator):first').addClass("focus");
          }
        }
        $activeElement.find("a").focus();
        break;
      case 39:
        // left
        $li = $menu.find('LI.focus.arrow');
        openFunc = $li.data("open");
        if (openFunc) {
          subMenu = openFunc(e);
          subMenu.find('LI:not(.headerText):not(.separator):first').addClass("focus");
          subMenu.find("a").focus();
          subMenu.data("parentLi", $li);
          $li.removeClass("focus");
        }
        break;
      case 37:
        // right
        $li = $menu.find('LI.focus');
        if ($li.parent().hasClass("submenu")) {
          //$menu.hide();
          $li.parent().parent().hide();
          if ($li.parent().data("parentLi")) {
            $li.parent().data("parentLi").addClass("focus").find("a").focus();
          }
          $li.removeClass("focus");
        }
        break;
      case 32:  //space
        $li = $menu.find('LI.focus');
        if ($li.hasClass("checkbox")) {
          $li.find("input").toggleChecked();
        }
      case 13:
        // enter
        //will click since it has focus....
        break;
      case 27:
        // esc
        $(document).trigger('click');
        break;
      }
    },
    openMenu: function (e, o, el, callback, offset, evt, srcElement, deffered) {
      var $container = $('#' + o.menu).closest(".inforMenu"),
        otherMenus = null,
        d = {}, x, y,
        self = this,
        elem = $(el),
        isVisible = $container.is(":visible"),
        $menu = $('#' + o.menu),
        handleKeyPress, openFunc, subMenu, newY, content, scrollWidth;

      if (isVisible) {
        return;
      }

      if ($menu.children().length == 0) {
        return;
      }

      if (o.blockContextMenu) {
        elem.add($('.inforMenu')).on('contextmenu.inforcontextmenu', function () {
          return false;
        });
      }

      // Hide context menus that may be showing excluding the parent menu
      if (srcElement) {
        otherMenus = $(".inforMenu").not(srcElement.parents(".inforMenu")).not(srcElement.data("parentMenu"));
      } else {
        otherMenus = $(".inforMenu");
      }

      otherMenus.hide();
      $container.hide();

      //hide any visible tooltips
      $("#inforTooltip").hide();

      if ($(el).hasClass('disabled')) {
        return false;
      }

      // Detect mouse position
      if (!o.positionBelowElement) {
        if (self.innerHeight) {
          d.pageYOffset = self.pageYOffset;
          d.pageXOffset = self.pageXOffset;
          d.innerHeight = self.innerHeight;
          d.innerWidth = self.innerWidth;
        } else if (document.documentElement && document.documentElement.clientHeight) {
          d.pageYOffset = document.documentElement.scrollTop;
          d.pageXOffset = document.documentElement.scrollLeft;
          d.innerHeight = document.documentElement.clientHeight;
          d.innerWidth = document.documentElement.clientWidth;
        } else if (document.body) {
          d.pageYOffset = document.body.scrollTop;
          d.pageXOffset = document.body.scrollLeft;
          d.innerHeight = document.body.clientHeight;
          d.innerWidth = document.body.clientWidth;
        }

        if (e) {
          x = (e.pageX) ? e.pageX : e.clientX + (d.scrollLeft ? d.scrollLeft : 0);
          y = (e.pageY) ? e.pageY : e.clientY + (d.scrollTop ? d.scrollTop : 0);
        }
      } else {
        x = $(el).offset().left - 1;
        y = $(el).offset().top + $(el).height() + 4;
      }

      // Hover events
      $menu.find('A').mouseover(function () {
        $menu.find('LI.focus').removeClass("focus");
        $(this).parent().addClass("focus");
      }).mouseout(function () {
        $menu.find('LI.focus').removeClass("focus");
      });

      if (!$menu.hasClass("submenu")) {
        $(document).off("keydown.inforcontextmenu").on("keydown.inforcontextmenu" + o.menu, function (e) {
          self.handleKeyPress(e, $menu);
        });
      }

      //Handle Selection of Menu Items
      $('#' + o.menu).find('LI:not(.disabled):not(.headerText) ').off('click.inforcontextmenu').on("click.inforcontextmenu", function (e) {
        var action, item, menu;

        if ($(e.currentTarget).find("input.inforCheckbox").length > 0) {
          var check = $(e.currentTarget).find("input.inforCheckbox");

          check.trigger("click");
          if (o.invokeMethod === "click") {
               check.toggleChecked();
          }
          return false;
        }

        action = "";
        item = $(this).find("a");

        if (item.attr("href")) {
          if (item.attr("href").charAt(0) !== '#') {
            return true;
          }

          action = item.attr("href").substr(1);
        }

        //prevent clicks from reopening the menu
        e.stopPropagation();
        e.preventDefault();

        if ($(this).parent().hasClass("arrow")) {
          return false;
        }

        $(document).off('click.inforcontextmenu').off('keydown.inforcontextmenu' + o.menu);

        menu = $('#' + o.menu);
        menu.closeMenu(o, el);

        // Callback
        if (callback) {
          callback(action, $(srcElement), {
            x: x - offset.left,
            y: y - offset.top,
            docX: x,
            docY: y
          }, $(this));
        }

        return false;
      });

      //Use a click and an overlay. Click is to help with right click take over.
      setTimeout(function () {
        $(document).on("click.inforcontextmenu", function (e) {
          if (e.button == 2) {     //right click in mozilla
            return;
          }
          $menu.closeMenu(o, el);
        });

        if (o.iframeFix) {
          //attach to iframes
          $("iframe").ready(function () {
            $("iframe").contents().find("body").on("click.inforcontextmenu", function () {
              $menu.closeMenu(o, el);
            });
          });
        }
      }, 1);

      $(".inforTabset").find("a").mousedown(function () {
        $menu.closeMenu(o, el);
      });

      //Adjust the padding if there are no images
      if ($menu.find('.icon').length >0) {
        $menu.addClass("hasImages");
      }

      //localize the grid options menu.
      if ($menu.attr("id") == "inforFilterConditions") {
        $menu.find('a[href="#greaterThan"]').html(Globalize.localize("GreaterThan"));
        $menu.find('a[href="#greaterThanOrEquals"]').html(Globalize.localize("GreaterThanOrEquals"));
        $menu.find('a[href="#lessThan"]').html(Globalize.localize("LessThan"));
        $menu.find('a[href="#lessThanOrEquals"]').html(Globalize.localize("LessThanOrEquals"));
        $menu.find('a[href="#equals"]').html(Globalize.localize("EqualsStr"));
        $menu.find('a[href="#doesNotEqual"]').html(Globalize.localize("DoesNotEqual"));
        $menu.find('a[href="#contains"]').html(Globalize.localize("Contains"));
        $menu.find('a[href="#doesNotContain"]').html(Globalize.localize("DoesNotContain"));
        $menu.find('a[href="#isEmpty"]').html(Globalize.localize("IsEmpty"));
        $menu.find('a[href="#isNotEmpty"]').html(Globalize.localize("IsNotEmpty"));
        $menu.find('a[href="#startsWith"]').html(Globalize.localize("StartsWith"));
        $menu.find('a[href="#doesNotStartWith"]').html(Globalize.localize("DoesNotStartWith"));
        $menu.find('a[href="#endsWith"]').html(Globalize.localize("EndsWith"));
        $menu.find('a[href="#doesNotEndWith"]').html(Globalize.localize("DoesNotEndWith"));
        $menu.find('a[href="#eitherSelectedorNotSelected"]').html(Globalize.localize("EitherSelectedorNotSelected"));
        $menu.find('a[href="#selected"]').html(Globalize.localize("Selected").replace(":", ""));
        $menu.find('a[href="#notSelected"]').html(Globalize.localize("NotSelected"));
        $menu.find('a[href="#between"]').html(Globalize.localize("Between"));
        $menu.find('a[href="#today"]').html(Globalize.localize("Today"));
      }

      //Detect and Apply submenus.
      $.each($menu.find('li > ul'), function (i) {
        var submenu = $(this),
        parentLi = submenu.parent("li").addClass("arrow"),
        id = submenu.attr("id");

        if (!id) {
          id = "submenu" + i;
          submenu.attr("id", id);
        }

        if (Globalize.culture().isRTL) {
          submenu.parent("li").siblings("li").css("padding-left", "10px");
        }

        parentLi.data("parentMenu", $menu).inforContextMenu({
          menu: id,
          invokeMethod: "submenu",
          event: e,
          position: {
            my: (Globalize.culture().isRTL ? "right top" : "left top-10"),
            at: (Globalize.culture().isRTL ? "left top" : "right top"),
            of: parentLi,
            collision: "flipfit"
          }
        }, function (action, el, pos, item) {
          if (callback) {
            if (item.attr("href")) {
              action = item.attr("href").substr(1);
            }
            callback(action, $(srcElement), {
              x: x - offset.left,
              y: y - offset.top,
              docX: x,
              docY: y
            }, $(this));
          }
        });

        submenu.parent(".inforMenu").addClass("submenu");
      });

      if (Globalize.culture().isRTL) {
        $menu.find('li.arrow').css("padding-left", "0px");
      }

      // Show the menu
      $(document).off('click.inforcontextmenu');

      if (o.offsetLeft) {
        x = x + o.offsetLeft;
      }

      if (o.offsetTop) {
        y = y + o.offsetTop;
      }

      if (!deffered) {
        $('#' + o.menu).show();
        $container.css({"opacity" : 0, "top" : -100, "left" : x}).show();
      }

      //add padding for seperators..
      $menu.find(".separator").prev().css("margin-bottom", "3px");

      //Adjust if the menu wants to go off the right of the page:
      if (($container.width() + x + 20) >= ($(window).width())) {
        x = $(window).width() - $container.width() - 3;
      }

      $container.css({
        top: y,
        left: x
      });

      if (o.position) {
        $container.position(o.position);
      }

      //Adjust if the menu wants to go off the right of the page:
      if (o.invokeMethod === "submenu" && ($container.width() + x + 45) >= ($(window).width())) {
        o.position.my = (Globalize.culture().isRTL ? "left top" : "right top");
        o.position.at = (Globalize.culture().isRTL ? "right top" : "left top");
        $container.position(o.position);
      }

      //make the menu scroll if going off the bottom
      if ($container.height() + $container.offset().top > Math.max($(window).height(), $("body").height())) {
        $container.css("overflow", "visible");
        $container.css("max-height", $(window).height() - 40);
        $container.css("width", $container.width() + 12 + "px");
      }

      //flip if the menu up if it wants go off the bottom
      if ($container.offset().top > Math.max($(window).height(), $("body").height()) - $container.height()) {
        newY = $container.offset().top;
        content = $container.find(".inforMenuOptions");
        scrollWidth = content.width();
        newTop = newY - $container.height();

        if (newTop < 0 || offset.top > ($(window).height() - (offset.top + el.height()))) {
          newTop = 5;
          $container.css('height', ($(window).height()));
        }

        $container.css({
          top: newTop,
          width: scrollWidth + 22 + "px"
        });
        content.css({
          "overflow": "visible",
          width: scrollWidth + 22 + "px"});

        if (o.invokeMethod == "rightClick") {
          $container.css({
            height: 'auto'
          });

          if (parseInt(srcElement.offset().top) - parseInt($container.height()) > 0) {
            newTop = parseInt(srcElement.offset().top) - parseInt($container.height()) + 'px';
          }

          $container.css({
            top: newTop
          });

//          console.log($container, $container.find('.submenu'));
      //    $container.find('.submenu').css('position', 'fixed');
        }

        if (!o.position) {
          $container.css({left: ($container.position().left - 12) + "px"});
        }
      }

      if (o.backgroundIFrame) {
        self._addIFrame($container);
      }
      $container.hide().css("opacity", 1).show();
    }
  });
})(jQuery);
