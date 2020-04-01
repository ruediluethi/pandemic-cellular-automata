var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;


var VSimPlot = require('../graphics/simplot');
var VPlot = require('../plot');
var VValueSlider = require('../valueslider');

module.exports = VSimPlot.extend({

	cellAuto: undef,

	// overwrite from simplot.js
	renderParams: function(){
		var self = this;

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
			self.$el.find('.parameters .sliders').append(vSlider.render().$el);
			vSlider.setValue(params[i].value);
			vSlider.bind('valueHasChanged', function(crntSlider){
				var newParams = self.simulation.get('params');
				
				if (crntSlider.paramID == 3){
					var I0 = crntSlider.value;
					var initValues = self.simulation.get('initValues');
					initValues = [100000, 100000-I0, I0, 0];
					self.simulation.set('initValues', initValues);
				}

				newParams[crntSlider.paramID].value = crntSlider.value;
				self.simulation.setAndSimulate('params', newParams);
			});
			self.vSliders.push(vSlider);
		}

	},


	renderPlots: function(){
		var self = this;

		self.vPlot = new VPlot({
			title: '',
			colors: [window.PURPLE, window.GREEN, window.RED, window.YELLOW,
			         window.GREEN, window.RED, window.YELLOW],
			alpha: [0.3, 0.3, 0.3, 0.3, 1, 1, 1],
			minValue: self.plotMin,
			maxValue: self.plotMax,
			heightScale: 0.5
		});
		
		self.listenTo(self.cellAuto, 'updatePlot', function(){
			
			var simValues = self.simulation.get('values');
			var cellAutoValues = [self.cellAuto.S, self.cellAuto.I, self.cellAuto.R];

			self.vPlot.update([
				simValues[0], simValues[1], simValues[2], simValues[3],
				cellAutoValues[0], cellAutoValues[1], cellAutoValues[2]
			], self.simulation.get('time'));
		});

		self.listenTo(self.simulation, 'simulationend', function(){

			var simParams = self.simulation.get('params');

			var n = Math.round(Math.sqrt(simParams[2].value));
			var I0 = simParams[3].value;

			self.cellAuto.stopMovement();
			self.cellAuto.initEmptyEnv(n,n);
			self.cellAuto.initIndividuals(100000-I0,I0,0);
			self.cellAuto.alpha = simParams[0].value;
			self.cellAuto.beta = simParams[1].value;
			self.cellAuto.startMovement(1);

			//self.vPlot.update(self.simulation.get('values'), self.simulation.get('time'));
		});

		self.$el.find('.plot-container').append(self.vPlot.$el);
		self.vPlot.render();
	},

});