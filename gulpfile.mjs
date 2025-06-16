// @ts-check
import fs from "fs"
import { task, src, dest, series } from "gulp"
import log from "gulplog"
import path from "path"
import ts from "typescript"
import jsonModifier from "gulp-json-modifier"
import jest from "jest"

const buildPath = "./build"

task("clean", cb => {
  fs.rm(`${buildPath}`, { recursive: true, force: true }, cb)
})

/**
 * @param {string} configPath
 * @param {import("undertaker").TaskCallback} done
 */
function tsBuild(configPath, done) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
  const parsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  )

  const program = ts.createProgram(
    parsedCommandLine.fileNames,
    parsedCommandLine.options
  )

  const emitResult = program.emit()

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics)

  if (allDiagnostics.length > 0) {
    allDiagnostics.forEach(diagnostic => {
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      )
      log.error(`Error ${diagnostic.code}: ${message}`)
    })
    done(new Error("Compilation error!"))
    return
  }

  log.info("Compilation successful!")
  done()
}

task("build", done => {
  tsBuild("tsconfig.build.json", done)
})

task("packageJsonCopy", cb => {
  src("./package.json")
    .pipe(jsonModifier(function(json) {
      delete json.scripts
      delete json.devDependencies
      json.main = "bin/qsp-bundle.js"
      json.bin = {
        ["qsp-bundle"]: "bin/qsp-bundle.js"
      }
      return json
    }))
    .pipe(dest(buildPath))
    .on("end", cb)
})

task("readmeCopy", done => {
  src("./README.md")
    .pipe(dest(buildPath))
    .on("end", done)
})

task("deploy", series([
  "clean",
  "build",
  "readmeCopy",
  "packageJsonCopy",
]))

task("test", done => {
  jest.run()
    .then(() => { done() })
    .catch(done)
})

task("testWatch", done => {
  jest.run(["--watchAll"])
    .then(() => { done() })
    .catch(done)
})
