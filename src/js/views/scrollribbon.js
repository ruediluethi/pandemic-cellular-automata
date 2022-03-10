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
		'click .footer-anchor .scroll-element-content .more': 'clickMore',
		'click a.show-hidden-content': 'showHiddenContent',
		'click .button': 'buttonClick'
	},

	initialize: function(options) {
		var self = this;

		if (window.isMobile){
			self.paddingTop = -35;
			self.paddingBottom = 32;
		}
	},

	initScrollHandler: function(){
		var self = this;

		$(window).bind('scroll',function(e){
            self.scrollHandler();
        });

        self.scrollHandler(true);
	},

	resize: function(height){
		var self = this;

		self.screenHeight = height;

		/*
		self.$el.find('.scroll-element').css({
			minHeight: self.screenHeight
		});
		*/

		if (!window.isMobile){
			self.$el.find('.scroll-element.full-screen').css({
				height: self.screenHeight
			});

			self.$el.find('.scroll-element.double-height').css({
				height: self.screenHeight*2
			});

			self.$el.find('.scroll-element.push-before').css({
				paddingTop: self.screenHeight
			});

			self.$el.find('.scroll-element.push-next').css({
				paddingBottom: self.screenHeight
			});
		}

		self.scrollHandler();
	},

	render: function(templateName){
		var self = this;


		self.$el.html(templates[templateName]({ }));
		self.$el.find('.code').each(function(){
			var html = $(this).html();
			html = html.replace(/var/g,'<span class="highlight">var</span>');
			html = html.replace(/if/g,'<span class="highlight">if</span>');
			html = html.replace(/else/g,'<span class="highlight">else</span>');
			html = html.replace(/while/g,'<span class="highlight">while</span>');
			html = html.replace(/for/g,'<span class="highlight">for</span>');
			html = html.replace(/end/g,'<span class="highlight">end</span>');
			html = html.replace(/function/g,'<span class="highlight">function</span>');
			html = html.replace(/return/g,'<span class="highlight">return</span>');
			html = html.replace(/   /g,'<span class="quad"></span>');
			$(this).html(html);
		});



		self.$footer = self.$el.find('.footer');
		self.$footerAnchor = self.$el.find('.scroll-element.footer-anchor');


		self.anchorElements = [];
		self.$el.find('.scroll-element').each(function(i){
			self.anchorElements.push($(this));

			self.$footerAnchor.find('.scroll-col.'+$(this).data('anchor')).html(
				$(this).find('.scroll-col').last().html()
			);
		});

		
		self.$el.find('.copy-wrapper').each(function(i){
			var $element = $(this).find('.scroll-element');

			if (window.isMobile){
				$element.addClass('hanged');
				return;
			}

			var $clone = $element.clone();
			$clone.addClass('hanged');
			$(this).append($clone);
			$element.addClass('hidden');
		});

		self.$footer.html(self.$footerAnchor.html());

		return self;
	},

	scrollHandler: function(forceTrigger){
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

					//$col.removeClass('active');
					//self.slideMenuUp($col);
				}

				//$anchor.removeClass('above');
				$anchor.addClass('below');

			}else if (windowScrollTop > $anchor.offset().top + $anchor.outerHeight() ){
			
				if ($anchor.hasClass('on-screen')){
					$anchor.removeClass('on-screen');

					//$col.removeClass('active');
					//self.slideMenuUp($col);
				}
				//$anchor.addClass('above');
				$anchor.removeClass('below');
				
			}else{

				if (!$anchor.hasClass('on-screen')){
					$anchor.addClass('on-screen');
					self.trigger('onScrollAnchor', $anchor);

					
					//self.slideMenuDown($col);
					//$col.addClass('active');
				}

				if (forceTrigger){
					self.trigger('onScrollAnchor', $anchor);
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
			height: 280
		}, 200);
	},

	showMenu: function(e){
		var self = this;
		if (window.isMobile){
			return;
		}
		self.slideMenuDown($(e.currentTarget).parent());
	},
	hideMenu: function(e){
		var self = this;
		self.slideMenuUp($(e.currentTarget).parent());
	},
	clickMenu: function(e){
		var self = this;
		if (window.isMobile){
			self.scrollToKey($(e.currentTarget).data('scrollto'));
			return;
		}

		if (window.IS_TOUCH_DEVICE){
			return;
		}else{
			self.scrollToKey($(e.currentTarget).data('scrollto'));
		}
	},
	clickMore: function(e){
		var self = this;

		self.scrollToKey($(e.currentTarget).parent().parent().data('scrollto'));
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

	},

	showHiddenContent: function(e){
		var self = this;

        var $a = $(e.currentTarget);

        if(e.preventDefault){
            e.preventDefault();
        }else{
            e.returnValue = false;
        }

        $a.parent().find('.hidden-content').slideDown(500);
        $a.hide();
	},

	buttonClick: function(e){
		var self = this;

		var $button = $(e.currentTarget);

		self.trigger('onButtonClick', $button.data('trigger'));
	}

});