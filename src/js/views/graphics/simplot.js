var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;


var VValueSlider = require('../valueslider');
var VPlot = require('../plot');

module.exports = Backbone.View.extend({

	title: '',
	simulation: undef,
	plotColors: [],
	plotAlphas: [],
	plotMin: 0,
	plotMax: 1,

	vSliders: [],
	vPlot: undef,
	reactionTime: 1,

	className: 'simplot',

	template: 'simplot',

	initialize: function(options) {
		var self = this;

		self.simulation = options.simulation;
		self.plotColors = options.plotColors;

		if (options.plotAlphas == undef){
			for (var i = 0; i < self.plotColors.length; i++){
				self.plotAlphas[i] = 1;
			}
		}
		

	},


	render: function(){
		var self = this;

		self.$el.html(templates[self.template]({  }));

		self.renderParams();
		self.renderPlots();

		self.simulation.simulate();
	},


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
				newParams[crntSlider.paramID].value = crntSlider.value;
				self.simulation.setAndSimulate('params', newParams);
			});
			self.vSliders.push(vSlider);
		}

	},

	renderPlots: function(){
		var self = this;

		self.vPlot = new VPlot({
			title: self.title,
			colors: self.plotColors,
			alpha: self.plotAlphas,
			minValue: self.plotMin,
			maxValue: self.plotMax,
			heightScale: 0.5
		});
		

		self.listenTo(self.simulation, 'simulationend', function(){
			self.vPlot.update(self.simulation.get('values'), self.simulation.get('time'));
		});
		self.$el.find('.plot-container').append(self.vPlot.$el);
		self.vPlot.render();
	},

	hide: function(){
		var self = this;
		self.$el.hide();
	},

	show: function(){
		var self = this;
		self.$el.show();
	}

});