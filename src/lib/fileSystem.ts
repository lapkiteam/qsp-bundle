import { sep } from "path"
import { UnionCase, type Option, Result } from "@fering-org/functional-helper"

export type PathFragment = string

export type Path = PathFragment[]

export namespace Path {
  export function split(
    rawPath: string,
    separator?: string
  ): PathFragment[] {
    return rawPath.split(separator || sep)
  }
}

export type FileContent = string

export type Entity =
  | UnionCase<"Directory", Map<PathFragment, Entity>>
  | UnionCase<"File", FileContent>

export namespace Entity {
  export function createDirectory2(
    dir: Map<PathFragment, Entity>
  ): Entity {
    return UnionCase.mkUnionCase("Directory", dir)
  }

  export function createDirectory(
    dir: [PathFragment, Entity][]
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

export enum ReadFileError {
  "PathFragmentsIsEmpty",
  "FileNotFound",
  "IsDirectory",
}

export namespace MemoryFileSystem {
  export function create(dir: [string, Entity][]): MemoryFileSystem {
    return new Map(dir)
  }

  export function writeFile(
    pathFragments: string[],
    content: string,
    fileSystem: MemoryFileSystem,
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
      newDir.set(current, Entity.createDirectory2(result[1]))
      return Result.mkOk(newDir)
    }

    return loop(pathFragments, 0, fileSystem)
  }

  export function readFile(
    pathFragments: Path,
    fileSystem: MemoryFileSystem,
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

  // export function remove(fileSystem: FileSystem, path: Path) {
  //   todo
  // }
}
