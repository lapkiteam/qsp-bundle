import { Result } from "@fering-org/functional-helper"
import update from "immutability-helper"

import { FileContent, MemoryFileSystem, Path, RemoveError, ResultExt, WriteFileError } from "./fileSystem"

export type Bundler = {
  mainSourcePath: Path
  fileSystem: MemoryFileSystem
}

export enum BundleError {
  "MainSourceNotFound",
}

export namespace BundleError {
  export function toString(error: BundleError) {
    switch (error) {
      case BundleError.MainSourceNotFound:
        return "MainSourceNotFound"
    }
  }
}

export namespace Bundler {
  export function create(mainSourcePath: Path): Bundler {
    return {
      mainSourcePath,
      fileSystem: MemoryFileSystem.create(),
    }
  }

  export function writeFile(
    bundler: Bundler,
    path: Path,
    content: FileContent,
  ): Result<Bundler, WriteFileError> {
    return ResultExt.map(
      MemoryFileSystem.writeFile(bundler.fileSystem, path, content),
      newFileSystem => {
        return update(bundler, {
          fileSystem: { $set: newFileSystem }
        })
      }
    )
  }

  export function writeFiles(
    bundler: Bundler,
    files: [Path, FileContent][],
  ): Result<Bundler, WriteFileError> {
    function loop(
      bundler: Bundler,
      index: number,
    ): Result<Bundler, WriteFileError> {
      if (!(index < files.length)) {
        return Result.mkOk(bundler)
      }
      const [path, content] = files[index]
      const result = Bundler.writeFile(bundler, path, content)
      if (result[0] === "Error") {
        return result
      }
      const newBundler = result[1]
      return loop(newBundler, index + 1)
    }
    return loop(bundler, 0)
  }

  export function remove(
    bundler: Bundler,
    path: Path,
  ): Result<Bundler, RemoveError> {
    return ResultExt.map(
      MemoryFileSystem.remove(bundler.fileSystem, path),
      newFileSystem => {
        return update(bundler, {
          fileSystem: { $set: newFileSystem }
        })
      }
    )
  }

  export function bundle(
    bundler: Bundler,
    separator: string,
  ): Result<string, BundleError> {
    const { mainSourcePath, fileSystem } = bundler
    const mainSource = MemoryFileSystem.readFile(fileSystem, mainSourcePath)
    if (mainSource[0] === "Error") {
      return Result.mkError(BundleError.MainSourceNotFound)
    }
    const files: FileContent[] = [mainSource[1]]
    MemoryFileSystem.forEach(
      fileSystem,
      (path, content) => {
        if (Path.isEqual(path, mainSourcePath)) {
          return
        }
        files.push(content)
      }
    )
    return Result.mkOk(files.join(separator))
  }
}
