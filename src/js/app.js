var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

require('browsernizr/test/history');
var Modernizr = require('browsernizr');

var d3 = require('d3-browserify'); // ~150KB !!

var Router = require('./router');

var VRibbon = require('./views/scrollribbon');
var VBackgroundHandler = require('./views/backgroundhandler');

var MSim = require('./models/sim.js');
var MCellAuto = require('./models/cellauto.js');
var MGame = require('./models/game.js');
var VSimPlot = require('./views/graphics/simplot');
var VAreaPlot = require('./views/graphics/areaplot');

var VHexMap = require('./views/graphics/hexmap');
var VGameMap = require('./views/graphics/gamemap');

module.exports = Backbone.View.extend({

	className: 'app',

	router: undef,

	vRibbon: undef,
	vBackHandler: undef,
	vHexMap: undef,

	vSIRplot: undef,
	vSIR2plot: undef,
	vSEIRplot: undef,
	vRandomSEIRplot: undef,

	simCellAutoSmall: undef,
	vCellAutoPlotSmall: undef,
	simCellAutoBig: undef,
	vCellAutoPlotBig: undef,

	simGame: undef,
	vGamePlot: undef,
	vGameMap: undef,
	vAreaPlot: undef,

	vCellAutoMap: undef,

	resizeTimeout: undef,

	events: {
		'click a.route': 'linkClick'
	},

	initialize: function(options) {
		var self = this;

	},


	initRouter: function(){
		var self = this;

		// init the router and push states
	    self.router = new Router({
	    	app: self
	    });

	    // because of IE9 stupidity
	    if (!window.location.origin) {
			window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
		}

	    // start backbone history
	    Backbone.history.start({
	    	pushState: Modernizr.history,
	    	root: window.base.replace(window.location.origin, '')
	    });

	},


	showRoot: function(){
		var self = this;

		self.$el.html(templates['app']({ }));

		self.vBackHandler = new VBackgroundHandler();
		self.$el.append(self.vBackHandler.render().$el);

		self.vRibbon = new VRibbon();
		self.$el.append(self.vRibbon.render('content').$el);

		self.initDiagrams();
		self.resize();

		//self.vBackHandler.$el.find('.fullscreen').append(self.vHexMap.$el);


		var $homeBack = $('<div class="dummy-cell-auto"></div>');
		var $cellAutoBack = $('<div class="dummy-cell-auto-scaled"></div>');
		var $homeDiagram = $('<img src="imgs/diagram_home.png" style="margin-top: 90px;">');
		var $sirDiagram = $('<img src="imgs/diagram_sir.png" style="margin-top: 90px;">');
		var $sirR0Diagram = $('<img src="imgs/diagram_sir_r0.png" style="margin-top: 90px;">');
		var $seirDiagram = $('<img src="imgs/diagram_seir.png" style="margin-top: 90px;">');
		var $randomautoDiagram = $('<img src="imgs/diagram_randomauto.png" style="margin-top: 90px;">');
		var $cellautoDiagram = $('<img src="imgs/diagram_cellauto.png" style="margin-top: 90px;">');
		var $simulationDiagram = $('<img src="imgs/diagram_sim-params.png" style="margin-top: 90px;">'+
								 '<img src="imgs/diagram_sim.png" style="margin-top: 20px; margin-left: -5px;">');
		var $simulationBack = $('<div class="simulation-back"><img src="imgs/simulation_back.png"></div>');
		//var $realDataDiagram = $('<img src="imgs/diagram_masern.png" style="margin-top: 90px;">'+
		//						 '<img src="imgs/diagram_polio.png" style="margin-top: 20px;">'+
		//						 '<img src="imgs/diagram_corona.png" style="margin-top: 20px;">');


		// show content on anchor position
		var anchorBefore = undef;
		var onIntroScreen = false;
		self.vRibbon.bind('onScrollAnchor', function($anchor, scrollPos){
			var anchorId = $anchor.data('anchor');

			self.vRibbon.setNoMenuActive();

			if (anchorId == 'home' || 
				anchorId == 'intro' ||
				anchorId == 'mathematics' || 
				anchorId == 'computer-science' || 
				anchorId == 'engineering' ||
				anchorId == 'footer'){
				//self.vBackHandler.showBackground($homeBack, false);
				self.vBackHandler.showBackground(self.vHexMap.$el, false);

			}else if (anchorId == 'implementation'){
				//self.vBackHandler.showBackground($cellAutoBack, true);
				//self.vBackHandler.appendContent('right', $cellautoDiagram);
				self.vBackHandler.showBackground(self.vHexMap.$el, false);
				self.vBackHandler.appendDiagram('right', self.vCellAutoPlotBig);
				self.vRibbon.setMenuActive('computer-science');

			}else{
				self.simCellAutoBig.stop();
			}

			if (anchorId == 'home' || 
				anchorId == 'intro' ||
				anchorId == 'mathematics' || 
				anchorId == 'computer-science' || 
				anchorId == 'engineering'){
				//self.vBackHandler.appendContent('right', $homeDiagram);
				if (!onIntroScreen){
					onIntroScreen = true;
					self.vBackHandler.appendDiagram('right', self.vCellAutoPlotBig);
				}
			}else{
				onIntroScreen = false;
			}

			if (anchorId == 'footer'){
				self.vBackHandler.appendContent('center', $(''));
			}

			if (anchorId != 'footer'){
				self.vBackHandler.$el.css({
					top: 0
				});
			}

			if (anchorId == 'simulation'){
				//self.vBackHandler.removeBackground(false);
				//self.vBackHandler.showBackground($simulationBack, false);
				//self.vBackHandler.appendContent('left', $simulationDiagram);
				self.vBackHandler.showBackground(self.vGameMap.$el, false);
				//self.vBackHandler.appendDiagram('left', self.vGamePlot);
				self.vBackHandler.appendDiagram('left', self.vAreaPlot);
				self.vRibbon.setMenuActive('engineering');
			}else{
				self.simGame.stop();
			}

			if (anchorId == 'SIR'){
				self.vBackHandler.removeBackground(false);
				//self.vBackHandler.appendContent('center', $sirDiagram);
				self.vBackHandler.appendDiagram('center', self.vSIRplot);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'R0'){
				self.vBackHandler.removeBackground(false);
				//self.vBackHandler.appendContent('center', $sirR0Diagram);
				self.vBackHandler.appendDiagram('center', self.vSIR2plot);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'SEIR'){
				//self.vBackHandler.appendContent('center', $seirDiagram);
				self.vBackHandler.appendDiagram('center', self.vSEIRplot);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'calc-random'){
				self.vBackHandler.removeBackground(true);
				//self.vBackHandler.appendContent('center', $randomautoDiagram);
				self.vBackHandler.appendDiagram('center', self.vRandomSEIRplot);
				self.vRibbon.setMenuActive('mathematics');
			}


			if (anchorId == 'cell-auto'){
				//self.vBackHandler.showBackground($cellAutoBack, true);
				//self.vBackHandler.appendContent('right', $cellautoDiagram);
				self.vBackHandler.showBackground(self.vHexMap.$el, false);
				self.vBackHandler.appendDiagram('right', self.vCellAutoPlotSmall);
				self.vRibbon.setMenuActive('computer-science');

			}else{
				self.simCellAutoSmall.stop();
			}

			// implementation (see above...)

			if (anchorId == 'the-end'){
				self.vBackHandler.removeBackground(anchorBefore == 'real-data');
				self.vBackHandler.appendContent('center', $(''));
			}
			
			anchorBefore = anchorId;
		});

		self.vRibbon.bind('onScroll', function($anchor, scrollPos){
			var anchorId = $anchor.data('anchor');


			if (anchorId == 'footer'){
				//console.log(anchorId+': '+scrollPos);

				self.vBackHandler.$el.css({
					top: 'auto',
					bottom: scrollPos
				});
			}
		});


		$(window).resize(function(){
			clearTimeout(self.resizeTimeout);
			self.resizeTimeout = setTimeout(function(){
				self.resize();
				self.render(false);
			}, 1000);
		});

		
		self.render(true);
		self.vRibbon.initScrollHandler();

		self.hideLoading();

		/*
		var framerate = 1;
		var durations = [];
		setInterval(function(){
			var crntDuration = self.vHexMap.update();
			durations.push(crntDuration);

			var avgDuration = 0;
			for (var i = 0; i < durations.length; i++){
				avgDuration += durations[i];
			}
			avgDuration = avgDuration / durations.length

			framerate = Math.floor(1000/avgDuration);
			self.$el.find('h1').first().html(crntDuration + 'ms -> avg = ' + Math.round(avgDuration) +'ms');
			self.$el.find('h1').last().html('=> '+ framerate + 'fps');
		}, 1000/framerate);
		*/
	},

	initDiagrams: function(){
		var self = this;

		// SIR simulation
		var simSIR = new MSim();
		simSIR.set('simulationDuration', 50);
		simSIR.set('initValues', [0.01, 0, 0.99]);
		simSIR.set('params', [
			{ value: 0.6, minValue: 0.1, maxValue: 1, label: 'Infektionsrate &alpha;', color: window.BLACK }, // gamma
			{ value: 0.2, minValue: 0.1, maxValue: 1, label: 'Genesungsrate &beta;', color: window.BLACK }      // delta
		]);
		simSIR.set('diffeqs', [
			function(crntValues, params, t){
				// I_k+1 = I_k + alpha * S_k * I_k - beta * I_k
				return crntValues[0] + params[0].value*crntValues[2]*crntValues[0] - params[1].value*crntValues[0];

			}, function(crntValues, params, t){
				// R_k+1 = R_k + beta * I_k
				return crntValues[1] + params[1].value*crntValues[0];

			}, function(crntValues, params, t){
				// S_k+1 = S_k - alpha * S_k * I_k
				return crntValues[2] - params[0].value*crntValues[2]*crntValues[0];
			}
		]);

		self.vSIRplot = new VSimPlot({
			title: 'Simulation',
			simulation: simSIR,
			ticks: 5,
			tocks: 10,
			plotColors: [window.RED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.YELLOW]
		});

		// SIR with R0
		var simSIR2 = new MSim();
		simSIR2.set('simulationDuration', 50);
		simSIR2.set('initValues', [0.01, 0, 0.99]);
		simSIR2.set('params', [
			{ value: 3, minValue: 1, maxValue: 10, label: 'Basisreproduktionszahl R<sub>0</sub>', color: window.BLACK }, 
			{ value: 5, minValue: 1, maxValue: 10, label: 'Genesungsdauer T<sub>&beta;</sub>', color: window.BLACK }    
		]);
		simSIR2.set('diffeqs', [
			function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta
				var alpha = params[0].value * beta; // <=> R_0 = alpha / beta

				// I_k+1 = I_k + alpha * S_k * I_k - beta * I_k
				return crntValues[0] + alpha*crntValues[2]*crntValues[0] - beta*crntValues[0];

			}, function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta

				// R_k+1 = R_k + beta * I_k
				return crntValues[1] + beta*crntValues[0];

			}, function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta
				var alpha = params[0].value * beta; // <=> R_0 = alpha / beta

				// S_k+1 = S_k - alpha * S_k * I_k
				return crntValues[2] - alpha*crntValues[2]*crntValues[0];
			}
		]);

		self.vSIR2plot = new VSimPlot({
			title: 'Simulation',
			simulation: simSIR2,
			ticks: 5,
			tocks: 10,
			plotColors: [window.RED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.YELLOW]
		});


		// SEIR simulation
		var dt = 1.0;
		var simSEIR = new MSim();
		simSEIR.set('simulationDuration', 50/dt);
		simSEIR.set('initValues', [0, 0.01, 0, 0.99]);
		simSEIR.set('params', [
			{ value: 3, minValue: 1, maxValue: 10, label: 'Basisreproduktionszahl R<sub>0</sub>', color: window.BLACK }, 
			{ value: 5, minValue: 1, maxValue: 10, label: 'Genesungsdauer T<sub>&beta;</sub>', color: window.BLACK },
			{ value: 2, minValue: 1, maxValue: 10, label: 'Inkubationszeit T<sub>&gamma;</sub>', color: window.BLACK }    
		]);
		simSEIR.set('diffeqs', [
			function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta
				var gamma = 1 / params[2].value; // gamma = 1 / T_gamma
				var alpha = params[0].value * beta; // <=> R_0 = alpha / beta

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return I_k + (gamma*E_k - beta*I_k)*dt;

			}, function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta
				var gamma = 1 / params[2].value; // gamma = 1 / T_gamma
				var alpha = params[0].value * beta; // <=> R_0 = alpha / beta

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return E_k + (alpha*S_k*(E_k + I_k) - gamma*E_k)*dt;

			}, function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta
				var gamma = 1 / params[2].value; // gamma = 1 / T_gamma
				var alpha = params[0].value * beta; // <=> R_0 = alpha / beta

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return R_k + (beta*I_k)*dt;

			}, function(crntValues, params, t){
				var beta = 1 / params[1].value; // beta = 1 / T_beta
				var gamma = 1 / params[2].value; // gamma = 1 / T_gamma
				var alpha = params[0].value * beta; // <=> R_0 = alpha / beta

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return S_k - (alpha*S_k*(E_k + I_k))*dt;
			}
		]);

		self.vSEIRplot = new VSimPlot({
			title: 'Simulation',
			simulation: simSEIR,
			ticks: 5,
			tocks: 10,
			plotColors: [window.RED, window.LIGHTRED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte ohne', 'mit Symptomen', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.LIGHTRED, window.YELLOW]
		});


		// random SEIR simulation
		var acc = 0.2;
		var P = 2000;
		var simRandomSEIR = new MSim();
		simRandomSEIR.set('simulationDuration', 50/acc);
		simRandomSEIR.set('initValues', [0*P, 0.01*P, 0*P, 0.99*P, 0*P, 0.01*P, 0*P, 0.99*P]);
		simRandomSEIR.set('params', [
			{ value: P*0.5, minValue: 1, maxValue: P, label: 'Anzahl Zellen N', color: window.BLACK }, 
			{ value: 0.3, minValue: 0.1, maxValue: 1, label: 'Infektionsw\'keit a', color: window.BLACK }, 
			{ value: 0.2, minValue: 0.1, maxValue: 1, label: 'Genesungsw\'keit b', color: window.BLACK },
			{ value: 0.5, minValue: 0.1, maxValue: 1, label: 'Ausbruchsw\'keit c', color: window.BLACK }    
		]);

		simRandomSEIR.set('diffeqs', [
			// SEIR
			function(crntValues, params, t){
				var N = Math.round(params[0].value); // Anzahl Zellen
				var a = params[1].value*acc; // Infektionswahrscheinlichkeit
				var b = params[2].value*acc; // Genesungswahrscheinlichkeit
				var c = params[3].value*acc; // Ausbruchswahrscheinlichkeit

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return I_k + c*E_k - b*I_k;

			}, function(crntValues, params, t){
				var N = Math.round(params[0].value); // Anzahl Zellen
				var a = params[1].value*acc; // Infektionswahrscheinlichkeit
				var b = params[2].value*acc; // Genesungswahrscheinlichkeit
				var c = params[3].value*acc; // Ausbruchswahrscheinlichkeit

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return E_k + S_k * (1 - Math.pow(1-a, (E_k + I_k)/N )) - c*E_k;

			}, function(crntValues, params, t){
				var N = Math.round(params[0].value); // Anzahl Zellen
				var a = params[1].value*acc; // Infektionswahrscheinlichkeit
				var b = params[2].value*acc; // Genesungswahrscheinlichkeit
				var c = params[3].value*acc; // Ausbruchswahrscheinlichkeit

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return R_k + b*I_k;

			}, function(crntValues, params, t){
				var N = Math.round(params[0].value); // Anzahl Zellen
				var a = params[1].value*acc; // Infektionswahrscheinlichkeit
				var b = params[2].value*acc; // Genesungswahrscheinlichkeit
				var c = params[3].value*acc; // Ausbruchswahrscheinlichkeit

				var I_k = crntValues[0];
				var E_k = crntValues[1];
				var R_k = crntValues[2];
				var S_k = crntValues[3];

				return S_k - S_k * (1 - Math.pow(1-a, (E_k + I_k)/N ));
			},

			// random automat
			function(crntValues, params, t, newValues){
				var N = Math.round(params[0].value); // Anzahl Zellen
				var a = params[1].value*acc; // Infektionswahrscheinlichkeit
				var b = params[2].value*acc; // Genesungswahrscheinlichkeit
				var c = params[3].value*acc; // Ausbruchswahrscheinlichkeit

				var I_k = crntValues[4];
				var E_k = crntValues[5];
				var R_k = crntValues[6];
				var S_k = crntValues[7];

				C = new Array(N);
				for (var j = 0; j < N; j++){
					C[j] = [0, 0, 0, 0];
				} 

				A = [S_k, E_k, I_k, R_k];
				for (var i = 0; i < 4; i++){
					for (var j = 0; j < A[i]; j++){
						var randCellNr = Math.floor(Math.random()*N);
						C[randCellNr][i]++;
					}
				}

				newValues[4] = 0;
				newValues[5] = 0;
				newValues[6] = 0;
				newValues[7] = 0;
				for (var j = 0; j < N; j++){
					
					for (var s = 0; s < C[j][0]; s++){ // für jeden gesunden
            			for (var i = 0; i < C[j][1] + C[j][2]; i++){ // wird für jeden infizierten mit/ohne symptome
            				if (Math.random() < a){ // kalkuliert ob er sich infiziert
            					C[j][0] = C[j][0]-1;
                    			C[j][1] = C[j][1]+1;
            				}
            			}
					}

			        for (var i = 0; i < C[j][1]; i++){ // krankheit bricht aus
			            if (Math.random() < c){
			                C[j][1] = C[j][1]-1;
                    		C[j][2] = C[j][2]+1;
			            }
			        }

			        for (var i = 0; i < C[j][2]; i++){ // genesen
			            if (Math.random() < b){
			                C[j][2] = C[j][2]-1;
                    		C[j][3] = C[j][3]+1;
			            }
			        }

			        // count
					newValues[4] = newValues[4] + C[j][2];
					newValues[5] = newValues[5] + C[j][1];
					newValues[6] = newValues[6] + C[j][3];
					newValues[7] = newValues[7] + C[j][0];
				}

				return newValues[4];

			}, function(crntValues, params, t, newValues){
				return newValues[5];

			}, function(crntValues, params, t, newValues){
				return newValues[6];

			}, function(crntValues, params, t, newValues){
				return newValues[7];
			}
		]);

		self.vRandomSEIRplot = new VSimPlot({
			title: 'Simulation',
			simulation: simRandomSEIR,
			ticks: 10,
			tocks: 50,
			minValue: 0,
			maxValue: P,
			plotColors: [window.RED, window.LIGHTRED, window.YELLOW, window.GREEN, '#FFFFFF','#FFFFFF','#FFFFFF','#FFFFFF'],
			plotStrokes: [0,0,0,0,1,1,1,1],
			plotAlphas:  [1,1,1,1,1,1,1,0],
			legend: ['Gesunde', 'Infizierte ohne', 'mit Symptomen', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.LIGHTRED, window.YELLOW]
		});


		// cell auto simulation
		self.vHexMap = new VHexMap();

		// small
		self.simCellAutoSmall = new MCellAuto();
		self.simCellAutoSmall.set('map', self.vHexMap);
		self.simCellAutoSmall.set('simulationDuration', 50);
		self.simCellAutoSmall.set('params', [
			{ value: 200, minValue: 10, maxValue: 1000, label: 'Anzahl Zellen N', color: window.BLACK }, 
			{ value: 0.4, minValue: 0.1, maxValue: 1, label: 'Population P', color: window.BLACK }, 
			{ value: 0.5, minValue: 0, maxValue: 1, label: 'Infektionsw\'keit a', color: window.BLACK }, 
			{ value: 0.2, minValue: 0, maxValue: 1, label: 'Genesungsw\'keit b', color: window.BLACK },
			{ value: 0.2, minValue: 0, maxValue: 1, label: 'Ausbruchsw\'keit c', color: window.BLACK }    
		]);
		self.simCellAutoSmall.moveDelay = 1000;
		self.simCellAutoSmall.collideDelay = 1000;
		self.simCellAutoSmall.infectDelay = 1000;
		self.simCellAutoSmall.stepDelay = 1;
		
		self.vCellAutoPlotSmall = new VSimPlot({
			title: 'Simulation',
			simulation: self.simCellAutoSmall,
			ticks: 5,
			tocks: 10,
			minValue: 0,
			maxValue: 1,
			plotColors: [window.RED, window.LIGHTRED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte ohne', 'mit Symptomen', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.LIGHTRED, window.YELLOW]
		});
		self.simCellAutoSmall.set('plot', self.vCellAutoPlotSmall.vPlot);

		self.vHexMap.listenTo(self.simCellAutoSmall, 'moved', function(simulation){
			self.vHexMap.update(simulation.cellData);
		});
		self.vHexMap.listenTo(self.simCellAutoSmall, 'collided', function(simulation){
			self.vHexMap.update(simulation.cellData);
		});
		self.vHexMap.listenTo(self.simCellAutoSmall, 'infected', function(simulation){
			self.vHexMap.update(simulation.cellData);
		});

		// big
		self.simCellAutoBig = new MCellAuto();
		self.simCellAutoBig.set('map', self.vHexMap);
		self.simCellAutoBig.set('simulationDuration', 100);
		self.simCellAutoBig.set('params', [
			{ value: 1000, minValue: 100, maxValue: 2000, label: 'Anzahl Zellen N', color: window.BLACK }, 
			{ value: 0.7, minValue: 0.1, maxValue: 1, label: 'Population P', color: window.BLACK }, 
			{ value: 0.1, minValue: 0, maxValue: 1, label: 'Infektionsw\'keit a', color: window.BLACK }, 
			{ value: 0.1, minValue: 0, maxValue: 1, label: 'Genesungsw\'keit b', color: window.BLACK },
			{ value: 0.1, minValue: 0, maxValue: 1, label: 'Ausbruchsw\'keit c', color: window.BLACK }    
		]);
		
		self.vCellAutoPlotBig = new VSimPlot({
			title: 'Simulation',
			simulation: self.simCellAutoBig,
			ticks: 5,
			tocks: 10,
			minValue: 0,
			maxValue: 1,
			plotColors: [window.RED, window.LIGHTRED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte ohne', 'mit Symptomen', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.LIGHTRED, window.YELLOW]
		});
		self.simCellAutoBig.set('plot', self.vCellAutoPlotBig.vPlot);

		self.vHexMap.listenTo(self.simCellAutoBig, 'simulationend', function(simulation){
			self.vHexMap.update(simulation.cellData);
		});

		// game
		self.vGameMap = new VGameMap({
			srcImgWidth: 526,
			srcImgHeight: 588,
			mapWidth: 685
		});

		self.simGame = new MGame();
		self.simGame.set('map', self.vGameMap);
		self.simGame.set('simulationDuration', 100);
		self.simGame.set('params', [
			{ value: 2000, minValue: 100, maxValue: 2000, label: 'Anzahl Zellen N', color: window.BLACK }, 
			{ value: 0.4, minValue: 0.1, maxValue: 0.5, label: 'Population P', color: window.BLACK }, 
			{ value: 0.3, minValue: 0, maxValue: 0.5, label: 'Infektionsw\'keit a', color: window.BLACK }, 
			{ value: 0.1, minValue: 0, maxValue: 0.5, label: 'Genesungsw\'keit b', color: window.BLACK },
			{ value: 0.2, minValue: 0, maxValue: 0.5, label: 'Ausbruchsw\'keit c', color: window.BLACK },
			{ value: 1, minValue: 0, maxValue: 2, label: 'Obergrenze', color: window.BLACK },
			{ value: 0.1, minValue: 0, maxValue: 2, label: 'Untergrenze', color: window.BLACK }    
		]);
		self.simGame.set('areaRefColors', [
			[1,0,0], // Stuttgart
			[0,1,0], // Tübingen
			[0,0,1], // Karlsruhe
			[1,0,1]  // Freiburg
		]);
		
		self.vGamePlot = new VSimPlot({
			title: 'Simulation',
			simulation: self.simGame,
			ticks: 5,
			tocks: 10,
			minValue: 0,
			maxValue: 1,
			plotColors: [window.RED, window.LIGHTRED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte ohne', 'mit Symptomen', 'Immune'],
			legendColors: [window.GREEN, window.RED, window.LIGHTRED, window.YELLOW]
		});
		self.simGame.set('plot', self.vGamePlot.vPlot);

		self.vAreaPlot = new VAreaPlot({
			simulation: self.simGame,
			vTotalPlot: self.vGamePlot,
			areaNames: ['Stuttgart', 'Tübingen', 'Karlsruhe', 'Freiburg']
		});

		var ticToc = 1;
		self.vGameMap.listenTo(self.simGame, 'simulationend', function(simulation){



			//console.log(ticToc);
			/*
			if (ticToc <= 40){
				if (ticToc%10 == 0){
					self.simGame.stop();
					self.simGame.closeArea((ticToc/10)-1);
					self.simGame.start();
				}
			}
			*/

			self.vGameMap.update(simulation.cellData);
			ticToc++;
		});

	},


	resize: function(){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

		console.log('resize to '+width+'/'+height);

		self.vRibbon.resize(height);
		self.vBackHandler.resize(width, height);
		self.vHexMap.resize(width,height);
	},

	render: function(inital){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

		//self.vHexMap.render(30, 40, width, height);
	},


	linkClick: function(e){
		var self = this;

        var $a = $(e.currentTarget);

        if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
        }

        var url = $a.attr('href');	

        window.app.showLoading();
        window.app.router.navigate(url, true);
	},

	showLoading: function(){
		var self = this;
		$('#loading-overlay').stop().fadeIn(500);
	},

	hideLoading: function(){
		var self = this;
		$('#loading-overlay').stop().fadeOut(500);
	}


});