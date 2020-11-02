var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var MSim = require('./sim.js');

module.exports = MSim.extend({

	movement: undef,
	// delay times in ms between the different steps
	moveDelay: 1,
	collideDelay: 1,
	infectDelay: 1,
	stepDelay: 200,

	crntStep: 0,

	cells: undef,
	cellData: undef,
	envWidth: 1,
	envHeight: 1,

	alpha: 0.5, // infection probability
	beta: 0.1,  // recover probability
	gamma: 0.1, // outbreak probability

	S: [],
	E: [],
	I: [],
	R: [],
	P: [],
	timeline: [],

	paused: false,


	simulate: function(){
		var self = this;

		var map = self.get('map');
		var plot = self.get('plot');
		var params = self.get('params');

		var N = params[0].value; // amount of cells
		self.alpha = params[2].value;
		self.beta = params[3].value;
		self.gamma = params[4].value;

		console.log('a='+self.alpha+', b='+self.beta+', c='+self.gamma);

		var envSize = map.setSize(N);
		map.render();
		console.log(N+' --> '+envSize[0]+'*'+envSize[1]+' = '+envSize[0]*envSize[1]);

		N = envSize[0]*envSize[1];
		var P = Math.ceil(6*N*params[1].value); // population

		if (P > 6*N){
			console.log('###ERROR### population does not fit into cells!!!');
			return;
		}

		plot.maxValue = P;
		plot.render();

		self.initEmptyEnv(envSize[0],envSize[1]);
		var infectedAtStart = Math.ceil(P*0.001);

		console.log('infected at start '+infectedAtStart);

		self.initIndividuals(P-infectedAtStart,infectedAtStart,0,0);
		
		// TODO: check if there is enough place to set the individuals in that range
		/*
		self.initIndividuals(P-infectedAtStart,0,0,0);
		self.initIndividualsInRange(
			Math.floor(envSize[0]/2),
			Math.floor(envSize[1]/2),
			infectedAtStart,
			infectedAtStart,
			2
		);
		*/


		self.start();
	},

	stop: function(){
		var self = this;

		if (self.movement != undef){
			clearTimeout(self.movement);
		}

		self.paused = true;
		self.crntStep = 0;
	},

	start: function(){
		var self = this;
		
		self.paused = false;
		self.move();
	},

	initEmptyEnv: function(width, height){
		var self = this;

		self.envWidth = width;
		self.envHeight = height;

		self.S = [];
		self.E = [];
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
					moveProbability: 1,
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

	initIndividuals: function(S, E, I, R){
		var self = this;

		self.cellData = self.initEmptyCells();

		self.initIndividualType(S, 1);
		self.initIndividualType(E, 2);
		self.initIndividualType(I, 3);
		self.initIndividualType(R, 4);


		self.S.push(S);
		self.E.push(E);
		self.I.push(I);
		self.R.push(R);
		self.P.push(S+E+I+R);
		self.timeline.push(0);

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

	move: function(){
		var self = this;

		if (self.movement != undef){
			clearTimeout(self.movement);
		}

		if (self.paused){
			return;
		}


		if (self.timeline.length > self.get('simulationDuration')){
			self.trigger('simulationend', self);
			return;
		}

		self.movement = setTimeout(function(){
			self.moveCells();
			self.trigger('moved', self);
			self.crntStep = 1;

			self.movement = setTimeout(function(){
				self.calcCollisions();
				self.calcWalls();
				self.trigger('collided', self)
				self.crntStep = 2;

				self.movement = setTimeout(function(){
					self.calcInfections();
					self.trigger('infected', self);
					self.crntStep = 0;

					self.count();

					self.trigger('simulationend', self);

					self.movement = setTimeout(function(){
						self.move();
					}, self.stepDelay);
					
				}, self.infectDelay);
			}, self.collideDelay);
		}, self.moveDelay);

	},

	moveCells: function(){
		var self = this;

		var newCells = self.initEmptyCells();

		// sick individuals don't move
		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];
			if (crntCell.n > 0){
				for (var l = 0; l < 6; l++){
					
					if (!self.cells[k].dontRotate){

						//console.log(self.cells[k].moveProbability);

						if (crntCell.sectors[l] == 3 || Math.random() > self.cells[k].moveProbability){

							var crntNewCell = newCells[k];
							crntNewCell.sectors[l] = crntCell.sectors[l];
							crntCell.sectors[l] = 0;
							crntNewCell.n++;
							newCells[k] = crntNewCell;
						}
					}
				}
			}
		}


		// move rest
		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];
			if (crntCell.n > 0){
				for (var l = 0; l < 6; l++){
					if (crntCell.sectors[l] > 0){

						var lNext = l;
						var kNext = self.moveOneStep(crntCell.i, crntCell.j, lNext);
						var nextCell = newCells[kNext];

						// if space is occupied go to next
						while(nextCell.sectors[lNext] != 0){

							kNext = self.moveOneStep(nextCell.i, nextCell.j, lNext);
							nextCell = newCells[kNext];

							if (nextCell.closed){
								lNext = (lNext+3)%6;

								kNext = self.moveOneStep(nextCell.i, nextCell.j, lNext);
								nextCell = newCells[kNext];
							}
						}


						var crntNewCell = newCells[kNext];
						crntNewCell.sectors[lNext] = crntCell.sectors[l];
						crntNewCell.n++;
						newCells[kNext] = crntNewCell;
					}
				}
			}
		}

		self.cellData = newCells;

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

	calcCollisions: function(){
		var self = this;

		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];

			var sickInside = false;
			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] == 3){
					sickInside = true;
					break;
				}
			}

			if (crntCell.n > 1 /*&& !self.cells[k].dontRotate*/ && !sickInside){
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
					// if next cell is a wall
					if (self.cells[kNext].closed){

						var lNext = (l+3)%6;
						var nextCell = crntCell;

						var rndI = Math.floor(Math.random()*6);
						for (var i = 0; i < 6; i++){

							var s = (rndI+i)%6;

							var iNext = self.moveOneStep(nextCell.i, nextCell.j, s);
							if (nextCell.sectors[s] == 0 && !self.cells[iNext].closed){
								lNext = s;
								break;
							}
						}

						//while (nextCell.sectors[lNext] != 0){
						if (nextCell.sectors[lNext] != 0){
							console.log('###ERROR### possible loss of individuals!!!')
						}
						nextCell.sectors[lNext] = crntCell.sectors[l];
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
				if (crntCell.sectors[l] == 2 || crntCell.sectors[l] == 3){ // if infected
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
					if (Math.random() < self.gamma){ // chance for the outbreak of the illness
						crntCell.sectors[l] = 3;
					}

				}else if (crntCell.sectors[l] == 3){ // if sick
					if (Math.random() < self.beta){ // chance to recover
						crntCell.sectors[l] = 4;
					}
				}
			}


			self.cellData[k] = crntCell;
		}
	},


	count: function(){
		var self = this;

		var S = 0;
		var E = 0;
		var I = 0;
		var R = 0;
		for (var k = 0; k < self.cellData.length; k++){
			var crntCell = self.cellData[k];
			for (var l = 0; l < 6; l++){
				if (crntCell.sectors[l] == 1){ S++; }
				if (crntCell.sectors[l] == 2){ E++; }
				if (crntCell.sectors[l] == 3){ I++; }
				if (crntCell.sectors[l] == 4){ R++; }
			}
		}		
		var P = S+E+I+R;

		//console.log(S+'/'+E+'/'+I+'/'+R);

		self.S.push(S);
		self.E.push(E);
		self.I.push(I);
		self.R.push(R);
		self.P.push(P);
		self.timeline.push(self.timeline.length);

		self.set('time', self.timeline);
		self.set('values', [self.I,self.E,self.R,self.S]);
	}

});