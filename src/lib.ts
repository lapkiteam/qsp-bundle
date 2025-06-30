import { dirname, basename, extname, join } from "path"
import { opendirSync, type Dirent, readFileSync } from "fs"

import { MemoryFileSystem } from "./lib/fileSystem"

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
