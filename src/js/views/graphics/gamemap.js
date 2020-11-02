var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var VHexMap = require('./hexmap.js');

module.exports = VHexMap.extend({
	className: 'gamemap',

	srcImgWidth: 0,
	srcImgHeight: 0,

	initialize: function(options) {
		var self = this;

		self.srcImgWidth = options.srcImgWidth;
		self.srcImgHeight = options.srcImgHeight;
		self.screenWidth = options.mapWidth;

		self.resize(self.screenWidth, self.screenWidth * self.srcImgHeight/self.srcImgWidth);
	},

	getAreas: function(colorCodes, callback){
		var self = this;

		var $img = $('<img src="imgs/baden-wuerttemberg.png" id="map-source">');
		self.$el.append($img);

		var background = new paper.Raster('map-source');

		background.opacity = 0;
		background.position = new paper.Point(self.screenWidth/2, self.screenHeight/2);
		var imgScale = self.srcImgWidth/self.screenWidth;
		background.scale(1/imgScale);
		//background.size = new paper.Size(self.screenWidth, self.screenHeight);

		areas = [];
		for (var j = 0; j < colorCodes.length; j++){
			areas.push([]);
		}

		background.on('load', function() {
			for (var i = 0; i < self.cellPositions.length; i++){
				var cellPos = self.cellPositions[i];
				var color = background.getPixel(Math.round(cellPos.x*imgScale), Math.round(cellPos.y*imgScale));

				var cellIsInside = false;
				for (var j = 0; j < colorCodes.length; j++){
					if (colorCodes[j][0] == color.red && colorCodes[j][1] == color.green && colorCodes[j][2] == color.blue){
						areas[j].push({
							k: i
						});
						cellIsInside = true;
					}
				}
				if (cellIsInside){
					self.cellAlphas[i] = 1.0;
				}else{
					self.cellAlphas[i] = 0.2;
				}
			}
			callback.call(this,areas);
		});
	},

	paintBorder: function(cell){
		var self = this;


		var cellCenter = self.cellPositions[cell.k]

		edges = [];
        for (var l = 0; l  < 6; l++){
            var alpha = (l+0.5)/6*(2*Math.PI);
            edges.push([
            	Math.cos(alpha)*self.ro,
            	Math.sin(alpha)*self.ro
            ]);
        }
        edges.push(edges[0]);

		for (var i = 0; i < cell.wallBricks.length; i++){
			var l = cell.wallBricks[i];

			//var borderLine = new paper.Path();
			var borderLine = new paper.Path.Line(cellCenter.add(edges[l]), cellCenter.add(edges[l+1]));
			borderLine.strokeColor = new paper.Color(0.4,0.4,0.4,1.0);
		    borderLine.strokeWidth = 3;
		    borderLine.strokeCap = 'round';
		    //borderLine.dashArray = [5, 5];
		}
	}

});