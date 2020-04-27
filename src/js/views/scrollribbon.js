var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

module.exports = Backbone.View.extend({

	className: 'scroll-ribbon',

	screenHeight: 0,
	paddingTop: 20,
	paddingBottom: 90,
	anchorElements: [],

	$footer: undef,
	$footerAnchor: undef,

	events: {
		'click .scroll-nav-element': 'navClick',
		'mouseover .footer-anchor .scroll-element-content': 'showMenu',
		'mouseout .footer-anchor .scroll-element-content': 'hideMenu',
		'click .footer-anchor .scroll-element-content': 'clickMenu',
	},

	initialize: function(options) {
		var self = this;

	},

	initScrollHandler: function(){
		var self = this;

		$(window).bind('scroll',function(e){
            self.scrollHandler();
        });

        self.scrollHandler();
	},

	resize: function(height){
		var self = this;

		self.screenHeight = height;

		/*
		self.$el.find('.scroll-element').css({
			minHeight: self.screenHeight
		});
		*/

		self.$el.find('.scroll-element.full-screen').css({
			height: self.screenHeight
		});

		self.$el.find('.scroll-element.push-next').css({
			paddingBottom: self.screenHeight
		});

		self.scrollHandler();
	},

	render: function(templateName){
		var self = this;

		self.$el.html(templates[templateName]({ }));

		self.$footer = self.$el.find('.footer');
		self.$footerAnchor = self.$el.find('.scroll-element.footer-anchor');


		self.anchorElements = [];
		self.$el.find('.scroll-element').each(function(i){
			self.anchorElements.push($(this));

			self.$footerAnchor.find('.scroll-col.'+$(this).data('anchor')).html(
				$(this).find('.scroll-col').last().html()
			);
		});

		self.$footer.html(self.$footerAnchor.html());

		return self;
	},

	scrollHandler: function(){
		var self = this;

 		var windowScrollTop = $(window).scrollTop() + self.screenHeight;

		for (var n = 0; n < self.anchorElements.length; n++){
			var $anchor = self.anchorElements[n];
			var $col = self.$footer.find('.scroll-col.'+$anchor.data('anchor'));

			if ($(window).scrollTop() - self.paddingTop > $anchor.offset().top) {
				$anchor.addClass('above');
			}else{
				$anchor.removeClass('above');
			}

			if (windowScrollTop - self.paddingBottom < $anchor.offset().top){
			}else if (windowScrollTop - self.paddingBottom > $anchor.offset().top + $anchor.outerHeight() ){
			}else{
				self.trigger('onScroll', $anchor, windowScrollTop - self.paddingBottom - $anchor.offset().top);
			}

			if (windowScrollTop - self.paddingBottom < $anchor.offset().top){

				if ($anchor.hasClass('on-screen')){
					$anchor.removeClass('on-screen');

					$col.removeClass('active');
					self.slideMenuUp($col);
				}

				//$anchor.removeClass('above');
				$anchor.addClass('below');

			}else if (windowScrollTop > $anchor.offset().top + $anchor.outerHeight() ){
			
				if ($anchor.hasClass('on-screen')){
					$anchor.removeClass('on-screen');

					$col.removeClass('active');
					self.slideMenuUp($col);
				}
				//$anchor.addClass('above');
				$anchor.removeClass('below');
				
			}else{

				if (!$anchor.hasClass('on-screen')){
					$anchor.addClass('on-screen');
					self.trigger('onScrollAnchor', $anchor);

					
					self.slideMenuDown($col);
					$col.addClass('active');
				}

				
				//$anchor.removeClass('above');
				$anchor.removeClass('below');
			}
		}

		self.$footer.attr('class', 'footer '+self.$footerAnchor.attr('class'));
		self.$footer.removeClass('full-screen');
	},

	navClick: function(e){
		var self = this;

		$nav = $(e.currentTarget);
		self.scrollTo($nav.data('anchor'), $nav, function(){});
	},

	setNoMenuActive: function(menuClass){
		var self = this;

		self.$footer.find('.scroll-col').removeClass('active');
	},
	setMenuActive: function(menuClass){
		var self = this;

		var $col = self.$footer.find('.scroll-col.'+menuClass);
		$col.find('.text-box').css({
			height: 0
		}).hide();
		$col.addClass('active');
	},

	slideMenuUp: function($col){
		if ($col.hasClass('active')){ return; }
		var $menu = $col.find('.text-box');
		$menu.stop().animate({
			height: 0
		}, 200, function(){
			$menu.hide();
		});
	},
	slideMenuDown: function($col){
		if ($col.hasClass('active')){ return; }
		var $menu = $col.find('.text-box');
		$menu.stop().show().animate({
			height: 200
		}, 200);
	},

	showMenu: function(e){
		var self = this;
		self.slideMenuDown($(e.currentTarget).parent());
	},
	hideMenu: function(e){
		var self = this;
		self.slideMenuUp($(e.currentTarget).parent());
	},
	clickMenu: function(e){
		var self = this;
		self.scrollToKey($(e.currentTarget).data('scrollto'));
	},

	scrollToKey: function(key, callback){
		var self = this;

		for (var i = 0; i < self.anchorElements.length; i++){
			var $anchor = self.anchorElements[i];
			if ($anchor.data('anchor') == key){
		        self.scrollTo($anchor, callback);	
				return;
			}
		}

		//callback.call();
	},

	scrollTo: function($anchor, callback){
		var self = this;

		$('html, body').stop().animate({
            scrollTop: $anchor.offset().top - self.paddingBottom
		}, 800).promise().then(callback);

	}

});