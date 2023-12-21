/*
* Infor Pie Chart - SVG D3
*/
(function ($) {
$.widget("ui.inforPieChart", {
		options: {
			data:  [{label: "20%", value: 20, tooltip: "20 Percent"},
					{label: "50%", value: 50, tooltip: "50 Percent"},
					{label: "10%", value: 10, tooltip: "10 Percent"},
					{label: "15%", value: 15, tooltip: "15 Percent"}],
			title: "Chart Title"
		},
		_init: function () {
			var o = this.options,
				self = this,
				zone = (self.element.attr("id") ? "#" + self.element.attr("id"): "body"),
				width = 185,
				height = 240,
				radius = Math.min(width, height) / 2,
				color = d3.scale.ordinal().range(["#13a3f7", "#2db329", "#ffaa00", "#a352cc", "#e63262", "#d5000e", "#737373",
						"#00c2b4", "#61c5ff", "#9ed927", "#ffd500", "#ff574d", "#ff80a2", "#c680ff",
						"#b3b3b3", "#6dd9d1", "#005ce6", "#00733a", "#ff6400", "#b3000c", "#bf2951", "#7533a6", "#595959", "#00898c"]);
						
			self.donut = d3.layout.pie().sort(null).value(function(d) { return d.value; });
			self.arc = d3.svg.arc().innerRadius(radius - 10).outerRadius(radius - 45);

			var data = o.data;
			self.svg = d3.select(zone).append("svg:svg")
				.attr("width", width)
				.attr("height", height)
				.style("font-family", "Arial,helvetica,sans-serif")
				.append("g")
					.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

			self.title = self.svg.append("text")
				.attr("transform", function() { return "translate(0,-100)";})
				.style({"text-anchor":"middle", "fill":"#888A90" , "font-size": "16px", "font-weight": "400"})
				.text(o.title);

			var tooltip = $("#svgtooltip");
			if (tooltip.length == 0) {
				tooltip = $("<div id='svgtooltip' class='inforTooltip arrowBottomLeft'>").hide();
				$("body").append(tooltip);
			}
			
			var g = self.svg.selectAll("path")
				.data(self.donut(data))
				.enter().append("g")
				.attr("class", "arc")
				.on("mouseover", function(d) {
					if (d.data.tooltip) {
						tooltip.text(d.data.tooltip).show();
					}
				})
				.on("mousemove", function (d, i, e) {
					var pos = d3.event.currentTarget.getBoundingClientRect();
					tooltip.css("left", (pos.left)+"px").css("top",(pos.top - tooltip.height() - 30)+"px");
				})
				.on("mouseout", function() {
					tooltip.hide();
				});

				//.style("cursor", "pointer")
				//.on("click", function() {
				//	//Future selected styling... d3.select(this).attr("transform", "translate(1,1)");
				//});

			self.arcs = g.append("svg:path")
					.attr("fill", function(d, i) { return color(i); })
					.attr("d", self.arc)
					.each(function(d) { this._current = d;});
			
			self.labels = g.append("text")
					.attr("transform", function(d) { return "translate(" + self.arc.centroid(d) + ")"; })
					.attr("dy", ".35em")
					.attr("class", "label")
					.style({"text-anchor":"middle", "fill":"white", "font-size": "14px", "font-weight": "400", "pointer-events": "none"})
					.text(function(d) { return d.data.label; });
					
			g.append("title").text(function(d) {return d.data.tooltip;});
		},
		update: function(data, title) {
			var self = this;

			self.arcs = self.arcs.data(self.donut(data));
			self.arcs.transition().duration(750).attrTween("d", arcTween);

			self.labels.data(self.donut(data));
			self.labels.transition().duration(600)
				.attr("transform", function(d) {return "translate(" + self.arc.centroid(d) + ")"; })
				.text(function(d) { return d.data.label; })
				.style("fill-opacity", function(d) {return d.value === 0 ? 1e-6 : 1;});

			self.title.text(title);

			// Store the currently-displayed angles in this._current.
			// Then, interpolate from this._current to the new angles.
			function arcTween(a) {
				var i = d3.interpolate(this._current, a);
					this._current = i(0);
					return function(t) {
					return self.arc(i(t));
				};
			}
		}
	});
})(jQuery);
