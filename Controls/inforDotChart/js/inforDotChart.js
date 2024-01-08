/*
* Infor Dot Chart - SVG D3
*/
(function ($) {
$.widget("ui.inforDotChart", {
		options: {
			data: [3,7,9,1,4,6,8,2,5],
			title: "Chart Title",
			colorRange: ["#13a3f7", "#7533a6", "#2db329", "#a352cc", "#e63262", "#d5000e", "#737373",
						 "#00c2b4", "#61c5ff", "#9ed927", "#ffd500", "#ff574d", "#ff80a2", "#c680ff",
						 "#b3b3b3", "#6dd9d1", "#005ce6", "#00733a", "#ff6400", "#b3000c", "#bf2951",
						 "#ffaa00", "#595959", "#00898c"],
			onSelected: null,
			height: 350,  //320
			width: 350	//320
		},
		parseDate: null,
		_init: function () {
		
			var svg, x, y, i, tickRound,
				self = this,
				zone = (self.element.attr("id") ? "#" + self.element.attr("id"): "body"),
				margin = {top: 80, right: 20, bottom: 40, left: 50};
				
			//Document width and height
			self.w = self.options.width,
			self.h = self.options.height;
			
			//Massage the tabular data into : labels and seperate arrays
			self._parseData(self.options.data);
			
			//Set scales
			x = d3.scale.linear().domain([0, self.longest - 1]).range([0, self.w]);
			tickRound = (self.max-self.min) / 4 /2;
			y = d3.scale.linear().domain([self.min, self.max + tickRound]).range([self.h, 0]);
			//Ordinalize the colors
			self.color = d3.scale.ordinal().range(self.options.colorRange);
				
			//Add the Base Svg Layer
			self.svg = d3.select(zone)
				.append("svg")
					.attr("width", self.w + margin.left + margin.right)
					.attr("height", self.h + margin.top + margin.bottom)
					.attr("class", "inforDotChart")
				.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
			//Add Ticks and Lines
			var ticks = self.svg.selectAll(".ticky")
							.data(y.ticks(6))
							.enter().append("svg:g").attr("transform", function(d) {
								return "translate(0, " + (y(d)) + ")";
							}).attr("class", "ticky");
							
			ticks.append("line")
				.attr("y1", 0)
				.attr("y2", 0)
				.attr("x1", 0)
				.attr("x2", self.w);
				
			ticks.append("text")
				.text(function(d) {
					return d;
				})
				.attr("text-anchor", "end")
				.attr("dy", 2)
				.attr("dx", -14);
			
			ticks = self.svg.selectAll(".tickx")
						.data(x.ticks(self.longest))
						.enter()
							.append("g").attr("transform", function(d, i) {
								return "translate(" + x(i) + ", " + (self.h + 12) + ")";
							})
							.style("text-transform", "uppercase")
							.attr("class", "tickx");

			//Add Tick labels
			ticks.append("text")
				.text(function(d, i) {
					return self.axisLabels[i];
				})
				.attr("transform", "rotate(90)");
				
					
			//Add 1 to n lines - we add after so they are above the lines.
			self.svg.selectAll("path.line")
					.data(self.mergedData)
				.enter().append("path")
					.attr("d", d3.svg.line()
						.x(function(d,i) { return x(i);})
						.y(y))
					.attr("class", "line")
					.style("stroke", function(d, i) { return self.color(i); });
				
			
			// Define 'div' for tooltips
			var tooltip = d3.select("body").append("div")	
				.attr("class", "inforTooltip arrowBottom")	
				.style("opacity", 0);						
				
			//Add the Dots and Interactivity with them	
			var cnt = 0;
			for (i=0; i < self.mergedData.length; i++) {
					self.svg.selectAll(".point-" + i).data(self.mergedData[i]).enter().append("circle").attr("class", "point")
						.attr("r", 3)
						.style("stroke", self.color(i))
						.style("fill", self.color(i))
						.style("cursor", "pointer")
						.attr("class", "dot")
						.attr("cx", function(d, i) {
							return x(i);
						}).attr("cy", function(d) {
							return y(d);
						}).on("mouseover", function (d, i) {
							var dot = d3.select(this),
								coord = d3.event.currentTarget.getBoundingClientRect();
							
							tooltip.transition()								
									.duration(300)								
									.style("opacity", 1);							
							
							tooltip.html(self.axisLabels[i] + "<br>" + d)	
								.style("left", (coord.left) - 42 + "px")
								.style("width", 70 + "px")	
								.style("text-transform", "uppercase")
								.style("top", (coord.top - 60) + "px");
									
							dot.attr("r", 5);
						}).on("mouseout", function() {
							var dot = d3.select(this);
								isSelected = dot.classed("selected");
							
							tooltip.transition()
									.duration(500)
									.style("opacity", 0);
								
							if (!isSelected) {
								d3.select(this).attr("r", 3);
							}
						}).on("click", function(d, i) {
							var dot = d3.select(this);
								isSelected = dot.classed("selected");
							
							if (isSelected) {
								dot.attr("r", 3).style("stroke", "");
							} else {
								dot.attr("r", 4).style("stroke", d3.rgb(dot.style("fill")).darker().darker());
							}
							dot.classed("selected", !isSelected);	
							
							if (self.options.onSelected){
								self.options.onSelected(d,i, dot);
							}
							return;
						});
						
				cnt++;
			}
				
					
			//Add the title	
			self.svg.append("text")
				.attr("x", 0)             
				.attr("y", - 40)
				.attr("text-anchor", "start")  
				.attr("class", "heading")
				.text(self.options.title);	
				
			//Add the legend
			var legend = self.svg.selectAll('g.legend')
				.data(self.legendLabels)
				.enter()
				.append('g')
				.attr('class', 'legend');
			
			legend.append('rect')
				.attr('x', self.w - 90)
				.attr('y', function(d, i){ return (i *  17) - 52;})
				.attr('width', 15)
				.attr('height', 10)
				.style('fill', function(d,i) { 
					return self.color(i);
				});
			
			legend.append('text')
				.attr('x', self.w - 70)
				.attr('y', function(d, i){ return (i *  17) - 42.5;})
				.text(function(d){ return d; });
				
		},
		_parseData: function () {
			var self = this;
			self.mergedData = [];	
			self.legendLabels = [];
			self.axisLabels = [];
				
			self.mergedData = new Array(self.options.data[0].length-1);
			for (i = 0; i < self.mergedData.length; i++) {
				self.mergedData[i] = new Array(self.options.data.length-1);
			}
			
			$.map(self.options.data, function(line, i) {
				if (i === 0) {
					self.legendLabels = line.slice(1);
					return;
				}
				self.axisLabels.push(self.options.data[i].splice(0,1)[0]);
				
				var linePoints = line;
				for (var j=0; j < linePoints.length; j++) {
					self.mergedData[j][i-1] = linePoints[j];
				}
				
			});
			
			//Find the max in all arrays
			self.max = d3.max(self.mergedData, function(array) {
				return d3.max(array);
			});
			
			self.min = d3.min(self.mergedData, function(array) {
				return d3.min(array);
			});
			
			//find the longest
			self.longest = self.mergedData[0].length;
			
			return self.mergedData;
		},
		update: function(data, title, subTitle) {
			var self = this;
			self.options.data = data;
			
			self.element.empty();
			self._init();
		}
	});
})(jQuery);
