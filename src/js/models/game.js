var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

var MCellAuto = require('./cellauto.js');

module.exports = MCellAuto.extend({

	areaRefColors: [],
	areaBorders: [],
	areaSpaces: [],
	areaCount: [],
	areaLockdown: [],

	moveProbabilityInLockdown: 0.01,

	simulate: function(){
		var self = this;

		var map = self.get('map');
		var plot = self.get('plot');
		var plots = self.get('plots');
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

		//plot.maxValue = P;
		//plot.render();

		/*
		// update maxValue in plot
		for (var i = 0; i < plots.length; i++){
			var areaPlot = plots[i];
			areaPlot.maxValue = Math.round(P/plots.length);
			areaPlot.render();
		}
		*/

		self.initEmptyEnv(envSize[0],envSize[1]);
		var infectedAtStart = Math.ceil(P*0.001);

		console.log('infected at start '+infectedAtStart);

		self.initIndividuals(P-infectedAtStart,infectedAtStart,0,0);
		self.S.pop();
		self.E.pop();
		self.I.pop();
		self.R.pop();
		self.P.pop();
		self.timeline.pop();

		var areaRefColors = self.get('areaRefColors');

		map.getAreas(areaRefColors, function(areas){
			self.areaSpaces = areas;
			self.areaBorders = [];
			self.areaCount = [];
			self.areaLockdown = [];

			for (var i = 0; i < self.areaSpaces.length; i++){
				self.areaLockdown.push(false);

				self.areaCount.push({
					S: [],
					E: [],
					I: [],
					R: []
				});

				var area = self.areaSpaces[i];
				var border = [];

				for (var j = 0; j < area.length; j++){
					area[j].wallBricks = [];
					var k = area[j].k;
					var cell = self.cells[k];

					var neighbourCount = 0;
					for (var l = 0; l < 6; l++){
						var knext = self.moveOneStep(cell.i, cell.j, l);

						// check if neighbour is also in that area
						var inArea = false;
						for (var h = 0; h < area.length; h++){
							if (knext == area[h].k){
								inArea = true;
								neighbourCount++;
								break;
							}
						}

						if (!inArea){
							area[j].wallBricks.push(l);
						}

					}
					if (neighbourCount < 6){
						border.push(area[j]);
					}
				}

				for (var j = 0; j < border.length; j++){
					map.paintBorder(border[j]);
				}

				self.areaBorders.push(border);
			}

			self.count();


			self.start();
		});
	},

	count: function(){
		var self = this;

		//var params = self.get('params');
		//var upperLimit = params[5].value;
		//var lowerLimit = params[6].value;

		var S_tot = 0;
		var E_tot = 0;
		var I_tot = 0;
		var R_tot = 0;

		for (var i = 0; i < self.areaSpaces.length; i++){
			var area = self.areaSpaces[i];
			var areaCount = self.areaCount[i];
			var S = 0;
			var E = 0;
			var I = 0;
			var R = 0;
			for (var j = 0; j < area.length; j++){
				area[j].wallBricks = [];
				var k = area[j].k;
				var crntCell = self.cellData[k];
				for (var l = 0; l < 6; l++){
					if (crntCell.sectors[l] == 1){ S++; }
					if (crntCell.sectors[l] == 2){ E++; }
					if (crntCell.sectors[l] == 3){ I++; }
					if (crntCell.sectors[l] == 4){ R++; }
				}
			}
			var P = S+E+I+R;
			//areaCount.S.push(S/P);
			//areaCount.E.push(E/P);
			//areaCount.I.push(I/P);
			//areaCount.R.push(R/P);
			areaCount.S.push(S);
			areaCount.E.push(E);
			areaCount.I.push(I);
			areaCount.R.push(R);
			self.areaCount[i] = areaCount;

			/*
			if (self.areaLockdown[i]){
				if ((E+I)/P < lowerLimit){
					self.areaLockdown[i] = false;
					self.openArea(i);
				}
			}else{
				if ((E+I)/P > upperLimit){
					self.areaLockdown[i] = true;
					self.closeArea(i);
				}
			}
			*/

			S_tot = S_tot + S;
			E_tot = E_tot + E;
			I_tot = I_tot + I;
			R_tot = R_tot + R;
		}

		var P_tot = S_tot+E_tot+I_tot+R_tot;

		self.S.push(S_tot/P_tot);
		self.E.push(E_tot/P_tot);
		self.I.push(I_tot/P_tot);
		self.R.push(R_tot/P_tot);
		self.P.push(P_tot/P_tot);
		self.timeline.push(self.timeline.length);

		self.set('time', self.timeline);
		self.set('values', [self.I,self.E,self.R,self.S]);
	},

	openArea: function(areaId){
		var self = this;

		self.areaLockdown[areaId] = false;

		for (var i = 0; i < self.areaSpaces[areaId].length; i++){
			self.cells[self.areaSpaces[areaId][i].k].moveProbability = 1.0;
		}

		for (var i = 0; i < self.areaBorders[areaId].length; i++){
			self.openOneCell(self.areaBorders[areaId][i].k);
		}
	},

	closeArea: function(areaId){
		var self = this;

		self.areaLockdown[areaId] = true;

		for (var i = 0; i < self.areaSpaces[areaId].length; i++){
			self.cells[self.areaSpaces[areaId][i].k].moveProbability = self.moveProbabilityInLockdown;
		}

		for (var i = 0; i < self.areaBorders[areaId].length; i++){
			self.closeOneCell(self.areaBorders[areaId][i].k);
		}
	},


	openOneCell: function(kClose){
		var self = this;

		//if (!self.paused || self.crntStep != 0){
		//	return;
		//}

		self.cells[kClose].closed = false;

		var closedCellData = self.cellData[kClose];
		for (var l = 0; l < 6; l++){

			// stop neighbours from rotating
			self.cells[kNext].dontRotate = false;
		}

	},


	closeOneCell: function(kClose){
		var self = this;

		//if (!self.paused || self.crntStep != 0){
		//	return;
		//}

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
	}

});