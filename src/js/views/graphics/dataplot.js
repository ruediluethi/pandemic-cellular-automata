var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;


var d3 = require('d3-browserify'); // ~150KB !!


var VValueSlider = require('../valueslider');
var VPlot = require('../plot');

module.exports = Backbone.View.extend({

	vPlot: undef,


	initialize: function(options){
		var self = this;

		self.vPlot = new VPlot({
			title: 'Grippe Meldungen pro 100 000 Einwohner',
			colors: [window.RED, window.RED],
			alpha: [0.5, 0.5],
			minValue: 0,
			maxValue: 400,
			heightScale: 0.4
		});
	},


	render: function(){
		var self = this;

		self.$el.html(templates['dataplot']({  }));

		self.$el.find('.plot-container').append(self.vPlot.$el);
		self.vPlot.render();
	},


	loadData: function(callback){
		var self = this;

		// https://www.bag.admin.ch/bag/de/home/krankheiten/ausbrueche-epidemien-pandemien/aktuelle-ausbrueche-epidemien/saisonale-grippe---lagebericht-schweiz.html
		d3.csv('data/influenza_schweiz.csv', function(error, csvData){
        	if (error) return console.error(error);

        	var t = [];
        	var influenzaData1718 = [];
        	var influenzaData1819 = [];

        	var maxValue = 0;

        	var threshold = 69; // Der saisonale epidemische Schwellenwert von 69 Grippeverdachtsfällen
        	var thrPassed1718 = false;
        	var thrPassed1819 = false;
        	for (var i = 0; i < csvData.length; i++){

        		v1718 = parseInt(csvData[i]['Inzidenz pro 100 000 Einwohner']);
        		v1819 = parseInt(csvData[i+52]['Inzidenz pro 100 000 Einwohner']);

        		//console.log(v1718);

        		//if (v1718 > threshold){
        		if (i > 19 && i <= 29){
        			//console.log(v1718);
        			thrPassed1718 = true;
        		}
        		//if (v1819 > threshold){
        		if (i > 22 && i <= 32){
        			//console.log(v1819);
        			thrPassed1819 = true;
        		}

        		if (thrPassed1718){
        			influenzaData1718.push(v1718);
	        		if (v1718 > maxValue){ maxValue = v1718; }
        		}

        		if (thrPassed1819){
        			influenzaData1819.push(v1819);
	        		if (v1819 > maxValue){ maxValue = v1819; }
	        	}

        		if (thrPassed1718 || thrPassed1819){
        			if (t.length >= 52){
        				break;
        			}
        			t.push(t.length);
	        	}
        	}

        	self.vPlot.maxValue = 400;
        	self.vPlot.update([influenzaData1718, influenzaData1819], t);

			callback.call();
		});

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