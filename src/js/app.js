var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

require('browsernizr/test/history');
var Modernizr = require('browsernizr');

var d3 = require('d3-browserify'); // ~150KB !!

var Router = require('./router');

var VRibbon = require('./views/scrollribbon');

var MSim = require('./models/sim.js');
var VSimPlot = require('./views/graphics/simplot');
var VCellAuto = require('./views/graphics/cellauto');
var VSimCellAutoPlot = require('./views/graphics/simcellautoplot');
//var VDataPlot = require('./views/graphics/dataplot');

module.exports = Backbone.View.extend({

	className: 'app',

	router: undef,

	vRibbon: undef,

	vSirPlot: undef,
	vSirEqCAPlot: undef,
	vSimpleCellAuto: undef,
	vBigCellAuto: undef,
	vInfluenzaPlot: undef,
	vTitleCA: undef,

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

		self.vRibbon = new VRibbon({
			paddingTop: 24,
			height: $(window).height(),
			navElementHeight: 35
		});
		self.$el.append(self.vRibbon.render('content').$el);

		self.initBackDiagrams();
		
		// fade the headline with scroll position out
		self.vRibbon.bind('onUpdateMiddlePos', function($anchor, $nav, normPos){
			if ($anchor.data('anchor') == 'headline'){
				$nav.css({
					marginTop: -40 + (1-normPos)*30
				});
			}
		});

		// show content on anchor position
		self.vRibbon.bind('onScrollAnchor', function($anchor){
			//console.log($anchor.data('anchor'));

			self.vTitleCA.hide();
			self.vTitleCA.$el.stop().fadeOut(500);

			self.vSirPlot.hide();
			self.vSimpleCellAuto.showPlot = false;
			self.vSimpleCellAuto.showMovement = false;
			self.vSimpleCellAuto.showCollision = false;
			self.vSimpleCellAuto.showInfection = false;
			self.vSimpleCellAuto.stopMovement();
			self.vSimpleCellAuto.hide();

			self.vSirEqCAPlot.hide();	
			self.vBigCellAuto.hide();

			self.vEnhCellAuto.hide();
			self.vSimpleCellAuto.hide();

			if ($anchor.data('anchor') == 'headline'){
				self.vTitleCA.$el.stop().fadeIn(500);
				self.vTitleCA.reset(self.vTitleCA);

			}else if($anchor.data('anchor') == 'start'){
				self.vTitleCA.$el.stop().fadeIn(500);
				self.vTitleCA.startMovement(1000);

			}else if ($anchor.data('anchor') == 'diffeq'){
				self.vSirPlot.show();

			}else if ($anchor.data('anchor') == 'cellauto-env'){
				self.vSimpleCellAuto.showPlot = false;
				self.vSimpleCellAuto.showMovement = true;
				self.vSimpleCellAuto.show();
				self.vSimpleCellAuto.initEmptyEnv(5,5);
				self.vSimpleCellAuto.initIndividuals(0,0,0);

			}else if ($anchor.data('anchor') == 'cellauto-inviduals'){
				self.vSimpleCellAuto.showPlot = false;
				self.vSimpleCellAuto.showMovement = true;
				self.vSimpleCellAuto.showCollision = true;
				self.vSimpleCellAuto.show();
				self.vSimpleCellAuto.alpha = 0;
				self.vSimpleCellAuto.beta = 0;
				self.vSimpleCellAuto.initEmptyEnv(5,5);
				self.vSimpleCellAuto.initIndividuals(3,3,3);
				self.vSimpleCellAuto.startMovement(1000);

			}else if ($anchor.data('anchor') == 'cellauto-sim'){
				self.vSimpleCellAuto.showPlot = true;
				self.vSimpleCellAuto.showInfection = true;
				self.vSimpleCellAuto.show();
				self.vSimpleCellAuto.alpha = 0.5;
				self.vSimpleCellAuto.beta = 0.1;
				self.vSimpleCellAuto.initEmptyEnv(30,30);
				self.vSimpleCellAuto.initIndividuals(1995,5,0);	
				self.vSimpleCellAuto.startMovement(200);

			}else if ($anchor.data('anchor') == 'cellauto-big'){

				//self.vBigCellAuto.show();	
				self.vBigCellAuto.startMovement(1);		
				self.vSirEqCAPlot.show();

			}else if ($anchor.data('anchor') == 'intervention'){

				self.vEnhCellAuto.show();

				self.vEnhCellAuto.reset = function(self){
					self.stopMovement();

					self.doVacc = true;
					self.initEmptyEnv(30,30);
					self.initIndividuals(1995,0,0);

					self.initIndividualsInRange(15,15,3,5,2);
					self.simDuration = 50;
					self.startMovement(200);

				};

				self.vEnhCellAuto.reset(self.vEnhCellAuto);	

			}else if ($anchor.data('anchor') == 'intervention-obstacles'){

				self.vEnhCellAuto.show();

				self.vEnhCellAuto.reset = function(self){
					self.stopMovement();
					self.doVacc = false;
					self.initEmptyEnv(30,30);
					self.initIndividuals(1995,0,0);
					self.initIndividualsInRange(3,3,2,5,2);
					self.simDuration = 100;

					self.paintBorder();
					self.paintLine(6,0,23,5);
					self.paintLine(12,6,23,5);
					self.paintLine(18,0,23,5);
					self.paintLine(24,6,23,5);

					self.startMovement(200);
				};

				self.vEnhCellAuto.reset(self.vEnhCellAuto);	

			}else if ($anchor.data('anchor') == 'intervention-passage'){

				self.vEnhCellAuto.show();

				self.vEnhCellAuto.reset = function(self){
					self.stopMovement();

					self.doVacc = false;
					self.initEmptyEnv(30,30);
					self.initIndividuals(1995,0,0);
					self.initIndividualsInRange(15,15,3,5,2);
					self.simDuration = 100;

					self.paintLine(0,0,6,0);
					self.paintLine(8,4,15,0);
					self.paintLine(24,12,6,0);

					self.paintLine(0,15,6,0);
					self.paintLine(8,15+4,14,0);
					self.paintLine(24,15+12,6,0);

					self.paintLine(29,0,60,4);

					self.startMovement(200);
				};

				self.vEnhCellAuto.reset(self.vEnhCellAuto);

			}else{

			}


		});
					
		self.vRibbon.$el.animate({
			opacity: 1
		}, 500);


		$(window).resize(function(){
			clearTimeout(self.resizeTimeout);
			self.resizeTimeout = setTimeout(function(){
				self.resize();
				self.render(false);
			}, 1000);
		});

		self.resize();
		self.render(true);
		self.vRibbon.initScrollHandler();


		//self.vInfluenzaPlot.loadData(function(){
			self.hideLoading();
		//});

	},


	initBackDiagrams: function(){
		var self = this;

		// simulation as title
		self.vTitleCA = new VCellAuto({
			template: 'cellauto',
			maxValue: 2000
		});
		self.$el.find('#infographic').before(self.vTitleCA.$el);
		self.vTitleCA.$el.addClass('cover');
		var width = $(window).width();
		var height = $(window).height();
		var aspectRatio = width/height;
		//var aspectRatio = 1; // otherwise it does not work??? loss of individuals...
		//console.log(aspectRatio);
		// w*h = P =(w=h*r)=> (h*r)*h = P ==> h^2 = P/r
		var P = 700;
		var envHeight = Math.sqrt(P)/aspectRatio;
		var envWidth = envHeight*aspectRatio;
		envHeight = Math.round(envHeight);
		envWidth = Math.round(envWidth);
		var cellWidth = width / envWidth;
		self.vTitleCA.render(width+cellWidth, height);
		self.vTitleCA.$el.css({
			marginLeft: -cellWidth*0.5,
			marginTop: -cellWidth*0.7
		});
		//self.vTitleCA.$el.find('.plot-container').remove();
		self.vTitleCA.$el.append(self.vTitleCA.$el.find('.cellenv-container svg'));
		self.vTitleCA.$el.find('div').remove();
		self.vTitleCA.showPlot = true;
		self.vTitleCA.showInfection = true;
		self.vTitleCA.alpha = 0.5;
		self.vTitleCA.beta = 0.1;

		self.vTitleCA.reset = function(self){
			self.stopMovement();
			

			self.initEmptyEnv(envWidth-1,envHeight+1);
			self.initIndividuals(P*2,5,0);	
			self.simDuration = 8;

			//self.paintRandomLine(30);
			/*
			self.paintCircle(
				Math.round(Math.random()*envWidth),
				Math.round(Math.random()*envHeight),
				Math.round(envWidth/3)
			);
			*/

			self.startMovement(1000);
		};

		
		self.vTitleCA.hide();



		// SIR model simulation
		var sirSim = new MSim();
		sirSim.set('simulationDuration', 50);
		sirSim.set('initValues', [1, 0.9, 0.1, 0]);
		sirSim.set('params', [
			{ value: 0.5, minValue: 0, maxValue: 1, label: 'Infektionsrate &gamma;', color: window.BLACK }, // gamma
			{ value: 0.1, minValue: 0, maxValue: 1, label: 'Genesungsrate &delta;', color: window.BLACK }      // delta
		]);
		sirSim.set('diffeqs', [
			function(crntValues, params, t){
				// correction because of cancellation
				var err = 1 - crntValues[1] - crntValues[2] - crntValues[3];
				crntValues[1] = crntValues[1] + err/3;
				crntValues[2] = crntValues[2] + err/3;
				crntValues[3] = crntValues[3] + err/3;
				// total population
				return crntValues[1] + crntValues[2] + crntValues[3];
			},
			function(crntValues, params){
				// S_k+1 = S_k - gamma * S_k * I_k
				return crntValues[1] - params[0].value*crntValues[1]*crntValues[2];
			}, function(crntValues, params, t){
				// I_k+1 = I_k + gamma * S_k * I_k - delta * I_k
				return crntValues[2] + params[0].value*crntValues[1]*crntValues[2] - params[1].value*crntValues[2];
			}, function(crntValues, params, t){
				// R_k+1 = R_k + delta * I_k
				return crntValues[3] + params[1].value*crntValues[2];
			}
		]);

		self.vSirPlot = new VSimPlot({
			simulation: sirSim,
			plotColors: [window.PURPLE, window.GREEN, window.RED, window.YELLOW]
		});
		self.$el.find('#infographic').append(self.vSirPlot.$el);
		self.vSirPlot.render();
		self.vSirPlot.vPlot.addLegend(1, 'Gesunde');
		self.vSirPlot.vPlot.addLegend(2, 'Infizierte');
		self.vSirPlot.vPlot.addLegend(3, 'Immune');
		self.vSirPlot.vPlot.addLegend(0, 'Total');
		self.vSirPlot.hide();

		
		// first simple cellular automata implementation
		self.vSimpleCellAuto = new VCellAuto({
			template: 'cellauto',
			maxValue: 2000,
		});
		self.$el.find('#infographic').append(self.vSimpleCellAuto.$el);
		self.vSimpleCellAuto.render();
		self.vSimpleCellAuto.hide();

		// big cellular automata
		self.vBigCellAuto = new VCellAuto({
			template: 'cellautobig'
		});
		self.$el.find('#infographic').append(self.vBigCellAuto.$el);
		self.vBigCellAuto.render();
		self.vBigCellAuto.showPlot = true;
		self.vBigCellAuto.initEmptyEnv(200,200);
		self.vBigCellAuto.initIndividuals(99000,1000,0);
		self.vBigCellAuto.simDuration = 300;
		self.vBigCellAuto.alpha = 0.5;
		self.vBigCellAuto.beta = 0.1;
		self.vBigCellAuto.vPlot.render();
		self.vBigCellAuto.updatePlot();
		self.vBigCellAuto.hide();

		// SIR simulation equals to cellular automata
		var sirSimEqCA = new MSim();
		sirSimEqCA.set('simulationDuration', 300);
		sirSimEqCA.set('initValues', [100000, 90000, 10000, 0]);
		sirSimEqCA.set('params', [
			{ value: 0.05, minValue: 0, maxValue: 0.1, label: 'Infektionswahrscheinlichkeit &alpha;', color: window.BLACK },
			{ value: 0.01, minValue: 0, maxValue: 0.1, label: 'Genesungswahrscheinlichkeit &beta;', color: window.BLACK },
			{ value: 200*200, minValue: 20000, maxValue: 300*300, label: 'Anzahl Zellen N', color: window.BLACK },
			{ value: 10000, minValue: 0, maxValue: 50000, label: 'Infizierte zu Begin I<sub>0</sub>', color: window.BLACK },
		]);
		sirSimEqCA.set('diffeqs', [
			function(crntValues, params, t){
				// correction because of cancellation
				var err = 100000 - crntValues[1] - crntValues[2] - crntValues[3];
				crntValues[1] = crntValues[1] + err/3;
				crntValues[2] = crntValues[2] + err/3;
				crntValues[3] = crntValues[3] + err/3;
				// total population
				return crntValues[1] + crntValues[2] + crntValues[3];
			},
			function(crntValues, params){
				// S_k+1 = S_k - S_k * (1 - (1 - alpha)^(I_k/N))
				return crntValues[1] - crntValues[1]*(1 - Math.pow(1 - params[0].value, crntValues[2] / params[2].value));
			}, function(crntValues, params, t){
				// I_k+1 = I_k + S_k * (1 - (1 - alpha)^(I_k/N)) - beta * I_k
				return crntValues[2] + crntValues[1]*(1 - Math.pow(1 - params[0].value, crntValues[2] / params[2].value)) - params[1].value*crntValues[2];
			}, function(crntValues, params, t){
				// R_k+1 = R_k + beta * I_k
				return crntValues[3] + params[1].value*crntValues[2];
			}
		]);

		self.vSirEqCAPlot = new VSimCellAutoPlot({
			simulation: sirSimEqCA,
			plotColors: [window.PURPLE, window.GREEN, window.RED, window.YELLOW]
		});
		self.vSirEqCAPlot.reactionTime = 1000;
		self.vSirEqCAPlot.plotMax = 100000;
		self.vSirEqCAPlot.cellAuto = self.vBigCellAuto;
		self.$el.find('#infographic').append(self.vSirEqCAPlot.$el);
		self.vSirEqCAPlot.render();
		self.vSirEqCAPlot.vPlot.addLegend(4, 'Gesunde im Automat');
		self.vSirEqCAPlot.vPlot.addLegend(1, 'Gesunde im SIR-Modell');

		self.vSirEqCAPlot.vPlot.addLegend(5, 'Infizierte im Automat');
		self.vSirEqCAPlot.vPlot.addLegend(2, 'Infizierte im SIR-Modell');

		self.vSirEqCAPlot.vPlot.addLegend(6, 'Immune im Automat');
		self.vSirEqCAPlot.vPlot.addLegend(3, 'Immune im SIR-Modell');
		
		self.vSirEqCAPlot.hide();


		// enhanced cellular automata

		var compareCA = new VCellAuto({
			template: 'cellauto'
		});
		compareCA.render();
		compareCA.showPlot = false;
		compareCA.showMovement = false;
		compareCA.showCollision = false;
		compareCA.showInfection = false;


		self.vEnhCellAuto = new VCellAuto({
			template: 'cellautoenh',
			compareCA: compareCA,
			maxValue: 2000,
		});
		self.$el.find('#infographic').append(self.vEnhCellAuto.$el);
		self.vEnhCellAuto.showParams = true;
		self.vEnhCellAuto.render();
		self.vEnhCellAuto.showPlot = true;
		self.vEnhCellAuto.showMovement = false;
		self.vEnhCellAuto.showCollision = false;
		self.vEnhCellAuto.showInfection = true;
		self.vEnhCellAuto.hide();


	},

	resize: function(){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

        self.vRibbon.resize(height);
	},

	render: function(inital){
		var self = this;

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