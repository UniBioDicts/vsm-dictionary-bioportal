const gulp = require('gulp');
const del = require('del');
const exec = require('child_process').exec;
const gulpLoadPlugins = require('gulp-load-plugins');


const $ = gulpLoadPlugins();


gulp.task('clean_docs', function () {
  return del(['docs/**', 'docs/.*', '!docs'], {
    force: true
  });
});

gulp.task('build_book', function (callback) {
  // In gulp 4, you can return a child process to signal task completion
  exec('gitbook build', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    callback();
  });
});

gulp.task('copy_html_content', function () {
  return gulp.src([
      '_book/**/*'
    ])
    .pipe(gulp.dest('docs'));
});

gulp.task('clean_book', function () {
  return del(['_book/'], {
    force: true
  });
});

gulp.task('default', gulp.series('clean_docs', 'build_book', 'copy_html_content',
	  'clean_book', function (done) {
  done();
}));
