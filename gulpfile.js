var gulp = require('gulp');
var uglify = require('gulp-uglify');
//var minifyCSS = require('gulp-minify-css');
//var concat = require('gulp-concat');
var replace = require('gulp-regex-replace');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
//var es = require('event-stream');
var connect = require('gulp-connect');
//var sass = require('gulp-sass');
var gulpif = require('gulp-if');
var html2tpl = require('gulp-html2tpl');


var env = process.env.ENV || 'dev';
var devBase = 'http://localhost:9000/';
var distBase = '/cellauto/';

gulp.task('html', function(){

    return gulp.src('./index.html')
        .pipe(replace({
            regex:'GULP_REPLACE_BASE',
            replace: env == 'dist' ? distBase : devBase
        }))
        .pipe(gulp.dest('./builds/'+env));
});


gulp.task('data', function(){
    return gulp.src('./data/**/*')
        .pipe(gulp.dest('./builds/'+env+'/data'));
});

gulp.task('imgs', function(){
    return gulp.src('./imgs/**/*')
        .pipe(gulp.dest('./builds/'+env+'/imgs'));
});

gulp.task('css', function(){
    return gulp.src('./src/css/**/*')
        .pipe(gulp.dest('./builds/'+env+'/css'));
});

// gulp.task('css', function(){
//     return gulp.src(['./src/sass/main.scss']).pipe(sass())
//         .pipe(concat('styles.css'))
//         .pipe(gulp.dest('./builds/'+env+'/css'));
// });

gulp.task('js', function(){

    gulp.src('./src/add_js/**/*')
        .pipe(gulp.dest('./builds/'+env+'/js'));

    // compile templates
    var templates = gulp.src('src/templates/*.html')
        .pipe(html2tpl('templates.js'))
        .pipe(gulpif(env !== 'dev', streamify(uglify())))
        .pipe(gulp.dest('builds/'+env+'/js'));

    

    // compile custom code
    return browserify('./src/js/main', { debug: env === 'dev' })
        .bundle()
        .pipe(source('app.js'))
        .pipe(gulpif(env !== 'dev', streamify(uglify())))
        .pipe(gulp.dest('./builds/'+env+'/js'));

});

// /*
// gulp.task('spin', function(){
//     return gulp.src('spin.js')
//         .pipe(streamify(uglify()))
//         .pipe(gulp.dest('builds/test/js'));
// });
// */

gulp.task('watch', function(){

    // system
    gulp.watch('*.html', ['html']);
    gulp.watch('data/**/*', ['data']);
    gulp.watch('imgs/**/*', ['imgs']);
    gulp.watch('src/css/**/*.css', ['css']);
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('src/templates/**/*.html', ['js']);

});


gulp.task('connect', function(){
    connect.server({
        root: ['builds/'+env],
        fallback: 'builds/'+env+'/index.html',
        port: 9000,
        livereload: false
    });
});

gulp.task('default', ['html', 'data', 'imgs', 'css', 'js', 'watch', 'connect'], function(){

});