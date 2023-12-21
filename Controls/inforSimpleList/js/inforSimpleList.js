/*
* Infor List Grid Control
*/
(function ($) {
	$.widget("ui.inforSimpleList", {
		options: {
			dataset: [],
			columns: [],
			showDrillDown: true,
			onDrillDown: function(e) {}	//drill down callback.
		},
		_create: function () {
			var self = this,
				o = this.options,
				rowHtml = "",
				headerRow = "",
				tableHtml = $("<table></table>").addClass("inforSimpleList");
			
			//loop the data set and create an html table which we style
			for (var i = 0; i < o.dataset.length; i++) {
				rowHtml = "<tr>";
				headerRow = "<thead class='inforScreenReaderText'><tr>";
				
				if (o.showDrillDown) {
					rowHtml += "<td>" + "<a href='#' class='drilldown'><span></span></a>" + "</td>";
					headerRow += "<th></th>";
				}
				
				for (var j = 0; j < o.columns.length; j++) {
					var formatter = (o.columns[j].formatter ? o.columns[j].formatter : self._defaultFormatter);
					rowHtml += "<td>";
					
					if (o.columns[j].name) {
						rowHtml += "<span class='inforListGridLabel'>" + o.columns[j].name + "</span>";
					}
					rowHtml += formatter(i, j, o.dataset[i][o.columns[j].field], o.columns[j], o.dataset[i]) + "</td>";
					headerRow += "<th>" + o.columns[j].name + "</th>"
				}
				rowHtml += "</tr>";
				headerRow += "</tr></thead>";
				tableHtml.append(rowHtml);
			}
			
			tableHtml.prepend(headerRow);
			self.element.append(tableHtml);
			
			if (o.showDrillDown) {
				self.element.on("click", ".drilldown", o.onDrillDown);
			}
		},
		_defaultFormatter: function(row, cell, value, columnDef, dataContext) {
			return (value === null || value === undefined) ? "" : value;
		}
	});
})(jQuery);