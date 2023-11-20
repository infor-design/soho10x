/*
* SlickGrid Core
*/
(function ($) {
  /*
  * An event object for passing data to event handlers and letting them control propagation.
  * This is pretty much identical to how W3C and jQuery implement events
  */
  function EventData() {
    var isPropagationStopped = false,
    isImmediatePropagationStopped = false;

    /*
    * Stops event from propagating up the DOM tree.
    */
    this.stopPropagation = function () {
      isPropagationStopped = true;
    };

    /*
    * Returns whether stopPropagation was called on this event object.
    */
    this.isPropagationStopped = function () {
      return isPropagationStopped;
    };

    /*
    * Prevents the rest of the handlers from being executed.
    */
    this.stopImmediatePropagation = function () {
      isImmediatePropagationStopped = true;
    };

    /*
    * Returns whether stopImmediatePropagation was called on this event object.\
    */
    this.isImmediatePropagationStopped = function () {
      return isImmediatePropagationStopped;
    };
  }

  /*
  * A simple publisher-subscriber implementation.
  */
  function Event() {
    var handlers = [];

    /*
    * Adds an event handler to be called when the event is fired.
    * <p>Event handler will receive two arguments - an <code>EventData</code> and the <code>data</code>
    * object the event was fired with.<p>
    */
    this.subscribe = function (fn) {
      handlers.push(fn);
    };

    /*
    * Removes an event handler added with <code>subscribe(fn)</code>.
    */
    this.unsubscribe = function (fn) {
      for (var i = handlers.length - 1; i >= 0; i--) {
        if (handlers[i] === fn) {
          handlers.splice(i, 1);
        }
        }
    };

    this.unsubscribeAll = function () {
      handlers = [];
    };

    this.getHandlers = function () {
      return handlers;
      };

    /*
      * Fires an event notifying all subscribers.
    */
    this.notify = function (args, e, scope) {
      var returnValue, i;

      e = e || new EventData();
      scope = scope || this;

      for (i = 0; i < handlers.length && !(e.isPropagationStopped() || e.isImmediatePropagationStopped()); i++) {
        returnValue = handlers[i].call(scope, e, args);
      }

      return returnValue;
    };
  }

  /*
  * A structure containing a range of cells.
  */
  function Range(fromRow, fromCell, toRow, toCell) {
    if (toRow === undefined && toCell === undefined) {
      toRow = fromRow;
      toCell = fromCell;
    }

    this.fromRow = Math.min(fromRow, toRow);
    this.fromCell = Math.min(fromCell, toCell);
    this.toRow = Math.max(fromRow, toRow);
    this.toCell = Math.max(fromCell, toCell);

    this.isSingleRow = function () {
      return this.fromRow === this.toRow;
    };
    this.isSingleCell = function () {
      return this.fromRow === this.toRow && this.fromCell === this.toCell;
    };
    this.contains = function (row, cell) {
      return row >= this.fromRow && row <= this.toRow &&
        cell >= this.fromCell && cell <= this.toCell;
    };

    this.toString = function () {
      if (this.isSingleCell()) {
        return "(" + this.fromRow + ":" + this.fromCell + ")";
      }
      else {
        return "(" + this.fromRow + ":" + this.fromCell + " - " + this.toRow + ":" + this.toCell + ")";
      }
    };
  }


  /*
  * A base class that all special / non-data rows (like Group and GroupTotals) derive from.
  */
  function NonDataItem() {
    this.__nonDataRow = true;
  }

  /*
  * Information about a group of rows.
  */
  function Group() {
    this.__group = true;
    this.__updated = false;

    /*
    * Number of rows in the group.
    * @property count
    * @type {Integer}
    */
    this.count = 0;

    /*
    * Grouping value.
    * @property value
    * @type {Object}
    */
    this.value = null;

    /*
    * Formatted display value of the group.
    * @property title
    * @type {String}
    */
    this.title = null;

    /*
    * Whether a group is collapsed.
    * @property collapsed
    * @type {Boolean}
    */
    this.collapsed = false;

    /*
    * GroupTotals, if any.
    * @property totals
    * @type {GroupTotals}
    */
    this.totals = null;
  }

  Group.prototype = new NonDataItem();

  /*
  * Compares two Group instances.
  * @method equals
  * @return {Boolean}
  * @param group {Group} Group instance to compare to.
  */
  Group.prototype.equals = function (group) {
    return this.value === group.value &&
      this.count === group.count &&
      this.collapsed === group.collapsed;
  };

  /*
  * Information about group totals.
  * An instance of GroupTotals will be created for each totals row and passed to the aggregators
  * so that they can store arbitrary data in it. That data can later be accessed by group totals
  * formatters during the display.
  * @class GroupTotals
  * @extends Slick.NonDataItem
  * @constructor
  */
  function GroupTotals() {
    this.__groupTotals = true;

    /*
    * Parent Group.
    * @param group
    * @type {Group}
    */
    this.group = null;
    }

  GroupTotals.prototype = new NonDataItem();

  /*
  * A locking helper to track the active edit controller and ensure that only a single controller
  * can be active at a time. This prevents a whole class of state and validation synchronization
  * issues. An edit controller (such as InforDataGrid) can query if an active edit is in progress
  * and attempt a commit or cancel before proceeding.
  * @class EditorLock
  * @constructor
  */
  function EditorLock() {
    var activeEditController = null;

    /*
    * Returns true if a specified edit controller is active (has the edit lock).
    * If the parameter is not specified, returns true if any edit controller is active.
    * @method isActive
    * @param editController {EditController}
    * @return {Boolean}
    */
    this.isActive = function (editController) {
      return (editController ? activeEditController === editController : activeEditController !== null);
    };

    /*
    * Sets the specified edit controller as the active edit controller (acquire edit lock).
    * If another edit controller is already active, and exception will be thrown.
    * @method activate
    * @param editController {EditController} edit controller acquiring the lock
    */
    this.activate = function (editController) {
      if (editController === activeEditController) { // already activated?
        return;
      }
      if (activeEditController !== null) {
        throw "InforDataGrid.EditorLock.activate: an editController is still active, can't activate another editController";
      }
      if (!editController.commitCurrentEdit) {
        throw "InforDataGrid.EditorLock.activate: editController must implement .commitCurrentEdit()";
      }
      if (!editController.cancelCurrentEdit) {
        throw "InforDataGrid.EditorLock.activate: editController must implement .cancelCurrentEdit()";
      }
      activeEditController = editController;
    };

    /*
    * Unsets the specified edit controller as the active edit controller (release edit lock).
    * If the specified edit controller is not the active one, an exception will be thrown.
    * @method deactivate
    * @param editController {EditController} edit controller releasing the lock
    */
    this.deactivate = function (editController) {
      if (activeEditController !== editController) {
        throw "InforDataGrid.EditorLock.deactivate: specified editController is not the currently active one";
      }
      activeEditController = null;
    };

    /*
    * Attempts to commit the current edit by calling "commitCurrentEdit" method on the active edit
    * controller and returns whether the commit attempt was successful (commit may fail due to validation
    * errors, etc.). Edit controller's "commitCurrentEdit" must return true if the commit has succeeded
    * and false otherwise. If no edit controller is active, returns true.
    * @method commitCurrentEdit
    * @return {Boolean}
    */
    this.commitCurrentEdit = function () {
      return (activeEditController ? activeEditController.commitCurrentEdit() : true);
    };

    /*
    * Attempts to cancel the current edit by calling "cancelCurrentEdit" method on the active edit
    * controller and returns whether the edit was successfully cancelled. If no edit controller is
    * active, returns true.
    * @method cancelCurrentEdit
    * @return {Boolean}
    */
    this.cancelCurrentEdit = function cancelCurrentEdit() {
      return (activeEditController ? activeEditController.cancelCurrentEdit() : true);
    };
  }

  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Event": Event,
      "EventData": EventData,
      "Range": Range,
      "NonDataRow": NonDataItem,
      "Group": Group,
      "GroupTotals": GroupTotals,
      "EditorLock": EditorLock,

      //A global singleton editor lock.
      "GlobalEditorLock": new EditorLock()
    }
  });
})($);

/*
* InforDataGrid
*/
(function ($) {
  $.extend(true, window, {
    Slick: {
      Grid: SlickGrid
    }
  });

  var scrollbarDimensions; // shared across all grids on this page

  function SlickGrid(container, data, columnsInput, options) { //ignore jslint
    // settings
    var defaults = {
      headerHeight: 25,
      rowHeight: 26,
      defaultColumnWidth: 80,
      enableAddRow: false,
      editable: false,
      autoEdit: true,
      enableCellNavigation: true,
      enableCellRangeSelection: false,
      enableColumnReorder: true,
      asyncEditorLoading: false,
      asyncEditorLoadDelay: 100,
      forceFitColumns: false,
      enableAsyncPostRender: false,
      asyncPostRenderDelay: 50,
      autoHeight: false,
      autoHeightToPageSize: false,
      fillHeight: true,
      editorLock: Slick.GlobalEditorLock,
      showHeaderRow: false,
      showSummaryRow: false,
      headerRowHeight: 27,
      summaryRowHeight: 25,
      showTopPanel: false,
      topPanelHeight: 25,
      formatterFactory: null,
      editorFactory: null,
      selectedCellCssClass: "selected",
      multiSelect: true,
      fullWidthRows: true,
      multiColumnSort: true,
      filterMenuOptions: null,
      gridMenuOptions: null,
      showColumnHeaders: true,
      frozenColumn: -1,
      frozenRow: -1,
      //persistSelections will keep records checked between filter/paging
      persistSelections: false
    },
    columnDefaults = {
      name: "",
      resizable: true,
      sortable: true,
      reorderable: true,
      minWidth: 15,
      headerCssClass: null,
      rerenderOnResize: false,
      defaultSortAsc: true,
      hidable: true,
      focusable: true,
      selectable: true
    },
    maxSupportedCssHeight, // browser's breaking point
    th, // virtual height
    h, // real scrollable height
    ph, // page height
    n, // number of pages
    cj, // "jumpiness" coefficient
    defaultColumns = $.extend(true, [], columnsInput),  //deep copy the array for restore function
    page = 0, // current page
    offset = 0, // current page offset
    vScrollDir = 1,
    // private
    initialized = false,
    $container,
    uid = 'inforDataGrid' + Math.round(1000000 * Math.random()),
    settingsMenuId = uid.replace('inforDataGrid', 'inforGridSettingsMenu'),
    filterMenuId = uid.replace('inforDataGrid', 'inforGridFilterMenu'),
    self = this,
    $headerScroller, $headerParentL , $headerParentR,
    $headers,
    $headerParents,
    $headerRow, $headerRowScroller, $headerRowSpacerL, $headerRowSpacerR, $summaryRow, $summaryRowScroller,
    $topPanelScroller,
    $topPanel,
    $viewport,
    $pageFooter,
    checkboxSelector,
    isDragging = false,

    $gridSettingsButton,
    $filterMenuButton,
    $canvas,
    $style,
    stylesheet, columnCssRulesL = [], columnCssRulesR = [],
    viewportH, viewportW,
    canvasWidth, canvasWidthL, canvasWidthR,
    viewportHasHScroll, viewportHasVScroll,

    headerColumnWidthDiff = 0, headerColumnHeightDiff = 0, // border+padding
    cellWidthDiff = 0, cellHeightDiff = 0,
    absoluteColumnMinWidth,
    numberOfRows = 0,
    hasFrozenRows = false,
    frozenRowsHeight = 0,
    actualFrozenRow = -1,
    dataView = data,
    filterInResults = true,
    allColumns = [],  //both the hidden and non hidden columns

    activePosX,
    tabbingDirection = 1,
    activeRow, activeCell,
    activeHeaderCell,
    activeCellNode = null,
    currentEditor = null,
    serializedEditorValue,
    editController,

    rowsCache = {},
    rowPositionCache = {},
    renderedRows = 0,
    prevScrollTop = 0,
    scrollTop = 0,
    lastRenderedScrollTop = 0,
    lastRenderedScrollLeft = 0,
    prevScrollLeft = 0,
    scrollLeft = 0,
    selectionModel,
    selectedRows = [],

    plugins = [],
    columns = [],
    hasNestedColumns = false,
    nestedColumns = null,
    cellCssClasses = {},

    columnsById = {},
    sortColumns = [],
    columnPosLeft = [],
    columnPosRight = [],

    // async call handles
    h_editorLoader = null,
    h_render = null,
    h_postrender = null,
    postProcessedRows = {},
    postProcessToRow = null,
    postProcessFromRow = null,

    $paneHeaderL, $paneHeaderR, $paneTopL, $paneTopR,
    $headerScrollerL, $headerScrollerR,
    $headerL, $headerR,
    $headerRowScrollerL, $headerRowScrollerR,
    $summaryRowScrollerL, $summaryRowScrollerR,
    $headerRowL, $headerRowR,
    $summaryRowL, $summaryRowR,
    $topPanelScrollerL, $topPanelScrollerR,
    $viewportTopL, $viewportTopR,
    $canvasTopL, $canvasTopR,
    $canvasBottomL, $canvasBottomR,
    $viewportScrollContainerX, $viewportScrollContainerY,
    $headerScrollContainer, $headerRowScrollContainer, $summaryRowScrollContainer,

    // Handle Window Resizing
    resizeTimer = null,
    windowHeight = $(window).height(), windowWidth = $(window).width(),
    columnFilters = {},
    isFiltering = false,
    selectedRecordArea = null,
    columnpicker = null,
    personalizationInfo = {caller: '', sortColumns:[] ,  columnInfo: [], showFilter: true, filterInResults: true};

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Initialization
    function init() {
      $container = $(container);
      if ($container.length < 1) {
        throw new Error("InforDataGrid requires a valid container, " + container + " does not exist in the DOM.");
      }
      maxSupportedCssHeight = getMaxSupportedCssHeight();

      scrollbarDimensions = scrollbarDimensions || measureScrollbar(); // skip measurement if already have dimensions
      options = $.extend({}, defaults, options);
      columnDefaults.width = options.defaultColumnWidth;

      columnsById = {};
      addBuiltinColumns();
      parseColumns(columnsInput);

      editController = {
        "commitCurrentEdit": commitCurrentEdit,
        "cancelCurrentEdit": cancelCurrentEdit,
        "conditionalAutoCommit": conditionalAutoCommit
      };

      var owns = uid + "canvasTopL" + " " + uid + "headerScrollerL";
      if (options.frozenColumn > -1) {
        owns += " " + uid + "canvasTopR" + " " + uid + "headerScrollerR";
      }

      $container
        .empty()
        .attr("tabIndex", 0)
        .css("overflow", "hidden")
        .css("outline", 0)
        .attr('role', 'grid')
        .attr("aria-owns", owns)
        .addClass(uid);

      if ($container.css("height") !== "0px") {
        //detect css height
        options.fillHeight = false;
      }

      // set up a positioning container if needed
      if (!/relative|absolute|fixed/.test($container.css("position"))) {
        $container.css("position", "relative");
      }


      // Containers used for scrolling frozen columns and rows
      $paneHeaderL = $("<div class='slick-pane slick-pane-header slick-pane-left'  />").appendTo($container);
      $paneHeaderR = $("<div class='slick-pane slick-pane-header slick-pane-right'  />").appendTo($container);
      $paneTopL = $("<div class='slick-pane slick-pane-top slick-pane-left'  />").appendTo($container);
      $paneTopR = $("<div class='slick-pane slick-pane-top slick-pane-right'  />").appendTo($container);

      // Append the header scroller containers
      $headerScrollerL = $("<div class='slick-header slick-header-left' role='rowgroup'  id='" + uid + "headerScrollerL'/>").appendTo($paneHeaderL);
      $headerScrollerR = $("<div class='slick-header slick-header-right' role='rowgroup'  id='" + uid + "headerScrollerR'/>").appendTo($paneHeaderR);

      // Cache the header scroller containers
      $headerScroller = $().add($headerScrollerL).add($headerScrollerR);
      $headerParentL = $("<div />").appendTo($headerScrollerL);
      $headerParentR = $("<div />").appendTo($headerScrollerR);

      // Append the columnn containers to the headers
      $headerL = $("<div class='slick-header-columns slick-header-columns-left' role='row' style='" + (Globalize.culture().isRTL ? "right:-1000px" : "left:-1000px") + "' />").appendTo($headerScrollerL);
      $headerR = $("<div class='slick-header-columns slick-header-columns-right' role='row' style='" + (Globalize.culture().isRTL ? "right:-1000px" : "left:-1000px") + "'  />").appendTo($headerScrollerR);

      // Cache the header columns
      $headers = $().add($headerL).add($headerR);
      $headerParents = $().add($headerParentL).add($headerParentR);

      $headerRowScrollerL = $("<div class='slick-headerrow' />").appendTo($paneTopL).scroll(function () {
        $viewportTopL[0].scrollLeft = this.scrollLeft;
      });
      $headerRowScrollerR = $("<div class='slick-headerrow' />").appendTo($paneTopR).scroll(function () {
        $viewportTopR[0].scrollLeft = this.scrollLeft;
      });
      $headerRowScroller = $().add($headerRowScrollerL).add($headerRowScrollerR);

      $headerRowSpacerL = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
        .css("width", getCanvasWidth() + scrollbarDimensions.width + "px")
        .appendTo($headerRowScrollerL);

      $headerRowSpacerR = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
        .css("width", getCanvasWidth() + scrollbarDimensions.width + "px")
        .appendTo($headerRowScrollerR);

      $headerRowL = $("<div class='slick-headerrow-columns slick-headerrow-columns-left' />").appendTo($headerRowScrollerL);
      $headerRowR = $("<div class='slick-headerrow-columns slick-headerrow-columns-right' />").appendTo($headerRowScrollerR);
      $headerRow = $().add($headerRowL).add($headerRowR);

      $topPanelScrollerL = $("<div class='slick-top-panel-scroller' />").appendTo($paneTopL);
      $topPanelScrollerR = $("<div class='slick-top-panel-scroller' />").appendTo($paneTopR);
      $topPanelScroller = $().add($topPanelScrollerL).add($topPanelScrollerR);

      if (!options.showTopPanel) {
        $topPanelScroller.hide();
      }

      if (!options.showHeaderRow) {
        $headerRowScroller.hide();
      }

      if (!options.showColumnHeaders) {
        $headerScroller.hide();
      }

      $viewportTopL = $("<div class='slick-viewport slick-viewport-top slick-viewport-left' />").appendTo($paneTopL);
      $viewportTopR = $("<div class='slick-viewport slick-viewport-top slick-viewport-right'   />").appendTo($paneTopR);

      $viewport = $().add($viewportTopL).add($viewportTopR);
      setOverflow();

      // Append the canvas containers
      $canvasTopL = $("<div class='grid-canvas grid-canvas-top grid-canvas-left' role='rowgroup'  id='" + uid + "canvasTopL' />").appendTo($viewportTopL);
      $canvasTopR = $("<div class='grid-canvas grid-canvas-top grid-canvas-right' role='rowgroup'  id='" + uid + "canvasTopR'  />").appendTo($viewportTopR);
      // Cache the canvases
      $canvas = $().add($canvasTopL).add($canvasTopR);

      $summaryRowScrollerL = $("<div class='slick-summaryrow' />").appendTo($paneTopL);
      $summaryRowScrollerR = $("<div class='slick-summaryrow' />").appendTo($paneTopR);
      $summaryRowScroller = $().add($summaryRowScrollerL).add($summaryRowScrollerR);
      $summaryRowL = $("<div class='slick-summaryrow-columns slick-summaryrow-columns-left' />").appendTo($summaryRowScrollerL);
      $summaryRowR = $("<div class='slick-summaryrow-columns slick-summaryrow-columns-right' />").appendTo($summaryRowScrollerR);
      $summaryRow = $().add($summaryRowL).add($summaryRowR);
      var $summaryRowSpacerL = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
        .css("width", getCanvasWidth() + scrollbarDimensions.width + "px")
        .appendTo($summaryRowScrollerL);

      var $summaryRowSpacerR = $("<div style='display:block;height:1px;position:absolute;top:0;left:0;'></div>")
        .css("width", getCanvasWidth() + scrollbarDimensions.width + "px")
        .appendTo($summaryRowScrollerR);

      $pageFooter = $(".inforBottomFooter");

      if (!options.showSummaryRow) {
        $summaryRowScroller.hide();
      }

      // header columns and cells may have different padding/border skewing width calculations (box-sizing, hello?)
      // calculate the diff so we can set consistent sizes
      measureCellPaddingAndBorder();

      // for usability reasons, all text selection in InforDataGrid is disabled
      // with the exception of input and textarea elements (selection must
      // be enabled there so that editors work as expected); note that
      // selection in grid cells (grid body) is already unavailable in
      // all browsers except IE
      disableSelection($headers); // disable all text selection in header (including input and textarea)
      disableSelection($headerParents);

      viewportW = parseFloat($.css($container[0], "width", true));

      setFrozenOptions();
      setPaneVisibility();
      setScroller();
      setOverflow();

      updateColumnCaches();
      createColumnHeaders();
      setupColumnSort();
      createCssRules();
      initializeRowPositions();
      cacheRowPositions();
      resizeAndRender();

      bindAncestorScrollEvents();

      if (options.frozenColumn > -1) {
        $viewportTopL.mousewheel(handleMouseWheel);
        $container.addClass("hasFrozenColumns");
      }

      $viewport.on("scroll", handleScroll);
      $(window).on("throttledresize.inforDataGrid", function () {
        handleResize();
      });

      $headerScroller
        .on("contextmenu", handleHeaderContextMenu)
        .on("click", handleHeaderClick);

      $container
        .on("keydown", handleKeyDown)
        .on("click", handleClick)
        .on("contextmenu", handleContextMenu)
        .on("draginit", handleDragInit)
        .on("dragstart", {distance: 3}, handleDragStart)
        .on("drag", handleDrag)
        .on("dragend", handleDragEnd)
        .on("focus", handleGridFocusIn)
        .delegate(".slick-cell", "mouseenter", handleMouseEnter)
        .delegate(".slick-cell", "mouseleave", handleMouseLeave)
        .delegate(".slick-row", "mouseenter", handleRowMouseEnter)
        .delegate(".slick-row", "mouseleave", handleRowMouseLeave);

      if (!initialized) {
        initialized = true;
      }
    }

    function handleResize() {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      if (windowHeight !== $(window).height() || windowWidth !== $(window).width()) {
        resizeTimer = setTimeout(function () {
          resizeCanvas();
        }, 1);

        windowHeight = $(window).height();
        windowWidth = $(window).width();
      }
    }

    function registerPlugin(plugin) {
      plugins.unshift(plugin);
      plugin.init(self);
    }

    function getPlugin(name) {
      for (i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        if (plugin.name === name) {
          return plugins[i];
        }
      }
    }

    function unregisterPlugin(plugin) {
      for (var i = plugins.length; i >= 0; i--) {
        if (plugins[i] === plugin) {
          if (plugins[i].destroy) {
            plugins[i].destroy();
          }
          plugins.splice(i, 1);
          break;
        }
      }
    }

    function setSelectionModel(model) {
      if (selectionModel) {
        selectionModel.onSelectedRangesChanged.unsubscribe(handleSelectedRangesChanged);
        if (selectionModel.destroy) {
          selectionModel.destroy();
        }
      }

      selectionModel = model;
      selectionModel.init(self);

      selectionModel.onSelectedRangesChanged.subscribe(handleSelectedRangesChanged);
    }

    function getSelectionModel() {
      return selectionModel;
    }

    function getCanvasNode() {
      return $canvas;
    }


    function measureScrollbar() {
      var $c = $("<div style='position:absolute; top:-40000px; left:-40000px; width:100px; height:100px; overflow:scroll;'></div>").appendTo("body"),
      dim = {
        width: $c.width() - $c[0].clientWidth,
        height: $c.height() - $c[0].clientHeight
      };
      $c.remove();
      return dim;
    }

    function getHeadersWidth() {
      headersWidth = headersWidthL = headersWidthR = 0;

      for ( var i = 0, ii = columns.length; i < ii; i++ ) {
        var width = columns[ i ].width;
        if ( ( options.frozenColumn ) > -1 && ( i > options.frozenColumn ) ) {
          headersWidthR += width;
        } else {
          headersWidthL += width;
        }
      }

      if ( options.frozenColumn > -1 ) {
        headersWidthL = headersWidthL + 1000;
        headersWidthR = Math.max( headersWidthR, viewportW ) + headersWidthL;
        headersWidthR += scrollbarDimensions.width;
      } else {
        headersWidthL += scrollbarDimensions.width;
        headersWidthL = Math.max( headersWidthL, viewportW ) + 1000;
      }

      headersWidth = headersWidthL + headersWidthR;
    }

    function getCanvasWidth() {
      var totalRowWidth, availableWidth;

      //refresh dimensions
      viewportW = parseFloat($.css($container[0], "width", true));

      availableWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width - 1 : viewportW,
      i = columns.length;

      canvasWidthL = canvasWidthR = 0;

      while (i--) {
        if ((options.frozenColumn > -1) && (i > options.frozenColumn)) {
          canvasWidthR += columns[i].width;
        } else {
          canvasWidthL += columns[i].width;
        }
      }

      if (Globalize.culture().isRTL && viewportHasHScroll) {
        canvasWidthR += scrollbarDimensions.width + 5;
        canvasWidthL += scrollbarDimensions.width + 5;
      }

      totalRowWidth = canvasWidthL + canvasWidthR;

      if (options.fullWidthRows && availableWidth > canvasWidthL && (options.frozenColumn === -1)) {
        canvasWidthL = availableWidth;
      }

      if (options.fullWidthRows && availableWidth > totalRowWidth && (options.frozenColumn > -1)) {
        canvasWidthR = availableWidth - canvasWidthL - 1;
      }

      /* TODO - see if this is ok.
      if ((options.showGridSettings || options.showFilter)) {
        if (canvasWidthR > availableWidth && canvasWidthR > 0) {
          canvasWidthR += 22;
        }
        if (options.frozenColumn === -1 && (canvasWidthL > availableWidth && canvasWidthL > 0)) {
          canvasWidthL += 22;
        }
      }*/

      return options.fullWidthRows ? Math.max(totalRowWidth, availableWidth) : totalRowWidth;
    }

    function updateCanvasWidth(forceColumnWidthsUpdate) {
      var oldCanvasWidth = canvasWidth,
        oldCanvasWidthL = canvasWidthL,
        oldCanvasWidthR = canvasWidthR,
        widthChanged;

      canvasWidth = getCanvasWidth();
      widthChanged = canvasWidth !== oldCanvasWidth || canvasWidthL !== oldCanvasWidthL || canvasWidthR !== oldCanvasWidthR;

      if (widthChanged || options.frozenColumn > -1) {
        $canvasTopL.css("width", canvasWidthL + "px");

        $headerL.css("width", headersWidthL + "px");
        $headerR.css("width", headersWidthR + "px");
        $headerParentL.css("width", headersWidthL + "px");
        $headerParentR.css("width", headersWidthR + "px");

        if (options.frozenColumn > -1) {
          $canvasTopR.css("width", canvasWidthR + "px");

          $paneHeaderL.css("width", canvasWidthL + "px");
          $paneHeaderR.css('left', canvasWidthL + "px");

          $paneTopL.css("width", canvasWidthL + "px");
          $paneTopR.css('left', canvasWidthL + "px");

          $headerRowScrollerL.css("width", canvasWidthL + "px");
          $headerRowScrollerR.css("width", viewportW - canvasWidthL + "px");
          $summaryRowScrollerL.css("width", canvasWidthL + "px");
          $summaryRowScrollerR.css("width", viewportW - canvasWidthL + "px");

          $headerRowL.css("width", canvasWidthL + "px");
          $headerRowR.css("width", canvasWidthR + "px");
          $summaryRowL.css("width", canvasWidthL + "px");
          $summaryRowR.css("width", canvasWidthR + "px");

          $viewportTopL.css("width", canvasWidthL + "px");
          $viewportTopR.css("width", viewportW - canvasWidthL + "px");

        } else {
          $paneHeaderL.css("width", "100%");
          $paneTopL.css("width", "100%");
          $headerRowScrollerL.css("width", "100%");
          $summaryRowScrollerL.css("width", "100%");
          $headerRowL.css("width", canvasWidth + "px");
          $summaryRowL.css("width", canvasWidth + "px");
          $viewportTopL.css("width", "100%");
        }

        viewportHasHScroll = (canvasWidth > viewportW - scrollbarDimensions.width);
      }

      getHeadersWidth();
      $headerL.css("width", headersWidthL + "px");
      $headerR.css("width", headersWidthR + "px");
      $headerRowSpacerL.css("width", canvasWidth + (viewportHasVScroll ? scrollbarDimensions.width : 0) + "px");
      $headerRowSpacerR.css("width", canvasWidth + (viewportHasVScroll ? scrollbarDimensions.width : 0) + "px");

      if (widthChanged || forceColumnWidthsUpdate) {
        applyColumnWidths();
        updateFilterRow();
      }
    }

    function disableSelection($target) {
      if ($target && $target.jquery) {
        $target
          .attr('unselectable', 'on')
          .css('MozUserSelect', 'none')
          .on('selectstart.ui', function () { return false; }); // from jquery:ui.core.js 1.7.2
      }
    }

    /*add the button menus*/
    function appendGridSettingsMenu() {
      appendMenu(settingsMenuId, options.gridMenuOptions);
    }

    /*dynamically add the menu contents and call*/
    function appendMenu(menuid, menuOpts) {
      $("#" + menuid).remove();

      var ul = $('<ul id="' + menuid + '" class="popupmenu divider"></ul>'),
        i, opt, li, a, show;

      for (i = 0; i < menuOpts.length; i++) {
        opt = menuOpts[i];
        show = (opt.condition === undefined ? true : opt.condition);

        if (show) {
          if (opt.label) {
            li = $('<li><a>' + opt.label + '</a></li>');
          } else {
            li = $('<li></li>');
          }

          a = li.find("a");

          if (opt.id) {
            a.attr("id", opt.id);
          }

          if (opt.cssClass) {
            a.before($("<span></span>").addClass("icon " + opt.cssClass));
          }

          if (opt.href) {
            a.attr("href", opt.href);
          }

          if (opt.onclick) {
            a.attr("onclick", opt.onclick);
          }

          ul.append(li);
        }
      }
      $("body").append(ul);
    }

    /*add the button menus*/
    function appendFilterMenu() {
      appendMenu(filterMenuId, options.filterMenuOptions);
    }

    //set the menu options as checked or unchecked depending on the current values.
    function setMenuChecked() {
      //set the show filter row...
      var menu = $("#" + settingsMenuId),
        isChecked = (options.showHeaderRow === true),
        li = menu.find("#showFilter").parent(),
        data = getFilteredData();

      if (isChecked) {
        li.find(".icon").removeClass("notSelected").addClass("selected");
      } else {
        li.find(".icon").removeClass("selected").addClass("notSelected");
      }

      //disable export if no data
      li =  menu.find("a[href='#ex']").parent();
      if (data.length === 0) {
        li.attr("class","disabled");
      } else {
        li.removeClass("disabled");
      }

      //set the toggle in results
      menu = $("#" + filterMenuId);
      li =  menu.find("#filterInResults").parent();
      if (filterInResults) {
        li.find(".icon").removeClass("notSelected").addClass("selected");
      } else {
        li.find(".icon").removeClass("selected").addClass("notSelected");
      }
    }

    /* Update Headers to remove extra border. */
    function showGridSettings() {
      if (!options.showColumnHeaders) {
        return;
      }

      if (!$gridSettingsButton) {
        $gridSettingsButton = $("<button type='button' tabindex='-1' class='inforGridSettingsButton' title='" + Globalize.localize("GridSettings") + "'><span>" + Globalize.localize("GridSettings") + "</span></button>").tooltip();

        if (Globalize.culture().isRTL) {
          $gridSettingsButton.addClass("inforRTLFlip");
        }

        $container.prepend($gridSettingsButton);
        appendGridSettingsMenu();
      }

      var leftOffset = -20;
      if (Globalize.culture().isRTL) {
        leftOffset = 5;
      }

      if (!options.showGridSettings) {
        $gridSettingsButton.hide();
        return;
      }

      $gridSettingsButton.popupmenu({menu: settingsMenuId})
        .on('beforeOpen', function() {
          setMenuChecked();
        })
        .on('selected', function (e, anchor) {
            var action = anchor.attr('href').substr(1);

            //ignore disabled
            if (anchor.parent().hasClass("disabled")){
              return;
            }

            if (action === "sfr") {
              toggleFilterRow();
            }

            if (action === "cp") {
              columnPersonalization($(this));
            }

            if (action === "ex") {
              excelExport();
            }

            if (action === "re") {
              resetColumnLayout();
            }
        });
    }

    function excelExport() {  //find the cell range selector plugin and call it
      getPlugin("CellRangeSelector").excelExport();
    }

    function convertToCsv(json, title) {  //find the cell range selector plugin and call it
      getPlugin("CellRangeSelector").convertToCsv(json, title);
    }

    function getFilteredData() {
      var dv = getData();
      return  dv.getFilteredAndPagedItems(dv.getItems(), filter).rows;
    }


    function getDirtyRows(commitEdits) {
      //Commit any pending edits...
      var commitEdits = commitEdits || false,
        allRows = getData(commitEdits).getItems(),
        dirty = [], i;

      for (i = 0; i < allRows.length; i++) {
        if (allRows[i].indicator === "dirty") {
          dirty.push(allRows[i]);
        }
      }
      return dirty;
    }

    //add and show the column picker
    function columnPersonalization(button) {
      saveColumns();  //save once ..

      if (columnpicker) {
        columnpicker.destroy();
        columnpicker = null;
      }
      // clean up any column picker menus
      $('.slick-columnpicker').remove();

      if (columnpicker == null) {
        columnpicker = new Slick.Controls.ColumnPicker(self, options);
      }
      columnpicker.open(button);
    }

    function getMaxSupportedCssHeight() {
    var supportedHeight = 1000000;
    // FF reports the height back but still renders blank after ~6M px
    var testUpTo = navigator.userAgent.toLowerCase().match(/firefox/) ? 6000000 : 1000000000;
    var div = $("<div style='display:none' />").appendTo(document.body);

    while (true) {
      var test = supportedHeight * 2;
      div.css("height", test);
      if (test > testUpTo || div.height() !== test) {
      break;
      } else {
      supportedHeight = test;
      }
    }

    div.remove();
    return supportedHeight;
    }

    // This is static might need to handle page mutation.
    function bindAncestorScrollEvents() {
      var elem = $canvas[0];
      while ((elem = elem.parentNode) !== document.body) {
        // bind to scroll containers only
        if (elem === $viewport[0] || elem.scrollWidth !== elem.clientWidth || elem.scrollHeight !== elem.clientHeight) {
          $(elem).on("scroll.ancestors", handleActiveCellPositionChange);
        }
      }
    }

    function unbindAncestorScrollEvents() {
        $canvas.parents().off("scroll.ancestors");
    }

    function getNestedColumn(columnId) {
      for (var i = 0; i < nestedColumns.length -1; i++) {
        var parent = nestedColumns[i];
        for (var j = 0; j < parent.length; j++) {
          if (parent[j].id === columnId) {
            return parent[j];
          }
        }
      }
    }

    function updateColumnHeader(columnId, title, toolTip) {
      if (!initialized) {
        return;
      }
      var idx = getColumnIndex(columnId), columnDef, $header;

      if (idx != null) {
        columnDef = columns[idx];
        $header = $headers.children().eq(idx);
      }

      if (hasNestedColumns && idx != null && columnDef.spacers.length > 0) {
        $header = $headerParents.children().children().eq(idx);
      }

      if (hasNestedColumns && idx == null) {
        $header = $("#" + uid+columnId);
        column = getNestedColumn(columnId);
        if (title !== undefined) {
          column.name = title;
        }
        if (toolTip !== undefined) {
          column.toolTip = toolTip;
        }
      }

      if ($header) {
        if (title !== undefined && idx != null) {
          columns[idx].name = title;
        }
        if (toolTip !== undefined && idx != null) {
          columns[idx].toolTip = toolTip;
        }

        if (columnId === 'checkbox-selector') {
          $header.find('.selector-checkbox-header').attr('class', title);
        } else {
          $header.find(".slick-column-name").html(title);
        }

        trigger(self.onBeforeHeaderCellDestroy, {
          "node": $header[0],
          "column": columnDef
        });

        if ($header.attr("title")) {
          $header.attr("title", toolTip || "").find(".slick-column-name").html(title).tooltip();
        }

        trigger(self.onHeaderCellRendered, {
          "node": $header[0],
          "column": columnDef
        });
      }
    }

    function getHeaderRow() {
      return (options.frozenColumn > -1) ? $headerRow : $headerRow[0];
    }

    function getSummaryRow() {
      return (options.frozenColumn > -1) ? $summaryRow : $summaryRow[0];
    }

    function getHeaderRowColumn(columnId) {
      var idx = getColumnIndex(columnId),
        $headerRowTarget;

      if (options.frozenColumn > -1) {
        if (idx <= options.frozenColumn) {
          $headerRowTarget = $headerRowL;
        } else {
          $headerRowTarget = $headerRowR;
          idx -= options.frozenColumn + 1;
        }
      } else {
        $headerRowTarget = $headerRowL;
      }

      var $header = $headerRowTarget.children().eq(idx);
      return $header && $header[0];
    }

    function getColumnChildren(columnId) {
      var idx = getColumnIndex(columnId),
        $headerRowTarget;

      if (options.frozenColumn > -1) {
        if (idx <= options.frozenColumn) {
          $headerRowTarget = $headerL;
        } else {
          $headerRowTarget = $headerR;
          idx -= options.frozenColumn + 1;
        }
      } else {
        $headerRowTarget = $headerL;
      }

      var $header = $headerRowTarget.children().eq(idx);
      return $header;
    }

    function getSummaryRowColumn(columnId) {
      var idx = getColumnIndex(columnId),
        $summaryRowTarget;

      if (options.frozenColumn > -1) {
        if (idx <= options.frozenColumn) {
          $summaryRowTarget = $summaryRowL;
        } else {
          $summaryRowTarget = $summaryRowR;

          idx -= options.frozenColumn + 1;
          }
      } else {
        $summaryRowTarget = $summaryRowL;
      }

      var $summary= $summaryRowTarget.children().eq(idx);
      return $summary && $summary[0];
    }

    function RequiredFieldValidator(value) {
      if (typeof value === "string" && $.trim(value).length === 0) {
        return { valid: false, msg: Globalize.localize("Required") };
      }
      if (value == null || value === undefined || (typeof value === "string" && !value.length)) {
        return { valid: false, msg: Globalize.localize("Required") };
      }
      else {
        return { valid: true, msg: null };
      }
    }

    function createColumnHeaders() {

      function onMouseEnter() {
        var col = $(this),
          id = col.data("columnId"),
          columnInfo = getColumns()[getColumnIndex(id)];

        if (columnInfo && columnInfo.sortable) {
          col.addClass("ui-state-hover");
          $(getHeaderRowColumn(id)).addClass("ui-state-hover");
          self.getColumnChildren(id).addClass("ui-state-hover");
        }
        if (columnInfo && columnInfo.resizable && !columnInfo.sortable) {
          col.addClass("ui-state-resizable");
          $(getHeaderRowColumn(id)).addClass("ui-state-resizable");
          self.getColumnChildren(id).addClass("ui-state-resizable");
        }
      }

      function onMouseLeave() {
        var col = $(this);
        col.removeClass("ui-state-hover ui-state-resizable");
        $(getHeaderRowColumn(col.data("columnId"))).removeClass("ui-state-hover ui-state-resizable");
        self.getColumnChildren(col.data("columnId")).removeClass("ui-state-hover ui-state-resizable");
      }

      function createColumnHeader(m, appendTo, isParent) {
        var name = (m.name === undefined ? '' : ( m.name.indexOf('selector-checkbox-header') === 0 ? '<div class="' + m.name + '"></div>' :m.name)),
          header = $("<div class='slick-header-column' role='columnheader' scope='col' tabindex='-1'></div>")
          .html("<span class='slick-column-name'>" + name + "</span>")
          .width(m.width - headerColumnWidthDiff)
          .data("column", m)
          .data("columnId", m.id)
          .attr("id", "" + uid + m.id)
          .addClass(m.headerCssClass || "")
          .appendTo(appendTo);

        if (m.toolTip) {
          header.attr("title", m.toolTip).tooltip();
        } else if (m.name.textWidth() > m.width) {
          header.attr("title", m.name).tooltip();
        } else {
          header.attr("title", "");
        }

        if (isParent) {
          header.addClass((m.children ? "header-parent-arrow" : "header-parent"));
          header.on('mouseenter', onMouseEnter).on('mouseleave', onMouseLeave);
        }

        if (m.reorderable) {
          header.addClass("reorderable");
        }

        if (m.sortable) {
        header.append("<span class='slick-sort-indicator' />");
        }

        if (m.spacer) {
          header.addClass("slick-column-spacer");
        }

        if (m.required) { //add required indicator and attach the validator.
          var ind = $('<div class="inforRequiredIndicator"></div>');
          header.find(".slick-column-name").before(ind);
          if (m.validator === undefined) {
            m.validator = RequiredFieldValidator;
          }
        }
        return header;
      }

      $headerL.empty();
      $headerR.empty();

      getHeadersWidth();
      $headerL.width(headersWidthL);
      $headerR.width(headersWidthR);

      $headerRowL.empty();
      $headerRowR.empty();
      $headerParentL.empty();
      $headerParentR.empty();

      $summaryRowL.empty();
      $summaryRowR.empty();

      if (hasNestedColumns) {
        for (var i = 0; i < nestedColumns.length; i++) {
        var $rowL, $rowR,
          isParent = false,
          layer = nestedColumns[i];

        if (i + 1 < nestedColumns.length) {
          $rowL = $("<div class='slick-header-columns slick-header-parents' style='left:-1000px' />").appendTo($headerParentL);
          if (options.frozenColumn > -1) {
            $rowR = $("<div class='slick-header-columns slick-header-parents' style='left:-1000px' />").appendTo($headerParentR);
          }
          isParent = true;
        }
        for (var j = 0; j < layer.length; j++) {
          var column = layer[j];
          if (isParent) {
            createColumnHeader(column, (options.frozenColumn > -1) ? ((j <= options.frozenColumn) ? $rowL : $rowR) : $rowL, true);
          }
          else {
            createBaseColumnHeader(column, j);
          }
        }
        }
      }
      else {
        for (var i = 0; i < columns.length; i++) {
          var m = columns[i];
          createBaseColumnHeader(m, i);
        }
      }

      function createBaseColumnHeader(m, idx) {
        var $headerTarget = (options.frozenColumn > -1) ? ((idx <= options.frozenColumn) ? $headerL : $headerR) : $headerL;
        var $headerRowTarget = (options.frozenColumn > -1) ? ((idx <= options.frozenColumn) ? $headerRowL : $headerRowR) : $headerRowL;
        var $summaryRowTarget = (options.frozenColumn > -1) ? ((idx <= options.frozenColumn) ? $summaryRowL : $summaryRowR) : $summaryRowL;
        var header = createColumnHeader(m, $headerTarget );

        if (options.enableColumnReorder || m.sortable) {
          header.on('mouseenter', onMouseEnter).on('mouseleave', onMouseLeave);
        }

        trigger(self.onHeaderCellRendered, {
        "node": header[0],
        "column": m
        });

        if (options.showHeaderRow) {
          var id = uid + "_headercell" + idx;
          var headerRowCell = $("<div class='slick-headerrow-column l" + idx + " r" + idx + "' id='" + id + "'></div>").appendTo($headerRowTarget);
          headerRowCell.on("click", function (e)
          {
            makeHeaderActive($(e.target), idx);
          });
          trigger(self.onHeaderRowCellRendered, {
            "node": headerRowCell[0],
            "column": m
          });
        }

        if (options.showSummaryRow) {
          $("<div class='slick-summaryrow-column l" + idx + " r" + idx + "'></div>").appendTo($summaryRowTarget);
        }
      }

      setSortColumns(sortColumns);
      setupColumnResize();

      if (options.enableColumnReorder) {
        setupColumnReorder();
      }
    }

    function setupColumnSort() {
      $headerScroller.click(function (e) {
        if (isDragging) {
          return false;
        }

        if ($(e.target).hasClass("slick-resizable-handle")) {
          return;
        }

        var $col = $(e.target).closest(".slick-header-column");
        if (!$col.length) {
          return;
        }

        var column = columns[getColumnIndex($col.data("columnId"))];
        if (column && column.sortable) {
          if (!self.isLookupGrid && $(this).closest("#lookupGridDivId").length === 0 && !getEditorLock().commitCurrentEdit()) {
            return;
          }

          var sortOpts = null;
          var i = 0;
          for (; i < sortColumns.length; i++) {
            if (sortColumns[i].columnId === column.id) {
            sortOpts = sortColumns[i];
            sortOpts.sortAsc = !sortOpts.sortAsc;
            break;
            }
          }

          if (e.ctrlKey) {
            if (sortOpts) {
            sortColumns.splice(i, 1);
            }
          }
          else {
            if ((!e.shiftKey && !e.metaKey)) {
            sortColumns = [];
            }

            if (!sortOpts) {
            sortOpts = { columnId: column.id, sortAsc: true };
            sortColumns.push(sortOpts);
            } else if (sortColumns.length === 0) {
            sortColumns.push(sortOpts);
            }
          }

          setSortColumns(sortColumns);
        }
      });
    }

    function setupColumnReorder() {
      var columnScrollTimer = null;

      function scrollColumnsRight() {
        $viewportScrollContainerY[0].scrollLeft = $viewportScrollContainerY[0].scrollLeft + 10;
      }

      function scrollColumnsLeft() {
        $viewportScrollContainerY[0].scrollLeft = $viewportScrollContainerY[0].scrollLeft - 10;
      }

      function reassignValidationMessagesToReorderedColumns (columnsBeforeReordered) {
        var data = getFilteredData();
        for (i = 0; i < data.length; i++) {
          var item = data[i];
          if (!item.validationMessages || !item.validationMessages.keys || !item.validationMessages.data) continue;
          var columnMsgData = {};
          for (var oldColumnIndex in item.validationMessages.data){
            var messages = item.validationMessages.data[oldColumnIndex];
            if (messages && columnsBeforeReordered[oldColumnIndex]) {
              delete item.validationMessages.data[oldColumnIndex];
              var newColumnIndex = getColumnIndex(columnsBeforeReordered[oldColumnIndex].id);
              columnMsgData[newColumnIndex] = messages;
            }
          }
          item.validationMessages.keys.length = 0;
          for (var columnIndex in columnMsgData) {
            item.validationMessages.data[columnIndex] = columnMsgData[columnIndex];
            item.validationMessages.data[columnIndex].cell = Number(columnIndex);
            item.validationMessages.keys.push(Number(columnIndex));
          }
          getData().updateItem(item[getOptions().idProperty], item);
        }
      }

      $headers.sortable({
        placeholder: "slick-sortable-placeholder slick-header-column",
        cursor: "default",
        forcePlaceholderSize: true,
        helper: "clone",
        delay: 300,
        distance: 3,
        items: ".reorderable",
        start: function (e, ui) {
          var $helper = $(ui.helper);
          $helper.addClass("ui-state-hover")
            .css({border: "2px solid #21A7F5", position: "fixed", left: e.clientX - 1 +"px", top: e.clientY-20});


          $(document).bind("mousemove",function(e){
            if (Globalize.culture().isRTL) {
              $helper.css({position: "fixed", left: e.clientX - 1 +"px", right: $(window).width() - e.clientX - $helper.width() +"px"});
            } else {
              $helper.css({position: "fixed", left: e.clientX - 1 +"px", top: e.clientY-20});
            }
          });

          $headers.children("div:not(.reorderable):not(.slick-sortable-placeholder)").each(function () {
            $(this).data("fixedIndex", getColumnIndex($(this).attr("id").replace(uid, "")));
          });
        },
        beforeStop: function (e, ui) {
          $(ui.helper).removeClass("slick-header-column-active");
          $(document).unbind("mousemove");
        },
        sort: function(e, ui) { //allows you to drag out of scroll area.
          if (e.originalEvent.pageX > $container[0].clientWidth) {
            if (!(columnScrollTimer)) {
              columnScrollTimer = setInterval(
              scrollColumnsRight, 100);
            }
          } else if (e.originalEvent.pageX < $viewportScrollContainerY.offset().left) {
            if (!(columnScrollTimer)) {
              columnScrollTimer = setInterval(
              scrollColumnsLeft, 100);
            }
          } else {
            clearInterval(columnScrollTimer);
            columnScrollTimer = null;
          }
        },
        stop: function (e) {
          clearInterval(columnScrollTimer);
          columnScrollTimer = null;

          if (!getEditorLock().commitCurrentEdit()) {
            $(this).sortable("cancel");
            return;
          }

          //var reorderedIds = $headers.sortable("toArray");
          var reorderedIds = $headerL.sortable("toArray");
          reorderedIds = reorderedIds.concat($headerR.sortable("toArray"));

          var reorderedColumns = [];
          for (var i = 0; i < reorderedIds.length; i++) {
            reorderedColumns.push(columns[getColumnIndex(reorderedIds[i].replace(uid, ""))]);
          }
          //add non-reorderable columns back
          $headers.children("div:not(.reorderable):not(.slick-sortable-placeholder)").each(function () {
            var fixedIndex = $(this).data("fixedIndex");
            reorderedColumns.splice(fixedIndex,0,columns[fixedIndex]);
          });
          var columnsBeforeReordered = columns;
          setColumns(reorderedColumns, true);
          reassignValidationMessagesToReorderedColumns(columnsBeforeReordered);

          trigger(self.onColumnsReordered, {});
          updateFilterRow();

          e.stopPropagation();
          setupColumnResize();
        }
      });
    }

    function setupColumnResize() {
      var j, c, pageX, columnElements, newCanvasWidthL, newCanvasWidthR, minPageX, maxPageX, firstResizable, lastResizable;
      columnElements = $headers.children();
      columnElements.find(".slick-resizable-handle").remove();

      columnElements.each(function(i, e) {
        if (columns[i].resizable) {
          if (firstResizable === undefined) {
            firstResizable = i;
          }
          lastResizable = i;
        }
      });

      if (firstResizable === undefined) {
        return;
      }

      columnElements.each(function(i, e) {
        if (i < firstResizable || (options.forceFitColumns && i >= lastResizable)) {
          return;
        }
        var $col = $(e);

        $("<div class='slick-resizable-handle' />")
          .appendTo(e)
          .bind("dragstart", function(e, dd) {
            if (!getEditorLock().commitCurrentEdit()) {
              return false;
            }
            isDragging = true;
            pageX = e.pageX;

            $(this).parent().addClass("slick-header-column-active").css("cursor", "col-resize");
            $(this).parent().next().addClass("slick-header-column-active").css("cursor", "col-resize");

            var shrinkLeewayOnRight = null,
              stretchLeewayOnRight = null;
            // lock each column's width option to current width
            columnElements.each(function(i, e) {
              columns[i].previousWidth = $(e).outerWidth();
            });
            if (options.forceFitColumns) {
              shrinkLeewayOnRight = 0;
              stretchLeewayOnRight = 0;
              // colums on right affect maxPageX/minPageX
              for (j = i + 1; j < columnElements.length; j++) {
                c = columns[j];
                if (c.resizable) {
                  if (stretchLeewayOnRight !== null) {
                    if (c.maxWidth) {
                      stretchLeewayOnRight += c.maxWidth - c.previousWidth;
                    } else {
                      stretchLeewayOnRight = null;
                    }
                  }
                  shrinkLeewayOnRight += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                }
              }
            }
            var shrinkLeewayOnLeft = 0,
              stretchLeewayOnLeft = 0;
            for (j = 0; j <= i; j++) {
              // columns on left only affect minPageX
              c = columns[j];
              if (c.resizable) {
                if (stretchLeewayOnLeft !== null) {
                  if (c.maxWidth) {
                    stretchLeewayOnLeft += c.maxWidth - c.previousWidth;
                  } else {
                    stretchLeewayOnLeft = null;
                  }
                }
                shrinkLeewayOnLeft += c.previousWidth - Math.max(c.minWidth || 0, absoluteColumnMinWidth);
              }
            }
            if (shrinkLeewayOnRight === null) {
              shrinkLeewayOnRight = 100000;
            }
            if (shrinkLeewayOnLeft === null) {
              shrinkLeewayOnLeft = 100000;
            }
            if (stretchLeewayOnRight === null) {
              stretchLeewayOnRight = 100000;
            }
            if (stretchLeewayOnLeft === null) {
              stretchLeewayOnLeft = 100000;
            }
            maxPageX = pageX + Math.min(shrinkLeewayOnRight, stretchLeewayOnLeft);
            minPageX = pageX - Math.min(shrinkLeewayOnLeft, stretchLeewayOnRight);
          })
          .bind("drag", function(e, dd) {
            var actualMinWidth, d = Math.min(maxPageX, Math.max(minPageX, e.pageX)) - pageX,
              x;

            if (d < 0) { // shrink column
              x = d;

              newCanvasWidthL = 0;
              newCanvasWidthR = 0;

              for (j = i; j >= 0; j--) {
                c = columns[j];
                if (c.resizable) {
                  actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                  if (x && c.previousWidth + x < actualMinWidth) {
                    x += c.previousWidth - actualMinWidth;
                    c.width = actualMinWidth;
                  } else {
                    c.width = c.previousWidth + x;
                    x = 0;
                  }
                }
              }

              for ( k = 0; k <= i; k++ ) {
                c = columns[k];

                if ((options.frozenColumn > -1) && (k > options.frozenColumn)) {
                  newCanvasWidthR += c.width;
                } else {
                  newCanvasWidthL += c.width;
                }
              }

              if (options.forceFitColumns) {
                x = -d;

                for (j = i + 1; j < columnElements.length; j++) {
                  c = columns[j];
                  if (c.resizable) {
                    if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
                      x -= c.maxWidth - c.previousWidth;
                      c.width = c.maxWidth;
                    } else {
                      c.width = c.previousWidth + x;
                      x = 0;
                    }

                    if ((options.frozenColumn > -1) && (j > options.frozenColumn)) {
                      newCanvasWidthR += c.width;
                    } else {
                      newCanvasWidthL += c.width;
                    }
                  }
                }
              } else {
                for (j = i + 1; j < columnElements.length; j++) {
                  c = columns[j];

                  if ((options.frozenColumn > -1) && (j > options.frozenColumn)) {
                    newCanvasWidthR += c.width;
                  } else {
                    newCanvasWidthL += c.width;
                  }
                }
              }
            } else { // stretch column
              x = d;

              newCanvasWidthL = 0;
              newCanvasWidthR = 0;

              for (j = i; j >= 0; j--) {
                c = columns[j];
                if (c.resizable) {
                  if (x && c.maxWidth && (c.maxWidth - c.previousWidth < x)) {
                    x -= c.maxWidth - c.previousWidth;
                    c.width = c.maxWidth;
                  } else {
                    c.width = c.previousWidth + x;
                    x = 0;
                  }
                }
              }

              for ( k = 0; k <= i; k++ ) {
                c = columns[k];

                if ((options.frozenColumn > -1) && (k > options.frozenColumn)) {
                  newCanvasWidthR += c.width;
                } else {
                  newCanvasWidthL += c.width;
                }
              }

              if (options.forceFitColumns) {
                x = -d;

                for (j = i + 1; j < columnElements.length; j++) {
                  c = columns[j];
                  if (c.resizable) {
                    actualMinWidth = Math.max(c.minWidth || 0, absoluteColumnMinWidth);
                    if (x && c.previousWidth + x < actualMinWidth) {
                      x += c.previousWidth - actualMinWidth;
                      c.width = actualMinWidth;
                    } else {
                      c.width = c.previousWidth + x;
                      x = 0;
                    }

                    if ((options.frozenColumn > -1) && (j > options.frozenColumn)) {
                      newCanvasWidthR += c.width;
                    } else {
                      newCanvasWidthL += c.width;
                    }
                  }
                }
              } else {
                for (j = i + 1; j < columnElements.length; j++) {
                  c = columns[j];

                  if ((options.frozenColumn > -1) && (j > options.frozenColumn)) {
                    newCanvasWidthR += c.width;
                  } else {
                    newCanvasWidthL += c.width;
                  }
                }
              }
            }

            if ( options.frozenColumn > -1 && newCanvasWidthL !== canvasWidthL ) {
              $paneHeaderR.css( 'left', newCanvasWidthL );
            }
            applyColumnHeaderWidths();
            if (options.syncColumnCellResize) {
              applyColumnWidths();
            }
          })
          .bind("dragend", function(e, dd) {
            var newWidth,
              parent = $(this).parent();


            for (j = 0; j < columnElements.length; j++) {
              c = columns[j];
              newWidth = $(columnElements[j]).outerWidth();

              if (c.previousWidth !== newWidth && c.rerenderOnResize) {
                invalidateAllRows();
              }
            }

            updateCanvasWidth(true);
            invalidate();
            trigger(self.onColumnsResized, {});
            updateFilterRow();
            trigger(self.onPersonalizationChanged, getGridPersonalizationInfo('ColumnsResized'));

            setTimeout(function() {
              parent.removeClass("slick-header-column-active").css("cursor", "");
              parent.next().removeClass("slick-header-column-active").css("cursor", "");
              isDragging = false;
            }, 100);
          });
      });
    }

    function getVBoxDelta($el) {
      var p = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];
      var delta = 0;
      $.each(p, function (n, val) { delta += parseFloat($el.css(val)) || 0; });
      return delta;
    }

    function setFrozenOptions() {
      options.frozenColumn = ( options.frozenColumn >= 0
                  && options.frozenColumn < columns.length
                )
                ? parseInt(options.frozenColumn, 10)
                : -1;

      options.frozenRow = ( options.frozenRow >= 0
                && options.frozenRow < numVisibleRows
                )
                ? parseInt(options.frozenRow, 10)
                : -1;

      if ( options.frozenRow > -1 ) {
        hasFrozenRows = true;
        frozenRowsHeight = ( options.frozenRow ) * options.rowHeight;

        var dataLength = getDataLength() || this.data.length;

        actualFrozenRow = ( options.frozenBottom )
                ? ( dataLength - options.frozenRow )
                : options.frozenRow;
      } else {
        hasFrozenRows = false;
      }
    }

    function setPaneVisibility() {
      if (options.frozenColumn > -1) {
        $paneHeaderR.show();
        $paneTopR.show();
      } else {
        $paneHeaderR.hide();
        $paneTopR.hide();
      }
    }

    function setOverflow() {
      var setting = ((options.autoHeightToPageSize || options.autoHeight) ? 'hidden' :'auto');

      $viewportTopL.css({
        'overflow-x': (options.frozenColumn > -1) ? 'scroll' : 'auto',
        'overflow-y': (options.frozenColumn > -1) ? 'hidden' : setting
      });

      $viewportTopR.css({
        'overflow-x': (options.frozenColumn > -1) ? 'scroll' : 'auto',
        'overflow-y': (options.frozenColumn > -1) ? 'auto' : setting
      });
    }

    function setScroller() {
    if ( options.frozenColumn > -1 ) {
        $headerScrollContainer = $headerScrollerR;
        $headerRowScrollContainer = $headerRowScrollerR;
        $summaryRowScrollContainer = $summaryRowScrollerR;

        if ( hasFrozenRows ) {
          if ( options.frozenBottom ) {
            $viewportScrollContainerX = $viewportBottomR;
            $viewportScrollContainerY = $viewportTopR;
          } else {
            $viewportScrollContainerX = $viewportScrollContainerY = $viewportBottomR;
          }
        } else {
          $viewportScrollContainerX = $viewportScrollContainerY = $viewportTopR;
        }
      } else {
        $headerScrollContainer = $headerScrollerL;
        $headerRowScrollContainer = $headerRowScrollerL;
        $summaryRowScrollContainer = $summaryRowScrollerL;

        if ( hasFrozenRows ) {
          if ( options.frozenBottom ) {
            $viewportScrollContainerX = $viewportBottomL;
            $viewportScrollContainerY = $viewportTopL;
          } else {
            $viewportScrollContainerX = $viewportScrollContainerY = $viewportBottomL;
          }
        } else {
          $viewportScrollContainerX = $viewportScrollContainerY = $viewportTopL;
        }
      }
    }

    function measureCellPaddingAndBorder() {
      var el;
      var h = ["borderLeftWidth", "borderRightWidth", "paddingLeft", "paddingRight"];
      var v = ["borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"];

      el = $("<div class='slick-header-column' style='visibility:hidden'>-</div>").appendTo($headers);

      headerColumnWidthDiff = headerColumnHeightDiff = 0;
      $.each(h, function (n, val) { headerColumnWidthDiff += parseFloat(el.css(val)) || 0; });
      $.each(v, function (n, val) { headerColumnHeightDiff += parseFloat(el.css(val)) || 0; });
      el.remove();

      var r = $("<div class='slick-row' />").appendTo($canvas);
      el = $("<div class='slick-cell' id='' style='visibility:hidden'>-</div>").appendTo(r);
      cellWidthDiff = cellHeightDiff = 0;
      $.each(h, function (n, val) { cellWidthDiff += parseFloat(el.css(val)) || 0; });
      $.each(v, function (n, val) { cellHeightDiff += parseFloat(el.css(val)) || 0; });
      r.remove();

      absoluteColumnMinWidth = Math.max(headerColumnWidthDiff, cellWidthDiff);
    }

    function createCssRules() {
      $style = $("<style type='text/css' rel='stylesheet' />").appendTo($("head"));
      var rowHeight = (options.rowHeight - cellHeightDiff);

      var rules = [
        "." + uid + " .slick-header-column { " +(!Globalize.culture().isRTL ? "left: 1000px;" : "right: 1000px;")+";height:"+ options.headerHeight + "px; }",
        "." + uid + " .slick-header-columns { height:" + options.headerHeight + "px; }",
        "." + uid + " .inforFilterMenuButton { top:" + (parseInt(options.headerHeight, 10) + 4) + "px; }",
        "." + uid + " .slick-top-panel { height:" + options.topPanelHeight + "px; }",
        "." + uid + " .slick-headerrow-columns { height:" + options.headerRowHeight + "px; }",
        "." + uid + " .slick-summaryrow-columns { height:" + options.summaryRowHeight + "px; }",
        "." + uid + " .slick-cell { height:" + rowHeight + "px; }",
        "." + uid + " .slick-row { height:" + options.rowHeight + "px; }"
      ];

      for (var i = 0; i < columns.length; i++) {
        rules.push("." + uid + " .l" + i + " { }");
        rules.push("." + uid + " .r" + i + " { }");
      }

      if ($style[0].styleSheet) { // IE
        $style[0].styleSheet.cssText = rules.join(" ");
      } else {
        $style[0].appendChild(document.createTextNode(rules.join(" ")));
      }

      var sheets = document.styleSheets;
      for (var i = 0; i < sheets.length; i++) {
        if ((sheets[i].ownerNode || sheets[i].owningElement) === $style[0]) {
          stylesheet = sheets[i];
          break;
        }
      }

      // find and cache column CSS rules ....
      columnCssRulesL = [], columnCssRulesR = [];
      if (stylesheet !== undefined) {
        var cssRules = (stylesheet.cssRules || stylesheet.rules);
        var matches, columnIdx;
        for (var i = 0; i < cssRules.length; i++) {
          matches = matches = /\.l\d+/.exec(cssRules[i].selectorText);
          if (matches) {
          columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
          columnCssRulesL[columnIdx] = cssRules[i];
          } else {
            matches = /\.r\d+/.exec(cssRules[i].selectorText);
            if (matches) {
              columnIdx = parseInt(matches[0].substr(2, matches[0].length - 2), 10);
              columnCssRulesR[columnIdx] = cssRules[i];
            }
          }
        }
      }
    }

    function initializeRowPositions() {
      rowPositionCache = {
        0: {
          top: 0,
          height: options.rowHeight,
          bottom: options.rowHeight
        }
      };
    }

    function cacheRowPositions() {
      initializeRowPositions();
      calculateVariableRowHeight();

      for ( var i = 0; i < getDataLength(); i++ ) {
        var metadata = data.getRowHeights && data.getRowHeights(i);

        rowPositionCache[i] = {
          top: ( rowPositionCache[i - 1] )
            ? ( rowPositionCache[i - 1].bottom - offset )
            : 0,
            height: ( metadata && metadata.rows && metadata.rows[i] )
              ? metadata.rows[i].height
              : options.rowHeight
        };

        rowPositionCache[i].bottom = rowPositionCache[i].top + rowPositionCache[i].height;
      }
    }

    function getColumnCssRules(idx) {
      return {
        "left": columnCssRulesL[idx],
        "right": columnCssRulesR[idx],
        "width": "0px"
      };
    }
    function removeCssRules() {
      $style.remove();
    }

    function destroy(isEditor) {
      if (!isEditor) {
        getEditorLock().cancelCurrentEdit();
      }

      trigger(self.onBeforeDestroy, {});

      var i = plugins.length;
      while(i--) {
        unregisterPlugin(plugins[i]);
      }

      if (options.enableColumnReorder && $headers.sortable && $headers.data("uiSortable")) {
        $headers.sortable("destroy");
      }

      unbindAncestorScrollEvents();
      $container.unbind(".slickgrid");
      removeCssRules();

      $canvas.unbind("draginit dragstart dragend drag");
      $container.empty().removeClass(uid);
      $(window).unbind("throttledresize.inforDataGrid");

      if ($gridSettingsButton) {
        $gridSettingsButton.remove();
      }

      if ($filterMenuButton) {
        $filterMenuButton.remove();
      }

      if (columnpicker) {
        columnpicker.destroy();
      }

      $container.next(".inforGridFooter").remove();
      $container.remove();

      $("#" + settingsMenuId).remove();
      $("#" + filterMenuId).remove();
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // General
    function trigger(evt, args, e) {
      e = e || new Slick.EventData();
      args = args || {};
      args.grid = self;
      return evt.notify(args, e, self);
    }

    function getEditorLock() {
      return options.editorLock;
    }

    function getEditController() {
      return editController;
    }

    function getColumnIndex(id) {
      return columnsById[id];
    }

    function autosizeColumns() {
      //refresh size.
      viewportW = parseFloat($.css($container[0], "width", true));

      var tabPanel = $container.closest(".ui-tabs-panel");
      if (tabPanel.length > 0 && tabPanel.css("display") === "none") {
           return;
      }

      var c,
      widths = [],
      shrinkLeeway = 0,
      total = 0,
      prevTotal,
      availWidth = viewportHasVScroll ? viewportW - scrollbarDimensions.width : viewportW;

      if ($gridSettingsButton || options.showFilter) {  //subtract size for the buttons on the end.
        availWidth -= 18;
      }

      for (var i = 0; i < columns.length; i++) {
        c = columns[i];
        widths.push(c.width);
        total += c.width;
        if (c.resizable) {
        shrinkLeeway += c.width - Math.max(c.minWidth, absoluteColumnMinWidth);
        }
      }

      // shrink
      prevTotal = total;
      while (total > availWidth && shrinkLeeway) {
        var shrinkProportion = (total - availWidth) / shrinkLeeway;
        for (var i = 0; i < columns.length && total > availWidth; i++) {
        c = columns[i];
        var width = widths[i];
        if (!c.resizable || width <= c.minWidth || width <= absoluteColumnMinWidth) {
          continue;
        }
        var absMinWidth = Math.max(c.minWidth, absoluteColumnMinWidth);
        var shrinkSize = Math.floor(shrinkProportion * (width - absMinWidth)) || 1;
        shrinkSize = Math.min(shrinkSize, width - absMinWidth);
        total -= shrinkSize;
        shrinkLeeway -= shrinkSize;
        widths[i] -= shrinkSize;
        }
        if (prevTotal == total) {  // avoid infinite loop
          break;
        }
        prevTotal = total;
      }

      // grow
      prevTotal = total;
      while (total < availWidth) {
        var growProportion = availWidth / total;
        for (var i = 0; i < columns.length && total < availWidth; i++) {
          c = columns[i];
          if (!c.resizable || c.maxWidth <= c.width) {
            continue;
          }
          var growSize = Math.min(Math.floor(growProportion * c.width) - c.width, (c.maxWidth - c.width) || 1000000) || 1;
          growSize = growSize < 0 ? 0 : growSize;
          total += growSize;
          widths[i] += growSize;
        }
        if (prevTotal == total) {  // avoid infinite loop
        break;
        }
        prevTotal = total;
      }

      for (var i = 0; i < columns.length; i++) {
        columns[i].width = widths[i];
      }

      applyColumnHeaderWidths();
      updateCanvasWidth(true);
      updateFilterRow();
      invalidateAllRows();
      render();
    }

    function applyColumnHeaderWidths() {
      if (!initialized) {
        return;
      }
      var h;
      applyNestedColumnHeaderWidths();

      for (var i = 0, headers = $headers.children(), ii = headers.length; i < ii; i++) {
        h = $(headers[i]);
        h.css("width", columns[i].width - headerColumnWidthDiff + "px");
      }

      updateColumnCaches();
    }

    function applyNestedColumnHeaderWidths() {
      if (!hasNestedColumns) { return; }
      var nh, nestedHeaderRows;

      function computeWidths(columns, depth) {
        var totalWidth = 0;
        for (var i = 0; i < columns.length; i++) {
          var column = columns[i];
          if (!columns.hasOwnProperty(i)) {
            continue;
          }

          if (column.children && column.children.length) {
            column.width = computeWidths(column.children, depth);
          }
          if (column.spacers) {
            var spacer;
            for (var j = 0; j < column.spacers.length; j++) {
              spacer = column.spacers[j];
              spacer.width = column.width;
            }
          }
          totalWidth += column.width;
        }
        return totalWidth;
      }

      computeWidths(nestedColumns[0], 0);
      if ( options.frozenColumn > -1 && $headerParents.children().length > 1) {
        // combine into single array
        var nestedHeaders = new Array();
        for (var ii=0, nestedHeaderRows = $headerParents.children();ii<nestedHeaderRows.length;ii++) {
          for (var kk=0, headerChildren = $(nestedHeaderRows[ii]).children();kk<headerChildren.length;kk++) {
            nestedHeaders.push(headerChildren[kk]);
          }
        }
        for (var ii=0; ii < nestedHeaders.length;ii++) {
          nh = $(nestedHeaders[ii]);
          if (nestedColumns[0][ii]) { // column hid
            nh.css("width", nestedColumns[0][ii].width - headerColumnWidthDiff  + "px");
          }
        }
      } else {
        for (var j = 0, nestedHeaderRows = $headerParents.children(), jj = nestedHeaderRows.length; j < jj; j++) {
          for (var k = 0, nestedHeaders = $(nestedHeaderRows[j]).children(), kk = nestedHeaders.length; k < kk; k++) {
            var idx = k;
            nh = $(nestedHeaders[k]);
            if (nestedColumns[j][idx]) {  // column hid
              nh.css("width", nestedColumns[j][idx].width - headerColumnWidthDiff  + "px");
            }
          }
        }
      }
    }

    var timeout = null;
    function applyColumnWidths() {
      var x = 0,
        w, rule;
      for (var i = 0; i < columns.length; i++) {
        w = columns[i].width;

        rule = getColumnCssRules(i);

        if (rule && rule.left && rule.right) {
          if (!Globalize.culture().isRTL) {
            rule.left.style.left = x + "px";
            rule.right.style.right = (((options.frozenColumn != -1 && i > options.frozenColumn) ? canvasWidthR : canvasWidthL) - x - w) + "px";
          } else {
            rule.right.style.right = x + "px";
            rule.left.style.left = (((options.frozenColumn != -1 && i > options.frozenColumn) ? canvasWidthR : canvasWidthL) - x - w) + "px";
          }
        }

        // If this column is frozen, reset the css left value since the
        // column starts in a new viewport.
        if (options.frozenColumn == i) {
          x = 0;
        } else {
          x += columns[i].width;
        }

        if (options.variableRowHeight && columns[i].cssClass == "autoHeight" ) {
          clearTimeout(timeout);
          timeout = setTimeout(function () {
            invalidateAllRows();
            render();
            resizeCanvas();
          }, 0);
        }
      }
    }

    function parseColumns(columnsInput) {
      var maxDepth = 0,
        j = 0;
        columns = [];

      nestedColumns = null;

      function parse(columnsInput, depth) {
        var totalWidth = 0;
        if (depth > maxDepth) maxDepth = depth;
        for (var i = 0; i < columnsInput.length; i++) {
          var column = columnsInput[i];
          if (column === undefined) {
            return totalWidth;
          }
          if (column.children && column.children.length) {
            hasNestedColumns = true;
            column.width = parse(column.children, depth + 1);
          }
          else {
            column = columnsInput[i] = $.extend({}, columnDefaults, column);
            columnsById[column.id] = j;
            j++;
            if (column.minWidth && column.width < column.minWidth) {
              column.width = column.minWidth;
            }
            if (column.maxWidth && column.width > column.maxWidth) {
              column.width = column.maxWidth;
            }
            columns.push(column);
          }
          totalWidth += column.width;
        }
        return totalWidth;
      }

      function addToNested(column, depth) {
        if (!nestedColumns) { nestedColumns = [] }
        if (!nestedColumns[depth]) { nestedColumns[depth] = []; }
        nestedColumns[depth].push(column);
      }

      var spacerIndex = 0;

      function splitIntoLayers(columnsInput, depth) {
        for (var index in columnsInput) {
        var column = columnsInput[index];
        addToNested(column, depth);
        if (column.children && column.children.length) {
          splitIntoLayers(column.children, depth + 1)
        }
        else {
          var spacer;
          var spacers = [];
          for (var d = depth + 1; d <= maxDepth; d++) {
            spacer = {spacer: true, width: column.width || columnDefaults.width, name: "", id: "spacer" + spacerIndex};
            addToNested(spacer, d);
            spacers.push(spacer);
            spacerIndex++;
          }
          column.spacers = spacers;
        }
        }
      }

      hasNestedColumns = false;
      parse(columnsInput, 0);

      if (maxDepth > 0) {
        splitIntoLayers(columnsInput, 0);
      }
    }

    function setSortColumn(columnId, ascending, setSortColumnsOnly) {
      var cols = [];
      cols.push({ columnId: columnId, sortAsc: ascending});
      setSortColumns(cols, setSortColumnsOnly);
    }

    function getSortColumns() {
      return sortColumns;
    }

    var lastSort = "";

    function setSortColumns(cols, setSortColumnsOnly) {
      sortColumns = cols;
      if (sortColumns.length == 0) {
        return;
      }

      var headerColumnEls = $headers.children();
      var removeFrom = hasNestedColumns ? headerColumnEls.add($headerParents.children().children()) : headerColumnEls;

      removeFrom
      .removeClass("slick-header-column-sorted")
      .removeAttr("aria-sort")
      .find(".slick-sort-indicator")
        .removeClass("slick-sort-indicator-asc slick-sort-indicator-desc");


      $.each(sortColumns, function(i, col) {
          if (col.sortAsc == null) {
            col.sortAsc = true;
          }
          var columnIndex = getColumnIndex(col.columnId);

          if (columnIndex != null) {
            var headerMaybe = headerColumnEls.eq(columnIndex);

            if (hasNestedColumns && headerMaybe.hasClass("slick-column-spacer")) {
              var parentHeaderRows = $headerParents.children().get().reverse();
              for (var i = 0; i < parentHeaderRows.length; i++) {
              var headerColumns = $(parentHeaderRows[i]).children();
              $(headerColumns).each(function(){

                if ($(this).data("column").id == col.columnId && ! $(this).hasClass("slick-column-spacer")) {
                headerMaybe = $(this);
                return;
                }
              });
              }
            }

            headerMaybe
              .addClass("slick-header-column-sorted")
              .attr("aria-sort", col.sortAsc ? "ascending" : "descending")
              .find(".slick-sort-indicator")
                .addClass(col.sortAsc ? "slick-sort-indicator-asc" : "slick-sort-indicator-desc");
          }
      });


      if (lastSort == cols[0].sortAsc.toString()+cols[0].columnId.toString()) {
        return;
      }
      lastSort = cols[0].sortAsc.toString()+cols[0].columnId.toString();

      trigger(self.onSort, {
      sortColumns: $.map(sortColumns, function(col) {
        return {sortCol: columns[getColumnIndex(col.columnId)], sortAsc: col.sortAsc };
      })}, null);

      //set the state of the grid and fire the events
      personalizationInfo.sortColumns = sortColumns;
      dataView.setPagingOptions({sortColumns: sortColumns, pageNum: 0});
      if (!setSortColumnsOnly) {
        dataView.requestNewPage("sort");
      }
      trigger(self.onPersonalizationChanged, getGridPersonalizationInfo('SortColumn'));
    }

    function handleSelectedRangesChanged(e, ranges) {
      selectedRows = [];
      var hash = {};
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          if (!hash[j] && canRowBeSelected(j)) { // prevent duplicates
            selectedRows.push(j);
            hash[j] = {};
          }
          for (var k = ranges[i].fromCell; k <= ranges[i].toCell; k++) {
            if (canCellBeSelected(j, k)) {
              hash[j][columns[k].id] = options.selectedCellCssClass;
            }
          }
        }
      }

      setCellCssStyles(options.selectedCellCssClass, hash);

      trigger(self.onSelectedRowsChanged, { rows: getSelectedRows(), active: ranges.active  }, e);
    }

    function updateFooterSelectionCounter() {
      //set the footer status
      if ((selectedRecordArea == null || selectedRecordArea.length === 0) && options.showFooter) {
        selectedRecordArea = $container.next(".inforGridFooter").find(".slick-records-status");
      }

      if (options.showFooter && selectedRecordArea.length != 0) {
        var selectedPhrase,
            visible = selectedRows.length;

        if (options.persistSelections) {
          var total = selectionModel.getPersistedIds().length;

          selectedPhrase = Globalize.localize("Selected") + (total < 10 ? " " + total : total)
              + (total === visible ? '' : ' (' + Globalize.localize('Displaying') + visible + ')');
        }
        else {
          selectedPhrase = Globalize.localize("Selected") + (visible < 10 ? " " + visible : visible);
        }
        selectedRecordArea.html(selectedPhrase);
      }
    }

    function getColumnIndexById(id) {
      for (var i = 0; i < columnsInput.length; i++){
        if (columnsInput[i].id === id) {
          return i;
        }
      }
      return -1;
    }

    function addBuiltinColumns() {
      var o = options;
      checkboxSelector = new Slick.CheckboxSelectColumn({ cssClass: "slick-cell-checkboxsel" });

      //TODO: In case we don't want to mod the original array..
      columnsInput = columnsInput.slice(0);
      if (o.showDrillDown && getColumnIndexById("drilldown") === -1) {
        columnsInput.splice(0, 0, {id: "drilldown", builtin: true, selectable: false, reorderable:false, sortable:false, resizable: false, width: 22, formatter: DrillDownCellFormatter, cssClass: "non-data-cell" });
      }

      if (o.showCheckboxes && getColumnIndexById("checkbox-selector")  === -1) {
        var def = checkboxSelector.getColumnDefinition(o.multiSelect);
        if (o.enableGrouping) {
          def.width = 37;
        }

        if (columnsInput.length > 0 && columnsInput[0].behavior == "selectAndMove") {
          columnsInput.splice(1, 0, def);
        } else {
          columnsInput.splice(0, 0, def);
        }
        self.registerPlugin(checkboxSelector);
      }

      if (o.showStatusIndicators && getColumnIndexById("indicator-icon")  === -1) {
        columnsInput.splice(0, 0, { id: "indicator-icon", sortable:false, builtin: true, reorderable:false, selectable: false, resizable: false, width: 16, formatter: IndicatorIconFormatter, cssClass: "status-indicator non-data-cell" });
      }
    }

    function getColumns(includeHidden) {
      if (includeHidden) {
        return allColumns;
      } else {
        return columns;
      }
    }

    function getVisibleItems(includeHeader) {
        var visibleItems = [];
        var headerRow = {};
        $(getColumns()).each(function (i, col) {
            if (!(col.cssClass && (col.cssClass.indexOf('non-data-cell') >= 0 || col.cssClass.indexOf('isCheckboxCell') >= 0))) {
              headerRow[col.id] = col.name;
            }
        });

        if (includeHeader) {
          visibleItems.push(headerRow);
        }

        $(getData().getItems()).each(function (rowIndex, row) {
            var visibleRow = {};
            $(getColumns()).each(function (colIndex, hCol) {
                if (!(hCol.cssClass && (hCol.cssClass.indexOf('non-data-cell') >= 0 || hCol.cssClass.indexOf('isCheckboxCell') >= 0))) {
                  visibleRow[hCol.id] = row[hCol.id] == null ? "" : row[hCol.id];
                }
            });
            visibleItems.push(visibleRow);
        });
        return visibleItems;
    }

    function updateColumnCaches() {
      // Pre-calculate cell boundaries.
      columnPosLeft = [];
      columnPosRight = [];
      var x = 0;
      for (var i = 0, ii = columns.length; i < ii; i++) {
        columnPosLeft[i] = x;
        columnPosRight[i] = x + columns[i].width;

        if (options.frozenColumn == i) {
          x = 0;
        } else {
          x += columns[i].width;
        }
      }
    }

    function setColumns(columnDefinitions, noReset) {
      columns = columnDefinitions;
      columnsById = {};

      if (!noReset) {
        allColumns = [];
        saveColumns();
        defaultColumns = $.extend(true, [], columns);
      }

      columnsInput = columns;
      addBuiltinColumns();
      parseColumns(columnsInput);
      updateColumnCaches();

      if (initialized) {
        setPaneVisibility();
        setOverflow();
        invalidateAllRows();
        createColumnHeaders();
        removeCssRules();
        createCssRules();
        resizeCanvas();
        updateCanvasWidth();
        applyColumnWidths();
        handleScroll();
        updateSummaryRow();
      }
      trigger(self.onPersonalizationChanged, getGridPersonalizationInfo('SetColumns'));
      processHiddenColumns(columns);
    }

    function saveColumns() {
      if (allColumns.length!=0)
        return;

      for (var i=0; i<columns.length; i++) {
        allColumns.push(columns[i]);
      }
    }

    function hideColumn(columnid, defer) {
      saveColumns();  //save the columns once...
      var visibleColumns = [];
      for (var i=0; i < columnsInput.length; i++) {
        if (columnsInput[i].id !== columnid) {
          visibleColumns.push(columnsInput[i]);
        }
        if (columnsInput[i].children) {
          for (var j=0; j < columnsInput[i].children.length; j++) {
            if (columnsInput[i].children[j].id === columnid) {
              columnsInput[i].children.splice(j, 1);
              for (var k=0; k < allColumns.length; k++) {
                if (allColumns[k].id === columnid) {
                  allColumns[k].childIdx = j;
                }
              }
            }
          }
        }
        if (columnsInput[i].children && columnsInput[i].children.length == 0) {
          for (var k=0; k < visibleColumns.length; k++) {
            if (visibleColumns[k].id === columnsInput[i].id) {
              visibleColumns.splice(k, 1);
            }
          }
        }
      }
      columnsInput = visibleColumns;
      if (!defer) {
        setColumns(visibleColumns, true);
        updateFilterRow();
      }
    }

    function colInArry(array, columnid) {
      for (var i=0; i < array.length; i++) {
        if (array[i].id==columnid)
          return true;
      }
      return false;
    }

    function showColumn(newColumns) {
      var sinceChildren = null,
        columns = columnsInput,
        currentColumns = getColumns(),
        numHiddenCols = 0;

      if (allColumns.length==0) {
        return;
      }

      if (typeof newColumns == "string")
        newColumns = [newColumns];

      for (var j=0; j < newColumns.length; j++) {
        var colId = newColumns[j];
        for (var i=0; i < currentColumns.length; i++) {
          if (currentColumns[i].id==colId) {  //already in the list of columns....
            return;
          }
        }
      }

      if (newColumns.length==0) {
        return;
      }

      for (var i=0; i < allColumns.length; i++) {
        if (allColumns[i].hidden && $.inArray(allColumns[i].id,newColumns)==-1) {
          numHiddenCols++;
        }

        var spliceIdx = i;
        if (columns[spliceIdx-numHiddenCols] && columns[spliceIdx-numHiddenCols].children) {
          sinceChildren = 0;
        }

        if (sinceChildren !== null) {
          sinceChildren++;
        }

        if (($.inArray(allColumns[i].id, newColumns)>-1)) {
          allColumns[i].hidden = false;
          if (sinceChildren && columns[spliceIdx-numHiddenCols-sinceChildren+1].children) {
            columns[spliceIdx-numHiddenCols-sinceChildren+1].children.splice(allColumns[i].childIdx, 0 , allColumns[i]);
          } else {
            columns.splice(spliceIdx-numHiddenCols,0,allColumns[i]);
          }
        }
      }
      setColumns(columns, true);
      updateFilterRow();
    }


    function hideColumns(cols) {
      for (var i=0; i < cols.length; i++) {
        hideColumn(cols[i], (i<cols.length-1));
      }
    }

    function showColumns(cols) {
      showColumn(cols);
    }

    function getOptions() {
      return options;
    }

    //Gets the current personalization info...
    function getGridPersonalizationInfo(callerInfo) {
      saveColumns();  //save the columns once...

      //get the current savable grid settings in an object to be serialized/saved
      personalizationInfo.caller=callerInfo;
      personalizationInfo.columnInfo = [];
      personalizationInfo.filterInResults = filterInResults;

      if (options.pageSize)
        personalizationInfo.pageSize = options.pageSize;

      for(var i=0; i< allColumns.length; i++) {
        var col = allColumns[i];
        var index = getColumnIndex(col.id);
        var colWidth = col.width;

        //col index of <0 means not shown
        var colIndex = -1;
        if (index!=undefined) {
          colWidth = getColumns()[index].width;
          colIndex = index;
        }
        var columnInfo = {id:col.id , width: colWidth, columnIndex: colIndex };
        personalizationInfo.columnInfo.push(columnInfo);
      }
      return personalizationInfo;
    }

    function arraymove(arr, fromIndex, toIndex) {
      element = arr[fromIndex];
      arr.splice(fromIndex,1);
      arr.splice(toIndex,0,element);
    }

    //Restored the personalization (columns) to the ones initialized with (overriding cookies)
    function resetColumnLayout() {
      columns = defaultColumns;
      defaultColumns = $.extend(true, [], columns);
      setColumns(columns, true);
      processHiddenColumns(defaultColumns);
      applyColumnWidths();
      updateFilterRow();
    }

    function processHiddenColumns(cols) {
      var hiddenCols = [];
      for (var i = 0; i < cols.length; i++) {
        var col = cols[i];
        if (col.hidden == true) {
          hiddenCols.push(col.id);
        }
      }
      if (hiddenCols.length > 0) {
        hideColumns(hiddenCols);
      }
    }

    //Sets the current personalization info back from an stored object
    function restorePersonalization(gridInfo) {
      //restore filterInResults
      filterInResults = gridInfo.filterInResults;
      //set the page size.
      if (options.showPageSizeSelector && gridInfo.pageSize && self.pager) {
        self.pager.setPageSize(gridInfo.pageSize);
      }

      //set the column sizes...
      if (gridInfo.columnInfo) {
        var currentColumns = getColumns();
        for(var i=0; i< gridInfo.columnInfo.length; i++) {
          var colinfo = gridInfo.columnInfo[i];
          var targetCol = null,
            oldIndex = -1;

          //find the matching column in the columns collection...
          for(var j=0; j< currentColumns.length; j++) {
            if (currentColumns[j].id==colinfo.id) {
              targetCol = currentColumns[j];
              oldIndex = j;
              break;
            }
          }

          if (targetCol==null) {
            continue;
          }
          targetCol.width = colinfo.width;
          arraymove(currentColumns,oldIndex,colinfo.columnIndex);
        }

        //set columns...
        setColumns(currentColumns, true);

        //hide hidden columns
        var hiddenCols = [],showCols = [];
        for(var i=0; i< gridInfo.columnInfo.length; i++) {
          var colinfo = gridInfo.columnInfo[i];
          if (colinfo.columnIndex==-1)
            hiddenCols.push(colinfo.id);
        }

        if (hiddenCols.length>0){
        //hide hidden columns
          hideColumns(hiddenCols);
        }

        //show columns hidden by default but shown by user
        for(var i=0; i< allColumns.length; i++) {
          var colinfo = allColumns[i];
          if (colinfo.hidden==true) {
            for(var j=0; j< gridInfo.columnInfo.length; j++) {
              var col = gridInfo.columnInfo[j];
              if (col.id==colinfo.id && col.columnIndex>=0) {
                showCols.push(col.id);
                break;
              }
            }
          }
        }
        if (showCols.length>0){
          showColumns(showCols);
        }
      }

      //set the sort order...
      if (gridInfo.sortColumns) {
        setSortColumns(gridInfo.sortColumns);
      }

      //set the filter...
      if (gridInfo.showFilter === false) {
        options.showFilter = !gridInfo.showFilter;
        toggleFilterRow();
      } else {
        updateFilterRow();
      }
    }

    function setOptions(args) {
      if (!getEditorLock().commitCurrentEdit()) {
        return;
      }

      makeActiveCellNormal();

      if (options.enableAddRow !== args.enableAddRow) {
        invalidateRow(getDataLength());
      }

      options = $.extend(options, args);

      if (args.idProperty)
        dataView.setIdProperty(args.idProperty);

      setScroller();
      render();
    }

    /*
      Do a minimal refresh of the data contents..
    */
    function updateData(data) {
      var gridDataObj = getData(),
        sortCols = getSortColumns();

      gridDataObj.setItems([]); //Clear row cache
      gridDataObj.setItems(data); //Set the objects back in the dataview..
      setSortColumns(sortCols);

      updateRowCount();  //Notify the grid to update whats changed
      render(); //Call render to refresh including the hover events.

      // if we have focus on the grid then always select the first cell in the grid because
      // the previous cells will get removed.  if we don't have focus then we need to
      // be able to gain focus on the grid
      var hasFocus = !!($container.find(':focus').length > 0);
      if (hasFocus)
      {
        handleGridFocusIn();
      }
      else
      {
        $container.attr("tabindex", "0");
      }


    }

    var loadedPages = [];

    //Now can use an object: {dataset: newData, pageNum: -1, totalRows: -1, isLastPage: true, isFirstPage: false
    function mergeData(dataObj, pageNum, totalRows, isLastPage, isFirstPage) {
      if (dataObj.dataset!=undefined) { //we provided an object (one param). set the others.
        var isLastPage = dataObj.isLastPage,
          isFirstPage = dataObj.isFirstPage,
          totalRows = dataObj.totalRows,
          pageNum = dataObj.pageNum,
          newData = dataObj.dataset;
      } else{
        var newData = dataObj;
      }

      if (isLastPage && pageNum==-1)
        pageNum = 99999;


      var busyPort = $viewport.filter(".slick-viewport:visible").last();
      if (busyPort.data("uiInforBusyIndicator")) {
        busyPort.inforBusyIndicator("close"); //hide loading indicator
      }

      //see if the page was loaded..Caching
      var cachePos = $.inArray( pageNum, loadedPages );
      if (cachePos>-1) {
        updateData(loadedPages[cachePos].dataset);
        getData().setPagingOptions({totalRows: totalRows, pageNum: pageNum});
        return;
      }

      loadedPages.push({pageNum:pageNum, dataset: newData});
      if (options.pagingMode=="ContinuousScrolling") {
        var oldData = (pageNum == 0 ? [] : getData().getItems());
        var allData = oldData.concat(newData);
        updateData(allData);

        if (totalRows==undefined)
          totalRows = allData.length;
      }
      else {
        updateData(newData);

        if (totalRows==undefined)
          totalRows = newData.length;
      }

      var dataView = getData();
      dataView.setPagingOptions({totalRows: totalRows, pageNum: pageNum, isLastPage: isLastPage, isFirstPage: isFirstPage});
      dataView.onPagingInfoChanged.notify(dataView.getPagingInfo(), null, self);

      //scroll down...for better continuous scrolling.
      if (options.pagingMode=="ContinuousScrolling") {
        dataView.activeReq = false; //let the next request go through
        if (pageNum!=0) {
          scrollRowIntoView(totalRows*.80, false);
        }
      }
      setOverflow();
    }

    function getData(commitEdits) {
      //Commit any pending edits...
      if (commitEdits)
        getEditorLock().commitCurrentEdit();

      return data;
    }

    /* Validation Functions */
    function ErrorMap() {
      this.keys = new Array();
      this.data = new Object();

      this.push = function (key, value) {
        if(this.data[key] == null){
          this.keys.push(key);
        }
        this.data[key] = value;
      };

      this.get = function (key) {
        return this.data[key];
      };

      this.remove = function (key) {
        var len = this.keys.length;
        for (var i=0; i<len; i++) {
          if (this.keys[i] == key) {
            this.keys.splice(i,1);
          }
        }
        this.data[key] = null;
      };

      this.size = function() {
        return this.keys.length;
      };

      this.toString = function() {
        var len = this.keys.length,
          str = "";

        for (var i=0; i < len; i++) {
          str += (len > 1 ? (i+1)+ ") " : "") + this.data[this.keys[i]].validationResults.msg + "<br>";
        }
        return str;
      };
    }

    //execute the validator on a cell.
    function validateCell(row, cell) {
      //create a new editor
      var tempContainer = $("<div></div>"),
        item = getData().getItem(row),
        tempCellNode = getCellNode(row, cell),
        columnDef = getColumns()[cell],
        editor,
        isValid,
        editorFunc = getEditor(row, cell);

      if (!editorFunc) {
        return true;
      }

      editor = new (editorFunc)({
                grid: self,
                gridPosition: absBox($container[0]),
                position: absBox(tempCellNode),
                container: tempContainer,
                column: columnDef,
                item: item || {},
                commitChanges: null,
                cancelChanges: null
              });

      if (item && !item.group) {
        editor.loadValue(item, false);
      }

      isValid = executeValidator(editor, item, columnDef, row, cell);
      editor.destroy();
      tempContainer = null;
      return isValid;
    }

    function executeValidator(editor, item, column, row, cell) {
      var validationResults = editor.validate(),
        cellNode = getCellNode(row, cell);

      if (item.__group || item.__groupTotals) {
        return;
      }

      if (!validationResults.valid) {
        var errorObj = {
          editor: editor,
          cellNode: cellNode,
          validationResults: validationResults,
          row: row,
          cell: cell,
          column: column
        };

        //set errors on the trigger fields.
        $(cellNode).addClass("error");
        if (item.indicator != "error") {
          item.previousIndicator = item.indicator;
        }
        item.indicator = "error";

        if (!item.validationMessages) {
          item.validationMessages = new ErrorMap();
        }
        item.validationMessages.push(cell, errorObj);
        updateCell(row, getColumnIndex("indicator-icon"));
        trigger(self.onValidationMessage, errorObj);
      } else {
        //remove error indicator if no more errors.
        $(cellNode).removeClass("error");

        if (item) {
          if (item.validationMessages) {
            item.validationMessages.remove(cell);
          }
          if (item.validationMessages && item.validationMessages.size() >= 1) {
            item.indicator = "error";
          } else {
            item.indicator = (item.previousIndicator ? item.previousIndicator : (editor.isValueChanged() && item.indicator !== "new" ? "dirty" : item.indicator));
          }
        }
      }

      return validationResults.valid;
    }

    //validate all cells on a row
    function validateRow(row) {
      var columns = getColumns(),
        i, isValid = true, cellValid = true;

      for (i = 0; i < columns.length; i++) {
        cellValid = validateCell(row, i);
        if (!cellValid && isValid) {
          isValid = false;
        }
      }
      return isValid;
    }

    //validate all cells on every row.
    function validateAll() {
      var data = getFilteredData(),
        i, isValid = true, rowValid = true;

      for (i = 0; i < data.length; i++) {
        rowValid = validateRow(i);
        if (!rowValid && isValid) {
          isValid = false;
        }
      }
      return isValid;
    }

    function clearValidationMessages() {
      var data = getFilteredData(),
        i;

      for (i = 0; i < data.length; i++) {
        setValidationMessages(i, null);
      }
    }

    function getValidationMessages(rownum) {
      var row = getData().getItems()[rownum];
      return row.validationMessages;
    }

    function setValidationMessages(rownum, validationMessages) {
      var row = getData().getItems()[rownum];
      row.validationMessages = validationMessages;
      if (!row.validationMessages || row.validationMessages.size() >= 1) {
        row.indicator = "";
      }
      invalidateRow(rownum);
      render();
    }

    function addValidationMessage(rownum, cell, message) {
      var row = getData().getItems()[rownum],
        errorObj =  {
              editor: null,
              cellNode: null,
              validationResults: {valid: false, msg: message},
              row: rownum,
              cell: cell,
              column: null
              };

      if (row.indicator && row.indicator!="error") {
        row._indicator = row.indicator;
      }
      row.indicator = "error";
      if (!row.validationMessages) {
        row.validationMessages = new ErrorMap();
      }
      row.validationMessages.push((cell ? cell : "row" + rownum), errorObj);
      invalidateRow(rownum);
      render();
    }

    function removeValidationMessage(rownum, cell) {
      var row = getData().getItems()[rownum];
      if (row.validationMessages) {
        row.validationMessages.remove((cell ? cell : "row" + rownum));
        if (row.validationMessages.size() >= 1) {
          row.indicator = "error";
        } else {
          row.indicator = (row._indicator ? row._indicator : "");
          delete row._indicator;
        }
        invalidateRow(rownum);
        render();
      }
    }

    function setRowStatus (rownum, status, message) { //can be "dirty", "new", "error" or "" to clear.
      if (status === "error") {
        addValidationMessage(rownum, null, message);
        return;
      }

      var row = getData().getItems()[rownum];
      row.indicator = status;
      if (status == "error") {
        row.validationMessages = message;
      } else {
        row.indicatorTooltip = message;
      }
      invalidateRow(rownum);
      render();
    }

    /*
      Add a row to the bottom of the grid. Or in any position after insertBefore.
    */
    function addRow(newRow, insertBefore){
      if (!newRow) {
        newRow = { id: getData().getMaxId() + 1};
      }
      //add new indication..
      newRow.indicator = "new" ;
      invalidateAllRows();

      if (insertBefore === undefined) {
        getData().addItem(newRow);
      } else {
        getData().insertItem(insertBefore, newRow);
      }

      updateRowCount();
      render();

      var focusRow = (insertBefore === undefined ? getDataLength()-1 : insertBefore);
      scrollRowIntoView(focusRow, false);
      focus(focusRow);

      trigger(self.onAddNewRow, { item: newRow });
    }

    function focus(row) {
      if (options.editable) {
        var cols = getColumns();
        for (var i=0; i < cols.length; i++) {
          if (isCellPotentiallyEditable(row, i)) {
            setActiveCellInternal(getCellNode(row, i), options.autoEdit, true);
            break;
          }
        }
      }
    }

    function addRows(newRows, indicator){
      if (!newRows || newRows.length==0)
        return;

      //add new indication..
      var indicatorStr = (indicator ? "new" : "");
      var dataSet = getData(),
        items = dataSet.getItems();

      for (var i=0; i < newRows.length; i++) {
        newRows[i].indicator = indicatorStr ;
        //dataSet.addItem(newRows[i]);
        items.push(newRows[i]);
        trigger(self.onAddNewRow, { item: newRows[i] });
      }

      updateData(items);
      updateRowCount();
      render();
      dataSet.reSort();

      //scroll to the last one we added.
      var idx = data.getRowIdx(newRows[newRows.length-1]);
      scrollRowIntoView((idx == -1 ? 0 : idx), true);
    }

    //Remove all Selected Rows from the grid.
    function removeSelectedRows() {
      var dataset = getData(),
        rowData = dataset.getItems(),
        filteredData = getFilteredData(),
        id, idx;

      var selRows = getSelectedRows();
      if (selRows.length === 0) {
        return;
      }

      selRows.sort(function(a,b){return a - b});
      for (var i = (selRows.length - 1); i >= 0; i--) {
        id = filteredData[selRows[i]][options.idProperty];
        idx = dataset.getIdxById(filteredData[selRows[i]][options.idProperty]);
        //find item by id.
        rowData.splice(idx , 1);
      }

      dataset.setItems(rowData);
      updateRowCount();
      render();

      // clear selected rows - select last
      setSelectedRows([]);
      updateSummaryRow();
    }

    function getDataLength() {
      if (data.getLength) {
        return data.getLength();
      }
      else {
        return data.length;
      }
    }

    function getSelectableLength() {
      var collection = null,
        selectable = 0;

      if (data.getLength) {
        collection = getFilteredData();
      }
      else {
        collection = data;
      }

      for (var i = 0; i < collection.length; i++) {
        if (canRowBeSelected(i))
          selectable++;
      }

      if (getOptions().enableGrouping) {
        selectable = collection.length;
      }
      return selectable;
    }

    function getDataItem(i) {
      if (data.getItem) {
        return data.getItem(i);
      }
      else {
        return data[i];
      }
    }

    function getTopPanel() {
      return $topPanel[0];
    }

    function setTopPanelVisibility(visible) {
      if (options.showTopPanel != visible) {
        options.showTopPanel = visible;
        if (visible) {
          $topPanelScroller.slideDown("fast", resizeCanvas);
        } else {
          $topPanelScroller.slideUp("fast", resizeCanvas);
        }
      }
    }

    function setHeaderRowVisibility(visible) {
      if (options.showHeaderRow != visible) {
        options.showHeaderRow = visible;
        if (visible) {
          $headerRowScroller.show();
        } else {
          $headerRowScroller.hide();
        }
        resizeCanvas();
      }
      showFilterButton(visible);
    }

    function toggleFilterRow() {
      options.showFilter = !options.showFilter;
      setHeaderRowVisibility(options.showFilter);
      createColumnHeaders();
      updateFilterRow();
      updateSummaryRow();
      personalizationInfo.showFilter=options.showFilter;
      if (options.showFilter) {
        $headerRowScrollContainer[0].scrollLeft = $headerScrollContainer[0].scrollLeft;
      }
      trigger(self.onPersonalizationChanged, getGridPersonalizationInfo('ShowFilter'));
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Rendering / Scrolling
    function scrollTo(y) {
      y = Math.max(y, 0);
      y = Math.min(y, th - $viewportScrollContainerY.height() + ((viewportHasHScroll || options.frozenColumn > -1) ? scrollbarDimensions.height : 0));

      var oldOffset = offset;

      page = Math.min(n - 1, Math.floor(y / ph));
      offset = Math.round(page * cj);
      var newScrollTop = y - offset;

      if (offset != oldOffset) {
        var range = getVisibleRange(newScrollTop);
        cleanupRows(range);
      }

      if (prevScrollTop != newScrollTop) {
        vScrollDir = (prevScrollTop + oldOffset < newScrollTop + offset) ? 1 : -1;

        lastRenderedScrollTop = ( scrollTop = prevScrollTop = newScrollTop );

        if (options.frozenColumn > -1) {
          $viewportTopL[0].scrollTop = newScrollTop;
          $viewportTopR[0].scrollTop = newScrollTop;
        }

        if ( hasFrozenRows ) {
          $viewportBottomL[0].scrollTop = $viewportBottomR[0].scrollTop = newScrollTop;
        }

        $viewportScrollContainerY[0].scrollTop = newScrollTop;
        trigger(self.onViewportChanged, {});
      }
    }


    function defaultFormatter(row, cell, value, columnDef, dataContext) {
      return (value === null || value === undefined) ? "" : value;
    }

    function getFormatter(row, column) {
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);

      // look up by id, then index
      var columnOverrides = rowMetadata &&
          rowMetadata.columns &&
          (rowMetadata.columns[column.id] || rowMetadata.columns[getColumnIndex(column.id)]);

      return (columnOverrides && columnOverrides.formatter) ||
          (rowMetadata && rowMetadata.formatter) ||
          column.formatter ||
          (options.formatterFactory && options.formatterFactory.getFormatter(column)) ||
          defaultFormatter;
    }

    function getEditor(row, cell) {
      var column = columns[cell],
        rowMetadata = data.getItemMetadata && data.getItemMetadata(row),
        columnMetadata = rowMetadata && rowMetadata.columns;

      if (columnMetadata && columnMetadata[column.id] && columnMetadata[column.id].editor !== undefined) {
        return columnMetadata[column.id].editor;
      }
      if (columnMetadata && columnMetadata[cell] && columnMetadata[cell].editor !== undefined) {
        return columnMetadata[cell].editor;
      }

      return column.editor || (options.editorFactory && options.editorFactory.getEditor(column));
    }


    var getItemCache = {};
    function getDataItemValueForColumn(item, field) {
      if (options.dataItemColumnValueExtractor) {
        return options.dataItemColumnValueExtractor(item, field, self);
      }

      if (options.dataItemColumnValueExtractor) {
        return options.dataItemColumnValueExtractor(item, field, self);
      } else if (!item[field] && field !== undefined && field.indexOf(".") > -1) {
        var fn = getItemCache[field] = getItemCache[field] || new Function(["item", "field"], "with(item){try{return "+field+";}catch(e){return null;}}");
        return fn(item, field);
      } else {
         var value = item[field];
         if (typeof value === 'string') {
           value = value.replace(/&amp;/g, '&');
           value = value.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
         }
         return value;
      }
    }

    var setItemCache = {};
    function setDataItemValueForColumn(item, field, value) {
      if (typeof value === 'string') {
         value = value.replace(/&/g, '&amp;');
         value = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      if (options.dataItemColumnValueSetter) {
        options.dataItemColumnValueSetter(item, field, value, self);
      } else if (!item[field] && field !== undefined && field.indexOf(".") > -1) {
        var fn = setItemCache[field] = setItemCache[field] || new Function(["item", "field", "value"], "with(item){try{"+field+"=value;}catch(e){return}}");
        fn(item, field, value);
      } else {
        item[field] = value;
      }
    }

    function calculateVariableRowHeight() {
      if (!options.variableRowHeight) {
        return;
      }

      var dataview = getData(),
        data = getFilteredData(),
        h = 0,
        varCols = options.variableRowHeightColumn,
        col = (typeof varCols == "string" ? varCols : varCols[0]);

      //attach function to look at the rowHeight data set value
      if (!getColumnIndex(col) && col=="rowHeight") {
        dataview.getRowHeights = function(row) {
          var dataset = getFilteredData();
          if (dataset[row] && dataset[row].rowHeight) {
            var obj = {
              'rows': {}
            };

            obj['rows'][row] = {height : dataset[row].rowHeight};
            return obj;
          }
        }
        return;
      }

      if (data.length == 0 || data[0][col] === undefined) {
        return;
      }

      //attch function to look at a specific column
      dataview.getRowHeights = function(row) {
        var h = estimateColumnHeight(col, row, data),
          h2 = 0;

        if (typeof varCols == "object") {
          for (var i = 1; i < varCols.length; i++) {
            h2 = estimateColumnHeight(varCols[i], row, data);
            if (h2 > h) {
              h = h2;
            }
          }
        }

        if (h > 27 ) {
          var obj = {
            'rows': {}
          };

          obj['rows'][row] = {'height': h };
          return obj;
        }
      }
    }

    function estimateColumnHeight(col, row, data) {
      var colindex = getColumnIndex(col),
        h;

      if (!data[row] || !data[row][col]) {
        return 27;
      }

      if (!colindex) {
        return 27;
      }

      var c = data[row][col],
        colwidth = getColumns()[colindex].width;

      //New calc
      c = c.toString();
      var matches = c.match(/\n/g);

      if ((c.length*8) + 8 < colwidth && (matches ? matches.length : 0) === 0) {
        h = 27;
      } else {
        var tester = $("<textarea style='line-height: 16px;white-space: pre-wrap;word-wrap: break-word;' class='inforTextArea'>" + c + "</textarea>").css({"width" : colwidth , "height" : "auto"}).appendTo("body");
        h = parseInt(tester.prop('scrollHeight'), 10) + 17;
        tester.remove();
      }

      return h;
    }

    function appendRowHtml(stringArrayL, stringArrayR, row, range) {
      var d = getDataItem(row),
        dataLoading = row < getDataLength() && !d,
        rowCss = "slick-row " +
          (dataLoading ? " loading" : "") +
          (row === activeRow ? " active" : "") +
          (row % 2 == 1 ? ' odd' : ' even') +
          (options.showZebraStripes ? ' zebra' : ' ') +
          ($.inArray(row,selectedRows)>-1 ? " selected" : " "),
        metadata = data.getItemMetadata && data.getItemMetadata(row);

      if (metadata && metadata.cssClasses) {
        rowCss += " " + metadata.cssClasses;
      }

      var frozenRowOffset = (options.frozenRow > -1 && row >= options.frozenRow) ? options.rowHeight * options.frozenRow : 0;
      var rowHtml = "<div class='ui-widget-content " + rowCss + "' role='row' tabindex='-1' aria-rowindex='" + row + "' row='" + row + "' style='top:" + (rowPositionCache[row].top - frozenRowOffset) + "px;"
        + ((rowPositionCache[row].height != options.rowHeight ) ? "height:" + rowPositionCache[row].height + "px;" : "")+"'>";

      stringArrayL.push(rowHtml);

      if (options.frozenColumn > -1) {
        stringArrayR.push(rowHtml);
      }

      var colspan, m;

      for (var i = 0, ii = columns.length; i < ii; i++) {
        m = columns[i];
        colspan = 1;
        if (metadata && metadata.columns) {
          var columnData = metadata.columns[m.id] || metadata.columns[i];
          colspan = (columnData && columnData.colspan) || 1;
          if (colspan === "*") {
            colspan = ii - i;
          }
        }

        // Do not render cells outside of the viewport.
        if (columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
          if (columnPosLeft[i] > range.rightPx) {
            // All columns to the right are outside the range.
            break;
          }

          if ( ( options.frozenColumn > -1 ) && ( i > options.frozenColumn ) ) {
            appendCellHtml(stringArrayR, row, i, colspan);
          } else {
            appendCellHtml(stringArrayL, row, i, colspan);
          }
        } else if ( ( options.frozenColumn > -1 ) && ( i <= options.frozenColumn ) ) {
          appendCellHtml(stringArrayL, row, i, colspan);
        }

        if (colspan > 1) {
          i += (colspan - 1);
        }
      }

      stringArrayL.push("</div>");

      if (options.frozenColumn > -1) {
        stringArrayR.push("</div>");
      }
    }

    function appendCellHtml(stringArray, row, cell, colspan) {
      var m = columns[cell],
        d = getDataItem(row),
        value = getDataItemValueForColumn(d, m.field);
        formatter = getFormatter(row, m)(row, cell, value, m, d, options, self);
        r = Math.min(columns.length - 1, cell + colspan - 1),
        cellCss = "slick-cell l" + cell + " r" + r + (m.cssClass ? " " + m.cssClass : "");

      if (row === activeRow && cell === activeCell) {
        cellCss += (" active");
      }

      if (d.validationMessages && d.validationMessages.get(r)) {
        cellCss += (" error");
      }

      // TODO:  merge them together in the setter
      for (var key in cellCssClasses) {
        if (cellCssClasses[key][row] && cellCssClasses[key][row][m.id]) {
          cellCss += (" " + cellCssClasses[key][row][m.id]);
        }
      }

      stringArray.push("<div class='" + cellCss +
              "' aria-describedby='" + uid + m.id +
              "' tabindex='-1' role='gridcell' aria-colindex='" + cell + "'>");

      // if there is a corresponding row (if not, this is the Add New row or this data hasn't been loaded yet)
      if (d) {
        stringArray.push(formatter);
      }

      stringArray.push("</div>");

      rowsCache[row].cellRenderQueue.push(cell);
      rowsCache[row].cellColSpans[cell] = colspan;
    }

    function cleanupRows(rangeToKeep) {
      for (var i in rowsCache) {
        if (((i = parseInt(i, 10)) !== activeRow) && (i < rangeToKeep.top || i > rangeToKeep.bottom)) {
          removeRowFromCache(i);
        }
      }
    }

    function invalidate() {
      updateRowCount();
      invalidateAllRows();
      render();
    }

    function invalidateAllRows() {
      if (currentEditor) {
        makeActiveCellNormal();
      }
      for (var row in rowsCache) {
        removeRowFromCache(row);
      }
    }

    function removeRowFromCache(row) {
      var node = rowsCache[row];
      if (!node) {
        return;
      }
      if (node.rowNode)
      {
        node.rowNode.remove();
      }
      delete rowsCache[row];
      delete postProcessedRows[row];
      renderedRows--;
    }

    function invalidateRows(rows) {
      var i, rl;
      if (!rows || !rows.length) {
        return;
      }
      vScrollDir = 0;
      for (i = 0, rl = rows.length; i < rl; i++) {
        if (currentEditor && activeRow === rows[i]) {
          makeActiveCellNormal();
        }
        if (rowsCache[rows[i]]) {
          removeRowFromCache(rows[i]);
        }
      }
    }

    function invalidateRow(row) {
      invalidateRows([row]);
    }

    function updateCell(row, cell) {
      var cellNode = getCellNode(row, cell);
      if (!cellNode) {
        return;
      }

      var m = columns[cell], d = getDataItem(row);
      if (currentEditor && activeRow === row && activeCell === cell) {
        currentEditor.loadValue(d);
      }
      else {
        cellNode.html(d ? getFormatter(row, m)(row, cell, getDataItemValueForColumn(d, m.field), m, d, getOptions(), self) : "");
        invalidatePostProcessingResults(row);
      }
    }

    function updateRow(row) {
      var cacheEntry = rowsCache[row];
      if (!cacheEntry) {
        return;
      }

      ensureCellNodesInRowsCache(row);

      for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
          continue;
        }

        columnIdx = columnIdx | 0;
        var m = columns[columnIdx],
          d = getDataItem(row),
          node = cacheEntry.cellNodesByColumnIdx[columnIdx][0];

        if (row === activeRow && columnIdx === activeCell && currentEditor) {
          currentEditor.loadValue(d);
        } else if (d) {
          node.innerHTML = getFormatter(row, m)(row, columnIdx, getDataItemValueForColumn(d, m.field), m, d, getOptions(), self);
        } else {
          node.innerHTML = "";
        }
      }

      invalidatePostProcessingResults(row);
    }

    function getViewportHeight() {
      return parseFloat($.css($container[0], "height", true))
        - parseFloat((options.showColumnHeaders ? $.css($headerScroller[0], "height") : 0))
        - getVBoxDelta($headerScroller)
        - (options.showTopPanel ? options.topPanelHeight + getVBoxDelta($topPanelScroller) : 0)
        - (options.showHeaderRow ? options.headerRowHeight + getVBoxDelta($headerRowScroller) : 0)
        - (options.showSummaryRow ? options.summaryRowHeight + getVBoxDelta($summaryRowScroller) : 0);
    }

    function reinit() { //rerender after being initially invisible.
      resizeCanvas();
      createColumnHeaders();
      updateFilterRow();
      invalidateAllRows();
      render();
      updateSummaryRow();
    }

    function resizeCanvas() {

      if (options.fillHeight && !options.autoHeight && !options.autoHeightToPageSize) {
        //Find the top of the viewport and subtract that from the window height
        var offSet = $container.offset();

        if ($container.length==0) //might be here unless the grid was not destroyed().
          return;

        var winHeight = $(window).height();
        var newHeight = winHeight-offSet.top-2;

        //See whats below the grid...
        var nextElement = $container.next(":visible").not(".inforMenu, .inforGridFooter");
        if (nextElement.length>0) {
          newHeight -=  nextElement.height();
        }

        var topPane = $container.closest("#topPane"); //handle being in the top of a splitter
        if ($container.closest("#topPane").length>0){
          newHeight =   topPane.height() - ($container.position().top -  topPane.position().top) - 10;
        }

        var bottomPane = $container.closest("#bottomPane"); //handle being in the top of a splitter
        if ($container.closest("#bottomPane").length>0){
          newHeight =   bottomPane.height() - ($container.position().top -  bottomPane.position().top);
        }


        if (options.showFooter) {
          newHeight -= 22;
        }

        if ($pageFooter.length==1) {  //account for space when there is a page footer.
          newHeight -= 27;
        }

        var tabPanel = $container.closest(".ui-tabs-panel");
        if (tabPanel.length>0) {
          newHeight = tabPanel.height() - ($container.position().top - tabPanel.position().top) - 2;
          if ($container.next(":visible").is(".inforGridFooter")) {
            newHeight -= 24;
          }
        }

        if (tabPanel.parent().hasClass("inforVerticalTabs")) {
          newHeight = tabPanel.height() - ($container.position().top) - (options.showFooter ? 22 : 0) - ($pageFooter.length==1 ? 27 : 0);
        }

        $container.height(newHeight);
        viewportW = parseFloat($.css($container[0], "width", true));  //reset width
      }

      if (!initialized) { return; }

      if (options.autoHeight || options.autoHeightToPageSize) {
        var len = (getDataLength() <= 0 ? 0 : getDataLength()-1);
        viewportH = rowPositionCache[len].top + rowPositionCache[len].height;

        if (options.autoHeightToPageSize && getDataLength()<options.pageSize) {
          viewportH += ((options.pageSize - getDataLength()) * options.rowHeight);
        }

        if ($container.find(".inforLookupHeader").length==1) {
          viewportH+=26;
        }
        viewportH+=19;  //HFC-1601
        $container.height(viewportH + parseFloat($.css($headerScrollerL[0], "height")) + scrollbarDimensions.height + (options.showSummaryRow ? 27 : 0) + (options.showHeaderRow ? 10 : -scrollbarDimensions.height));

      } else {
        viewportH = getViewportHeight();
      }

      var paneTopH = viewportH
            + (options.showHeaderRow ? options.headerRowHeight + getVBoxDelta($headerRowScroller) : 0)
            + (options.showSummaryRow ? options.summaryRowHeight + getVBoxDelta($summaryRowScroller) : 0);

      paneTopH += ( options.frozenColumn > -1 && options.autoHeight ) ? scrollbarDimensions.height : 0;

      $paneTopL.css({
        'top': $paneHeaderL.height()
        ,'height': paneTopH
      });

      var viewportTopH = viewportH;
      if (options.autoHeight || options.autoHeightToPageSize) {
        $canvas.height(viewportTopH);
      }

      if (options.autoHeight || options.autoHeightToPageSize) {
        viewportTopH += scrollbarDimensions.height;
      }

      $viewportTopL.height(viewportTopH);

      if (options.frozenColumn > -1) {
        $paneTopR.css({
          'top': $paneHeaderR.height()
        ,'height': paneTopH
        });

        $viewportTopR.height(viewportTopH);
      }

      $viewportTopR.height(viewportTopH);

      if (options.forceFitColumns) {
        createColumnHeaders();
        autosizeColumns();
        updateCanvasWidth(true);
        updateFilterRow();
      }

      updateRowCount();
      handleScroll();

      //make adjustments for scrollbar
      if (options.autoHeight || options.autoHeightToPageSize) {
        var hasScrollR =  $viewportTopR.get(0).scrollWidth > $viewportTopR.width();
        var hasScrollL =  $viewportTopL.get(0).scrollWidth > $viewportTopL.width();

        $paneTopL.height("auto");
        $paneTopR.height("auto");
        $viewport.height("auto");
        $container.height($container.height() + ((hasScrollL || hasScrollR) ? scrollbarDimensions.height + (navigator.userAgent.toLowerCase().indexOf("webkit") > -1 ?  1 : (options.showFilter ? 1 : 0)) : 0 ) + (options.showSummaryRow && options.showFilter ? 15 : 0));
      }

      if (getOptions().frozenColumn > -1) {
        updateCanvasWidth(true);
      }

      render();
    }

    function resizeAndRender() {
      if (options.forceFitColumns) {
        autosizeColumns();
      } else {
        resizeCanvas();
      }
    }

    function updateRowCount() {
      if (!initialized) { return; }

      cacheRowPositions();
      var oldNumberOfRows = numberOfRows;

      numberOfRows = getDataLength() +
        (options.enableAddRow ? 1 : 0);

      var oldViewportHasVScroll = viewportHasVScroll;
      // with autoHeight, we do not need to accommodate the vertical scroll bar
      //viewportHasVScroll = !options.autoHeight && !options.autoHeightToPageSize && (numberOfRows * options.rowHeight > viewportH);
      viewportHasVScroll = !options.autoHeight && !options.autoHeightToPageSize
            && rowPositionCache[numberOfRows-1]
            && (rowPositionCache[numberOfRows-1].bottom > viewportH);

      // remove the rows that are now outside of the data range
      // this helps avoid redundant calls to .removeRow() when the size of the data decreased by thousands of rows
      var l = options.enableAddRow ? getDataLength() : getDataLength() - 1;
      for (var i in rowsCache) {
        if (i >= l) {
          removeRowFromCache(i);
        }
      }

      var oldH = h,
        len = getDataLength() === 0 ? 0 : getDataLength()-1;

      //th = Math.max(options.rowHeight * numberOfRows, viewportH - scrollbarDimensions.height);
      var rowMax = (options.enableAddRow)
        ? rowPositionCache[len].bottom
        : rowPositionCache[len].top + rowPositionCache[len].height;

      th = Math.max(rowMax, viewportH - scrollbarDimensions.height);

      if (activeCellNode && activeRow > l) {
        resetActiveCell();
      }

      if (th < maxSupportedCssHeight) {
        // just one page
        h = ph = th;
        n = 1;
        cj = 0;
      } else {
        // break into pages
        h = maxSupportedCssHeight;
        ph = h / 100;
        n = Math.floor(th / ph);
        cj = (th - h) / (n - 1);
      }

      if (numberOfRows !== oldNumberOfRows || h !== oldH) {
        if ( hasFrozenRows && !options.frozenBottom ) {
          $canvasBottomL.css("height", h);

          if ( options.frozenColumn > -1 ) {
            $canvasBottomR.css("height", h);
          }
        } else {
          $canvasTopL.css("height", h);
          $canvasTopR.css("height", h);
        }

        scrollTop = $viewportScrollContainerY[0].scrollTop;
      }

      var oldScrollTopInRange = (scrollTop + offset <= th - viewportH);

      if (th == 0 || scrollTop == 0) {
        page = offset = 0;
      } else if (oldScrollTopInRange) {
        // maintain virtual position
        scrollTo(scrollTop + offset);
      } else {
        // scroll to bottom
        scrollTo(th - viewportH);
      }

      if (numberOfRows !== oldNumberOfRows && (options.autoHeight || options.autoHeightToPageSize)) {
        resizeCanvas();
      }

      if (options.forceFitColumns && oldViewportHasVScroll !== viewportHasVScroll) {
        autosizeColumns();
      }
      updateCanvasWidth(false);
    }

  function getVisibleRange(viewportTop, viewportLeft) {
    if (viewportTop == null) {
        viewportTop = scrollTop;
      }
      if (viewportLeft == null) {
        viewportLeft = scrollLeft;
      }

      return {
        top: getRowFromPosition(viewportTop),
        bottom: getRowFromPosition(viewportTop + viewportH) + 1,
        leftPx: viewportLeft,
        rightPx: viewportLeft + viewportW
      };
    }

    function getRowFromPosition( maxPosition ) {
      var row = 0;
      var rowsInPosCache = getDataLength();

      if ( !rowsInPosCache ) {
        return row;
      }

      // Loop through the row position cache and break when
      // the row is found
      for ( var i = 0; i < rowsInPosCache; i++ ) {
        if (rowPositionCache[i] == undefined) {
          return;
        }

        if ( rowPositionCache[i].top <= maxPosition
          && rowPositionCache[i].bottom >= maxPosition
        ) {
          row = i;
          continue;
        }
      }

      // Return the last row in the grid
      if ( maxPosition > rowPositionCache[rowsInPosCache-1].bottom ) {
        row = rowsInPosCache-1;
      }

      return row;
    }

    function getRenderedRange(viewportTop, viewportLeft) {
      var range = getVisibleRange(viewportTop, viewportLeft),
        buffer = Math.round(viewportH / options.rowHeight),
        minBuffer = 3;

      if (vScrollDir == -1) {
        range.top -= buffer;
        range.bottom += minBuffer;
      }
      else if (vScrollDir == 1) {
        range.top -= minBuffer;
        range.bottom += buffer;
      }
      else {
        range.top -= minBuffer;
        range.bottom += minBuffer;
      }

      range.top = Math.max(0, range.top);
      range.bottom = Math.min(options.enableAddRow ? getDataLength() : getDataLength() - 1, range.bottom);

      range.leftPx -= viewportW;
      range.rightPx += viewportW;

      range.leftPx = Math.max(0, range.leftPx);
      range.rightPx = range.rightPx == 0 ? canvasWidth : Math.min(canvasWidth, range.rightPx);

      return range;
    }

    function ensureCellNodesInRowsCache(row) {
      var cacheEntry = rowsCache[row];
      if (cacheEntry) {
        if (cacheEntry.cellRenderQueue.length) {
          var $lastNode = cacheEntry.rowNode.children().last();
          while (cacheEntry.cellRenderQueue.length) {
            var columnIdx = cacheEntry.cellRenderQueue.pop();

            cacheEntry.cellNodesByColumnIdx[columnIdx] = $lastNode;
            $lastNode = $lastNode.prev();

            // Hack to retrieve the frozen columns because
            if ( $lastNode.length == 0 ) {
              $lastNode = $( cacheEntry.rowNode[0] ).children().last();
            }
          }
        }
      }
    }

    function cleanUpCells(range, row) {
      // Ignore frozen rows
      if ( hasFrozenRows
        && ( ( options.frozenBottom && row > actualFrozenRow ) // Frozen bottom rows
          || ( row <= actualFrozenRow )                     // Frozen top rows
          )
      ) {
        return;
      }

      var totalCellsRemoved = 0;
      var cacheEntry = rowsCache[row];

      // Remove cells outside the range.
      var cellsToRemove = [];
      for (var i in cacheEntry.cellNodesByColumnIdx) {
        // I really hate it when people mess with Array.prototype.
        if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(i)) {
          continue;
        }

        // This is a string, so it needs to be cast back to a number.
        i = i | 0;

        // Ignore frozen columns
        if ( i <= options.frozenColumn ) {
          continue;
        }

        var colspan = cacheEntry.cellColSpans[i];
        if (columnPosLeft[i] > range.rightPx || columnPosRight[Math.min(columns.length - 1, i + colspan - 1)] < range.leftPx) {
          if (!(row == activeRow && i == activeCell)) {
            cellsToRemove.push(i);
          }
        }
      }

      var cellToRemove;
      while ((cellToRemove = cellsToRemove.pop()) != null) {
        cacheEntry.cellNodesByColumnIdx[cellToRemove][0].parentElement.removeChild( cacheEntry.cellNodesByColumnIdx[cellToRemove][0] );
        delete cacheEntry.cellColSpans[cellToRemove];
        delete cacheEntry.cellNodesByColumnIdx[cellToRemove];
        if (postProcessedRows[row]) {
          delete postProcessedRows[row][cellToRemove];
        }
        totalCellsRemoved++;
      }
    }

    function cleanUpAndRenderCells(range) {
      var cacheEntry;
      var stringArray = [];
      var processedRows = [];
      var cellsAdded;
      var totalCellsAdded = 0;
      var colspan;

      for (var row = range.top; row <= range.bottom; row++) {
        cacheEntry = rowsCache[row];
        if (!cacheEntry) {
          continue;
        }

        // cellRenderQueue populated in renderRows() needs to be cleared first
        ensureCellNodesInRowsCache(row);

        cleanUpCells(range, row);

        // Render missing cells.
        cellsAdded = 0;

        var metadata = data.getItemMetadata && data.getItemMetadata(row);
        metadata = metadata && metadata.columns;

        // TODO:  shorten this loop (index? heuristics? binary search?)
        for (var i = 0, ii = columns.length; i < ii; i++) {
          // Cells to the right are outside the range.
          if (columnPosLeft[i] > range.rightPx) {
            break;
          }

          // Already rendered.
          if ((colspan = cacheEntry.cellColSpans[i]) != null) {
            i += (colspan > 1 ? colspan - 1 : 0);
            continue;
          }

          colspan = 1;
          if (metadata) {
            var columnData = metadata[columns[i].id] || metadata[i];
            colspan = (columnData && columnData.colspan) || 1;
            if (colspan === "*") {
              colspan = ii - i;
            }
          }

          if (columnPosRight[Math.min(ii - 1, i + colspan - 1)] > range.leftPx) {
            appendCellHtml(stringArray, row, i, colspan);
            cellsAdded++;
          }

          i += (colspan > 1 ? colspan - 1 : 0);
        }

        if (cellsAdded) {
          totalCellsAdded += cellsAdded;
          processedRows.push(row);
        }
      }

      if (!stringArray.length) {
        return;
      }

      var x = document.createElement("div");
      x.innerHTML = stringArray.join("");

      var processedRow;
      var $node;
      while ((processedRow = processedRows.pop()) != null) {
        cacheEntry = rowsCache[processedRow];
        var columnIdx;
        while ((columnIdx = cacheEntry.cellRenderQueue.pop()) != null) {
          $node = $(x).children().last();

          if ( ( options.frozenColumn > -1 ) && ( columnIdx > options.frozenColumn ) ) {
            $( cacheEntry.rowNode[1] ).append( $node );
          } else {
            $( cacheEntry.rowNode[0] ).append( $node );
          }

          cacheEntry.cellNodesByColumnIdx[columnIdx] = $node;
        }
      }
    }

    function renderRows(range) {
      var i, l,
        stringArrayL = [],
        stringArrayR = [],
        rows = [],
        needToReselectCell = false;

      if (options.variableRowHeight) {
        cacheRowPositions();  //recache row positions for sorting and filtering at a slight perf hit
      }

      for (i = range.top; i <= range.bottom; i++) {
        if (rowsCache[i]) {
          continue;
        }
        renderedRows++;
        rows.push(i);

        // Create an entry right away so that appendRowHtml() can
        // start populatating it.
        rowsCache[i] = {
        "rowNode": null,

        // ColSpans of rendered cells (by column idx).
        // Can also be used for checking whether a cell has been rendered.
        "cellColSpans": [],

        // Cell nodes (by column idx).  Lazy-populated by ensureCellNodesInRowsCache().
        "cellNodesByColumnIdx": [],

        // Column indices of cell nodes that have been rendered, but not yet indexed in
        // cellNodesByColumnIdx.  These are in the same order as cell nodes added at the
        // end of the row.
        "cellRenderQueue": []
        };

        appendRowHtml(stringArrayL, stringArrayR, i, range);

        if (activeCellNode && activeRow === i) {
          needToReselectCell = true;
        }
      }

      if (!rows.length) {
        return;
      }

      var x = document.createElement("div"),
        xRight = document.createElement("div");

      x.innerHTML = stringArrayL.join("");
      xRight.innerHTML = stringArrayR.join("");

      for (var i = 0, ii = rows.length; i < ii; i++) {
        if ( ( hasFrozenRows ) && ( rows[i] >= actualFrozenRow ) ) {
          if (options.frozenColumn > -1) {
            rowsCache[rows[i]].rowNode = $()
              .add($(x.firstChild).appendTo($canvasBottomL))
              .add($(xRight.firstChild).appendTo($canvasBottomR));
          } else {
            rowsCache[rows[i]].rowNode = $()
              .add($(x.firstChild).appendTo($canvasBottomL));
          }
        } else if (options.frozenColumn > -1) {
          rowsCache[rows[i]].rowNode = $()
            .add($(x.firstChild).appendTo($canvasTopL))
            .add($(xRight.firstChild).appendTo($canvasTopR));
        } else {
          rowsCache[rows[i]].rowNode = $()
            .add($(x.firstChild).appendTo($canvasTopL));
        }
      }

      if (needToReselectCell) {
        activeCellNode = getCellNode(activeRow, activeCell);
      }
    }

    function startPostProcessing() {
      if (!options.enableAsyncPostRender) { return; }
      clearTimeout(h_postrender);
      h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
    }

    function invalidatePostProcessingResults(row) {
      delete postProcessedRows[row];
      postProcessFromRow = Math.min(postProcessFromRow, row);
      postProcessToRow = Math.max(postProcessToRow, row);
      startPostProcessing();
    }

    function updateSummaryRow() {
      if (!options.showSummaryRow) {
        return;
      }

      getData().refresh();

      var cols =getColumns();
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].id !== "indicator-icon") {
          var header = getSummaryRowColumn(cols[i].id);

          if (!cols[i].summaryTotalFormatter)
            continue;

          var groups = getData().getGroups();
          if (groups.length > 0) {
            var html = cols[i].summaryTotalFormatter(groups[0].totals,cols[i]);
            $(header).empty().html(html);
          } else {
            $(header).empty();
          }
        }
      }
    }

    function render() {
    if (!initialized) { return; }

      var visible = getVisibleRange();
      var rendered = getRenderedRange();

      // remove rows no longer in the viewport
      cleanupRows(rendered);

      // add new rows & missing cells in existing rows
      if (lastRenderedScrollLeft != scrollLeft) {
        cleanUpAndRenderCells(rendered);
      }

      // render missing rows
      renderRows(rendered);

      // Render frozen bottom rows
      if ( options.frozenBottom ) {
        renderRows({
          top: actualFrozenRow
          ,bottom: getDataLength() - 1
          ,leftPx: rendered.leftPx
          ,rightPx: rendered.rightPx
        });
      }

      postProcessFromRow = visible.top;
      postProcessToRow = Math.min(options.enableAddRow ? getDataLength() : getDataLength() - 1, visible.bottom);
      startPostProcessing();

      lastRenderedScrollTop = scrollTop;
      lastRenderedScrollLeft = scrollLeft;
      h_render = null;
    }

    function handleHeaderRowScroll() {
      var scrollLeft = $headerRowScrollContainer[0].scrollLeft;
      if (scrollLeft != $viewportScrollContainerX[0].scrollLeft) {
        $viewportScrollContainerX[0].scrollLeft = scrollLeft;
      }
    }

    function handleMouseWheel(event, delta, deltaX, deltaY) {
      scrollTop = $viewportScrollContainerY[0].scrollTop - (deltaY * options.rowHeight);
      scrollLeft = $viewportScrollContainerX[0].scrollLeft + (deltaX * 10);
      _handleScroll(true);
      event.preventDefault();
    }

    function handleScroll() {
      scrollTop = $viewportScrollContainerY[0].scrollTop;
      scrollLeft = $viewportScrollContainerX[0].scrollLeft;
      _handleScroll(false);
    }

    function _handleScroll(isMouseWheel) {
      var maxScrollDistanceY = $viewportScrollContainerY[0].scrollHeight - $viewportScrollContainerY[0].clientHeight;
      var maxScrollDistanceX = $viewportScrollContainerY[0].scrollWidth - $viewportScrollContainerY[0].clientWidth;

      // Ceiling the max scroll values
      if (scrollTop > maxScrollDistanceY) {
        scrollTop = maxScrollDistanceY;
      }
      if (scrollLeft > maxScrollDistanceX) {
        scrollLeft = maxScrollDistanceX;
      }

      var vScrollDist = Math.abs(scrollTop - prevScrollTop);
      var hScrollDist = Math.abs(scrollLeft - prevScrollLeft);

      if (hScrollDist) {
        prevScrollLeft = scrollLeft;

        $viewportScrollContainerX[0].scrollLeft = scrollLeft;
        $headerScrollContainer[0].scrollLeft = scrollLeft;
        $topPanelScroller[0].scrollLeft = scrollLeft;
        $headerRowScrollContainer[0].scrollLeft = scrollLeft;
        $summaryRowScrollContainer[0].scrollLeft = scrollLeft;

        if (options.frozenColumn > -1) {
          if ( hasFrozenRows ) {
            $viewportTopR[0].scrollLeft = scrollLeft;
          }
        } else {
          if ( hasFrozenRows ) {
            $viewportTopL[0].scrollLeft = scrollLeft;
          }
        }
      }

      if (vScrollDist) {
        vScrollDir = prevScrollTop < scrollTop ? 1 : -1;
        prevScrollTop = scrollTop

        if ( isMouseWheel ) {
          $viewportScrollContainerY[0].scrollTop = scrollTop;
        }

        if ( options.frozenColumn > -1 ) {
          if ( hasFrozenRows && !options.frozenBottom ) {
            $viewportBottomL[0].scrollTop = scrollTop;
          } else {
            $viewportTopL[0].scrollTop = scrollTop;
          }
        }

        // switch virtual pages if needed
        if (vScrollDist < viewportH) {
          scrollTo(scrollTop + offset);
        } else {
          var oldOffset = offset;
          if (h == viewportH) {
            page = 0;
          } else {
            page = Math.min(n - 1, Math.floor(scrollTop * ((th - viewportH) / (h - viewportH)) * (1 / ph)));
          }
          offset = Math.round(page * cj);
          if (oldOffset != offset) {
            invalidateAllRows();
          }
        }
      }

      if (hScrollDist || vScrollDist) {
        if (h_render) {
        clearTimeout(h_render);
        }

        if (Math.abs(lastRenderedScrollTop - scrollTop) > 20 ||
          Math.abs(lastRenderedScrollLeft - scrollLeft) > 20) {
          if (options.forceSyncScrolling || (
            Math.abs(lastRenderedScrollTop - scrollTop) < viewportH &&
            Math.abs(lastRenderedScrollLeft - scrollLeft) < viewportW)) {
            render();
          } else {
            h_render = setTimeout(render, 50);
          }

        trigger(self.onViewportChanged, {});
        }
      }

      trigger(self.onScroll, {
        scrollLeft: scrollLeft,
        scrollTop: scrollTop
      });
    }

    function asyncPostProcessRows() {
      while (postProcessFromRow <= postProcessToRow) {
        var row = (vScrollDir >= 0) ? postProcessFromRow++ : postProcessToRow--;
        var cacheEntry = rowsCache[row];
        if (!cacheEntry || row >= getDataLength()) {
          continue;
        }

        if (!postProcessedRows[row]) {
          postProcessedRows[row] = {};
        }

        ensureCellNodesInRowsCache(row);
        for (var columnIdx in cacheEntry.cellNodesByColumnIdx) {
          if (!cacheEntry.cellNodesByColumnIdx.hasOwnProperty(columnIdx)) {
            continue;
          }

          columnIdx = columnIdx | 0;

          var m = columns[columnIdx];
          if (m.asyncPostRender && !postProcessedRows[row][columnIdx]) {
            var node = cacheEntry.cellNodesByColumnIdx[columnIdx];
            if (node) {
              m.asyncPostRender(node, row, getDataItem(row), m);
            }
            postProcessedRows[row][columnIdx] = true;
          }
        }

        h_postrender = setTimeout(asyncPostProcessRows, options.asyncPostRenderDelay);
        return;
      }
    }

    function addCellCssStyles(key, hash) {
    if (cellCssClasses[key]) {
        throw "addCellCssStyles: cell CSS hash with key '" + key + "' already exists.";
      }

      cellCssClasses[key] = hash;

      var node;
      for (var row in rowsCache) {
        if (hash[row]) {
          for (var columnId in hash[row]) {
            node = getCellNode(row, getColumnIndex(columnId));
            if (node) {
            $(node).addClass(hash[row][columnId]);
              if (key==options.selectedCellCssClass)
                $(node).addClass(key).closest(".slick-row").addClass(key);
            }
          }
        }
      }
    }

    function removeCellCssStyles(key) {
      if (!cellCssClasses[key]) {
        return;
      }

      var node;
      for (var row in rowsCache) {
        if (cellCssClasses[key][row]) {
          for (var columnId in cellCssClasses[key][row]) {
            node = getCellNode(row, getColumnIndex(columnId));
            if (node) {
              $(node).removeClass(cellCssClasses[key][row][columnId]);
              if (key==options.selectedCellCssClass)
                $(node).removeClass(key).closest(".slick-row").removeClass(key);
            }
          }
        }
      }

      delete cellCssClasses[key];
    }

    function setCellCssStyles(key, hash) {
      removeCellCssStyles(key);
      addCellCssStyles(key, hash);
    }

    function handleGridFocusIn()
    {
      // only set the focus on the first cell in the grid if we actually have data in the grid
      var dataLength = getDataLength();
      if (dataLength > 0)
      {
        if (!activeCellNode)
        {
          for (var i = 0; i < columns.length; i++)
          {
            if (!columns[i].hidden && !columns[i].builtin)
            {
              setActiveCell(0, i, options.autoEdit);
              break;
            }
          }

        }
        $container.removeAttr("tabindex");
      }
      else
      {
        $container.attr("tabindex", "0");
      }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Interactivity

    function handleDragInit(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      retval = trigger(self.onDragInit, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      // if nobody claims to be handling drag'n'drop by stopping immediate propagation,
      // cancel out of it
      return false;
    }

    function handleDragStart(e, dd) {
      var cell = getCellFromEvent(e);
      if (!cell || !cellExists(cell.row, cell.cell)) {
        return false;
      }

      var retval = trigger(self.onDragStart, dd, e);
      if (e.isImmediatePropagationStopped()) {
        return retval;
      }

      return false;
    }

    function handleDrag(e, dd) {
      return trigger(self.onDrag, dd, e);
    }

    function handleDragEnd(e, dd) {
      trigger(self.onDragEnd, dd, e);
    }

    function handleKeyDown(e) {
      trigger(self.onKeyDown, {}, e);
      var handled = e.isImmediatePropagationStopped();

      if (!handled) {
        if (options.allowTabs && e.which == 9) {
          if (e.shiftKey) {
            navigateLeft();
          } else {
            navigateRight();
          }
          e.stopPropagation();
          return false;
        }

        if (!e.shiftKey && !e.altKey && !e.ctrlKey) {
          if (e.which == 27) {
            if (!getEditorLock().isActive()) {
              return; // no editing mode to cancel, allow bubbling and default processing (exit without cancelling the event)
            }
            cancelEditAndSetFocus();
          }
          else if (e.which == 37) {
            navigateLeft();
          }
          else if (e.which == 39) {
            navigateRight();
          }
          else if (e.which == 38) {
            navigateUp();
          }
          else if (e.which == 40) {
            navigateDown();
          }
          else if (e.which == 34) { //page down
            navigatePageDown();
          }
          else if (e.which == 33) { //page up
            navigatePageUp();
          }
          else if (e.which == 13) {
            if ($(e.currentTarget).closest('.inforDataGrid').length > 0) {
              if (currentEditor) {
                navigateDown();
              }
              else {
                return;
              }
            }
            else {
              var handleLinkClick = !options.editable;

              if (options.editable) {
                if (currentEditor) {
                  // adding new row
                  if (activeRow === getDataLength()) {
                    navigateDown();
                  }
                  else {
                    commitEditAndSetFocus();
                  }
                } else {
                  if (getEditorLock().commitCurrentEdit()) {
                    var handled = makeActiveCellEditable();
                    if (handled === false)
                    {
                      handleLinkClick = true;
                    }
                  }
                }
              }
              if (handleLinkClick) {
                var link = $(e.currentTarget).find("a");
                if (link.length > 0) {
                  link.click();
                }
              }

            }
          }
          else
            return;
        }
        else
          return;
      }

      //IE issue with focus and keys not working
      if (currentEditor === null) {
        setFocus();
      }

      // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
      e.stopPropagation();
      e.preventDefault();
      try {
        e.originalEvent.keyCode = 0; // prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
      }
      catch (error) { } // ignore exceptions - setting the original event's keycode throws access denied exception for "Ctrl" (hitting control key only, nothing else), "Shift" (maybe others)
    }

    function handleClick(e) {
      if (!currentEditor) {
        // if this click resulted in some cell child node getting focus,
        // don't steal it back - keyboard events will still bubble up
        if (e.target != document.activeElement) {
          setFocus();
        }
      }

      var cell = getCellFromEvent(e);
      if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
        return;
      }

      trigger(self.onClick, { row: cell.row, cell: cell.cell }, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if (canCellBeActive(cell.row, cell.cell)) {
        if (!getEditorLock().isActive() || getEditorLock().commitCurrentEdit()) {
        scrollRowIntoView(cell.row, false);
        setActiveCellInternal(getCellNode(cell.row, cell.cell), (cell.row === getDataLength()) || options.autoEdit, true);
        }
      }

      handleCellChange(cell, true);
    }

    function handleCellChange(cell, forceSelect) {
      //In non edit mode a click selects the row.
      if ((!options.editable || options.selectRowInEditMode) && (forceSelect || options.enableCellNavigation)) {
        if ($(getCellNode(cell.row, cell.cell)).find(".drilldown").length>0)  //ignore drill down columns...
          return;

        if (options.multiSelect && options.selectOnRowChange) {
          //If ctrl is down add to the
          setSelectedRows([cell.row]);
        }
        else if (options.selectOnRowChange) {
        var empty = [];
        setSelectedRows(empty.concat(cell.row));
        }
      }
    }

    function handleContextMenu(e) {
      var $cell = $(e.target).closest(".slick-cell", $canvas);
      if ($cell.length === 0) { return; }

      // are we editing this cell?
      if (activeCellNode === $cell[0] && currentEditor !== null) { return; }

      trigger(self.onContextMenu, {}, e);
    }

    function handleDblClick(e) {
      var cell = getCellFromEvent(e);
      if (!cell || (currentEditor !== null && activeRow == cell.row && activeCell == cell.cell)) {
        return;
      }

      trigger(self.onDblClick, { row: cell.row, cell: cell.cell }, e);
      if (e.isImmediatePropagationStopped()) {
        return;
      }

      if (options.editable) {
        gotoCell(cell.row, cell.cell, true);
      }
    }

    function handleHeaderContextMenu(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && columns[self.getColumnIndex($header.data("columnId"))];
      trigger(self.onHeaderContextMenu, { column: column, header: $header }, e);
    }

    function handleHeaderClick(e) {
      var $header = $(e.target).closest(".slick-header-column", ".slick-header-columns");
      var column = $header && columns[self.getColumnIndex($header.data("columnId"))];
      if (column) {
        trigger(self.onHeaderClick, { column: column }, e);
      }
    }

    function toggleHover(rowNode, show) {
      if ( (options.frozenColumn > -1) && (rowNode) ) {
        var rowNo = $(rowNode).attr("row"),
          rows = $container.find('.slick-row[row="'+rowNo+'"]');

        if (show)
          rows.addClass("slick-row-hover");
        else
          rows.removeClass("slick-row-hover");
      }
    }

    function handleRowMouseEnter(e) {
      toggleHover(e.currentTarget, true);
    }

    function handleRowMouseLeave(e) {
      toggleHover(e.currentTarget, false);
    }

    function handleMouseEnter(e) {
      trigger(self.onMouseEnter, {}, e);
    }

    function handleMouseLeave(e) {
      trigger(self.onMouseLeave, {}, e);
    }

    function cellExists(row, cell) {
      return !(row < 0 || row >= getDataLength() || cell < 0 || cell >= columns.length);
    }

    function getCellFromPoint(x, y) {
      var row = Math.floor( getRowFromPosition( y + offset ) );
      var cell = 0;

      var w = 0;
      for (var i = 0; i < columns.length && w < x; i++) {
        w += columns[i].width;
        cell++;
      }

      if (cell < 0) {
        cell = 0;
      }

      return { row: row, cell: cell - 1 };
    }

    function getCellFromNode(cellNode) {
      // read column number from .l<columnNumber> CSS class
      var node = cellNode;
      if (!cellNode.className) {
        node = cellNode[0];
      }
      var cls = /l\d+/.exec(node.className);
      if (!cls) {
        throw "getCellFromNode: cannot get cell - " + node.className;
      }
      return parseInt(cls[0].substr(1, cls[0].length - 1), 10);
    }

    function getCellFromEvent(e) {
      var $cell = $(e.target).closest(".slick-cell", $canvas);
      if (!$cell.length)
        return null;

      return {
        row: $cell.parent().attr("row") | 0,
        cell: getCellFromNode($cell[0])
      };
    }

    function getCellNodeBox(row, cell) {
      if (!cellExists(row, cell))
        return null;

      var y1 = rowPositionCache[row].top - offset;
      var y2 = y1 + rowPositionCache[row].height - 1;
      var x1 = 0;
      for (var i = 0; i < cell; i++) {
        x1 += columns[i].width;
      }
      var x2 = x1 + columns[cell].width;

      if (options.frozenColumn > -1 && cell > options.frozenColumn) {
        x1 -= parseInt($paneHeaderR.css("left"));
        x2 -= parseInt($paneHeaderR.css("left"));
      }

      return {
        top: y1,
        left: x1,
        bottom: y2,
        right: x2
      };
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Cell switching

    function resetActiveCell() {
      setActiveCellInternal(null, false);
    }

    function setFocus() {
      //$container.focus();
      if (activeCellNode)
      {
        if (activeCellNode.attr("tabindex") != 0)
        {
          setupCellFocus(activeCellNode);
        }
        activeCellNode.focus();
      }
    }

    function setupCellFocus(cell)
    {
      if (cell)
      {
        cell.attr("tabindex", "0");
        cell.focus();
        cell
          .on("keydown", handleKeyDown)
          .on("dblclick", handleDblClick)
          .on("contextmenu", handleContextMenu);
      }
    }

    function setActiveCellInternal(newCell, editMode, isClick) {

      setupCellFocus(newCell);
      makeHeaderCellNormal();

      if (activeCellNode !== null && rowsCache[activeRow] !== undefined) {
        makeActiveCellNormal();
        if ($(activeCellNode).find(".checkbox").length == 0) {
          $(activeCellNode).removeClass("active");
        } else {
          $(activeCellNode).find(".checkbox").removeClass("is-focused");
        }
        $(rowsCache[activeRow].rowNode).removeClass("active");
      }

      var activeCellChanged = (activeCellNode !== newCell),
        oldActiveRow = activeRow;

      activeCellNode = newCell;

      if (activeCellNode != null) {
        activeRow = parseInt($(activeCellNode).parent().attr("row"));
        activeCell = activePosX = getCellFromNode(activeCellNode);

        if ($(activeCellNode).find(".checkbox").length == 0) {
          $(activeCellNode).addClass("active");
        } else {
          $(activeCellNode).find(".checkbox").addClass("is-focused");
        }
        $(rowsCache[activeRow].rowNode).addClass("active");

        if (options.editable && editMode && isCellPotentiallyEditable(activeRow, activeCell)) {
          clearTimeout(h_editorLoader);

          if (options.asyncEditorLoading) {
            h_editorLoader = setTimeout(function () { makeActiveCellEditable(); }, options.asyncEditorLoadDelay);
          }
          else {
            makeActiveCellEditable(null, isClick);
          }
        }
        else {
          setFocus();
        }
      }
      else {
        activeRow = activeCell = null;
      }

      if (activeCellChanged) {
        trigger(self.onActiveCellChanged, getActiveCell());
      }
      if (oldActiveRow != activeRow) {
        trigger(self.onActiveRowChanged, {previousRow: oldActiveRow, activeRow: activeRow, activeCell: getActiveCell()});
      }
    }

    function isCellPotentiallyEditable(row, cell) {
      // is the data for this row loaded?
      if (row < getDataLength() && !getDataItem(row)) {
        return false;
      }

      // are we in the Add New row? can we create new from this cell?
      if (columns[cell].cannotTriggerInsert && row >= getDataLength()) {
        return false;
      }

      // does this cell have an editor?
      if (!getEditor(row, cell)) {
        return false;
      }

      // Handle expression based Non Editable Cells.
      var $activeCell = $(activeCellNode);
      if ($activeCell.children("div").hasClass("uneditable")) {
        return false;
      }

      if ($activeCell.find("input").attr("disabled")) {
        return false;
      }

      return true;
    }

    function removeCellFocus(cell)
    {
      cell.removeAttr("tabindex")
      cell
        .off("keydown", handleKeyDown)
        .off("click", handleClick)
        .off("dblclick", handleDblClick)
        .off("contextmenu", handleContextMenu)
    }

    function makeActiveCellNormal(keepCurrentFocus) {

      if (activeCellNode && !keepCurrentFocus) {
        removeCellFocus($(activeCellNode));
      }
      if (!currentEditor) { return; }

      if (keepCurrentFocus && currentEditor instanceof LookupCellEditor) {
        return;
      }

      trigger(self.onBeforeCellEditorDestroy, { editor: currentEditor });
      currentEditor.destroy();
      currentEditor = null;

      if (activeCellNode) {

        $(activeCellNode).removeClass("editable");

        var d = getDataItem(activeRow);
        if (d) {
          var column = columns[activeCell],
            formatter = getFormatter(activeRow, column);
          activeCellNode[0].innerHTML = formatter(activeRow, activeCell, getDataItemValueForColumn(d, column.field), column, getDataItem(activeRow), getOptions(), self);
          invalidatePostProcessingResults(activeRow);
        }
      }

      getEditorLock().deactivate(editController);
    }

    function makeActiveCellEditable(editor, isClick) {
      if (!activeCellNode) { return false; }
      if (!options.editable) {
      return false;
      }

      $("#tooltip").stop().fadeOut();

      // cancel pending async call if there is one
      clearTimeout(h_editorLoader);

      if (!isCellPotentiallyEditable(activeRow, activeCell)) {
        return false;
      }

      var columnDef = columns[activeCell],
        item = getDataItem(activeRow),
        $activeCell = $(activeCellNode);

      if (trigger(self.onBeforeEditCell, { row: activeRow, cell: activeCell, item: item, column: columnDef }) === false) {
        setFocus();
        return;
      }

      getEditorLock().activate(editController);
      if ($activeCell.children("div").hasClass("uneditable")) {
        $activeCell.removeClass("editable");
      }
      $activeCell.addClass("editable").removeClass("error");

      // don't clear the cell if a custom editor is passed through
      if (!editor) {
        activeCellNode[0].innerHTML = "";
      }

      currentEditor = new (editor || getEditor(activeRow, activeCell))({
        grid: self,
        gridPosition: absBox($container[0]),
        position: absBox(activeCellNode[0]),
        container: activeCellNode,
        column: columnDef,
        item: item || {},
        commitChanges: commitEditAndSetFocus,
        cancelChanges: cancelEditAndSetFocus,
        row: activeRow,
        cell: activeCell
      });

      if (item) {
        currentEditor.loadValue(item, isClick);
      }

      if (currentEditor) {
        serializedEditorValue = currentEditor.serializeValue();

        if (currentEditor.position) {
          handleActiveCellPositionChange();
        }
      }
      trigger(self.onEnterEditMode);
    }

    function commitEditAndSetFocus() {
      // if the commit fails, it would do so due to a validation error
      // if so, do not steal the focus from the editor
      if (getEditorLock().commitCurrentEdit())
      {

        setFocus();

        if (options.autoEdit) {
          navigateDown();
        }
      }
    }

    function cancelEditAndSetFocus() {
      if (getEditorLock().cancelCurrentEdit()) {
        setFocus();
      }
    }

    function absBox(elem) {
      if (!elem) {
        return {top: -1, left: -1, bottom: 0, right: 0, width: 0, height: 0, visible: false };
      }

      var box = { top: elem.offsetTop, left: elem.offsetLeft, bottom: 0, right: 0, width: $(elem).outerWidth(), height: $(elem).outerHeight(), visible: true };
      box.bottom = box.top + box.height;
      box.right = box.left + box.width;

      // walk up the tree
      var offsetParent = elem.offsetParent;
      while ((elem = elem.parentNode) != document.body && elem != undefined) {
        if (box.visible && elem.scrollHeight != elem.offsetHeight && $(elem).css("overflowY") != "visible")
          box.visible = box.bottom > elem.scrollTop && box.top < elem.scrollTop + elem.clientHeight;

        if (box.visible && elem.scrollWidth != elem.offsetWidth && $(elem).css("overflowX") != "visible")
          box.visible = box.right > elem.scrollLeft && box.left < elem.scrollLeft + elem.clientWidth;

        box.left -= elem.scrollLeft;
        box.top -= elem.scrollTop;

        if (elem === offsetParent) {
          box.left += elem.offsetLeft;
          box.top += elem.offsetTop;
          offsetParent = elem.offsetParent;
        }

        box.bottom = box.top + box.height;
        box.right = box.left + box.width;
      }

      return box;
    }

    function getActiveCellPosition() {
      return absBox(activeCellNode);
    }

    function getGridPosition() {
      return absBox($container[0])
    }

    function handleActiveCellPositionChange() {
      if (!activeCellNode) return;
      var cellBox;

      trigger(self.onActiveCellPositionChanged, {});

      if (currentEditor) {
        cellBox = cellBox || getActiveCellPosition();
        if (currentEditor.show && currentEditor.hide) {
          if (!cellBox.visible)
            currentEditor.hide();
          else
            currentEditor.show();
        }

        if (currentEditor.position)
          currentEditor.position(cellBox);
      }
    }

    function getCellEditor() {
      return currentEditor;
    }

    function getActiveCell() {
      if (!activeCellNode)
        return null;
      else
        return { row: activeRow, cell: activeCell };
    }

    function getActiveCellNode() {
      return activeCellNode;
    }

    function scrollCellIntoView(row, cell, doPaging) {
      // Don't scroll to frozen cells
      if ( cell <= options.frozenColumn ) {
        return;
      }

      if ( row < actualFrozenRow ) {
        scrollRowIntoView(row, doPaging);
      }

      var colspan = getColspan(row, cell);
      var left = columnPosLeft[cell],
        right = columnPosRight[cell + (colspan > 1 ? colspan - 1 : 0)],
        scrollRight = scrollLeft + $viewportScrollContainerX.width();

      if (left < scrollLeft) {
        $viewportScrollContainerX.scrollLeft(left);
        handleScroll();
        render();
      } else if (right > scrollRight) {
        $viewportScrollContainerX.scrollLeft(Math.min(left, right - $viewportScrollContainerX[0].clientWidth));
        handleScroll();
        render();
      }
    }

    function scrollRowIntoView(row, doPaging) {
      if (!rowPositionCache[row]) {
        return;
      }
      var rowAtTop = rowPositionCache[row].top,
        rowAtBottom = rowPositionCache[row].bottom - viewportH + (viewportHasHScroll ? scrollbarDimensions.height : 0);

      // need to page down?
      if (rowPositionCache[row].bottom > scrollTop + viewportH + offset) {
        scrollTo(doPaging ? rowAtTop : rowAtBottom);
        render();
      }
      // or page up?
      else if (rowPositionCache[row].top < scrollTop + offset) {
        scrollTo(doPaging ? rowAtBottom : rowAtTop);
        render();
      }
    }

    function scrollRowToTop(row) {
    scrollTo( rowPositionCache[row].top );
    render();
    }

    function getColspan(row, cell) {
      var metadata = data.getItemMetadata && data.getItemMetadata(row);
      if (!metadata || !metadata.columns) {
        return 1;
      }

      var columnData = metadata.columns[columns[cell].id] || metadata.columns[cell];
      var colspan = (columnData && columnData.colspan);
      if (colspan === "*") {
        colspan = columns.length - cell;
      } else {
        colspan = colspan || 1;
      }
      return (colspan || 1);
    }

    function findFirstFocusableCell(row) {
      var cell = 0;
      while (cell < columns.length) {
        if (canCellBeActive(row, cell)) {
          return cell;
        }
        cell += getColspan(row, cell);
      }
      return null;
    }

    function findLastFocusableCell(row) {
      var cell = 0;
      var lastFocusableCell = null;
      while (cell < columns.length) {
        if (canCellBeActive(row, cell)) {
          lastFocusableCell = cell;
        }
        cell += getColspan(row, cell);
      }
      return lastFocusableCell;
    }

    function gotoRight(row, cell, posX) {
      if (cell >= columns.length) {
        return null;
      }

      do {
        cell += getColspan(row, cell);
      }
      while (cell < columns.length && !canCellBeActive(row, cell));

      if (cell < columns.length) {
        return {
          "row": row,
          "cell": cell,
          "posX": cell
        };
      }
      return null;
    }

    function gotoLeft(row, cell, posX) {
      if (cell <= 0) {
        return null;
      }

      var firstFocusableCell = findFirstFocusableCell(row);
      if (firstFocusableCell === null || firstFocusableCell >= cell) {
        return null;
      }

      var prev = {
        "row": row,
        "cell": firstFocusableCell,
        "posX": firstFocusableCell
      };
      var pos;
      while (true) {
        pos = gotoRight(prev.row, prev.cell, prev.posX);
        if (!pos) {
          return null;
        }
        if (pos.cell >= cell) {
          return prev;
        }
        prev = pos;
      }
    }

    function gotoDown(row, cell, posX) {
      var prevCell;
      while (true) {
        if (++row >= getDataLength() + (options.enableAddRow ? 1 : 0)) {
          return null;
        }

        prevCell = cell = 0;
        while (cell <= posX) {
          prevCell = cell;
          cell += getColspan(row, cell);
        }

        if (canCellBeActive(row, prevCell)) {
          return {
            "row": row,
            "cell": prevCell,
            "posX": posX
          };
        }
      }
    }

    function gotoUp(row, cell, posX) {
      var prevCell;
      while (true) {
        if (--row < 0) {
          return null;
        }

        prevCell = cell = 0;
        while (cell <= posX) {
          prevCell = cell;
          cell += getColspan(row, cell);
        }

        if (canCellBeActive(row, prevCell)) {
          return {
            "row": row,
            "cell": prevCell,
            "posX": posX
          };
        }
      }
    }

    function gotoNext(row, cell, posX) {
      var pos = gotoRight(row, cell, posX);
      if (pos) {
        return pos;
      }

      var firstFocusableCell = null;
      while (++row < getDataLength() + (options.enableAddRow ? 1 : 0)) {
        firstFocusableCell = findFirstFocusableCell(row);
        if (firstFocusableCell !== null) {
          return {
            "row": row,
            "cell": firstFocusableCell,
            "posX": firstFocusableCell
          };
        }
      }
      return null;
    }

    function gotoPrev(row, cell, posX) {
      var pos;
      var lastSelectableCell;
      while (!pos) {
        pos = gotoLeft(row, cell, posX);
        if (pos) {
          break;
        }
        if (--row < 0) {
          return null;
        }

        cell = 0;
        lastSelectableCell = findLastFocusableCell(row);
        if (lastSelectableCell !== null) {
          pos = {
            "row": row,
            "cell": lastSelectableCell,
            "posX": lastSelectableCell
          };
        }
      }
      return pos;
    }

    function navigateRight() {
      navigate("right");
    }

    function navigateLeft() {
      navigate("left");
    }

    function navigateDown() {
      navigate("down");
    }

    function navigateUp() {
      navigate("up");
    }

    function navigateNext() {
      navigate("next");
    }

    function navigatePrev() {
      navigate("prev");
    }

    function navigatePageDown() {
    var range = getVisibleRange();
    scrollRowIntoView(range.top + (range.bottom-range.top), true);
    }

    function navigatePageUp() {
    var range = getVisibleRange();
    scrollRowIntoView(range.top - (range.bottom-range.top), true);
    }

    function moveDown() {
      var selectedRows = getSelectedRows();

      var rowId = 0;
      if(selectedRows[0]!=undefined)
        rowId=selectedRows[0]+1;

      if (rowId>getDataLength()-1)
        return;

      scrollRowIntoView(rowId, true);
      setSelectedRows([rowId]);
    }

    function moveUp() {
      var selectedRows = getSelectedRows();

      var rowId = 0;
      if(selectedRows[0]!=undefined)
        rowId=selectedRows[0]-1;

      if (rowId<0)
        return;

      scrollRowIntoView(rowId, true);
      setSelectedRows([rowId]);
    }

    function navigate(dir) {

      if (!activeCellNode || !options.enableCellNavigation) { return; }
      if (!getEditorLock().commitCurrentEdit()) { return; }

      setFocus();

      var tabbingDirections = {
          "up": -1,
          "down": 1,
          "left": -1,
          "right": 1,
          "prev": -1,
          "next": 1
        };

      tabbingDirection = tabbingDirections[dir]

      var stepFunctions = {
        "up": gotoUp,
        "down": gotoDown,
        "left": gotoLeft,
        "right": gotoRight,
        "prev": gotoPrev,
        "next": gotoNext
      };

      var stepFn = stepFunctions[dir];
      var pos = stepFn(activeRow, activeCell, activePosX);
      if (pos) {
        if ( hasFrozenRows && options.frozenBottom & pos.row == getDataLength() ) {
          return;
        }

        var isAddNewRow = (pos.row == getDataLength());

        if ( ( !options.frozenBottom && pos.row >= actualFrozenRow )
          || ( options.frozenBottom && pos.row < actualFrozenRow )
        ) {
          scrollCellIntoView(pos.row, pos.cell, !isAddNewRow);

        }

        scrollRowIntoView(pos.row, false);
        setActiveCellInternal(getCellNode(pos.row, pos.cell), isAddNewRow || options.autoEdit);
        activePosX = pos.posX;
        return true;
      }
      else if (activeRow == 0 && dir == "up")
      {
        gotoHeader();
        return false;
      }
      else
      {
        setActiveCellInternal(getCellNode(activeRow, activeCell), (activeRow == getDataLength()) || options.autoEdit);
        return false;
      }
    }

    function navigateHeader(dir)
    {
      var newCell;
      var columns = getColumns();
      var stepFunctions = {
        "left": function ()
        {
          var newCell;
          var prev = activeHeader -1;
          while (prev >= 0)
          {
            if (columns[prev].sortable)
            {
              newCell = $("#" + uid + columns[prev].id);
              break;
            }
            prev--;
          }
          return {cell: newCell, index:prev};
        },
        "right": function ()
        {
          var newCell;
          var next = activeHeader + 1;
          while (next < columns.length)
          {
            if (columns[next].sortable)
            {
              newCell = $("#" + uid + columns[next].id);
              break;
            }
            next++;
          }
          return {cell: newCell, index:next};
        },
        "down": function ()
        {
          var cell;
          var column = columns[activeHeader];
          if (options.showFilter && column.filterType)
          {
            var header = $("#" + uid + "_headercell" + activeHeader);
            cell = header.find("input");
            return {cell: cell, index:activeHeader};
          }
          else
          {
            makeHeaderCellNormal();
            setActiveCell(0, activeHeader, options.autoEdit);
            return null;
          }
        }
      };

      var stepFn = stepFunctions[dir];
      var item = stepFn();
      if (item && item.cell)
      {
        makeHeaderActive(item.cell, item.index);

      }
    }

    function getPrevNextFocusableFilterColumn(direction)
    {
      var activePosX = getCellFromNode(activeHeaderCell.parent());
      var columns = getColumns();
      var index = activePosX + direction;

      while ((direction == -1 && index >= 0) || ( index < columns.length))
      {
        if (columns[index].filterType)
        {
          break;
        }
        index += direction;
      }
      return index;
    }

    function navigateFilter(dir)
    {
      var newCell;
      var columns = getColumns();
      var children = activeHeaderCell.parent().children(':visible:not(label)');
      var nodeIndex = children.index(activeHeaderCell);

      var stepFunctions = {
        "up": function ()
        {
          var cell;
          var column = columns[activeHeader];
          if (column.sortable)
          {
            cell = $("#" + uid + column.id);
          }
          return {cell: cell, index:activeHeader};
        },
        "left": function ()
        {
          var index = activeHeader;
          if (nodeIndex <= 0)
          {
            var prev = getPrevNextFocusableFilterColumn(-1);
            if (prev >= 0)
            {
              newCell = $("#" + uid + "_headercell" + prev);
              children = newCell.children(':visible');
              nodeIndex = children.length;
              index = prev;
            }
          }

          newCell = $(children[nodeIndex -1]);

          return {cell: newCell, index:index};
        },
        "right": function ()
        {
          var index = activeHeader;
          if (nodeIndex >= children.length - 1)
          {
            var next = getPrevNextFocusableFilterColumn(1);
            if (next < columns.length)
            {
              newCell = $("#" + uid + "_headercell" + next);
              children = newCell.children(':visible');
              nodeIndex = -1;
              index = next;
            } else {
              //Go To first cell
              makeHeaderCellNormal();
              setActiveCell(0, (options.showStatusIndicators ? 1 :0), options.autoEdit);
              return null;
            }
          }

          newCell = $(children[nodeIndex + 1]);

          return {cell: newCell, index:index};
        },
        "down": function ()
        {
          makeHeaderCellNormal();
          setActiveCell(0, activeHeader, options.autoEdit);
          return null;
        }
      };

      var stepFn = stepFunctions[dir];
      var item = stepFn();
      if (item && item.cell)
      {
        makeHeaderActive(item.cell, item.index);

      }
    }
    function handleHeaderKeyDown(e)
    {

      var isInHeader = activeHeaderCell.closest(".slick-headerrow-column").length > 0;
      var navFunc = isInHeader ? navigateFilter : navigateHeader;

      if (e.which == 37) {
        navFunc("left");
      }
      else if (e.which == 39) {
        navFunc("right");
      }
      else if (e.which == 40 && isInHeader) {
        navFunc("down");
      }
      else if (e.which == 38 && isInHeader) {
        navFunc("up");
      }
      else if (e.which == 32 && !isInHeader)
      {
        activeHeaderCell.click();
      }
      else
        return;


      // the event has been handled so don't let parent element (bubbling/propagation) or browser (default) handle it
      e.stopPropagation();
      e.preventDefault();
      try {
        e.originalEvent.keyCode = 0; // prevent default behaviour for special keys in IE browsers (F3, F5, etc.)
      }
      catch (error) { } // ignore exceptions - setting the original event's keycode throws access denied exception for "Ctrl" (hitting control key only, nothing else), "Shift" (maybe others)
    }

    function makeHeaderActive(node, columnIndex)
    {
      makeHeaderCellNormal();
      activeHeaderCell = node;
      activeHeaderCell.addClass("active");
      activeHeaderCell.attr("tabindex", 0);

      activeHeaderCell.on("keydown", handleHeaderKeyDown);

      activeHeaderCell.focus();
      activeHeader = columnIndex;

      if (activeCellNode)
      {
        $(activeCellNode).attr("tabindex", "-1");
        $(activeCellNode).removeClass("active");
        activeCellNode = null;
      }

    }

    function makeHeaderCellNormal()
    {
      if (activeHeaderCell)
      {
        activeHeaderCell.off("keydown", handleHeaderKeyDown);
        activeHeaderCell.attr("tabindex", "-1");
        activeHeaderCell.removeClass("active");
      }
    }
    function gotoHeader()
    {
      var column = getColumns()[activeCell];
      var cell;
      if (options.showFilter && column.filterType)
      {
        var header = $("#" + uid + "_headercell" + activeCell);
        cell = header.find("input");

      }
      else if (column.sortable)
      {
        cell = $("#" + uid + column.id);
      }

      if (cell)
      {
        makeHeaderActive(cell, activeCell);
      }

    }
    function getCellNode(row, cell) {
      if (rowsCache[row]) {
        ensureCellNodesInRowsCache(row);
        return rowsCache[row].cellNodesByColumnIdx[cell];
      }
      return null;
    }

    function setActiveCell(row, cell, enterEditMode) {
      if (!initialized) { return; }

      if (row > getDataLength() || row < 0 || cell >= columns.length || cell < 0) {
        return;
      }

      if (!options.enableCellNavigation) {
        return;
      }

      scrollRowIntoView(row, false);
      setActiveCellInternal(getCellNode(row, cell), enterEditMode);
    }

    function canCellBeActive(row, cell) {
      if (!options.enableCellNavigation || row >= getDataLength() + (options.enableAddRow ? 1 : 0) || row < 0 || cell >= columns.length || cell < 0) {
        return false;
      }

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
      if (rowMetadata && typeof rowMetadata.focusable === "boolean") {
        return rowMetadata.focusable;
      }

      var columnMetadata = rowMetadata && rowMetadata.columns;
      if (columnMetadata && columnMetadata[columns[cell].id] && typeof columnMetadata[columns[cell].id].focusable === "boolean") {
        return columnMetadata[columns[cell].id].focusable;
      }
      if (columnMetadata && columnMetadata[cell] && typeof columnMetadata[cell].focusable === "boolean") {
        return columnMetadata[cell].focusable;
      }

      return columns[cell].focusable;
    }

    function canRowBeSelected(row) {
      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
      if (rowMetadata && typeof rowMetadata.selectable === "boolean")
        return rowMetadata.selectable;

      return true;
    }

    function canCellBeSelected(row, cell) {
      if (row >= getDataLength() || row < 0 || cell >= columns.length || cell < 0) {
        return false;
      }

      var rowMetadata = data.getItemMetadata && data.getItemMetadata(row);
      if (rowMetadata && typeof rowMetadata.selectable === "boolean") {
        return rowMetadata.selectable;
      }

      var columnMetadata = rowMetadata && rowMetadata.columns && (rowMetadata.columns[columns[cell].id] || rowMetadata.columns[cell]);
      if (columnMetadata && typeof columnMetadata.selectable === "boolean") {
        return columnMetadata.selectable;
      }

      return columns[cell].selectable;
    }


    function gotoCell(row, cell, forceEdit) {
      if (!initialized) { return; }
      if (!canCellBeActive(row, cell)) {
        return;
      }

      if (!getEditorLock().commitCurrentEdit()) { return; }

      scrollRowIntoView(row, false);

      var newCell = getCellNode(row, cell);

      // if selecting the 'add new' row, start editing right away
      setActiveCellInternal(newCell, forceEdit || (row === getDataLength()) || options.autoEdit);

      // if no editor was created, set the focus back on the grid
      if (!currentEditor) {
        setFocus();
      }
    }


    //////////////////////////////////////////////////////////////////////////////////////////////
    // IEditor implementation for the editor lock

    function commitCurrentEdit() {
      var item = getDataItem(activeRow),
      column, previousValue;

      if (currentEditor) {
          if (activeCell) {
            column = columns[activeCell],
            previousValue = (item ? item[column.field] : undefined);
            if (currentEditor.previousValue) {
              previousValue = currentEditor.previousValue;  //select editor has auto commit;
            }
          }
          executeValidator(currentEditor, item, column, activeRow, activeCell);
          if (currentEditor.isValueChanged()) {
            var cellValue = (currentEditor.getValuePairs ? currentEditor.getValuePairs() : currentEditor.serializeValue());
            if (activeRow < getDataLength()) {
              var editCommand = {
                row: activeRow,
                cell: activeCell,
                editor: currentEditor,
                serializedValue: currentEditor.serializeValue(),
                prevSerializedValue: serializedEditorValue,
                execute: function () {
                  this.editor.applyValue(item, this.serializedValue);
                  updateRow(this.row);
                },
                undo: function () {
                  this.editor.applyValue(item, this.prevSerializedValue);
                  updateRow(this.row);
                }
              };

              if (options.editCommandHandler) {
                makeActiveCellNormal(true);
                options.editCommandHandler(item, column, editCommand);
              }
              else {
                editCommand.execute();
                if ($(activeCellNode).hasClass("error")) {
                  $("#tooltip").stop().hide();
                }
                makeActiveCellNormal(true);
              }

              var stayInEditMode = (currentEditor && currentEditor.stayInEditMode ? currentEditor.stayInEditMode() : false);
              if (!stayInEditMode)
              {
                trigger(self.onCellChange, {
                  row: activeRow,
                  cell: activeCell,
                  item: item,
                  cellValue : cellValue,
                  previousCellValue: previousValue
                });
              }
            }
            else {
              var newItem = {};
              currentEditor.applyValue(newItem, currentEditor.serializeValue());
              makeActiveCellNormal(true);
              trigger(self.onAddNewRow, { item: newItem, column: column });
            }

            // check whether the lock has been re-acquired by event handlers
            return stayInEditMode ? getEditorLock().isActive() : !getEditorLock().isActive();
          }
          makeActiveCellNormal(true);
          trigger(self.onExitEditMode);
      }
      return true;
    }

    function conditionalAutoCommit() {
      setTimeout(function() {
        var focus = $("*:focus"),
          classes = (focus == undefined ? "" : focus.attr("class"));

        if (classes==undefined)
          classes="";

        if (focus.parent().hasClass("slick-cell"))
          return;

        if ($("#inforDatePicker-div").is(":visible"))
          return;

        if ($("#lookupGridDivId").is(":visible"))
          return;

        if (classes!=undefined  && classes.indexOf("inforDate") != -1 && focus.closest(".slick-headerrow-column").length!=1)
          return;

        //select cell logic
        if (focus.closest(".slick-cell").length==1)
          return;

        if (classes.indexOf("dropdown") != -1)
          return;

        if (classes.indexOf("ui-state-hover") != -1)
          return;

        if (classes.indexOf("inforTempInput") != -1)
          return;

        if (classes.indexOf("grid-canvas") != -1)
          return;

        if ($(".inforMenu:visible").length>0)
          return;

        //lookup fly out logic
        if (classes.indexOf("inforTriggerButton") != -1)
          return;

        if (classes.indexOf("grid-canvas") != -1)
          return;

        if (classes.indexOf("inforTempInput") != -1)
          return;

        if (classes.indexOf("inforLookupField") != -1)
          return;

        if (focus.closest(".inforGridCommentPopup").length==1)
          return;

        commitCurrentEdit();
      },150);
    }

    function cancelCurrentEdit() {
      makeActiveCellNormal(true);
      return true;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = columns.length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getSelectedRows() {
      return selectedRows;
    }

    function getPersistedRowIds() {
      return selectionModel.getPersistedIds();
    }

    function setPersistedRowIds(ids) {
      selectionModel.setPersistedIds(ids);
    }

    function getPersistedDataItems() {
      var dataItems = [],
          persistedIds = getPersistedRowIds();

      for (var i = 0; i < persistedIds.length; i++) {
        dataItems.push(dataView.getItemById(persistedIds[i]));
      }

      return dataItems;
    }

    function clearPersistedSelections() {
      setSelectedRows([]);
      selectionModel.clearPersistedIds();
      updateFooterSelectionCounter();
      invalidateAllRows();
      render();
    }

    function setSelectedRows(rows, active) {
      selectionModel.setSelectedRanges(rowsToRanges(rows), active);
      updateFooterSelectionCounter();
    }

    function uncheckPersistedRow(row) {
      selectionModel.uncheckPersistedRow(row);
    }

    function selectAllRows() {
      var rows = [],
        len = getDataLength();

      for (var i = 0; i < len; i++) {
        rows.push(i);
      }
      setSelectedRows(rows);
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Filtering
    /* Update the Header For Filtering. */
    function updateFilterRow() {
      if (!options.showHeaderRow)
        return;

      for (var i = 0; i < columns.length; i++) {

        //ignore these columns:
        if ($.inArray(columns[i].id, ['selector', 'indicator-icon', 'checkbox-selector', 'drilldown'])>= 0) {
          //do something
          continue;
        }

        if (columns[i].filterType==undefined)
          continue;

        var filterType = columns[i].filterType();

        switch(filterType)
        {
        case "TextFilter":
          addTextFilterColumn(self,columns[i]);
          break;
        case "DateFilter":
          addDateFilterColumn(self,columns[i]);
          break;
        case "SelectFilter":
          addSelectFilterColumn(self,columns[i]);
          break;
        case "LookupFilter":
          addLookupFilterColumn(self,columns[i]);
          break;
        case "IntegerFilter":
          addIntegerFilterColumn(self,columns[i],false);
          break;
        case "DecimalFilter":
          addIntegerFilterColumn(self,columns[i],true);
          break;
        case "PercentFilter":
          addIntegerFilterColumn(self,columns[i],true);
          break;
        case "CheckboxFilter":
          addCheckboxFilterColumn(self,columns[i]);
          break;
        case "ColumnContentsFilter":
          addColumnContentsFilterColumn(self,columns[i]);
          break;
        default:
        continue;
        }
      }
    }

    /*Append/move the filter button on the page*/
    function showFilterButton(visible) {
      if (options.showFilterButton === false) {
        return;
      }

      if ($filterMenuButton== undefined) {

        $filterMenuButton = $("<button tabindex='-1' type='button' class='inforFilterMenuButton' title='"+Globalize.localize("FilterMenu")+"'><span></span></button>");
        if (Globalize.culture().isRTL)
          $filterMenuButton.addClass("inforRTLFlip");

        $container.prepend($filterMenuButton);
        appendFilterMenu();

        var leftOffset = -20;

        if (Globalize.culture().isRTL)
          leftOffset = 5;

        $filterMenuButton.popupmenu({menu: filterMenuId})
          .on('beforeOpen', function() {
            setMenuChecked();
          })
          .on('selected', function (e, anchor) {
            var action = anchor.attr('href').substr(1);

            if (action=="rf")
              applyFilter();

            if (action=="fwr")
              toggleFilterResults();

            if (action=="cf")
              clearFilter();
          });
      }

      //might be hidden if user selected the menu option...
      if ($filterMenuButton) {
        $filterMenuButton.css("visibility", (visible ? "visible": "hidden"));
      }
    }

    function toggleFilterResults() {
      filterInResults = !filterInResults;
      personalizationInfo.filterInResults = filterInResults;
      trigger(self.onPersonalizationChanged, getGridPersonalizationInfo('FilterInResults'));
    }

    function getFilter() {
      return columnFilters;
    }

    function applyFilter(initialColumnFilters, setFilterValuesOnly) {
      var isSupplied = false;

      if (isFiltering)
        return;

      columnFilters = {};

      if (initialColumnFilters!=undefined) {
        columnFilters=initialColumnFilters;
        isSupplied = true;
      }

      if (isSupplied) {
        //set all the filter text
        for (columnId in columnFilters) {
          var $header = $(getHeaderRowColumn(columnId)),
            filterExpr = columnFilters[columnId],
            $filterButton = $header.find(".inforFilterButton")

          if(filterExpr.filterType === "PercentFilter")
          {
            filterExpr.value = (filterExpr.value * 100);
          }

          $header.find("input").val(filterExpr.value);
          $filterButton.attr("class","inforFilterButton").addClass(filterExpr.operator);

          if (filterExpr.filterType=="ColumnContentsFilter") {
            $filterButton.data("selections",filterExpr.value);
          }
        }
      }
      isFiltering = true;

      //loop through all the filter rows and update all filter values..
      for (var i = 0; i < columns.length; i++) {
        if (columns[i].filterType==undefined)
          continue;

        var columnId = columns[i].id;
        var $headerCol = $(getHeaderRowColumn(columnId));
        var filterType = columns[i].filterType();

        if ($headerCol.length==0) {
          continue;
        }

        if ($headerCol.find(".inforFilterButton").attr("class") == undefined) {
          continue;
        }

        var op = $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ","");
        var value = $headerCol.find("input").val();

        if (filterType === "LookupFilter")
          filterType = $headerCol.find(".inforLookupField").data("filterType");

        switch(filterType) {
          case "TextFilter":
            if (value !== "" || op=="isEmpty" || op=="isNotEmpty") {
              var newObj = {value: value,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: TextFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "DateFilter":
            if (value!="" || op=="isEmpty" || op=="isNotEmpty") {
              var newObj = {value: value,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: DateFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "SelectFilter":
            var select = $headerCol.find("select");
            value = select.val();
            if ($.trim(value)!="" || op=="isEmpty" || op=="isNotEmpty") {

              var newObj = {value: (select.data("useCodes") ? select.getCode() : select.getValue()) ,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: SelectFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "IntegerFilter":
            if (value!="" || op=="isEmpty" || op=="isNotEmpty") {
              var newObj = {value: value,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: IntegerFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "DecimalFilter":
            if (value!="" || op=="isEmpty" || op=="isNotEmpty") {
              var newObj = {value: value,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: DecimalFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "PercentFilter":
            if (value!="" || op=="isEmpty" || op=="isNotEmpty") {
              value = value / 100;
              var newObj = {value: value,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: PercentFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "CheckboxFilter":
            if (op!="eitherSelectedorNotSelected") {
              var newObj = {value: null,
                    operator: op,
                    filterType: CheckboxFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "LookupFilter":
            if (value !== "" || op=="isEmpty" || op=="isNotEmpty") {
              var newObj = {value: value,
                    operator: $headerCol.find(".inforFilterButton").attr("class").replace("inforFilterButton ",""),
                    filterType: TextFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          case "ColumnContentsFilter":
            var selections = $headerCol.find(".inforFilterButton").data("selections");

            if (selections!=undefined) {
              var newObj = {value: selections,
                    operator: op,
                    filterType: ColumnContentsFilter()};
              columnFilters[columnId] = newObj;
            }
            break;
          default:
        }
      }

      if (setFilterValuesOnly) {
          dataView.setPagingOptions({filters: columnFilters, sortColumns: personalizationInfo.sortColumns});
      } else {
         dataView.setPagingOptions({filters: columnFilters, isFirstPage: true, sortColumns: personalizationInfo.sortColumns});
         if (!filterInResults) {
          dataView.requestNewPage("filter");
        }
        //scroll to top
        scrollRowIntoView(0, false);
        //only blank out selections if we're not persisting them
        if (!getOptions().persistSelections) {
          setSelectedRows([]);
        }
      }

      isFiltering = false;
    }

    function clearFilter() {
      getEditorLock().commitCurrentEdit();

      //clear text filters..
      $headerRow.find("input").val("");

      //clear the checkbox and othe rtypes of filters
      $headerRow.find(".inforFilterButton").each(function(){
        var $this = $(this);
        $this.removeClass();
        if ($this.data("filterType")==CheckboxFilter())
          $this.addClass('inforFilterButton eitherSelectedorNotSelected');

        if ($this.data("filterType")==TextFilter())
          $this.addClass('inforFilterButton contains');

        if ($this.data("filterType")==SelectFilter()) {
          $this.addClass('inforFilterButton equals');
          $this.next().val("").trigger("updated");
        }

        if ($this.data("filterType")==DateFilter())
          $this.addClass('inforFilterButton equals');

        if ($this.data("filterType")==IntegerFilter())
          $this.addClass('inforFilterButton equals');

        if ($this.data("filterType")==DecimalFilter())
          $this.addClass('inforFilterButton equals');

        if ($this.data("filterType")==PercentFilter())
          $this.addClass('inforFilterButton equals');

        if ($this.data("filterType")==ColumnContentsFilter())
        {
          $this.addClass('inforFilterButton contains');
          $this.data("selections",null);
        }

        if ($this.data("filterType")==LookupFilter())
            $this.addClass('inforFilterButton equals');
      });

      //clear the filter operators
      columnFilters = {};
      dataView.refresh();

      if (pageInfo) {
        pageInfo.filters = {};
      }
      if (!filterInResults) {
        var pageInfo = dataView.getPagingInfo();
        dataView.requestNewPage("clearFilter");
      }

      dataView.setPagingOptions(pageInfo);
      updateFilterRow();
    }

    var currentButton = "";
    var gridTextFilters = {
        equals: "EqualsStr",
        doesNotEqual: "DoesNotEqual",
        contains: "Contains",
        doesNotContain: "DoesNotContain",
        isEmpty: "IsEmpty",
        isNotEmpty: "IsNotEmpty",
        startsWith: "StartsWith",
        doesNotStartWith: "DoesNotStartWith",
        endsWith: "EndsWith",
        doesNotEndWith: "DoesNotEndWith"
    };

    /*Return a filter button with events for the filter based on column type*/
    function getFilterButton(columnId, filterType, initialValue, initialToolTip) {
        var button = $("<button type='button' tabindex='-1' class='inforFilterButton " + initialValue + "'><span></span><span class='scr-only'>Filter Type</span></button>");
        button.data("columnId", columnId);
        button.data("filterType", filterType);
        button.data("isOpen", false);
        //set the initial tooltip
        button.attr("title", Globalize.localize(initialToolTip)).tooltip();
        button.off('click.filter').on('click.filter', function(e) {
            var $button = $(this),
                currentMenu = $('#inforFilterConditions');

            if (currentMenu.length > 0) {
                if (currentMenu.is(":visible")) {
				  $('#inforFilterConditions').parent('.popupmenu-wrapper').remove();
				  $('#inforFilterConditions').remove();
				}
                $(document).off('click.popupmenu');
                if ($button.data('popupmenu')) {
                    $button.data('popupmenu').destroy();
                }
            }
            currentButton = button.data("columnId");
            //different menus for each filter option
            var filterType = $(this).data("filterType");
            var $textFilterData = $('<ul id="inforFilterConditions" class="popupmenu divider">');

            $.each(gridTextFilters, function (key, value) {
                $textFilterData.append($('<li><span class="icon ' + key + '"></span><a href="#' + key + '">' + value + '</a></li>'));
            });

            //different menus for each filter option
            var filterType = $(this).data("filterType");

            if (filterType == "TextFilter")
                $('body').append($textFilterData);
            if (filterType == "SelectFilter")
                $('body').append('<ul id="inforFilterConditions" class="popupmenu divider"><li><span class="icon equals"></span><a href="#equals">EqualsStr</a></li><li><span class="icon doesNotEqual"></span><a href="#doesNotEqual">DoesNotEqual</a></li><li><span class="icon isEmpty"></span><a href="#isEmpty">IsEmpty</a></li><li><span class="icon isNotEmpty"></span><a href="#isNotEmpty">IsNotEmpty</a></li></ul>');
            if (filterType == "CheckboxFilter")
                $('body').append('<ul id="inforFilterConditions" class="popupmenu divider"><li><span class="icon eitherSelectedorNotSelected"></span><a href="#eitherSelectedorNotSelected">EitherSelectedorNotSelected</a></li><li><span class="icon checked"></span><a href="#selected">Selected</a></li><li><span class="icon notChecked"></span><a href="#notSelected">NotSelected</a></li></ul>');
            if (filterType == "DateFilter")
                $('body').append('<ul id="inforFilterConditions" class="popupmenu divider"><li><span class="icon today"></span><a href="#today">Today</a></li><li><span class="icon equals"></span><a href="#equals">EqualsStr</a></li><li><span class="icon doesNotEqual"></span><a href="#doesNotEqual">DoesNotEqual</a></li><li><span class="icon isEmpty"></span><a href="#isEmpty">IsEmpty</a></li><li><span class="icon isNotEmpty"></span><a href="#isNotEmpty">IsNotEmpty</a></li><li><span class="icon lessThan"></span><a href="#lessThan">LessThan</a></li><li><span class="icon lessThanOrEquals"></span><a href="#lessThanOrEquals">LessThanOrEquals</a></li><li><span class="icon greaterThan"></span><a href="#greaterThan">Greater Than</a></li><li><span class="icon greaterThanOrEquals"></span><a href="#greaterThanOrEquals">GreaterThanOrEquals</a></li></ul>');
            if (filterType == "IntegerFilter" || filterType == "DecimalFilter" || filterType == "PercentFilter")
                $('body').append('<ul id="inforFilterConditions" class="popupmenu divider"><li><span class="icon equals"></span><a href="#equals">EqualsStr</a></li><li><span class="icon doesNotEqual"></span><a href="#doesNotEqual">DoesNotEqual</a></li><li><span class="icon isEmpty"></span><a href="#isEmpty">IsEmpty</a></li><li><span class="icon isNotEmpty"></span><a href="#isNotEmpty">IsNotEmpty</a></li><li><span class="icon lessThan"></span><a href="#lessThan">LessThan</a></li><li><span class="icon lessThanOrEquals"></span><a href="#lessThanOrEquals">LessThanOrEquals</a></li><li><span class="icon greaterThan"></span><a href="#greaterThan">Greater Than</a></li><li><span class="icon greaterThanOrEquals"></span><a href="#greaterThanOrEquals">GreaterThanOrEquals</a></li></ul>');
            if (filterType == "LookupFilter")
                $('body').append('<ul id="inforFilterConditions" class="popupmenu divider"><li><span class="icon equals"></span><a href="#equals">Equals</a></li><li><span class="icon doesNotEqual"></span><a href="#doesNotEqual">Does Not equal</a></li><li><span class="icon isEmpty"></span><a href="#isEmpty">Is Empty</a></li><li><span class="icon isNotEmpty"></span><a href="#isNotEmpty">Is Not Empty</a></li></ul>');

            var col = columns[getColumnIndex(columnId)];
            if (col.filterExcludeList) {
                $("#inforFilterConditions").find(col.filterExcludeList).parent().remove();
            }

            if (filterType == "ColumnContentsFilter") {
                var isEmpty = addContentsFilterMenu(col, button);
                if (isEmpty)
                    return;
            }

			if (filterType !== "ColumnContentsFilter") {
				$('#inforFilterConditions').find('a[href]').each(function () {
					$(this).text(Globalize.localize($(this).text()));
				});
			}

            $button.popupmenu({
                menu: 'inforFilterConditions',
                trigger: 'immediate'
            }).on('selected', function (a, anchor) {
                var el = $(this),
                    action = anchor.attr('href').substr(1);

                if (el.data("filterType") == "ColumnContentsFilter")
                    return;

                var isChanged = !el.hasClass(action);

                //toggle the button icon..
                el.removeClass();
                el.addClass('inforFilterButton ' + action);

                //set the tooltip
                if (el && el.data('tooltip')) {
                    el.data('tooltip').content = anchor.text();
                }

                //apply filter...
                if (el.data("filterType") == "CheckboxFilter" && isChanged)
                    applyFilter();
                if (action == "isNotEmpty" || action == "isEmpty")
                    applyFilter();
                if (action == "today")
                    $.datepicker.selectToday(el.next().find("input"));
                el.focus();
            }).on('close.popupmenu', function() {
	            $('#inforFilterConditions').parent('.popupmenu-wrapper').remove();
	            $('#inforFilterConditions').remove();
	            if ($button.data('popupmenu')) {
	              $button.data('popupmenu').destroy();
	            }
            });
        });

        return button;
    }

    function addSelection(button, $this, isChecked) {
      //update the selections.
      var selections = button.data("selections"),
        found=false;

      if (!selections)
        selections = [];

      for (var i = 0; i < selections.length; i++) {
        if (selections[i].id==$this.attr("id")) {
          selections[i].isChecked=isChecked;
        }
      }

      //check for any new elements not in the previous list and add them.
      if (!found)
        selections.push({id: $this.attr("id"), isChecked: isChecked});

      button.data("selections", selections);
    }

    //scan the column for distinct values and add them to the list with a checkbox..and manage saving values to data.
    function addContentsFilterMenu(col, button) {
      var html = '<ul id="inforFilterConditions" class="popupmenu">',
        data = getData().getItems(),
        distinctValues = [],
        suppliedValues = col.contentsFilterValues,
        field = col.field,
        formatter = col.filterFormatter;

      if (data.length==0 && !suppliedValues)
        return true;

      distinctValues.push({id:"selectAll", html: Globalize.localize("SelectDeselect")});

      if (suppliedValues) {
          for (i = 0; i < suppliedValues.length; i++) {

            for (j = 0; j < distinctValues.length; j++) {
              var found = false;
              if (suppliedValues[i]==distinctValues[j].id) {
                found=true;
                break;
              }
            }
            if (!found && suppliedValues[i]!=undefined)
              distinctValues.push({id:suppliedValues[i], html: suppliedValues[i]});
          }
      } else {
        var addEmpty = false;

        for (i = 0; i < data.length; i++) {
          for (j = 0; j < distinctValues.length; j++) {
            var found = false;

            if (addEmpty==false && !data[i][field])
              addEmpty = true;

            if (data[i][field]==distinctValues[j].id) {
              found=true;
              break;
            }
          }
          if (!found && data[i][field]!=undefined && data[i][field]!="")
            distinctValues.push({id:data[i][field], html:data[i][field]});
        }
      }

      if (addEmpty)
        distinctValues.push({id:"empty", html: "["+Globalize.localize("IsEmpty")+"]"});

      if (distinctValues.length==0)
        return true;

      var prevSelections = button.data("selections");

      for (i = 0; i < distinctValues.length; i++) {
        var isChecked = true;
        //check previous selections and retick
        if (prevSelections!=undefined) {
          for (j = 0; j < prevSelections.length; j++) {
            if (distinctValues[i].id==prevSelections[j].id) {
              isChecked=prevSelections[j].isChecked;
           }
          }
        }

        //allow a function to be injected to format the value...
        var newHtml = '<li class="checkbox"><a href="#"><input type="checkbox"  tabindex="-1"   class="inforCheckbox" '+(isChecked ? ' checked ' : '') +' id="'+distinctValues[i].id+'"/></span></div><label class="inforCheckboxLabel" for="'+distinctValues[i].id+'">'+distinctValues[i].html+'</label></a></li>';
        if (formatter!=undefined)
          html = html+ formatter(newHtml,distinctValues[i].html);
        else
          html = html+newHtml;
      }

      html += '</ul>';

      //reset the selections...
      if (prevSelections==undefined) {
        var selections = [];
        for (i = 0; i < distinctValues.length; i++) {
          selections.push({id: distinctValues[i].id, isChecked: true});
        }
        button.data("selections", selections);
      }

      $('body').append(html);

      $("#inforFilterConditions").find("input").click(function(e) {
        var $this = $(this),
          isChecked = this.checked,
          $headerCol = $(getHeaderRowColumn(col.id)),
          button = $headerCol.find(".inforFilterButton");

        if ($this.attr("id")=="selectAll") {
          var inputs = $this.closest(".popupmenu").find("input");
          inputs.each(function() {
            var input = $(this);
            input.prop("checked", isChecked);
            addSelection(button,input,isChecked);
          });

        } else {
          addSelection(button,$this,isChecked);
        }

        //apply filter...
        if (col.contentsFilterSettings && col.contentsFilterSettings.filterOnRun) {
          e.stopPropagation();
          return;
        }

        applyFilter();
        e.stopPropagation();  //do not want the click on the checkbox to close the menu
      });
    }

    function restoreLastFilter(gridObj, $button, column) {
      //restore last value
      var filter = gridObj.getFilter();
      if (filter && filter[column.id]) {
        lastFilter = filter[column.id].operator;
        if (lastFilter != "") {
          $button.removeAttr("class").addClass("inforFilterButton "+lastFilter);
        }
      }
    }

    /* Adds a checkbox Filter to the grid column */
    function addCheckboxFilterColumn(gridObj, column) {
      var header = gridObj.getHeaderRowColumn(column.id);
      //save last value
      var filterButton = $(header).find(".inforFilterButton")

      $(header).empty();
      //add the button
      var $button = getFilterButton(column.id,  CheckboxFilter(), "eitherSelectedorNotSelected", "EitherSelectedorNotSelected");

      $(header).css({"text-align":"center", "top": "0"});

      restoreLastFilter(gridObj, $button, column);
      $button.css({"float":"none"});
      $(header).append($button);
    }

    /* Adds a ColumnContents to the grid column */
    function addColumnContentsFilterColumn(gridObj, column) {
      var header = gridObj.getHeaderRowColumn(column.id);
      //save last value
      var filterButton = $(header).find(".inforFilterButton")

      $(header).empty();
      //add the button
      var $button = getFilterButton(column.id,  ColumnContentsFilter(), "contains", "SelectContents");

      $(header).css("text-align","center");

      restoreLastFilter(gridObj, $button, column);
      $button.css({"float":"none"});

      $(header).append($button);
    }

    /* Adds a text Filter to the grid column */
    function addTextFilterColumn(gridObj, column) {
      var header = gridObj.getHeaderRowColumn(column.id),
        filters = gridObj.getFilter(),
        lastValue = (filters && filters[column.id] ? filters[column.id].value : undefined),
        filterButton = $(header).find(".inforFilterButton")

      $(header).empty();

      var inputWidth = $(header).width() - 4 - 31;  //column width - margin - button size with padding
      var input = $("<input tabindex='-1' class='inforTextbox' type='text'>")
        .data("columnId", column.id)
        .data("filterType", TextFilter())
        .width(inputWidth)
        .val(lastValue)
        .appendTo(header)
        .keypress(function(e) {
          if (e.which == $.ui.keyCode.ENTER)  //Run the filter...
          {
            e.preventDefault();
            e.stopPropagation();
            gridObj.applyFilter();
            $(this).focus();
            return false;
          }
        });

      if (column.cssClass) {
        input.addClass(column.cssClass);
      }

      if (column.maxLength) {
        input.attr("maxLength",column.maxLength).maxLength();
      }

      var defaultFilterName = "contains";

      if (typeof column.filterExcludeList != "undefined") {
          var isDiff = false,
              exList = [],
              txtFilters = [],
              arrDiff = [],
              filterExcludeList = (column.filterExcludeList).replace(/\./g, '').split(",");

          $.each(filterExcludeList, function () {
              exList.push($.trim(this));
          });

          $.each(gridTextFilters, function (key, value) {
              txtFilters.push(key);
          });

          arrDiff = $(txtFilters).not(exList).get();

          defaultFilterName = arrDiff[0];
      }

      var theFilter = (typeof(filters[column.id]) != "undefined")?filters[column.id].operator:"contains";
      var $button = getFilterButton(column.id, TextFilter(), theFilter, getTooltipContent(theFilter));

      restoreLastFilter(gridObj, $button, column);
      input.before($button);
    }

    /**
     * Getting the corresponding Name based from the filter value
     * return String
     * */
    function getTooltipContent(filter){
    	var tooltip;
    	switch(filter){
    	case 'equals':
    		tooltip = "Equals";
    		break;
    	case 'doesNotEqual':
    		tooltip = "DoesNotEqual";
    		break;
    	case 'doesNotContain':
    		tooltip = "DoesNotContain";
    		break;
    	case 'isEmpty':
    		tooltip = "IsEmpty";
    		break;
    	case 'isNotEmpty':
    		tooltip = "IsNotEmpty";
    		break;
    	case 'startsWith':
    		tooltip = "StartsWith";
    		break;
    	case 'doesNotStartWith':
    		tooltip = "DoesNotStartWith";
    		break;
    	case 'endsWith':
    		tooltip = "EndsWith";
    		break;
    	case 'doesNotEndWith':
    		tooltip = "DoesNotEndWith";
    		break;
	    	default:
	    		tooltip = "Contains";
    	}

    	return tooltip;
    }

    function addSelectFilterColumn(gridObj, column) {
      var header = gridObj.getHeaderRowColumn(column.id),
        lastFilterValue ="",  //save last value
        filters = gridObj.getFilter(),
        lastValue = (filters && filters[column.id] ? filters[column.id].value : undefined);

      //Just adjust the height
      if ($(header).find('select').length > 0) {
        $(header).find('.dropdown').width($(header).width() - 54);
        return;
      }

      $(header).empty();
        var inputWidth = column.width - 15, //column width - margin - button size - trigger button size.
        option_str = "", useCodes = false, hasEmpty = false;

      if (column.options) {
        var options = column.options;

        if (typeof(options) == "function") {
          options = options("", null, {});
        }

        for (var i = 0; i < options.length; i++) {
          v = options[i];
          if (v.value!=undefined && v.label!=undefined) {
            option_str += "<option value='" + $.escape(v.value) + "' " +">" + ((v.label == "" || v.label == " " || v.label == "&nbsp;") ? '&nbsp;' : $.escape(v.label)) + "</option>";
            useCodes = true;
            if (v.label == "" || v.label == " " || v.label == "&nbsp;") {
              hasEmpty = true;
            }
          } else {
            option_str += "<option value='" + $.escape(v) + "' "+ ">" + $.escape(v) + "</option>";
          }
          if (v == "" || v == " " || v == "&nbsp;") {
            hasEmpty = true;
          }
        }

        if (!hasEmpty) {
          option_str = "<option value=''>&nbsp;</option>"+option_str;
        }
      }

      var opts = jQuery.extend({allowSingleDeselect: true}, column.editorOptions);

      var input = $("<select tabindex='-1' class='dropdown'>"+option_str+"</select>")
        .attr('id', column.id)
        .data("columnId", column.id)
        .data("filterType", SelectFilter())
        .data("useCodes", useCodes)
        .width(inputWidth)
        .val(lastValue)
        .appendTo(header);

      input.before($('<label class="scr-only label noColon"></label>')
          .text(column.name + ' ' + Globalize.localize('Filter'))
          .attr('for', column.id));

      input.dropdown(opts)
        .change(function(event) {
          gridObj.applyFilter();
          event.preventDefault();
          event.stopPropagation();
          $(this).focus();
        });

      var $button = getFilterButton(column.id, SelectFilter(), "equals", "EqualsStr");

      restoreLastFilter(gridObj, $button, column);

      input.before($button);
      setTimeout(function () {
        input.next().find("input").val();
        if (filters[column.id]) {
          input.dropdown("setCode", filters[column.id].value);
        }

      }, 1);
    }

    /* Adds a lookup Filter to the grid column */
    function addLookupFilterColumn(gridObj, column) {
      var header = gridObj.getHeaderRowColumn(column.id),
        lastFilterValue = "",  //save last value
        filters = gridObj.getFilter(),
        lastValue = (filters && filters[column.id] ? filters[column.id].value : undefined),
        filterButton = $(header).find(".inforFilterButton");

      $(header).empty();

      var filterType = (column.editorOptions && column.editorOptions.lookupFilterType)
          ? column.editorOptions.lookupFilterType.call() : LookupFilter();

      // supported filter types for the input element of the lookupFilter
      var initialValue, initialTooltip;
      switch (filterType) {
        case "TextFilter":
          initialValue = "contains";
          initialTooltip = "Contains";
          break;
        case "IntegerFilter":
        case "DecimalFilter":
        case "PercentFilter":
          initialValue = "equals";
          initialTooltip = "EqualsStr";
          break;
        case "LookupFilter":
        default:
            filterType = LookupFilter();
            initialValue = "equals";
            initialTooltip = "EqualsStr";
      }

      var input = $("<input data-mode='0' class='inforLookupField' type='text'>")
        .attr('id', column.id)
        .data("columnId", column.id)
        .data("filterType", filterType)
        .width($(header).width() - 46) // 4 pixel padding + width of the button
        .val(lastValue)
        .appendTo(header);

      if (filterType == "IntegerFilter") {
        input.addClass("decimalOnly");
      }

      if (filterType == "DecimalFilter" || filterType == "PercentFilter") {
        input.addClass("numericOnly");
      }

      if (filterType == "IntegerFilter" || filterType == "DecimalFilter" || filterType == "PercentFilter") {
        var isDecimal = (filterType == "IntegerFilter" ? false : true);
        input.numericOnly(isDecimal, (column.positiveOnly ? column.positiveOnly : false))
      }

      if (column.cssClass) {
        input.addClass(column.cssClass);
      }

      if (column.maxLength) {
        input.attr("maxLength",column.maxLength).maxLength();
      }

      if (column.numberFormat) {
        input.attr("data-number-format",column.numberFormat).formatNumber();
      }

      input.inforLookupField(column.editorOptions);

      input.on("keydown.nav", function(event) {
        if (event.keyCode === $.ui.keyCode.ENTER) {
          gridObj.applyFilter();
          event.preventDefault();
          event.stopPropagation();
          $(this).focus();
        }
      });

      input.change(function(event) {
        gridObj.applyFilter();
        event.preventDefault();
        event.stopPropagation();
        $(this).focus();
      });

      var $button = getFilterButton(column.id, filterType, initialValue, initialTooltip);

      restoreLastFilter(gridObj, $button, column);

      input.closest(".inforTriggerField").before($button);
    }

    function addIntegerFilterColumn(gridObj, column, isDecimal) {
      var header = gridObj.getHeaderRowColumn(column.id),
      filterButton = $(header).find(".inforFilterButton"),  //save last value
      lastFilterValue = "",
      filters = gridObj.getFilter(),
      lastValue = (filters && filters[column.id] ? filters[column.id].value : undefined);

      $(header).empty();
      var inputWidth = column.width - 45;  //column width - margin - button size with padding

      var filterType = (isDecimal ?  DecimalFilter() :  IntegerFilter());

      var input = $("<input tabindex='-1' class='inforTextbox alignRight' type='text'>")
        .data("columnId", column.id)
        .data("filterType", filterType)
        .addClass((isDecimal  ? "numericOnly" : "decimalOnly"))
        .width(inputWidth)
        .val(lastValue)
        .appendTo(header)
        .numericOnly(isDecimal, (column.positiveOnly ? column.positiveOnly : false))
        .keypress(function(event) {
          if (event.which == $.ui.keyCode.ENTER)  //Run the filter...
          {
            gridObj.applyFilter();
            event.preventDefault();
            event.stopPropagation();
            $(this).focus();
          }
        });

      if (column.cssClass) {
        input.addClass(column.cssClass);
      }

      if (column.maxLength) {
        input.attr("maxLength",column.maxLength).maxLength();
      }

      if (column.numberFormat) {
        input.attr("data-number-format",column.numberFormat).formatNumber();
      }
      var $button = getFilterButton(column.id, filterType, "equals" , "EqualsStr");

      restoreLastFilter(gridObj, $button, column);
      input.before($button);
    }

    /* Adds a date Filter to the grid column */
    function addDateFilterColumn(gridObj, column) {
      var header = gridObj.getHeaderRowColumn(column.id),
      filterButton = $(header).find(".inforFilterButton"),  //save last value
      lastFilterValue = "",
      filters = gridObj.getFilter(),
      lastValue = (filters && filters[column.id] ? filters[column.id].value : undefined);

      $(header).empty();

      var options = {dateFormat: column.DateShowFormat};
      if (column.editorOptions)
        options = column.editorOptions;

      var input = $("<input tabindex='-1' class='inforDateField' type='text'>")
        .data("columnId", column.id)
        .data("filterType", DateFilter())
        .val(lastValue)
        .appendTo(header)
        .inforDateField(options)
        .keypress(function(event) {
          if (event.which == $.ui.keyCode.ENTER)  //Run the filter...
          {
            gridObj.applyFilter();
            event.preventDefault();
            event.stopPropagation();
            $(this).focus();
          }
        });

      input.width(column.width - 45);  //4 pixel padding / width of the button

      if (column.cssClass) {
        input.addClass(column.cssClass);
      }

      if (column.maxLength) {
        input.attr("maxLength",column.maxLength).maxLength();
      }

      var $button = getFilterButton(column.id, DateFilter(), "equals", "EqualsStr");

      restoreLastFilter(gridObj, $button, column);
      input.closest(".inforTriggerField").before($button);
    }

    function filterTextValue(colValue, filterValue, operator) {
      var pattern, filterRegx;

      if (colValue==undefined)
        colValue="";

      colValue= colValue.toString().toLowerCase();

      if (filterValue) {
        filterValue = filterValue.toLowerCase();
        filterValue = filterValue.replace(/&/g, '&amp;');
        filterValue = filterValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        pattern = filterValue.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
        filterRegx = new RegExp(pattern, "i");
      }

      switch(operator)
        {
        case "equals":
          if (colValue!=filterValue && filterValue!="")
            return false;
          break;
        case "doesNotEqual":
          if (colValue==filterValue && filterValue!="")
            return false;
          break;
        case "contains":
          if (colValue.search(filterRegx)<0 && filterValue!="")
            return false;
          break;
        case "doesNotContain":
          if (colValue.search(filterRegx)>=0 && filterValue!="")
            return false;
          break;
        case "isEmpty":
          if (colValue!="" && colValue!=undefined && $.trim(colValue)!="")
            return false;
          break;
        case "isNotEmpty":
          if (colValue=="" || colValue==undefined || $.trim(colValue) == "")
            return false;
          break;
        case "startsWith":
          if (colValue.search(filterRegx)!=0 && filterValue!="")
            return false;
          break;
        case "doesNotStartWith":
          if (colValue.search(filterRegx)==0 && filterValue!="")
            return false;
          break;
        case "endsWith":
          if (!colValue.endsWith(pattern) && filterValue!="")
            return false;
          break;
        case "doesNotEndWith":
          if (colValue.endsWith(pattern) && filterValue!="")
            return false;
          break;
        }
      return true;
    }

    function filterIntegerValue(colValue, filterValue, operator) {

      switch(operator)
        {
        case "equals":
          if (parseFloat(colValue,10)!=Globalize.parseFloat(filterValue,10))
            return false;
          break;
        case "doesNotEqual":
          if (parseFloat(colValue,10)==Globalize.parseFloat(filterValue,10))
            return false;
          break;
        case "isEmpty":
          if (!(colValue==="" || colValue==undefined) || colValue==0 || colValue=="0")
            return false;
          break;
        case "isNotEmpty":
          if (colValue=="" || colValue==undefined)
            return false;
          break;
        case "lessThan":
          if ((colValue==undefined ? 0 : parseFloat(colValue, 10))>=Globalize.parseFloat(filterValue,10))
            return false;
          break;
        case "lessThanOrEquals":
          if (!((colValue==undefined ? 0 : parseFloat(colValue, 10))<Globalize.parseFloat(filterValue,10) || parseFloat(colValue, 10)==Globalize.parseFloat(filterValue,10)))
            return false;
          break;
        case "greaterThan":
          if ((colValue==undefined ? 0 : parseFloat(colValue, 10))<=Globalize.parseFloat(filterValue,10))
            return false;
          break;
        case "greaterThanOrEquals":
          if (!((colValue==undefined ? 0 : parseFloat(colValue, 10))>Globalize.parseFloat(filterValue,10) || parseFloat(colValue, 10)==Globalize.parseFloat(filterValue,10)))
            return false;
          break;
        }
      return true;
    }

    function filterColumnContentsValue(colValue, filterValues) {
      if (filterValues==undefined)
        return true;

      var isInList = false;

      for (var i = 0; i < filterValues.length; i++) {
        if (filterValues[i].id=="selectAll")
          continue;

        if (filterValues[i].id=="empty" && filterValues[i].isChecked==true && !colValue) {
          isInList=true;
        }

        if (filterValues[i].id=="empty" && filterValues[i].isChecked==false && !colValue) {
          break;
        }

        if (colValue==filterValues[i].id && filterValues[i].isChecked==true) {
          isInList=true;
          break;
        }
      }

      return isInList;
    }

    function filterCheckboxValue(colValue, operator) {
      if (colValue==undefined)  //no rows in the grid and something triggered a filter
        return;

      switch(operator)
        {
        case "selected":
          if ((colValue.toString() == "0" || colValue == 0 || colValue == false) && !(colValue===""))
            return false;
          break;
        case "notSelected":
          if ((colValue.toString() == "1" || colValue == 1 || colValue == true) && !(colValue===""))
            return false;
          break;
        }
      return true;
    }

    function filterDateValue(colValue, filterValue, operator, columnInfo) {
      if (columnInfo.DateSourceFormat!=undefined && !(Object.prototype.toString.call(colValue) === '[object Date]')) {
          //convert to date
          if (columnInfo.DateSourceFormat == 'UTC') {
              // The date/time is in UTC but assumed to be local for filtering, so convert it into local time
              var generatedDate = new Date(colValue);

              // Use the generated date's offset to create a new date with the timezone offset added, as this offset isn't currently applied
              generatedDate.setMinutes(generatedDate.getMinutes() + generatedDate.getTimezoneOffset());

              // Parse the date/time into the proper format
              // TODO: Is there a less verbose way of accomplishing this behavior?
              colValue = $.datepicker.parseDate($.datepicker.formatDate(generatedDate, columnInfo.DateShowFormat), columnInfo.DateShowFormat);
          } else {
              colValue = $.datepicker.parseDate(colValue, columnInfo.DateSourceFormat);
          }
      }

      //add 00:00:00 time if time part is missing
      if (columnInfo.DateShowFormat!=undefined && columnInfo.DateShowFormat.search('HH:mm:ss')>-1 && filterValue.search(' ')==-1)
        filterValue=filterValue+" 00:00:00";

      filterValue = $.datepicker.parseDate(filterValue,columnInfo.DateShowFormat);
      var filterValueJustDate = null;
      var colValueJustDate = null;

      if (filterValue!=undefined)
        filterValueJustDate= filterValue.getDate().toString() + filterValue.getMonth().toString() + filterValue.getFullYear().toString();

      if (columnInfo.DateShowFormat && columnInfo.DateShowFormat.indexOf("HH")>1){  //use time
        filterValueJustDate= filterValue.getTime().toString();
      }

      if (colValue!=undefined) {
        if (typeof colValue=="string" &&  colValue.substr(0,6)=="/Date(")
          colValue = new Date(parseInt(colValue.substr(6)));

        colValueJustDate = colValue.getDate().toString() + colValue.getMonth().toString() + colValue.getFullYear().toString();

        if (columnInfo.DateShowFormat && columnInfo.DateShowFormat.indexOf("HH")>1) {  //use time
          colValueJustDate= colValue.getTime().toString();
        }
      }

      switch(operator)
        {
        case "today":
          if (colValueJustDate!=filterValueJustDate)
            return false;
          break;
        case "equals":
          if (colValueJustDate!=filterValueJustDate)
            return false;
          break;
        case "doesNotEqual":
          if (colValueJustDate==filterValueJustDate)
            return false;
          break;
        case "isEmpty":
          if (colValue!=undefined)
            return false;
          break;
        case "isNotEmpty":
          if (colValue==undefined)
            return false;
          break;
        case "lessThan":
          if (colValue>=filterValue || colValueJustDate==filterValueJustDate)
            return false;
          break;
        case "lessThanOrEquals":
          if (!(colValue<filterValue || colValueJustDate==filterValueJustDate))
            return false;
          break;
        case "greaterThan":
          if (colValue<=filterValue || colValueJustDate==filterValueJustDate)
            return false;
          break;
        case "greaterThanOrEquals":
          if (!(colValue>filterValue || colValueJustDate==filterValueJustDate))
            return false;
          break;
        }
      return true;
    }

    /* Filter out values from the grid that do not match...*/
    function filter(item) {
      //Allow new records
      if (item.indicator === "new") {
        return true;
      }

      if (!options.disableClientFilter) {
        for (var columnId in columnFilters) {
          var filterValue = columnFilters[columnId].value,
            filterType = columnFilters[columnId].filterType,
            operator = columnFilters[columnId].operator,
            columnInfo = getColumns()[getColumnIndex(columnId)];

          if (typeof columnInfo=="undefined")
            continue;

          var colValue = getDataItemValueForColumn(item, columnInfo.field);

          switch(filterType)
          {
          case "TextFilter":
            if (!filterTextValue(colValue, filterValue, operator))
              return false;
            break;
          case "SelectFilter":
            if (!filterTextValue(colValue, filterValue, operator))
              return false;
            break;
          case "IntegerFilter":
            if (!filterIntegerValue(colValue, filterValue, operator))
              return false;
          break;
          case "DecimalFilter":
            if (!filterIntegerValue(colValue, filterValue, operator))
              return false;
          break;
          case "PercentFilter":
            if (!filterIntegerValue(colValue.toString(), filterValue.toString(), operator))
              return false;
          break;
          case "DateFilter":
            if (!filterDateValue(colValue, filterValue, operator, columnInfo))
              return false;
            break;
          case "CheckboxFilter":
            if (!filterCheckboxValue(colValue, operator))
              return false;
            break;
          case "ColumnContentsFilter":
            if (!filterColumnContentsValue(colValue, filterValue))
              return false;
            break;
          default:
            continue;
          }
        }
      }


      //tree grid - collapse/expand
      if (item.parent != null) {
        var parent = getData().getItemById(item.parent);

        while (parent) {
        if (parent.collapsed) {
          return false;
        }

          parent = getData().getItemById(parent.parent);
        }
      }

      return true;
    }

    var popup = null;
    function showCommentsPopup(position, text, editable){
      if (!popup) {
        popup = $('<div style="z-index:10000; display:none; position: absolute;" class="inforGridCommentPopup inforPopover bottom"><div class="arrow"></div><div class="inforPopoverContent"></div></div>')
            .appendTo("body");

        var textArea = $("<textarea>").appendTo(popup.find(".inforPopoverContent"));
        if (!editable)
          textArea.attr("readonly","readonly");

        popup.resizable({ handles: 'se'});
      }
      popup.find("textarea").text(text);
      popup.show().css({"left" : parseInt(position.left, 10) - 50 , "top" : parseInt(position.top, 10) + 35});
      return popup;
    }

    //////////////////////////////////////////////////////////////////////////////////////////////
    // Public API
    $.extend(this, {
      // Events
      "onScroll": new Slick.Event(),
      "onSort": new Slick.Event(),
      "onHeaderContextMenu": new Slick.Event(),
      "onHeaderClick": new Slick.Event(),
      "onHeaderCellRendered": new Slick.Event(),
      "onBeforeHeaderCellDestroy": new Slick.Event(),
      "onHeaderRowCellRendered": new Slick.Event(),
      "onBeforeHeaderRowCellDestroy": new Slick.Event(),
      "onMouseEnter": new Slick.Event(),
      "onMouseLeave": new Slick.Event(),
      "onClick": new Slick.Event(),
      "onDblClick": new Slick.Event(),
      "onContextMenu": new Slick.Event(),
      "onKeyDown": new Slick.Event(),
      "onAddNewRow": new Slick.Event(),
      "onValidationMessage": new Slick.Event(),
      "onViewportChanged": new Slick.Event(),
      "onColumnsReordered": new Slick.Event(),
      "onColumnsResized": new Slick.Event(),
      "onCellChange": new Slick.Event(),
      "onBeforeEditCell": new Slick.Event(),
      "onBeforeCellEditorDestroy": new Slick.Event(),
      "onEnterEditMode": new Slick.Event(),
      "onExitEditMode": new Slick.Event(),
      "onBeforeDestroy": new Slick.Event(),
      "onActiveCellChanged": new Slick.Event(),
      "onActiveRowChanged": new Slick.Event(),
      "onActiveCellPositionChanged": new Slick.Event(),
      "onDragInit": new Slick.Event(),
      "onDragStart": new Slick.Event(),
      "onDrag": new Slick.Event(),
      "onDragEnd": new Slick.Event(),
      "onSelectedRowsChanged": new Slick.Event(),
      "onPersonalizationChanged": new Slick.Event(),
      "onRowsMoved": new Slick.Event(),
      "onRowExpanded": new Slick.Event(),
      "onRowCollapsed": new Slick.Event(),
      "trigger": trigger,

      // Methods
      "registerPlugin": registerPlugin,
      "unregisterPlugin": unregisterPlugin,
	  "getPlugin": getPlugin,
      "getColumns": getColumns,
      "setColumns": setColumns,
            "getVisibleItems": getVisibleItems,
      "getColumnIndex": getColumnIndex,
      "getGridPersonalizationInfo": getGridPersonalizationInfo,
      "updateColumnHeader": updateColumnHeader,
      "setSortColumn": setSortColumn, //depricated use setSortColumns
      "setSortColumns": setSortColumns,
      "getSortColumns": getSortColumns,

      "autosizeColumns": autosizeColumns,
      "getOptions": getOptions,
      "setOptions": setOptions,
      "getData": getData,
      "getFilteredData" : getFilteredData,
      "getDataLength": getDataLength,
      "getDirtyRows": getDirtyRows,
      "getSelectableLength": getSelectableLength,

      "getDataItem": getDataItem,
      "getSelectionModel": getSelectionModel,
      "setSelectionModel": setSelectionModel,
      "getSelectedRows": getSelectedRows,
      "getPersistedRowIds": getPersistedRowIds,
      "setPersistedRowIds": setPersistedRowIds,
      "getPersistedDataItems": getPersistedDataItems,
      "clearPersistedSelections": clearPersistedSelections,
      "setSelectedRows": setSelectedRows,
      "updateFooterSelectionCounter": updateFooterSelectionCounter,
      "uncheckPersistedRow": uncheckPersistedRow,
      "selectAllRows": selectAllRows,
      "canRowBeSelected" : canRowBeSelected,

      "getDataItemValueForColumn" : getDataItemValueForColumn,
      "setDataItemValueForColumn" : setDataItemValueForColumn,

      //Added Functionality
      "showGridSettings": showGridSettings,
      "showFilterButton": showFilterButton,
      "addRow": addRow,
      "addRows": addRows,

      //Validation
      "getValidationMessages" : getValidationMessages,
      "setValidationMessages" : setValidationMessages,
      "removeValidationMessage" : removeValidationMessage,
      "addValidationMessage" : addValidationMessage,
      "clearValidationMessages" : clearValidationMessages,
      "validateCell" : validateCell,
      "validateRow" : validateRow,
      "validateAll" : validateAll,
      "setRowStatus" : setRowStatus,

      "showCommentsPopup": showCommentsPopup,
      "focus": focus,
      "excelExport": excelExport,
      "convertToCsv": convertToCsv,
      "resetColumnLayout": resetColumnLayout,

      "removeSelectedRows": removeSelectedRows,
      "updateData": updateData,
      "mergeData": mergeData, //for paging
      "updateSummaryRow": updateSummaryRow, //for summary row

      "hideColumn": hideColumn,
      "showColumn": showColumn,
      "hideColumns": hideColumns,
      "showColumns": showColumns,

      "resizeAndRender": resizeAndRender,
      "restorePersonalization": restorePersonalization,

      //added for filtering...
      "clearFilter" : clearFilter,
      "applyFilter" : applyFilter,
      "getFilter" : getFilter,
      "updateFilterRow" : updateFilterRow,
      "filter" : filter,  //Should not be used called call applyFilter

      "render": render,
      "invalidate": invalidate,
      "invalidateRow": invalidateRow,
      "invalidateRows": invalidateRows,
      "invalidateAllRows": invalidateAllRows,
      "updateCell": updateCell,
      "updateRow": updateRow,
      "getViewport": getVisibleRange,
      "resizeCanvas": resizeCanvas,
      "reinit": reinit,
      "updateRowCount": updateRowCount,
      "scrollRowIntoView": scrollRowIntoView,
      "scrollRowToTop": scrollRowToTop,
      "scrollCellIntoView": scrollCellIntoView,
      "getCanvasNode": getCanvasNode,
      "getCellFromPoint": getCellFromPoint,
      "getCellFromEvent": getCellFromEvent,
      "getActiveCell": getActiveCell,
      "setActiveCell": setActiveCell,
      "getActiveCellNode": getActiveCellNode,
      "getActiveCellPosition": getActiveCellPosition,
      "resetActiveCell": resetActiveCell,
      "editActiveCell": makeActiveCellEditable,
      "getCellEditor": getCellEditor,
      "getCellNode": getCellNode,
      "getCellNodeBox": getCellNodeBox,
      "canCellBeSelected": canCellBeSelected,
      "canCellBeActive": canCellBeActive,
      "navigatePrev": navigatePrev,
      "navigateNext": navigateNext,
      "navigateUp": navigateUp,
      "navigateDown": navigateDown,
      "navigateLeft": navigateLeft,
      "navigateRight": navigateRight,
      "gotoCell": gotoCell,
      "getTopPanel": getTopPanel,
      "getHeaderRow": getHeaderRow,
      "setTopPanelVisibility": setTopPanelVisibility,
      "setHeaderRowVisibility": setHeaderRowVisibility,
      "getHeaderRowColumn": getHeaderRowColumn,
      "getColumnChildren": getColumnChildren,
      "getSummaryRow": getSummaryRow,
      "getSummaryRowColumn": getSummaryRowColumn,
      "getGridPosition": getGridPosition,
      "addCellCssStyles": addCellCssStyles,
      "setCellCssStyles": setCellCssStyles,
      "removeCellCssStyles": removeCellCssStyles,

      "destroy": destroy,

      // IEditor implementation
      "getEditorLock": getEditorLock,
      "getEditController": getEditController
    });
    init();
  }
} (jQuery));

/*
* InforDataGrid Formatters and Editors
*/
(function ($) {

  var SlickEditor = {
  /*Filters */
    TextFilter : function () {
      return "TextFilter";
    },
    IntegerFilter : function () {
      return "IntegerFilter";
    },
    DecimalFilter : function () {
      return "DecimalFilter";
    },
    PercentFilter : function () {
      return "PercentFilter";
    },
    DateFilter : function () {
      return "DateFilter";
    },
    CheckboxFilter : function () {
      return "CheckboxFilter";
    },
    SelectFilter : function () {
      return "SelectFilter";
    },
    LookupFilter : function () {
      return "LookupFilter";
    },
    ColumnContentsFilter : function () {
      return "ColumnContentsFilter";
    },
  /*Formatters*/
    SelectorCellFormatter: function (row, cell, value, columnDef, dataContext) {
      return (!dataContext ? "" : row);
    },

    CellTemplateFormatter: function (row, cell, value, columnDef, dataContext) {
      var compiled_template = tmpl(columnDef.cellTemplate);
      return compiled_template(dataContext);
    },

    LinkFormatter: function (row, cell, value, columnDef, dataContext) {
    //replace the dataContext
    var linkHrefExpr = ""

    if (columnDef.linkHref!=undefined)
        linkHrefExpr = columnDef.linkHref.replace('%value%',value);

    if (columnDef.linkHref!=undefined &&  columnDef.linkHref.search('%dataContext.')>-1)
    {
        var linkHref = columnDef.linkHref.replace(/'/gi,'"');
        while (linkHref.indexOf('%') >= 0)  //loop through all matches to replace values to build: reportid_instanceid,reportname
        {
          var expr = linkHref.substr(linkHref.search('%')+1);
          expr = expr.substr(0,expr.search('%'));

          //faster than eval for dataContext. expressions
          if (expr.indexOf("dataContext.")==0) {
            expr = dataContext[expr.replace("dataContext.","")];
          } else
            expr = eval(expr);

          if (expr==undefined)
            expr="undefined";

          expr = expr.toString(); //Just in case it is not a string..

          expr = expr.replace(/'/g,"&#39;"); // escape quote inline js
          expr = expr.replace(/"/g,"&#34;"); // escape doublequote inline js

          var start = linkHref.substr(0,linkHref.search('%'));
          var end = linkHref.substr(linkHref.search('%')+1);
          end  = end.substr(end.search('%')+1);

          linkHref = start+expr+end;
          linkHrefExpr = linkHref;
        }
      }

    var linkOnClick = "";

    if (columnDef.linkOnClick!=undefined)
      linkOnClick = columnDef.linkOnClick.replace(/'/gi,'"').replace('%value%',value);

    if (columnDef.linkOnClick!=undefined && columnDef.linkOnClick.search('%dataContext.')>-1)
    {
        var linkOnClick = columnDef.linkOnClick.replace(/'/gi,'"');

        while (linkOnClick.indexOf('%') >= 0) //loop through all matches to replace values to build: reportid_instanceid,reportname
        {
          var expr = linkOnClick.substr(linkOnClick.search('%')+1);
          expr = expr.substr(0,expr.search('%'));

          //faster than eval for dataContext. expressions
          if (expr.indexOf("dataContext.")==0) {
            expr = dataContext[expr.replace("dataContext.","")];
          } else
            expr = eval(expr);

          if (expr==undefined)
            expr="undefined";

          expr = expr.toString(); //Just in case it is not a string..

          expr = expr.replace(/'/g,"&#39;"); // escape quote inline js
          expr = expr.replace(/"/g,"&#34;"); // escape doublequote inline js

          var start = linkOnClick.substr(0,linkOnClick.search('%'));
          var end = linkOnClick.substr(linkOnClick.search('%')+1);
          end  = end.substr(end.search('%')+1);
          linkOnClick = start+expr+end ;
        }
    }

    var isReadonly = false;
      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext))
        isReadonly = true;

    return "<a class='inforHyperlink' "
      + (linkHrefExpr=="" || isReadonly ? "" : "href='" + linkHrefExpr + "'")
      + (columnDef.linkTarget==undefined  || isReadonly  ? "" :  "target='" + columnDef.linkTarget + "'")
      + (linkOnClick==""  || isReadonly ? "" :  " onclick='" + linkOnClick + "'")
      + (columnDef.toolTip ==undefined ? "" :  " title='" + columnDef.toolTip + "'")
      + (isReadonly ? "disabled" : "")+">" + (value == undefined ? "" : value) + "</a>" ;
    },

    CheckboxCellFormatter: function (row, cell, value, columnDef, dataContext, gridOptions) {
      var isReadonly = false,
          isChecked = (value==undefined ? false : value == true);

        if ((columnDef.editability != undefined && columnDef.editability(row, cell, value, columnDef, dataContext)) || !gridOptions.editable || !columnDef.editor) {
          isReadonly = true;
        }

        return '<div class="checkbox' + (isChecked ? ' checked' : ' unchecked') + (isReadonly ? ' is-readonly' : ' ') + '"></div>';
    },

    DateCellFormatter : function(row, cell, value, columnDef, dataContext){
      var isReadonly = false,
        thedate = value,
        displayVal = null;

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext)) {
        isReadonly = true;
      }

      if (value==null)
        return '<div'+(isReadonly ? ' class="uneditable"': '')+'></div>';

      if (Object.prototype.toString.call(value) === '[object Date]') {  //date objects as source.
        if (columnDef.DateShowFormat!=undefined)
          displayVal = $.datepicker.formatDate(thedate,columnDef.DateShowFormat);
        else
          displayVal = $.datepicker.formatDate(thedate,Globalize.culture().calendar.patterns.d);

        return  '<div'+(isReadonly ? ' class="uneditable"': '')+'>'+displayVal+'</div>';
      } else if (value != '0000-00-00') { //string dates as source

        if (value!=undefined && columnDef.DateSourceFormat=="UTC") {
          thedate = (value === '' ? '' : Globalize.parseUtcDate(value));
        } else if (value!=undefined && value.substr(0,6)=="/Date(" || columnDef.DateSourceFormat=="JSON") //auto detect JSON Format or its specified.
          thedate = (value === '' ? '' : new Date(parseInt(value.substr(6))));
        else if(value!=undefined && columnDef.DateSourceFormat=="ISO") {
          var token = value.match(/\d+/g);
          thedate = new Date(token[0], token[1] - 1, token[2], token[3], token[4], token[5]);
        }  else if (columnDef.DateSourceFormat!=undefined)
          thedate = $.datepicker.parseDate(value,columnDef.DateSourceFormat);
        else
          thedate = value;

        if (columnDef.DateShowFormat != undefined) {
          displayVal = $.datepicker.formatDate(thedate, columnDef.DateShowFormat);
          if (displayVal && columnDef.DateSourceFormat=="UTC" && columnDef.DateShowFormat.indexOf("zzz") > -1) {
            //change the time zone format
            displayVal = displayVal.substr(0, displayVal.length - 6) + "+00:00";
          }
        } else {
          displayVal = $.datepicker.formatDate(thedate,Globalize.culture().calendar.patterns.d);
        }

        if (thedate == null)
          return '<div'+(isReadonly ? ' class="uneditable"': '')+'></div>';
        else
          return  '<div'+(isReadonly ? ' class="uneditable"': '')+'>'+displayVal+'</div>';
      } else {
        return '<div'+(isReadonly ? ' class="uneditable"': '')+'></div>';
      }
    },

    DrillDownCellFormatter: function (row, cell, value, columnDef, dataContext, options) {
      var isReadonly = false,
        tooltip = Globalize.localize("DrillDown");

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext)) {
        isReadonly = true;
      }

      var tooltip = Globalize.localize("DrillDown");
      if (options.drillDownTooltip) {
        tooltip = options.drillDownTooltip;
      }
      if (options.drillDownTooltip == '') {
        tooltip = '';
      }

      return "<a class='drilldown " + (isReadonly ? " uneditable" : "") + (Globalize.culture().isRTL ? " inforRTLFlip" : "") + "' title='"+tooltip+"'><span></span></a>";
    },

    ButtonCellFormatter: function (row, cell, value, columnDef, dataContext) {
      var isReadonly = false,
        tooltip = "";

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext))
      {
        isReadonly = true;
      }

      if (columnDef.toolTip!=null)
        tooltip = columnDef.toolTip;

      var innerHtml = "<span></span>";
      if (columnDef.buttonCssClass=="inforFormButton" || columnDef.buttonCssClass=="inforFormButton default")
        innerHtml = (value ? value : "&nbsp;");
      else if (columnDef.buttonHtml)
        innerHtml = columnDef.buttonHtml;

      return "<button type='button' class='" + (columnDef.buttonCssClass != undefined ? columnDef.buttonCssClass : "") + " gridButton'" + (isReadonly ? " disabled" : "") + " data-columnid='" + columnDef.id + "'" + (tooltip ? "title='"+tooltip+"'" : "") + ">"+innerHtml+"</button>";
    },

    ToggleButtonFormatter: function (row, cell, value, columnDef, dataContext, gridObj) {
      var toggleHtml = $('<div class="inforToggleButton">' + columnDef.toggleButtonHtml  +'</div>');
      toggleHtml.find("button").eq(value).addClass("checked");
      toggleHtml.find("button").attr("data-columnid", columnDef.id );
      return toggleHtml[0].outerHTML;
    },

    DetailTemplateFormatter: function (row, cell, value, columnDef, dataContext, gridObj) {
      if (!dataContext.rowHeight) {
        return "";
      }

      var templateArea = $('<div class="inforDetailTemplate"></div>').height(dataContext.rowHeight).css("opacity", 0),
        loading = $('<div class="inforBusyIndicator large"></div>').css("top", (dataContext.rowHeight/2) - 36);

      if (columnDef.detailTemplate) {
        templateArea.append(columnDef.detailTemplate(row, cell, value, columnDef, dataContext, gridObj));
      }

      return loading[0].outerHTML + templateArea[0].outerHTML;
    },

    MultiLineTextCellFormatter:  function (row, cell, value, columnDef, dataContext, gridOptions) {
      var isReadonly = false;

      if (value == null || value == undefined)
        value = "";

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext))
        isReadonly = true;

      return "<div class='"+(isReadonly ? "uneditable " : "")+"multiline-cell'>" + value + "</div>";
    },

    SelectCellFormatter: function (row, cell, value, columnDef, dataContext) {
      var isReadonly = false,
        isFound = false;

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext))
        isReadonly = true;

      if (value == null || value == undefined)
        value = "";

      //lookup the value in the options..
      var dropDownOptions = [];
      if (columnDef.options)
        dropDownOptions = columnDef.options;

      //Execute Source..
      if (columnDef.editorOptions && columnDef.editorOptions.source) {
        var response = function(data) {
          dropDownOptions = data;
        }
        columnDef.editorOptions.source("", response, true, dataContext);
      }

      for (var i = 0; i < dropDownOptions.length; i++) {
        var opt = dropDownOptions[i];
        if ((opt.id != undefined ? opt.id.toString() === value.toString() : $.trim(opt.value) === $.trim(value))) {
          value = opt.label;
          isFound = true;
          break;
        }
      }

      if (!isFound)
        value= "";

      if (isReadonly) {
        return "<div class='uneditable'>" + value + "</div>";
      }
      else {
        return value;
      }
    },
    LookupCellFormatter: function (row, cell, value, columnDef, dataContext) {
      var isReadonly = false,
        isFound = false;

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext))
        isReadonly = true;

      if (value == null || value == undefined) {
        values = "";
      } else {
        //lookup the value in the dataset....
        var lookupData = columnDef.editorOptions.gridOptions.dataset,
          keyField = columnDef.editorOptions.gridOptions.idProperty,
          returnField = columnDef.editorOptions.returnField;

        //Execute Source..
        if (columnDef.editorOptions.source) {
          var response = function(data) {
            lookupData = data;
          }
          columnDef.editorOptions.source("",response,true, dataContext);
        }

        var ids = value.toString().split(","),
          values = "";

        for (var i = 0; i < ids.length; i++) {
          for (var j = 0; j < lookupData.length; j++) {
            if (ids[i]==lookupData[j][keyField])
              values += lookupData[j][returnField] + (ids.length-1!=i ? "," : "");
          }
        }
      }

      if (isReadonly) {
        return "<div class='uneditable'>" + values + "</div>";
      }
      else {
        return values;
      }
    },

    RowSortFormatter : function (row, cell, value, columnDef, dataContext, options, gridObj) {
      var isReadonly = false;
      if (columnDef.editability && columnDef.editability(row, cell, value, columnDef, dataContext, options, gridObj)) {
        isReadonly = true;
      }
      return "<div class='cell-reorder dnd" + (isReadonly ? " uneditable" : "") + "' title='Reorder Rows'></div>";
    },

    TextCellFormatter: function (row, cell, value, columnDef, dataContext) {
      if (value == null || value == undefined) {
        value = "";
      }
      var isReadonly = false;

      if (columnDef.editability && columnDef.editability(row, cell, value, columnDef, dataContext)) {
        isReadonly = true;
      }

      if (columnDef.inputType=="password")
        value = Array(value.length).join("*");

      value = value.toString();
      value = value.replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (isReadonly) {
        return "<div class='uneditable'>" + value + "</div>";
      }
      else {
        return value;
      }
    },

    IntegerCellFormatter: function (row, cell, value, columnDef, dataContext, isNumeric) {
      if (value == null || value == undefined) {
        value = "";
      }
      var isReadonly = false;

      if (columnDef.editability!=undefined && columnDef.editability(row, cell, value, columnDef, dataContext))
      {
        isReadonly = true;
      }

      //format the value
      var $input = $("<input/>"), format;

      if (!columnDef.numberFormat) {
        format = "n0";
      }

      if (typeof columnDef.numberFormat === "function") {
        format = columnDef.numberFormat(dataContext, columnDef);
      } else if (typeof columnDef.numberFormat === "string") {
        format = columnDef.numberFormat;
      }

      $input.attr("data-number-format", format);

      if (columnDef.numberSourceFormat) {
        $input.attr("data-number-source-format",columnDef.numberSourceFormat);
      }

      $input.addClass((isNumeric ? "numericOnly" : "decimalOnly")).val(value);

      if (format) {
        $input.formatNumber();
      }
      value = $input.val();

      return "<div class='"+(isReadonly ? "uneditable " : " ")+ (columnDef.cssClass ? columnDef.cssClass : " alignRight") +"'>" + value + "</div>";
    },

    DecimalCellFormatter : function (row, cell, value, columnDef, dataContext) {
      if (!columnDef.numberFormat) {
        columnDef.numberFormat = "t9";
      }
      return IntegerCellFormatter(row, cell, value, columnDef, dataContext, false);
    },

    IndicatorIconFormatter: function (row, cell, value, columnDef, dataContext) {
      if (dataContext.indicator == "error" && dataContext.validationMessages) {
        return "<div class='indicator-icon inforAlertIconSmall error' title='" + dataContext.validationMessages.toString() + "'></div>";
      } else {
        return "<div class='indicator-icon inforAlertIconSmall " + dataContext.indicator + "' title='" + (dataContext.indicatorTooltip ? dataContext.indicatorTooltip : "") + "'></div>";
      }
    },
    UneditableColumnFormatter: function (row, cell, value, columnDef, dataContext) {
      var display = value;
      //Add some checks and encode empty stuff as &nbsp
      if (value==null || value==undefined || value=='' || (typeof value == "string" && value.replace(/\s/g,"") == ""))
        display="&nbsp";

      columnDef.editable=false;
      return "<div class='uneditable' >" + display + "</div>";
    },
    TreeRowFormatter : function (row, cell, value, columnDef, dataContext, gridOptions, gridObj) {
      if (value==null || value==undefined || value=='') {
        value = "";
      }

      if (typeof value == "string") {
        value = value.replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">");
      }

      gridOptions.treeGrid = true;

      var spacer = "<span style='float: "+ (Globalize.culture().isRTL ? "right" : "left")+ ";display:inline-block;height:1px;width:" + (14 * (dataContext["depth"] + (dataContext.isParent ? 0 : 1))) + "px'></span>";

      if (dataContext.isParent) {
        return spacer + "<button type='button' tabindex='-1' class='tree-expand inforIconButton  " + (dataContext.collapsed ? 'closed' : 'open') +"'><span></span></button>" + "<span>" + value +"</span>";
      }
      else {
        return spacer + "<span>" + value + "</span>";
      }
    },

    PercentFieldCellFormatter: function(row, cell, value, columnDef, dataContext) {
      return Globalize.format((typeof value =="string" ? parseFloat(value) : value), "p0");
    },

    ProgressBarCellFormatter: function(row, cell, value, columnDef, dataContext, options, grid) {
      var formatString = function(text, rowData, fieldIdArray) {
        if (fieldIdArray != undefined) {
          for (var i = 0; i < fieldIdArray.length; i++) {
            text = text.replace("{"+i+"}", rowData[fieldIdArray[i]]);
          }
        }

        return text;
      }

      var rangeOrder = ["azure", "emerald", "amber", "ruby", "tourmaline", "amethyst", "turquoise", "lightAmber", "lightAzure", "lightEmerald", "lightRuby", "lightTourmaline", "lightAmethyst", "lightTurquoise","deepAzure", "deepEmerald", "deepAmber", "deepRuby", "deepTourmaline", "deepAmethyst", "deepTurquoise"];
      var range = columnDef.meterRange || 1.0;
      var color = "lightAzure";
      var start, end;
      var tooltip = "";
      var columnId;
      var textvars;

      if (columnDef.ranges) {
        for (var index in rangeOrder) {
          if (columnDef.ranges.hasOwnProperty(rangeOrder[index])) {
            if (typeof columnDef.ranges[rangeOrder[index]]["start"] === "string") {
              columnId = columnDef.ranges[rangeOrder[index]]["start"];
              start = grid.getDataItemValueForColumn(dataContext, columnId);
            }
            else {
              start = columnDef.ranges[rangeOrder[index]]["start"];
            }

            if (typeof columnDef.ranges[rangeOrder[index]]["end"] === "string") {
              columnId = columnDef.ranges[rangeOrder[index]]["end"];
              end = grid.getDataItemValueForColumn(dataContext, columnId);
            }
            else {
              end = columnDef.ranges[rangeOrder[index]]["end"];
            }

            if (value >= start && value <= end) {
              color = rangeOrder[index];
              if (columnDef.ranges[color].tooltip != 'undefined') {
                textvars = columnDef.ranges[color].tooltipvars || [];
                tooltip = formatString(columnDef.ranges[color].tooltip, dataContext, textvars);
              }

              break;
            }
          }
        }
      }

      var decimalValue = (value / range),
      progressPercentage = decimalValue * 100 + "%",
      displayValue = PercentFieldCellFormatter(row, cell, decimalValue, columnDef, dataContext);

      return "<div class='inforProgressBar' style='width:100%;' title='" + tooltip + "'><span class='bar inforColor "+color +"' style='width:" + progressPercentage + "'></span><span class='text'>" + (columnDef.showPercent ? displayValue : "") + "</span></div>";
    },

    /*Editors*/
    TextCellEditor: function (args) {
      var $input;
      var defaultValue;
      // the different modes are:
      //  0: Override the current text.  This is similar to how excel works.  Left, Right will move left and right in the grid
      //  1:  Normal Edit Mode.  To get into this mode you have to press enter
      var mode = 0;
      this.init = function () {
        $(args.container).addClass("hasTextEditor");

        $input = $("<input data-mode='0' class='inforTextbox' "+(args.column && args.column.inputType=="password" ? " type='password'/>" : "type='text' />"  ))
          .appendTo(args.container)
          .on("keydown.nav", function (e) {
            if (mode === 1 && (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT))
            {
              e.stopImmediatePropagation();
            }
            else if (e.keyCode === 113)
            {
              // toggle the modes
              mode = mode === 0 ? 1 : 0;
              $input.attr("data-mode", mode);
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();

        if (args.column.cssClass)
          $input.addClass(args.column.cssClass);

        if (args.column.maxLength)
          $input.attr("maxLength",args.column.maxLength).maxLength();

        //auto commit on click out
        $input.blur(function() {
          args.grid.getEditController().conditionalAutoCommit();
        });

        $input.width($input.parent().width()-8);

        var isTreeFormatter = (args.column.formatter  ? args.column.formatter.toString().toLowerCase().indexOf("tree")>-1 : false);
        if (isTreeFormatter && args.item.isParent) {
          $input.width($input.parent().width()-22);
          $input.before('<span style="float: left;display:inline-block;height:1px;width:0px"></span><button type="button" style="position:relative;left:1px;top: 2px" tabindex="-1" class="tree-expand inforIconButton '+(args.item.collapsed ? "closed" : "open")+'"></button>');
        }
      };

      this.destroy = function () {
        $input.parent().removeClass("hasTextEditor");
        $input.remove();
      };

      this.focus = function () {
        $input.focus();
      };

      this.getValue = function () {
        var val = $input.val();
        return val;
      };

      this.setValue = function (val) {
        $input.val(val);
      };

      this.loadValue = function (item) {
        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field) || "";
        $input.val(defaultValue);
        $input[0].defaultValue = defaultValue;
        $input.select();
      };

      this.serializeValue = function () {
        var val = $input.val();
        $input.val(val);
        return val;
      };

      this.applyValue = function (item, state) {
        var val = state;
        args.grid.setDataItemValueForColumn(item, args.column.field, val);
      };

      this.isValueChanged = function () {
        return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
      };

      this.validate = function () {
        if (args.column.validator) {
          var validationResults = args.column.validator($input.val(), args.item);
          if (!validationResults.valid)
            return validationResults;
        }

        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    IntegerCellEditor: function (args, isDecimal) {
      var $input;
      var defaultValue;
      // the different modes are:
      //  0:  Override the current text.  This is similar to how excel works.  Left, Right will move left and right in the grid
      //  1:  Normal Edit Mode.  To get into this mode you have to press enter
      var mode = 0;
      this.init = function () {
        $(args.container).addClass("hasTextEditor");
        $input = $("<INPUT data-mode='0'  type=text class='inforTextbox alignRight' />");

        $input.on("keydown.nav", function (e) {
          if (mode === 1 && (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT))
            {
              e.stopImmediatePropagation();
            }
            else if (e.keyCode === 113)
            {
              // toggle the modes
              mode = mode === 0 ? 1 : 0;
              e.stopImmediatePropagation();
              $input.attr("data-mode", mode);
            }
        });

        $input.appendTo(args.container);
        $input
          .focus()
          .select()
          .addClass(isDecimal ? "decimalOnly" : "numericOnly")
          .numericOnly(isDecimal, (args.column.positiveOnly ? args.column.positiveOnly : false))
          .width($input.parent().width()-8)
          .blur(function() {  //auto commit on click out
            args.grid.getEditController().conditionalAutoCommit();
          });

        if (args.column.cssClass) {
          $input.addClass(args.column.cssClass);
        }
        if (args.column.maxLength) {
          $input.attr("maxLength",args.column.maxLength).maxLength();
        }
      };

      this.destroy = function () {
        $input.parent().removeClass("hasTextEditor");
        $input.remove();
      };

      this.focus = function () {
        $input.focus();
      };

      this.loadValue = function (item) {
        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field);
        $input.val(defaultValue);
        $input.formatNumber();
        $input[0].defaultValue = defaultValue;
        $input.select();
      };

      this.serializeValue = function () {
        if ($input.val()=="")
          return "";

       $input.formatNumber();
        var num = $input.val();
        num = Globalize.parseFloat(num, 10) || 0;
        return num;
      };

      this.applyValue = function (item, state) {
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {
        return (defaultValue==="" && $input.val() === "0") || ((!($input.val() === "" && defaultValue == null)) && (parseInt($input.val()) != defaultValue));
      };

      this.validate = function () {
        if (args.column.validator) {
          var validationResults = args.column.validator($input.val(), args.item);
          if (!validationResults.valid)
            return validationResults;
        }

        var val =($input.val()=="" ? "0" : $input.val());
        if (isNaN(parseInt(val))) {
          return {
            valid: false,
            msg: "Please enter a valid integer"
          };
        }
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    DecimalCellEditor: function (args) {
      var $input,
        defaultValue,
        format = "t9";
      // the different modes are:
      //  0:  Override the current text.  This is similar to how excel works.  Left, Right will move left and right in the grid
      //  1:  Normal Edit Mode.  To get into this mode you have to press enter
      var mode = 0;
      this.init = function () {
        $(args.container).addClass("hasTextEditor");
        $input = $("<INPUT data-mode='0'  type=text class='inforTextbox alignRight' />");

        $input.on("keydown.nav", function (e) {
          if (mode === 1 && (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT))
          {
            e.stopImmediatePropagation();
          }
          else if (e.keyCode === 113)
          {
            // toggle the modes
            mode = mode === 0 ? 1 : 0;
            e.stopImmediatePropagation();
            $input.attr("data-mode", mode);
          }
        });

        $input.appendTo(args.container);
        $input.focus()
          .select()
          .addClass("decimalOnly")
          .width($input.parent().width()-8)
          .blur(function() {  //auto commit on click out
              args.grid.getEditController().conditionalAutoCommit();
            });

        if (args.column.numberFormat) {
          this.format = args.column.numberFormat;
        }

        if (typeof args.column.numberFormat === "function") {
          this.format = args.column.numberFormat(args.item, args.column);
        }

        $input.attr("data-number-format", this.format);

        if (args.column.numberSourceFormat)
          $input.attr("data-number-source-format",args.column.numberSourceFormat);

        if (args.column.cssClass) {
          $input.addClass(args.column.cssClass);
        }
        if (args.column.maxLength) {
          $input.attr("maxLength",args.column.maxLength).maxLength();
        }
      };

      this.destroy = function () {
        $input.parent().removeClass("hasTextEditor");
        $input.remove();
      };

      this.focus = function () {
        $input.focus();
      };

      this.loadValue = function (item) {
        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field);
        $input.val(defaultValue);
        if (args.column.numberFormat) {
          $input.formatNumber();
          $input.numericOnly(true);
        }
        $input[0].defaultValue = defaultValue;
        $input.select();
      };

      this.serializeValue = function () {
        if ($input.val()=="")
          return "";

        return Globalize.parseFloat($input.val()) || 0;
      };

      this.applyValue = function (item, state) {
        var targetValue = state;
        var currentValue = args.grid.getDataItemValueForColumn(item, args.column.field);
        if (typeof currentValue === "string") {
          targetValue = Globalize.format(state, args.column.numberFormat);
        }

        args.grid.setDataItemValueForColumn(item, args.column.field, targetValue);
      };

      this.isValueChanged = function () {
        return (defaultValue==="" && $input.val()==="0") || ((!($input.val() == "" && defaultValue == null)) && ((typeof state === "string"  ? $input.val() : Globalize.parseFloat($input.val()) ) != defaultValue));
      };

      this.validate = function () {
        if (args.column.validator) {
          var validationResults = args.column.validator($input.val(), args.item);
          if (!validationResults.valid)
            return validationResults;
        }
        var val =($input.val()=="" ? "0" : $input.val());
        if (isNaN(Globalize.parseFloat(val))) {
          return {
            valid: false,
            msg: "Please enter a valid decimal"
          };
        }
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    DateCellEditor: function (args) {
      var $input;
      var defaultValue;
      var calendarOpen = false;
      var showFormat =  Globalize.culture().calendar.patterns.d;
      var sourceFormat = undefined; //date format...

      this.init = function () {
        if(args.column.DateShowFormat != undefined){
          showFormat = args.column.DateShowFormat;
        }
        $input = $('<input data-mode="0" class="inforDateField" type="text" />');
        $input.appendTo(args.container);
        $(args.container).addClass("haseditor");

        var options = {dateFormat: showFormat};
        if (args.column.editorOptions)
          options = args.column.editorOptions;

        $input.focus()
          .select()
          .width($input.parent().width()-26)
          .inforDateField(options)
          .blur(function() {  //auto commit on click out
              args.grid.getEditController().conditionalAutoCommit();
          })
          .closest(".inforTriggerField").parent().addClass("hasDateEditor");

        $input.on('keydown.grid', function (e) {
          if (e.keyCode === $.ui.keyCode.LEFT ||
              e.keyCode === $.ui.keyCode.RIGHT ||
              e.keyCode === $.ui.keyCode.UP ||
              e.keyCode === $.ui.keyCode.DOWN) {

            if ($('#inforDatePicker-div').is(':visible')) {
              e.stopImmediatePropagation();
            }
          }
        });

        if (args.column.cssClass) {
          $input.addClass(args.column.cssClass);
        }
        if (args.column.maxLength) {
          $input.attr("maxLength",args.column.maxLength).maxLength();
        }
      };

      this.destroy = function () {
        $.datepicker.dpDiv.stop(true, true);
        $input.datepicker("hide");
        $input.datepicker("destroy");
        $input.closest(".inforTriggerField").parent().removeClass("hasDateEditor");
        $input.remove();
        $(args.container).removeClass("haseditor");
      };

      this.show = function () {
        if (calendarOpen) {
          $.datepicker.dpDiv.stop(true, true).show();
        }
      };

      this.hide = function () {
        if (calendarOpen) {
          $.datepicker.dpDiv.stop(true, true).hide();
        }
      };

      this.position = function (position) {
        if (!calendarOpen) return;
        $.datepicker.dpDiv
          .css("top", position.top + 30)
          .css("left", position.left);
      };

      this.focus = function () {
        $input.focus();
      };

      this.loadValue = function (item) {
        var thedate = null,
          isUtc = (args.column.editorOptions ? args.column.editorOptions.showUTCTime == true : false);

        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field);

        if (args.column.editorOptions && isUtc) {
          thedate = (defaultValue === '' ? '' : Globalize.parseUtcDate(defaultValue));
        } else if (Object.prototype.toString.call(defaultValue) === '[object Date]') {  //date objects as source.
          thedate = defaultValue;
        } else if (args.column.DateSourceFormat=="JSON"){
          thedate = (!defaultValue || defaultValue === '' ? '' : new Date(parseInt(defaultValue.substr(6))));
        } else if (args.column.DateSourceFormat != undefined) {//string dates as source
          sourceFormat = args.column.DateSourceFormat;
          thedate =  $.datepicker.parseDate(defaultValue,sourceFormat);
        }

        if (defaultValue) {
          defaultValue =  $.datepicker.formatDate(thedate, showFormat);
          if (isUtc && showFormat.indexOf("zzz") > -1) {
            defaultValue = defaultValue.substr(0, defaultValue.length - 6) + "+00:00";
          }
        }

        $input.val(defaultValue);
        $input[0].defaultValue = defaultValue;
        $input.select();
      };

      this.serializeValue = function () {
        var thedate = $.datepicker.parseDate($input.val(),showFormat),
          utcDate = "",
          colOpts = args.column.editorOptions;

        if (colOpts && colOpts.showUTCTime == true) {
          return ($input.val() === '' ? null : parseInt($input.attr("data-utcmillis"), 10));
        }

        if (sourceFormat != undefined) {
          return $.datepicker.formatDate(thedate, sourceFormat);
        }

        return (thedate==undefined ? "" : thedate)
      };

      this.applyValue = function (item, state) {
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {
        return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
      };

      this.validate = function () {
        if (args.column.validator) {
          var validationResults = args.column.validator($input.val(), args.item);
          if (!validationResults.valid)
            return validationResults;
        }
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    CheckboxCellEditor: function (args) {
      var $checkbox;
      var defaultValue;

      this.init = function () {
        var self = this;

        $checkbox = $('<input  tabindex="-1"  class="inforCheckbox" id="checkeditor" type="checkbox"><label for="checkeditor" class="inforCheckboxLabel"></label>');
        $checkbox.appendTo(args.container);

        $checkbox.click(function() {  //auto commit on click out
            args.grid.getEditController().commitCurrentEdit();
        });

        $(args.container).addClass("hasCheckboxes");
        $checkbox.focus();
      };

      this.destroy = function () {
        $checkbox.parent();
        $checkbox.remove();
        $(document).unbind("keydown.celledit");
        $(args.container).removeClass("hasCheckboxes");
      };

      this.focus = function () {
        $checkbox.focus();
      };

      this.loadValue = function (item, isClick) {
        var self = this;
         defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field);

        if (defaultValue == undefined || defaultValue == null) {
          defaultValue = false;
        }

        if (defaultValue == true) {
          $checkbox.prop('checked', true);
        } else {
          $checkbox.prop('checked', false);
        }

        if (args.column.editability !=undefined && args.column.editability(args.row, args.cell, defaultValue, args.column, item)) {
          $checkbox.focus();
          return;
        }

        if (isClick) {

          $checkbox.toggleChecked();
          args.grid.getEditController().commitCurrentEdit();
          setTimeout(function () {
            $checkbox.focus();
          }, 300);
        }

        $checkbox.focus();
      };

      this.serializeValue = function () {
        var isChecked = $checkbox.is(":checked");
        if (typeof(defaultValue)== "string") {
          if (isChecked) {
            return "1";
          }
          else {
            return "0";
          }
        }
        else if (typeof(defaultValue) == "boolean") {
          return isChecked;
        }
        else if (defaultValue == 1 || defaultValue == 0) {
          if (isChecked) {
            return 1;
          }
          else {
            return 0;
          }
        }
        else
        {
          return false;
        }
      };

      this.applyValue = function (item, state) {
        if (args.column.editability != undefined && args.column.editability(args.row, args.cell, defaultValue, args.column, item)) {
          return;
        }
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {

        isChecked = $checkbox.is(":checked");
        if (typeof(defaultValue)== "string") {
          return !((defaultValue == "1" && isChecked) || (defaultValue == "0" && !isChecked));
        }
        else if (defaultValue == 1 || defaultValue == 0) {
          return !((defaultValue == 1 && isChecked) || (defaultValue == 0 && !isChecked));
        }
        else if (typeof(defaultValue) == "boolean") {
          return !((defaultValue && isChecked) || (!defaultValue && !isChecked));
        }
        else
          return true;
      };

      this.validate = function () {
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    SelectCellEditor: function (args) {
      var $select,
      id =  args.column.id + '-select',
      defaultValue, option_str, dropDownOptions,
      isCodeList =  args.column.options && args.column.options[0] && args.column.options[0].value!=undefined && args.column.options[0].label!=undefined;

      this.init = function () {

        var self = this,
          option_str = "",
          //lookup the value in the options..
          dropDownOptions = [];

        if (args.column.options) {
          dropDownOptions = args.column.options;
        }

        if (typeof(dropDownOptions) == "function") {
          dropDownOptions = args.column.options("", '', args.item);
        }

        //Execute Source..
        if (args.column.editorOptions && args.column.editorOptions.source) {
          var response = function(data) {
            dropDownOptions = data;
          }
          args.column.editorOptions.source("", response, false, args.item);
        }

        for (var i = 0; i < dropDownOptions.length; i++) {
          v = dropDownOptions[i];
          if (v.value!=undefined && v.label!=undefined)
            option_str += "<OPTION value='" + $.escape(v.value) + "' "+($.escape(args.item[args.column.field])==$.escape(v.value) ? "selected " : "") +">" + (v.label === "&nbsp;" ? "&nbsp;" : $.escape(v.label)) + "</OPTION>";
          else
            option_str += "<OPTION value='" + $.escape(v) + "' "+($.escape(args.item[args.column.field])==$.escape(v) ? "selected " : "") +">" + (v === '&nbsp;' ? v : $.escape(v)) + "</OPTION>";
        }

        $select = $("<SELECT>" + option_str + "</SELECT>").attr('id', id);
        $select.appendTo(args.container);
        $select.css("width", parseInt($select.parent().css("width"), 10) - 21 + "px");
        $select.before($('<label class="scr-only label">'+ args.column.name +'</label>').attr('for', id));
        $select.dropdown(args.column.editorOptions);

        $select.before('<label class="scr-only label">'+ args.column.name +'</label>');
        $select.addClass("inforDataGridDropDownList");
        $(args.container).addClass("haseditor hasComboEditor");

        $select.off('change');
        $select.on('change', function () {
          var cellValue = self.serializeValue();

          /*ignore jslint start*/
          if (cellValue && self.previousValue != cellValue) {
          /*ignore jslint end*/
            defaultValue = cellValue;
            self.isChanged = true;
            self.previousValue = cellValue;
            self.applyValue(args.item, cellValue);
            args.grid.trigger(args.grid.onCellChange, {
              row: args.grid.getActiveCell().row,
              cell: args.grid.getActiveCell().cell,
              item: args.item,
              cellValue : cellValue,
              previousCellValue: self.previousValue
            });
          }
        });

        this.previousValue = args.grid.getDataItemValueForColumn(args.item, args.column.field);
        this.isChanged = false;
        $select.next().next().focus();
      };

      this.destroy = function () {
        $(args.container).removeClass("haseditor hasComboEditor");
        $select.remove();
      };

      this.getValuePairs = function () {
        var ret = {},
          idx = $select[0].selectedIndex;

        if (idx > -1 &&  $select[0].options[idx]) {
          ret = {label: $select[0].options[idx].text, value: $select[0].options[idx].text, id: $select[0].options[idx].value};
        }
        return ret;
      };

      this.loadValue = function (item) {
        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field);
        if (isCodeList)
          $select.dropdown("setCode", defaultValue, true);
        else {
          $select.setValue(defaultValue);
          $select.val(defaultValue);
        }
      };

      this.getSelected = function () {
        var ret = null,
          idx = $select[0].selectedIndex;

        if (idx > -1 &&  $select[0].options[idx]) {
          ret = (isCodeList ?  $select[0].options[idx].value :  $select[0].options[idx].text);
        }
        return ret;
      }

      this.serializeValue = function () {
        return this.getSelected();
      };

      this.applyValue = function (item, state) {
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {
        var isChanged = false,
          newValue = this.getSelected();

        isChanged = ($.trim(newValue) !== $.trim(defaultValue));
        return (this.isChanged || isChanged);
      };

      this.validate = function () {
        var val = null,
          val = this.getSelected();

        if (args.column.validator) {
          var validationResults = args.column.validator(val, args.item);
          if (!validationResults.valid)
            return validationResults;
        }

        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    LookupCellEditor: function (args) {
      var $lookup,
        defaultValue,
        displayValue;
      // the different modes are:
      //  0: Override the current text.  This is similar to how excel works.  Left, Right will move left and right in the grid
      //  1:  Normal Edit Mode.  To get into this mode you have to press enter
      var mode = 0;
      this.init = function () {

        $(args.container).addClass("hasComboEditor hasEditor");

        $lookup = $('<input data-mode="0" class="inforLookupField" type="text">');
        $lookup.appendTo(args.container)
            .width($lookup.parent().width()-30)
            .inforLookupField(args.column.editorOptions)

            .blur(function() {
              args.grid.getEditController().conditionalAutoCommit();
            })
            .on("keydown.nav", function (e) {
                if (e.keyCode === $.ui.keyCode.UP || e.keyCode === $.ui.keyCode.DOWN ) {
                  return;
                }
                if (args.grid.getOptions().allowTabs && e.keyCode === $.ui.keyCode.TAB) {
                  return;
                }
                if (e.keyCode === $.ui.keyCode.LEFT || e.keyCode === $.ui.keyCode.RIGHT) {
                  return;
                }

                if (args.column.editorOptions && args.column.editorOptions.editable) {
                  $lookup.data("isChanged", true);
                }

                // if (e.keyCode === 13) {
                //   e.stopImmediatePropagation();
                //   return;
                // }
            })
            .closest("div.inforTriggerField").find(".inforTriggerButton").click(function() {
              $lookup.val(displayValue);
            });

        var filterType = (args.column.editorOptions && args.column.editorOptions.lookupFilterType)
            ? args.column.editorOptions.lookupFilterType.call() : "TextFilter";

        if (filterType == "IntegerFilter") {
          $lookup.addClass("decimalOnly");
        }

        if (filterType == "DecimalFilter" || filterType == "PercentFilter") {
          $lookup.addClass("numericOnly");
        }

        if (filterType == "IntegerFilter" || filterType == "DecimalFilter" || filterType == "PercentFilter") {
          var isDecimal = (filterType == "IntegerFilter" ? false : true);
          $lookup.numericOnly(isDecimal, (args.column.positiveOnly ? args.column.positiveOnly : false))
        }

        if (args.column.cssClass)
          $lookup.addClass(args.column.cssClass);

        if (args.column.maxLength)
          $lookup.attr("maxLength",args.column.maxLength).maxLength();
      };

      this.destroy = function () {
        var returnVal = $lookup.data("returnVal");
        $(args.container).removeClass("hasComboEditor hasEditor");
        if (returnVal) {
          $lookup.val(returnVal);
          $lookup.data("returnVal","");
        }
        if ($lookup.data("uiInforLookupField")) {
          $lookup.inforLookupField("destroy");
        }
        $(".inforLookupGridBoxShadow").remove();
        $("#inforLookupOverlay").remove();
      };

      this.focus = function () {
        $lookup.focus();
      };

      this.loadValue = function (item) {
        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field);

        //set the codes ....
        if (defaultValue) {
          var codes = defaultValue.toString().split(",");
          $lookup.inforLookupField("setCode",codes).select();
          displayValue = $lookup.val();
        }

        //some codes might not be in the list - free typed
        if (args.column.editorOptions && (args.column.editorOptions.editable || args.column.editorOptions.click)) {
          //defaultValue = item[args.column.field];
          displayValue = defaultValue;
          $lookup.val(defaultValue);
        }

        $lookup.select().focus();
      };

      this.getCodeList = function() {
        var selectList = $lookup.inforLookupField("getSelectedValues"),
          codeList = "";

        if (args.column.editorOptions.editable  || args.column.editorOptions.click) {
          codeList = $lookup.val();
          return codeList;
        }

        for (i=0; i<selectList.length ;i++) {
          if (selectList[i]) {
            codeList = codeList + selectList[i].id.toString()+(i==selectList.length-1 ? "" : ",");
          }
        }
        return codeList;
      }

      this.serializeValue = function () {
      if ($lookup.data("isChanged")) {
          return this.getCodeList();
        } else {
          return defaultValue;
        }
      };

      this.applyValue = function (item, state) {
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {
        return $lookup.data("isChanged");
      }

      this.validate = function () {
        if (args.column.validator) {
          var validationResults = args.column.validator($lookup.val(), args.item);
          if (!validationResults.valid)
            return validationResults;
        }

        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    LongTextCellEditor: function (args) {
      var $input, $wrapper;
      var defaultValue;
      var scope = this;
      // the different modes are:
      //  0:  Override the current text.  This is similar to how excel works.  Left, Right will move left and right in the grid
      //  1:  Normal Edit Mode.  To get into this mode you have to press enter
      var editMode = 0;

      this.init = function () {
        $wrapper = args.grid.showCommentsPopup(args.position,"", true);
        $input = $wrapper.find("textarea");

        $wrapper.find(".inforCancelButton").on("click", this.saveAndClose);
        $input.on("keydown", this.handleKeyDown);
        $input.attr("data-mode", 0);
        //scope.position(args.position);
        $input.focus().select()
          .blur(function() {  //auto commit on click out
            args.grid.getEditController().conditionalAutoCommit();
          });

        if (args.column.maxLength) {
          $input.attr("maxLength", args.column.maxLength).maxLength();
        }
      };

      this.handleKeyDown = function (e)
      {
        if (e.which == $.ui.keyCode.ENTER && e.ctrlKey) {
          scope.save();
        }
        else if (e.which == $.ui.keyCode.ESCAPE) {
          e.preventDefault();
          scope.cancel();
        }
        else if (editMode === 0 && e.keyCode === $.ui.keyCode.RIGHT ) {
          e.stopImmediatePropagation();
          args.grid.navigateNext();
        }
        else if (editMode === 0 && e.keyCode === $.ui.keyCode.LEFT ) {
          e.stopImmediatePropagation();
          args.grid.navigatePrev();
        }
        else if (e.keyCode === 113)
        {
          // toggle the modes
          editMode = editMode === 0 ? 1 : 0;
          editMode = editMode;
          e.stopImmediatePropagation();
          $input.attr("data-mode", editMode);
        }


      };

      this.save = function () {
        args.commitChanges();
        $wrapper.remove();
      };

      this.saveAndClose = function () {
      args.grid.getEditorLock().commitCurrentEdit();
      };

      this.cancel = function () {
        $input.val(defaultValue);
        args.cancelChanges();
      };

      this.hide = function () {
        $wrapper.hide();
      };

      this.show = function () {
        $wrapper.show("fadeIn");
      };

      this.destroy = function () {
        $wrapper.hide();
      };

      this.focus = function () {
        $input.focus();
      };

      this.loadValue = function (item) {
        $input.val(defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field));
        $input.select();
      };

      this.serializeValue = function () {
        return $input.val();
      };

      this.applyValue = function (item, state) {
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {
      return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
      };

      this.validate = function () {
        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    },

    MultiLineTextCellEditor: function (args) {
      var $input,
        defaultValue;
      // the different modes are:
      //  0:  Override the current text.  This is similar to how excel works.  Left, Right will move left and right in the grid
      //  1:  Normal Edit Mode.  To get into this mode you have to press enter
      var mode = 0;
      this.init = function () {
        $(args.container).addClass("hasTextEditor");

        $input = $("<textarea  data-mode='0'  type=text class='inforTextArea' />")
          .appendTo(args.container)
          .on("keydown.nav", function (e) {
            if (mode === 0 && e.keyCode === $.ui.keyCode.RIGHT ) {
              e.stopImmediatePropagation();
              args.grid.navigateNext();
            }
            else if (mode === 0 && e.keyCode === $.ui.keyCode.LEFT ) {
              e.stopImmediatePropagation();
              args.grid.navigatePrev();
            }
            else if (e.keyCode === 113) {
              // toggle the modes
              mode = mode === 0 ? 1 : 0;
              e.stopImmediatePropagation();
              $input.attr("data-mode", mode);
            } else if (e.keyCode === 13) {
              e.stopImmediatePropagation();
            }
          })
          .focus()
          .select();

        $input.width($input.parent().width()-10).height($input.closest(".slick-row").height()-15);
        //auto commit on click out
        $input.blur(function() {
          args.grid.getEditController().conditionalAutoCommit();
        });

        if (args.column.maxLength) {
          $input.attr("maxLength", args.column.maxLength).maxLength();
        }
      };

      this.destroy = function () {
        $input.parent().removeClass("hasTextEditor");
        $input.remove();
      };

      this.focus = function () {
        $input.focus();
      };

      this.getValue = function () {
        return $input.val();
      };

      this.setValue = function (val) {
        $input.val(val);
      };

      this.loadValue = function (item) {
        defaultValue = args.grid.getDataItemValueForColumn(item, args.column.field) || "";
        $input.val(defaultValue);
        $input[0].defaultValue = defaultValue;
        $input.select();
      };

      this.serializeValue = function () {
        return $input.val();
      };

      this.applyValue = function (item, state) {
        args.grid.setDataItemValueForColumn(item, args.column.field, state);
      };

      this.isValueChanged = function () {
        return (!($input.val() == "" && defaultValue == null)) && ($input.val() != defaultValue);
      };

      this.validate = function () {
        if (args.column.validator) {
          var validationResults = args.column.validator($input.val(), args.item);
          if (!validationResults.valid)
            return validationResults;
        }

        return {
          valid: true,
          msg: null
        };
      };

      this.init();
    }
  };

  $.extend(window, SlickEditor);

})($);

/*
* InforDataGrid DataView
*/
(function ($) {
  $.extend(true, window, {
    Slick: {
      Data: {
        DataView: DataView,
        Aggregators: {
          Avg: AvgAggregator,
          Min: MinAggregator,
          Max: MaxAggregator,
          Sum: SumAggregator
        }
      }
    }
  });

  /*
  * Relies on the data item having an "id" property uniquely identifying it.
  */
  function DataView(options) {
    var self = this;

    var defaults = {
      groupItemMetadataProvider: null
    };

    // private
    var idProperty = "id"; // property holding a unique row id

    if (options!=undefined && options.idProperty!=undefined)
      idProperty=options.idProperty;

    var items = []; // data by index
    var rows = []; // data by row
    var idxById = {}; // indexes by id
    var rowsById = null; // rows by id; lazy-calculated
    var filter = null; // filter function
    var updated = null; // updated item ids
    var suspend = false; // suspends the recalculation
    var sortComparer;
    var filters = null; //filter expressions
    var isFirstPage = false;
    var isLastPage = false;
    var sortColumns = [];

    // grouping
    var groupingGetter;
    var groupingGetterIsAFn;
    var groupingFormatter;
    var groupingComparer;
    var groups = [];
    var collapsedGroups = {};
    var aggregators;
    var aggregateCollapsed = false;

    var pagesize = 0;
    var pagenum = 0;
    var totalRows = 0;
    var activeReq = false; //active request?

    // events
    var onRowCountChanged = new Slick.Event();
    var onRowsChanged = new Slick.Event();
    var onPagingInfoChanged = new Slick.Event();
    var onPageRequested = new Slick.Event();
    var onDataLoading = new Slick.Event();
    var onDataLoaded = new Slick.Event();
    var onAggregatorsChanged = new Slick.Event();

    options = $.extend(true, {}, defaults, options);

    function beginUpdate() {
      suspend = true;
    }

    function endUpdate(hints) {
      suspend = false;
      refresh(hints);
    }

    function setIdProperty(args) {
      idProperty = args;
    }

    function updateIdxById(startingIndex) {
      startingIndex = startingIndex || 0;
      var id;
      for (var i = startingIndex, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id === undefined) {
          throw "Each data element must implement a unique 'id' property";
        }
        idxById[id] = i;
      }
    }

    function ensureIdUniqueness() {
      var id;
      for (var i = 0, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id === undefined || idxById[id] !== i) {
          throw "Each data element must implement a unique 'id' property";
        }
      }
    }

    function getItems() {
      return items;
    }

    //Get the Max Value in the id column
    function getMaxId() {
      var maxId = -1;
      for (var i = 0, l = items.length; i < l; i++) {
        id = items[i][idProperty];
        if (id > maxId)
          maxId = id;
      }

      return maxId;
    }

    function setItems(data, objectIdProperty) {
      if (objectIdProperty !== undefined) idProperty = objectIdProperty;
      items = data;
      idxById = {};
      updateIdxById();
      ensureIdUniqueness();
      refresh();
    }

    function setPagingOptions(args, action) {
      if (args == undefined) {
        return;
      }

      if (args.filters != undefined)
        filters = args.filters;

      if (args.sortColumns != undefined)
        sortColumns = args.sortColumns;

      if (args.pageSize != undefined) {
        pagesize = args.pageSize;
        pagenum = Math.min(pagenum, Math.floor(totalRows / pagesize));
      }

      if (args.isLastPage != undefined)
        isLastPage = args.isLastPage;

      if (args.isFirstPage != undefined)
        isFirstPage = args.isFirstPage;

      if (args.pageNum != undefined) {
        var newPage = (args.pageNum != pagenum);

        if (options.pagingMode=="PagerClientSide")
          pagenum = Math.min(args.pageNum, Math.ceil(totalRows / pagesize));
        else
          pagenum = args.pageNum;

        if (newPage && args.totalRows==undefined) {
          requestNewPage(action);
          if (options.pagingMode=="PagerServerSide")
            return;
        }
      }

      if (args.totalRows != undefined) {
        if (getPagingInfo().totalRows!=args.totalRows) {
          totalRows = args.totalRows;
          onPagingInfoChanged.notify(getPagingInfo(), null, self);
        }
        onDataLoaded.notify(getPagingInfo());
        return; //dont call refresh if we explicitly set this..
      }

      onPagingInfoChanged.notify(getPagingInfo(), null, self);
      refresh();
    }

    function requestNewPage(operation) {
      var pageInfo = getPagingInfo();
      pageInfo.operation = operation;

      if (options.pagingMode!="PagerClientSide" && options.pagingMode!="None") {
        onDataLoading.notify(pageInfo);
      }
      onPageRequested.notify(pageInfo, null, self);
    }

    function getPagingInfo() {
      return { pageSize: pagesize, pageNum: pagenum, totalRows: totalRows,
        filters: filters, sortColumns: sortColumns, isLastPage: isLastPage, isFirstPage : isFirstPage};
    }

    function sort(comparer, ascending) {
      sortAsc = ascending;
      sortComparer = comparer;

      if (ascending === false) items.reverse();
      items.sort(comparer);
      if (ascending === false) items.reverse();
      idxById = {};
      updateIdxById();
      refresh();
    }

    function reSort() {
      if (sortComparer) {
        sort(sortComparer, sortAsc);
      }
    }

    function setFilter(filterFn) {
      filter = filterFn;
      refresh();
    }

    function groupBy(valueGetter, valueFormatter, sortComparer) {
      if (!options.groupItemMetadataProvider) {
        options.groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      }

      groupingGetter = valueGetter;
      groupingGetterIsAFn = typeof groupingGetter === "function";
      groupingFormatter = valueFormatter;
      groupingComparer = sortComparer;
      collapsedGroups = {};
      groups = [];
      refresh();
    }

    function setAggregators(groupAggregators, includeCollapsed) {
      aggregators = groupAggregators;
      aggregateCollapsed = includeCollapsed !== undefined ? includeCollapsed : aggregateCollapsed;
      refresh();
      onAggregatorsChanged.notify(getPagingInfo(), null, self);
    }

    function getAggregators() {
      return aggregators;
    }

    function getItemByIdx(i) {
      return items[i];
    }

    function getIdProperty() {
      return idProperty;
    }

    function getIdxById(id) {
      return idxById[id];
    }

    // calculate the lookup table on first call
    function getRowById(id) {
      if (!rowsById) {
        rowsById = {};
        for (var i = 0, l = rows.length; i < l; ++i) {
          rowsById[rows[i][idProperty]] = i;
        }
      }

      return rowsById[id];
    }

    function getRowIdx(row) {
      for (var i = 0, l = rows.length; i < l; ++i) {
        if (rows[i][idProperty]==row[idProperty])
          return i;
      }
      return -1;
    }

    function getItemById(id) {
      return items[idxById[id]];
    }

    function updateItem(id, item) {
      if (idxById[id] === undefined || id !== item[idProperty])
        throw "Invalid or non-matching id";
      items[idxById[id]] = item;
      if (!updated) updated = {};
      updated[id] = true;
      refresh();
    }

    function insertItem(insertBefore, item) {
      items.splice(insertBefore, 0, item);
      updateIdxById(insertBefore);
      refresh();
    }

    function addItem(item) {
      items.push(item);
      updateIdxById(items.length - 1);
      refresh();
    }

    function deleteItem(id) {
      var idx = idxById[id];
      if (idx === undefined) {
        throw "Invalid id";
      }
      delete idxById[id];
      items.splice(idx, 1);
      updateIdxById(idx);
      refresh();
    }

    function getLength() {
      return rows.length;
    }

    function getItem(i) {
      return rows[i];
    }

    function getItemMetadata(i) {
      var item = rows[i];
      if (item === undefined) {
        return null;
      }

      // overrides for group rows
      if (item.__group) {
        return options.groupItemMetadataProvider.getGroupRowMetadata(item);
      }

      // overrides for totals rows
      if (item.__groupTotals) {
        return options.groupItemMetadataProvider.getTotalsRowMetadata(item);
      }

      return null;
    }

    function collapseGroup(groupingValue) {
      collapsedGroups[groupingValue] = true;
      refresh();
    }

    function expandGroup(groupingValue) {
      delete collapsedGroups[groupingValue];
      refresh();
    }

    function getGroups() {
      return groups;
    }

    function extractGroups(rows) {
      var group;
      var val;
      var groups = [];
      var groupsByVal = {};
      var r;

      for (var i = 0, l = rows.length; i < l; i++) {
        r = rows[i];
        val = (groupingGetterIsAFn) ? groupingGetter(r) : r[groupingGetter];
        group = groupsByVal[val];
        if (!group) {
          group = new Slick.Group();
          group.count = 0;
          group.value = val;
          group.rows = [];
          groups[groups.length] = group;
          groupsByVal[val] = group;
        }

        group.rows[group.count++] = r;
      }

      return groups;
    }

    // TODO: lazy totals calculation
    function calculateGroupTotals(group) {
      var r, idx;

      if (group.collapsed && !aggregateCollapsed) {
        return;
      }

      idx = aggregators.length;
      while (idx--) {
        aggregators[idx].init();
      }

      for (var j = 0, jj = group.rows.length; j < jj; j++) {
        r = group.rows[j];
        idx = aggregators.length;
        while (idx--) {
          aggregators[idx].accumulate(r);
        }
      }

      var t = new Slick.GroupTotals();
      idx = aggregators.length;
      while (idx--) {
        aggregators[idx].storeResult(t);
      }
      t.group = group;
      group.totals = t;
    }

    function calculateTotals(groups) {
      var idx = groups.length;
      while (idx--) {
        calculateGroupTotals(groups[idx]);
      }
    }

    function finalizeGroups(groups) {
      var idx = groups.length, g;
      while (idx--) {
        g = groups[idx];
        g.collapsed = (g.value in collapsedGroups);
        g.title = groupingFormatter ? groupingFormatter(g) : g.value;
      }
    }

    function flattenGroupedRows(groups) {
      var groupedRows = [], gl = 0, g;
      for (var i = 0, l = groups.length; i < l; i++) {
        g = groups[i];
        groupedRows[gl++] = g;

        if (!g.collapsed) {
          for (var j = 0, jj = g.rows.length; j < jj; j++) {
            groupedRows[gl++] = g.rows[j];
          }
        }

        if (g.totals && (!g.collapsed || aggregateCollapsed)) {
          groupedRows[gl++] = g.totals;
        }
      }
      return groupedRows;
    }

    function getFilteredAndPagedItems(items, filter) {
      var pageStartRow = (items.length == pagesize) ? 0 : pagesize * pagenum;
      var pageEndRow = pageStartRow + pagesize;

      if (options.pagingMode=="PagerServerSide") {
        pageStartRow = 0;
        pageEndRow = items.length;
      }
      var itemIdx = 0, rowIdx = 0, item;
      var continousMode = options.pagingMode=="ContinuousScrolling";
      var newRows = [];

      // filter the data and get the current page if paging
      if (filter) {
        for (var i = 0, il = items.length; i < il; ++i) {
          item = items[i];

          if (!filter || filter(item)) {
            if ((continousMode ? true : !pagesize) || (itemIdx >= pageStartRow && itemIdx < pageEndRow)) {
              newRows[rowIdx] = item;
              rowIdx++;
            }
            itemIdx++;
          }
        }
      }
      else {
        if (items.concat) {
          newRows = pagesize ? items.slice(pageStartRow, pageEndRow) : items.concat();
        }
        itemIdx = items.length;
      }

      return { totalRows: itemIdx, rows: newRows };
    }

    function getRowDiffs(rows, newRows) {
      var item, r, eitherIsNonData, diff = [];
      for (var i = 0, rl = rows.length, nrl = newRows.length; i < nrl; i++) {
        if (i >= rl) {
          diff[diff.length] = i;
        }
        else {
          item = newRows[i];
          r = rows[i];

          if ((groupingGetter && (eitherIsNonData = (item.__nonDataRow) || (r.__nonDataRow)) &&
              item.__group !== r.__group ||
              item.__updated ||
              item.__group && !item.equals(r))
            || (aggregators && eitherIsNonData &&
          // no good way to compare totals since they are arbitrary DTOs
          // deep object comparison is pretty expensive
          // always considering them 'dirty' seems easier for the time being
              (item.__groupTotals || r.__groupTotals))
            || item[idProperty] != r[idProperty]
            || (updated && updated[item[idProperty]])
            ) {
            diff[diff.length] = i;
          }
        }
      }
      return diff;
    }

    function recalc(_items, _rows, _filter) {
      rowsById = null;

      var newRows = [];

      var filteredItems = getFilteredAndPagedItems(_items, _filter);

      if (options.pagingMode!="PagerServerSide")
        totalRows = filteredItems.totalRows;

      newRows = filteredItems.rows;

      groups = [];
      if (groupingGetter != null) {
        groups = extractGroups(newRows);
        if (groups.length) {
          finalizeGroups(groups);
          if (aggregators) {
            calculateTotals(groups);
          }
          if (groupingComparer)
            groups.sort(groupingComparer);
          newRows = flattenGroupedRows(groups);
        }
      } else {
        //calculate summaryRow totals - also using aggregators.
        if (aggregators) {
          groups = extractGroups(newRows);
          calculateTotals(groups);
        }
      }

      var diff = getRowDiffs(_rows, newRows);
      rows = newRows;

      return diff;
    }

    function refresh() {
      if (suspend) return;

      var countBefore = rows.length;
      var totalRowsBefore = totalRows;

      var diff = recalc(items, rows, filter); // pass as direct refs to avoid closure perf hit

      // if the current page is no longer valid, go to last page and recalc
      // we suffer a performance penalty here, but the main loop (recalc) remains highly optimized
      if (pagesize && totalRows < pagenum * pagesize) {
        pagenum = Math.floor(totalRows / pagesize);
        diff = recalc(items, rows, filter);
      }

      updated = null;

      if (totalRowsBefore != totalRows && options.pagingMode!="PagerServerSide") {
        onPagingInfoChanged.notify(getPagingInfo(), null, self);
      }

      if (countBefore != rows.length)
        onRowCountChanged.notify({ previous: countBefore, current: rows.length }, null, self);

      if (diff.length > 0 || options.persistSelections)
        onRowsChanged.notify({ rows: diff }, null, self);
    }

    return {
      // methods
      "beginUpdate": beginUpdate,
      "endUpdate": endUpdate,
      "setPagingOptions": setPagingOptions,
      "getPagingInfo": getPagingInfo,
      "getItems": getItems,
      "getFilteredAndPagedItems": getFilteredAndPagedItems,
      "setItems": setItems,
      "setFilter": setFilter,
      "setIdProperty": setIdProperty,
      "getMaxId": getMaxId,
      "sort": sort,
      "reSort": reSort,
      "groupBy": groupBy,
      "setAggregators": setAggregators,
      "collapseGroup": collapseGroup,
      "expandGroup": expandGroup,
      "getGroups": getGroups,
      "getIdxById": getIdxById,
      "getIdProperty": getIdProperty,
      "getRowById": getRowById,
      "getRowIdx": getRowIdx,
      "getItemById": getItemById,
      "getItemByIdx": getItemByIdx,
      "refresh": refresh,
      "updateItem": updateItem,
      "insertItem": insertItem,
      "addItem": addItem,
      "deleteItem": deleteItem,

      // data provider methods
      "getLength": getLength,
      "getItem": getItem,
      "getItemMetadata": getItemMetadata,
      "requestNewPage" : requestNewPage,

      //properties
      "activeReq": activeReq,

      // events
      "onRowCountChanged": onRowCountChanged,
      "onRowsChanged": onRowsChanged,
      "onPagingInfoChanged": onPagingInfoChanged,
      "onPageRequested": onPageRequested,
      "onDataLoading": onDataLoading,
      "onDataLoaded": onDataLoaded,
      "onAggregatorsChanged": onAggregatorsChanged
    };
  }

  function AvgAggregator(field) {
    var count;
    var nonNullCount;
    var sum;

    this.init = function () {
      count = 0;
      nonNullCount = 0;
      sum = 0;
    };

    this.accumulate = function (item) {
      var val = item[field];
      count++;
      if (val != null && val != NaN) {
        nonNullCount++;
        sum += 1 * val;
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.avg) {
        groupTotals.avg = {};
      }
      if (nonNullCount != 0) {
        groupTotals.avg[field] = sum / nonNullCount;
      }
    };
  }

  function SumAggregator(field) {
    var sum;

    this.init = function () {
      sum = 0;
    };

    this.accumulate = function (item) {
      var val = item[field];

      if (typeof val == "string")
        val = val.replace(",","");  //remove thousands seperator.

      if (val != null && val != "" && val != NaN) {
        sum += parseFloat(val);
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.sum) {
        groupTotals.sum = {};
      }
      groupTotals.sum[field] = sum;
    };
  }

  function MinAggregator(field) {
    var min;

    this.init = function () {
      min = null;
    };

    this.accumulate = function (item) {
      var val = item[field];
      if (val != null && val != NaN) {
        if (min == null || val < min) {
          min = val;
        }
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.min) {
        groupTotals.min = {};
      }
      groupTotals.min[field] = min;
    }
  }

  function MaxAggregator(field) {
    var max;

    this.init = function () {
      max = null;
    };

    this.accumulate = function (item) {
      var val = item[field];
      if (val != null && val != NaN) {
        if (max == null || val > max) {
          max = val;
        }
      }
    };

    this.storeResult = function (groupTotals) {
      if (!groupTotals.max) {
        groupTotals.max = {};
      }
      groupTotals.max[field] = max;
    }
  }

})(jQuery);

/*
* CheckBox Selection Plugin
*/
(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "CheckboxSelectColumn": CheckboxSelectColumn
    }
  });

  function CheckboxSelectColumn(options) {
    var _grid;
    var _selectedRowsLookup = {};
    var _defaults = {
      columnId: "checkbox-selector",
      cssClass: "selector-checkbox-header",
      toolTip: Globalize.localize("SelectDeselect"),
      width: 20,
      resizable: false,
      sortable: false
    };

    var _options = $.extend(true, {}, _defaults, options);

    function init(grid) {
      _grid = grid;
      _grid.onSelectedRowsChanged.subscribe(handleSelectedRowsChanged);
      _grid.onClick.subscribe(handleClick);
      _grid.onKeyDown.subscribe(handleKeyDown);
      _grid.onHeaderClick.subscribe(handleHeaderClick);
    }

    function destroy() {
      _grid.onSelectedRowsChanged.unsubscribe(handleSelectedRowsChanged);
      _grid.onClick.unsubscribe(handleClick);
      _grid.onKeyDown.unsubscribe(handleKeyDown);
      _grid.onHeaderClick.unsubscribe(handleHeaderClick);
    }

    function handleKeyDown(e, args)
    {
      if (e.which == 32 && !_grid.getEditorLock().isActive() && _grid.getActiveCell()) {
        args.row = _grid.getActiveCell().row;
        handleClick(e, args);
      }
    }

    function handleSelectedRowsChanged(e, args) {
      var selectedRows = _grid.getSelectedRows();
      var lookup = {}, row, i;
      for (var i = 0; i < selectedRows.length; i++) {
        row = selectedRows[i];
        lookup[row] = true;
        if (lookup[row] !== _selectedRowsLookup[row]) {
          _grid.invalidateRow(row);
          delete _selectedRowsLookup[row];
        }
      }
      for (i in _selectedRowsLookup) {
        _grid.invalidateRow(i);
      }
      _selectedRowsLookup = lookup;
      _grid.render();

      if (!_grid.getOptions().multiSelect) {
        _grid.updateColumnHeader(_options.columnId, '','');
        return;
      }

      if (selectedRows.length > 0 && selectedRows.length == _grid.getSelectableLength()) {
        _grid.updateColumnHeader(_options.columnId, 'selector-checkbox-header checkbox checked');
      } else {
        _grid.updateColumnHeader(_options.columnId, 'selector-checkbox-header checkbox unchecked');
      }
    }

    function removeChildren(selected, row) {
      if (_grid.getOptions().treeGrid  && _grid.getOptions().selectChildren) {
        var data = _grid.getFilteredData(),
          depth = data[row]["depth"];

        //if this row is a parent, un-select the children
        for (var j = row+1; j < data.length; j++) {
          if (data[j]["isParent"])
            break;

          if (data[j]["depth"]==depth+1) {
            for (var i = 0; i < selected.length; i++) {
              if (selected[i]==j)
                selected.splice(i,1);
            }
          } else {
            break;
          }
        }
      }
      return selected;
    }

    function addChildren(row) {
      var selected = [];
      selected.push(row);

      if (_grid.getOptions().treeGrid && _grid.getOptions().selectChildren) {
        var data = _grid.getFilteredData(),
          depth = data[row]["depth"];

        //if this row is a parent, select the children
        for (var j = row+1; j < data.length; j++) {
          if (data[j]["isParent"])
            break;

          if (data[j]["depth"]==depth+1) {
            selected.push(j);
          } else {
            break;
          }
        }
      }
      return selected;
    }

    function handleClick(e, args) {
      // clicking on a row select checkbox
      if (_options.columnId === "checkbox-selector" && ($(e.target).is(".selection-checkbox") || e.type=="keydown")) {
      // if editing, try to commit
        if (_grid.getOptions().editable && _grid.getEditorLock().isActive() && !_grid.getEditorLock().commitCurrentEdit()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        if (_selectedRowsLookup[args.row]) {
          var grepedRows = $.grep(_grid.getSelectedRows(), function (n) {
            return n != args.row;
          });

          grepedRows = removeChildren(grepedRows,args.row);
          _grid.uncheckPersistedRow(args.row);
          _grid.setSelectedRows(grepedRows, {row : args.row, cell : args.cell});
        }
        else if (_grid.getOptions().multiSelect) {
          var addedRows = addChildren(args.row);
          _grid.setSelectedRows(_grid.getSelectedRows().concat(addedRows) , {row : args.row, cell : args.cell});
        }
        else {
          var empty = [];
          _grid.setSelectedRows(empty.concat(args.row), {row : args.row, cell : args.cell});
        }
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function handleHeaderClick(e, args) {

     if (args.column && _options.columnId === "checkbox-selector" && $(e.target).hasClass("checkbox")){
        // if editing, try to commit
        if (!_grid.isLookupGrid && _grid.getEditorLock().isActive() && !_grid.getEditorLock().commitCurrentEdit()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }

        if ($(e.target).hasClass("checked")) {
          var rows = _grid.getFilteredData().length;
          for (var i = 0; i < rows; i++) {
            _grid.uncheckPersistedRow(i);
          }
          _grid.setSelectedRows([]);
        }
        else {
          _grid.selectAllRows();
        }
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    }

    function getColumnDefinition(multiSelect) {
      return {
        id: _options.columnId,
        name: (!multiSelect ? '' : '<div class="selector-checkbox-header checkbox unchecked"></div>'),
        toolTip: (!multiSelect ? '' : _options.toolTip),
        width: 21,
        builtin: true,
        resizable: false,
        sortable: false,
        reorderable: false,
        cssClass: "isCheckboxCell",
        formatter: checkboxSelectionFormatter,
        selectable: false
      };
    }


    function checkboxSelectionFormatter(row, cell, value, columnDef, dataContext) {
      if (dataContext) {
        var isSelectable = (_grid == undefined ? true : _grid.canRowBeSelected(row));

        return '<div class="selection-checkbox checkbox' + (_selectedRowsLookup[row] ? ' checked' : ' unchecked') + '"></div>';
      }
      return null;
    }

    $.extend(this, {
      "init": init,
      "destroy": destroy,

      "getColumnDefinition": getColumnDefinition
    });
  }
})(jQuery);

/*
* Row Selection Plugin
*/
(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "RowSelectionModel": RowSelectionModel
    }
  });

  function RowSelectionModel(options) {
    var _grid;
    var _ranges = [];
    var _persistSelectedIds = [];
    var _self = this;
    var _options;
    var _defaults = {
      selectActiveRow: true
    };

    function init(grid) {
      _options = $.extend(true, {}, _defaults, options);
      _grid = grid;
      _grid.onActiveCellChanged.subscribe(handleActiveCellChange);
      _grid.onKeyDown.subscribe(handleKeyDown);
      _grid.onClick.subscribe(handleClick);
    }

    function destroy() {
      _grid.onActiveCellChanged.unsubscribe(handleActiveCellChange);
      _grid.onKeyDown.unsubscribe(handleKeyDown);
      _grid.onClick.unsubscribe(handleClick);
    }

    function rangesToRows(ranges) {
      var rows = [];
      for (var i = 0; i < ranges.length; i++) {
        for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
          rows.push(j);
        }
      }
      return rows;
    }

    function rowsToRanges(rows) {
      var ranges = [];
      var lastCell = _grid.getColumns().length - 1;
      for (var i = 0; i < rows.length; i++) {
        ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
      }
      return ranges;
    }

    function getRowsRange(from, to) {
      var i, rows = [];
      for (i = from; i <= to; i++) {
        rows.push(i);
      }
      for (i = to; i < from; i++) {
        rows.push(i);
      }
      return rows;
    }

    function getSelectedRows() {
      return rangesToRows(_ranges);
    }

    function setPersistedIds(ids) {
      _persistSelectedIds = ids;
    }

    function getPersistedIds() {
      return _persistSelectedIds;
    }

    function setSelectedRows(rows) {
      setSelectedRanges(rowsToRanges(rows));
    }

    function clearPersistedIds() {
      _persistSelectedIds = [];
    }

    function uncheckPersistedRow(row) {
      var id = getAsIds([row])[0],
          index = $.inArray(id, _persistSelectedIds);

      if (index !== -1) {
        _persistSelectedIds.splice(index, 1);
      }
    }

    function makeUnique(array) {
      var uniqueObj = {},
          uniqueArray = [],
          isNumber;

      //if the idProperty was a number, we need to keep it one, otherwise it'll turn into a string
      isNumber = typeof array[0] == 'number';

      for (var i = 0; i < array.length; i++) {
        uniqueObj[array[i]] = true;
      }

      for (i in uniqueObj) {
        if (uniqueObj.hasOwnProperty(i)) {
          uniqueArray.push(isNumber ? parseFloat(i) : i);
        }
      }

      return uniqueArray;
    }

    function getAsIds(arrayOfIndices) {
      var arrayOfIds = [],
          dataView = _grid.getData(),
          idProperty = dataView.getIdProperty(),
          filteredData = _grid.getFilteredData(),
          index, someData;

      for (var i = 0; i < arrayOfIndices.length; i++) {
        index = arrayOfIndices[i];
        someData = filteredData[index];
        if (someData) {
          arrayOfIds.push(filteredData[index][idProperty]);
        }
      }
      return arrayOfIds;
    }

    function setSelectedRanges(ranges, active) {
      _ranges = ranges;
      //need to combine the current list of ids with the new list
      _persistSelectedIds = makeUnique(getAsIds(rangesToRows(ranges)).concat(_persistSelectedIds));
      _ranges.active = active;
      _self.onSelectedRangesChanged.notify(_ranges);
    }

    function getSelectedRanges() {
      return _ranges;
    }

    function handleActiveCellChange(e, data) {
      if (_options.selectActiveRow) {
        setSelectedRanges([new Slick.Range(data.row, 0, data.row, _grid.getColumns().length - 1)]);
      }
    }

    function handleKeyDown(e) {
      var activeRow = _grid.getActiveCell();
      if (e.shiftKey  && e.ctrlKey && e.which == 35) {  //ctrl-shift-end
          e.preventDefault();
          e.stopPropagation();
          var selection = _grid.getSelectedRows(),
          from =  selection.pop(),
          to = _grid.getDataLength()-1;

          selection = [];
          for (var i = from; i <= to; i++) {
            selection.push(i);
          }
          _grid.setSelectedRows(selection);
          _grid.scrollRowIntoView(to, false);
          return;
      }

      if (!e.shiftKey && e.ctrlKey && e.which == 65) {  //ctrl-a selects all.
        e.preventDefault();
        e.stopPropagation();
        _grid.selectAllRows();
        return;
      }


      if (activeRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && (e.which == 38 || e.which == 40)) {
        var selectedRows = getSelectedRows();
        selectedRows.sort(function (x, y) { return x - y });

        if (!selectedRows.length) {
          selectedRows = [activeRow.row];
        }

        var top = selectedRows[0];
        var bottom = selectedRows[selectedRows.length - 1];
        var active;


        if (e.which == 40) {
          active = activeRow.row < bottom || top == bottom ? ++bottom : ++top;
        }
        else {
          active = activeRow.row < bottom ? --bottom : --top;
        }

        if (active >= 0 && active < _grid.getDataLength() &&  _grid.getOptions().multiSelect) {
          _grid.scrollRowIntoView(active);
          _ranges = rowsToRanges(getRowsRange(top, bottom));
          setSelectedRanges(_ranges);
        }

        e.preventDefault();
        e.stopPropagation();
      }
    }

    function handleClick(e) {
      var cell = _grid.getCellFromEvent(e),
        opt = _grid.getOptions(),
        readonlySelect = (!opt.enableCellNavigation && opt.multiSelect && !opt.editable);

      if (!cell || (readonlySelect ? false : !_grid.canCellBeActive(cell.row, cell.cell))) {
        return false;
      }

      var selection = rangesToRows(_ranges);
      var idx = $.inArray(cell.row, selection);

      if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
        return false;
      }
      else if (_grid.getOptions().multiSelect) {
        if (idx === -1 && (e.ctrlKey || e.metaKey)) {
          selection.push(cell.row);
          _grid.setActiveCell(cell.row, cell.cell);
        }
        else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
          selection = $.grep(selection, function (o, i) { return (o !== cell.row); });
          _grid.setActiveCell(cell.row, cell.cell);
        }
        else if (selection.length && e.shiftKey) {
          var last = selection.pop();
          var from = Math.min(cell.row, last);
          var to = Math.max(cell.row, last);
          selection = [];
          for (var i = from; i <= to; i++) {
            if (i !== last) {
              selection.push(i);
            }
          }
          selection.push(last);
          _grid.setActiveCell(cell.row, cell.cell);
        }
      }

      _ranges = rowsToRanges(selection);
      setSelectedRanges(_ranges);
      e.stopImmediatePropagation();

      return true;
    }

    $.extend(this, {
      "getSelectedRows": getSelectedRows,
      "setSelectedRows": setSelectedRows,
      "getSelectedRanges": getSelectedRanges,
      "setSelectedRanges": setSelectedRanges,
      "setPersistedIds": setPersistedIds,
      "getPersistedIds": getPersistedIds,
      "clearPersistedIds": clearPersistedIds,
      "uncheckPersistedRow": uncheckPersistedRow,
      "init": init,
      "destroy": destroy,
      "onSelectedRangesChanged": new Slick.Event()
    });
  }
})(jQuery);

/*
* RowMove Manager Plugin.
*/
(function($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "RowMoveManager": RowMoveManager
    }
  });

  function RowMoveManager() {
    var _grid;
    var _canvas;
    var _dragging;
    var _self = this;

    function init(grid) {
      _grid = grid;
      _canvas = _grid.getCanvasNode();
      _grid.onDragInit.subscribe(handleDragInit);
      _grid.onDragStart.subscribe(handleDragStart);
      _grid.onDrag.subscribe(handleDrag);
      _grid.onDragEnd.subscribe(handleDragEnd);
    }

    function destroy() {
      _grid.onDragInit.unsubscribe(handleDragInit);
      _grid.onDragStart.unsubscribe(handleDragStart);
      _grid.onDrag.unsubscribe(handleDrag);
      _grid.onDragEnd.unsubscribe(handleDragEnd);
    }

    function handleDragInit(e) {
      // prevent the grid from cancelling drag'n'drop by default
      e.stopImmediatePropagation();
    }

    function handleDragStart(e,dd) {
      var cell = _grid.getCellFromEvent(e);
      if (_grid.getEditorLock().isActive() || !/move|selectAndMove/.test(_grid.getColumns()[cell.cell].behavior)) {
        return false;
      }

      if ($(_grid.getCellNode(cell.row, cell.cell)).find(".uneditable").length >0) {
        return false;
      }

      _dragging = true;
      e.stopImmediatePropagation();

      var selectedRows = _grid.getSelectedRows();

      if (selectedRows.length == 0 || $.inArray(cell.row, selectedRows) == -1) {
        selectedRows = [cell.row];
        _grid.setSelectedRows(selectedRows);
      }

      var rowHeight = _grid.getOptions().rowHeight;

      dd.selectedRows = selectedRows;

      dd.selectionProxy = $("<div class='slick-reorder-proxy'/>")
        .css("position", "absolute")
        .css("zIndex", "99999")
        .css("width", "100%")
        .css("height", rowHeight*selectedRows.length)
        .appendTo(_canvas);

      dd.guide = $("<div class='slick-reorder-guide'/>")
        .css("position", "absolute")
        .css("zIndex", "99998")
        .css("width", "100%")
        .css("top", -1000)
        .appendTo(_canvas);

      dd.insertBefore = -1;

    }

    function handleDrag(e,dd) {
      if (!_dragging) {
        return;
      }

      e.stopImmediatePropagation();

      var top = e.pageY - $(_canvas).offset().top;
      dd.selectionProxy.css("top",top-5);

      var insertBefore = Math.max(0,Math.min(Math.round(top/_grid.getOptions().rowHeight),_grid.getDataLength()));
      if (insertBefore !== dd.insertBefore) {
        var eventData = {
          "rows":         dd.selectedRows,
          "insertBefore": insertBefore
        };

        if (_self.onBeforeMoveRows.notify(eventData) === false) {
          dd.guide.css("top", -1000);
          dd.canMove = false;
        }
        else {
          dd.guide.css("top",insertBefore*_grid.getOptions().rowHeight);
          dd.canMove = true;
        }

        dd.insertBefore = insertBefore;
      }
    }

    function handleDragEnd(e,dd) {
      if (!_dragging) {
        return;
      }
      _dragging = false;
      e.stopImmediatePropagation();

      dd.guide.remove();
      dd.selectionProxy.remove();

      if (dd.canMove) {
        var eventData = {
          "rows":         dd.selectedRows,
          "insertBefore": dd.insertBefore
        };
        _self.onMoveRows.notify(eventData);
      }
    }

    $.extend(this, {
      "onBeforeMoveRows": new Slick.Event(),
      "onMoveRows":       new Slick.Event(),
	  "name":  "RowMoveManager",
      "init": init,
      "destroy": destroy
    });
  }
})(jQuery);

/*
* Cell Decorator Plugin for Xls copy
*/
(function ($) {
// register namespace
$.extend(true, window, {
  "Slick": {
  "CellRangeDecorator": CellRangeDecorator
  }
});

function CellRangeDecorator(grid, options) {
  var _elem,
    _defaults = {
      selectionClass: "slick-cell-range-select"
    };

  options = $.extend(true, {}, _defaults, options);

  function show(range, canvas) {
  var self = this;
  if (!_elem) {
    _elem = $("<div></div>")
      .css("position", "absolute").addClass(options.selectionClass)
      .appendTo(canvas)
      .click(function(e) {
        self.hide();
        $(document.elementFromPoint(e.clientX,e.clientY)).trigger("click");
      });
  }

  if (_elem.parent()!=canvas) {
    _elem.remove().appendTo(canvas);
  }

  var from = grid.getCellNodeBox(range.fromRow, range.fromCell);
  var to = grid.getCellNodeBox(range.toRow, range.toCell);

  _elem.css({
    top: from.top,
    left: from.left,
    height: to.bottom - from.top +1,
    width: to.right - from.left -1
  });

  return _elem;
  }

  function hide() {
  if (_elem) {
    _elem.remove();
    _elem = null;
  }
  }

  $.extend(this, {
  "show": show,
  "hide": hide
  });
}
})(jQuery);

/*
* CellRangeSelector Plugin for Xls copy
Based on http://www.developerextensions.com/index.php/extjs-excel-copypaste-grid
*/
(function ($) {
// register namespace
$.extend(true, window, {
  "Slick": {
  "CellRangeSelector": CellRangeSelector
  }
});

function CellRangeSelector(options) {
  var _grid;
  var _canvas;
  var _dragging;
  var _decorator;
  var _self = this;
  var _textarea = null;
  var _tsvData = "";  //Excel pastable data.

  function init(grid) {
    _grid = grid;
    _canvas = _grid.getCanvasNode();

    if (!options.enableCellRangeSelection)
      return;

    _decorator = new Slick.CellRangeDecorator(grid);
    _grid.onDragInit.subscribe(handleDragInit);
    _grid.onDragStart.subscribe(handleDragStart);
    _grid.onDrag.subscribe(handleDrag);
    _grid.onDragEnd.subscribe(handleDragEnd);
    _grid.onActiveCellChanged.subscribe(handleActiveCellChange);
    _grid.getData().onRowCountChanged.subscribe(handleActiveCellChange);
    _grid.onSort.subscribe(handleActiveCellChange);

    this.onCellRangeSelected.subscribe(handleCellRangeSelected);

    _grid.onKeyDown.subscribe(function (e) {
      if (grid.getEditorLock().isActive()) {
        return;
      }

      if (e.ctrlKey && !e.shiftKey && e.which ==  67) {
        copyToClipBoard();
      }

      if (e.ctrlKey && !e.shiftKey && e.which == 86) {
        directFocus();
      }
    });

    if (_grid.getOptions().editable) {
      $(_canvas).bind("paste", function(elem, e) {
        //let the value past into the text area and on
        setTimeout(function() { handlePaste() }, 0);
      });
    }
  }

  function destroy() {
    _grid.onDragInit.unsubscribe(handleDragInit);
    _grid.onDragStart.unsubscribe(handleDragStart);
    _grid.onDrag.unsubscribe(handleDrag);
    _grid.onDragEnd.unsubscribe(handleDragEnd);
    _grid.onActiveCellChanged.unsubscribe(handleActiveCellChange);
    _grid.onSort.unsubscribe(handleActiveCellChange);
    _grid.getData().onRowCountChanged.unsubscribe(handleActiveCellChange);
  }

  function handleDragInit(e, dd) {
    // prevent the grid from cancelling drag'n'drop by default
    e.stopImmediatePropagation();
  }

  function handleDragStart(e, dd) {
    var cell = _grid.getCellFromEvent(e);
    if (_self.onBeforeCellRangeSelected.notify(cell) !== false) {

      if (_grid.getEditorLock().isActive()) {
        _grid.getEditorLock().commitCurrentEdit();
      }
      if (_grid.canCellBeSelected(cell.row, cell.cell)) {
      _dragging = true;
      e.stopImmediatePropagation();
      }
    }
    if (!_dragging) {
      return;
    }

    var start = _grid.getCellFromPoint(
      dd.startX - $(_canvas).offset().left,
      dd.startY - $(_canvas).offset().top);

    dd.range = {start: start, end: {}};

  //return _decorator.show(new Slick.Range(start.row, start.cell));
  }

  function handleDrag(e, dd) {
  if (!_dragging) {
    return;
  }
  e.stopImmediatePropagation();

  var end = _grid.getCellFromPoint(
    e.pageX - $(_canvas).offset().left,
    e.pageY - $(_canvas).offset().top);

  if (!_grid.canCellBeSelected(end.row, end.cell)) {
    return;
  }

  dd.range.end = end;
  if (dd.range.start.row==end.row && dd.range.start.cell==end.cell)
    return;

  var frozenCol = _grid.getOptions().frozenColumn,
    target = $(_canvas[0]);

  if (frozenCol > -1 && dd.range.start.cell > frozenCol)
    target = $(_canvas[1]);

    _decorator.show(new Slick.Range(dd.range.start.row, dd.range.start.cell, end.row, end.cell), target);
  }

  function handleDragEnd(e, dd) {
  if (!_dragging) {
    return;
  }

  _dragging = false;
  e.stopImmediatePropagation();

  _self.onCellRangeSelected.notify({
    range: new Slick.Range(
      dd.range.start.row,
      dd.range.start.cell,
      dd.range.end.row,
      dd.range.end.cell
    )
  });

  _canvas.focus();  //focus the canvas so the keys work.
  }

  function handleCellRangeSelected(e, args) {
  _ranges = args.range;
  }

  function handleActiveCellChange(e, args) {
    _decorator.hide();
    _ranges = new Slick.Range(args.row, args.cell, args.row, args.cell);
  }

  function collectGridData(includeHeaders) {
    var data = _grid.getFilteredData(),
      from = _ranges,
      rowTsv = "",
      columns = _grid.getColumns();

    _tsvData = "";

    if (data.length == 0) {
      return;
    }

    if (includeHeaders) {
      rowTsv = "";
      for (var j = 0; j <= from.toCell - from.fromCell; j++) {
        var col = columns[from.fromCell + j],
          fieldId = col.field;

        if (fieldId==undefined) {
          continue;
        }
        if ( rowTsv!="" ){
          rowTsv+="\t";
        }
        rowTsv += col.name;
      }
      _tsvData +=rowTsv;
    }

    for (var i = 0; i <= from.toRow - from.fromRow; i++) {
      if ( _tsvData!="" ) {
        _tsvData +="\n";
      }
      rowTsv = "";

      var firstEmpty = false;

      for (var j = 0; j <= from.toCell - from.fromCell; j++) {
        var column = columns[from.fromCell + j];
          fieldId = column.field;
        //ignore columns with no field. this includes built in columns
        if (fieldId==undefined) {
          continue;
        }

        if ( rowTsv!="" || firstEmpty ){
          rowTsv+="\t";
        }

        //Format the values as needed.
        var cellVal = data[from.fromRow + i][fieldId];
        if (cellVal==undefined || cellVal==null) {
          cellVal="";
          if (rowTsv!="")
            firstEmpty == true;
        }

        //replace tabs and new lines with spaces and
        if (typeof cellVal =="string") {
          cellVal = cellVal.replace(new RegExp( "\\t", "g" ),"     ");
          if (cellVal.search(new RegExp( "\\n", "g" ))>-1) {
            cellVal = '"' + cellVal + '"'
          }
        }

        var formatter = column.formatter,
          isEmpty = (typeof cellVal =="string" &&  cellVal ==""),
          isTreeFormatter = (formatter  ? formatter.toString().toLowerCase().indexOf("tree")>-1 : false),
          isCheckboxFormatter = (formatter  ? formatter.toString().toLowerCase().indexOf("checkbox")>-1 : false);

        if (formatter && !isTreeFormatter && !isCheckboxFormatter && !isEmpty) {  //Ignore the tree /checkbox formatter.
          cellVal = formatter(from.fromCell + j, i, cellVal, column,data[from.fromRow + i],_grid.getOptions(),_grid);
          if (typeof cellVal =="string"){
            cellVal = $("<div/>").html(cellVal).text();
          }
        }
        rowTsv += cellVal;
      }
      _tsvData +=rowTsv;
    }
  }

  function excelExport() {
    //set ranges to all then trigger a ctrl c
    _ranges = new Slick.Range(
      0,
      0,
      _grid.getFilteredData().length-1,
      _grid.getColumns().length-1
    );

    if (_grid.getOptions().onExport) {
        _grid.getOptions().onExport(_grid.getVisibleItems(true), options.exportFileName);
        return;
      }
    convertToCsv(_grid.getVisibleItems(true), options.exportFileName, false);
    }

    function convertToCsv(JSONData, reportTitle, showLabel) {
      if (!reportTitle) {
        reportTitle = _grid.getOptions().exportFileName;
      }
        //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
        var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

        var CSV = '';
        //Set Report title in first row or line
        //CSV += reportTitle + '\r\n\n';

        //This condition will generate the Label/Header
        if (showLabel) {
            var row = "";

            //This loop will extract the label from 1st index of on array
            for (var index in arrData[0]) {
        //Now convert each value to string and comma-seprated
                row += index + ',';
            }

            row = row.slice(0, -1);
            //append Label row with line break
            CSV += row + '\r\n';
        }

    //1st loop is to extract each row
        for (var i = 0; i < arrData.length; i++) {
            var row = "";

            //2nd loop will extract each column and convert it in string comma-seprated
            for (var index in arrData[i]) {
        row += '"' + $('<div/>').html(arrData[i][index]).text() + '",';
            }

            row.slice(0, row.length - 1);

            //add a line break after each row
            CSV += row + '\r\n';
        }

        if (CSV == '') {
            return;
        }

        //Generate a file name
        var fileName = "";
        //this will remove the blank-spaces from the title and replace it with an underscore
        fileName += reportTitle.replace(/ /g, "_");

        //Initialize file format you want csv or xls
        var uri = "";

        if (window.btoa) {
        uri = 'data:text/csv;base64,77u/' + window.btoa(unescape(encodeURIComponent(CSV)));
        } else {
          uri = 'data:text/csv;base64,77u/' + unescape(encodeURIComponent(CSV));
        }

        // Now the little tricky part.
        // you can use either>> window.open(uri);
        // but this will not work in some browsers
        // or you will not get the correct file extension

        //this trick will generate a temp <a /> tag
        var link = document.createElement("a");
        link.className= 'tempButtonCSV';
        link.href = uri;

        //set the visibility hidden so it will not effect on your web-layout
        //link.style = "visibility:hidden";
        link.download = fileName + ".csv";

        //this part will append the anchor tag and remove it after automatic click
        document.body.appendChild(link);
        link.click();
        //$('.tempButtonCSV').trigger('click');
        //document.querySelector('.tempButtonCSV').click();
        document.body.removeChild(link);
    }

  function copyToClipBoard(includeHeaders){
    collectGridData(includeHeaders);

    if (window.clipboardData) {
      clipboardData.setData("Text", _tsvData);
    } else {
      var cellPos = $(".slick-cell-range-select").position();
      if (cellPos==null) {
        cellPos= $(_grid.getActiveCellNode()).position();
      }
      var input = getHiddenInput();
      input.css({left: cellPos.left+"px", top: cellPos.top+"px"});
      input.val(_tsvData).focus().select();
    }
  }

  function directFocus() {
    this._focused = document.activeElement;
    var cellPos = $(".slick-cell-range-select").position(),
      textArea = getHiddenInput();

    if (!cellPos) {
      return;
    }
    textArea.css({left: cellPos.left+"px", top: cellPos.top+"px"});
    textArea.val("").focus().select();
  }

  function handlePaste() {
    if (typeof _ranges == "undefined")
      return;

    if (_grid.getEditorLock().isActive()) {
      return;
    }

    $(this._focused).val("").focus();
    var contents = "",
      to = _ranges,
      data = _grid.getData().getItems(),
      columns = _grid.getColumns();

    if (window.clipboardData) {
      contents = window.clipboardData.getData("Text");
    } else {
      contents = getHiddenInput().val();
    }

    var rows = contents.split("\n");
    //paste from the cell out.
    for (var i = 0; i <= rows.length-1; i++) {
      if (rows[i]=="" && i==rows.length-1)  //skip last empty row in excel.
        continue;

      var cols = rows[i].replace(/\r/,'').split("\t");
      for (var j = 0; j <= cols.length-1; j++) {
        var editable = columns[to.fromCell +j].editable;
        if (!(editable==undefined ? true : editable))
          continue;

        // trigger the cell edit functions.
        _grid.trigger(_grid.onBeforeEditCell, {
          row: to.fromRow + i,
          cell: to.fromCell + j,
          item: _grid.getDataItem(to.fromRow + i),
          column: columns[to.fromCell + j] });

        data[to.fromRow + i][columns[to.fromCell +j].field] = (cols[j]=="undefined" ? "" : cols[j]);
        _grid.invalidateRow(to.fromRow + i);

        // Trigger the cell change event with the new data
        _grid.trigger(_grid.onCellChange, {
              row: to.fromRow + i,
              cell: to.fromCell + j,
              item: _grid.getDataItem(to.fromRow + i),
              cellValue : data[to.fromRow + i][columns[to.fromCell + j].field]
        });
      }
    }
    _grid.render();

    if (_grid.getOptions().showSummaryRow) {
      _grid.updateSummaryRow();
    }
  }

  function getHiddenInput() {
    if (!_textarea) {
      _textarea= $("<textarea class='export-input'></textarea>").appendTo($(_canvas.filter(":visible:last"))).css({"position":"absolute" , "z-index":"-1" });
    }
    return _textarea;
  }

  $.extend(this, {
  "init": init,
  "destroy": destroy,
  "name": "CellRangeSelector",

  "onBeforeCellRangeSelected": new Slick.Event(),
  "onCellRangeSelected": new Slick.Event(),
  "excelExport": excelExport,
  "convertToCsv": convertToCsv
  });
}
})(jQuery);

/*
* Paging Control.
*/
(function($) {
  function SlickGridPager(dataView, grid, $container){
    var $status;
    var $nextButton;
    var $prevButton;
    var $lastButton;
    var $firstButton;
    var $records; //show number of records

    function init() {
      dataView.onPagingInfoChanged.subscribe(function(e,pagingInfo) {
        updatePager(pagingInfo);
      });

      constructPagerUI();
      updatePager(dataView.getPagingInfo());
    }

    function getNavState() {
      var cannotLeaveEditMode = false;
      //!Slick.GlobalEditorLock.commitCurrentEdit();
      var pagingInfo = dataView.getPagingInfo();

      var lastPage = Math.floor(pagingInfo.totalRows/pagingInfo.pageSize);
      if (Math.floor(pagingInfo.totalRows/pagingInfo.pageSize)==pagingInfo.totalRows/pagingInfo.pageSize)
        lastPage -= 1;

      if (pagingInfo.totalRows==-1)
        lastPage = pagingInfo.pageNum+1;

      var canGotoFirst = !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum > 0,
        canGotoLast  = !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum != lastPage,
        canGotoPrev  = !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum > 0,
        canGotoNext  = !cannotLeaveEditMode && pagingInfo.pageSize != 0 && pagingInfo.pageNum < lastPage;

      if (pagingInfo.pageNum==-1 || pagingInfo.pageNum==99999) {
        if (pagingInfo.isLastPage) {
          canGotoLast = false;
          canGotoNext = false;
        } else {
          canGotoLast = true;
          canGotoNext = true;
        }

        if (pagingInfo.isFirstPage) {
          canGotoPrev = false;
          canGotoFirst = false;
        } else {
          canGotoPrev = true;
          canGotoFirst = true;
        }
      }

      return {
        canGotoFirst: canGotoFirst,
        canGotoLast:  canGotoLast,
        canGotoPrev:  canGotoPrev,
        canGotoNext:  canGotoNext,
        pagingInfo:   pagingInfo,
        lastPage:   lastPage
      }
    }

    function setPageSize(n) {
      n = (isNaN(parseInt(n)) || n<1) ? grid.getOptions().pageSize : n;
      dataView.setPagingOptions({pageSize:n});
      dataView.requestNewPage("pageSize");
      grid.getOptions().pageSize = n;
      grid.trigger(grid.onPersonalizationChanged, grid.getGridPersonalizationInfo('PageSize'));
      $container.find('.inforTextbox.recordsPerPage').val(n);
    }

    function goToPage(input) {
      var n = parseInt(input.val()),
        state = getNavState();

      if ( n-1 > state.lastPage ) {
        n = state.lastPage+1;
        input.val(n);
      }

      if ( n <= 0 ) { //do not allow zero or less than zero
        n = 1;
        input.val(n);
      }

      if (n!= input.data("oldVal")) {
        dataView.setPagingOptions({pageNum: n-1}, "page");  //page sizes are zero indexed...
        input.data("oldVal",n);
      }
    }

    function ensureValidKey(event) {
      //0-9
      if (event.keyCode >= 48 && event.keyCode <= 57) {
        return;
      }
      //numpad
      if (event.keyCode >= 91 && event.keyCode <= 105) {
        return;
      }
      //disallow the rest
      event.preventDefault();
    }

    function gotoFirst() {
      if ($(this).is("button") && $(this).hasClass("disabled")) {
        return;
      }

      if (getNavState().canGotoFirst)
        dataView.setPagingOptions({pageNum: 0}, "first");
    }

    function gotoLast() {
      if ($(this).is("button") && $(this).hasClass("disabled")) {
        return;
      }

      var state = getNavState();
      if (state.canGotoLast)
        dataView.setPagingOptions({pageNum: state.lastPage}, "last");
    }

    function gotoPrev() {
      if ($(this).is("button") && $(this).hasClass("disabled")) {
        return;
      }

      var state = getNavState();
      if (state.canGotoPrev)
        dataView.setPagingOptions({pageNum: state.pagingInfo.pageNum-1}, "previous");
    }

    function gotoNext() {
      if ($(this).is("button") && $(this).hasClass("disabled")) {
        return;
      }
      var state = getNavState();
      if (state.canGotoNext)
        dataView.setPagingOptions({pageNum: state.pagingInfo.pageNum+1}, "next");
    }

    function constructPagerUI() {
      $container.empty();

      var $navLeft = $("<span class='slick-pager-nav' />").appendTo($container),
        pagingMode = grid.getOptions().pagingMode,
        showButtons = (pagingMode==PagingModes.PagerServerSide || pagingMode==PagingModes.PagerClientSide),
        icon_prefix = "<button type='button' class='inforGridPagingButton ",
        icon_suffix = "><span></span></button>",
        options = grid.getOptions();

      if (showButtons) {
        $firstButton = $(icon_prefix + (Globalize.culture().isRTL ? " lastPage" : " firstPage") +"' title='"+Globalize.localize("First")+"'" + icon_suffix)
            .click(gotoFirst)
            .appendTo($navLeft);

        $prevButton = $(icon_prefix + (Globalize.culture().isRTL ? " nextPage" : " previousPage") +"' title='"+Globalize.localize("Previous")+"'" + icon_suffix)
            .click(gotoPrev)
            .appendTo($navLeft);

        $status = $("<span class='slick-pager-status' />").appendTo($container);

        var $navRight = $("<span class='slick-pager-nav' />").appendTo($container);

        $nextButton = $(icon_prefix + (Globalize.culture().isRTL ? " previousPage" : " nextPage") +"' title='"+Globalize.localize("Next")+"'" + icon_suffix)
        .click(gotoNext)
          .appendTo($navRight);

        $lastButton = $(icon_prefix + (Globalize.culture().isRTL ? " firstPage" : " lastPage") +"' title='"+Globalize.localize("Last")+"'" + icon_suffix)
            .click(gotoLast)
            .appendTo($navRight);

        $container.children().wrapAll("<div class='slick-pager' />");
      }

      if (grid.getOptions().multiSelect==true) {
        if (showButtons)
          $("<span class='inforToolbarSpacer'></span>").appendTo($container);

        $selectedRecords =  $("<div class='slick-records-status' />").appendTo($container);  //show a selected count
        $("<span class='inforToolbarSpacer'></span>").appendTo($container);
      }
      $records = $("<div class='slick-record-status' />").appendTo($container);   //show number of records

      //add an optional page size selector.
      if (options.showPageSizeSelector){
        var $div = $("<span class='slick-pager-status recordsPerPage'></span>").appendTo($container),
          $pageSizeInput = $("<input class='inforTextbox recordsPerPage'>").val(dataView.getPagingInfo().pageSize).appendTo($div),
          typeTimer;

        $pageSizeInput.numericOnly();
        //call when done typing
        $pageSizeInput
        .before("<label class='inforLabel recordsPerPage'>"+Globalize.localize("RecordsPerPage")+"</label>")
        .keyup(function(){
        	var val = $(this).val();
            clearTimeout(typeTimer);
            if (val || val < 1) {
              typeTimer = setTimeout(function() {
                setPageSize(parseInt(val, 10));
              }, 1000);
            }
          });

        $div.appendTo($container);
      }
    }

    function updatePager(pagingInfo) {
      var state = getNavState();
      var pagingMode = grid.getOptions().pagingMode;
      var showButtons = (pagingMode==PagingModes.PagerServerSide || pagingMode==PagingModes.PagerClientSide);

      if (showButtons) {
        //set the disabled button state
        if (!state.canGotoFirst)
          $firstButton.addClass("disabled");
        else
          $firstButton.removeClass("disabled");

        if (!state.canGotoLast)
          $lastButton.addClass("disabled");
        else
          $lastButton.removeClass("disabled");

        if (!state.canGotoNext)
          $nextButton.addClass("disabled");
        else
          $nextButton.removeClass("disabled");

        if (!state.canGotoPrev)
          $prevButton.addClass("disabled");
        else
          $prevButton.removeClass("disabled");

        //show the page status
        if (pagingInfo.totalRows == 0) {  //show number of records START
          $status.css({"padding-top": "4px" ,"margin-top":""}).text(Globalize.localize("NoRecordsFound"));
          $container.find(".inforGridPagingButton").hide();
          $records.html("");
          if (grid.getOptions().multiSelect==true)
            $selectedRecords.html("");
          return;
        }

        if ((pagingInfo.totalRows==-1 && grid.getDataLength()==0)) {
          $nextButton.addClass("disabled");
          $lastButton.addClass("disabled");
          $prevButton.addClass("disabled");
          $firstButton.addClass("disabled");
          $records.html(Globalize.localize("Displaying") + " " + 0  )
          $status.css({"padding-top": "4px" ,"margin-top":""}).text(Globalize.localize("NoRecordsFound"));
          return;
        }

        if (pagingInfo.pageSize == 0 || pagingInfo.pageSize == pagingInfo.totalRows) {
          $status.css("padding-top","4px").text(Globalize.localize("ShowingAll")+" " + pagingInfo.totalRows + " "+Globalize.localize("Rows"));
          $container.find(".inforGridPagingButton").hide();
          $records.html("");
          if (grid.getOptions().multiSelect==true) {
            grid.updateFooterSelectionCounter();
          }
          return;
        }

        //Show the status text...
        var pageNum = (pagingInfo.pageNum+1),
          floor = Math.floor(pagingInfo.totalRows/pagingInfo.pageSize),
          pageCount = (floor+1);

        if (floor===pagingInfo.totalRows/pagingInfo.pageSize)
          pageCount = floor;

        $status.html(Globalize.localize("Page")+" <input class='inforTextbox' value='"+ pageNum +"'/>" + " " + Globalize.localize("Of") + " " + pageCount);
        $status.css({"padding-top": "" ,"margin-top":""});

        var pageNumTextBox = $status.find("input");
        var timeout = null;
        pageNumTextBox.keydown(ensureValidKey).keyup(function(evt) {
          var $input = $(this);
          $input.numericOnly();
          clearTimeout(timeout);
          timeout = setTimeout(function() {
            goToPage($input);
          },700);
        }).data("oldVal",pageNum);

        //adjust the width
        if (pageNumTextBox) {
          if (pageCount>10)
            pageNumTextBox.width(15);

          if (pageCount>100)
            pageNumTextBox.width(18);

          if (pageCount>1000)
            pageNumTextBox.width(20);
        }

        $container.find(".inforGridPagingButton").show();
      }

      //Show the record selections
      var recEnd = (pagingInfo.pageNum+1) * pagingInfo.pageSize;
      var recBegin = recEnd - (pagingInfo.pageSize - 1);

      if (!showButtons) { //continuous or live scrolling.. or none
        recBegin = (pagingInfo.totalRows>0 ? 1 :0 );
      }

      recEnd = (recEnd > pagingInfo.totalRows) ? pagingInfo.totalRows : recEnd;

      if (grid.getOptions().pagingMode==PagingModes.None)
        recEnd= pagingInfo.totalRows;

      if (pagingMode==PagingModes.ContinuousScrolling)
        $records.html(Globalize.localize("Displaying") + " " + recBegin + " - " + pagingInfo.totalRows );
      else
        $records.html(Globalize.localize("Displaying") + " " + recBegin + " - " + recEnd + " " + Globalize.localize("Of") + " " + pagingInfo.totalRows );

      if (grid.getOptions().multiSelect==true)
        grid.updateFooterSelectionCounter();

      if (pagingInfo.totalRows == 0)  {
        $records.html(Globalize.localize("NoRecordsFound"));
        if (grid.getOptions().multiSelect==true)
          $selectedRecords.html("");
      }

      //disable some things for no total count
      if (pagingInfo.totalRows == -1) {
        var dataLength = grid.getDataLength();

        if (pagingInfo.pageNum == -1 || pagingInfo.pageNum==99999)
          $records.html(Globalize.localize("Displaying") + " " + dataLength +" " + Globalize.localize("Rows"));
        else
          $records.html(Globalize.localize("Displaying") + " " + Math.max(1,pagingInfo.pageSize*(pagingInfo.pageNum)+1) + " - " + parseInt(pagingInfo.pageSize*(pagingInfo.pageNum)+dataLength)  );
        if ($status) {
          $status.hide();
        }

        if (showButtons && pagingInfo.isFirstPage && pagingInfo.isLastPage) {
          $lastButton.addClass("disabled");
          $prevButton.addClass("disabled");
          $firstButton.addClass("disabled");
          $nextButton.addClass("disabled");
        }
      }
    }

    init();

    //Page Api...
    $.extend(this, {
      "setPageSize": setPageSize
    });
  }

  // Slick.Controls.Pager
  $.extend(true, window, { Slick: { Controls: { Pager: SlickGridPager }}});
})(jQuery);

/*
* Column Picker Control.
*/
(function($) {
  function ColumnPicker(grid, options) {
    var $menu;

    var defaults = {
      fadeSpeed: 200
    };

    function init() {
      options = $.extend({}, defaults, options);
      var isInLookup = $(grid.getCanvasNode()).closest(".inforLookupGridBoxShadow").length>0,
        isInDialog = $(grid.getCanvasNode()).closest(".inforDialog").length>0,
        maxHeight = 100,
        $overlay;

      $menu = $("<span class='slick-columnpicker' style='display:none;position:absolute;z-index:"+(isInLookup || isInDialog ? 2044 : 1013)+";' />").appendTo(document.body);

      $menu.on("click", updateColumn);
    }

    function destroy()  {
      $menu.remove();
    }

    function open(button) {
      $menu.empty();

      var $li, $input, i,
        filter,
        columns = grid.getColumns(true);

      filter = function(term) {
        $menu.find("li").each(function() {
          var li = $(this),
            text = li.text();

          if (text.indexOf(term) !== 0) {
            li.hide();
          }
          if (!term && text) {
            li.show();
          }
        });
      };

      //add search box..
      var searchField = $('<input class="inforSearchField" type="text" style="width:100px" placeholder="' + Globalize.localize("Search") + '"/>').appendTo($menu)
        .inforSearchField({
          click: function (event) {
            filter($(event.input).val());
          },
          cancel: function (event) {
            filter("");
          }
        });

      var cols = $('<div class="slick-columnpicker-cols"></div>').appendTo($menu);

      for (var i=0; i<columns.length; i++) {

        if (columns[i].name=="" || columns[i].id=="#" || columns[i].id=="" || !columns[i].hidable) {
          continue;
        }

        $li = $("<li />").appendTo(cols);

        $input = $("<input type='checkbox'  tabindex='-1' class='inforCheckbox' />")
            .attr("id", columns[i].id)
            .data("id", columns[i].id)
            .appendTo($li);

        $input.css({"left":"0" , "top":"0"});

        if (grid.getColumnIndex(columns[i].id) != null)
          $input.prop('checked', true);

        if ($.inArray(columns[i].id, ['selector', 'indicator-icon', 'checkbox-selector', 'drilldown'])< 0)
        {
          $("<label class='inforCheckboxLabel' for='" + columns[i].id + "' />")
            .text(columns[i].name)
            .insertAfter($li.find(".inforCheckbox"));
        }
      }

      var leftCss = button.offset().left-$menu.width();
      if (Globalize.culture().isRTL)
        leftCss = button.offset().left+3;

      $menu
        .css("top", button.offset().top)
        .css("left", leftCss )
        .css("max-height", $(window).height() + $(window).scrollTop() - button.offset().top - 15)
        .fadeIn(options.fadeSpeed, function() {
          searchField.width($menu.width() - 15);
        });

      cols.css("max-height", $(window).height() + $(window).scrollTop() - button.offset().top - 40);
      //columns to skip from showing in the list
      $menu.find('#indicator-icon, #selector, #checkbox-selector, #drilldown').closest('li').hide();

      //dismiss on click out..
      setTimeout(function () {
        $(document).on('click.inforColumnPicker', function(e) {
          $(document).off('click.inforColumnPicker');
          $menu.fadeOut(options.fadeSpeed);
        });
      }, 1000);
    }

    function updateColumn(e) {
      e.stopPropagation();

      var $target = $(e.target);
      if ($target.is(":checkbox")) {
        //either hide or show this particular column
        if ($target.is(":checked")) {
          grid.showColumn($target.attr("id"));
        } else {
          grid.hideColumn($target.attr("id"));
        }
        grid.updateFilterRow();
      }
    }

    init();

    //Create callable methods...
    $.extend(this, {
      "open": open,
      "destroy": destroy
    });
  }

  // Slick.Controls.ColumnPicker
  $.extend(true, window, { Slick: { Controls: { ColumnPicker: ColumnPicker }}});
})(jQuery);

/*
* Row Grouping and Totals.
*/
(function($) {
  $.extend(true, window, {
    Slick: {
      Data: {
        GroupItemMetadataProvider: GroupItemMetadataProvider
      }
    }
  });


  /*
  * Provides item metadata for group (Slick.Group) and totals (Slick.Totals) rows produced by the DataView.
  * This metadata overrides the default behavior and formatting of those rows so that they appear and function
  * correctly when processed by the grid.
  *
  * This class also acts as a grid plugin providing event handlers to expand & collapse groups.
  * If "grid.registerPlugin(...)" is not called, expand & collapse will not work.
  */
  function GroupItemMetadataProvider(options) {
    var _grid;
    var _defaults = {
      groupCssClass: "slick-group",
      totalsCssClass: "slick-group-totals",
      groupFocusable: true,
      totalsFocusable: false,
      toggleCssClass: "tree-expand inforIconButton",
      toggleExpandedCssClass: "open",
      toggleCollapsedCssClass: "closed",
      enableExpandCollapse: true
    };

    options = $.extend(true, {}, _defaults, options);

    function defaultGroupCellFormatter(row, cell, value, columnDef, item) {

      if (!options.enableExpandCollapse) {
        return item.title;
      }

      return "<button tabindex='-1' class='" + options.toggleCssClass + " " +
          (item.collapsed ? options.toggleCollapsedCssClass : options.toggleExpandedCssClass) +
          "'><span></span></button>" + item.title;
    }

    function defaultTotalsCellFormatter(row, cell, value, columnDef, item) {
      return (columnDef.groupTotalsFormatter && columnDef.groupTotalsFormatter(item, columnDef)) || "";
    }

    function init(grid) {
      _grid = grid;
      _grid.onClick.subscribe(handleGridClick);
      _grid.onKeyDown.subscribe(handleGridKeyDown);

    }

    function destroy() {
      if (_grid) {
        _grid.onClick.unsubscribe(handleGridClick);
        _grid.onKeyDown.unsubscribe(handleGridKeyDown);
      }
    }

    function handleGridClick(e, args) {
      var item = this.getDataItem(args.row);
      if (item && item instanceof Slick.Group && ($(e.target).hasClass(options.toggleCssClass) || $(e.target).parent().hasClass(options.toggleCssClass))) {
        if (item.collapsed) {
          this.getData().expandGroup(item.value);
        }
        else {
          this.getData().collapseGroup(item.value);
        }

        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }

    // TODO:  add -/+ handling
    function handleGridKeyDown(e) {
      if (options.enableExpandCollapse && (e.which == $.ui.keyCode.SPACE)) {
        var activeCell = this.getActiveCell();
        if (activeCell) {
          var item = this.getDataItem(activeCell.row);
          if (item && item instanceof Slick.Group) {
            if (item.collapsed) {
              this.getData().expandGroup(item.value);
            }
            else {
              this.getData().collapseGroup(item.value);
            }

            e.stopImmediatePropagation();
            e.preventDefault();
          }
        }
      }
    }

    function getGroupRowMetadata() {
      return {
        selectable: false,
        focusable: options.groupFocusable,
        cssClasses: options.groupCssClass,
        columns: {
          0: {
            colspan: "*",
            formatter: defaultGroupCellFormatter,
            editor: null
          }
        }
      };
    }

    function getTotalsRowMetadata() {
      return {
        selectable: false,
        focusable: options.totalsFocusable,
        cssClasses: options.totalsCssClass,
        formatter: defaultTotalsCellFormatter,
        editor: null
      };
    }

    return {
      "init":     init,
      "destroy":  destroy,
      "getGroupRowMetadata":  getGroupRowMetadata,
      "getTotalsRowMetadata": getTotalsRowMetadata
    };
  }
})(jQuery);

/*
* Auto ToolTips Plugin
*/
(function ($) {
$.extend(true, window, {
  "Slick": {
  "AutoTooltips": AutoTooltips
  }
});

function AutoTooltips(options) {
  var _grid,
    _commentPopup;

  function init(grid) {
  _grid = grid;
  _grid.onMouseEnter.subscribe(handleMouseEnter);
  _grid.onMouseLeave.subscribe(handleMouseLeave);
  }

  function destroy() {
    _grid.onMouseEnter.unsubscribe(handleMouseEnter);
  }

  function handleMouseLeave(e, args) {
    var cell = _grid.getCellFromEvent(e);

    if (cell) {
      $("#grid-tooltip").stop().delay(300).addClass('is-hidden');
    }
  }

  function handleMouseEnter(e, args) {
    var cell = _grid.getCellFromEvent(e);
    if (cell) {
    var node = _grid.getCellNode(cell.row, cell.cell),
      $node = $(node),
      col = _grid.getColumns()[cell.cell],
      row = _grid.getData().getItem(cell.row);

    if ($node.hasClass("error") && !$node.hasClass("editable") && row.validationMessages) {
      //show tool tip
      var tooltip = $('#grid-tooltip'),
        message = row.validationMessages.get(cell.cell).validationResults.msg;

      if (tooltip.length === 0) {
        tooltip = $('<div id="grid-tooltip" class="tooltip right is-error is-hidden" role="tooltip" ><div class="arrow"></div><div class="tooltip-content"><p></p></div>').appendTo('body');
      }
      $node.attr("title", message);
      tooltip.find('.tooltip-content').html('<p>' + message + '</p>');
      tooltip.delay(300).removeClass('is-hidden');
      tooltip.css({left: $node.offset().left + $node.width() + 20, top: $node.offset().top - 10 });
    }

    var drillDown = $node.children(".drilldown");
    if (drillDown.length === 1 && drillDown.attr("title") && !drillDown.hasClass("uneditable")) { //show tool tip
        drillDown.stop().delay(200).tooltip({maxWidth: 300, show: true, position: {my: "left+12", at: "right"}, arrowClass: "arrowLeft"});
    }

    if ($node.hasClass("status-indicator")) { //show tool tip
      var errorDiv = $node.find(".error");
      if (row.validationMessages) {
        errorDiv.attr("title", row.validationMessages.toString()).tooltip({maxWidth: 400, show: false, isErrorTooltip: true}).off("click");
        errorDiv.stop().delay(100).tooltip("open");
      } else {
        var nodeIcon = $node.find(".inforAlertIconSmall"),
          title = nodeIcon.attr("title");
        if (title) {
          nodeIcon.tooltip({maxWidth: 400, arrowClass: "arrowLeft", show: false, position: {
            my:  (!this.isRTL ? "left+10 center+1" : "right center+1"),
            at: (!this.isRTL ? "right+10 center+1" : "left center+1"),
            collision: "fit flip"
          }}).off("click");
          nodeIcon.stop().delay(100).tooltip("open");
        }
      }
    }

    if ($node && $node[0] && $node[0].scrollWidth && ($node.innerWidth() < $node[0].scrollWidth) && !$node.hasClass("non-data-cell")) {
      var text = $.trim($node.text()),
        isDropDown = ($node.html().toString().indexOf("inforDataGridDropDownList") != -1);

      //check for long text cell editor tooltip
      if (col.longTextTooltip){
        _commentPopup =_grid.showCommentsPopup($(e.currentTarget).offset(), text, false);
        return;
      }

      if (!isDropDown) {
        $node.attr("title", text);
      }
    } else {
      $node.removeAttr("title");
      if (_commentPopup)
        _commentPopup.hide();
      }
    }
  }

  $.extend(this, {
    "init": init,
    "destroy": destroy
  });
}
})(jQuery);

/*
* Infor DataGrid Plugin wraper.
*/
(function($) {

  var sortcol = "json_number";
  var slickOptions = {};

  PagingModes = {
    None : "None",
    LiveScrolling : "LiveScrolling",  //not supported yet...
    PagerServerSide : "PagerServerSide",
    ContinuousScrolling : "ContinuousScrolling",
    PagerClientSide : "PagerClientSide"
  }

  $.fn.inforDataGrid = function(options) {

    /* The Settings available for this control only. */
    var settings = {
      columns: null,  //The Column Collection
      dataset: [], //The JSON data
      idProperty:'id', //The field name that is the unique key field in the data
      editable: true, //If true you can enter cells and edit
      showCheckboxes:true, //Should we show the row selection checkboxes
      showDrillDown: true,  //Should we show the drill down column.
      drillDown: null,    //The Drill Down Callback function when a drill down is clicked
      drillDownTooltip: null, //a drill down tooltip.
      showStatusIndicators: true, //Should we show the status indicator: new/edit/error indicator
      showGridSettings: true, //should we show the grid settings button on the top left
      showFilter: true, //Should we display the Filter Bar and filtering options.
      forceFitColumns: false, //allow the columns to resize to fit the width the screen for a small number of columns.
      multiSelect: true, //can we select more than one row at a time.
      showHeaderContextMenu: true,
      enableRowReordering: false, //allow rows to be reordered...
      showFooter: false,  //show the paging footer?
      syncColumnCellResize: true,
      enableCellNavigation: true, //can click into cells.
      pageSize: 0,  //Paging Page size. 0 = all rows no paging. Reccomend 50, 100 or 200.
      pagingMode: PagingModes.None,   // see PagingModes
      enableGrouping: false,  //Enable the grouping features.
      rowHeight: 25,  //Change This if using multiline editor
      fillHeight: true, //should the grid size itself to the bottom of the page. use if grid is on the bottom and nothing underneath
      savePersonalization: true,  //should the personalization settings be saved in the browser? Or you use onPersonalizationChanged
      useLocalStorage: false, //should the personalization settings be saved using HTML5 localStorage? Otherwise use cookies.
      enableCellRangeSelection: true, //allows you to select/copy a range of cells.
      selectOnRowChange: false, //always select row when you click it.
      showExport: false,  //adds an export function to the footer.
      exportFileName: "Export.xls",
      showCellToolTips: true, //Enable Tooltips for the cells that do not fit
      showColumnHeaders: true,  //hide headers
      disableClientSort: false, //disable sort action on the client side - use if data is inconsistent
      disableClientFilter: false, //disable filter action on the client side - use if data is inconsistent
      selectChildren: true, //select children rows in tree grid mode.
      showPageSizeSelector: false,  //shows a page size selector on the footer.
      frozenColumn: -1, //start freezing columns at this col position
      selectRowInEditMode: false, //default is to not select a row in edit mode.
      filterMenuOptions: [{label: Globalize.localize("RunFilter"), href: "#rf" },
                {label: Globalize.localize("FilterWithinResults"), id: "filterInResults", cssClass: "selected", href: "#fwr"},
                {label: Globalize.localize("ClearFilter"), href: "#cf"}
              ],  //Configurable list of options and actions for the grid filter menu
      gridMenuOptions: [{label: Globalize.localize("ShowFilterRow"), href: "#sfr", cssClass: "selected", id: "showFilter"},
              {label: Globalize.localize("ColumnPersonalization"), href: "#cp", cssClass: "columns" },
              {label: Globalize.localize("ResetToDefault"), href: "#re"},
              {label: "", href: "#", cssClass: "separator"},
              {label: Globalize.localize("ExportToExcel"), href: "#ex", cssClass: "export", condition: options.showExport }
              ]//Configurable list of options and actions for the grid menu button
    };

    var selectedRowIds = [];  //Used for Filtering
    var gridObj = null;
    var dataView = null;

    var o = $.extend({}, settings, options); //Extend the options if any provided
    var $grid = $(this);

    /* Add Class for some default styling. */
    $grid.addClass('inforDataGrid');

    /* The Mapped Settings to the Slick grid */
    slickOptions = $.extend(o, {
        autoEdit: true,
        showHeaderRow: true,
        topPanelHeight: 25
      });

    //Create a DataView Which is used during sorting and selection.
    dataView = new Slick.Data.DataView({idProperty: o.idProperty, pagingMode: o.pagingMode, persistSelections: o.persistSelections});
    gridObj =  new Slick.Grid($grid, dataView, o.columns, slickOptions);
    $grid.data("gridInstance",gridObj); //save a ref ro the grid so it can be accessed by selector.

    //re-render grid when dataView changes and in filtering
    dataView.onRowCountChanged.subscribe(function (e, args) {
      gridObj.updateRowCount();
      gridObj.render();
    });

    // Subscribe to events to update row selection
    dataView.onRowsChanged.subscribe(function (e, args) {
      gridObj.invalidateRows(args.rows);
      gridObj.render();
      //consider persisted selections (which may not have been previously visible) if we're persisting selections
      var persist = gridObj.getOptions().persistSelections,
          selRowIdsToUse = persist ? gridObj.getSelectionModel().getPersistedIds() : selectedRowIds;

      if (selRowIdsToUse.length > 0) {
        // since how the original data maps onto rows has changed,
        // the selected rows in the grid need to be updated
        var selRows = [];
        for (var i = 0; i < selRowIdsToUse.length; i++) {
          var idx = dataView.getRowById(selRowIdsToUse[i]);
          if (idx != undefined)
            selRows.push(idx);
        }
        gridObj.setSelectedRows(selRows);
      }
      //if (o.showSummaryRow)
      //  gridObj.updateSummaryRow();
    });

    gridObj.setSelectionModel(new Slick.RowSelectionModel({ selectActiveRow: false }));

    //Render the gridObj.
    dataView.setFilter(gridObj.filter);

    if (o.pagingMode==PagingModes.ContinuousScrolling) {
      dataView.activeReq = false;
      dataView.currentPage = 0;
      gridObj.onViewportChanged.subscribe(function(e,args) {
        var vp = gridObj.getViewport(),
          toPage = Math.floor((vp.bottom + 1) / o.pageSize);

        if (toPage > dataView.currentPage && !dataView.activeReq) {
          dataView.currentPage++;
          dataView.setPagingOptions({pageNum: toPage});
        }
      });
      //loading the first page - must be done in view.
    }

    //Attach listeners for loading indicators
    var $viewport = $grid.find(".slick-viewport:visible").last();
    dataView.onDataLoading.subscribe(function(e,args) {
      $viewport.inforBusyIndicator();
      $viewport.css("overflow","hidden");
    });

    dataView.onDataLoaded.subscribe(function(e,args) {
      if ($viewport.data("uiInforBusyIndicator")) {
        $viewport.inforBusyIndicator("close");
        $viewport.css("overflow","auto");
      }
    });

    if (o.showFooter && $grid.next(".inforGridFooter").length==0) {
      var $footer = $('<div class="inforGridFooter"></div>');
      $grid.after($footer);
      dataView.setPagingOptions({pageSize:o.pageSize});
      gridObj.pager = new Slick.Controls.Pager(dataView, gridObj, $footer);
    }

    //Attach Cell Change Event to Track Status
    if (o.showStatusIndicators) {
      gridObj.onCellChange.subscribe(function (e, args) {
        var newValue = "";
        // Set dirty icon when a cell is edited but not new
        if (args.item.indicator != "new" && args.item.indicator != "error") {
          newValue = "dirty";
        }

        if (args.item.indicator != newValue && newValue != "") {
          args.item.indicator = newValue;
          gridObj.updateCell(args.row, args.cell);
        }
      });
    }

    //Attach Validation Events to show validation indicator
    gridObj.onValidationMessage.subscribe(function (e, args) {
      if (!args.cellNode) {
        return;
      }

      if (o.showStatusIndicators) {
        var indicatorIcon = $(args.cellNode.parentNode).children(".status-indicator").children(".indicator-icon")

        //add tooltip
        if (args.validationResults.msg)
          $(indicatorIcon).attr("title", args.validationResults.msg).tooltip();
        else
          $(indicatorIcon).attr("title","");
      }
    });

    //Setup the Sorting
    if (!options.disableClientSort) {
      gridObj.onSort.subscribe(function (e, args) {
      var cols = args.sortColumns;

      dataView.currentPage = 0;
      dataView.sort(function (dataRow1, dataRow2) {
        for (var i = 0, l = cols.length; i < l; i++) {
        var sortCol = cols[i].sortCol,
        sign = cols[i].sortAsc ? 1 : -1,
        value1 = gridObj.getDataItemValueForColumn(dataRow1, sortCol.field),
        value2 = gridObj.getDataItemValueForColumn(dataRow2, sortCol.field),
        result;

        if (typeof value1 =="string" && typeof value2 =="string") { // case insensitive sorting
          value1 = value1.toLowerCase();
          value2 = value2.toLowerCase();
        }

        if ((value1==undefined || value1==null))
              value1 = "";

        if ((value2==undefined || value2==null))
              value2 = "";

        result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
        if (result != 0) {
          return result;
        }
        }
        return 0;
      });

      gridObj.invalidate();
      gridObj.render();
      });
    }

    //attach the click event and button events and drill down.
    gridObj.onClick.subscribe(function(e,args) {
      var target = $(e.target);

      if (target.parent().hasClass("drilldown") && o.drilldown!=undefined) {
        //cell is uneditable.
        if (target.parent().hasClass("uneditable")) {
          return;
        }

        gridObj.getEditorLock().commitCurrentEdit();

        var item = dataView.getItem(args.row);
        o.drilldown(item);
      }

      //handle Grid buttons
      var target = $(e.target);
      if (target.parent().hasClass("gridButton")) {
        target = target.parent();
      }
      if (target.hasClass("gridButton")) {

        var columnId = target.attr("data-columnid");
        if (columnId!=undefined) {
          var columns = gridObj.getColumns(),
            idx = gridObj.getColumnIndex(columnId),
            columnDef = columns[idx],
            item = dataView.getItem(args.row);

          if (columnDef.buttonClick!=undefined) {
            if (target.parent().hasClass("inforToggleButton")) {
              target.parent().find("button").removeClass("checked")
              target.addClass("checked");
              item[columnId] = target.index();
            }
            columnDef.buttonClick(item);
          }
        }
      }

      // handle Tree Expand
      if ((target.hasClass("tree-expand") || target.parent().hasClass("tree-expand")) && gridObj.getOptions().treeGrid) {
        var item = gridObj.getData().getItem(args.row);
        if (item) {
          if (item.collapsed) {
          item.collapsed = false;
          gridObj.trigger(gridObj.onRowExpanded, { row: args.row, item: item});
          } else {
          item.collapsed = true;
          gridObj.trigger(gridObj.onRowCollapsed, { row: args.row, item: item});
          }
          gridObj.getData().updateItem(item[o.idProperty], item);
        }
        e.stopImmediatePropagation();
      }
    });

    // keep track of which rows are selected, in order to
    // reselect them when sorting
    gridObj.onSelectedRowsChanged.subscribe(function (e, args) {
      selectedRowIds = [];
      var rows = gridObj.getSelectedRows();
      for (var i = 0, l = rows.length; i < l; i++) {
        var item = dataView.getItem(rows[i]);
        if (item) {
          selectedRowIds.push($(item).attr(o.idProperty));
        }
      }
    });

    if (o.selectOnRowChange) {
      gridObj.onActiveCellChanged.subscribe(function (e, args) {
        gridObj.setSelectedRows([args.row]);
      });
    }

    gridObj.showGridSettings();

    if (o.showHeaderContextMenu)
      gridObj.onHeaderContextMenu.subscribe(handleHeaderContextMenu);

    //Row reordering
    if (o.enableRowReordering) {
      var moveRowsPlugin = new Slick.RowMoveManager();
      moveRowsPlugin.onBeforeMoveRows.subscribe(function(e,data) {
        for (var i = 0; i < data.rows.length; i++) {
          // no point in moving before or after itself
          if (data.rows[i] == data.insertBefore || data.rows[i] == data.insertBefore - 1) {
            e.stopPropagation();
            return false;
          }
        }
        return true;
      });
      moveRowsPlugin.onMoveRows.subscribe(function(e,args) {

        var extractedRows = [], left, right;
        var rows = args.rows;
        var insertBefore = args.insertBefore;
        var data = gridObj.getData().getItems();

        left = data.slice(0, insertBefore);
        right = data.slice(insertBefore, data.length);

        // Put in table order - the selection doesn't guarantee this
        rows.sort(function(a,b){return a-b});

        for (var i=0; i<rows.length; i++) {
          extractedRows.push(data[rows[i]]);
        }

        // Need to sort reverse numerically or else the splices below fail badly
        rows.reverse();

        for (var i=0; i<rows.length; i++) {
          var row = rows[i];
          if (row < insertBefore)
            left.splice(row,1);
          else
            right.splice(row-insertBefore,1);
        }

        data = left.concat(extractedRows.concat(right));

        var selectedRows = [];
        for (var j=0; j<rows.length; j++)
          selectedRows.push(left.length+j);

        gridObj.resetActiveCell();
        gridObj.updateData(data);
        gridObj.setSelectedRows(selectedRows);
        gridObj.render();
        gridObj.trigger(gridObj.onRowsMoved, { movedRows: extractedRows, positions: gridObj.getSelectedRows()});
      });

      gridObj.registerPlugin(moveRowsPlugin);
    }

    if (o.savePersonalization) {
      var cookieId = window.location.pathname+'#'+$grid.attr("id");
      var cookieContents = o.useLocalStorage ? localStorage.getItem(cookieId) : $.cookie(cookieId);
    }

    //process hidden columns
    var hiddenCols = [];
    for (var i = 0; i < o.columns.length; i++) {
      var col = o.columns[i];
      if (col.hidden == true) {
        hiddenCols.push(col.id);
      }
    }
    if (hiddenCols.length > 0) {
      gridObj.hideColumns(hiddenCols);
    }

    dataView.setItems(o.dataset);
    gridObj.setHeaderRowVisibility(o.showFilter);

    //save personalization in a cookie and restore settings
    if (o.savePersonalization) {
      gridObj.onPersonalizationChanged.subscribe(function (e, args) {
        delete args.grid; //dont serialize the grid object.
        if (o.useLocalStorage) {
          localStorage.setItem(cookieId, JSON.stringify(args));
        } else {
          $.cookie(cookieId, JSON.stringify(args), { expires: 3650 });//convert the JSON to a string...
        }
      });

      //restore previous - convert from string to JSON.
      if (cookieContents != null)
        gridObj.restorePersonalization(eval('(' + cookieContents + ')'));
    }

    if (o.showSummaryRow) {
      o.enableGrouping = true;  //needed to collect the grouping calcs..
    }

    if (o.enableGrouping) {
      //Add grouping and sum totals
      var groupItemMetadataProvider = new Slick.Data.GroupItemMetadataProvider();
      dataView.groupItemMetadataProvider = groupItemMetadataProvider;

      // register the group item metadata provider to add expand/collapse group handlers
      gridObj.registerPlugin(groupItemMetadataProvider);

      //need this to update the footer when a cell changes
      gridObj.onCellChange.subscribe(function (e, args) {
        dataView.refresh();
      });
    }

    //Enable Updating Totals on the Summary Row
    if (o.showSummaryRow) {
      gridObj.onCellChange.subscribe(function (e, args) {
        gridObj.updateSummaryRow();
      });

      dataView.onAggregatorsChanged.subscribe(function (e, args) {
        gridObj.updateSummaryRow();
      });
    }

    //excel copy and paste
    if (o.enableCellRangeSelection || o.showExport) {
            var _selector = new Slick.CellRangeSelector({ enableCellRangeSelection: o.enableCellRangeSelection, exportScriptUrl: o.exportScriptUrl, exportFileName: o.exportFileName});
      gridObj.registerPlugin(_selector);
    }

    if (o.showCellToolTips) {
      gridObj.registerPlugin(new Slick.AutoTooltips());
    }

    gridObj.resizeCanvas();

    if (o.variableRowHeight && o.variableRowHeightColumn != "rowHeight") {
      gridObj.onCellChange.subscribe(function (e, args) {
          var col = gridObj.getColumns()[args.cell];
          if (col && col.cssClass =="autoHeight" ) {
            gridObj.invalidateAllRows();
            gridObj.render();
            gridObj.resizeCanvas();
          }
        });
    }

    gridObj.isLookupGrid = $(this).is("#lookupGridDivId");
    return gridObj;
};

  function handleHeaderContextMenu(e, args) {
    //prevent normal menu
    e.preventDefault();

    if (args.column==undefined)
      return;

    if (args.column.builtin) {
      return;
    }

    //add the menu
    $("#gridHeaderMenuOptions").remove();
    var $menu = $('<ul id="gridHeaderMenuOptions" class="popupmenu divider"></ul>');
    if (args.column.sortable) {
      $menu.append('<li><span class="icon sortAsc"></span><a href="#sortAsc">'+Globalize.localize("SortAscending")+'</a></li>');
      $menu.append('<li><span class="icon sortDesc"></span><a href="#sortDesc">'+Globalize.localize("SortDescending")+'</a></li>');
    }

    if (args.grid.getOptions().showGridSettings && args.column.hidable) {
      $menu.append('<li><a href="#hide">'+Globalize.localize("HideColumn")+'</a></li>');
    }

    $('body').append($menu);
    //figure out which column we are on

    var $header = $(args.header);
    $header.popupmenu({
      menu: 'gridHeaderMenuOptions',
      trigger: 'immediate'
    })
    .on('selected', function(e, anchor) {
      var action = anchor.attr('href').substr(1);

      if (action=="hide")
        args.grid.hideColumn(args.column.id);

      if (action=="sortAsc")
        args.grid.setSortColumn(args.column.id, true);

      if (action=="sortDesc")
        args.grid.setSortColumn(args.column.id, false);
    });
  }

  // Add Ends With to String prototype
  String.prototype.endsWith = function (s) {
    return this.length >= s.length && this.substr(this.length - s.length) == s;
  }

  // Simple JavaScript Templating
  // John Resig - http://ejohn.org/ - MIT Licensed
  var cache = {};
  this.tmpl = function tmpl(str, data) {
  // Figure out if we're getting a template, or if we need to
  // load the template - and be sure to cache the result.
  var fn = !/\W/.test(str) ?
    cache[str] = cache[str] ||
    tmpl(document.getElementById(str).innerHTML) :

    // Generate a reusable function that will serve as a template
    // generator (and which will be cached).
    new Function("obj",
      "var p=[],print=function(){p.push.apply(p,arguments);};" +

      // Introduce the data as local variables using with(){}
      "with(obj){p.push('" +

      // Convert the template into pure JavaScript
      str
        .replace(/[\r\t\n]/g, " ")
        .replace(/\&lt;%=/g, "<%=")     //convert back to
                .replace(/%\&gt;/g, "%>")      //convert back to
        .split("<%").join("\t")
        .replace(/((^|%>)[^\t]*)'/g, "$1\r")
        .replace(/\t=(.*?)%>/g, "',$1,'")
        .split("\t").join("');")
        .split("%>").join("p.push('")
        .split("\r").join("\\'") + "');}return p.join('');");

  // Provide some basic currying to the user
  return data ? fn(data) : fn;
  };
}($));
