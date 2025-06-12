// @ts-check
import fs from "fs"
import { task, src, dest } from "gulp"
import jsonModifier from "gulp-json-modifier"

const buildPath = "./build"

task("clear", cb => {
  fs.rm(`${buildPath}`, { recursive: true, force: true }, cb)
})

task("packageJsonCopy", cb => {
  src("./package.json")
    .pipe(jsonModifier(function(json) {
      delete json.scripts
      delete json.devDependencies
      return json
    }))
    .pipe(dest(buildPath))
    .on("end", cb)
})
