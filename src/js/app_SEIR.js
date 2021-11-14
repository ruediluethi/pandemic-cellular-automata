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
	vSmallHexMap: undef,

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


	initRouter: function(startHistory){
		var self = this;

		// init the router and push states
	    self.router = new Router({
	    	app: self
	    });

	    // because of IE9 stupidity
	    if (!window.location.origin) {
			window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
		}

		if (startHistory){
		    // start backbone history
		    Backbone.history.start({
		    	pushState: Modernizr.history,
		    	root: window.base.replace(window.location.origin, '')
		    });
		}

	},


	showRoot: function(){
		var self = this;

		self.$el.html(templates['app']({ }));

		self.vBackHandler = new VBackgroundHandler();
		self.$el.append(self.vBackHandler.render().$el);

		self.vRibbon = new VRibbon();
		self.$el.append(self.vRibbon.render('content_SEIR').$el);

		self.initDiagrams();
		self.resize();

		var $footerBackground = $('<img src="imgs/cse_studenten.jpg">');

		if (window.isMobile){
			self.vRibbon.$el.find('.scroll-element').each(function(){
				var $anchor = $(this);
				var anchorId = $anchor.data('anchor');
				var $content = $anchor.find('.scroll-element-content').first();
				
				if (anchorId == 'SIR'){
					$content.addClass('no-margin');
					$content.after(self.vSIRplot.$el);
					self.vSIRplot.render();
				}

				if (anchorId == 'R0'){
					$content.addClass('no-margin');
					$content.after(self.vSIR2plot.$el);
					self.vSIR2plot.render();
				}

				if (anchorId == 'SEIR'){
					$content.addClass('no-margin');
					$content.after(self.vSEIRplot.$el);
					self.vSEIRplot.render();
				}

				if (anchorId == 'calc-random'){
					$content.addClass('no-margin');
					$content.after(self.vRandomSEIRplot.$el);
					self.vRandomSEIRplot.render();
				}

				if (anchorId == 'simulation'){
					$content.addClass('no-margin');
					$content = $anchor.find('.scroll-element-content.has-hidden-content').first();
					$content.addClass('no-margin');
					$content.after(self.vAreaPlot.$el);
					self.vAreaPlot.render();
				}

				if (anchorId == 'cell-auto'){
					$content.addClass('no-margin');
					$content.after(self.vCellAutoPlotSmall.$el);
					self.vCellAutoPlotSmall.render();
				}

				if (anchorId == 'implementation'){
					$content.addClass('no-margin');
					$content.after(self.vCellAutoPlotBig.$el);
					self.vCellAutoPlotBig.render();
				}

			});
		}

		// show content on anchor position
		var anchorBefore = undef;
		var onIntroScreen = false;
		self.vRibbon.bind('onScrollAnchor', function($anchor, scrollPos){
			var anchorId = $anchor.data('anchor');

			console.log(anchorId);

			if (window.isMobile){

				var doRemoveBack = true;

				if (anchorId == 'simulation'){
					self.vBackHandler.showBackground(self.vGameMap.$el, false);
					self.simGame.simulate();
					doRemoveBack = false;
				}else{
					self.simGame.stop();
				}

				if (anchorId == 'cell-auto'){

					self.vBackHandler.showBackground(self.vSmallHexMap.$el, false);
					self.simCellAutoSmall.simulate();
					doRemoveBack = false;
				}else{
					self.simCellAutoSmall.stop();
				}

				if (anchorId == 'implementation' || 
					anchorId == 'intro'){

					self.vBackHandler.showBackground(self.vHexMap.$el, false);
					self.simCellAutoBig.simulate();
					doRemoveBack = false;
				}else{
					self.simCellAutoBig.stop();
				}

				if (doRemoveBack){
					self.vBackHandler.removeBackground(false);
				}

				return;
			}

			self.vRibbon.setNoMenuActive();

			if (anchorId == 'home' || 
				anchorId == 'intro' ||
				anchorId == 'footer'){
				self.simCellAutoBig.set('map', self.vHexMap);
				self.vBackHandler.showBackground(self.vHexMap.$el, false);

			}else if (anchorId == 'implementation'){
				self.simCellAutoBig.set('map', self.vSmallHexMap);
				self.vBackHandler.showBackground(self.vSmallHexMap.$el, false);
				self.vBackHandler.appendDiagram('right', self.vCellAutoPlotBig);
				self.vRibbon.setMenuActive('computer-science');

			}else{
				self.simCellAutoBig.stop();
			}


			if (anchorId == 'home' || 
				anchorId == 'intro'){

				if (!onIntroScreen){
					onIntroScreen = true;
					self.vBackHandler.appendDiagram('right', self.vCellAutoPlotBig);
				}
				self.vBackHandler.$el.find('.scroll-col.left').addClass('hidden');
				self.vBackHandler.$el.find('.scroll-col.center').addClass('hidden');
			}else{
				onIntroScreen = false;
				self.vBackHandler.$el.find('.scroll-col.left').removeClass('hidden');
				self.vBackHandler.$el.find('.scroll-col.center').removeClass('hidden');
			}

			if (anchorId == 'footer'){
				self.simCellAutoBig.stop();
				self.vBackHandler.appendContent('center', $(''));
			}else{
				self.vBackHandler.$el.css({
					top: 0
				});
			}

			/*
			if (anchorId == 'footer' ||
				anchorId == 'mathematics' || 
				anchorId == 'computer-science' || 
				anchorId == 'engineering' ||
				anchorId == 'intro-end'){
				self.vRibbon.$el.find('.footer .headline').show();
			}else{
				self.vRibbon.$el.find('.footer .headline').hide();
			}
			*/


			if (anchorId == 'mathematics' || 
				anchorId == 'computer-science' || 
				anchorId == 'engineering' ||
				anchorId == 'intro-end'){
				self.vBackHandler.appendContent('center', $(''));
				self.vBackHandler.removeBackground(false);
			}

			if (anchorId == 'mathematics' || 
				anchorId == 'computer-science' ||
				anchorId == 'intro-end'){
				self.vRibbon.$el.find('.engineering-anchor.hanged').addClass('fixed');
			}else{
				self.vRibbon.$el.find('.engineering-anchor.hanged').removeClass('fixed');
			}
			if (anchorId == 'computer-science' ||
				anchorId == 'intro-end'){
				self.vRibbon.$el.find('.mathematics-anchor.hanged').addClass('fixed');
			}else{
				self.vRibbon.$el.find('.mathematics-anchor.hanged').removeClass('fixed');
			}
			if (anchorId == 'intro-end'){
				self.vRibbon.$el.find('.computer-science-anchor.hanged').addClass('fixed');
			}else{
				self.vRibbon.$el.find('.computer-science-anchor.hanged').removeClass('fixed');
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
				self.vBackHandler.showBackground(self.vSmallHexMap.$el, false);
				self.vBackHandler.appendDiagram('right', self.vCellAutoPlotSmall);
				self.vRibbon.setMenuActive('computer-science');

			}else{
				self.simCellAutoSmall.stop();
			}

			// implementation (see above...)

			if (anchorId == 'the-end'){
				self.vBackHandler.removeBackground(true);
				//self.vBackHandler.showBackground($footerBackground, true);
				self.vBackHandler.appendContent('center', $(''));
			}
			
			anchorBefore = anchorId;
		});

		self.vRibbon.bind('onScroll', function($anchor, scrollPos){
			var anchorId = $anchor.data('anchor');

			if (window.isMobile){ return; }

			if (anchorId == 'footer'){
				//console.log(anchorId+': '+scrollPos);

				self.vBackHandler.$el.css({
					top: 'auto',
					bottom: scrollPos
				});
			}

			if (anchorId == 'intro-end'){
				self.vRibbon.$el.find('.scroll-element.hanged.fixed').css({
					top: -scrollPos
				});
				self.vRibbon.$el.find('.footer .headline').css({
					top: -scrollPos
				});
			}else{
				self.vRibbon.$el.find('.scroll-element.hanged.fixed').css({
					top: 0
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
			legendColors: [window.GREEN, window.RED, window.YELLOW],
			showControls: false
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
			legendColors: [window.GREEN, window.RED, window.YELLOW],
			showControls: false
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
			legendColors: [window.GREEN, window.LIGHTRED, window.RED, window.YELLOW],
			showControls: false
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
			legendColors: [window.GREEN, window.LIGHTRED, window.RED, window.YELLOW],
			showControls: false,
			caption: 'Die weiße Linie zeigt das Resultat aus dem Zufallsautomaten.'
		});


		// cell auto simulation
		self.vHexMap = new VHexMap();
		self.vSmallHexMap = new VHexMap();

		// small
		self.simCellAutoSmall = new MCellAuto();
		self.simCellAutoSmall.set('map', self.vSmallHexMap);
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
			legendColors: [window.GREEN, window.LIGHTRED, window.RED, window.YELLOW]
		});
		self.simCellAutoSmall.set('plot', self.vCellAutoPlotSmall.vPlot);

		self.vSmallHexMap.listenTo(self.simCellAutoSmall, 'moved', function(simulation){
			self.vSmallHexMap.update(simulation.cellData);
		});
		self.vSmallHexMap.listenTo(self.simCellAutoSmall, 'collided', function(simulation){
			self.vSmallHexMap.update(simulation.cellData);
		});
		self.vSmallHexMap.listenTo(self.simCellAutoSmall, 'infected', function(simulation){
			self.vSmallHexMap.update(simulation.cellData);
		});

		// big
		self.simCellAutoBig = new MCellAuto();
		self.simCellAutoBig.set('map', self.vHexMap);
		self.simCellAutoBig.set('simulationDuration', 100);
		self.simCellAutoBig.set('params', [
			{ value: 1000, minValue: 100, maxValue: 1000, label: 'Anzahl Zellen N', color: window.BLACK }, 
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
			legendColors: [window.GREEN, window.LIGHTRED, window.RED, window.YELLOW]
		});
		self.simCellAutoBig.set('plot', self.vCellAutoPlotBig.vPlot);

		self.vHexMap.listenTo(self.simCellAutoBig, 'simulationend', function(simulation){
			self.vHexMap.update(simulation.cellData);
		});

		self.vSmallHexMap.listenTo(self.simCellAutoBig, 'simulationend', function(simulation){
			self.vSmallHexMap.update(simulation.cellData);
		});

		// game
		self.vGameMap = new VGameMap({


			/*srcImgUrl: 'imgs/baden-wuerttemberg.png',
			srcImgWidth: 526,
			srcImgHeight: 588,*/

			srcImgUrl: 'imgs/baden-wuerttemberg_exakt.png',
			srcImgWidth: 588,
			srcImgHeight: 588,

			//srcImgUrl: 'imgs/ulm_neu-ulm.png',
			//srcImgWidth: 1885,
			//srcImgHeight: 1779,
			
			mapWidth: 685
		});

		/*
		Fläche: 35.751,46 km²
		Einwohner: 11.100.394 (31. Dezember 2019)[1]
		Dichte: 310 Einwohner pro km²
		Intensivbetten: 3420 (Quelle: https://interaktiv.morgenpost.de/corona-deutschland-intensiv-betten-monitor-krankenhaus-auslastung/)
		*/

		self.simGame = new MGame();
		self.simGame.set('map', self.vGameMap);
		self.simGame.set('simulationDuration', 100);
		self.simGame.set('params', [
			//{ value: 2000, minValue: 100, maxValue: 2000, label: 'Anzahl Zellen N', color: window.BLACK }, 
			//{ value: 0.4, minValue: 0.1, maxValue: 0.5, label: 'Population P', color: window.BLACK }, 
			//{ value: 0.3, minValue: 0, maxValue: 0.5, label: 'Infektionsw\'keit a', color: window.BLACK }, 
			//{ value: 0.1, minValue: 0, maxValue: 0.5, label: 'Genesungsw\'keit b', color: window.BLACK },
			//{ value: 0.2, minValue: 0, maxValue: 0.5, label: 'Ausbruchsw\'keit c', color: window.BLACK },

			{ value: 3, minValue: 1, maxValue: 10, label: 'Basisreproduktionszahl R<sub>0</sub>', color: window.BLACK }, 
			{ value: 5, minValue: 1, maxValue: 10, label: 'Inkubationszeit', color: window.BLACK },  
			{ value: 10, minValue: 1, maxValue: 10, label: 'Genesungsdauer', color: window.BLACK },
			 

			{ value: 1.5, minValue: 0, maxValue: 3, label: 'Obergrenze', color: window.BLACK },
			{ value: 0.5, minValue: 0, maxValue: 3, label: 'Untergrenze', color: window.BLACK }
		]);
		self.simGame.set('areaRefColors', [
			[1,0,0], // Stuttgart / Ulm
			[0,1,0], // Tübingen / Neu Ulm
			[0,0,1], // Karlsruhe
			[1,0,1]  // Freiburg
		]);
		//self.simGame.stepDelay = 1000;
		
		self.vGamePlot = new VSimPlot({
			title: 'Simulation',
			simulation: self.simGame,
			ticks: 5,
			tocks: 10,
			minValue: 0,
			maxValue: 1,
			plotColors: [window.RED, window.LIGHTRED, window.YELLOW, window.GREEN],
			legend: ['Gesunde', 'Infizierte ohne', 'mit Symptomen', 'Immune'],
			legendColors: [window.GREEN, window.LIGHTRED, window.RED, window.YELLOW],
			heightScale: 0.3
		});
		self.simGame.set('plot', self.vGamePlot.vPlot);

		self.vAreaPlot = new VAreaPlot({
			simulation: self.simGame,
			vTotalPlot: self.vGamePlot,
			areaNames: ['Stuttgart', 'Tübingen', 'Karlsruhe', 'Freiburg']
			//areaNames: ['Ulm', 'Neu-Ulm']
		});

		self.vGameMap.listenTo(self.simGame, 'simulationend', function(simulation){
			self.vGameMap.update(simulation.cellData, simulation.cells);

			// used for image export
			/*$.ajax({
				type: 'POST',
				url: 'http://localhost:3000/save',
				data: {
					count: simulation.timeline.length,
					image: self.vGameMap.$canvas[0].toDataURL()
				},
				success: function( data, textStatus, jqXHR ){
					
				}
			});*/
		});

	},


	resize: function(){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

		// used for video export
		// var width = 1024;
		// var height = 1024;

		console.log('resize to '+width+'/'+height);

		self.vRibbon.resize(height);
		self.vBackHandler.resize(width, height);

		self.vHexMap.resize(width,height);
		

		if (window.isMobile){
			self.vSmallHexMap.resize(width,height);
			self.vGameMap.resize(width, width * self.vGameMap.srcImgHeight/self.vGameMap.srcImgWidth);
		}else{
			self.vSmallHexMap.resize(685,height);
			self.vSmallHexMap.$el.addClass('gamemap');
		}

		self.vGameMap.containerHeight = height;
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