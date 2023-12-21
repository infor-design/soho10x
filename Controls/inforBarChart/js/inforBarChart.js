/*
* Infor Bar Chart - SVG D3
*/
(function($) {
$.widget('ui.inforBarChart', {
		options: {
			data: [4, 8, 15, 16, 23, 42],
			title: 'Chart Title',
			subTitle: null,
			barColor: '#13A3F7'
		},
		_init: function() {
			var o = this.options,
				self = this,
				zone = (self.element.attr('id') ? '#' + self.element.attr('id') : 'body'),
				height = self.options.data.length * 30;

			self.width = 320;
			self.barHeight = 18;
			self.barSpacing = 6;
			self.textPadding = 100;

			/*Random Colors
				color = d3.scale.ordinal().range(["#61C5FF", "#13A3F7", "#005CE6", "#9ED927", "#2BD329", "#00733A", "#FFD500",
					"#FFAA00", "#FF6400", "#FF574D", "#D5000E", "#B3000C", "#FF80A2", "#E63262",
					"#BF2951", "#C680FF", "#a352cc", "#7533A6", "#B3B3B3", "#737373", "#595959", "#6DD9D1", "#00C2B4", "#00898C"]);

				.style({"fill": function(d, i) { return color(i); }, "stroke":"white"})
			*/

			self.svg = d3.select(zone).append('svg:svg')
				.attr('width', self.width)
				.attr('height', height)
				.style('font-family', 'Arial,helvetica,sans-serif');

			//add title
			self.title = self.svg.append('text')
				.attr('transform', function() { return 'translate(0, 20)';})
				.style({'fill': '#888A90' , 'font-size': '16px', 'font-weight': '400'})
				.text(o.title);

			if (self.options.subTitle) {
				self.subTitle = self.svg.append('text')
					.attr('transform', function() { return 'translate(0, 38)';})
					.style({'fill': '#888A90' , 'font-size': '14px', 'font-weight': '400'})
					.text(o.subTitle);
			}

			//add scale
			var g = self.svg.append('g').attr('transform', function() { return 'translate(0, 55)';});

			var bar = g.selectAll('rect')
					.data(self.options.data)
					.enter().append('g').attr('class', 'barGroup');

			bar.append('rect')
				.attr('y', function(d, i) {return (i * self.barHeight) + (self.barSpacing * i);})
				.attr('x', self.textPadding)
				.attr('width', function(d) {return d.value / self.width;})
				.style({'fill': self.options.barColor, 'stroke': 'white'})
				.attr('height', self.barHeight);

			//Add Labels on the bars
			bar.append('text')
				.attr('class', 'barValue')
				.attr('x', function(d) {return (d.value / self.width) + self.textPadding - 5;})
				.attr('y', function(d, i) {return (i * self.barHeight) + (self.barSpacing * i);})
				.attr('dy', '13')
				.attr('text-anchor', 'end')
				.style({'fill': 'white', 'font-size': '11px'})
				.text(function(d) {return d.value;});

			bar.append('text')
				.attr('class', 'barLabel')
				.attr('y', function(d, i) {return (i * self.barHeight) + (self.barSpacing * i);})
				.attr('dy', '13')
				.attr('text-anchor', 'start')
				.style({'fill': '#888A90', 'font-size': '12px'})
				.text(function(d) {return d.label;});
		},
		update: function(data, title, subTitle) {
			var self = this;

			if (title) {
				self.title.text(title);
			}
			if (subTitle) {
				self.subTitle.text(subTitle);
			}

			var rect = self.svg.selectAll('.barGroup')
						.data(data);

			//update the chart
			rect.transition()
				.select('rect')
					.duration(1000)
					.attr('y', function(d, i) {return (i * self.barHeight) + (self.barSpacing * i);})
					.attr('x', self.textPadding)
					.attr('width', function(d) {return d.value / self.width;})
					.style({'fill': self.options.barColor, 'stroke': 'white'})
					.attr('height', self.barHeight);

			rect.transition()
				.select('.barLabel')
					.duration(1000)
					.text(function(d) {return d.label;});

			rect.transition()
				.select('.barValue')
					.duration(1000)
					.attr('x', function(d) {return (d.value / self.width) + self.textPadding - 5;})
					.text(function(d) {return d.value;});

			rect.exit().remove();
		}
	});
})(jQuery);
