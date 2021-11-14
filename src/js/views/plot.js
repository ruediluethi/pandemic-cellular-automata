var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify'); // ~150KB !!

var pathDrawFunction = d3.svg.line()
    .x(function(d){ return d.x; })
    .y(function(d){ return d.y; })
    .interpolate('linear');


module.exports = Backbone.View.extend({

	className: 'plot',

	title: 'untitled',
	width: 200,
	height: 200,
	padding: 1,
	paddingTop: 0,
	paddingBottom: 20,
	diagramWidth: 0,
	diagramHeight: 0,
	heightScale: 1,

	colors: ['#444444'],
	alpha: undef,
	stroke: undef,
	resetAt: 5,
	minValue: -1,
	maxValue: 1,
	starT: 0,
	endT: 50,
	helpLinesCount: 5,
	yAxisLabel: 'Zeit',

	ticks: 10,
	tocks: 25,

	gAxis: undef,
	gGraphs: undef,
	gLabels: undef,

	percentOnly: true,

	t: 0,
	avg: [],
	max: [],

	initialize: function(options) {
		var self = this;

		if (options != undef){
			self.title = options.title;
			self.minValue = options.minValue;
			self.maxValue = options.maxValue;
			self.alpha = options.alpha;
			self.stroke = options.stroke;
			if (options.colors != undef){
				self.colors = options.colors;
			}
			if (options.startT != undef && options.endT != undef){
				self.starT = options.startT;
				self.endT = options.endT;
			}
			if (options.helpLinesCount != undef){
				self.helpLinesCount = options.helpLinesCount;
			}
			if (options.heightScale != undef){
				self.heightScale = options.heightScale;
			}
			if (options.yAxisLabel != undef){
				self.yAxisLabel = options.yAxisLabel;
			}
			if (options.ticks != undef){
				self.ticks = options.ticks;
			}
			if (options.tocks != undef){
				self.tocks = options.tocks;
			}
			if (options.resetAt != undef){
				self.resetAt = options.resetAt;
			}
		}
	},


	render: function(){
		var self = this;

		self.$el.html(templates['plot']({ title: self.title }));
		var svg = d3.select(self.$el.find('svg')[0]);

		self.width = self.$el.width();
		self.height = self.width*self.heightScale;

		self.$el.css({
			height: self.height
		});

		svg.attr('width', self.width);
		svg.attr('height', self.height);

		self.diagramWidth = self.width - 2*self.padding;
		self.diagramHeight = self.height - self.paddingTop - self.paddingBottom;

		self.gGraphs = svg.append('g');
		self.gGraphs.attr('transform', 'translate('+self.padding+','+self.paddingTop+')');

		self.gAxis = svg.append('g');
		self.gAxis.attr('transform', 'translate('+self.padding+','+self.paddingTop+')');

		self.gLabels = svg.append('g');
		self.gLabels.attr('transform', 'translate('+self.padding+','+self.paddingTop+')');

		self.renderAxis();

		self.gGraphs.selectAll('path').data(self.colors)
			.enter()
			.append('path')
			.attr('fill', function(d,i){
				if (self.stroke != undef){
					if (self.stroke[i]){
						return 'transparent';
					}else{
						return d;
					}
				}else{
					return d;
				}
			})
			.attr('stroke', function(d,i){
				return d;
			})
			.attr('stroke-width', function(d,i){
				if (self.stroke != undef){
					if (self.stroke[i]){
						return 2;
					}else{
						return 0;
					}
				}else{
					return 0;
				}
			})
			.attr('opacity', function(d,i){
				if (self.alpha != undef){
					return self.alpha[i];
				}else{
					return 1;
				}
			})
			// TODO
			//.style('stroke-dasharray', function(d,i){
			//	return ("3, 3");
			//});

		return self;
	},

	addLegend: function(i, text, fullAlpha){
		var self = this;

		var $legend = $('<div class="plot-legend"><svg></svg>'+text+'<div>');
		var svgIcon = d3.select($legend.find('svg')[0]);
		svgIcon.attr('width', 14);
		svgIcon.attr('height', 14);
		svgIcon.append('line')
			.attr('x1', 0)
			.attr('y1', 10)
			.attr('x2', 14)
			.attr('y2', 10)
			.attr('stroke-width', 2)
			.attr('stroke',self.colors[i])
			.attr('opacity', function(){
				if (self.alpha != undef && !fullAlpha){
					return self.alpha[i];
				}
				return 1;
			});
		self.$el.find('.plot-wrapper').append($legend);
	},

	renderAxis: function(){
		var self = this;

		var zeroXpos = self.diagramWidth/Math.abs(self.endT - self.starT)*Math.abs(self.starT);
		self.gAxis.append('line')
			.attr('x1', zeroXpos)
			.attr('y1', 0)
			.attr('x2', zeroXpos)
			.attr('y2', self.diagramHeight)
			.attr('stroke-width', 1)
			.attr('stroke','#000000');

		for (var i = 1; i < self.helpLinesCount; i++){
			var value = self.minValue + Math.abs(self.maxValue - self.minValue)*i/(self.helpLinesCount-1);

			self.gAxis.append('line')
				.attr('x1', 0)
				.attr('y1', self.valueToY(value))
				.attr('x2', self.diagramWidth)
				.attr('y2', self.valueToY(value))
				.attr('opacity', 0.1)
				.attr('stroke-width', 1)
				.attr('stroke','#000000');			
			self.gLabels.append('text')
				.attr('class', 'small')
				.attr('x', 2)
				.attr('y', self.valueToY(value)+11)
				// .attr('text-anchor', 'end')
				//.text(self.maxValue <= 1 ? (self.maxValue < 10 ? self.maxValue : Math.round(value*100)) + '%' : Math.round(value));
				.text(self.percentOnly ? (
					(self.maxValue < 1 ? (
						self.maxValue < 0.1 ? Math.round(value*100*100)/100 : Math.round(value*100)
					) : Math.round(value/self.maxValue*100)) + '%'
				) : Math.round(value*100) + '%') ;
		}

		self.gAxis.append('line')
			.attr('x1', 0)
			.attr('y1', self.valueToY(0))
			.attr('x2', self.diagramWidth)
			.attr('y2', self.valueToY(0))
			.attr('stroke-width', 1)
			.attr('stroke','#000000');



	},

	renderTimeLine: function(time){
		var self = this;

		var zeroXpos = self.diagramWidth/Math.abs(self.endT - self.starT)*Math.abs(self.starT);

		var minTime = Math.round(time[0]);
		var maxTime = Math.round(time[time.length-1]);

		var timeRange = Math.abs(minTime - maxTime);
		var timeStep = self.diagramWidth/timeRange;

		self.gAxis.selectAll('line.timeline').remove();
		self.gLabels.selectAll('text.timeline').remove();

		for (var t = minTime; t < maxTime+0.2; t = t+0.2){
			var xPos = Math.round(timeStep*t) + zeroXpos;
			var lineSize = 2;
			if(Math.abs(Math.round(t)-t) < 0.01){

				if (Math.round(t)%self.tocks == 0){
					lineSize = 3;
					self.gLabels.append('text')
						.attr('class', 'small timeline')
						.attr('x', xPos)
						.attr('y', self.valueToY(0)+15)
						.attr('text-anchor',Math.round(t) == maxTime ? 'end' : 'start')
						.text(Math.round(t));
				}
			
				if (Math.round(t)%self.ticks == 0){
					self.gAxis.append('line')
						.attr('class', 'timeline')
						.attr('x1', xPos)
						.attr('y1', self.valueToY(0)-lineSize)
						.attr('x2', xPos)
						.attr('y2', self.valueToY(0)+lineSize)
						.attr('stroke-width', 1)
						.attr('stroke','#000000');
				}
			}	
			
		}

		self.gLabels.append('text')
			.attr('class', 'small timeline')
			.attr('x', self.diagramWidth-5)
			.attr('y', self.valueToY(0)-7)
			.attr('text-anchor', 'end')
			.text(self.yAxisLabel);
	},

	plotVerticalLine: function(percent){
		var self = this;

		var xPos = percent*self.diagramWidth;

		self.gGraphs.append('line')
			.attr('class', 'v-line')
			.attr('x1', xPos)
			.attr('y1', 0)
			.attr('x2', xPos)
			.attr('y2', self.diagramHeight)
			.attr('stroke-width', 1)
			.attr('stroke','#777777')
			//.attr('opacity', 0.6)
			.style("stroke-dasharray", ("1, 3"));
	},

	plotHorizontalLine: function(value){
		var self = this;

		self.gGraphs.append('line')
			.attr('class', 'h-line')
			.attr('x1', 0)
			.attr('y1', self.valueToY(value))
			.attr('x2', self.diagramWidth)
			.attr('y2', self.valueToY(value))
			.attr('stroke-width', 1)
			.attr('stroke','#777777')
			//.attr('opacity', 0.2);
			.style("stroke-dasharray", ("1, 3"));
	},

	update: function(data,time){
		var self = this;

		self.gGraphs.selectAll('line.h-line').remove();
		self.gGraphs.selectAll('line.v-line').remove();

		// BEGIN HACK
		var zeroXpos = self.diagramWidth/Math.abs(self.endT - self.starT)*Math.abs(self.starT);

		var minTime = Math.round(time[0]);
		var maxTime = Math.round(time[time.length-1]);

		var timeRange = Math.abs(minTime - maxTime);
		var timeStep = self.diagramWidth/timeRange;
		// END HACK --> same code in renderTimeline...

		// save cycles amount, average and max values 
		self.t = time.length;
		self.avg = [];
		self.max = [];
		for (var i = 0; i < data.length; i++){
			var avg = 0;
			var max = 0;
			for (var t = 0; t < self.t; t++){
				avg = avg + data[i][t];
				if (data[i][t] > max){
					max = data[i][t];
				}
			}
			avg = avg/time.length;
			self.avg[i] = avg;
			self.max[i] = max;
		}


		var pathPointsBefore = [];
		for (var t = 0; t < data[0].length; t++){
			pathPointsBefore.push({
				x: Math.round(timeStep*t) + zeroXpos,
				y: self.diagramHeight
			});
		}
		self.gGraphs.selectAll('path').each(function(d, i){
			var path = d3.select(this);

			//if (i == self.resetAt){
			if ((i+1)%self.resetAt == 0){
				pathPointsBefore = [];
				for (var t = 0; t < data[0].length; t++){
					pathPointsBefore.push({
						x: Math.round(timeStep*t) + zeroXpos,
						y: self.diagramHeight
					});
				}
			}

			var rawData = data[i];

			var pathPoints = [];
			for (var t = 0; t < rawData.length; t++){
				//if (rawData[t] != null && !isNaN(rawData[t]) && rawData[t] <= self.maxValue*2 && rawData[t] >= self.minValue*2){
					pathPoints.push({
						//x: self.diagramWidth/rawData.length * t,
						x: Math.round(timeStep*t) + zeroXpos,
						y: pathPointsBefore[t].y + (self.valueToY(rawData[t]) - self.diagramHeight)
						//y: self.valueToY(rawData[t])
					});
				//}
			}
			//console.log(pathPoints);
			var pointsToDraw = [];
			for (var t = 0; t < pathPoints.length; t++){
				pointsToDraw.push(pathPoints[t]);
			}
			if (self.stroke == undef || self.stroke[i] == 0){
				for (var t = 0; t < pathPointsBefore.length; t++){
					pointsToDraw.push(pathPointsBefore[pathPointsBefore.length - 1- t]);
				}
			}

			//console.log(pointsToDraw);

			path.attr('d', pathDrawFunction(pointsToDraw));
			pathPointsBefore = pathPoints;
		});

		if (time != undef){
			self.renderTimeLine(time);
		}
	},

	valueToY: function(value){
		var self = this;
		return self.diagramHeight-((value-self.minValue)/Math.abs(self.maxValue-self.minValue) * self.diagramHeight);
	}

});