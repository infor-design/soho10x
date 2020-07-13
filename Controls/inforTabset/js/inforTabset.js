/*
* jQuery UI Tabs 1.8.11
*
* Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
* Dual licensed under the MIT or GPL Version 2 licenses.
* http://jquery.org/license
*
* http://docs.jquery.com/UI/Tabs
*/
(function ($, undefined) {

  var tabId = 0,
    listId = 0;

  function getNextTabId() {
    return ++tabId;
  }

  function getNextListId() {
    return ++listId;
  }

  $.widget("ui.tabs", {
    options: {
      add: null,
      ajaxOptions: null,
      cache: false,
      cookie: null, // e.g. { expires: 7, path: '/', domain: 'jquery.com', secure: true }
      disable: null,
      disabled: [],
      enable: null,
      event: "click",
      idPrefix: "ui-tabs-",
      panelTemplate: "<div></div>",
      remove: null,
      select: null,
      spinner: null,
      tabTemplate: "<li><a href='#{href}'>#{label}</a></li>"
    },

    _create: function () {
      this._tabify(true);
    },

    _setOption: function (key, value) {
      if (key == "selected") {
        this.select(value);
      } else {
        this.options[key] = value;
        this._tabify();
      }
    },

    _tabId: function (a) {
      return a.title && a.title.replace(/\s/g, "_").replace(/[^\w\u00c0-\uFFFF-]/g, "") || this.options.idPrefix + getNextTabId(); //ignore jslint
    },

    _sanitizeSelector: function (hash) {
      // we need this because an id may contain a ":"
      return hash.replace(/:/g, "\\:");
    },

    _cookie: function () {
      var cookie = this.cookie || (this.cookie = this.options.cookie.name || "ui-tabs-" + getNextListId());
      return $.cookie.apply(null, [cookie].concat($.makeArray(arguments)));
    },

    _ui: function (tab, panel) {
      return {
        tab: tab,
        panel: panel,
        index: this.anchors.index(tab)
      };
    },

    _cleanup: function () {
      // restore all former loading tabs labels
      this.lis.filter(".ui-state-processing")
        .removeClass("ui-state-processing")
        .find("span:data(label.tabs)")
        .each(function () {
          var el = $(this);
          el.html(el.data("label.tabs")).removeData("label.tabs");
        });
    },

    _tabify: function (init) {
      var self = this,
        o = this.options,
        addState, removeState,
        hideFx, showFx, showTab, hideTab,
        fragmentId = /^#.+/; //ignore jslint Safari 2 reports '#' for an empty hash

      this.list = this.element.find("ol,ul").eq(0);
      this.lis = $(" > li:has(a[href])", this.list);

      this.anchors = this.lis.map(function () {
        return $("a", this)[0];
      });
      this.panels = $([]);

      this.anchors.each(function (i, a) {
        var href = $(a).attr("href"),
          // For dynamically created HTML that contains a hash as href IE < 8 expands
          // such href to the full page url with hash and then misinterprets tab as ajax.
          // Same consideration applies for an added tab with a fragment identifier
          // since a[href=#fragment-identifier] does unexpectedly not match.
          // Thus normalize href attribute...
          hrefBase = href.split("#")[0],
          baseEl, id, $panel;

        if (hrefBase && (hrefBase === window.location.toString().split("#")[0] || (baseEl = $("base")[0]) && hrefBase === baseEl.href)) {
          href = a.hash;
          a.href = href;
        }

        // inline tab
        if (fragmentId.test(href)) {
          self.panels = self.panels.add(self.element.find(self._sanitizeSelector(href)));
          // remote tab
          // prevent loading the page itself if href is just "#"
        } else if (href && href !== "#") {
          // required for restore on destroy
          $.data(a, "href.tabs", href);

          // TODO until #3808 is fixed strip fragment identifier from url
          // (IE fails to load from such url)
          $.data(a, "load.tabs", href.replace(/#.*$/, "")); //ignore jslint

          id = self._tabId(a);
          a.href = "#" + id;
          $panel = self.element.find("#" + id);
          if (!$panel.length) {
            $panel = $(o.panelTemplate)
              .attr("id", id)
              .addClass("ui-tabs-panel ui-corner-bottom")
              .insertAfter(self.panels[i - 1] || self.list);
            $panel.data("destroy.tabs", true);
          }
          self.panels = self.panels.add($panel);
          // invalid tab href
        } else {
          o.disabled.push(i);
        }
      });

      // initialization from scratch
      if (init) {
        // attach necessary classes for styling
        this.element.addClass("ui-tabs");
        this.panels.addClass("ui-tabs-panel");

        // Selected tab
        // use "selected" option or try to retrieve:
        // 1. from fragment identifier in url
        // 2. from cookie
        // 3. from selected class attribute on <li>
        if (o.selected === undefined) {
          if (window.location.hash) {
            this.anchors.each(function (i, a) {
              if (a.hash == window.location.hash) {
                o.selected = i;
                return false;
              }
            });
          }
          if (typeof o.selected !== "number" && o.cookie) {
            o.selected = parseInt(self._cookie(), 10);
          }
          if (typeof o.selected !== "number" && this.lis.filter(".ui-tabs-selected").length) {
            o.selected = this.lis.index(this.lis.filter(".ui-tabs-selected"));
          }
          o.selected = o.selected || (this.lis.length ? 0 : -1);
        } else if (o.selected === null) {
          o.selected = -1;
        }

        // sanity check - default to first tab...
        o.selected = (((o.selected >= 0 && this.anchors[o.selected]) || o.selected < 0) ? o.selected : 0);

        // Take disabling tabs via class attribute from HTML
        // into account and update option properly.
        // A selected tab cannot become disabled.
        o.disabled = $.unique(o.disabled.concat(
        $.map(this.lis.filter(".ui-state-disabled"), function (n, i) {
          return self.lis.index(n);
        }))).sort();

        if ($.inArray(o.selected, o.disabled) != -1) {
          o.disabled.splice($.inArray(o.selected, o.disabled), 1);
        }

        // highlight selected tab
        this.panels.addClass("ui-tabs-hide");
        this.lis.removeClass("ui-tabs-selected ui-state-active");
        // check for length avoids error when initializing empty list
        if (o.selected >= 0 && this.anchors.length) {
          self.element.find(self._sanitizeSelector(self.anchors[o.selected].hash)).removeClass("ui-tabs-hide");
          this.lis.eq(o.selected).addClass("ui-tabs-selected ui-state-active");

          // seems to be expected behavior that the show callback is fired
          self.element.queue("tabs", function () {
            self._trigger("show", null,
            self._ui(self.anchors[o.selected], self.element.find(self._sanitizeSelector(self.anchors[o.selected].hash))[0]));
          });

          this.load(o.selected);
        }
        // update selected after add/remove
      } else {
        o.selected = this.lis.index(this.lis.filter(".ui-tabs-selected"));
      }

      // set or update cookie after init and add/remove respectively
      if (o.cookie) {
        this._cookie(o.selected, o.cookie);
      }

      // disable tabs
      this.lis.each(function (index) {
        var $li = $(this);

        $li[$.inArray(index, o.disabled) != -1 && !$li.hasClass("ui-tabs-selected") ? "addClass" : "removeClass"]("ui-state-disabled");

        if ($li.hasClass("ui-state-disabled")) {
          $li.find("a").attr("tabindex", "-1");
        } else {
          $li.find("a").removeAttr("tabindex");
        }
      });

      // reset cache if switching from cached to not cached
      if (o.cache === false) {
        this.anchors.removeData("cache.tabs");
      }

      // remove all handlers before, tabify may run on existing tabs after add or option change
      this.lis.add(this.anchors).unbind(".tabs");

      if (o.event !== "mouseover") {
        addState = function (state, el) {
          if (el.is(":not(.ui-state-disabled)")) {
            el.addClass("ui-state-" + state);
          }
        };
        removeState = function (state, el) {
          el.removeClass("ui-state-" + state);
        };
        this.lis.bind("mouseover.tabs", function () {
          addState("hover", $(this));
        });
        this.lis.bind("mouseout.tabs", function () {
          removeState("hover", $(this));
        });
        this.anchors.bind("focus.tabs", function () {
          addState("focus", $(this).closest("li"));
          $(this).parent().addClass("ui-state-focus");
        });
        this.anchors.bind("blur.tabs", function () {
          removeState("focus", $(this).closest("li"));
          $(this).parent().removeClass("ui-state-focus");
        });
      }

      // Show a tab...
      showTab = showFx ? function (clicked, $show) {
        $(clicked).closest("li").addClass("ui-tabs-selected ui-state-active");
        $show.hide().removeClass("ui-tabs-hide") // avoid flicker that way
        .animate(showFx, showFx.duration || "normal", function () {
          self._trigger("show", null, self._ui(clicked, $show[0]));
        });
      } : function (clicked, $show) {
        $(clicked).closest("li").addClass("ui-tabs-selected ui-state-active");
        $show.removeClass("ui-tabs-hide");
        self._trigger("show", null, self._ui(clicked, $show[0]));
      };

      // Hide a tab, $show is optional...
      hideTab = hideFx ? function (clicked, $hide) {
        $hide.animate(hideFx, hideFx.duration || "normal", function () {
          self.lis.removeClass("ui-tabs-selected ui-state-active");
          $hide.addClass("ui-tabs-hide");
          self.element.dequeue("tabs");
        });
      } : function (clicked, $hide, $show) {
        self.lis.removeClass("ui-tabs-selected ui-state-active");
        $hide.addClass("ui-tabs-hide");
        self.element.dequeue("tabs");
      };

      // attach tab event handler, unbind to avoid duplicates from former tabifying...
      this.anchors.bind(o.event + ".tabs", function () {
        var el = this,
          $li = $(el).closest("li"),
          $hide = self.panels.filter(":not(.ui-tabs-hide)"),
          $show = self.element.find(self._sanitizeSelector(el.hash));

        // If tab is already selected and not collapsible or tab disabled or
        // or is already loading or click callback returns false stop here.
        // Check if click handler returns false last so that it is not executed
        // for a disabled or loading tab!
        if (($li.hasClass("ui-tabs-selected")) || $li.hasClass("ui-state-disabled") || $li.hasClass("ui-state-processing") || self.panels.filter(":animated").length || self._trigger("select", null, self._ui(this, $show[0])) === false) {
          this.blur();
          return false;
        }

        o.selected = self.anchors.index(this);

        self.abort();

        if (o.cookie) {
          self._cookie(o.selected, o.cookie);
        }

        // show new tab
        if ($show.length) {
          if ($hide.length) {
            self.element.queue("tabs", function () {
              hideTab(el, $hide);
            });
          }
          self.element.queue("tabs", function () {
            showTab(el, $show);
          });

          self.load(self.anchors.index(this));
        } else {
          throw "Tabs: Mismatching fragment identifier.";
        }
      });

      // disable click in any case
      this.anchors.bind("click.tabs", function () {
        // LMCLIENT-19307: send click trigger before return
        $(document).trigger("click.popupmenu");
        return false;
      });
    },
    _getIndex: function (index) {
      // meta-function to give users option to provide a href string instead of a numerical index.
      // also sanitizes numerical indexes to valid values.
      if (typeof index == "string") {
        index = this.anchors.index(this.anchors.filter("[href$=" + index + "]"));
      }

      return index;
    },
    getIndex: function (index) {
      // meta-function to give users option to provide a href string instead of a numerical index.
      // also sanitizes numerical indexes to valid values.
      if (typeof index == "string") {
        index = this.anchors.index(this.anchors.filter("[href$=" + index + "]"));
      }

      return index;
    },
    destroy: function () {
      var o = this.options;

      this.abort();

      this.element.unbind(".tabs")
        .removeClass("ui-tabs")
        .removeData("tabs");

      this.list.removeClass("ui-helper-reset");

      this.anchors.each(function () {
        var href = $.data(this, "href.tabs"),
          $this;

        if (href) {
          this.href = href;
        }

        $this = $(this).unbind(".tabs");
        $.each(["href", "load", "cache"], function (i, prefix) {
          $this.removeData(prefix + ".tabs");
        });
      });

      this.lis.unbind(".tabs").add(this.panels).each(function () {
        if ($.data(this, "destroy.tabs")) {
          $(this).remove();
        } else {
          $(this).removeClass(["ui-tabs-selected",
            "ui-state-active",
            "ui-state-hover",
            "ui-state-focus",
            "ui-state-disabled",
            "ui-tabs-panel",
            "ui-corner-bottom",
            "ui-tabs-hide"].join(" "));
        }
      });

      if (o.cookie) {
        this._cookie(null, o.cookie);
      }

      return this;
    },

    _insertPanel: function ($panel, $li, index, lis, panels, list) {
      if (index >= lis.length) {
        $li.appendTo(list);
        $panel.appendTo(list[0].parentNode);
      } else {
        $li.insertBefore(lis[index]);
        $panel.insertBefore(panels[index]);
      }
    },

    add: function (url, label, index, insertPanelFunction) {
      if (index === undefined) {
        index = this.anchors.length;
      }
      if (insertPanelFunction === undefined) {
        insertPanelFunction = this._insertPanel;
      }
      var self = this,
        o = this.options,
        $panel,
        $li = $(o.tabTemplate.replace(/#\{href\}/g, url).replace(/#\{label\}/g, label)),
        id = !url.indexOf("#") ? url.replace("#", "") : this._tabId($("a", $li)[0]);

      $li.data("destroy.tabs", true);

      // try to find an existing element before creating a new one
      $panel = self.element.find("#" + id);

      if (!$panel.length) {
        $panel = $(o.panelTemplate)
          .attr("id", id)
          .data("destroy.tabs", true);
      }
      $panel.addClass("ui-tabs-panel ui-tabs-hide");

      insertPanelFunction($panel, $li, index, this.lis, this.panels, this.list);

      o.disabled = $.map(o.disabled, function (n, i) {
        return n >= index ? ++n : n;
      });

      this._tabify();

      if (this.anchors.length == 1) {
        o.selected = 0;
        $li.addClass("ui-tabs-selected ui-state-active");
        $panel.removeClass("ui-tabs-hide");
        this.element.queue("tabs", function () {
          self._trigger("show", null, self._ui(self.anchors[0], self.panels[0]));
        });

        this.load(0);
      }

      this._trigger("add", null, this._ui(this.anchors[index], this.panels[index]));
      return this;
    },

    remove: function (index) {
      index = this._getIndex(index);
      var o = this.options,
        $li = this.lis.eq(index).remove(),
        $panel = this.panels.eq(index).remove();

      // If selected tab was removed focus tab to the right or
      // in case the last tab was removed the tab to the left.
      if ($li.hasClass("ui-tabs-selected") && this.anchors.length > 1) {
        this.select(index + (index + 1 < this.anchors.length ? 1 : -1));
      }

      o.disabled = $.map(
      $.grep(o.disabled, function (n, i) {
        return n != index;
      }),

      function (n, i) {
        return n >= index ? --n : n;
      });

      this._tabify();

      //this._trigger("remove", null, this._ui($li.find("a")[0], $panel[0]));
      return this;
    },

    enable: function (index) {
      index = this._getIndex(index);
      var o = this.options;
      if ($.inArray(index, o.disabled) == -1) {
        return;
      }

      this.lis.eq(index).removeClass("ui-state-disabled");
      o.disabled = $.grep(o.disabled, function (n, i) {
        return n != index;
      });

      this._trigger("enable", null, this._ui(this.anchors[index], this.panels[index]));
      return this;
    },

    disable: function (index) {
      index = this._getIndex(index);
      var o = this.options;
      // cannot disable already selected tab
      if (index != o.selected) {
        this.lis.eq(index).addClass("ui-state-disabled");

        o.disabled.push(index);
        o.disabled.sort();

        this._trigger("disable", null, this._ui(this.anchors[index], this.panels[index]));
      }

      return this;
    },

    select: function (index) {
      index = this._getIndex(index);
      if (index == -1) {
        return this;
      }
      this.anchors.eq(index).trigger(this.options.event + ".tabs");
      return this;
    },

    load: function (index) {
      index = this._getIndex(index);
      var self = this,
        o = this.options,
        a = this.anchors.eq(index)[0],
        url = $.data(a, "load.tabs"),
        tab = self.element.find(self._sanitizeSelector(a.hash));

      this.abort();

      // not remote or from cache
      if (!url || this.element.queue("tabs").length !== 0 && $.data(a, "cache.tabs")) {
        this.element.dequeue("tabs");
        return;
      }

      // load remote from here on
      this.lis.eq(index).addClass("ui-state-processing");

      if (o.spinner) {
        tab.inforBusyIndicator();
        tab.find("#inforLoadingOverlay").css({
          "top": ($(window).height() - tab.offset().top) / 2,
          "margin-top": "-16px",
          "left": "50%",
          "margin-left": "-16px"
        });
      }

      this.xhr = $.ajax($.extend({}, o.ajaxOptions, {
        url: url,
        success: function (r, s) {
          tab.html(r);

          // take care of tab labels
          self._cleanup();

          if (o.cache) {
            $.data(a, "cache.tabs", true);
          }

          self._trigger("load", null, self._ui(self.anchors[index], self.panels[index]));
          try {
            o.ajaxOptions.success(r, s);
          } catch (e) { }
        },
        error: function (xhr, s) {
          // take care of tab labels
          self._cleanup();

          self._trigger("load", null, self._ui(self.anchors[index], self.panels[index]));
          try {
            // Passing index avoid a race condition when this method is
            // called after the user has selected another tab.
            // Pass the anchor that initiated this request allows
            // loadError to manipulate the tab content panel via $(a.hash)
            o.ajaxOptions.error(xhr, s, index, a);
          } catch (event) { }
        }
      }));

      // last, so that load event is fired before show...
      self.element.dequeue("tabs");

      return this;
    },

    abort: function () {
      // stop possibly running animations
      this.element.queue([]);
      this.panels.stop(false, true);

      // "tabs" queue must not contain more than two elements,
      // which are the callbacks for the latest clicked tab...
      this.element.queue("tabs", this.element.queue("tabs").splice(-2, 2));

      // terminate pending requests from other tabs
      if (this.xhr) {
        this.xhr.abort();
        delete this.xhr;
      }

      // take care of tab labels
      this._cleanup();
      return this;
    },

    url: function (index, url) {
      this.anchors.eq(index).removeData("cache.tabs").data("load.tabs", url);
      return this;
    },

    length: function () {
      return this.anchors.length;
    }
  });

})(jQuery);

/*
* Infor Tabset Control
*/

(function ($) {
  $.widget("ui.inforTabset", {
    options: {
      editable: false, //Will allow you to double click in the headers to edit
      closable: false, //Will allow you to close headers
      sortable: false, //Will allow you to drag headers to sort
      addButton: false,
      rename: null,
      add: null,
      close: null,
      sort: null,
      showLoadingIndicator: false,
      animate: false, //add a cross fade animation.
      fillToBottom: true, //if true the control will stretch to the bottom of the page in height automatically.
      toolTips: {
        addButton: null,
        closeButton: null
      },
      moduleTabs: false, //special styled tabs for application level
      verticalTabs: false, // implements vertical tabs.
      contextMenuOptions: [{
        label: Globalize.localize("CloseTab"),
        href: "#close"
      }, {
        label: Globalize.localize("CloseOtherTabs"),
        href: "#closeOthers"
      }]
      // {label: Globalize.localize("CloseAllTabs"), href: "#closeAll"}
    },
    _init: function () {
      var o = this.options,
        $tabs = $(this.element),
        self = this,
        contH, tabObj, parents;

      //localize tooltips
      if (!o.toolTips.addButton) {
        o.toolTips.addButton = Globalize.localize("CreateTab");
      }

      if (!o.toolTips.closeButton) {
        o.toolTips.closeButton = Globalize.localize("CloseTab");
      }

      //Add close buttons if required
      if (o.closable) {
        this._addCloseButton($tabs, o);
      }

      if (o.editable) {
        this._addEditors($tabs, null, false, o);
      }

      if (o.addButton) {
        this._addAddButton($tabs, o);
      }

      $tabs.tabs({
        spinner: (o.showLoadingIndicator ? "<div class='inforBusyIndicator large'></div>" : "")
      });

      if ($(this.element).hasClass("inforModuleTabs")) {
        this.options.moduleTabs = true;
      }

      this._addButtons($tabs, o);

      //hide any visibile tooltips..
      $tabs.bind('tabsselect', function () {
        $("#inforTooltip, #validation-errors, #tooltip").addClass('is-hidden');
        $(".slick-columnpicker").hide();
        $('#dropdown-list, #multiselect-list').remove();

        if (o.editable) {
          $("input.inforTabHeaderEditor").trigger("blur");
        }
      });

      //refresh grids on show
      $tabs.bind('tabsshow', function (event, ui) {
        self._sizeInternalElements($(ui.panel), $tabs);
      });

      //Make the Tabs Sortable
      if (o.sortable) {
        if (!$tabs.find(".inforTabset a:first").prev().is(".inforDragHandle")) {
          $tabs.find(".inforTabset a").before("<div class='inforDragHandle'></div>").disableSelection();
        }

        $tabs.find(".inforTabset:first").sortable({
          tolerance: 'touch',
          axis: "x",
          forcePlaceholderSize: true,
          handle: ".inforDragHandle",
          placeholder: "inforDragPlaceholder",
          //We can ignore drag on some stuff with
          //items: 'li[id!=dropdownli]',
          start: function (event, ui) {
            ui.item.css("width","auto").addClass("ui-state-hover");
          },
          stop: function (e, ui) {
            ui.item.css({
              "position": "",
              "left": "",
              "top": ""
            }).removeClass("ui-state-hover");

            //post action to save tab index
            if (o.sort) {
              o.sort(this, ui, o);
            }
			self._refreshScroll($tabs);
          }
        }).disableSelection();
      }

      //handle being in a splitter top pane
      if ($tabs.parent().is("#topPane")) {
        o.fillToBottom = false;
        $tabs.closest(".inforHorizontalSplitter").bind("resize", function (e) {
          $tabs.find(".ui-tabs-panel").height($tabs.parent().height() - 25);
        });
      }

      //handle being in a splitter bottom pane
      if ($tabs.parent().is("#bottomPane")) {
        o.fillToBottom = false;
        $tabs.closest(".inforHorizontalSplitter").bind("resize", function (e) {
          $tabs.find(".ui-tabs-panel").height($tabs.parent().height() - 45);
        });
        $tabs.find(".ui-tabs-panel").height($tabs.parent().height() - 45);
      }

      if (o.verticalTabs) {
        $tabs.addClass("inforVerticalTabs");
      }

      //setup scrolling on the tab control itself.
      if (o.fillToBottom) {
        $tabs.addClass("inforScrollableArea");
        $tabs.inforScrollableArea();
      } else {
         contH = $tabs.height();
         $tabs.find(".ui-tabs-panel").each(function () {
            var panel = $(this);
            //panel.height(contH - 43);
            if (o.verticalTabs) {
              panel.height(contH - 9).css("overflow", "auto");
            }
         });
      }

      //set autowidth
      tabObj = $tabs.tabs({
        show: function (e, ui) {
          var lastOverflow, lastPos, gridOverflow, lastOpenedPanel;

          if (o.animate && !o.verticalTabs) {
            //add cross fade animation
            lastOpenedPanel = $(this).data("lastOpenedPanel");

            if (!$(this).data("topPositionTab")) {
              $(this).data("topPositionTab", $(ui.panel).position().top);
            }

            //Dont use the builtin fx effects. This will fade in/out both tabs, we dont want that
            //Fadein the new tab yourself
            $(ui.panel).hide().fadeIn(400);

            if (lastOpenedPanel) {
              lastOverflow = lastOpenedPanel.css("overflow");
              lastPos = lastOpenedPanel.css("position");
              gridOverflow = lastOpenedPanel.find(".slick-viewport").css("overflow");

              lastOpenedPanel.find(".slick-viewport").css("overflow", "hidden");
              // 1. Show the previous opened tab by removing the jQuery UI class
              // 2. Make the tab temporary position:absolute so the two tabs will overlap
              // 3. Set topposition so they will overlap if you go from tab 1 to tab 0
              // 4. Remove position:absolute after animation
              lastOpenedPanel.css("overflow", "hidden")
                .toggleClass("ui-tabs-hide")
                .css("position", "absolute")
                .css("top", $(this).data("topPositionTab") + "px")
                .fadeOut(400, function () {
                  var panel = $(this);
                  panel.css("position", (lastPos ? lastPos : ""));
                  panel.css("overflow", (lastOverflow ? lastOverflow : ""));
                  self._sizeInternalElements($(ui.panel), $tabs);

                  if (gridOverflow) {
                    panel.find(".slick-viewport").css("overflow", gridOverflow);
                  }
                });
            }

            //Saving the last tab has been opened
            $(this).data("lastOpenedPanel", $(ui.panel));
          }

          $(ui.panel).find('.autoLabelWidth').each(function() {
            var container = $(this);
            container.find('.inforLabel, .label').autoWidth();
          });

          self._scrollTabIntoView($tabs, $tabs.find("ul.inforTabset:first"));
          self._sizeInternalElements($(ui.panel), $tabs);
        }
      });

      if (o.moduleTabs) {
        $tabs.children(".inforTabset").addClass("inforModuleTabs");
      } else {
        $tabs.children(".inforTabset").addClass("inforNormalTabs");
      }

      //add levels
      parents = $tabs.parents(".ui-tabs").not(".inforModuleTabs");

      if (parents.length > 0) {
        parents.find(".inforTabset").not(".level0, .level1, .level2, .level3, .inforModuleTabs").each(function (index) {
          $(this).addClass("level" + ($(this).parents(".ui-tabs-panel").length + 1));
        });
      }

      if (o.verticalTabs) {
        tabObj.addClass("inforVerticalTabs");
        self._sizeVerticalTabs($tabs);
      }

      $tabs.find(".ui-tabs-panel:visible").find('.autoLabelWidth').each(function() {
        var container = $(this);
        container.find('.inforLabel').autoWidth();
      });

      //Find context Menus and initialize.
      $tabs.find("ul .inforContextMenu").each(function () {
        var menu = $(this),
          a = menu.prev();

        menu.parent().addClass("downArrow");  // ui-state-disabled
        a.popupmenu({
          menu: menu.attr("id"),
          beforeOpening: function() {
            $(a.attr("href")).find(".inforTabSection").hide();
          },
          position: {my: "left top-1", at: "left bottom", of: a.parent()}
        }, function(id, a) {
          $("#"+id).parent().children("div").hide();
          $("#"+id).show();
        });
        menu.parent().appendTo("body");
      });
    },
    _sizeInternalElements: function (panel, $tabs) {
      panel.find(".inforDataGrid").each(function () {
        var grid = $(this).data("gridInstance");
        if (grid) {
          grid.reinit();
        }
      });

      panel.find(".ui-tabs").each(function () {
        //nested tabs
        var tab = $(this).data("uiInforTabset");
        if (tab) {
          tab.handleResize(null, true);
        }
      });

      panel.find(".inforSplitter").each(function () {
        var splitter = $(this).data("uiInforSplitter");
        if (splitter) {
          splitter.handleResize(null, true);
        }
      });

      if ($tabs.data("uiInforScrollableArea")) {
        $tabs.data("uiInforScrollableArea")($tabs);
      }
    },
    _setOption: function (key, value) {
      $.Widget.prototype._setOption.apply(this, arguments);
    },
    _addAddButton: function ($tabs, o) {
      if (!o.addButton) {
        return;
      }

      var $button = $("<button type='button' class=\'inforAddTabButton\' title='" + o.toolTips.addButton + "'><span class='rightSlice'></span></button>");

      $tabs.find('.inforTabset').append($button);

      $('.inforAddTabButton').click(function () {
        //Adding a new tab...
        var newId = "#tab" + $tabs.tabs().children().size();
        $tabs.inforTabset("add", newId, "New Tab", true);
      });
    },
    _adjustAddNewButton: function ($tabs, o) {
      if (!o.addButton) {
        return;
      }
      //moves this html so its always at the end
      var addTab = $tabs.find(".inforAddTabButton");
      addTab.remove();
      this._addAddButton($tabs, o);
    },
    _addEditors: function ($tabs, ui, isNew, o) {
      var list = $tabs.find('ol,ul').eq(0),
        lis = $('li:has(a[href])', list),
        last = null;

      lis.each(function () {
        var $thisA = $(this).find('a');
        last = $thisA;

        //replaces jeditable plugin in much less lines.
        $thisA.dblclick(function () {
          //add a text box to this elem
          var width = $thisA.width(),
            $input = $('<input class="inforTextbox noTrackDirty inforTabHeaderEditor">').val($thisA.text()).width(width);

          $thisA.css("opacity", "0").after($input);
          $input.css({
            "position": "absolute"
          });

          if (!o.moduleTabs) {
            $input.css({
              "left": $thisA.position().left + 2 + "px",
              "top": "2px"
            });
          } else {
            $input.css({
              "left": $thisA.position().left + 2 + "px",
              "top": "5px",
              "font-size": "1.5em"
            });
          }

          //Focus and add events
          $input.focus().select().blur(function () {
            var value = $input.val();
            $thisA.css("opacity", "").text(value);
            // execute callback
            if (!isNew && o.rename) {
              o.rename(this, value, o);
            }

            if (isNew && o.add) {
              o.add(this, $input, value, o);
            }

            $input.remove();
            isNew = false;
          });
        });
      });

      if (isNew) {
        last.trigger('dblclick');
      }
    },
    _addMenuToPage: function ($tabs, o) {
      var list = $tabs.find('ol,ul').eq(0),
        lis = $('li:has(a[href])', list),
        tabName = 'tabs-menu-' + $('.inforTabset').index(list), //used to be $('.inforTabset').lengthh,
        i = 0,
        ul, text, tabLi, originalIndex;

      // If the menu already exists, reuse it, but empty it.
      if ($('#'+tabName).length > 0) {
        ul = $('#'+tabName);
        ul.empty();
      } else {
        ul = $("<ul class='popupmenu'></ul>").attr('id',tabName);
        $tabs.after(ul);
      }

      lis.each(function () {
        var $this = $(this),
          $thisA = $(this).find('a');

        if (!$thisA.parent().hasClass("inforHiddenTab")) {
          text = $thisA.html();
          tabLi = $("<li class='" + i + ($thisA.parent().hasClass("ui-state-disabled") ? " disabled" : "") + "'><a href='#" + i + "'>" + text + "</a></li>");

          if ($thisA.data("text")) {
            text = $thisA.data("text");
          }

          tabLi.data("tabItem", $this);
          //ui-state-disabled
          ul.append(tabLi);
        }
        i++;
      });

      //add sort behaviors
      if (o.sortable) {
        $(ul).addClass("connectedSortable").sortable({
          placeholder: 'inforDragPlaceholder',
          helper: 'clone',
          forcePlaceholderSize: true,
          revert: 100,
          delay: 500,
          connectWith: ".connectedSortable",
          start: function (event, ui) {
            originalIndex = ui.item.index();
          },
          stop: function (event, ui) {
            var elem = ui.item.data("tabItem");

            if (originalIndex == ui.item.index()) {
              return;
            }

            if (ui.originalPosition.top > ui.position.top) {
              list.children().eq(ui.item.index()).before(elem); //dragged up
            } else {
              list.children().eq(ui.item.index()).after(elem); //dragged down
            }
			if (o.sort) {
              o.sort(this, ui, o);
            }
          }
        });
      }

      return tabName;
    },
    closeTab: function (tabLi) {
      var tabIndex = tabLi.children('a').attr('href'),
        $tabs = $(this.element),
        self = this,
        o = this.options,
        closeOk;

      if (o.close) {
        closeOk = o.close($tabs, tabIndex, o);
        if (!closeOk) {
          return;
        }
      }
      //Remove tab using UI method
      tabLi.fadeOut(250, function () {
        $tabs.tabs("remove", tabIndex);
        self._refreshScroll($tabs);
      });
    },
    _addCloseButton: function ($tabs, o) {
      var list = $tabs.find('ol,ul').eq(0),
        lis = $('li:has(a[href])', list).not(".notClosable"),
        self = this,
        i, item,
        menu = $("#inforTabContextMenu");

      if (menu.length === 0) {
        menu = $('<ul id="inforTabContextMenu" class="inforContextMenu"></ul>');
        for (i = 0; i < o.contextMenuOptions.length; i++) {
          item = '<li><a href="' + o.contextMenuOptions[i].href + '">' + o.contextMenuOptions[i].label + '</a></li>';
          menu.append(item);
        }
        menu.appendTo("body");
      }

      lis.each(function () {
        var $thisLi = $(this);
        if ($thisLi.find(".inforTabCloseButton").length === 0) {
          $thisLi.append(
            $('<button></button>')
            .addClass('inforTabCloseButton')
            .attr('title', o.toolTips.closeButton)
            .on("click",function (e) {
              self.closeTab($(this).parent());
            }).append("<span></span>"));

          //add right click menu.
          $thisLi.inforContextMenu({
            menu: 'inforTabContextMenu',
            trigger: 'rightClick'
          },

          function (action, el, pos) {
              var lis = null;

              if (action == "close") {
                self.closeTab(el);
              }

              if (action == "closeOthers") {
                lis = $('li:has(a[href])', $tabs.find('ol,ul').eq(0)).not(".notClosable");
                lis.not(el).each(function (e) {
                  self.closeTab($(this));
                });
              }

              if (action == "closeAll") {
                lis = $('li:has(a[href])', $tabs.find('ol,ul').eq(0)).not(".notClosable");
                lis.each(function (e) {
                  self.closeTab($(this));
                });
              }
            });
        }
        //If width not assigned, the hidden tabs width cannot be calculated properly in _adjustLeftPosition
      });
    },
    remove: function (tabId) {
      var $tabs = $(this.element),
        anchors, index;

      if ((typeof tabId) == "string") { //lookup the tab id...
        anchors = $tabs.tabs().data().uiTabs.anchors;
        index = anchors.index(anchors.filter("[href$=" + tabId + "]"));

        $tabs.tabs('remove', index);
      } else {
        $tabs.tabs('remove', tabId);
      }

      this._refreshScroll($tabs);
    },
    add: function (tabId, label, enterEditMode, callback) {
      var $tabs = $(this.element),
        o = this.options,
        id = null,
        callbackEvent = null,
        callbackUi = null;

      tabId = !tabId.indexOf("#") ? tabId.replace(/ /g, "_").replace(/\./g, ' ') : tabId;

      $tabs.bind("tabsadd.add", function (event, ui) {
        id = $(ui.tab).attr("href");
        $tabs.tabs("select", id);
        callbackEvent = event;
        callbackUi = ui;
      });

      $tabs.tabs('add', tabId, label);
      $tabs.unbind("tabsadd.add");

      //Add extras.
      this._adjustAddNewButton($tabs, o);

      if (o.closable) {
        this._addCloseButton($tabs, o);
      }

      if (o.sortable) {
        $tabs.find('a[href="'+tabId+'"]').before("<div class='inforDragHandle'></div>").disableSelection();
      }

      if (enterEditMode && o.editable) {
        this._addEditors($tabs, this, true, o);
      }

      this._refreshScroll($tabs);

      if (callback) { //execute the callback
        callback(callbackEvent, callbackUi);
      }
      $tabs.data('uiInforTabset')._addMenuToPage($tabs, o);
    },
    _addButtons: function ($tabs, o) {
      var content = $tabs.find("ul.inforTabset:first"),
        self = this,
        width = 0,
        btnCount = 0,
        oldWidth = 0,
        oldheight,
        moduleButtons = $('<div class="inforTabButton"></div>'),
        chevron = $('<div class="inforTabButton"><button type="button" class="inforMoreButton">' + Globalize.localize("More").replace("...","") + '</button></div>');

      if (o.moduleTabs) {
        $tabs.find(".inforModuleHeaderRight:first").children().each(function (index, ui) {
          $(ui).appendTo(moduleButtons);
          btnCount++;
        });
      }

      content.after(chevron);

      if (o.moduleTabs) {
        content.after(moduleButtons);
      }

      var menuName = self._addMenuToPage($tabs, o);
      chevron.popupmenu({menu: menuName})
        .on('selected', function (e, el) {
          var action = el.attr('href').substr(1);
          $tabs.tabs('select', parseInt(action, 10));
          if (!self.options.moduleTabs) {
            self._scrollTabIntoView($tabs, content);
          }
      });

      chevron.hide().addClass("inforHiddenTab");

      this._refreshScroll($tabs);

      var reinit = function () {
        self._refreshScroll($tabs);
        self._sizeVerticalTabs($tabs);
      };

      this.handleResize = function (e, force) {
        if (self._resizeTimer) {
          clearTimeout(self._resizeTimer);
        }

        if (force || (self._windowHeight != $(window).height()) || (self._windowWidth != $(window).width())) {
          self._resizeTimer = setTimeout(reinit, 1);
          self._windowHeight = $(window).height();
          self._windowWidth = $(window).width();
        }
      };

      $(window).unbind("throttledresize.inforTabset"+ $tabs[0].id).bind('throttledresize.inforTabset'+ $tabs[0].id, this.handleResize);
    },
    _sizeVerticalTabs: function ($tabs) {
      $tabs.find("li a").css("width", "auto");
      $tabs.find("li a").parent().css("width", "auto");

      var self = this,
        tabWidth = $tabs.find("li:not(.inforHiddenTab)").first().width() + 28,
        ul, width;

      if (self.options.verticalTabs) {
        ul = $tabs.find("ul:first");
        width = $(window).width() - (ul.width() + ul.position().left + 74);

        $tabs.find("ul:first > li > a").each(function () {
          var lia = $(this);
          lia.width(tabWidth);
          lia.parent().width(tabWidth);
        });
      }
    },
    _scrollTabIntoView: function ($tabs, content) {
      var sel = $tabs.find(".ui-tabs-selected:first"),
        moreWidth = 0, //$tabs.find(".inforMoreButton").parent().width(),
        left = 0,
        toElemOffset, totalOffset;

      if (sel.length == 0) {
        return;
      }

      toElemOffset = sel.position().left + sel.width(),
      totalOffset = $tabs.position().left + $tabs.width();

      $tabs.find(".inforTabButton").each(function () {
        moreWidth += $(this).width();
      });

      left = $tabs.width() - content.width() - 22 + (sel.is(":last-child") ?  moreWidth - 15 : sel.width());

      if (sel.length < 1) {
        return;
      }

      if (sel.is(":first-child") ) {
        left = 0;
      }

      //sel[0].scrollIntoView();  //sort of works...
      //sel.find("a").focus();
      content.css("left", left);
      if (toElemOffset < 0 || toElemOffset < totalOffset) {
      content.css("left", 0);
      }
    },
    _refreshScroll: function ($tabs) {
      var headerWidth = 32,
        self = this,
        tabsWidth = $tabs.width(),
        content = $tabs.find("ul.inforTabset:first"),
        overFlowButton = $tabs.find(".inforMoreButton"),
        maxWidth = content.parent().css("max-width");

      this._addMenuToPage($tabs, self.options);

      //calculate tabs width
      content.find("li").each(function () {
        headerWidth += $(this).outerWidth();
      });

      if (headerWidth < tabsWidth) {
        overFlowButton.parent().hide();
        $tabs.find('ol,ul').eq(0).css("max-width",maxWidth);
        content.css({
          "width": "auto",
          "left": "0"
        });
      } else {
        overFlowButton.parent().show().removeClass("inforHiddenTab"); //width("32px");
        content.width(headerWidth + overFlowButton.parent().width() + 20);

        if (maxWidth) {
          content.css("max-width", maxWidth);
        }

        self._scrollTabIntoView($tabs, content);

        //set tooltip on last tab
        $tabs.find("li a").each(function () {
          var a = $(this);
          if (!a.attr("title")) {
            a.attr("title", a.text());
          }
        });
      }
    }
  });
}(jQuery));
