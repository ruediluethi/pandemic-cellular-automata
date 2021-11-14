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

	vNewInfectPlots: [],
	vHospitalPlots: [],

	// Intensivbetten: 3420 (Quelle: https://interaktiv.morgenpost.de/corona-deutschland-intensiv-betten-monitor-krankenhaus-auslastung/)
	// areaPopulation: [4154223, 1855499, 2810854, 2271351],

	areaPopulation: [126329, 174200],

	// Intensivbetten:
	// - Neu-Ulm: 3/0.17 = 17.65
	// - Ulm: 24/0.16 = 150

	events: {
		'click .tabs-header .tab': 'tabClick'
	},

	initialize: function(options) {
		var self = this;

		self.vTotalPlot = options.vTotalPlot;
		self.areaNames = options.areaNames;
		self.simulation = options.simulation;

		for (var i = 0; i < self.areaNames.length; i++){


			var vNewInfectPlot = new VPlot({
				title: self.areaNames[i],
				colors: [window.RED, '#777777'],
				alpha: [1,0.3],
				stroke: [1,0],
				minValue: 0,
				//maxValue: 10,
				maxValue: 0.03,
				heightScale: 0.3,
				helpLinesCount: 4,
				ticks: options.vTotalPlot.vPlot.ticks,
				tocks: options.vTotalPlot.vPlot.tocks,
				resetAt: 1
			});

			self.vNewInfectPlots.push(vNewInfectPlot);


			var vHospitalPlot = new VPlot({
				title: self.areaNames[i],
				colors: [window.RED, '#777777','#222222'],
				alpha: [1,0.3,1],
				stroke: [0,0,1],
				minValue: 0,
				//maxValue: 10,
				//maxValue: Math.round(self.areaPopulation[i]*0.05/1000)*1000,
				//maxValue: 1000,
				//maxValue: 0.006,
				maxValue: 1.5,
				heightScale: 0.3,
				helpLinesCount: 4,
				ticks: options.vTotalPlot.vPlot.ticks,
				tocks: options.vTotalPlot.vPlot.tocks,
				resetAt: 1
			});
			vHospitalPlot.percentOnly = false;

			self.vHospitalPlots.push(vHospitalPlot);
		}
		self.simulation.set('plots', self.vNewInfectPlots);
		self.listenTo(self.simulation, 'silentend', function(nothing, forceUpdate){

			var params = self.simulation.get('params');
			var upperLimit = params[3].value;
			var lowerLimit = params[4].value;

			for (var i = 0; i < self.vNewInfectPlots.length; i++){
				var vNewInfectPlot = self.vNewInfectPlots[i];
				var vHospitalPlot = self.vHospitalPlots[i];

				var count = self.simulation.areaCount[i];
				var dE = [0];
				var P = [0];
				var I = [0];
				var hundertPercent = [1];
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

					// 7% of the infected population are hospitalized
					//I.push(count.I[t]/P[P.length-1]*self.areaPopulation[i]*0.07*0.14);
					//I.push(count.I[t]*0.07*0.14 /P[P.length-1]);
					I.push((count.I[t]*0.01) / (P[P.length-1] * 0.003));
					hundertPercent.push(1);
				}

				//console.log(dE)
				var inLockdown = [0];
				var dEmean = [0];
				var meanLength = 7;
				for (var t = 1; t < dE.length; t++){
					var dEmeanTemp = 0;
					var maxMeanLength = t > meanLength ? meanLength : t;
					for (var j = 0; j < maxMeanLength; j++){
						dEmeanTemp = dEmeanTemp + dE[t-j];
					}
					dEmean.push(dEmeanTemp/maxMeanLength/P[t]);

					var lock = inLockdown[t-1];
					if (lock == 0){
						if (dEmean[t] >= upperLimit/100){
							//lock = vNewInfectPlot.maxValue;
							lock = 10000;
						}
					}else{
						if (dEmean[t] <= lowerLimit/100){
							lock = 0;
						}
					}
					inLockdown.push(lock);
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

				if (!self.simulation.fastForward || forceUpdate){
					vNewInfectPlot.update([dEmean, inLockdown], self.simulation.get('time'));
					vHospitalPlot.update([I, inLockdown, hundertPercent], self.simulation.get('time'));
				}
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

		self.$el.find('.v-slider').eq(2).append('<div class="slider-label"><strong>Lockdown bei</strong> (Neuinfektionen in % der Bevölkerung)</div>');

		for (var i = 0; i < self.vNewInfectPlots.length; i++){
			var vNewInfectPlot = self.vNewInfectPlots[i];
			self.$el.find('.tabs-content').append(vNewInfectPlot.$el);
			vNewInfectPlot.render();
		}

		for (var i = 0; i < self.vHospitalPlots.length; i++){
			var vHospitalPlot = self.vHospitalPlots[i];
			self.$el.find('.tabs-content').append(vHospitalPlot.$el);
			vHospitalPlot.render();
		}

		var $legendI = $('<div class="plot-legend">'+
			'<svg class="new-infections"></svg>Neuinfektion in % der Bevölkerung (Mittel über 7 Zyklen)<br>'+
			'<svg class="hospitalized"></svg>Belegung der Intensivbetten in %<br>'+
			//'<svg class="hospitalized"></svg>Anzahl Fälle in absoluten Zahlen mit schwerem Verlauf<br>'+
			'<svg class="lockdown"></svg>Bezirk befindet sich im Lockdown'+
		'<div>');
		var svgIconNew = d3.select($legendI.find('svg.new-infections')[0]);
		svgIconNew.attr('width', 12);
		svgIconNew.attr('height', 12);
		svgIconNew.append('line')
			.attr('x1', 0)
			.attr('y1', 6)
			.attr('x2', 12)
			.attr('y2', 6)
			.attr('stroke-width', 2)
			.attr('stroke',window.RED);

		var svgIconI = d3.select($legendI.find('svg.hospitalized')[0]);
		svgIconI.attr('width', 12);
		svgIconI.attr('height', 12);
		svgIconI.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', 12)
			.attr('height', 12)
			.attr('fill', window.RED);
		var svgIconLock = d3.select($legendI.find('svg.lockdown')[0]);
		svgIconLock.attr('width', 12);
		svgIconLock.attr('height', 12);
		svgIconLock.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', 12)
			.attr('height', 12)
			.attr('fill', '#777777')
			.attr('opacity', 0.3);
		self.$el.find('.tabs-content .legend').append($legendI);



		self.delegateEvents();

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
		for (var i = 0; i < self.vNewInfectPlots.length; i++){
			self.vNewInfectPlots[i].$el.hide();
		}
		for (var i = 0; i < self.vHospitalPlots.length; i++){
			self.vHospitalPlots[i].$el.hide();
		}

		self.$el.find('.tabs-header .tab').eq(id).addClass('active');
		self.vNewInfectPlots[id].$el.show();
		self.vHospitalPlots[id].$el.show();
	}

});