var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

module.exports = Backbone.View.extend({

	className: 'scroll-ribbon',

	paddingTop: 0,
	screenHeight: 0,
	navElementHeight: 20,

	$navigation: undef,
	navElements: [],

	events: {
		'click .scroll-nav-element': 'navClick'
	},

	initialize: function(options) {
		var self = this;

		self.paddingTop = options.paddingTop;

		if (options.navElementHeight != undef){
			self.navElementHeight = options.navElementHeight;
		}

	},

	initScrollHandler: function(){
		var self = this;

		$(window).bind('scroll',function(e){
            self.scrollHandler();
        });

        self.scrollHandler();
	},

	resize: function(height_){
		var self = this;

		self.screenHeight = height_;

		self.$el.find('.scroll-element').each(function(i){
			if (i < 2){
				$(this).css({
					height: self.screenHeight
				});

			}else if(i >= self.$el.find('.scroll-element').length-1){
				$(this).css({
					height: self.screenHeight - 125
				});

			}else{
				$(this).css({
					paddingBottom: self.screenHeight*1.5
				});
			}
		});

		self.scrollHandler();
	},

	render: function(templateName){
		var self = this;

		self.$el.html(templates[templateName]({ }));

		self.$navigation = $('<div class="scroll-navigation"></div>');
		self.$el.find('.scroll-element').each(function(i){

			var title = '';
			var additionalClass = '';
			if ($(this).find('h1').length > 0){
				title = $(this).find('h1').html();
				additionalClass = 'headline';

			}else if ($(this).find('h2').length > 0){
				title = $(this).find('h2').html();
			}

			var $nav = $('<div class="scroll-nav-element '+additionalClass+'">'+
				'<div class="inside-scroll-nav-element">'+
					title+
				'</div>'+
			'</div>');
			$nav.data('anchor', $(this));
			if (!$(this).hasClass('dont-navigate')){
				self.$navigation.append($nav);
			}

			self.navElements.push($nav);

		});
		self.$el.append(self.$navigation);

		return self;
	},

	scrollHandler: function(){
		var self = this;

 		var windowScrollTop = $(window).scrollTop() + self.screenHeight;

		var currentIpos = 0;
		var i = 0;
		for (var n = 0; n < self.navElements.length; n++){

			$nav = self.navElements[n];
			$anchor = $nav.data('anchor');

			if (!$anchor.hasClass('dont-navigate')){
				i++;
			}

			/*
			$nav.css({
				right: $(window).width() - $anchor.offset().left
			});
			*/

			$nav.data('top', self.paddingTop + (i-1)*self.navElementHeight);
			$nav.data('bottom', self.screenHeight - (self.$navigation.find('.scroll-nav-element').length-currentIpos)*self.navElementHeight - (currentIpos-i)*self.navElementHeight -self.navElementHeight);

			var fixedTop = self.screenHeight - (windowScrollTop - $anchor.offset().top);


			$nav.removeClass('in-the-middle');
			$nav.removeClass('on-top');
			$nav.removeClass('on-bottom');

			if (windowScrollTop < $anchor.offset().top){

				$nav.css({
					top: $nav.data('bottom')
				});
				$nav.addClass('on-bottom');

				$anchor.removeClass('on-screen');
				if ($anchor.hasClass('in-the-middle')){
					self.trigger('inTheMiddleLost', $anchor);
				}
				$anchor.removeClass('in-the-middle');

			}else if (windowScrollTop > $anchor.offset().top + $anchor.outerHeight() ){
				
				$nav.css({
					top: $nav.data('top')
				});
				$nav.addClass('on-top');

				$anchor.removeClass('on-screen');
				if ($anchor.hasClass('in-the-middle')){
					self.trigger('inTheMiddleLost', $anchor);
				}
				$anchor.removeClass('in-the-middle');
				
			}else{

				currentIpos = i;

				if (fixedTop > $nav.data('bottom')){
					$nav.css({
						top: $nav.data('bottom')
					});
					$nav.addClass('on-bottom');

					if ($anchor.hasClass('in-the-middle')){
						self.trigger('inTheMiddleLost', $anchor);
					}
					$anchor.removeClass('in-the-middle');
					
				}else if (fixedTop < $nav.data('top')){
					$nav.css({
						top: $nav.data('top')
					});
					$nav.addClass('on-top');

					if ($anchor.hasClass('in-the-middle')){
						self.trigger('inTheMiddleLost', $anchor);
					}
					$anchor.removeClass('in-the-middle');

				}else{
					var topPos = self.screenHeight - (windowScrollTop - $anchor.offset().top);
					$nav.css({
						top: topPos
					});

					var normMiddlePos = (topPos - $nav.data('top'))/($nav.data('bottom') - $nav.data('top'));
					self.trigger('onUpdateMiddlePos', $anchor, $nav, normMiddlePos);
					//console.log($anchor.data('anchor')+': '+normMiddlePos);

					$nav.addClass('in-the-middle');

					if (!$anchor.hasClass('in-the-middle')){
						self.trigger('inTheMiddleOfScrollAnchor', $anchor);
					}
					$anchor.addClass('in-the-middle');
					
				}

				if (!$anchor.hasClass('on-screen')){
					self.trigger('onScrollAnchor', $anchor);
				}
				$anchor.addClass('on-screen');
			}

		}
	},

	navClick: function(e){
		var self = this;

		$nav = $(e.currentTarget);
		self.scrollTo($nav.data('anchor'), $nav, function(){});
	},

	scrollToKey: function(key, callback){
		var self = this;

		for (var i = 0; i < self.navElements.length; i++){
			var $anchor = self.navElements[i].data('anchor');
			if ($anchor.data('anchor') == key){
		        self.scrollTo($anchor, self.navElements[i], callback);	
				return;
			}
		}

		callback.call();
	},

	scrollTo: function($anchor, $nav, callback){
		var self = this;

		$('html, body').stop().animate({
            scrollTop: $anchor.offset().top - $nav.data('top')
		}, 800).promise().then(callback);

	}

});