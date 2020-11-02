var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify');

var VPlot = require('../plot');

module.exports = Backbone.View.extend({

	vTotalPlot: undef,
	areaNames: [],
	simulation: undef,

	className: 'areaplot',
	template: 'areaplot',

	vPlots: [],

	events: {
		'click .tabs-header .tab': 'tabClick'
	},

	initialize: function(options) {
		var self = this;

		self.vTotalPlot = options.vTotalPlot;
		self.areaNames = options.areaNames;
		self.simulation = options.simulation;

		for (var i = 0; i < self.areaNames.length; i++){
			/*
			var vPlot = new VPlot({
				title: self.areaNames[i],
				colors: self.vTotalPlot.plotColors,
				alpha: self.vTotalPlot.plotAlphas,
				stroke: self.vTotalPlot.plotStrokes,
				minValue: self.vTotalPlot.plotMin,
				maxValue: self.vTotalPlot.plotMax,
				heightScale: 0.5,
				ticks: options.vTotalPlot.vPlot.ticks,
				tocks: options.vTotalPlot.vPlot.tocks
			});
			*/

			var vPlot = new VPlot({
				title: self.areaNames[i],
				colors: [window.RED],
				alpha: [1],
				stroke: [0],
				minValue: 0,
				//maxValue: 10,
				maxValue: 0.02,
				heightScale: 0.5,
				ticks: options.vTotalPlot.vPlot.ticks,
				tocks: options.vTotalPlot.vPlot.tocks
			});

			self.vPlots.push(vPlot);
		}
		self.simulation.set('plots', self.vPlots);
		self.listenTo(self.simulation, 'simulationend', function(){

			var params = self.simulation.get('params');
			var upperLimit = params[5].value;
			var lowerLimit = params[6].value;

			for (var i = 0; i < self.vPlots.length; i++){
				var vPlot = self.vPlots[i];
				var count = self.simulation.areaCount[i];
				var dE = [0];
				var P = [0]
				for (var t = 1; t < count.E.length; t++){
					dEtemp = count.E[t] - count.E[t-1];
					if (dEtemp < 0){
						dEtemp = 0;
					}
					dE.push(dEtemp);

					P.push(count.S[t] 
				     + count.E[t]
				     + count.I[t] 
				     + count.R[t]);
				}

				//console.log(dE)

				

				var dEmean = [0];
				var meanLength = 7;
				for (var t = 1; t < dE.length; t++){
					var dEmeanTemp = 0;
					var maxMeanLength = t > meanLength ? meanLength : t;
					for (var j = 0; j < maxMeanLength; j++){
						dEmeanTemp = dEmeanTemp + dE[t-j];
					}
					dEmean.push(dEmeanTemp/maxMeanLength/P[t]);
				}

				if (self.simulation.areaLockdown[i]){
					if (dEmean[dEmean.length-1] <= lowerLimit/100){
						self.simulation.openArea(i);
					}
				}else{
					if (dEmean[dEmean.length-1] >= upperLimit/100){
						self.simulation.closeArea(i);
					}
				}

				//console.log(dEmean);


				vPlot.update([dEmean], self.simulation.get('time'));
			}
		});

	},

	render: function(){
		var self = this;

		self.$el.html(templates[self.template]({
			areaNames: self.areaNames
		}));

		self.$el.find('.total').append(self.vTotalPlot.$el);
		self.vTotalPlot.render();

		self.$el.find('.v-slider').eq(4).append('<div class="slider-label"><strong>Lockdown bei</strong> (Neuinfektionen in % der Bevölkerung)</div>');

		for (var i = 0; i < self.vPlots.length; i++){
			var vPlot = self.vPlots[i];

			self.$el.find('.tabs-content').append(vPlot.$el);
			vPlot.render();
		}

		var $legend = $('<div class="plot-legend"><svg></svg>Anzahl Neuinfektion in % der Bevölkerung<br>(Mittel über 7 Zyklen)<div>');
		var svgIcon = d3.select($legend.find('svg')[0]);
		svgIcon.attr('width', 12);
		svgIcon.attr('height', 12);
		svgIcon.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', 12)
			.attr('height', 12)
			.attr('fill', window.RED);
		self.$el.find('.tabs-content .legend').append($legend);

		self.showArea(1);
	},

	tabClick: function(e){
		var self = this;
		$tab = $(e.currentTarget);
		self.showArea($tab.index());
	},

	showArea: function(id){
		var self = this;

		self.$el.find('.tabs-header .tab').removeClass('active');
		for (var i = 0; i < self.vPlots.length; i++){
			var vPlot = self.vPlots[i];
			vPlot.$el.hide();
		}

		self.$el.find('.tabs-header .tab').eq(id).addClass('active');
		self.vPlots[id].$el.show();
	}

});