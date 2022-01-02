var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;


module.exports = Backbone.View.extend({

	className: 'plot',

	vSimPlot: undef,
	sliderValues: [],
	t: 0,
	max: 0,

	unit: '%',

	events: {
		'click .summary a.show': 'show',
		'click .summary a.delete': 'delete',
		'click .summary a.hide': 'hide'
	},

	initialize: function(options) {
		var self = this;

		self.vSimPlot = options.vSimPlot;
		self.sliderValues = options.sliderValues;
		self.t = options.t;
		self.max = options.max;

		if (options.unit != undef) self.unit = options.unit; 
	},

	minimize: function(callback){
		var self = this;

		self.$el.addClass('archived');

		var $summary = $('<div class="summary">'+
			'<div style="float: left;" class="statistics">'+
				'Anzahl Zyklen: '+self.t+', '+
				'Maximum: '+self.max+self.unit+
			'</div>'+
			'<div style="float: right;">'+
				'<a class="show">anzeigen</a>'+
				'<a class="hide">verstecken</a>'+
				', '+
				'<a class="delete">löschen</a>'+
			'</div>'+
		'</div>');

		self.$el.append($summary);
		//self.delegateEvents();

		self.$el.find('.plot-wrapper').animate({
			opacity: 0
		}, 500);

		$summary.css({
			opacity: 0
		}).animate({
			opacity: 1
		}, 500);

		self.$el.animate({
			height: 18
		}, 500, function(){
			

			callback.call();
		});
	},

	delete: function(e){
		var self = this;

		if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
        }

        self.remove();
	},

	show: function(e){
		var self = this;

		if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
        }

        self.vSimPlot.closeAllArchives();
        self.$el.addClass('open');

        for (var i = 0; i < self.sliderValues.length; i++){
			self.vSimPlot.vSliders[i].setValue(self.sliderValues[i], true);
		}

        self.$el.stop().animate({
			height: self.$el.find('svg').height()
		}, 200);

		self.$el.find('.plot-wrapper').stop().css({
			opacity: 0
		}).animate({
			opacity: 0.5
		}, 200);

	},

	hide: function(e){
		var self = this;

		if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
        }

        self.vSimPlot.closeAllArchives();
    },

    close: function(){
    	var self = this;

    	self.$el.removeClass('open');

    	self.$el.find('.plot-wrapper').animate({
			opacity: 0
		}, 200);

		self.$el.animate({
			height: 18
		}, 200, function(){
			
		});
    }

});