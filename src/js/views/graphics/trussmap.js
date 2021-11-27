var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify'); // ~150KB !!

var colors = require('../../libs/colorfunctions.js');

var pathDrawFunction = d3.svg.line()
    .x(function(d){ return d.x; })
    .y(function(d){ return d.y; })
    .interpolate('linear');

module.exports = Backbone.View.extend({
	className: 'trussmap',

    screenHeight: 0,
	screenWidth: 0,

	gNodesOrig: undef,
	gBeamsOrig: undef,
	gNodes: undef,
	gBeams: undef,

    initialize: function(options) {
		var self = this;

	},

	resize: function(width, height){
		var self = this;

		self.screenWidth = width;
		self.screenHeight = height;
	},

    render: function(){
		var self = this;

		self.$el.html(templates['trussmap']({  }));

		var svg = d3.select(self.$el.find('svg')[0]);
		svg.attr('width', self.screenWidth);
		svg.attr('height', self.screenHeight);

		svg.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('fill', '#e0e0e0')
			.attr('width', self.screenWidth)
			.attr('height', self.screenHeight);

		var g = svg.append('g');
		svg.call(d3.behavior.zoom().on("zoom", function () {
			//g.attr("transform", "translate(" + d3.event.translate + ")");
			//g.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
		}))

		

		self.gBeamsOrig = g.append('g');
		self.gNodesOrig = g.append('g');
		self.gBeams = g.append('g');
		self.gNodes = g.append('g');

        return self.$el;
    },

	update: function(nodes, beams){
		var self = this;

		// console.log(nodes);
		// console.log(beams);

		var minX = Infinity;
		var maxX = -Infinity;
		var minY = Infinity;
		var maxY = -Infinity;
		nodes.forEach((node) => {
			if (node.x < minX) minX = node.x;
			if (node.x > maxX) maxX = node.x;
			if (node.y < minY) minY = node.y;
			if (node.y > maxY) maxY = node.y;
		});

		// console.log('x range: '+minX+' - '+maxX);
		// console.log('y range: '+minY+' - '+maxY);

		var maxStress = 0;
		beams.forEach((beam) => {
			if (Math.abs(beam.stress) > maxStress) maxStress = Math.abs(beam.stress);
		});
		// console.log('max stress: '+maxStress);

		var maxF = 0;
		nodes.forEach((node) => {
			if (Math.abs(node.loadedF) > maxF) maxF = node.loadedF;
		});
		// console.log('max force: '+maxF);

		var maxA = 0;
		beams.forEach((beam) => {
			if (beam.A > maxA) maxA = beam.A;
		});
		// console.log('max A: '+maxA);

		

		var scaleF = d3.scale.linear()
			.domain([0, maxF])
			.range([0, self.screenWidth*0.1]);
		var padding = self.screenWidth*0.1+20;
		var scaleX = d3.scale.linear()
			.domain([minX, maxX])
			.range([padding, self.screenWidth-padding]);
		var scaleY = d3.scale.linear()
			.domain([minY, maxY])
			.range([
				self.screenHeight/2 + (scaleX(maxY - minY + minX)-padding)/2,
				self.screenHeight/2 - (scaleX(maxY - minY + minX)-padding)/2
			]);

		
		var scaleStroke = d3.scale.linear()
			.domain([0, maxA])
			.range([1, 5]);

		const origLines = self.gBeamsOrig.selectAll('line').data(beams);
		origLines.enter()
			.append('line')
			.attr('stroke-width', 4)
			.attr('stroke', '#FFFFFF')
			.attr('x1', (beam) => scaleX(beam.startNode.x))
			.attr('y1', (beam) => scaleY(beam.startNode.y))
			.attr('x2', (beam) => scaleX(beam.endNode.x))
			.attr('y2', (beam) => scaleY(beam.endNode.y));

		const origCircles = self.gNodesOrig.selectAll('circle').data(nodes);
		origCircles.enter()
			.append('circle')
			.attr('cx', (node) => scaleX(node.x))
			.attr('cy', (node) => scaleY(node.y))
			.attr('r', 3)
			.attr('fill', '#FFFFFF');

		const lines = self.gBeams.selectAll('line').data(beams);
		lines.enter()
			.append('line');

		lines.attr('stroke', (beam) => {
				return colors.gradient(Math.abs(beam.stress)/maxStress, [window.GREEN, window.YELLOW, window.RED]);
				/*if (beam.stress > 0){
					// push
					return colors.gradient(beam.stress/maxStress, [window.GREEN, window.YELLOW, window.RED]);
				}else{
					// pull
					return colors.gradient(-beam.stress/maxStress, [window.GREEN, window.BLUE, window.PURPLE]);
				}*/
			})
			.attr('stroke-width', (beam) => scaleStroke(beam.A))
			.attr('x1', (beam) => scaleX(beam.startNode.x + beam.startNode.ux))
			.attr('y1', (beam) => scaleY(beam.startNode.y + beam.startNode.uy))
			.attr('x2', (beam) => scaleX(beam.endNode.x + beam.endNode.ux))
			.attr('y2', (beam) => scaleY(beam.endNode.y + beam.endNode.uy));

		const gNodes = self.gNodes.selectAll('g.node').data(nodes);
		gNodes.enter()
			.append('g')
			.attr('class', 'node')
			.each(function(node, i){
				var g = d3.select(this);
				g.append('circle')
					.attr('cx', 0)
					.attr('cy', 0)
					.attr('r', 3)
					.attr('fill', window.BLACK);
				g.append('line')
					.attr('x1', 0)
					.attr('y1', 0)
					.attr('stroke-width', 2)
					.attr('stroke', window.BLACK);
				g.append('path')
					.attr('fill', window.BLACK);
			});

		gNodes.attr('transform', (node) => 'translate('+scaleX(node.x + node.ux)+','+scaleY(node.y + node.uy)+')')
			.each(function(node, i){
				var g = d3.select(this);

				var visibility = scaleF(node.loadedF) > 1 ? 'visible' : 'hidden';

				g.select('line')
					.attr('x2', scaleF(node.loadedFx))
					.attr('y2', -scaleF(node.loadedFy))
					.attr('visibility', visibility);

				var phi = Math.atan2(node.loadedFy, node.loadedFx);
				var arrowLength = 10;
				var arrowWidth = Math.PI*0.2;
				var arrow = [
					{
						x: (scaleF(node.loadedF)+arrowLength/2)*Math.cos(phi),
						y: -((scaleF(node.loadedF)+arrowLength/2)*Math.sin(phi))
					},{
						x: scaleF(node.loadedFx)-arrowLength/2*Math.cos(phi-arrowWidth),
						y: -(scaleF(node.loadedFy)-arrowLength/2*Math.sin(phi-arrowWidth))
					},{
						x: scaleF(node.loadedFx)-arrowLength/2*Math.cos(phi+arrowWidth),
						y: -(scaleF(node.loadedFy)-arrowLength/2*Math.sin(phi+arrowWidth))
					},{
						x: (scaleF(node.loadedF)+arrowLength/2)*Math.cos(phi),
						y: -((scaleF(node.loadedF)+arrowLength/2)*Math.sin(phi))
					}
				];
				g.select('path')
					.attr('d', pathDrawFunction(arrow))
					.attr('visibility', visibility);
			});

	}

});