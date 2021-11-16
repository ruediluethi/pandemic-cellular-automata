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


window.RED = '#e2005c';
window.LIGHTRED = '#f2869f';
window.DARKRED = '#a51851';
window.YELLOW = '#fcd227';

window.GREEN = '#55c48f';


window.BLACK = '#555555';
window.GRAY = '#999999';

window.ORANGE = '#c15510';
window.BLUE = '#653fa7';

window.WATER = '#46a5ce';

// THU colors
/*
window.GREEN = '#447fc3';
window.RED = '#e30038';
window.LIGHTRED = '#f1849b';

window.WATER = '#011d66';
*/


/*
window.DARKRED = '#e2005c';



window.CYAN = '#4be0d8';
window.PURPLE = '#6c1eaf';
window.ORANGE = '#d87600';

window.CYAN = '#4be0d8';
*/


// app
//var App = require('./app_SEIR');
var App = require('./app_FEM');

// dom ready
$(document).ready(function(){

    try {  
        document.createEvent("TouchEvent");  
        window.IS_TOUCH_DEVICE = true;
    } catch (e) {
        window.IS_TOUCH_DEVICE = false;
    }  

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

    window.app.initRouter(false);
    window.app.showRoot();
});
