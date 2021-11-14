var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

module.exports = Backbone.View.extend({
	className: 'hexmap',

	sectorColors: ['#EEEEEE', window.GREEN, window.LIGHTRED, window.RED, window.YELLOW, window.DARKRED],

	cellEdges: undef,
	cells: undef,
	cellPositions: undef,
	cellAlphas: undef,
	cellOutlines: undef,
	cellWater: undef,

	screenHeight: 0,
	screenWidth: 0,
	envHeight: 0,
	envWidth: 0,

	$canvas: undef,

	ri: 0,
	ro: 0,

	initialize: function(options) {
		var self = this;

	},

	resize: function(width, height){
		var self = this;

		self.screenWidth = width;
		self.screenHeight = height;
	},

	setSize: function(N){
		var self = this;

		var ratio = self.screenWidth / (self.screenHeight * 2/Math.sqrt(3));

		self.envHeight = Math.sqrt(N / ratio);
		self.envWidth = ratio * self.envHeight;

		//self.envWidth = Math.round(N);
		//self.envHeight = Math.floor(self.envWidth * 1 / ratio);

		self.envWidth = Math.round(self.envWidth);
		self.envHeight = Math.round(self.envHeight);

		return [self.envWidth, self.envHeight];
	},

	render: function(){
		var self = this;

		self.$el.html('');
		paper.clear();

		self.$canvas = $('<canvas resize></canvas>');
		self.$canvas.css({
			width: self.screenWidth,
			height: self.screenHeight
		});
		self.$el.append(self.$canvas);

		paper.setup(self.$canvas[0]);

		var envPadding = 0;	
		self.ri = ( self.screenWidth / (self.envWidth-1) )/2;
		self.ro = self.ri/Math.cos(30/180*Math.PI);

		self.cellEdges = [];
		self.cells = [];
		self.cellPositions = [];
		self.cellAlphas = [];
		self.cellOutlines = [];
		self.cellWater = [];

		for (var i = 0; i < self.envHeight; i++){
			for (var j = 0; j < self.envWidth; j++){

				var leftOffset = 0;
		        if (i%2 == 1){
		            leftOffset = self.ri;
		        }

		        var cellCenter = new paper.Point(
		        	leftOffset + j*2*self.ri,
	        		self.ri + i*Math.sqrt(3)*self.ri
	        	);
	        	self.cellPositions.push(cellCenter);


	        	edges = [];
		        for (var l = 0; l  < 6; l++){
		            var alpha = (l+0.5)/6*(2*Math.PI);
		            edges.push([
		            	Math.cos(alpha)*self.ro,
		            	Math.sin(alpha)*self.ro
		            ]);
		        }
		        edges.push(edges[0]);

		        self.cellEdges.push({
					center: cellCenter,
					edges: edges
				});


		        var sectors = [];
		        for (var l = 0; l  < 6; l++){
			        var path = new paper.Path();
			        //path.fillColor = paper.Color.random();
			        path.moveTo(cellCenter);
			        path.lineTo(cellCenter.add(edges[l]));
			        path.lineTo(cellCenter.add(edges[l+1]));
			        path.lineTo(cellCenter);
					sectors.push(path);
				}

				self.cells.push(sectors);
				self.cellAlphas.push(1);
				//console.log(self.cells.length);

				var outline = new paper.Path();
		        outline.strokeColor = '#FFFFFF';
		        
		        //outline.strokeWidth = 2;
		        outline.strokeWidth = 1;

		        outline.fillColor = '#000000';
		        outline.fillColor.alpha = 0;
		        outline.moveTo(cellCenter.add(edges[5]));
		        for (var l = 0; l  < 6; l++){
		        	outline.lineTo(cellCenter.add(edges[l]));
		        }
		        self.cellOutlines.push(outline);

				self.cellWater.push(false);
			}
		}

		//self.renderOneCell();

		paper.view.draw();

		return self.$el;
	},

	/*
	renderOneCell: function(){
		var self = this;

		setTimeout(function(){

			var i = self.cells.length;
			var cellCenter = self.cellEdges[i].center;
			var edges = self.cellEdges[i].edges;

			var sectors = [];
	        for (var l = 0; l  < 6; l++){
		        var path = new paper.Path();
		        path.fillColor = paper.Color.random();
		        path.moveTo(cellCenter);
		        path.lineTo(cellCenter.add(edges[l]));
		        path.lineTo(cellCenter.add(edges[l+1]));
		        path.lineTo(cellCenter);
				sectors.push(path);
			}
			self.cells.push(sectors);


			if (self.cells.length < self.cellEdges.length){
				console.log(self.cells.length);
				self.renderOneCell();
			}else{
				paper.view.draw();
				console.log('DONE');
			}

		}, 1);
	},
	*/

	update: function(cellData, cells){
		var self = this;
		if (self.cells == undef){ return; }
		if (cellData == undef){ return; }


		var tic = new Date();

		for (var i = 0; i < self.cells.length; i++){
			var sectors = self.cells[i];

			for (var l = 0; l < sectors.length; l++){
				var path = sectors[l];
				if (cellData[i] == undef){ return; }
				path.fillColor = self.sectorColors[cellData[i].sectors[l]];
				path.fillColor.alpha = self.cellAlphas[i];
			}

			if (self.cellWater[i]){
				self.cellOutlines[i].fillColor.alpha = 1;
				self.cellOutlines[i].strokeColor = window.WATER;
				self.cellOutlines[i].fillColor = window.WATER;

			}else if (cells != undef && cells[i].closed){
				self.cellOutlines[i].fillColor.alpha = 1;
				self.cellOutlines[i].strokeColor = '#cccccc';
				self.cellOutlines[i].fillColor = '#cccccc';

			/*
			}else if (cells[i].dontRotate){
				self.cellOutlines[i].fillColor.alpha = 0.5;
				self.cellOutlines[i].strokeColor = '#FF0000';
				self.cellOutlines[i].fillColor = '#FF0000';
			*/

			}else{
				self.cellOutlines[i].fillColor.alpha = 0;
				self.cellOutlines[i].strokeColor = '#FFFFFF';
			}
		}
		paper.view.draw();

		var toc = new Date();

		return toc.getTime() - tic.getTime();
	}

});