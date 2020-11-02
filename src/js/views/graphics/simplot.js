var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify');

var VValueSlider = require('../valueslider');
var VPlot = require('../plot');

module.exports = Backbone.View.extend({

	title: '',
	simulation: undef,
	plotColors: [],
	plotAlphas: [],
	plotFill: [],
	plotMin: 0,
	plotMax: 1,
	legend: [],
	legendColors: [],

	vSliders: [],
	vPlot: undef,
	reactionTime: 100,

	className: 'simplot',

	template: 'simplot',

	initialize: function(options) {
		var self = this;

		self.title = options.title;
		self.simulation = options.simulation;
		self.plotColors = options.plotColors;
		self.plotAlphas = options.plotAlphas;
		self.plotStrokes = options.plotStrokes;

		if (options.minValue != undef){
			self.plotMin = options.minValue;
		}
		if (options.maxValue != undef){
			self.plotMax = options.maxValue;
		}

		if (options.legend != undef){
			self.legend = options.legend;
		}
		if (options.legendColors != undef){
			self.legendColors = options.legendColors;
		}else{
			self.legendColors = self.plotColors;
		}
		

		// init param sliders
		self.vSliders = [];
		var params = self.simulation.get('params');
		for (var i = 0; i < params.length; i++){
			var vSlider = new VValueSlider({ 
				paramID: i, 
				title: params[i].label, 
				minValue: params[i].minValue,
				maxValue: params[i].maxValue,
				color: params[i].color,
				reactionTime: self.reactionTime
			});
			vSlider.bind('valueHasChanged', function(crntSlider){
				var newParams = self.simulation.get('params');
				newParams[crntSlider.paramID].value = crntSlider.value;
				self.simulation.setAndSimulate('params', newParams);
			});
			self.vSliders.push(vSlider);
		}

		// init plot
		self.vPlot = new VPlot({
			title: self.title,
			colors: self.plotColors,
			alpha: self.plotAlphas,
			stroke: self.plotStrokes,
			minValue: self.plotMin,
			maxValue: self.plotMax,
			heightScale: 0.5,
			ticks: options.ticks,
			tocks: options.tocks
		});
		self.listenTo(self.simulation, 'simulationend', function(){
			self.vPlot.update(self.simulation.get('values'), self.simulation.get('time'));
		});

	},


	render: function(){
		var self = this;

		self.$el.html(templates[self.template]({
			title: self.title
		}));

		// render params
		var params = self.simulation.get('params');
		for (var i = 0; i < self.vSliders.length; i++){
			var vSlider = self.vSliders[i];
			self.$el.find('.parameters .sliders').append(vSlider.render().$el);
			vSlider.setValue(params[i].value);
		}

		// render legend
		for (var i = 0; i < self.legend.length; i++){
			var $legend = $('<div class="plot-legend"><svg></svg>'+self.legend[i]+'<div>');
			var svgIcon = d3.select($legend.find('svg')[0]);
			svgIcon.attr('width', 12);
			svgIcon.attr('height', 12);
			//svgIcon.append('line')
			//	.attr('x1', 0)
			//	.attr('y1', 10)
			//	.attr('x2', 14)
			//	.attr('y2', 10)
			//	.attr('stroke-width', 2)
			//	.attr('stroke',self.legendColors[i])
			svgIcon.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', 12)
				.attr('height', 12)
				.attr('fill', self.legendColors[i])
				.attr('opacity', function(){
					if (self.alpha != undef && !fullAlpha){
						return self.alpha[i];
					}
					return 1;
				});
			if (i+1 == self.legend.length){
				$legend.addClass('last');
			}
			self.$el.find('.legend').append($legend);
		}

		// render plot
		self.$el.find('.plot-container').append(self.vPlot.$el);
		self.vPlot.render();

		// do simulation at the end
		self.simulation.simulate();
	}

});