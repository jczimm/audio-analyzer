var gulp = require('gulp'),
    gutil = require('gulp-util'),
    rucksack = require('gulp-rucksack'),
    autoprefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    babel = require('gulp-babel'),
    jshint = require('gulp-jshint'),
    changed = require('gulp-changed'),
    gulpif = require('gulp-if'),
    exclude = require('gulp-ignore').exclude();

var util = require('./util');

//

process.env.NODE_ENV = "development";

const SRC_DIR = './src/';

// live-reloading application for development
var electron = require('electron-connect').server.create();

gulp.task('serve', function() {
    gulp.start('build');

    // Start browser process
    electron.start();

    // Restart browser process when app.js is modified
    gulp.watch('./app.js', electron.restart);

    // Rebuild files and reload renderer process when any change(s) are made to the page
    gulp.watch(SRC_DIR + '**/*', function() {
        gulp.start('build');
        electron.reload();
    });
});

gulp.task('reload:browser', function() {
    // Restart main process
    electron.restart();
});

gulp.task('reload:renderer', function() {
    // Reload renderer process
    electron.reload();
});


// app build pipeline

const DEST = './app/';
const GLOBAL_EXCLUDE = ['!' + SRC_DIR + 'lib/*'];

gulp.task('build', ['build:js', 'build:css', 'copy-the-rest']);

const JS_SRC = [SRC_DIR + '**/*.js'];
gulp.task('build:js', function() {
    return gulp.src(JS_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(changed(DEST)) // only let "dirty" files through (files that have been modified since the last build)
        .pipe(babel()) // transpile ES6 to ES5
        .pipe(gulp.dest(DEST));
});

const CSS_SRC = [SRC_DIR + '**/*.scss'];
gulp.task('build:css', function() {
    return gulp.src(CSS_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(changed(DEST)) // only let "dirty" files through
        .pipe(sass().on('error', sass.logError)) // translate the scss into css
        .pipe(rucksack()) // process the css with rucksack (includes various CSS "superpowers")
        .pipe(autoprefixer({  // add vendor prefixes
            browsers: ['last 20 versions']
        }))
        .pipe(gulp.dest(DEST));
});

// invert SRC paths that have already been built so that this task only copies everything else
const MISC_SRC = util.uniq([].concat.apply([], [JS_SRC, CSS_SRC].map(util.invertGulpSrcPath))).concat([SRC_DIR + '**/*']);
gulp.task('copy-the-rest', function() {
    return gulp.src(MISC_SRC)
        .pipe(changed(DEST)) // only let "dirty" files through
        .pipe(gulp.dest(DEST));
});

// linting

gulp.task('lint', ['lint:js']);

gulp.task('lint:js', function() {
    return gulp.src(JS_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});


gulp.task('default', ['build']);
