
module.exports = {

	hexToRgb: function (hex) {
	    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
	        return r + r + g + g + b + b;
	    });

	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	},

	componentToHex: function (c) {
	    var hex = c.toString(16);
	    return hex.length == 1 ? "0" + hex : hex;
	},

	rgbToHex: function(r, g, b) {
	    return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
	},


	interpolateColor: function(from, to, value){

	    var rgbFrom = this.hexToRgb(from);
	    var rgbTo = this.hexToRgb(to);

	    var rgbCalced = {
	        r: Math.round(rgbFrom.r + (rgbTo.r - rgbFrom.r)*value),
	        g: Math.round(rgbFrom.g + (rgbTo.g - rgbFrom.g)*value),
	        b: Math.round(rgbFrom.b + (rgbTo.b - rgbFrom.b)*value)
	    };

	    return this.rgbToHex(rgbCalced.r, rgbCalced.g, rgbCalced.b);
	},

	gradient: function(z, colors) {
		if (isNaN(z)) return '#000000';
	
		if (z < 0){
			z = 0;
		}
		if (z > 1){
			z = 1;
		}
	
		const colGradient = colors.map((hex) => {
			var c = this.hexToRgb(hex);
			return [c.r, c.g, c.b]
		});
	
		const amountOfColors = colGradient.length;
	
		const ai    = Math.floor(z*(amountOfColors-1));
		const bi    = Math.ceil(z*(amountOfColors-1));
		const value = z*(amountOfColors-1) - ai;
	
		const a = colGradient[ai];
		const b = colGradient[bi];

		var c = {
			r: Math.round(a[0] + (b[0]-a[0])*value),
			g: Math.round(a[1] + (b[1]-a[1])*value),
			b: Math.round(a[2] + (b[2]-a[2])*value)
		};

		return this.rgbToHex(c.r, c.g, c.b);
	}

};