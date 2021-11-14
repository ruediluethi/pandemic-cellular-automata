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
var VSimPlot = require('./views/graphics/simplot');

module.exports = Backbone.View.extend({

	className: 'app',

	router: undef,

	vRibbon: undef,
	vBackHandler: undef,

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
		self.$el.append(self.vRibbon.render('content_FEM').$el);

		self.initDiagrams();
		self.resize();

		var $footerBackground = $('<img src="imgs/cse_studenten.jpg">');
		var $dummySimBack = $('<img src="imgs/bruecke.png">');
		$dummySimBack.css({
			width: 685,
			height: 'auto',
			position: 'absolute',
			top: 70,
			left: '50%',
			marginLeft: -175
		});

		if (window.isMobile){
			self.vRibbon.$el.find('.scroll-element').each(function(){
				var $anchor = $(this);
				var anchorId = $anchor.data('anchor');
				var $content = $anchor.find('.scroll-element-content').first();
				
				if (anchorId == ''){
					//
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

				if (anchorId == ''){
					//
				}else{
					//
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
				//self.vBackHandler.showBackground(self.vHexMap.$el, false);

			}else{
				//
			}


			if (anchorId == 'home' || 
				anchorId == 'intro'){
				if (!onIntroScreen){
					onIntroScreen = true;
					//self.vBackHandler.appendDiagram('right', );
				}
				self.vBackHandler.$el.find('.scroll-col.left').addClass('hidden');
				self.vBackHandler.$el.find('.scroll-col.center').addClass('hidden');
			}else{
				onIntroScreen = false;
				self.vBackHandler.$el.find('.scroll-col.left').removeClass('hidden');
				self.vBackHandler.$el.find('.scroll-col.center').removeClass('hidden');
			}

			if (anchorId == 'footer'){

			}else{
				self.vBackHandler.$el.css({
					top: 0
				});
			}



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
				self.vBackHandler.showBackground($dummySimBack, true);
				self.vBackHandler.appendContent('center', $(''));
				self.vBackHandler.appendDiagram('left', self.vSimBridge);
				self.vRibbon.setMenuActive('engineering');
			}else{
				self.vBackHandler.removeBackground(false);
			}

			if (anchorId == 'balance'){
				self.vBackHandler.appendContent('center', $(''));
				self.vRibbon.setMenuActive('engineering');
			}

			if (anchorId == 'LGS'){
				self.vBackHandler.appendContent('center', $(''));
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'implementation'){
				self.vBackHandler.appendContent('center', $(''));
				self.vRibbon.setMenuActive('computer-science');
			}

			anchorBefore = anchorId;

		});

		self.vRibbon.bind('onScroll', function($anchor, scrollPos){
			var anchorId = $anchor.data('anchor');

			if (window.isMobile){ return; }

			if (anchorId == 'footer'){

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

	},

	initDiagrams: function(){
		var self = this;

		// SIR simulation
		var simDummy = new MSim();
		simDummy.set('simulationDuration', 1);
		simDummy.set('initValues', [0, 0]);
		simDummy.set('params', [
			{ value: 787, minValue: 1, maxValue: 1000, label: 'Gesamtgewicht in t', color: window.BLACK },
			{ value: 12, minValue: 1, maxValue: 20, label: 'Anzahl Wagen', color: window.BLACK },
			{ value: 7.86, minValue: 1, maxValue: 10, label: 'Dichte Stahl in 10<sup>-6</sup>kg/mm<sup>2</sup>', color: window.BLACK },
			{ value: 210, minValue: 1, maxValue: 300, label: 'E-Modul in kN/mm<sup>2</sup>', color: window.BLACK },
			{ value: 100*100, minValue: 1, maxValue: 100*100, label: 'Querschnittsfläche mm<sup>2</sup>', color: window.BLACK },
		]);
		simDummy.set('diffeqs', [
			function(crntValues, params, t){
				//return Math.random() + Math.sin(t/100*Math.PI*2)+1;
				return 0;

			}, function(crntValues, params, t){
				//return Math.random() + Math.cos(t/100*Math.PI*2)+1;
				return 0;
			}
		]);

		self.vSimBridge = new VSimPlot({
			title: 'Simulation',
			simulation: simDummy,
			ticks: 5,
			tocks: 10,
			minValue: 0,
			maxValue: 3,
			plotColors: [window.ORANGE, window.BLUE],
			plotStrokes: [1,1],
			plotAlphas:  [1,1],
			resetAt: 1,
			legend: ['Maximale Spannung', 'Maximale Dehnung'],
			legendColors: [window.ORANGE, window.BLUE],
			showControls: false
		});
	},

	resize: function(){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

		console.log('resize to '+width+'/'+height);

		self.vRibbon.resize(height);
		self.vBackHandler.resize(width, height);
		
	},

	render: function(inital){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

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