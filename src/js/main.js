var undef;
var $ = jQuery = require('jquery');

// gloabl vars
window.isMobile = false;
window.isTouch = 'ontouchstart' in document.documentElement; // TODO: use modernizer for that

$.ajaxPrefilter( function(options, originalOptions, jqXHR){
    if (options.url.indexOf('http://') < 0 && !options.loadFromAppHost){
        options.url = window.dbinterface + options.url;
    }
});

window.numberWithCommas = function(x) {
   if (x.toString().length > 4){
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    }else{
      return x;
    }
}

window.atan2 = function(x,y) {

    var angle = Math.atan(y/x);

    if (y >= 0 && x < 0){ // top left
        angle = Math.PI + angle;
    }
    if (y < 0 && x <= 0){ // bottom left
        angle = Math.PI + angle;
    }
    if (y <= 0 && x > 0){ // bottom right
        angle = 2*Math.PI + angle;
    }

    return angle;
}

window.mitternacht = function(a,b,c){
    // mitternachts formula: (-b +/- sqrt(b^2 - 4ac))/2
    var insideSqrt = b*b - 4*a*c;
    if (insideSqrt < 0) { // if sqrt value < 0 --> complex values
        return [
            [-b/(2*a), Math.sqrt(-insideSqrt)/(2*a)],
            [-b/(2*a), -Math.sqrt(-insideSqrt)/(2*a)],
        ];
    }else{
        return [
            (-b+Math.sqrt(insideSqrt))/(2*a),
            (-b-Math.sqrt(insideSqrt))/(2*a),
        ];
    }
}


window.RED = '#ed4f80';
window.BLUE = '#40a1dd';
window.GREEN = '#49e2a3';
window.BLACK = '#444444';
window.GRAY = '#DDDDDD';
window.YELLOW = '#f4c237';
window.ORANGE = '#d87600';
window.PURPLE = '#6c1eaf';
window.CYAN = '#4be0d8';


/*
//window.RED = '#a32638';
window.RED = '#d4233d';
window.GREEN = '#56aa1c';
window.YELLOW = '#dfac07';
window.PURPLE = '#7a99ac';
*/

// app
var App = require('./app');

// dom ready
$(document).ready(function(){

    var resize = function(){
        window.isMobile = false;
        window.isMedium = false;
        window.isPortrait = false;
        $('body').removeClass('mobile');
        $('body').removeClass('medium');
        $('body').removeClass('portrait');

        if ($(window).width() < 1024){
            window.isMedium = true;
            $('body').addClass('medium');
        }
        if ($(window).width() < 600){
            window.isMobile = true;
            $('body').addClass('mobile');
        }
        if ($(window).height() > $(window).width()){
            window.isPortrait = true;
            $('body').addClass('portrait');
        }
    };
    $(window).resize(resize);
    resize();
    

    // init app
    window.app = new App({
        el: $('#wrapper')
    });

    window.app.initRouter();
});
