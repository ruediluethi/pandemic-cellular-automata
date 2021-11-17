var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify'); // ~150KB !!

var colors = require('../../libs/colorfunctions.js');

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

		self.gBeamsOrig = svg.append('g');
		self.gNodesOrig = svg.append('g');
		self.gBeams = svg.append('g');
		self.gNodes = svg.append('g');

        return self.$el;
    },

	update: function(nodes, beams){
		var self = this;

		console.log(nodes);
		console.log(beams);

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
		console.log(maxStress);

		var scaleX = d3.scale.linear()
			.domain([minX, maxX])
			.range([50, self.screenWidth-50]);
		var scaleY = d3.scale.linear()
			.domain([minY, maxY])
			.range([
				self.screenHeight/2 + scaleX(maxY - minY)/2,
				self.screenHeight/2 - scaleX(maxY - minY)/2
			]);

		const origLines = self.gBeamsOrig.selectAll('line').data(beams);
		origLines.enter()
			.append('line')
			.attr('stroke-width', 3)
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
			.append('line')
			.attr('stroke-width', 3)
			.attr('stroke', (beam) => {
				if (beam.stress < 0){
					// pull
					return colors.gradient(-beam.stress/maxStress, [window.GREEN, window.YELLOW, window.RED]);
				}else{
					// push
					return colors.gradient(beam.stress/maxStress, [window.GREEN, window.BLUE, window.PURPLE]);
				}
			})
			.attr('x1', (beam) => scaleX(beam.startNode.x + beam.startNode.ux))
			.attr('y1', (beam) => scaleY(beam.startNode.y + beam.startNode.uy))
			.attr('x2', (beam) => scaleX(beam.endNode.x + beam.endNode.ux))
			.attr('y2', (beam) => scaleY(beam.endNode.y + beam.endNode.uy));

		const circles = self.gNodes.selectAll('circle').data(nodes);
		circles.enter()
			.append('circle')
			.attr('cx', (node) => scaleX(node.x + node.ux))
			.attr('cy', (node) => scaleY(node.y + node.uy))
			.attr('r', 3)
			.attr('fill', '#333333');

	}

});