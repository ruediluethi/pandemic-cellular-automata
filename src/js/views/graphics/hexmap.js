var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

module.exports = Backbone.View.extend({
	className: 'hexmap',

	cellEdges: undef,
	cells: undef,

	initialize: function(options) {
		var self = this;

	},

	render: function(envWidth, envHeight, pxWidth, pxHeight){
		var self = this;

		var $canvas = $('<canvas resize></canvas>');
		$canvas.css({
			width: pxWidth,
			height: pxHeight
		});
		self.$el.append($canvas);


		var $loadBack = $('<div></div>');
		var $loadBar = $('<div></div>');

		$loadBack.css({
			position: 'absolute',
			left: 100,
			top: 100,
			width: 100,
			height: 10,
			color: '#FFFFFF'
		});

		self.$el.append($loadBack);


		paper.setup($canvas[0]);

		var envPadding = 0;		
		//var ri = ((pxWidth-2*envPadding) / (envWidth+0.5) )/2;
		var ri = ((pxHeight-2*envPadding) / (envHeight+0.5) )/2;
		var ro = ri/Math.cos(30/180*Math.PI);

		self.cellEdges = [];
		self.cells = [];

		for (var i = 0; i < envHeight; i++){
			for (var j = 0; j < envWidth; j++){

				var leftOffset = ri;
		        if (i%2 == 1){
		            leftOffset = 2*ri;
		        }

		        var cellCenter = new paper.Point(
		        	leftOffset + j*2*ri,
	        		ri + i*Math.sqrt(3)*ri
	        	);

	        	edges = [];
		        for (var l = 0; l  < 6; l++){
		            var alpha = (l+0.5)/6*(2*Math.PI);
		            edges.push([
		            	Math.cos(alpha)*ro,
		            	Math.sin(alpha)*ro
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
			        path.fillColor = paper.Color.random();
			        path.moveTo(cellCenter);
			        path.lineTo(cellCenter.add(edges[l]));
			        path.lineTo(cellCenter.add(edges[l+1]));
			        path.lineTo(cellCenter);
					sectors.push(path);
				}

				self.cells.push(sectors);
				//console.log(self.cells.length);

				
			}
		}

		//self.renderOneCell();

		paper.view.draw();

		return self.$el;
	},

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

	update: function(){
		var self = this;
		if (self.cells == undef){ return; }

		var tic = new Date();

		for (var i = 0; i < self.cells.length; i++){
			var sectors = self.cells[i];
			for (var l = 0; l < sectors.length; l++){
				var path = sectors[l];
				path.fillColor = paper.Color.random();
			}
		}
		paper.view.draw();

		var toc = new Date();

		return toc.getTime() - tic.getTime();
	}

});