var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var VHexMap = require('./hexmap.js');

module.exports = VHexMap.extend({
	className: 'gamemap',

	srcImgUrl: undef,
	srcImgWidth: 0,
	srcImgHeight: 0,

	containerHeight: 0,

	initialize: function(options) {
		var self = this;

		self.srcImgUrl = options.srcImgUrl;
		self.srcImgWidth = options.srcImgWidth;
		self.srcImgHeight = options.srcImgHeight;
		self.screenWidth = options.mapWidth;

		if (!window.isMobile){
			self.resize(self.screenWidth, self.screenWidth * self.srcImgHeight/self.srcImgWidth);
		}
	},

	getAreas: function(colorCodes, callback){
		var self = this;

		//var $img = $('<img src="'+self.srcImgUrl+'" id="map-source">');
		//self.$el.append($img);

		//var background = new paper.Raster('map-source');

		var background = new paper.Raster(self.srcImgUrl);

		background.opacity = 0;
		background.position = new paper.Point(self.screenWidth/2, self.screenHeight/2);
		var imgScale = self.srcImgWidth/self.screenWidth;
		var mapHeight = self.srcImgHeight/imgScale;
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

				if (cellPos.x < self.screenWidth && cellPos.y < Math.floor(mapHeight)){
					// exception for water
					if (color.red == 0 && color.green == 0 && color.blue == 0){
						self.cellWater[i] = true;
					}
				}
			}

			// HACK vertical align

			var topMargin = Math.round(self.containerHeight/2 - mapHeight/2)+20;
			if (topMargin > 60){
				topMargin = 60;
			}
			self.$el.css({
				top: topMargin
			});

			callback.call(this,areas);
		});
	},

	paintCity: function(x, y, label, width, align){
		var self = this;

		var imgScale = self.srcImgWidth/self.screenWidth;

		var lineColor = new paper.Color(0.4,0.4,0.4,1.0);

		var p = new paper.Point(Math.round(x/imgScale), Math.round(y/imgScale));

		var a = p.add([20, align == 'bottomleft' ? 20 : -20]);
		var b = a.add([50, 0]);
		var c = b.add([0, -12]);
		var d = c.add([5, 16]);

		if (align == 'topright'){
			a = p.add([-20, align == 'bottomright' ? 20 : -20]);
			b = a.add([-50, 0]);
			c = b.add([-width, -12]);
			d = c.add([5, 16]);
		}

		var whiteCircle = new paper.Path.Circle(p, 5);
		whiteCircle.fillColor = '#FFFFFF';

		var path = new paper.Path();
        path.moveTo(p);
        path.lineTo(a);
        path.lineTo(b);
        path.strokeColor = lineColor;
		path.strokeWidth = 2;

		var rect = new paper.Path.Rectangle(new paper.Rectangle(c, new paper.Size(width, 24)));
		rect.fillColor = '#FFFFFF';

		var circle = new paper.Path.Circle(p, 3);
		circle.fillColor = lineColor;

		var text = new paper.PointText(d);
		text.content = label;
		text.fontFamily = 'Roboto Condensed';
		text.fontSize = '14px';
		text.fontWeight = 700;
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

			var a = new paper.Point(edges[l]);
			var b = new paper.Point(edges[l+1]);

			/*
			var d = b.subtract(a);
			d = d.multiply(0.2);

			var a_ = a.add(d);
			var b_ = b.subtract(d);

			var borderLineA = new paper.Path.Line(cellCenter.add(a), cellCenter.add(a_));
			borderLineA.strokeColor = new paper.Color(0.4,0.4,0.4,1.0);
		    borderLineA.strokeWidth = 3;
		    borderLineA.strokeCap = 'round';

		    var borderLineB = new paper.Path.Line(cellCenter.add(b_), cellCenter.add(b));
			borderLineB.strokeColor = new paper.Color(0.4,0.4,0.4,1.0);
		    borderLineB.strokeWidth = 3;
		    borderLineB.strokeCap = 'round';
		    */

		    var borderLineA = new paper.Path.Line(cellCenter.add(a), cellCenter.add(b));
			borderLineA.strokeColor = new paper.Color(0.3,0.3,0.3,1.0);
		    
		    borderLineA.strokeWidth = 3;
		    //borderLineA.strokeWidth = 2;

		    borderLineA.strokeCap = 'round';

		    //borderLine.dashArray = [5, 5];
		}
	}

});