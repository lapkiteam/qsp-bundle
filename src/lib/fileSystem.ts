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
}

export type FileSystem =
  | UnionCase<"Directory", Map<PathFragment, FileSystem>>
  | UnionCase<"File", FileContent>

export type MemoryFileSystem = Map<string, Entity>

export enum WriteFileError {
  "IsDirectory",
  "PathFragmentsIsEmpty",
}

export namespace FileSystem {
  export function mk(dir: [string, Entity][]): MemoryFileSystem {
    return new Map(dir)
  }

  export function createDirectory(
    dir: [PathFragment, FileSystem][]
  ): FileSystem {
    return UnionCase.mkUnionCase("Directory", new Map(dir))
  }

  export function createFile(content: FileContent): FileSystem {
    return UnionCase.mkUnionCase("File", content)
  }

  export function create(
    pathFragments: Path,
    content: FileContent,
    pathFragmentStartIndex?: number
  ): FileSystem {
    const pathFragmentsLength = pathFragments.length
    if (pathFragmentsLength <= 0) {
      throw new Error("`pathFragments` is empty!")
    }
    pathFragmentStartIndex = pathFragmentStartIndex || 0
    let fileSystem: FileSystem = createDirectory([[
      pathFragments[pathFragmentsLength - 1],
      createFile(content),
    ]])
    for (let pathFragmentsIndex = pathFragmentsLength - 2;
      pathFragmentsIndex >= pathFragmentStartIndex;
      pathFragmentsIndex--
    ) {
      const pathFragment = pathFragments[pathFragmentsIndex]
      fileSystem = createDirectory([[pathFragment, fileSystem]])
    }
    return fileSystem
  }

  export function writeFile(
    pathFragments: string[],
    content: string,
    fileSystem: MemoryFileSystem,
  ): Result<MemoryFileSystem, WriteFileError> {
    if (pathFragments.length === 0) {
      return Result.mkError(WriteFileError.PathFragmentsIsEmpty)
    }

    function createSubTree(fragments: string[]): Entity {
      if (fragments.length === 1) {
        const [first] = fragments
        const child = Entity.createFile(content)
        return Entity.createDirectory([[first, child]])
      }
      const [first, ...rest] = fragments
      const child = createSubTree(rest)
      return Entity.createDirectory([[first, child]])
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
        const restFragments = fragments.slice(index + 1)
        const newEntity = createSubTree(restFragments)
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

  // export function readFile(fileSystem: FileSystem, path: Path): Option<string> {
  //   todo
  // }

  // export function remove(fileSystem: FileSystem, path: Path) {
  //   todo
  // }
}
