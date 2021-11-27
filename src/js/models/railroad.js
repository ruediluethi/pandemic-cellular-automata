var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var MFem = require('./fem.js');

module.exports = MFem.extend({

    movement: undef,
	// delay times in ms between the different steps
	moveDelay: 1000/25,

    railLinks: [],

    setup: function(){
        this.preprocessor();

        var nodes = this.get('nodes');

        var maxY = 0;
        nodes.forEach((node) => {
            if (node.y > maxY) maxY = node.y;
        });

        var railLinks = [];
        nodes.forEach((node, i) => {
            if (node.y >= maxY) railLinks.push({
                i: i,
                x: node.x,
                y: node.y
            });
        });

        railLinks.sort((a, b) => {
            if (a.x < b.x) return -1;
            if (a.x > b.x) return 1;
            return 0;
        });

        this.set('railLinks', railLinks);
    },

    beforeSimulate: function(crntTrainPos){
        var params = this.get('params');

        // var density = params[0].value * 1e-6;
        var density = 7.86e-6;
        var youngsModule = 210;
        var diameter = params[0].value;
        var trainWeight = params[1].value;

        var beams = this.get('beams');
        var nodes = this.get('nodes');

        // reset all forces
        for (var i = 0; i < nodes.length; i++){
            nodes[i].Fy = 0;
        }

        var railLinks = this.get('railLinks');
        // railLinks.forEach((link, i) => {
        //     nodes[link.i].Fy = i * 100;
        // });
        nodes[railLinks[crntTrainPos].i].Fy = -trainWeight*9.81;

        // calculate self weight
        for (var i = 0; i < beams.length; i++){
            var a = parseInt(beams[i].start)-1;
            var b = parseInt(beams[i].start)-1;
            //beams[i].youngsModule = params[1].value;
            beams[i].youngsModule = youngsModule;
            // add beam weight
            beams[i].A = (diameter*diameter)/4*Math.PI; // in mm2
            var L = parseFloat(beams[i].length);
            var Fg = L*beams[i].A*density*9.81/1000; // force in kN
            nodes[a].Fy = parseFloat(nodes[a].Fy) - Fg/2;
            nodes[b].Fy = parseFloat(nodes[b].Fy) - Fg/2;
            if (isNaN(nodes[a].Fy)) nodes[a].Fy = 0;
            if (isNaN(nodes[b].Fy)) nodes[b].Fy = 0;
        }



        this.set('beams', beams);
        this.set('nodes', nodes);
    },

    simulate: function(){

        this.set('time', []);
		this.set('values', [[]]);

        this.trigger('simulationstart', this);

        this.tchooTchoo();
    },

    setAndSimulate: function(key, val){
		var self = this;
		self.set(key,val);
		self.stop();
		self.trigger('simulationdone', self);
	},

    stop: function(){
		var self = this;

		if (self.movement != undef){
			clearTimeout(self.movement);
		}
	},


    tchooTchoo: function(){
        var self = this;

        if (self.movement != undef){
			clearTimeout(self.movement);
		}

		if (self.paused){
			return;
		}

        var time = self.get('time');
        var values = self.get('values');

        var railLinks = self.get('railLinks');

		if (time.length >= railLinks.length){
			self.trigger('simulationend', self);
			self.trigger('simulationdone', self);
			self.trigger('silentend', self, true);
			return;
		}

        if (this.beforeSimulate !== undef) this.beforeSimulate(time.length);

        var nodes = self.get('nodes');

        this.preprocessor();
        //this.solver(Math.max(1000,nodes.length*20));
        this.solver(1000);
        this.postprocessor();

        var beams = self.get('beams');
        var maxStress = 0;
        var maxStrain = 0;
        beams.forEach((beam) => {
            if (Math.abs(beam.stress) > maxStress) maxStress = Math.abs(beam.stress);
            if (Math.abs(beam.strain) > maxStrain) maxStrain = Math.abs(beam.strain);
        });

        
        time.push(time.length);
        values[0].push(maxStrain);

        this.set('time', time);
		this.set('values', values);
		this.trigger('simulationend', this);


        self.movement = setTimeout(function(){

            self.tchooTchoo();

        }, self.moveDelay);

    }

});