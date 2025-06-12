// @ts-check
import { task, src, dest } from "gulp"
import jsonModifier from "gulp-json-modifier"

task("packageJsonCopy", cb => {
  src("./package.json")
    .pipe(jsonModifier(function(json) {
      delete json.scripts
      delete json.devDependencies
      return json
    }))
    .pipe(dest("./build"))
    .on("end", cb)
})
