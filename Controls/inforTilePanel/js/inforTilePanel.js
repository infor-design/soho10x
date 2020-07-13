/*
* Infor Tile Panel
*/
(function ($) {
	$.widget("ui.inforTilePanel", {
		options: {
			sortable: true
		},
		_init: function () {
			var self = this,
				panel = this.element,
				masonryOpts = {
					itemSelector: '.inforPanelItem',
					isAnimated: true,
					columnWidth: function (containerWidth) {
						return containerWidth / 250;
					},
					isRTL: Globalize.culture().isRTL
				};

			//Setup Tile Panel using jQuery Masonry Plugin.
			panel.addClass("inforTilePanel").masonry(masonryOpts);

			//Add Sortability.
			if (this.options.sortable) {
				this._addSortable(panel);
			}

			panel.find(".inforCountDown").each(function () {
				self._setupCountDowns($(this));
			});

			self._setupSettings(panel);
			self._setupExpand(panel);
			panel.parent().css("overflow", "auto"); //allow scrolling
			$("body").removeClass("inforHidden");
		},
		_setupExpand: function (panel) {
			var self = this;
			panel.find(".inforPanelExpand").each(function () {
				var expandBtn = $(this),
					item = expandBtn.closest(".inforPanelItem");

				expandBtn.attr("title", Globalize.localize("ExpandCollapse")).on("click", function () {
					self._toggleExpand($(this));
				});

				if (expandBtn.hasClass("expanded")) {
					this._toggleExpand(expandBtn);
				}  
			});
		},
		_toggleExpand: function (button) {
			var panel = this.element,
				item = button.closest(".inforPanelItem"),
				expanding = !item.hasClass("expanded");

			if (expanding) {
				item.addClass("expanded").css("height", item.height() * 2);
				button.addClass("up");
				item.find(".inforDataGrid").css("margin-top", "-8px").find(".slick-row:first").css("border", "");
			} else {
				item.removeClass("expanded").css("height", "");
				button.removeClass("up");
				item.find(".inforDataGrid").css("margin-top", "");
				item.find(".inforDataGrid").css("margin-top", "-8px").find(".slick-row:first").css("border", "none");
			}

			panel.masonry('reload');

			setTimeout(function () {
				item.find(".inforDataGrid").each(function () {
					var grid = $(this);
					grid.height(item.find(".inforPanelBody").height() + (!expanding ? -25 : -25));
					grid.data("gridInstance").resizeCanvas();
					if (!expanding) {
						grid.find(".slick-row:first").css("border", "none");
					}
				});
			}, 1);
		},
		_addSortable: function (panel) {
			panel.sortable({
				distance: 20,
				forcePlaceholderSize: true,
				items: '.inforPanelItem',
				placeholder: 'inforPanelPlaceholder inforPanelItem',
				tolerance: 'pointer',
				handle: '.inforPanelHeader',
				cursor: 'move',
				start: function (event, ui) {
					var item = ui.item,
						parent = ui.item.parent();

					ui.item.find(".inforPanelSettings").hide();
					item.addClass('inforPanelItemDragging');
					parent.masonry('option', {
						isAnimated: false
					}).masonry('reload').masonry('option', {
						isAnimated: true
					});
				},
				change: function (event, ui) {
					var parent = ui.item.parent();
					//.masonry( 'option', {isAnimated: false} ) ?? if we dont like the animaition.
					parent.masonry('option', {
						isAnimated: false
					}).masonry('reload').masonry('option', {
						isAnimated: true
					});
				},
				stop: function (event, ui) {
					var item = ui.item,
						parent = ui.item.parent();

					item.removeClass('inforPanelItemDragging');
					parent.masonry('option', {
						isAnimated: false
					}).masonry('reload').masonry('option', {
						isAnimated: true
					});
				}
			});
		},
		_setupCountDowns: function (panel) {
			var countTo = Date.parse(panel.text()),
				interval = setInterval(function () {
					var now = new Date(),
					diff = countTo - now,
					days, dd, hh, mm, ss, hours, mins, secs, html;

					days = Math.floor(diff / (1000 * 60 * 60 * 24));
					hours = Math.floor(diff / (1000 * 60 * 60));
					mins = Math.floor(diff / (1000 * 60));
					secs = Math.floor(diff / 1000);

					dd = days;
					hh = hours - days * 24;
					mm = mins - hours * 60;
					ss = secs - mins * 60;

					html = '<table><tbody><tr><td>' + dd + '</td><td>&nbsp;</td><td class="hour">' + hh + '</td><td class="min">' + mm + '</td><td>' + ss + '</td></tr><tr><td>Days</td><td>&nbsp;</td><td>Hours</td> <td>Minutes</td> <td>Seconds</td> </tr> </tbody></table>';
					panel.html(html).fadeIn();

					clearInterval(interval);    //ignore jslint
				}, 1000);
		},
		_setupSettings: function (panel) {
			//setup the settings animations - will go in the control
			panel.find(".inforPanelSettingsButton").click(function () {
				var panel = $(this).closest(".inforPanelItem");
				panel.find(".inforPanelHeader, .inforPanelBody, .inforPanelSettings").hide("");

				if (panel.hasClass("flipped")) {
					panel.removeClass("flipped");
					panel.find(".inforPanelHeader, .inforPanelBody").show("");

				} else {

					panel.addClass("flipped");
					panel.find(".inforPanelSettings").show("");
				}
			});
		},
		setupDragDrop: function (sourceGridDiv, sourcePane) {
			var sourceGrid = sourceGridDiv.data("gridInstance"),
				dragTarget = $("#campaignStatus"),
				i;

			//subscribe events to the drag source
			sourceGrid.onDragInit.subscribe(function (e) {
				// prevent the object from cancelling drag'n'drop by default
				e.stopImmediatePropagation();
			});

			sourceGrid.onDragStart.subscribe(function (e, dd) {
				var cell = sourceGrid.getCellFromEvent(e),
					data = sourceGrid.getData().getItems(),
					heightTotal, proxy, selectedRows, cellNode, width, height;

				if (!cell) {
					return;
				}

				dd.row = cell.row;
				if (!data[dd.row]) {
					return;
				}

				if (Slick.GlobalEditorLock.isActive()) {
					return;
				}

				e.stopImmediatePropagation();
				selectedRows = sourceGrid.getSelectedRows();

				if (!selectedRows.length || $.inArray(dd.row, selectedRows) == -1) {
					selectedRows = [dd.row];
					sourceGrid.setSelectedRows(selectedRows);
				}

				dd.rows = selectedRows;
				dd.count = selectedRows.length;

				//copy the cell nodes...
				proxy = $("<span class='inforDragProxy'></span>");
				heightTotal = 0;

				for (i = 0; i < selectedRows.length; i++) {
					cellNode = $(sourceGrid.getCellNode(selectedRows[i], 0));
					width = cellNode.width();
					height = cellNode.height();

					heightTotal += height;

					cellNode.clone().height(height).width(width)
						.css("top", (heightTotal - height > 0 ? heightTotal - height : 0)).removeClass("selected").appendTo(proxy);
				}

				proxy.width(width).height(heightTotal).appendTo("body");
				dd.helper = proxy;
				proxy.find('.autoLabelWidth').find('.inforLabel').autoWidth();
				proxy.find('.inforCardstackCell').css("padding", "10px").addClass("inforPanelBody");
				proxy.find('.inforCardstackHeading').css("left", "-75px");

				dragTarget.addClass("inforPanelDragTarget ");
				sourcePane.parent().find(".inforPanelItem").not(dragTarget).not(sourcePane).css({
					opacity: 0.1
				});
				return proxy;
			});

			sourceGrid.onDrag.subscribe(function (e, dd) {
				e.stopImmediatePropagation();
				dd.helper.css({
					top: e.pageY + 14,
					left: e.pageX + 14
				});
			});

			sourceGrid.onDragEnd.subscribe(function (e, dd) {
				e.stopImmediatePropagation();
				dd.helper.remove();
				dragTarget.removeClass("inforPanelDragTarget");
				sourcePane.parent().find(".inforPanelItem").not(dragTarget).not(sourcePane).css({
					opacity: 1
				});
			});

			dragTarget.bind("dropend", function (e, dd) {
				$(dd.available).removeClass("dragTarget");
			})
				.bind("drop", function (e, dd) {
					if (!dd.helper) {
						return; //to avoid this firing on row move/column drag exc..
					}

					$(this).find(".inforLabelLarge").html(dd.helper.find(".inforCardstackHeading").html());
				});

			$.drop({
				mode: true
			}); //set mode so that when we drag onto the element it drops as apposed to if the proxy touches it
		}
	});
}(jQuery));