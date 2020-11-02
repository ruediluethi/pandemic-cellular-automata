var undef;
var Backbone = require('backbone');
var $ = jQuery = require('jquery');
Backbone.$ = $;


require('jquery-ui-dist/jquery-ui');

module.exports = Backbone.View.extend({

	className: 'v-slider',

	title: 'untitled',
	color: '#444444',
	minValue: 0,
	maxValue: 1,
	value: 1,
	paramID: -1,

	accuracy: 100,

	reactionTime: 1000,
	valueChangedTimeout: undef,

	initialize: function(options) {
		var self = this;

		if (options != undef){
			self.title = options.title;
			self.paramID = options.paramID;
			self.minValue = options.minValue;
			self.maxValue = options.maxValue;

			if (self.maxValue > 100){
				self.accuracy = 1;
			}else if (self.maxValue > 1){
				self.accuracy = 10;
			}

			if (options.color != undef){
				self.color = options.color;
			}

			if (options.reactionTime != undef){
				self.reactionTime = options.reactionTime;
			}
		}
	},


	render: function(){
		var self = this;

		self.$el.html(templates['valueslider']({
			title: self.title,
			color: self.color
		}));
		self.initDragNDrop();

		return self;
	},

	initDragNDrop: function(){
		var self = this;

		self.$el.find('.v-slider-dot').draggable({
			containment: 'parent',
			drag: function(e, ui) {

				var newValue = self.getValue();
				if (self.value != newValue){

					self.value = newValue;

					self.$el.find('.v-slider-value').html(self.value);

					clearTimeout(self.valueChangedTimeout);

					self.valueChangedTimeout = setTimeout(function(){
						self.trigger('valueHasChanged', self);
					}, self.reactionTime);
				}
			},
		});
	},

	getValue: function(){
		var self = this;

		var pos = self.$el.find('.v-slider-dot').position().left;

		self.$el.find('.v-slider-bar').css({
			width: pos + self.$el.find('.v-slider-dot').width()/2
		});

		pos = pos/(self.$el.find('.v-slider-container').width()-self.$el.find('.v-slider-dot').width());
		pos = pos*Math.abs(self.maxValue - self.minValue)+self.minValue;
		
		return Math.round(pos*self.accuracy)/self.accuracy;
		//return pos;
	},


	setValue: function(newValue){
		var self = this;

		self.value = newValue;
		self.$el.find('.v-slider-value').html(Math.round(self.value*self.accuracy)/self.accuracy);

		var pos = (self.value - self.minValue)/Math.abs(self.maxValue - self.minValue);
		pos = pos*(self.$el.find('.v-slider-container').width()-self.$el.find('.v-slider-dot').width());
		self.$el.find('.v-slider-dot').css({
			left: Math.round(pos)
		});
		self.$el.find('.v-slider-bar').css({
			width: Math.ceil(pos)+self.$el.find('.v-slider-dot').width()/2
		});
	},

	animateToValue: function(newValue){
		var self = this;

		
	}

});