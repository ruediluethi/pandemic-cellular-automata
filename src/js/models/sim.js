var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

module.exports = Backbone.Model.extend({

	defaults: {
		simulationDuration: 10,
		dt: 1,
		initValues: [],
		params: [],
		diffeqs: []
	},

	simulate: function(){

		var dt = this.get('dt');
		var initValues = this.get('initValues');
		var values = [initValues];
		for (var i = 0; i < initValues.length; i++){
			values[i] = [initValues[i]];
		}
		var time = [0];

		var diffeqs = this.get('diffeqs');
		for(var t = 0; t < this.get('simulationDuration')/dt; t++){

			var crntValues = [];
			for (var i = 0; i < values.length; i++){
				valueTimeline = values[i];
				crntValues[i] = valueTimeline[t];
			}

			var newValues = [];
			for (var i = 0; i < diffeqs.length; i++){
				var diffeq = diffeqs[i];
				newValues[i] = diffeq.call(null, crntValues, this.get('params'), time[t], newValues);
			}

			for (var i = 0; i < values.length; i++){
				valueTimeline = values[i];
				valueTimeline[t+1] = newValues[i];
				values[i] = valueTimeline;
			}

			time[t+1] = time[t] + dt;
		}

		//console.log(time);
		//console.log(values);

		this.set('time', time);
		this.set('values', values);
		this.trigger('simulationend');
	},

	setAndSimulate: function(key, val){
		this.set(key,val);
		this.simulate();
	}

});