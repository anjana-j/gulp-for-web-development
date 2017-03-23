//load plugins
var gulp             = require('gulp'),
    
  /* styles */
  compass          = require('gulp-compass'),
  css_uncss        = require('gulp-uncss'),
  css_autoprefixer = require('gulp-autoprefixer'),
  css_shorthand    = require('gulp-shorthand'),
  css_comb         = require('gulp-csscomb'),
  css_more         = require('gulp-more-css'),
  
  /* images */
  imagemin         = require('gulp-imagemin'),
  pngquant         = require('imagemin-pngquant');
  cache            = require('gulp-cache'),
  
  /* js */
  autopolyfiller   = require('gulp-autopolyfiller')
  modernizr        = require('gulp-modernizr'),
  babel            = require('gulp-babel'),
  concat           = require('gulp-concat'),
  uglify           = require('gulp-uglify'),
  
  /* html */
  prettify         = require('gulp-prettify'),
  htmlmin          = require('gulp-htmlmin'),
  

  /* common */
  plumber          = require('gulp-plumber'),
  notify           = require('gulp-notify'),
  rename           = require('gulp-rename'),
  order            = require('gulp-order'),
  merge            = require('event-stream').merge,
  zip              = require('gulp-zip'),
  size             = require('gulp-size'),
  path             = require('path'),
  del              = require('del'),
  livereload       = require('gulp-livereload');


// config
var config = {
     bowerDir: './bower_components'
}  

// the title and icon that will be used for the Grunt notifications
var notifyInfo = {
  title: 'E25',
  icon: path.join(__dirname, 'error.png')
};

//error notification settings for plumber
var plumberErrorHandler = { errorHandler: notify.onError({
    title: notifyInfo.title,
    icon: notifyInfo.icon,
    message: "Error: <%= error.message %>"
  })
};

/* auto prefixer browsers */

var browser_list = [
  "Android 2.3",
  "Android >= 4",
  "Chrome >= 20",
  "Firefox >= 24",
  "Explorer >= 8",
  "iOS >= 6",
  "Opera >= 12",
  "Safari >= 6"
];

/* ============================= PUT YOUR BOWER COMPONENTS CSS PATHS HERE ============================= */


var css_paths = [
  'bower_components/bootstrap-sass-official/assets/stylesheets'
];



/* ============================= PUT YOUR BOWER COMPONENTS JS PATHS HERE ============================= */



var js_paths = [
  'bower_components/jquery/dist/jquery.min.js',
  'bower_components/bootstrap-sass-official/assets/javascripts/bootstrap.min.js',
  'src/assets/js/custom.js'
];


/* =================================================================================================== */



// fonts
gulp.task('fonts', function() {
    return gulp.src(config.bowerDir + '/fontawesome/fonts/**.*')
        .pipe(gulp.dest('dist/assets/fonts')); 
});


//styles
gulp.task('styles', function() {
  return gulp.src(['src/assets/scss/**/*.scss'])
    .pipe(plumber(plumberErrorHandler))
    .pipe(compass({
      sass  : 'src/assets/scss',
      css   : 'dist/assets/css',
      image : 'dist/assets/images',
      font  : 'dist/assets/fonts',
      import_path : css_paths,
      time : true,

    }))
    .pipe(css_autoprefixer(browser_list))
    .pipe(css_shorthand())
    .pipe(css_comb())
    .pipe(size())
    .pipe(gulp.dest('dist/assets/css'))

    /* saving a css minified version */
    .pipe(rename({ suffix: '.min' }))
    .pipe(css_uncss({
        html: [
        'http://localhost/gulp/dist',
        'http://localhost/gulp/dist/about.php'

        ]
     }))
    .pipe(css_shorthand())
    .pipe(css_comb())
    .pipe(css_more())
    .pipe(size())
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(livereload());
});


// images
gulp.task('images', function(){
  return gulp.src('src/assets/images/**/*.+(png|jpg|jpeg|gif|svg)')
  // Caching images that ran through imagemin

  .pipe(cache(imagemin({
      optimizationLevel : 3, 
      progressive       : true, 
      multipass         : true, 
      interlaced        : true,
      svgoPlugins: [
          {removeViewBox : false},
          {cleanupIDs    : false}
      ],
      use: [pngquant()] 
    })))
  .pipe(size())
  .pipe(gulp.dest('dist/assets/images'))
  .pipe(livereload());
});


// minifed js + polyfill
gulp.task('polyfill', function () {
    var all = gulp.src(js_paths)
        .pipe(concat('all.js'))
        .pipe(modernizr());

    var polyfills = all
        .pipe(autopolyfiller('polyfills.js', {
          browsers: [browser_list]
        }));

    return merge(polyfills, all)
        .pipe(plumber(plumberErrorHandler))
        .pipe(order([
            'polyfills.js',
            'all.js'
        ]))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('all.min.js'))
        .pipe(uglify())
        .pipe(size())
        .pipe(gulp.dest('dist/assets/js'))
        .pipe(livereload());
});


// scripts
gulp.task('scripts', function() {
  return gulp.src(js_paths)
    .pipe(plumber(plumberErrorHandler))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(size())
    .pipe(gulp.dest('dist/assets/js'))
    .pipe(livereload());
});


// html prettify
gulp.task('prettify', function() {
  return gulp.src('src/*.html')
    .pipe(prettify({
       indent_inner_html: true,
       indent_size: 4

    }))
     .pipe(htmlmin({
        preserveLineBreaks            : true,
        removeTagWhitespace           : true,
        removeEmptyAttributes         : true,
        removeScriptTypeAttributes    : true,
        removeStyleLinkTypeAttributes : true
      }))
     .pipe(size())
    .pipe(gulp.dest('dist'))
    .pipe(livereload());
});


// html minify
gulp.task('htmlmin', function() {
  return gulp.src('src/*.html')
    .pipe(htmlmin({
      removeComments                : true,
      removeCommentsFromCDATA       : true,
      collapseWhitespace            : true,
      removeTagWhitespace           : true,
      useShortDoctype               : true,
      removeEmptyAttributes         : true,
      removeScriptTypeAttributes    : true,
      removeStyleLinkTypeAttributes : true
    }))
    .pipe(size())
    .pipe(gulp.dest('dist'))
    .pipe(livereload());
});



// clean
gulp.task('clean', function() {
  return del(['dist/*']);
});



// zip
gulp.task('zip', function() {
  return gulp.src('src/*')
    .pipe(zip('archive.zip'))
    .pipe(gulp.dest('dist'));
});


// default
gulp.task('default', ['clean'], function() {
  gulp.start('styles', 'scripts', 'images');
});




/* ============================= GULP WATCH METHODS ============================= */


/* watch css changes only */
gulp.task('watch_css', ['styles'],  function() {
  livereload.listen({ basePath: 'dist' });
  gulp.watch('src/assets/scss/**/*.scss', ['styles']);
});



/* watch js changes only (without polyfill) */
gulp.task('watch_js', ['scripts'],  function() {
  livereload.listen({ basePath: 'dist' });
  gulp.watch('src/assets/js/**/*.js', ['scripts']);
});



/* watch styles, js and image changes */
gulp.task('watch', ['styles','scripts','images'],  function() {

  livereload.listen({ basePath: 'dist' });
  gulp.watch('src/assets/scss/**/*.scss', ['styles']);
  gulp.watch('src/assets/js/**/*.js', ['scripts']);
  gulp.watch('src/assets/images/**/*', ['images']);

});



/* ============================= GULP INDIVIDUAL METHODS ============================= */

// optimize images
//gulp images

// minified js
//gulp polyfill

// beautify html
//gulp prettify

// minified html
//gulp htmlmin

// delete dist files
// gulp clean

// make a zip file from dist
// gulp zip

