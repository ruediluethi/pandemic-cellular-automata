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
var VHexMap = require('./views/graphics/hexmap');

module.exports = Backbone.View.extend({

	className: 'app',

	router: undef,

	vRibbon: undef,
	vBackHandler: undef,
	vHexMap: undef,

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

		//self.vHexMap = new VHexMap();
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
		self.vRibbon.bind('onScrollAnchor', function($anchor, scrollPos){
			var anchorId = $anchor.data('anchor');
			//console.log(anchorId);

			self.vRibbon.setNoMenuActive();

			if (anchorId == 'home' || 
				anchorId == 'intro' ||
				anchorId == 'mathematics' || 
				anchorId == 'computer-science' || 
				anchorId == 'engineering' ||
				anchorId == 'footer' ){
				self.vBackHandler.showBackground($homeBack, false);
			}

			if (anchorId == 'home' || 
				anchorId == 'intro' ||
				anchorId == 'mathematics' || 
				anchorId == 'computer-science' || 
				anchorId == 'engineering'){
				self.vBackHandler.appendContent('right', $homeDiagram);
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
				self.vBackHandler.showBackground($simulationBack, false);
				self.vBackHandler.appendContent('left', $simulationDiagram);
				self.vRibbon.setMenuActive('engineering');
			}

			if (anchorId == 'SIR'){
				self.vBackHandler.removeBackground(false);
				self.vBackHandler.appendContent('center', $sirDiagram);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'R0'){
				self.vBackHandler.removeBackground(false);
				self.vBackHandler.appendContent('center', $sirR0Diagram);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'calc-random'){
				self.vBackHandler.removeBackground(true);
				self.vBackHandler.appendContent('center', $randomautoDiagram);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'SEIR'){
				self.vBackHandler.appendContent('center', $seirDiagram);
				self.vRibbon.setMenuActive('mathematics');
			}

			if (anchorId == 'cell-auto'){
				self.vBackHandler.showBackground($cellAutoBack, true);
				self.vBackHandler.appendContent('right', $cellautoDiagram);
				self.vRibbon.setMenuActive('computer-science');
			}
			if (anchorId == 'implementation'){
				self.vBackHandler.showBackground($cellAutoBack, true);
				self.vBackHandler.appendContent('right', $cellautoDiagram);
				self.vRibbon.setMenuActive('computer-science');
			}

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

		self.resize();
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


	resize: function(){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

		self.vRibbon.resize(height);
		self.vBackHandler.resize(width, height);
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