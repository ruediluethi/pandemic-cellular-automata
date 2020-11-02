var undef;
var $ = jQuery = require('jquery');
var Backbone = require('backbone');
Backbone.$ = $;

module.exports = Backbone.View.extend({

	className: 'background',

	screenHeight: 0,
	screenWidth: 0,

	$crntBack: undef,
	$crntContent: [],

	events: {

	},

	initialize: function(options) {
		var self = this;

	},

	resize: function(width, height){
		var self = this;

		self.screenWidth = width;
		self.screenHeight = height;
	},

	render: function(){
		var self = this;

		self.$el.html(templates['background']({ }));

		return self;
	},

	removeBackground: function(doFadeOut){
		var self = this;
		if (doFadeOut){
			self.$el.find('.fullscreen > *').stop().animate({
				opacity: 0
			}, 500, function(){
				$(this).remove();
			});
		}else{
			self.$el.find('.fullscreen > *').remove();
		}
		self.$crntBack = undef;
	},

	showBackground: function($newBack, fadeIn){
		var self = this;

		if ($newBack == self.$crntBack){
			return;
		}

		if (fadeIn){

			var show = function(){
				self.$el.find('.fullscreen').append($newBack);
				$newBack.stop().css({
					opacity: 0
				}).animate({
					opacity: 1
				}, 1000);
				self.$crntBack = $newBack;
			}

			if (self.$crntBack != undef){
				self.$crntBack.stop().animate({
					opacity: 0
				}, 500, function(){
					self.$crntBack.remove();
					show.call();
				});
			}else{
				show.call();
			}
		}else{
			
			if (self.$crntBack != undef){
				self.$crntBack.remove();
			}
			self.$el.find('.fullscreen').append($newBack);
			$newBack.stop().css({
				opacity: 1
			});
			self.$crntBack = $newBack;
		}
		
	},

	appendDiagram: function(colPos, vDiagram, dontRender){
		var self = this;

		self.appendContent(colPos, vDiagram.$el);

		if (!dontRender){
			vDiagram.render();
		}

	},

	appendContent: function(colPos, $newContent){
		var self = this;

		var newInCrnt = false;
		for (var i = 0; i < self.$crntContent.length; i++){
			if ($newContent == self.$crntContent[i]){
				newInCrnt = true;
			}else{
				self.$crntContent[i].stop().animate({
					opacity: 0
				}, 300, function(){
					$(this).remove();
				});
			}
		}

		if (newInCrnt){
			return;
		}

		self.$crntContent = [];
		self.$crntContent.push($newContent);

		self.$el.find('.scroll-col.'+colPos).append($newContent);
		$newContent.stop().delay(500).css({
			opacity: 0
		}).animate({
			opacity: 1
		}, 300);
	}

});