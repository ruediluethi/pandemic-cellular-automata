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

        this.preprocessor();
        this.solver();

        var beams = this.get('beams');
        var displacements = this.get('displacements');

        var time = [];
        var values = [[]];
        for (var i = 0; i < displacements.length; i++){
            time.push(i);
            values[0].push(Math.abs(displacements[i][0]));
        }

        // console.log(time);
        console.log(values);

        this.set('time', time);
		this.set('values', values);
		this.trigger('simulationend');
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
            var startNode = nodes[beams[i].start-1];
            beams[i].end = parseInt(beams[i].end);
            var endNode = nodes[beams[i].end-1];

            // calc phi and length
            var delta_x = endNode.x - startNode.x;
            var delta_y = endNode.y - startNode.y;
            beams[i].length = Math.sqrt(delta_x*delta_x + delta_y*delta_y); // beam length
            beams[i].phi = Math.atan2(delta_y, delta_x); // angle
            beams[i].A = parseFloat(beams[i].A);
            beams[i].youngsModule = parseFloat(beams[i].youngsModule);
        }
        this.set('beams', beams);
    },

    solver: function(){

        var nodes = this.get('nodes');
        var beams = this.get('beams');

        var variance = 2; // number of degrees of freedom
        var n = nodes.length * variance;
        var K = matrixHelpers.create(n,n);
        var F_nodes = [];
        var looseFs = [];

        for (var k = 0; k < nodes.length; k++){
            if (!nodes[k].xLock) looseFs.push(F_nodes.length);
            F_nodes.push([nodes[k].Fx]);
            if (!nodes[k].yLock) looseFs.push(F_nodes.length);
            F_nodes.push([nodes[k].Fy]);
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
            F_part.push(F_nodes[looseFs[i]]);
            K_part.push([]);
            for (var j = 0; j < looseFs.length; j++){
                K_part[K_part.length-1].push(K[looseFs[i]][looseFs[j]]);
            }
        }
        // solve the system of linear equations
        var u_part = matrixHelpers.gaussSeidel(K_part, F_part);

        const u = [];
        for (var i = 0; i < looseFs.length; i++){
            for (var k = u.length; k < looseFs[i]; k++){
                u.push([0]);
            }
            u.push(u_part[i]);
        }
        for (var k = u.length; k < F_nodes.length; k++){
            u.push([0]);
        }
        this.set('displacements', u);
        
        var F_beams = matrixHelpers.multiply(K,u);
        this.set('forceInBeams', F_beams);
    },

    postprocessor: function(){

    }

});