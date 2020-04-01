var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;

var d3 = require('d3-browserify'); // ~150KB !!

var pathDrawFunction = d3.svg.line()
    .x(function(d){ return d.x; })
    .y(function(d){ return d.y; })
    .interpolate('linear');


var VPlot = require('../plot');

module.exports = Backbone.View.extend({


	className: 'cellauto',

	cells: undef,
	cellData: undef,
	envWidth: 1,
	envHeight: 1,

	gCellGrid: undef,

	diagramWidth: 100,
	diagramHeight: 100,

	envPadding: 10,

	movement: undef,

	sectorColors: ['#EEEEEE', window.GREEN, window.RED, window.YELLOW],

	alpha: 0.5, // infection probability
	beta: 0.5,  // recover probability

	vPlot: undef,

	S0: 0,
	I0: 0,
	R0: 0,
	S: [],
	I: [],
	R: [],
	P: [],
	timeline: [],

	pauseTime: 200,
	simDuration: 50,
	crntStep: 0,
	paused: true,

	showPlot: false,

	showMovement: false,
	showCollision: false,
	showInfection: false,
	doVacc: false,

	template: '',

	events: {
		'click button.reset': 'reset',
		'click button.pause': 'pause',
	},


	initialize: function(options) {
		var self = this;

		if (options.template != undef){
			self.template = options.template;
		}

		self.vPlot = new VPlot({
			title: '',
			colors: [window.GREEN, window.RED, window.YELLOW, window.PURPLE],
			alpha: [1, 1, 1, 1],
			minValue: 0,
			maxValue: 1,
			heightScale: 0.5
		});
	},

	render: function(){
		var self = this;

		self.$el.html(templates[self.template]({ title: self.title }));
		var $svg = self.$el.find('svg')[0];
		var svg = d3.select($svg);

		self.diagramWidth = self.$el.find('.cellenv-container').width();
		self.diagramHeight = self.diagramWidth;

		svg.attr('width', self.diagramWidth);
		svg.attr('height', self.diagramHeight);

		self.gCellGrid = svg.append('g')
			.attr('transform', 'translate('+self.envPadding+','+self.envPadding+')');

		


		self.$el.find('.plot-container').prepend(self.vPlot.$el);
		self.vPlot.render();
	},

	reset: function(){
		var self = this;

		self.stopMovement();
		self.initEmptyEnv(self.envWidth, self.envHeight);
		self.initIndividuals(self.S0, self.I0, self.R0);
		self.initIndividualsInRange(15,15,3,5,2); // TODO hard coded!!
		self.doVacc = true;
		self.startMovement(self.pauseTime);

	},

	pause: function(){
		var self = this;

		if (self.paused){
			self.$el.find('button.pause').html('pause');
			self.startMovement(self.pauseTime);
		}else{
			self.paused = true;
			self.$el.find('button.pause').html('wait');
		}
	},


	initEmptyEnv: function(width, height){
		var self = this;

		self.envWidth = width;
		self.envHeight = height;

		self.gCellGrid.selectAll('g.cell').remove();

		self.S = [];
		self.I = [];
		self.R = [];
		self.P = [];
		self.timeline = [];

		self.cells = self.initEmptyCells();
	},

	initEmptyCells: function(){
		var self = this;

		var cells = [];
		for (var i = 0; i < self.envHeight; i++){
			for (var j = 0; j < self.envWidth; j++){

				var newCell = {
					i: i,
					j: j,
					visited: false,
					closed: false,
					dontRotate: false,
					n: 0 // amount of individuals inside the cell
				};

				newCell.sectors = [];
				// initialize empty sectors array
				for (var l = 0; l < 6; l++){
					newCell.sectors.push(0);
				}

				cells.push(newCell);
			}
		}

		return cells;
	},

	initIndividuals: function(S, I, R){
		var self = this;

		self.cellData = self.initEmptyCells();

		self.S0 = S;
		self.I0 = I;
		self.R0 = R;

		self.initIndividualType(S, 1);
		self.initIndividualType(I, 2);
		self.initIndividualType(R, 3);

		if (S+I+R > 0){
			self.vPlot.maxValue = S+I+R;
		}

		self.S.push(S);
		self.I.push(I);
		self.R.push(R);
		self.P.push(S+I+R);
		self.timeline.push(0);


		if (self.showMovement || self.showCollision || self.showInfection){ 
			self.update();
		}

		if (self.showPlot){
			self.updatePlot();
		}
		
	},

	initIndividualsInRange: function(x, y, r, amount, value){
		var self = this;

		var i = 0;
		while(i < amount){

			var r_rand = Math.random()*r;
			var phi_rand = Math.random()*2*Math.PI;
			var x_rand = Math.round(x + Math.cos(phi_rand)*r_rand);
			var y_rand = Math.round(y + Math.sin(phi_rand)*r_rand);

			k_rand = y_rand*self.envWidth + x_rand;

			i += self.placeIndividualRandomlyInCell(k_rand, value);
		}	
	},

	initIndividualType: function(amount, value){
		var self = this;

		var i = 0;
		while(i < amount){
			var r = Math.floor(Math.random()*self.cellData.length);
			i += self.placeIndividualRandomlyInCell(r, value);
		}

	},

	placeIndividualRandomlyInCell: function(k, value){
		var self = this;
		var randomCell = self.cellData[k];
		if (randomCell.n < 6){
			do{
				var s = Math.floor(Math.random()*6);
				if (randomCell.sectors[s] == 0){
					randomCell.sectors[s] = value;
					randomCell.n++;
					return 1;
				}
			}while(true)
		}else{
			return 0;
		}
	},


	startMovement: function(pauseTime){	
		var self = this;
		self.pauseTime = pauseTime;


		self.stopMovement();

		self.paused = false;
		self.move();
	},


	move: function(){
		var self = this;

		if (self.paused || self.timeline.length > self.simDuration){
			self.$el.find('button.pause').html('start');
			return;
		}

		if (self.doVacc && self.I[self.I.length-1] > self.P[self.P.length-1]*0.05){
			self.paused = true;
			self.doVacc = false;
			self.createEpidemicArea(function(){
				self.paused = false;
				self.move();
			});
			return;
			//self.paused = false;
		}


		self.movement = setTimeout(function(){
			self.moveCells();
			//self.initIndividuals(self.S[self.S.length-1],self.I[self.I.length-1],self.R[self.R.length-1]);

			if (self.showMovement){ self.update(); }
			self.crntStep = 1;

			self.movement = setTimeout(function(){
				self.calcCollisions();
				self.calcWalls();

				if (self.showCollision){ self.update(); }
				self.crntStep = 2;

				self.movement = setTimeout(function(){
					self.calcInfections();

					if (self.showInfection){ self.update(); }
					if (self.showPlot){ self.updatePlot(); }
					self.crntStep = 0;

					self.move();

				}, self.showInfection ? self.pauseTime : 1);
			}, self.showCollision ? self.pauseTime : 1);
		}, self.showMovement ? self.pauseTime : 1);

	},

	stopMovement: function(){
		var self = this;

		if (self.movement != undef){
			clearTimeout(self.movement);
		}
		
		self.crntStep = 0;
		self.paused = true;
	},

	moveOneStep: function(i, j, l){ // l = 6 --> no movement
		var self = this;

		var movementSteps = [[ 0, 1, 1],
							 [-1, 0, 1],
							 [-1,-1, 0],
							 [-1, 0,-1],
							 [ 0, 1,-1],
							 [ 1, 1, 0],
							 [ 0, 0, 0]];

		var crntMvmnt = movementSteps[l];
		var iNext = (self.envHeight + i + crntMvmnt[2])%self.envHeight;
		var jNext = (self.envWidth + j + crntMvmnt[i%2])%self.envWidth;
		var kNext = iNext*self.envWidth + jNext;

		return kNext;		 
	},

	moveCells: function(){
		var self = this;

		var newCells = self.initEmptyCells();

		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];
			if (crntCell.n > 0){
				for (var l = 0; l < 6; l++){
					if (crntCell.sectors[l] > 0){
						//var crntMvmnt = movementSteps[l];
						//var iNext = (self.envHeight + crntCell.i + crntMvmnt[2])%self.envHeight;
						//var jNext = (self.envWidth + crntCell.j + crntMvmnt[crntCell.i%2])%self.envWidth;
						//var kNext = iNext*self.envWidth + jNext;

						var kNext = self.moveOneStep(crntCell.i, crntCell.j, l);

						var crntNewCell = newCells[kNext];
						crntNewCell.sectors[l] = crntCell.sectors[l];
						crntNewCell.n++;
						newCells[kNext] = crntNewCell;
					}
				}
			}
		}

		self.cellData = newCells;

	},


	findEmptySpace: function(kStart){
		var self = this;

		//console.log('start: '+kStart);

		var freeSpace = 0;
		var freeCells = [];
		var neighbours = [];
		neighbours.push(kStart);

		for (var r = 0; r < 10; r++){ // Max. Anzahl Ringe

			var crntNeighLength = neighbours.length;
			for (var i = 0; i < crntNeighLength; i++){
				var k = neighbours[i];

				if (!self.cells[k].visited){
					for (var l = 0; l < 6; l++){
						var kNeigh = self.moveOneStep(self.cells[k].i, self.cells[k].j, l);
						if (!self.cells[kNeigh].visited && !self.cells[kNeigh].closed){
							//self.cells[kNeigh].visited = true;

							freeSpaceInCell = 6 - self.cellData[kNeigh].n;
							if (freeSpaceInCell > 0){
								if (freeCells.indexOf(kNeigh) < 0){ // avoid double entries

									// check if free space does not point to closed cell
									var pointsToStart = false;
									var realFreeSpace = 0;
									for (var ll = 0; ll < 6; ll++){
										if (self.cellData[kNeigh].sectors[ll] == 0){
											kNext = self.moveOneStep(self.cells[kNeigh].i, self.cells[kNeigh].j, ll);
											if (!self.cells[kNext].closed){
												realFreeSpace++;
											}
										}
									}

									//console.log(realFreeSpace);

									if (realFreeSpace > 0){
										freeCells.push(kNeigh);
										freeSpace = freeSpace + realFreeSpace;
									}
								}
							}

							neighbours.push(kNeigh);
						}
					}
					self.cells[k].visited = true;
				}
			}

			if (freeSpace > 0){
				break;
			}
		}

		/*
		console.log(freeSpace);
		for (var i = 0; i < freeCells.length; i++){
			var k = freeCells[i];
			console.log(self.cellData[k]);
		}
		*/
		
		//self.debugCells();
		//setTimeout(function(){
			for (var i = 0; i < neighbours.length; i++){
				var k = neighbours[i];
				self.cells[k].visited = false;
			}
		//	self.debugCells();
		//}, 1000);

		return freeCells;
	},


	replaceToEmptySpace: function(kClose, kFrom, lFrom){
		var self = this;

		var fromCell = self.cellData[kFrom];

		var freeCells = self.findEmptySpace(kClose);
		if (freeCells.length < 1){
			fromCell.sectors[lFrom] = 0;
			fromCell.n--;
			console.log('###ERROR### no free cell found!!! one will be missing!!!');
			return;
		}

		var r = Math.floor(Math.random()*freeCells.length);
		var randomCell = self.cellData[freeCells[r]];
		do{
			var s = Math.floor(Math.random()*6);
			if (randomCell.sectors[s] == 0){
				var kNext = self.moveOneStep(randomCell.i, randomCell.j, s);
				if (!self.cells[kNext].closed){ // never place where it points to closed cell
					randomCell.sectors[s] = fromCell.sectors[lFrom];
					randomCell.n++;
					
					fromCell.sectors[lFrom] = 0;
					fromCell.n--;
					break;
				}
			}
		}while(true)
	},


	closeOneCell: function(kClose){
		var self = this;

		if (!self.paused || self.crntStep != 0){
			return;
		}

		self.cells[kClose].closed = true;

		var closedCellData = self.cellData[kClose];
		for (var l = 0; l < 6; l++){

			// move individuals inside closed cell
			if (closedCellData.sectors[l] > 0){
				self.replaceToEmptySpace(kClose, kClose, l);
			}

			// move individuals pointing to closed cell
			var kNext = self.moveOneStep(closedCellData.i, closedCellData.j, l);
			var lNext = (l+3)%6;
			if (self.cellData[kNext].sectors[lNext] > 0){
				self.replaceToEmptySpace(kNext, kNext, lNext);
			}

			// stop neighbours from rotating
			self.cells[kNext].dontRotate = true;
		}


		//self.update();
		//self.updatePlot();


		//console.log(self.cellData[k]);
	},


	closeCells: function(cells, i, callback){
		var self = this;

		if (i >= cells.length){
			callback.call();
			return;
		}

		setTimeout(function(){

			var k = cells[i];
			self.closeOneCell(k);
			//self.update();
			self.closeCells(cells, i+1, callback);

		}, 1);

	},


	paintCircle: function(i,j,radius, callback){
		var self = this;

		var k = i*self.envWidth + j;
		//self.closeOneCell(k);


		for (var r = 0; r < radius; r++){
			k = self.moveOneStep(self.cells[k].i, self.cells[k].j, 4);
			//self.closeOneCell(k);
		}

		var cells = [];
		for (var l = 0; l < 6; l++){
			for (var r = 0; r < radius; r++){
				k = self.moveOneStep(self.cells[k].i, self.cells[k].j, l);
				cells.push(k);
			}
		}

		self.closeCells(cells, 0, callback);		
	},


	paintLine: function(i,j,length,l){
		var self = this;

		var k = i*self.envWidth + j;
		self.closeOneCell(k);

		for (var count = 0; count < length; count++){
			k = self.moveOneStep(self.cells[k].i, self.cells[k].j, l);
			self.closeOneCell(k);
		}
	},


	paintHLine: function(i){
		var self = this;
		for (var j = 0; j < self.envWidth; j++){
			k = i*self.envWidth + j;
			self.closeOneCell(k);
		}
	},

	paintVLine: function(j){
		var self = this;
		for (var i = 0; i < self.envWidth; i++){
			k = i*self.envWidth + j;
			self.closeOneCell(k);
		}
	},

	paintBorder: function(){
		var self = this;


		self.paintHLine(0);
		//self.paintHLine(self.envHeight-1);

		self.paintVLine(0);
		//self.paintVLine(self.envWidth-1);

	},


	createEpidemicArea: function(callback){
		var self = this;

		// get infected cells
		var infectedCells = [];
		for (var k = 0; k < self.cellData.length; k++){
			for (var l = 0; l < 6; l++){
				if (self.cellData[k].sectors[l] == 2){
					infectedCells.push(k);
					break;
				}
			}
		}

		var maxK1 = 0;
		var maxK2 = 0;
		var maxDistance = 0;
		for (var i1 = 0; i1 < infectedCells.length; i1++){
			for (var i2 = 0; i2 < infectedCells.length; i2++){

				var k1 = infectedCells[i1];
				var k2 = infectedCells[i2];

				var deltaI = Math.abs(self.cells[k1].i - self.cells[k2].i);
				var deltaJ = Math.abs(self.cells[k1].j - self.cells[k2].j);

				if (deltaI > maxDistance){
					maxDistance = deltaI;
					maxK1 = k1;
					maxK2 = k2;
				}
				if (deltaJ > maxDistance){
					maxDistance = deltaJ;
					maxK1 = k1;
					maxK2 = k2;
				}
			}
		}


		var a = maxDistance/2;
		var alpha = 60/360 * 2*Math.PI;
		var cr = (a*(1+Math.tan(alpha)))/Math.tan(alpha);

		var ci = Math.round((self.cells[maxK1].i + self.cells[maxK2].i)/2);
		var cj = Math.round((self.cells[maxK1].j + self.cells[maxK2].j)/2);

		self.paintCircle(ci, cj, Math.ceil(cr)+1, callback);
	},


	calcCollisions: function(){
		var self = this;

		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];

			if (crntCell.n > 1 /*&& crntCell.n < 4*/ && !self.cells[k].dontRotate){
				var direction = 1;
				if (Math.random() > 0.5){
					direction = -1;
				}
				//var direction = Math.floor(Math.random() * 6);

				var newSectors = [];
				for (var l = 0; l < 6; l++){
					newSectors[(6+l+direction)%6] = crntCell.sectors[l];
				}
				crntCell.sectors = newSectors;
			}
		}
	},

	calcWalls: function(){
		var self = this;

		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];

			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] > 0){

					var kNext = self.moveOneStep(crntCell.i, crntCell.j, l);

					if (self.cells[kNext].closed){
						if (crntCell.sectors[(l+3)%6] != 0){
							console.log('###ERROR### possible loss of individuals!!!')
						}
						crntCell.sectors[(l+3)%6] = crntCell.sectors[l];
						crntCell.sectors[l] = 0;
					}
				}
			}

		}

	},

	calcInfections: function(){
		var self = this;

		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];

			// count infected individuals inside the cell
			var infectedCount = 0;
			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] == 2){ // if infected
					infectedCount++;
				}
			}


			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] == 1){ // if susceptible
					// check for every infected
					for (var i = 0; i < infectedCount; i++){
						if (Math.random() < self.alpha){ // if the individual gets infected
							crntCell.sectors[l] = 2;
							infectedCount++;
							break;
						}
					}
				}
			}

			// calc chance to recover after infection!!!
			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] == 2){ // if infected
					if (Math.random() < self.beta){ // chance to recover
						crntCell.sectors[l] = 3;
					}
				}
			}

			self.cellData[k] = crntCell;
		}
	},


	updatePlot: function(){
		var self = this;

		var S = 0;
		var I = 0;
		var R = 0;
		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];
			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] == 1){ S++; }
				if (crntCell.sectors[l] == 2){ I++; }
				if (crntCell.sectors[l] == 3){ R++; }
			}
		}

		self.S.push(S);
		self.I.push(I);
		self.R.push(R);
		self.P.push(S+I+R);
		self.timeline.push(self.timeline.length);

		if (self.timeline.length > 1){
			self.vPlot.update([self.S, self.I, self.R, self.P], self.timeline);
			self.trigger('updatePlot', self);
		}
	},


	update: function(){
		var self = this;

		var envPadding = 10;

		var ri = ((self.diagramWidth-2*envPadding) / (self.envWidth+0.5) )/2;
		var ro = ri/Math.cos(30/180*Math.PI);

		var cellsSelection = self.gCellGrid.selectAll('g.cell').data(self.cells);
		cellsSelection.enter()
			.append('g')
			.attr('class', 'cell')
			.attr('transform', function(d,k){

				var i = d.i;
				var j = d.j;

				var leftOffset = ri;
		        if (i%2 == 1){
		            leftOffset = 2*ri;
		        }

		        d.cx = leftOffset + j*2*ri;
        		d.cy = ri + i*Math.sqrt(3)*ri;

				return 'translate('+d.cx+','+d.cy+')';
			})
			.each(function(d,k){
				var g = d3.select(this);

				d.edges = [];
		        for (var l = 0; l  < 6; l++){
		            var alpha = (l+0.5)/6*(2*Math.PI);
		            d.edges.push({
		            	x : Math.cos(alpha)*ro,
		            	y : Math.sin(alpha)*ro
		            });
		        }
		        d.edges.push(d.edges[0]);

				var center = { x: 0, y: 0 };
		        d.sectorPaths = [];
		        for (var l = 0; l  < 6; l++){
		        	d.sectorPaths.push(g.append('path')
						.attr('fill', '#EEEEEE')
						.attr('stroke-width', 0)
						.attr('d', pathDrawFunction([
							center,
							d.edges[l],
							d.edges[l+1],
							center
						])));
		        }

		        d.outline = g.append('path')
					.attr('fill', 'transparent')
					.attr('stroke', '#FFFFFF')
					.attr('stroke-width', 1)
					.attr('d', pathDrawFunction(d.edges));

				d.outline
					/*.on('mouseover', function(d, i){
						var p = d3.select(this);
						p.attr('fill', '#FFFFFF');
					})
					.on('mouseout', function(d, i){
						var p = d3.select(this);
						p.attr('fill', 'transparent');
					})*/
					.on('click', function(d, i){
						self.closeOneCell(k);
					});
				

			});

		if (self.cellData != undef){
			cellsSelection.each(function(d,k){
				var g = d3.select(this);

				var crntCellData = self.cellData[k];

				var animationDuration = 0;
				if (self.showMovement){ animationDuration++; }
				if (self.showCollision){ animationDuration++; }
				if (self.showInfection){ animationDuration++; }
				animationDuration = 1 + self.pauseTime/animationDuration;

				if (self.cells.length < 500){
					for (var l = 0; l  < 6; l++){
						d.sectorPaths[l]
							.transition()
							.duration(animationDuration)
							.attr('fill', self.sectorColors[crntCellData.sectors[l]]);
					}
				}else{
					for (var l = 0; l  < 6; l++){
						d.sectorPaths[l].attr('fill', self.sectorColors[crntCellData.sectors[l]]);
					}
				}

				d.outline.attr('opacity', 1);
				if (self.cells[k].closed){
					d.outline.attr('fill', '#777777');
				}else if (self.cells[k].dontRotate){
					//d.outline.attr('fill', '#777777');
					//d.outline.attr('opacity', 0.2);
				}else{
					d.outline.attr('fill', 'transparent');
				}

			});
		}

	},

	hide: function(){
		var self = this;
		self.stopMovement();
		
		//self.vPlot.$el.hide();
		self.$el.find('.plot-container').hide();
		self.$el.find('.cellenv-container svg').hide();
	},

	show: function(){
		var self = this;

		self.hide();

		if (self.showMovement || self.showCollision || self.showInfection){ 
			self.$el.find('.cellenv-container svg').show();
		}
		if (self.showPlot){
			//self.vPlot.$el.show();
			self.$el.find('.plot-container').show();
		}
	}

});