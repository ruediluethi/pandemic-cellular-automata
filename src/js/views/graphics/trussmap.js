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

	simulation: undef,

    screenHeight: 0,
	screenWidth: 0,

	gCanvas: undef,
	gNodesOrig: undef,
	gBeamsOrig: undef,
	gNodes: undef,
	gBeams: undef,
	gTrain: undef,

	editModeOn: false,

	dragShift: {
		x: 0,
		y:0
	},

    initialize: function(options) {
		var self = this;

		//if (options.simulation != undef) self.simulation = options.simulation;
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

		self.gCanvas = svg.append('g');
		svg.call(d3.behavior.drag().on("drag", function (d,i) {
			if (!self.editModeOn) return;

			self.dragShift.x += d3.event.dx;
			self.dragShift.y += d3.event.dy;

			self.gCanvas.attr("transform", "translate(" + self.dragShift.x + " " + self.dragShift.y + ")");
		}));


		self.gBeamsOrig = self.gCanvas.append('g');
		self.gNodesOrig = self.gCanvas.append('g');
		self.gTrain = self.gCanvas.append('g');
		self.gBeams = self.gCanvas.append('g');
		self.gNodes = self.gCanvas.append('g');

        return self.$el;
    },

	update: function(nodes, beams, editMode, simulation){
		var self = this;
		self.editModeOn = editMode;


		self.dragShift = {
			x: 0,
			y: 0
		};
		self.gCanvas.attr('transform', 'translate(0 0)');

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
		
		if (editMode){
			var scaleY = d3.scale.linear()
				.domain([minY, maxY])
				.range([self.screenHeight-padding, padding]);
			var scaleX = d3.scale.linear()
				.domain([minX, maxX])
				.range([
					self.screenWidth/2 + (scaleY(maxX - minX + minY)-padding)/2,
					self.screenWidth/2 - (scaleY(maxX - minX + minY)-padding)/2
				]);
		}

		
		var scaleStroke = d3.scale.linear()
			.domain([0, maxA])
			.range([1, 3]);

		const origLines = self.gBeamsOrig.selectAll('line').data(beams);
		origLines.enter()
			.append('line')
			.attr('stroke', '#FFFFFF');
		origLines.exit()
			.remove();
		
		origLines
			.attr('stroke-width', (beam) => scaleStroke(beam.A))
			.attr('x1', (beam) => scaleX(beam.startNode.x))
			.attr('y1', (beam) => scaleY(beam.startNode.y))
			.attr('x2', (beam) => scaleX(beam.endNode.x))
			.attr('y2', (beam) => scaleY(beam.endNode.y));

		const origCircles = self.gNodesOrig.selectAll('circle').data(nodes);
		origCircles.enter()
			.append('circle')
			.attr('r', 3)
			.attr('fill', '#FFFFFF');
		origCircles.exit()
			.remove();
		origCircles
			.attr('cx', (node) => scaleX(node.x))
			.attr('cy', (node) => scaleY(node.y))

		const lines = self.gBeams.selectAll('line').data(beams);
		lines.enter()
			.append('line');
		lines.exit()
			.remove();

		lines.attr('opacity', (beam) => beam.disabled && !editMode ? 0 : 1)
			.attr('stroke', (beam) => {
				if (editMode) return beam.disabled ? '#FFFFFF' : window.BLACK;
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
			.attr('x1', (beam) => scaleX(beam.startNode.x + (editMode ? 0 : beam.startNode.ux)))
			.attr('y1', (beam) => scaleY(beam.startNode.y + (editMode ? 0 : beam.startNode.uy)))
			.attr('x2', (beam) => scaleX(beam.endNode.x + (editMode ? 0 : beam.endNode.ux)))
			.attr('y2', (beam) => scaleY(beam.endNode.y + (editMode ? 0 : beam.endNode.uy)))
			.on('mouseover', function(){
				if (!editMode) return;
				var line = d3.select(this);
				line.attr('stroke-width', (beam) => scaleStroke(beam.A)*2);
			})
			.on('mouseout', function(){
				if (!editMode) return;
				var line = d3.select(this);
				line.attr('stroke-width', (beam) => scaleStroke(beam.A));
			})
			.on('click', function(beam, i){
				if (!editMode) return;

				beams[i].disabled = beams[i].disabled ? false : true;
				simulation.set('beams', beams);

				var line = d3.select(this);
				line.attr('stroke', beams[i].disabled ? '#FFFFFF' : window.BLACK);
			});

		const gNodes = self.gNodes.selectAll('g.node').data(nodes);
		gNodes.enter()
			.append('g')
			.attr('class', 'node')
			.each(function(node, i){
				var g = d3.select(this);

				var gSupport = g.append('g').attr('class', 'support');
				gSupport.append('path')
					.attr('fill', window.WHITE);
				gSupport.append('line')
					.attr('stroke-width', 2)
					.attr('stroke', window.WHITE);

				g.append('circle')
					.attr('cx', 0)
					.attr('cy', 0)
					.attr('r', 2.5)
					.attr('fill', window.BLACK);

				var gArrow = g.append('g').attr('class', 'arrow');
				gArrow.append('line')
					.attr('x1', 0)
					.attr('y1', 0)
					.attr('stroke-width', 2)
					.attr('stroke', window.BLACK);
				gArrow.append('path')
					.attr('fill', window.BLACK);
				
			});
		gNodes.exit()
			.remove();

		gNodes.attr('transform', (node) => 'translate('+
			scaleX(node.x + (editMode ? 0 : node.ux))+','+
			scaleY(node.y + (editMode ? 0 : node.uy))+')')
			.each(function(node, i){
				var g = d3.select(this).select('g.arrow');

				var visibility = scaleF(node.loadedF) > 5 ? 'visible' : 'hidden';
				if (editMode) visibility = 'hidden';
				g.attr('visibility', visibility);

				//g.attr('opacity', node.loaded ? 1 : 0.3);

				g.select('line')
					.attr('stroke', node.loaded ? window.BLACK : window.WHITE)
					.attr('x2', scaleF(node.loadedFx))
					.attr('y2', -scaleF(node.loadedFy));
					

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
					.attr('fill', node.loaded ? window.BLACK : window.WHITE)
					.attr('d', pathDrawFunction(arrow));

				var gSupport = d3.select(this).select('g.support');
				if (node.yLock){
					gSupport.attr('visibility', 'visible');

					var a = 12;
					var h = Math.sqrt(3)/2*a;

					gSupport.select('path').attr('d', pathDrawFunction([{
						x: 0,
						y: 0
					},{
						x: a/2,
						y: h
					},{
						x: -a/2,
						y: h
					},{
						x: 0,
						y: 0
					}]));

					if (node.xLock){
						gSupport.select('line')
							.attr('visibility', 'hidden');
					}else{
						gSupport.select('line')
							.attr('visibility', 'visible')
							.attr('x1', -a/2)
							.attr('y1', h+3)
							.attr('x2', a/2)
							.attr('y2', h+3);
					}
					


				}else{
					gSupport.attr('visibility', 'hidden');
					gSupport.select('path').attr('d', '');
					gSupport.select('line').attr('visibility', 'hidden');
				}
				
			});


		
		if (!editMode && simulation != undef){
			var wagonPaths = self.gTrain.selectAll('path').data(simulation.get('train'));
			wagonPaths.enter()
				.append('path')
				.attr('fill', window.WHITE);

			wagonPaths.attr('d', (d, i) => {
					return pathDrawFunction([
						{
							x: scaleX(d.start),
							y: scaleY(d.y + 2e3)
						},{
							x: scaleX(d.start),
							y: scaleY(d.y + 2e3 + 3890)-1
						},{
							x: scaleX(d.end - (d.i == 0 ? 4000 : 0)),
							y: scaleY(d.y + 2e3 + 3890)-1
						},{
							x: scaleX(d.end),
							y: scaleY(d.y + 2e3 + 2e3)
						},{
							x: scaleX(d.end),
							y: scaleY(d.y + 2e3)
						}
					]);
				});

			wagonPaths.exit()
				.remove();


		}else{

			self.gTrain.selectAll('path').remove();

		}

	}

});