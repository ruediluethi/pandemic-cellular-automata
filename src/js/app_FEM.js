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
var MFem = require('./models/fem.js');
var MRailroad = require('./models/railroad.js');
var VSimPlot = require('./views/graphics/simplot');
var VTrussMap = require('./views/graphics/trussmap');

module.exports = Backbone.View.extend({

	className: 'app',

	router: undef,

	vRibbon: undef,
	vBackHandler: undef,

	vSimExample: undef,
	vMapExample: undef,

	vSimBridge: undef,
	vMapBridge: undef,
	femBridge: undef,

	vSimTriangle: undef,
	vMapTriangle: undef,

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

		self.initDiagrams(function(){
			
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

			// switch simulated bridge
			self.vRibbon.bind('onButtonClick', function(trigger){
				self.showLoading();

				parseBridge('data/'+trigger+'.svg', function(nodes, beams, railLinks){

					self.femBridge.set('beams', beams);
					self.femBridge.set('nodes', nodes);
					self.femBridge.setup(railLinks);

					self.femBridge.simulate();

					self.hideLoading();
				});

			});


			// show content on anchor position
			var anchorBefore = undef;
			var onIntroScreen = false;
			self.vRibbon.bind('onScrollAnchor', function($anchor, scrollPos){
				var anchorId = $anchor.data('anchor');

				console.log(anchorId);

				if (window.isMobile){


					var doRemoveBack = true;

					if (anchorId == 'intro'){

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
					
					//self.vBackHandler.showBackground(self.vMapExample.render(), false);
					// self.vBackHandler.showBackground(self.vMapTriangle.render(), false);
					

				}else{
					//
				}


				if (anchorId == 'home' || 
					anchorId == 'intro'){
					if (!onIntroScreen){
						onIntroScreen = true;
						self.vBackHandler.showBackground(self.vMapExample.render(), false);
						self.vBackHandler.appendDiagram('right', self.vSimExample);
						// self.vBackHandler.appendDiagram('right', self.vSimTriangle);
					}
					self.vBackHandler.$el.find('.scroll-col.left').addClass('hidden');
					self.vBackHandler.$el.find('.scroll-col.center').addClass('hidden');
				}else{
					onIntroScreen = false;
					self.vBackHandler.$el.find('.scroll-col.left').removeClass('hidden');
					self.vBackHandler.$el.find('.scroll-col.center').removeClass('hidden');
				}

				if (anchorId == 'footer'){
					self.vBackHandler.appendContent('center', $(''));
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
					self.vBackHandler.showBackground(self.vMapBridge.render(), false);
					self.vBackHandler.appendDiagram('left', self.vSimBridge);
					self.vRibbon.setMenuActive('engineering');
				}

				if (anchorId == 'balance'){
					self.vBackHandler.showBackground(self.vMapTriangle.render(), false);
					self.vBackHandler.appendDiagram('left', self.vSimTriangle);
					self.vRibbon.setMenuActive('engineering');
				}

				if (anchorId == 'LGS'){
					self.vBackHandler.removeBackground(false);
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
		});

	},

	initDiagrams: function(callback){
		var self = this;

		
		var femExample = new MFem();
		femExample.beforeSimulate = function(){
			var params = this.get('params');
			var nodes = this.get('nodes');
			var beams = this.get('beams');
			
			nodes[4].loaded = true;
			nodes[4].Fx = Math.cos(params[1].value/360*Math.PI*2)*params[0].value;
			nodes[4].Fy = Math.sin(params[1].value/360*Math.PI*2)*params[0].value;

			var A = (params[2].value*params[2].value)/4*Math.PI;
			var B = (params[3].value*params[2].value)/4*Math.PI;

			beams[0].A = A;
			beams[1].A = A;
			beams[2].A = B;
			beams[3].A = A;
			beams[4].A = B;
			beams[5].A = A;
			beams[6].A = B;
			beams[7].A = A;
			beams[8].A = B;
			beams[9].A = A;
			beams[10].A = B;
			beams[11].A = A;
			beams[12].A = B;
			beams[13].A = A;
			beams[14].A = A;

			this.set('nodes', nodes);
			this.set('beams', beams);
		};
		femExample.set('params', [
			{ value: 100, minValue: 0, maxValue: 1000, label: 'Kraft in kN', color: window.BLACK },
			{ value: 270, minValue: 0, maxValue: 360, label: 'Winkel der Kraft', color: window.BLACK },
			{ value: 10, minValue: 1, maxValue: 30, label: 'Stabdurchmesser a in mm', color: window.BLACK },
			{ value: 20, minValue: 1, maxValue: 30, label: 'Stabdurchmesser b in mm', color: window.BLACK }
		]);

		var femTriangle = new MFem();
		femTriangle.beforeSimulate = function(){
			var nodes = this.get('nodes');
			var beams = this.get('beams');
			var params = this.get('params');

			nodes[1].loaded = true;
			nodes[1].Fx = Math.cos(params[1].value/360*Math.PI*2)*params[0].value;
			nodes[1].Fy = Math.sin(params[1].value/360*Math.PI*2)*params[0].value;

			var A = (params[2].value*params[2].value)/4*Math.PI;
			var B = (params[3].value*params[2].value)/4*Math.PI;
			var C = (params[4].value*params[2].value)/4*Math.PI;

			beams[0].A = A;
			beams[1].A = B;
			beams[2].A = C;

			this.set('nodes', nodes);
			this.set('beams', beams);
		};
		femTriangle.set('params', [
			{ value: 100, minValue: 0, maxValue: 2000, label: 'Kraft in kN', color: window.BLACK },
			{ value: 270, minValue: 0, maxValue: 360, label: 'Winkel der Kraft', color: window.BLACK },
			{ value: 10, minValue: 1, maxValue: 40, label: 'Stabdurchmesser a in mm', color: window.BLACK },
			{ value: 20, minValue: 1, maxValue: 40, label: 'Stabdurchmesser b in mm', color: window.BLACK },
			{ value: 30, minValue: 1, maxValue: 40, label: 'Stabdurchmesser c in mm', color: window.BLACK }
		]);

		self.femBridge = new MRailroad();
		self.femBridge.set('simulationDuration', 100);
		self.femBridge.set('params', [
			// { value: 7.86, minValue: 1, maxValue: 100, label: 'Dichte Stahl in 10<sup>-6</sup>kg/mm<sup>2</sup>', color: window.BLACK },
			// { value: 210, minValue: 1, maxValue: 300, label: 'E-Modul in kN/mm<sup>2</sup>', color: window.BLACK },
			{ value: 30, minValue: 1, maxValue: 100, label: 'Durchmesser in mm', color: window.BLACK },
			{ value: 65, minValue: 1, maxValue: 300, label: 'Wagengewicht in t', color: window.BLACK },
			{ value: 12, minValue: 1, maxValue: 20, label: 'Anzahl Wagen', color: window.BLACK },
			{ value: 1000, minValue: 1, maxValue: 3000, label: 'Anzahl Iterationen', color: window.GRAY },
			{ value: 0.8, minValue: 0, maxValue: 1, label: 'Dämpfung', color: window.GRAY },
		]);

		

		d3.csv('data/validation_beams.csv', function(error, exampleBeams){
			d3.csv('data/validation_nodes.csv', function(error, exampleNodes){
				femExample.set('beams', exampleBeams);
				femExample.set('nodes', exampleNodes);

				d3.csv('data/lecture_beams.csv', function(error, triangleBeams){
					d3.csv('data/lecture_nodes.csv', function(error, triangleNodes){
						femTriangle.set('beams', triangleBeams);
						femTriangle.set('nodes', triangleNodes);

						parseBridge('data/spandrel-braced-arch.svg', function(nodes, beams, railLinks){

							self.femBridge.set('beams', beams);
							self.femBridge.set('nodes', nodes);
							self.femBridge.setup(railLinks);

							callback.call();
						});

						// d3.csv('data/bruecke_beams.csv', function(error, bridgeBeams){
						// 	d3.csv('data/bruecke_nodes.csv', function(error, bridgeNodes){
						// 		femBridge.set('beams', bridgeBeams);
						// 		femBridge.set('nodes', bridgeNodes);
						// 		femBridge.setup();

						// 		callback.call();
						// 	});
						// });

					});
				});

			});
		});

		self.vSimExample = new VSimPlot({
			title: 'Fachwerk',
			simulation: femExample,
			showControls: false,
			reactionTime: 1,

			plotColors: [],
			plotStrokes: [],
			plotAlphas:  []
		});

		self.vMapExample = new VTrussMap();
		self.vMapExample.listenTo(femExample, 'simulationend', function(simulation){
			self.vMapExample.update(simulation.get('nodes'), simulation.get('beams'));
		});


		self.vSimBridge = new VSimPlot({
			title: 'Müngstener Brücke',
			simulation: self.femBridge,
			showControls: true,
			// reactionTime: 1

			ticks: 5,
			tocks: 10,
			minValue: 0,
			maxValue: 1,
			plotColors: [window.BLACK],
			plotStrokes: [1],
			plotAlphas:  [1],
			legend: ['Dehnung'],
			legendColors: [window.BLACK],
			resetAt: 1,
			autoScale: 0,
			percentOnly: false
		});

		self.vMapBridge = new VTrussMap();
		self.vMapBridge.listenTo(self.femBridge, 'simulationend', function(simulation){
			self.vMapBridge.update(simulation.get('nodes'), simulation.get('beams'), false);
		});
		self.vMapBridge.listenTo(self.femBridge, 'simulationedit', function(simulation){
			self.vMapBridge.update(simulation.get('nodes'), simulation.get('beams'), true, simulation);
		});
		
		self.vSimTriangle = new VSimPlot({
			title: 'Kräftegleichgewicht',
			simulation: femTriangle,
			showControls: false,
			reactionTime: 1,

			plotColors: [],
			plotStrokes: [],
			plotAlphas:  []
		});

		self.vMapTriangle = new VTrussMap();
		self.vMapTriangle.listenTo(femTriangle, 'simulationend', function(simulation){
			self.vMapTriangle.update(simulation.get('nodes'), simulation.get('beams'));
		});

	},

	resize: function(){
		var self = this;

		var width = $(window).width();
		var height = $(window).height();

		console.log('resize to '+width+'/'+height);

		self.vRibbon.resize(height);
		self.vBackHandler.resize(width, height);
		self.vMapExample.resize(width,height);
		
		if (window.isMobile){
			self.vMapBridge.resize(width,height);
			self.vMapBridge.$el.removeClass('gamemap');
			self.vMapTriangle.resize(width,height);
			self.vMapTriangle.$el.removeClass('gamemap');
		}else{
			self.vMapBridge.resize(685,height);
			self.vMapBridge.$el.addClass('gamemap');
			self.vMapTriangle.resize(685,height);
			self.vMapTriangle.$el.addClass('gamemap');
		}
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



function parseBridge(path, callback){
	$.ajax({
		url: path,
		dataType: 'xml'
	}).done(function(data) {

		var svg = d3.select(data);

		var nodes = [];
		var beams = [];
		var railLinks = [];

		svg.selectAll('line').each(function(d){
			var line = d3.select(this);

			var startNode = addNode(
				parseFloat(line.attr('x1')), 
				parseFloat(line.attr('y1')), 
				// line.attr('class') == 'railroad',
				line.attr('class') == 'st1',
				nodes
			);
			var endNode = addNode(
				parseFloat(line.attr('x2')), 
				parseFloat(line.attr('y2')), 
				// line.attr('class') == 'railroad',
				line.attr('class') == 'st1',
				nodes
			);

			beams.push({
				nr: (beams.length+1).toString(),
				start: startNode.nr,
				end: endNode.nr,
			});

		});


		svg.selectAll('circle').each(function(d){
			var circle = d3.select(this);
			var x = parseFloat(circle.attr('cx'));
			var y = parseFloat(circle.attr('cy'));

			var i = nodes.findIndex((node) => node.x == x && node.y == y);
			if (i >= 0){
				nodes[i].yLock = 1;
				// if (circle.attr('class') == 'hinged'){
				if (circle.attr('class') == 'st2'){
					nodes[i].xLock = 1;
				}
			}
		});

		var maxY = -Infinity;
		nodes.forEach((node, i) => {
			if (node.y > maxY) maxY = node.y;
		});
		for (var i = 0; i < nodes.length; i++){
			nodes[i].y = maxY - nodes[i].y; // flip y-axis

			// one foot = 30.48cm --> https://de.wikipedia.org/wiki/Angloamerikanisches_Ma%C3%9Fsystem
			nodes[i].x = nodes[i].x * 30.48 * 10; 
			nodes[i].y = nodes[i].y * 30.48 * 10;

			// fill raillink array
			if (nodes[i].railRoad) railLinks.push({
				i: i,
				x: nodes[i].x,
				y: nodes[i].y
			});
		}

		callback.call(undef, nodes, beams, railLinks);
	});
}

function addNode(x, y, railRoad, nodes){
	var i = nodes.findIndex((node) => node.x == x && node.y == y);

	if (i < 0){
		var newNode = {
			nr: (nodes.length+1).toString(),
			x: x,
			y: y,
			Fx: 0,
			Fy: 0,
			xLock: 0,
			yLock: 0,
			railRoad: railRoad
		};
		nodes.push(newNode);
		return newNode;

	}else{
		nodes[i].railRoad = nodes[i].railRoad || railRoad;
		return nodes[i];

	}

}