/*
* Infor Trigger Field
*/
(function ($) {
  $.widget("ui.inforLookupField", {
    options: {
      gridOptions: null, //full column options for the inforDataGrid
      returnField: "id", //id to return from the selected row - matches whats in the grid dataset.
      height: "auto", //height of the grid popup (minus shadows)
      width: 300, //width of the grid popup
      editable: true, //can the user type in the lookup.
      typeAheadSearch: true, //disable type ahead search when editable=false
      onPageRequested: null, //Fires when Paging Make this the same as the datagrid with subscribe?
      sortColumnId: null, //set the sort indication.
      sortAsc: null, //set the sort indication.
      beforeSearch: null, //function call that fires before search is activated. params: ui, options
      source: null, //attach a source function you might use this to do web requests to return back the data on autocomplete.
      url: null, //You can provide aurld to the control it will load the assocaited page into the lookup and find a grid there
      ajaxOptions: null //optional ajaxOptions to control the request
    },
    associatedGrid: null,
    gridDivId: "lookupGridDivId", // use a uuid not needed should only be one in a page at once.
    input: null,
    originalDataSet: null,
    selectedIds: [], // The selected Rows.
    isPopupOpen: false, // true if the grid popup is opened or is opening
    _init: function () {
      var self = this,
      $input = $(this.element),
      newOpts = null,
      gridDiv;

      this.input = $input;
      this.gridDivId = 'lookupGridDiv' + this.element.attr('id');

      //attach a default source matcher in case one is not provided.
      if (!self.options.source) {
        self.options.source = function (request, response) {
          if (self.options.beforeSearch) {
            newOpts = self.options.beforeSearch($input, self.options);
            if (newOpts) {
              self.options = newOpts;
            }
          }

          if (self.options.url || self.options.ajaxOptions) {
            if (!self.options.ajaxOptions) {
              self.options.ajaxOptions = {
                url: self.options.url,
                type: "GET"
              };
            }

            self.options.ajaxOptions.complete = function (jqXHR, status) {
              self._removeGridDiv();
              gridDiv = self._createGridDiv();
              gridDiv.html(jqXHR.responseText);
              self._search(request, response, gridDiv);
            };
            self.options.ajaxOptions.dataType = "html";

            $.ajax(self.options.ajaxOptions);
          } else {
            //set back the dataset
            if (self.originalDataSet) {
              self.options.gridOptions.dataset = self.originalDataSet;
              self.originalDataSet = null;
            }
            self._search(request, response);
          }
        };
      }

      //when clicking open a grid popup
      $input.inforTriggerField({
        click: function (event) {
          self.input.addClass("is-busy");
          self.isPopupOpen = true;

          if (self.options.click) {
            self.options.click(event);
            return;
          }

          //close grid if open (enter to open / enter to close again
          if (self.associatedGrid) {
            self.destroy();
          }
          $input.focus();
          // pass empty string as value to search for displaying all results

          //Execute Source..
          if (self.options.source) {
            response = function (data, columns, count, options) {
              var results = (data ? data : self.options.gridOptions.dataset),
                columns = (columns ? columns : self.options.gridOptions.columns),
                count = (count ? count : results.length);

              if (options) {
                self.options.gridOptions = options;
              }
              $input.focus();
              self._openGridPopup(results, columns, count);
            };
            self.options.source("", response);
          } else {
            var results = self.options.gridOptions.dataset,
              columns = self.options.gridOptions.columns;

            self._openGridPopup(results, columns, results.length);
          }
          return;
        }
      }).on('keydown', function (e) {
        if (e.keyCode  === 27) {
          self._closeGridPopup(true);
        }
      });

      //Setup an editable type drop down styling and options
      if (!self.options.editable) {
        $input.attr('readonly','readonly').data('selectOnly', true).parent().addClass('selectOnly');
      }
    },
    _removeGridDiv: function () {
      $('#' + this.gridDivId).parent('.inforLookupGridBoxShadow').remove();
      $('#' + this.gridDivId).remove();
    },
    _createGridDiv: function () {

      if ($('#' + this.gridDivId).length > 0) {
        return $('#' + this.gridDivId);
      }

      var $gridDiv = $("<div></div>").attr("id", this.gridDivId).addClass("inforLookupGrid").appendTo("body");
      $gridDiv.wrap("<div style='display:none' class='inforLookupGridBoxShadow'></div");

      return $gridDiv;
    },
    _search: function (request, response, gridDiv) {
      var self = this,
        count = 0,
        timer;

      if (gridDiv) { // we used an ajax url
        var setupGrid = function(grid) {
          grid.isLookupGrid = true;
          self.associatedGrid = grid;
          self.options.gridOptions = grid.getOptions();
          self.options.gridOptions.dataset = grid.getData().getItems();
          self._completeResponse(request, response);
        };

        var gridInstance = gridDiv.find(".inforDataGrid:first").data("gridInstance");
        if (!gridInstance) {
          timer = setInterval(function () {
            gridInstance = gridDiv.find(".inforDataGrid:first").data("gridInstance");

            if (count == 5)
              clearTimeout(timer);

            if (gridInstance)
              setupGrid(gridInstance);

            count++;
          }, 400);
        } else {
          setupGrid(gridInstance);
        }
      } else {
        self._completeResponse(request, response);
      }
    },
    _completeResponse: function (request, response) {
      var self = this,
        emptyRecord = [{}];

      if (!self.options.gridOptions) {
        return {};
      }

      if (self.options.gridOptions.dataset.length === 0) {
        emptyRecord[0][self.options.idProperty] = "";
        emptyRecord[0][self.options.gridOptions.idProperty] = "";
        response(emptyRecord);
      }

      response($(self.options.gridOptions.dataset).map(function () {
        var text = null;
        if (self.associatedGrid) {
          text = self.getDataItemValueForColumn(this, self.options.returnField);
        } else {
          text = this[self.options.returnField];
        }

        if ((!request.term || (text ? text.toLowerCase().indexOf(request.term.toLowerCase()) > -1 : false))) {
          return this;
        }
      }));
    },
    getGrid: function () {
      return this.associatedGrid;
    },
    setCode: function (codeValue) {
      // This sets up Lookup field's selected values,
      // where codeValue may contain 1 or more selections
      var self = this;

      // Ensure that we always deal with an array
      if (typeof (codeValue) === 'string')
        codeValue = [codeValue];

      // First we want to make sure we're not just
      // setting values that are already selected
      var newSelectedIds = codeValue.filter(function(value) {
        if (self.selectedIds.length) {
          var itemExists = self.selectedIds.filter(function(selected) {
            return (value == selected.value || value == selected.id);
          });
          if (itemExists.length)
            return false;
        }
        return true;
      }).map(function(value) {
        return {id: value};
      });

      // Return if there are no selection
      if (!newSelectedIds.length) {
        return;
      }

      this.selectedIds = newSelectedIds;
      var selectValue = "";
      $.each(this.selectedIds, function (index, value) {
        if (typeof value.id == "number" && isNaN(value.id)) {
          return;
        }

        var row = self.getRowById(value.id);
        if (row) {
          selectValue += self.getDataItemValueForColumn(row, self.options.returnField) +
              (self.selectedIds.length - 1 != index ? "," : "");
        }
      });

      this.input.val(selectValue);
    },
    dataView : null,
    getItemCache : {},
    getDataItemValueForColumn: function(item, field) {
      var self = this;
      if (!item[field]) {
        var fn = self.getItemCache[field] = self.getItemCache[field] || new Function(["item", "field"], "with(item){try{return "+field+";}catch(e){return null;}}");
        return fn(item, field);
      } else {
        return item[field];
      }
    },
    getRowById: function (id) { //return the dataset row for the given id..using idProperty
      var self = this;
      var gridOptions = this.options.gridOptions;
      var isAjaxData = !!(this.options.url || this.options.ajaxOptions);

      if (this.dataView)
        return this.dataView.getItemById(id);

      // Get DataView from grid if it
      // was built via AJAX request
      if (isAjaxData && this.associatedGrid) {
        this.dataView = this.associatedGrid.getData();
        return this.dataView.getItemById(id);
      }

      // Otherwise, data can be pulled from
      // either gridOptions or from source
      if (!isAjaxData && gridOptions) {
        this.dataView = new Slick.Data.DataView({idProperty: gridOptions.idProperty});
        var dataset = gridOptions.dataset;
        if (dataset && dataset.length) {
          this.dataView.setItems(dataset);
        } else if (this.options.source) {
          // Fallback to source when there's
          // nothing from gridOptions.dataset
          this.options.source("", function(data) {
            self.dataView.setItems(data);
          });
        }
        return this.dataView.getItemById(id);
      }
    },
    destroy: function() {
      if (this.isPopupOpen) {
        this._closeGridPopup(true);
      }
    },
    _closeGridPopup: function (isCancel) {
      //remove grid and page elements and animate
      var $gridDiv = $("#" + this.gridDivId),
        cell = this.input.closest(".slick-cell");
      this.isPopupOpen = false;

      var $gridWrapper = $gridDiv.parent('.inforLookupGridBoxShadow');
      $gridWrapper.css("opacity", 0); //improves appearance on ie 8 during fade out..
      $gridDiv.hide((isCancel ? "fade" : "fadeOut"), function () {
        $gridWrapper.remove();
      });

      if (this.associatedGrid) {
        this.associatedGrid.destroy();
        this.associatedGrid = null;
      }
      $('.popupmenu-wrapper:empty').remove();

      this.overlay.remove();
      this.input.removeClass("is-busy");

      //set back the dataset
      if (this.originalDataSet) {
        this.options.gridOptions.dataset = this.originalDataSet;
        this.originalDataSet = null;
      }

      $(window).unbind("throttledresize.inforLookupField");
      this.input.closest(".inforTriggerField").addClass("focus");
    },
    _openGridPopup: function (dataset, columns, totalRows) {
      var self = this,
        $gridDiv, isRTL, minHeight, ds, selectedRows, dataRows, i, j, header, closeButton, dataView, filterExpr, columnFilterObject;
      var modal = this.element.closest('.modal, .inforLookupGridBoxShadow');

      if (!this.element.is(":focus")) {
        return;
      }

      //switch out the dataset with the passed in filtering one.
      if (dataset) {
        self.originalDataSet = self.options.gridOptions.dataset;
        //refresh the datagrid...
        self.options.gridOptions.dataset = dataset;
      } else if (self.originalDataSet) {
        self.options.gridOptions.dataset = self.originalDataSet;
        self.originalDataSet = null;
      }

      if (columns) {
        self.options.gridOptions.columns = columns;
      }

      //create a grid object..
      $gridDiv = $("#" + this.gridDivId);
      $gridDiv = self._createGridDiv();

      if (modal.length > 0) {
        $gridDiv.closest('.inforLookupGridBoxShadow').css('z-index', modal.zIndex() + 1);
      }

      //set height and width
      if (self.options.height == "auto" ) {
        $gridDiv.width(self.options.width).css("height", "auto");
        $gridDiv.parent().width(self.options.width).css("height", "auto");
      } else {
        $gridDiv.width(self.options.width).css("height", self.options.height);
        $gridDiv.parent().width(self.options.width).css("height", self.options.height + (self.options.gridOptions.showFooter ? 23 : 0) + (self.options.gridOptions.multiSelect ? 26 : 0));
        self.options.gridOptions.fillToBottom = false;
      }

      self.options.gridOptions.selectOnRowChange = true;

      if (self.options.width == "auto" ) {
        var setWidth = $gridDiv.find(".inforDataGrid").css("width");
        $gridDiv.width(setWidth);
        $gridDiv.parent().width(setWidth);
      }

      //position under the field
      isRTL = Globalize.culture().isRTL;
      this.root = $gridDiv.parent();
      this.root.show();

      //create and open the grid...
      //if there is less rows than the width use auto height..each row is 22 pixels + the header + the optional filter row.
      minHeight = (self.options.gridOptions.dataset.length * 22) + 26 + (self.options.gridOptions.showFilter ? 26 : 0);
      if (minHeight < self.options.height || self.options.height == "auto") {
        self.options.gridOptions.autoHeight = true;
      } else {
        self.options.gridOptions.autoHeight = false;
      }

      self.options.gridOptions.enableCellNavigation = false;
      self.options.gridOptions.enableCellRangeSelection = false;

      //Use different routine for paging to update data
      if (totalRows) {
        ds = self.options.gridOptions.dataset;
        self.options.gridOptions.dataset = [];
      }

      if ((self.options.url || self.options.ajaxOptions) && !this.associatedGrid) {
        this.associatedGrid = $("#" + this.gridDivId).find(".inforDataGrid:first").data("gridInstance");
      }

      if (self.options.url || self.options.ajaxOptions) {
        this.associatedGrid.resizeCanvas();
      } else {
        this.associatedGrid = $("#" + this.gridDivId).inforDataGrid(self.options.gridOptions);
      }

      if (self.options.sortColumnId && self.options.sortAsc) {
        this.associatedGrid.setSortColumn(self.options.sortColumnId, self.options.sortAsc);
      }


      //Set total count for paging
      if (totalRows && ds) {
        this.associatedGrid.mergeData(ds, 0, parseInt(totalRows, 10));
      }

      //add a close bar for multi select
      if (self.options.gridOptions.multiSelect) {
        header = $("<div class='inforLookupHeader'></div>");
        closeButton = $('<button class="inforCloseButton" type="button" title="Close"></button>').click(function () {
          self._select();
        });

        header.append(closeButton);
        if ($gridDiv.parent().find('.inforLookupHeader').length == 0) {
          $gridDiv.parent().prepend(header);
        }
      }

      //add modal overlay..
      //create a grid object..
      var overlayId = "inforLookupOverlay" + this.gridDivId;
      this.overlay = $('#' + overlayId);

      if (this.overlay.length === 0)
      {
        var zIndex = modal.length > 0 ? modal.zIndex() : 900;
	      this.overlay = $('<div id="' + overlayId + '"></div>').addClass('inforLookupOverlay')
	        .appendTo(document.body)
	        .css({
	          width: $(window).width(),
	          height: $(window).height(),
	          zIndex: zIndex
	        }).click(function () {
	          if (self.options.gridOptions.multiSelect) {
	            self._select();
	          } else {
	            self._closeGridPopup(true);
	          }
	        });

	      this.overlay.css({
	        width: $(window).width(),
	        height: $(window).height()
	      });
      }
      //select the selected rows based on the current value(s)..This would fail if the id was not selected.
      if (self.selectedIds.length > 0) {
        selectedRows = [];
        dataRows = this.associatedGrid.getData().getItems(); //search requires one scan of the data...
        for (i = 0; i < self.selectedIds.length; i++) {
          selectedRows.push(this.associatedGrid.getData().getIdxById(self.selectedIds[i].id));
        }
        this.associatedGrid.setSelectedRows([]);
        this.associatedGrid.setSelectedRows(selectedRows);
        //scroll to last selected
        this.associatedGrid.scrollRowIntoView(selectedRows[selectedRows.length-1]);
      }

      //selected rows events
      if (!self.options.gridOptions.multiSelect) {
        this.associatedGrid.onClick.subscribe(function (e, a) {
          self._select();
        });
      }

      //setup paging
      if (self.options.onPageRequested) {
        dataView = this.associatedGrid.getData();
        dataView.onPageRequested.subscribe(function (e, args) {
          e.datagrid = self.associatedGrid;
          //pass in the term as a filter arg
          if (!args.filters) {
            if (self.input.val() === "") {
              args.filters = undefined;
            } else {
              columnFilterObject = {};
              filterExpr = {
                value: self.input.val(),
                operator: "contains",
                filterType: TextFilter()    //ignore jslint - comes from the datagrid
              };

              columnFilterObject[self.options.gridOptions.idProperty] = filterExpr;
              args.filters = columnFilterObject;
            }
          }
          self.options.onPageRequested(e, args);
        });
      }

      //move the status area to the far left because it looks off when this dialog is not full page width
      $gridDiv.parent().find(".slick-record-status").css("float", (Globalize.culture().isRTL ? "right" : "left"));

      //adjust position on resize
      $(window).unbind("throttledresize.inforLookupField");
      $(window).bind("throttledresize.inforLookupField", function () {
        self._handleResize();
      });

      this.input.data("isChanged", false);
      this.input.removeClass("is-busy");
      this.setPosition();
      this.input.closest(".inforTriggerField").addClass("focus");
    },
    resizeTimer: null,
    windowHeight: null,
    windowWidth: null,
    root: null,
    getSelectedValues: function () {
      return this.selectedIds;
    },
    getIsPopupOpen: function () {
      return this.isPopupOpen;
    },
    setPosition: function () {
      var self = this,
        height, top;

      self.root.position({
        my: (Globalize.culture().isRTL ? "right-1 top+1" : "left-1 top+1"),
        at: (Globalize.culture().isRTL ? "right bottom" : "left bottom"),
        collision: "flipfit",
        of: self.input
      });

      self.overlay.height($(window).height()).width($(window).width());

      self.windowHeight = $(window).height();
      self.windowWidth = $(window).width();

      if (self.root.offset().top < self.input.offset().top) {
        self.root.position({
          my: (Globalize.culture().isRTL ? "right bottom" : "left bottom"),
          at: (Globalize.culture().isRTL ? "right top" : "left top"),
          collision: "fit",
          offset: "-1 -1",
          of: self.input
        });
      }

      if ((self.input.offset().top + self.options.height) > $(window).height()) {
        self.root.css("top",-self.options.height);
        self.associatedGrid.resizeCanvas();
        self.root.position({
          my: (Globalize.culture().isRTL ? "right bottom" : "left bottom"),
          at: (Globalize.culture().isRTL ? "right top" : "left top"),
          collision: "fit",
          offset: "-1 -1",
          of: self.input
        });
      }
    },
    _select: function () {
      var self = this,
        grid = self.associatedGrid,
        item, fieldValue, selectedRows, selectedRowData, itemValue, i;

      if (!grid) {
        return;
      }

      setTimeout(function () {
        self.selectedIds = [];
        fieldValue = "";
        selectedRows = grid.getSelectedRows();
        selectedRowData = [];

        for (i = 0; i < selectedRows.length; i++) {
          item = grid.getDataItem(selectedRows[i]);
          if (item.isTreeMoreLink)
            return;
          itemValue = self.getDataItemValueForColumn(item, self.options.returnField);
          self.selectedIds.push({
            id: item[self.options.gridOptions.idProperty],
            value: itemValue
          });
          fieldValue += itemValue + (i + 1 == selectedRows.length ? "" : ",");
          selectedRowData.push(item);
        }

        //LMCLIENT-20637: null value guard for lookup fields
        if (fieldValue == "null")
          return;

        self.input.val(fieldValue);
        self._closeGridPopup(false);
        self.input.trigger("change", selectedRowData); //trigger change so that the right events fire and dirty shows up.

        var event = jQuery.Event("select"); //fire the select event.
        event.selectedRows = selectedRowData;
        self.input.trigger(event);
        self.input.data("isChanged", true);
      }, 50); //so select event happens first
    },
    _handleResize: function () {
      var self = this;
      if (self.resizeTimer) {
        clearTimeout(self.resizeTimer);
      }

      if (self.windowHeight != $(window).height() || self.windowWidth != $(window).width()) {
        self.resizeTimer = setTimeout(function () {
          self.setPosition();
        }, 100);
      }
    },
    _setOption: function () {
      $.Widget.prototype._setOption.apply(this, arguments);
      this.dataView = null;
    }
  });
}(jQuery));
