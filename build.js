var fs = require("fs");
var browserify = require("browserify");
var banner = require("browserify-banner");

browserify("./browser.js")
  .plugin(banner, { file: "banner.txt" } )
  .transform("babelify", { presets: ["@babel/preset-env"] })
  .transform("uglifyify", { global: true } )
  .bundle()
  .pipe(fs.createWriteStream("./dist/expr.js"));
