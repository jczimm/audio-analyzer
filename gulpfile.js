console.log("Running " + __filename + "...");

var gulp = require('gulp-param')(require('gulp'), process.argv);

var sourcemaps = require('gulp-sourcemaps'),
    debug = require('gulp-debug'),
    rucksack = require('gulp-rucksack'),
    autoprefixer = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    babel = require('gulp-babel'),
    eslint = require('gulp-eslint'),
    changed = require('gulp-changed'),
    gulpif = require('gulp-if');

var util = require('./util');

//

process.env.NODE_ENV = "development";

const SRC_DIR = './src/';
const APP_JS = ['./app.js'];

var electron;

gulp.task('dev', ['build', '_serve']); // serve after build is complete

// Declare `build` as a dependency (this task is only meant to be run after `build`)
gulp.task('_serve', ['build'], function () {
    gulp.start('serve');
});

gulp.task('serve', function () {
    // live-reloading application for development
    electron = require('electron-connect').server.create({
        path: './app/app.js'
    });
    
    // Start browser process
    electron.start(function () {
        // FIXME (use actual `electron`; electron.electronProc is just a childProc atm)
        // when electron window closes, stop electron-connect
        electron.electronProc.on("window-all-closed", function () {
            electron.stop();
        });
    });

    // Watch files + rebuild upon changes
    gulp.start('watch');
});

gulp.task('watch', function () {
    // Rebuild app.js and restart browser process when app.js is modified
    gulp.watch(APP_JS, ["build:app-js", "reload:browser"]);

    // Rebuild files and reload renderer process when any change(s) are made to the page
    gulp.watch(SRC_DIR + '**/*', ["build:client", "reload:renderer"]);
});

// Declare `build:app-js` as a task dependency
gulp.task('reload:browser', ['build:app-js'], function () {
    // Restart main process
    electron.restart();
});

// Declare `build:client` as a task dependency
gulp.task('reload:renderer', ['build:client'], function () {
    // Reload renderer process
    electron.reload();
});


// app build pipeline

const DEST = './app/';
const GLOBAL_EXCLUDE = ['!' + SRC_DIR + 'lib/*'];


gulp.task('build', ['build:app-js', 'build:client']);
gulp.task('build:client', ['build:html', 'build:js', 'build:css', 'copy-the-rest']);

gulp.task('build:app-js', function (force) {
    return gulp.src(APP_JS.concat(GLOBAL_EXCLUDE))
        .pipe(changed(DEST, util.changedOpts(force))) // only let "dirty" files through (files that have been modified since the last build)
        .pipe(debug()) // log all files that will be built

        .pipe(gulp.dest(DEST));
});

const HTML_SRC = [SRC_DIR + 'index.html'];
gulp.task('build:html', function (force) {
    return gulp.src(HTML_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(changed(DEST, util.changedOpts(force))) // only let "dirty" files through
        .pipe(debug()) // log all files that will be built

        .pipe(gulp.dest(DEST));
});

const JS_SRC = [SRC_DIR + '**/*.js'];
gulp.task('build:js', function (force) {
    return gulp.src(JS_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(changed(DEST, util.changedOpts(force))) // only let "dirty" files through
        .pipe(debug()) // log all files that will be built
        .pipe(sourcemaps.init()) // init sourcemaps

        .pipe(babel({
            presets: ['es2015']
        }).on('error', util.logErrorWithoutColorCodes)) // transpile ES6 to ES5

        .pipe(sourcemaps.write('.')) // write all the source maps

        .pipe(gulp.dest(DEST));
});

const CSS_SRC = [SRC_DIR + '**/*.scss'];
gulp.task('build:css', function (force) {
    return gulp.src(CSS_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(changed(DEST, util.changedOpts(force, '.css'))) // only let "dirty" files through
        .pipe(debug()) // log all files that will be built
        .pipe(sourcemaps.init()) // init sourcemaps

        .pipe(sass().on('error', sass.logError)) // translate the scss into css
        .pipe(rucksack()) // process the css with rucksack (includes various CSS "superpowers")
        .pipe(autoprefixer('last 20 versions')) // add vendor prefixes

        .pipe(sourcemaps.write('.')) // write all the source maps

        .pipe(gulp.dest(DEST));
});

// invert SRC paths that have already been built so that this task only copies everything else
const MISC_SRC = util.uniq([].concat.apply([], [HTML_SRC, JS_SRC, CSS_SRC].map(util.invertGulpSrcPath))).concat([SRC_DIR + '**/*']);
gulp.task('copy-the-rest', function (force) {
    return gulp.src(MISC_SRC)
        .pipe(changed(DEST, util.changedOpts(force))) // only let "dirty" files through
        .pipe(debug()) // log all files that will be built

        .pipe(gulp.dest(DEST));
});

// linting

function isFixed(file) {
	// Has ESLint fixed the file contents?
	return file.eslint != null && file.eslint.fixed;
}

gulp.task('lint', ['lint:js']);

gulp.task('lint:js', function (fix) {
    return gulp.src(JS_SRC.concat(GLOBAL_EXCLUDE))
        .pipe(eslint({ fix: fix }))
        .pipe(eslint.format())
        .pipe(gulpif(isFixed, gulp.dest(SRC_DIR)));
});


gulp.task('default', ['build']);
