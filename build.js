var fs = require("fs");
var browserify = require("browserify");
browserify("./browser.js")
  .transform("babelify", { presets: ["@babel/preset-env"] })
  .transform("uglifyify", { global: true } )
  .bundle()
  .pipe(fs.createWriteStream("./dist/bundle.js"));
