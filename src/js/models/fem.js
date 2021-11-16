var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var MSim = require('./sim.js');

module.exports = MSim.extend({

    beams: [],
    nodes: [],

    simulate: function(){

        this.preprocessor();

        var beams = this.get('beams');

        var time = [];
        var values = [[]];
        for (var i = 0; i < beams.length; i++){
            time.push(i);
            values[0].push(beams[i].length);
        }

        console.log(time);
        console.log(values);

        /*
        var dt = this.get('dt');
		var initValues = this.get('initValues');

        var time = [0];
        for(var t = 0; t < this.get('simulationDuration')/dt; t++){
            time.push(t);
        }
        var values = [];
        for (var i = 0; i < initValues.length; i++){
			values[i] = [initValues[i]];
		}
        for (var i = 0; i < initValues.length; i++){
            for(var t = 0; t < this.get('simulationDuration')/dt; t++){
                values[i].push(Math.random());
            }
        }
        */

        this.set('time', time);
		this.set('values', values);
		this.trigger('simulationend');
    },

    preprocessor: function(){

        var nodes = this.get('nodes');
        var beams = this.get('beams');

        // calc length and angle for every beam
        for (var i = 0; i < beams.length; i++){
            var startNode = nodes[parseInt(beams[i].start)-1];
            var endNode = nodes[parseInt(beams[i].end)-1];
            // calc phi and length
            var delta_x = endNode.x - startNode.x;
            var delta_y = endNode.y - startNode.y;
            beams[i].length = Math.sqrt(delta_x*delta_x + delta_y*delta_y); // beam length
            beams[i].phi = Math.atan2(delta_y, delta_x); // angle
        }

        this.set('beams', beams);
    },

    solver: function(){
        
        

    }

});