var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify');

var VValueSlider = require('../valueslider');
var VPlot = require('../plot');
var VArchivedPlot = require('../archivedplot');

module.exports = Backbone.View.extend({

	title: '',
	caption: '',
	simulation: undef,
	plotColors: [],
	plotAlphas: [],
	plotFill: [],
	plotMin: 0,
	plotMax: 1,
	plotResetAt: 5,
	legend: [],
	legendColors: [],

	vSliders: [],
	vPlot: undef,
	reactionTime: 200,
	heightScale: 0.5,

	className: 'simplot',

	template: 'simplot',
	showControls: true,
	crntSliderValues: [],
	archivedPlots: [],

	events: {
		'click .button.play': 'playClick',
		'click .button.stop': 'stopClick',
		'click .button.forward': 'forwardClick',
		'click .button.restart': 'restartClick'
	},

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
		if (options.showControls != undef){
			self.showControls = options.showControls;
		}
		if (options.caption != undef){
			self.caption = options.caption;
		}
		if (options.heightScale != undef){
			self.heightScale = options.heightScale;
		}
		if (options.resetAt != undef){
			self.plotResetAt = options.resetAt;
		}
		if (options.reactionTime != undef){
			self.reactionTime = options.reactionTime;
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
			heightScale: self.heightScale,
			ticks: options.ticks,
			tocks: options.tocks,
			resetAt: self.plotResetAt
		});
		self.listenTo(self.simulation, 'simulationend', function(){
			if(self.simulation.get('time').length > 0){
				self.vPlot.update(self.simulation.get('values'), self.simulation.get('time'));
				self.vPlot.$el.show();
			}else{
				self.vPlot.$el.hide();
			}
		});

		self.listenTo(self.simulation, 'simulationstart', function(){
			self.crntSliderValues = [];
			for (var i = 0; i < self.vSliders.length; i++){
				self.crntSliderValues.push(self.vSliders[i].getValue());
			}

			self.$el.find('.controls .forward').removeClass('disabled');
			self.togglePlayButton(false);
		});

		self.listenTo(self.simulation, 'simulationdone', function(){
			self.$el.find('.loading-overlay').fadeOut(500);
			self.togglePlayButton(true, true);
		});

	},


	render: function(){
		var self = this;

		self.$el.html(templates[self.template]({
			title: self.title,
			caption: self.caption,
			showControls: self.showControls
		}));
		var spinner = new Spinner(window.opts).spin(self.$el.find('.loading-overlay')[0]);

		// render params
		var params = self.simulation.get('params');
		for (var i = 0; i < self.vSliders.length; i++){
			var vSlider = self.vSliders[i];
			self.$el.find('.parameters .sliders').append(vSlider.render().$el);
			vSlider.setValue(params[i].value, false);
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

		self.delegateEvents();

		// do simulation at the end
		self.simulation.simulate();
	},


	togglePlayButton: function(play, disabled){
		var self = this;

		var $btnPlay = self.$el.find('.controls .button.start-stop');

		$btnPlay.removeClass('stop');
		$btnPlay.removeClass('play');
		$btnPlay.removeClass('disabled');

		if (play){
			$btnPlay.addClass('play');
			$btnPlay.find('.label').html('Play');
			if (disabled){
				$btnPlay.addClass('disabled');
				self.$el.find('.controls .forward').addClass('disabled');
			}
		}else{
			$btnPlay.addClass('stop');
			$btnPlay.find('.label').html('Stop');
		}

	},

	playClick: function(e){
		var self = this;

		var $btnPlay = self.$el.find('.controls .button.start-stop');
		if ($btnPlay.hasClass('disabled')){
			return;
		}

		self.simulation.start();
	},

	stopClick: function(e){
		var self = this;
		self.simulation.stop();
		self.togglePlayButton(true);
	},

	restartClick: function(e){
		var self = this;

		var newArchive = new VArchivedPlot({
			vSimPlot: self,
			sliderValues: self.crntSliderValues,
			t: self.vPlot.t-1,
			max: self.vPlot.max[0]/self.vPlot.maxValue*100
		});

		newArchive.setElement(self.vPlot.$el.clone());


		self.vPlot.$el.before(newArchive.$el);


		self.vPlot.$el.hide();


		newArchive.minimize(function(){
			self.simulation.simulate();
		});

		self.archivedPlots.push(newArchive);

	},

	closeAllArchives: function(){
		var self = this;

		for (var i = 0; i < self.archivedPlots.length; i++){
			self.archivedPlots[i].close();
		}
	},


	forwardClick: function(e){
		var self = this;
		var $btnForward = self.$el.find('.controls .button.forward');
		if ($btnForward.hasClass('disabled')){
			return;
		}

		self.simulation.start();
		self.simulation.fastForward = true;

		self.togglePlayButton(true,true);

		self.$el.find('.loading-overlay').fadeIn(500);
	}


});