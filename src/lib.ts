import { dirname, basename, extname, join, normalize } from "path"
import { opendirSync, type Dirent, readFileSync, writeFileSync } from "fs"
import chokidar from "chokidar"

import { BundleError, Bundler } from "./lib/bundler"
import { Path, RemoveError, WriteFileError } from "./lib/fileSystem"

export type Options = {
  /** `utf8` by default */
  encoding?: BufferEncoding
  /** `/r/n` by default */
  separator: string
}

export namespace Options {
  export const encodingDefault: BufferEncoding = "utf8"
  export function getEncoding(options: Options): BufferEncoding {
    return options.encoding || encodingDefault
  }

  export const separatorDefault = "\r\n"
  export function getSeparator(options: Options) {
    return options.separator || separatorDefault
  }

  export function create(): Options {
    return {
      encoding: encodingDefault,
      separator: separatorDefault,
    }
  }
}

export function bundle(mainPath: string, options?: Options) {
  if (!options) { options = Options.create() }
  const basePath = dirname(mainPath)
  const mainFileName = basename(mainPath)
  const directory = opendirSync(basePath, { recursive: true })
  const sources = new Array<string>()
  sources.push(readFileSync(mainPath, Options.getEncoding(options)))
  let currentDir: Dirent<string> | null = null
  while (currentDir = directory.readSync(), currentDir) {
    if (currentDir.isDirectory()) { continue }
    const ext = extname(currentDir.name)
    if (ext !== ".qsps") { continue }
    if (basePath === currentDir.parentPath
      && mainFileName === currentDir.name
    ) { continue }
    const path = join(currentDir.parentPath, currentDir.name)
    sources.push(readFileSync(path, Options.getEncoding(options)))
  }
  directory.closeSync()
  return sources.join(Options.getSeparator(options))
}

export function bundleWatch(
  mainPath: string,
  outputPath: string,
  options?: Options,
) {
  // todo: написать проверку, что outputPath не находится в прослушиваемой директории
  if (!options) { options = Options.create() }
  mainPath = normalize(mainPath)
  const basePath = dirname(mainPath)
  let bundler = Bundler.create(Path.split(mainPath))
  function updateBundler(newBundler: Bundler) {
    bundler = newBundler
    // todo: make bundle only if ready
    const result = Bundler.bundle(bundler, options?.separator || Options.separatorDefault)
    if (result[0] === "Error") {
      console.log(BundleError.toString(result[1]))
      return
    }
    writeFileSync(outputPath, result[1])
  }

  const watcher = chokidar.watch(basePath, {
    ignored: (path, stats) => {
      if (!stats) { return false }
      return stats.isFile() && !path.endsWith(".qsps")
    },
    persistent: true,
  })
  watcher
    .on("add", path => {
      console.log(`File ${path} has been added`)
      const result = Bundler.writeFile(bundler,
        Path.split(path),
        readFileSync(path, options && Options.getEncoding(options) || Options.encodingDefault),
      )
      if (result[0] === "Error") {
        console.error(WriteFileError.toString(result[1]))
        return
      }
      updateBundler(result[1])
    })
    .on("change", path => {
      console.log(`File ${path} has been changed`)
      const result = Bundler.writeFile(bundler,
        Path.split(path),
        readFileSync(path, options && Options.getEncoding(options) || Options.encodingDefault),
      )
      if (result[0] === "Error") {
        console.error(WriteFileError.toString(result[1]))
        return
      }
      updateBundler(result[1])
    })
    .on("unlink", path => {
      console.log(`File ${path} has been removed`)
      const result = Bundler.remove(bundler, Path.split(path))
      if (result[0] === "Error") {
        console.error(RemoveError.toString(result[1]))
        return
      }
      updateBundler(result[1])
    })
    .on("addDir", path => console.log(`Directory ${path} has been added`))
    .on("unlinkDir", path => {
      console.log(`Directory ${path} has been removed`)
      const result = Bundler.remove(bundler, Path.split(path))
      if (result[0] === "Error") {
        console.error(RemoveError.toString(result[1]))
        return
      }
      updateBundler(result[1])
    })
    .on("error", error => console.log(`Watcher error: ${error}`))
    .on("ready", () => console.log("Initial scan complete. Ready for changes"))
    .on("raw", (event, path, details) => { // internal
      console.log("Raw event info:", event, path, details)
    })
  return watcher
}
