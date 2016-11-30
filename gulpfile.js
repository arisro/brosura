var gulp = require('gulp'),
    del = require('del'),
    pkg = require('./package.json'),
    dirs = pkg['configs'].directories,
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano = require('gulp-cssnano'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    zip = require('gulp-zip'),
    runSequence = require('run-sequence'),
    livereload = require('gulp-livereload');

var sassOptions = {
    errLogToConsole: true
};

gulp.task('clean', function() {
    return del(dirs.dist);
});

gulp.task('sass', function() {
    return gulp.src(dirs.src + '/scss/*.scss')
        .pipe(sass(sassOptions).on('error', sass.logError))
        .pipe(autoprefixer('last 2 version'))
        .pipe(cssnano())
        .pipe(sourcemaps.write(dirs.dist + '/css/maps/'))
        .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('js-vendor', function() {
    return gulp.src([
            './node_modules/jquery/dist/jquery.js',
            './node_modules/bootstrap-sass/assets/javascripts/bootstrap/affix.js'
        ])
        .pipe(concat('vendor.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dirs.dist + "/js/"));
});

gulp.task('js-app', function() {
    return gulp.src([
            dirs.src + '/js/main.js'
        ])
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dirs.dist + "/js/"));
});

gulp.task('js', ['js-app', 'js-vendor']);

gulp.task('images', function() {
    return gulp.src(dirs.src + '/img/**/*')
        .pipe(gulp.dest(dirs.dist + '/img/'));
});

gulp.task('other', function() {
    return gulp.src(dirs.src + '/*.*')
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('create-archive', function() {
    return gulp.src(dirs.dist)
        .pipe(zip('archive.zip'))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('watch', ['build'], function() {
    gulp.watch('src/scss/**/*.scss', ['sass']);
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('src/img/**/*', ['images']);
    gulp.watch('src/*.*', ['other']);

    livereload.listen();
    gulp.watch(['dist/**']).on('change', livereload.changed);
});

gulp.task('build', function(callback) {
    runSequence('clean', ['sass', 'js', 'images', 'other'], callback);
});
gulp.task('archive', function(callback) {
    runSequence('clean', 'build', 'create-archive', callback)
});

gulp.task('default', ['build']);
