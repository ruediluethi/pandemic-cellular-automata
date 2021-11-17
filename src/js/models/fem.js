var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var MSim = require('./sim.js');
var matrixHelpers = require('../libs/matrixhelpers.js');

module.exports = MSim.extend({

    beams: [],
    nodes: [],

    simulate: function(){

        var time = [];
        var values = [[]];
        for (var it = 100; it < 300; it = it + 2){
            this.preprocessor();
            this.solver(it);
            this.postprocessor();

            var beams = this.get('beams');
            var maxStress = 0;
            beams.forEach((beam) => {
                if (Math.abs(beam.stress) > maxStress) maxStress = Math.abs(beam.stress);
            });

            time.push(time.length);
            values[0].push(maxStress);
            //console.log(maxStress);

        }

        console.log(time);
        console.log(values);

        this.set('time', time);
		this.set('values', values);
		this.trigger('simulationend', this);
    },

    preprocessor: function(){

        var nodes = this.get('nodes');
        var nodePositions = [];
        for (var i = 0; i < nodes.length; i++){
            nodes[i].x = parseFloat(nodes[i].x);
            nodePositions.push(nodes[i].x);
            nodes[i].y = parseFloat(nodes[i].y);
            nodePositions.push(nodes[i].y);
            nodes[i].Fx = parseFloat(nodes[i].Fx);
            nodes[i].Fy = parseFloat(nodes[i].Fy);
            nodes[i].xLock = parseInt(nodes[i].xLock);
            nodes[i].yLock = parseInt(nodes[i].yLock);
        }
        this.set('nodes', nodes);
        this.set('nodePositions', nodePositions);

        var beams = this.get('beams');
        // calc length and angle for every beam
        for (var i = 0; i < beams.length; i++){
            beams[i].start = parseInt(beams[i].start);
            beams[i].startNode = nodes[beams[i].start-1];
            beams[i].end = parseInt(beams[i].end);
            beams[i].endNode = nodes[beams[i].end-1];

            // calc phi and length
            var delta_x = beams[i].endNode.x - beams[i].startNode.x;
            var delta_y = beams[i].endNode.y - beams[i].startNode.y;
            beams[i].length = Math.sqrt(delta_x*delta_x + delta_y*delta_y); // beam length
            beams[i].phi = Math.atan2(delta_y, delta_x); // angle
            beams[i].A = parseFloat(beams[i].A);
            beams[i].youngsModule = parseFloat(beams[i].youngsModule);
        }
        this.set('beams', beams);
    },

    solver: function(iterations){

        var nodes = this.get('nodes');
        var beams = this.get('beams');

        var variance = 2; // number of degrees of freedom
        var n = nodes.length * variance;
        var K = matrixHelpers.create(n,n);
        var F = [];
        var looseFs = [];

        for (var k = 0; k < nodes.length; k++){
            if (!nodes[k].xLock) looseFs.push(F.length);
            F.push([nodes[k].Fx]);
            if (!nodes[k].yLock) looseFs.push(F.length);
            F.push([nodes[k].Fy]);
        }

        for (var k = 0; k < beams.length; k++){
            var a = beams[k].start-1;
            var b = beams[k].end-1;

            var A = beams[k].A; // sectional area
            var Y = beams[k].youngsModule; // Young's module
            var L = beams[k].length; // beam length
            var phi = beams[k].phi; // angle

            var c = Math.cos(phi);
            var s = Math.sin(phi);
            var D = Y * A / L;

            // stiffness matrix
            var Ke = matrixHelpers.scale([[ c*c,  c*s, -c*c, -c*s],
                                          [ c*s,  s*s, -c*s, -s*s],
                                          [-c*c, -c*s,  c*c,  c*s],
                                          [-c*s, -s*s,  c*s,  s*s]], D);

            // insert into global stiffness matrix
            var indexList = [a*variance, a*variance+1, b*variance, b*variance+1];
            for (var i = 0; i < indexList.length; i++){
                for (var j = 0; j < indexList.length; j++){
                    K[indexList[i]][indexList[j]] = K[indexList[i]][indexList[j]] + Ke[i][j];
                }
            }
        }

        // remove locked parts
        var F_part = [];
        var K_part = [];
        for (var i = 0; i < looseFs.length; i++){
            F_part.push(F[looseFs[i]]);
            K_part.push([]);
            for (var j = 0; j < looseFs.length; j++){
                K_part[K_part.length-1].push(K[looseFs[i]][looseFs[j]]);
            }
        }
        // solve the system of linear equations
        var u_part = matrixHelpers.gaussSeidel(K_part, F_part, iterations);

        const u = [];
        for (var i = 0; i < looseFs.length; i++){
            for (var k = u.length; k < looseFs[i]; k++){
                u.push([0]);
            }
            u.push(u_part[i]);
        }
        for (var k = u.length; k < F.length; k++){
            u.push([0]);
        }
        //this.set('displacements', u);
        
        F = matrixHelpers.multiply(K,u);

        for (var k = 0; k < nodes.length; k++){
            nodes[k].loadedFx = F[k*2][0];
            nodes[k].loadedFy = F[k*2+1][0];
            nodes[k].ux = u[k*2][0];
            nodes[k].uy = u[k*2+1][0];
        }

        this.set('nodes', nodes);
    },

    postprocessor: function(){

        var nodes = this.get('nodes');
        var beams = this.get('beams');

        for (var k = 0; k < beams.length; k++){
            var beam = beams[k];
            beam.startNode = nodes[beam.start-1];
            beam.endNode = nodes[beam.end-1];

            // displacements along beam direction
            ua = beam.startNode.ux*Math.cos(beam.phi) + beam.startNode.uy*Math.sin(beam.phi);
            ub = beam.endNode.ux*Math.cos(beam.phi) + beam.endNode.uy*Math.sin(beam.phi);
            beam.u = ub - ua;

            beam.strain = beam.u / beam.length;
            beam.stress = beam.youngsModule * beam.strain;
            beam.F      = beam.stress * beam.A;

            beams[k] = beam;
        }

        this.set('beams', beams);
    }

});