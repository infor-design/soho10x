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
			editable: false, //can the user type in the grid.
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
		gridDivId: "lookupGridDivId", //use a uuid not needed should only be one in a page at once.
		input: null,
		originalDataSet: null,
		selectedIds: [], //The selected Rows.
		_init: function () {
			var self = this,
			$input = $(this.element),
			newOpts = null,
			gridDiv;

			this.input = $input;

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
						gridDiv = self._createGridDiv();

						if (!self.options.ajaxOptions) {
							self.options.ajaxOptions = {
								url: self.options.url,
								type: "GET",
								dataType: "html",
								complete: function (jqXHR, status) {
									gridDiv.html(jqXHR.responseText);
									self._search(request, response, gridDiv);
								}
							};
						} else {
							self.options.ajaxOptions.complete = function (jqXHR, status) {
								gridDiv.html(jqXHR.responseText);
								self._search(request, response, gridDiv);
							};
							self.options.ajaxOptions.dataType = "html";
						}
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

					if (self.options.click) {
						self.options.click(event);
						return;
					}
          self.input.addClass("inforBusyIndicator small");

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
			});

			//Setup an editable type drop down styling and options
			if (!self.options.editable) {
				$input.data("selectOnly", true);
			}
		},
		_createGridDiv: function () {
			var $gridDiv = $("<div></div>").attr("id", this.gridDivId).addClass("inforLookupGrid").appendTo("body");
			$gridDiv.wrap("<div style='display:none' class='inforLookupGridBoxShadow'></div");

			return $gridDiv;
		},
		_search: function (request, response, gridDiv) {
			var self = this,
				count = 0,
				timer;

			if (gridDiv) { //we used an ajax url
				self.associatedGrid = gridDiv.find(".inforDataGrid:first").data("gridInstance");
				if (!self.associatedGrid) {
					timer = setInterval(function () {
						var elem = gridDiv.find(".inforDataGrid:first").data("gridInstance");

            if (count == 5){
              clearTimeout(timer);
            }

            if (elem) {
              self.associatedGrid = elem;
              self.options.gridOptions = self.associatedGrid.getOptions();
              self.options.gridOptions.dataset = self.associatedGrid.getData().getItems();
              self._completeResponse(request, response);
            }
						count++;
					}, 400);
				} else {
					self.options.gridOptions = self.associatedGrid.getOptions();
					self.options.gridOptions.dataset = self.associatedGrid.getData().getItems();
					self._completeResponse(request, response);
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
			var self = this, i, selectValue, row;

			this.selectedIds = [];

			//find the code value provided and set the associated text value in the input field and add to the selectedIds
			if (typeof (codeValue) == "object") { //should handle multiselect but no way to close dialog yet.
				for (i = 0; i < codeValue.length; i++) {
					this.selectedIds.push({
						id: codeValue[i]
					});
				}
			} else {
				this.selectedIds.push({
					id: codeValue
				});
			}

			selectValue = "";
			if (!this.selectedIds) {
				return;
			}

			$.each(this.selectedIds, function (index, value) {
				if (typeof value.id == "number" && isNaN(value.id)) {
					return;
				}

				row = self.getRowById(value.id);

				if (row) {
					selectValue += self.getDataItemValueForColumn(row, self.options.returnField) +
							(self.selectedIds.length - 1 != index ? "," : "");
				}
			});

			//remove last ,
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
			if (!this.options.gridOptions) {
				return null;
			}

			var dataset = this.options.gridOptions.dataset,
				response, i;


			if (!this.dataView) {
				this.dataView = new Slick.Data.DataView({idProperty: this.options.gridOptions.idProperty});
				this.dataView.setItems(this.options.gridOptions.dataset);

				//Execute Source..
				if (this.options.source) {
					response = function (data) {
						dataset = data;
					};
					this.options.source("", response);
				}
			}
			return this.dataView.getItemById(id);
		},
		destroy: function() {
			if (this.associatedGrid) {
				this.associatedGrid.destroy(true); //destroyed inside the grid editor
				this.associatedGrid = null;
			}
		},
		_closeGridPopup: function (isCancel) {
			//remove grid and page elements and animate
			var $gridDiv = $("#" + this.gridDivId),
				self = this,
				cell = this.input.closest(".slick-cell");

      if (this.associatedGrid) {
        this.associatedGrid.destroy();
        $('.popupmenu-wrapper:empty').remove();
      }

			$gridDiv.parent().css("opacity", 0); //improves appearance on ie 8 during fade out..
			$gridDiv.hide((isCancel ? "fade" : "fadeOut"), function () {
				$(this).closest('.inforLookupGridBoxShadow').remove();
			});

			$("#inforLookupOverlay").remove();
			this.input.removeClass("inforBusyIndicator small");

			//destroy grid
			if (!cell || (cell && !cell.hasClass("hasComboEditor") && cell.length > 0)) {
				this.destroy();
			}

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
				$gridDiv, isRTL, minHeight, ds, $overlay, selectedRows, dataRows, i, j, header, closeButton, dataView, filterExpr, columnFilterObject;

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
			if ($gridDiv.length === 0) {
				$gridDiv = self._createGridDiv();
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
			$overlay = $("#inforLookupOverlay");
			if ($overlay.length === 0) {
				$overlay = $('<div id="inforLookupOverlay"></div>').addClass('inforLookupOverlay')
					.appendTo(document.body)
					.css({
						width: $(window).width(),
						height: $(window).height()
					}).click(function () {
						if (self.options.gridOptions.multiSelect) {
							self._select();
						} else {
							self._closeGridPopup(true);
						}
					});
			}

			$overlay.css({
				width: $(window).width(),
				height: $(window).height()
			});

			this.input.removeClass("inforBusyIndicator small");

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
				this.associatedGrid.onClick.subscribe(function () {
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

			self.setPosition();
			this.input.closest(".inforTriggerField").addClass("focus");
		},
		resizeTimer: null,
		windowHeight: null,
		windowWidth: null,
		root: null,
		getSelectedValues: function () {
			return this.selectedIds;
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

			$("#inforLookupOverlay").height($(window).height()).width($(window).width());

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
					itemValue = self.getDataItemValueForColumn(item, self.options.returnField);
					self.selectedIds.push({
						id: item[self.options.gridOptions.idProperty],
						value: itemValue
					});
					fieldValue += itemValue + (i + 1 == selectedRows.length ? "" : ",");
					selectedRowData.push(item);
				}

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
