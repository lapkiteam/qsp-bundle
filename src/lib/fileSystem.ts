import { sep } from "path"
import { UnionCase, type Option, Result } from "@fering-org/functional-helper"
import update from "immutability-helper"

// todo: refactor: move to library
export namespace ResultExt {
  export function map<Ok, NewOk, Error>(
    result: Result<Ok, Error>,
    mapper: (ok: Ok) => NewOk,
  ): Result<NewOk, Error> {
    if (result[0] === "Error") {
      return Result.mkError(result[1])
    }
    return Result.mkOk(mapper(result[1]))
  }

  export function mapError<Ok, Error, NewError>(
    result: Result<Ok, Error>,
    mapper: (ok: Error) => NewError,
  ): Result<Ok, NewError> {
    if (result[0] === "Ok") {
      return Result.mkOk(result[1])
    }
    return Result.mkError(mapper(result[1]))
  }
}

export type PathFragment = string

export type Path = PathFragment[]

export namespace Path {
  export function split(
    rawPath: string,
    separator?: string
  ): PathFragment[] {
    return rawPath.split(separator || sep)
  }

  export function push(path: Path, newFragment: PathFragment): Path {
    return update(path, {
      $push: [newFragment]
    })
  }

  export function isEqual(thisPath: Path, otherPath: Path) {
    if (thisPath.length !== otherPath.length) {
      return false
    }
    for (let index = 0; index < thisPath.length; index++) {
      if (thisPath[index] !== otherPath[index]) {
        return false
      }
    }
    return true
  }
}

export type FileContent = string

export type Entity =
  | UnionCase<"Directory", Map<PathFragment, Entity>>
  | UnionCase<"File", FileContent>

export namespace Entity {
  export function createDirectory(
    dir?: [PathFragment, Entity][] | Map<PathFragment, Entity>
  ): Entity {
    return UnionCase.mkUnionCase("Directory", new Map(dir))
  }

  export function createFile(content: FileContent): Entity {
    return UnionCase.mkUnionCase("File", content)
  }

  // refactor: `Entity.create` rename it to `createSubDir`
  export function create(
    pathFragments: Path,
    content: FileContent,
    pathFragmentStartIndex?: number
  ): Entity {
    const pathFragmentsLength = pathFragments.length
    if (pathFragmentsLength <= 0) {
      throw new Error("`pathFragments` is empty!")
    }
    pathFragmentStartIndex = pathFragmentStartIndex || 0
    let entity = Entity.createDirectory([[
      pathFragments[pathFragmentsLength - 1],
      Entity.createFile(content),
    ]])
    for (let pathFragmentsIndex = pathFragmentsLength - 2;
      pathFragmentsIndex >= pathFragmentStartIndex;
      pathFragmentsIndex--
    ) {
      const pathFragment = pathFragments[pathFragmentsIndex]
      entity = Entity.createDirectory([[pathFragment, entity]])
    }
    return entity
  }
}

export type MemoryFileSystem = Map<string, Entity>

export enum WriteFileError {
  "IsDirectory",
  "PathFragmentsIsEmpty",
}

export namespace WriteFileError {
  export function toString(params: WriteFileError) {
    switch (params) {
      case WriteFileError.IsDirectory:
        return "IsDirectory"
      case WriteFileError.PathFragmentsIsEmpty:
        return "PathFragmentsIsEmpty"
    }
  }
}

export enum ReadFileError {
  "PathFragmentsIsEmpty",
  "FileNotFound",
  "IsDirectory",
}

export namespace ReadFileError {
  export function toString(error: ReadFileError) {
    switch (error) {
      case ReadFileError.IsDirectory:
        return "IsDirectory"
      case ReadFileError.PathFragmentsIsEmpty:
        return "PathFragmentsIsEmpty"
      case ReadFileError.FileNotFound:
        return "FileNotFound"
    }
  }
}

export enum RemoveError {
  "PathFragmentsIsEmpty",
  "EntityNotFound",
}

export namespace RemoveError {
  export function toString(params:RemoveError) {
    switch (params) {
      case RemoveError.EntityNotFound:
        return "EntityNotFound"
      case RemoveError.PathFragmentsIsEmpty:
        return "PathFragmentsIsEmpty"
    }
  }
}

export namespace MemoryFileSystem {
  export function create(dir?: [string, Entity][]): MemoryFileSystem {
    return new Map(dir)
  }

  export function writeFile(
    fileSystem: MemoryFileSystem,
    pathFragments: string[],
    content: string,
  ): Result<MemoryFileSystem, WriteFileError> {
    if (pathFragments.length === 0) {
      return Result.mkError(WriteFileError.PathFragmentsIsEmpty)
    }

    function loop(
      fragments: string[],
      index: number,
      dir: Map<string, Entity>
    ): Result<Map<string, Entity>, WriteFileError> {
      const isLast = index === fragments.length - 1
      const current = fragments[index]

      if (isLast) {
        const existing = dir.get(current)
        if (existing?.case === "Directory") {
          return Result.mkError(WriteFileError.IsDirectory)
        }
        const newDir = new Map(dir)
        newDir.set(current, Entity.createFile(content))
        return Result.mkOk(newDir)
      }

      const existing = dir.get(current)
      if (!existing || existing.case === "File") {
        const newEntity = Entity.create(fragments, content, index + 1)
        const newDir = new Map(dir)
        newDir.set(current, newEntity)
        return Result.mkOk(newDir)
      }

      const result = loop(fragments, index + 1, existing.fields)
      if (result[0] === "Error") {
        return result
      }

      const newDir = new Map(dir)
      newDir.set(current, Entity.createDirectory(result[1]))
      return Result.mkOk(newDir)
    }

    return loop(pathFragments, 0, fileSystem)
  }

  export function readFile(
    fileSystem: MemoryFileSystem,
    pathFragments: Path,
  ): Result<FileContent, ReadFileError> {
    const pathFragmentsLength = pathFragments.length
    function loop(
      pathFragmentsIndex: number,
      dir: MemoryFileSystem
    ): Result<FileContent, ReadFileError> {
      const isLast = pathFragmentsIndex === pathFragmentsLength - 1
      const pathFragment = pathFragments[pathFragmentsIndex]
      if (isLast) {
        const result = dir.get(pathFragment)
        if (!result) {
          return Result.mkError(ReadFileError.FileNotFound)
        }
        if (result.case === "Directory") {
          return Result.mkError(ReadFileError.IsDirectory)
        }
        return Result.mkOk(result.fields)
      }
      const result = dir.get(pathFragment)
      if (!result || result.case === "File") {
        return Result.mkError(ReadFileError.FileNotFound)
      }
      return loop(pathFragmentsIndex + 1, result.fields)
    }
    if (pathFragmentsLength === 0) {
      return Result.mkError(ReadFileError.PathFragmentsIsEmpty)
    }
    return loop(0, fileSystem)
  }

  export function remove(
    fileSystem: MemoryFileSystem,
    pathFragments: Path,
  ): Result<MemoryFileSystem, RemoveError> {
    const pathFragmentsLength = pathFragments.length
    function loop(
      pathFragmentsIndex: number,
      dir: MemoryFileSystem,
    ): Result<MemoryFileSystem, RemoveError> {
      const isLast = pathFragmentsIndex === pathFragmentsLength - 1
      const pathFragment = pathFragments[pathFragmentsIndex]
      if (isLast) {
        const result = dir.get(pathFragment)
        if (!result) {
          return Result.mkError(RemoveError.EntityNotFound)
        }
        // refactor: use `immutability-helper` for update
        const newDir = new Map(dir)
        newDir.delete(pathFragment)
        return Result.mkOk(newDir)
      }
      const result = dir.get(pathFragment)
      if (!result || result.case === "File") {
        return Result.mkError(RemoveError.EntityNotFound)
      }
      return ResultExt.map(
        loop(pathFragmentsIndex + 1, result.fields),
        subDir => {
          // refactor: use `immutability-helper` for update
          const newDir = new Map(dir)
          newDir.set(pathFragment, Entity.createDirectory(subDir))
          return newDir
        }
      )
    }
    if (pathFragmentsLength === 0) {
      return Result.mkError(RemoveError.PathFragmentsIsEmpty)
    }
    return loop(0, fileSystem)
  }

  export function forEach(
    fileSystem: MemoryFileSystem,
    cb: (path: Path, FileContent: FileContent) => void,
  ): void {
    function loop(
      fileSystem: MemoryFileSystem,
      path: Path,
    ) {
      fileSystem.forEach((value, key) => {
        const newPath = Path.push(path, key)
        if (value.case === "File") {
          cb(newPath, value.fields)
          return
        }
        loop(value.fields, newPath)
      })
    }
    loop(fileSystem, [])
  }
}
