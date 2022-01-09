var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var MFem = require('./fem.js');

module.exports = MFem.extend({

    movement: undef,
	// delay times in ms between the different steps
	moveDelay: 1000/20,
    x0: undef,

    railLinks: [],
    crntTrainPos: 0,

    fastForward: false,

    setup: function(railLinks){
        var self = this;
        
        this.preprocessor();

        var nodes = this.get('nodes');

        if (railLinks == undef){
            var maxY = 0;
            nodes.forEach((node) => {
                if (node.y > maxY) maxY = node.y;
            });

            self.railLinks = [];
            nodes.forEach((node, i) => {
                if (node.y >= maxY) self.railLinks.push({
                    i: i,
                    x: node.x,
                    y: node.y
                });
            });
        }else{
            self.railLinks = railLinks;
        }

        self.railLinks.sort((a, b) => {
            if (a.x < b.x) return -1;
            if (a.x > b.x) return 1;
            return 0;
        });
    },

    beforeSimulate: function(t){
        var params = this.get('params');

        // var density = params[0].value * 1e-6;
        var density = 7.86e-6;
        var youngsModule = 210;
        var diameter = params[0].value;
        var wagonWeight = params[1].value;
        var wagonForce = wagonWeight*1000*9.81/2;
        var numberOfWagons = Math.round(params[2].value); 
        var wagonLength = 27.9e3;

        var beams = this.get('beams');
        var nodes = this.get('nodes');

        // reset all forces
        for (var i = 0; i < nodes.length; i++){
            nodes[i].Fy = 0;
        }

        var trainLength = (numberOfWagons+1) * wagonLength;
        var routeLength = this.railLinks[this.railLinks.length-1].x - this.railLinks[0].x;
        var crntPos = this.railLinks[0].x - wagonLength + t * (routeLength+trainLength);

        // check for every wagon in the train
        for (var i = 0; i < numberOfWagons; i++){
            var wagonCenter = crntPos - i*wagonLength;
            // and for every railLink element
            for (var j = 1; j < this.railLinks.length; j++){
                var startX = nodes[this.railLinks[j-1].i].x;
                var endX = nodes[this.railLinks[j].i].x;
                var linkLength = endX-startX;
                // if the wagonCenter is inside the Link
                if (startX <= wagonCenter && wagonCenter <= endX){
                    nodes[this.railLinks[j-1].i].Fy = -wagonForce * (endX-wagonCenter) / linkLength / 1000;
                    // nodes[this.railLinks[j-1].i].Fx = nodes[this.railLinks[j-1].i].Fy*0.1;
                    nodes[this.railLinks[j-1].i].loaded = true;
                    nodes[this.railLinks[j].i].Fy   = -wagonForce * (wagonCenter-startX) / linkLength / 1000;
                    // nodes[this.railLinks[j].i].Fx   = nodes[this.railLinks[j].i].Fy*0.1;
                    nodes[this.railLinks[j].i].loaded = true;
                }
            }
        }

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

        this.fastForward = false;

        this.trigger('simulationstart', this);

        // reset x0
        this.x0 = undef;

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

    start: function(){
		var self = this;

		self.trigger('simulationstart', self);

		self.tchooTchoo();
	},

    edit: function(){
        var self = this;
        self.stop();
        self.trigger('simulationedit', self);
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
        var params = self.get('params');

        var simDuration = self.get('simulationDuration');
		if (time.length > simDuration){
			self.trigger('simulationend', self);
			self.trigger('simulationdone', self);
			self.trigger('silentend', self, true);
			return;
		}

        if (this.beforeSimulate !== undef) this.beforeSimulate(time.length/simDuration);

        var nodes = self.get('nodes');

        var tic = Date.now();
        this.preprocessor();
        //this.solver(Math.max(1000,nodes.length*20));
        if (this.x0 != undef){
            for (var i = 0; i < this.x0.length; i++){
                this.x0[i] = [this.x0[i] * params[4].value];
            }
        }
        this.x0 = this.solver(params[3].value, this.x0);
        if (this.x0 == undef){
            this.edit();
            return;
        }
        this.postprocessor();
        var toc = Date.now();
        var calcDuration = toc-tic;
        //console.log(calcDuration);
        
        var beams = self.get('beams');
        var maxStress = 0;
        var maxStrain = 0;
        beams.forEach((beam) => {
            if (Math.abs(beam.stress) > maxStress) maxStress = Math.abs(beam.stress);
            if (Math.abs(beam.strain) > maxStrain) maxStrain = Math.abs(beam.strain);
        });

        
        time.push(time.length);
        values[0].push(maxStress);

        this.set('time', time);
		this.set('values', values);

		if (!self.fastForward) this.trigger('simulationend', this);


        self.movement = setTimeout(function(){

            self.tchooTchoo();

        }, self.fastForward ? 1 : Math.max(self.moveDelay-calcDuration, 1) );

    }

});