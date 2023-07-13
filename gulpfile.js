const { src, dest, watch, parallel, series, gulp } = require("gulp");

const sass = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const uglify = require("gulp-uglify-es").default;
const autoprefixer = require("gulp-autoprefixer");
const imagemin = require("gulp-imagemin");
const del = require("del");
const ghPages = require('gh-pages');

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "app/",
    },
  });
}

function cleanDist() {
  return del('dist')
}

function images() {
  return src('app/assets/images/**/*')
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("dist/assets/images"));
}

function scripts() {
  // return src(["node_modules/jquery/dist/jquery.js", "app/js/main.js"])
  return src(["app/js/main.js"])
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

function styles() {
  return src("app/scss/style.scss")
    .pipe(sass({ 
      includePaths: ['./node_modules'],
      outputStyle: "compressed" 
    }))
    .pipe(concat("style.min.css"))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 versions"],
        grid: true,
      })
    )
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
}

function build() {
  return src(
    [
      // Выбираем нужные файлы
      "app/css/style.min.css",
      "app/fonts/**/*",
      "app/js/**/*.min.js",
      "app/**/*.html",
      "app/images/dest/**/*",
      "app/manifest.webmanifest",
      "app/*.png",
      "app/*.ico",
    ],
    { base: "app" }
  ).pipe(dest("dist"));
}

function watching() {
  watch(["app/scss/**/*.scss"], styles);
  watch(["app/js/**/*.js", "!app/js/main.min.js"], scripts);
  watch(["app/*.html"]).on("change", browserSync.reload);
}

function deploy() {
  return ghPages.publish('dist', {
    branch: 'gh-pages',
    repo: 'https://github.com/tgluk/lazer-lending.git',
    dotfiles: true
  });
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.images = images;
exports.cleanDist = cleanDist;

exports.deploy = deploy;
exports.build = series(cleanDist, images, build);
exports.default = parallel(styles, scripts, browsersync, watching);
