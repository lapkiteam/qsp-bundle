import { describe, it, expect } from "@jest/globals"
import { Result } from "@fering-org/functional-helper"

import { MemoryFileSystem, Entity, WriteFileError } from "../../src/lib/fileSystem"

describe("create", () => {
  it("just file with content", () => {
    expect(MemoryFileSystem.create(["adalinda.md"], "Hello, I'm Adalinda!"))
      .toStrictEqual(MemoryFileSystem.mk([
        ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
      ]))
  })

  it("full path with content", () => {
    expect(MemoryFileSystem.create(
      ["discord", "users", "adalinda.md"],
      "Hello, I'm Adalinda!",
    )).toStrictEqual(MemoryFileSystem.mk([
        ["discord", Entity.createDirectory([[
          "users", Entity.createDirectory([[
            "adalinda.md", Entity.createFile("Hello, I'm Adalinda!")
          ]])
        ]])]
      ]))
  })

  it("full path with content and path start index", () => {
    expect(MemoryFileSystem.create(
      ["discord", "users", "adalinda.md"],
      "Hello, I'm Adalinda!",
      1,
    )).toStrictEqual(MemoryFileSystem.mk([
      ["users", Entity.createDirectory([
        ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
      ])]
    ]))
  })
})

describe("writeFile", () => {
  it("is directory error", () => {
    expect(MemoryFileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([
        ["adalinda.md", Entity.createDirectory([])]
      ]),
    ))
      .toStrictEqual(
        Result.mkError(WriteFileError.IsDirectory)
      )
  })
  it("empty path error", () => {
    expect(MemoryFileSystem.writeFile(
      [], "",
      MemoryFileSystem.mk([]),
    ))
      .toStrictEqual(
        Result.mkError(WriteFileError.PathFragmentsIsEmpty)
      )
  })
  it("create and write file in empty directory", () => {
    expect(MemoryFileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([]),
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.mk([
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
        ]))
      )
  })
  it("create and write file in not empty directory", () => {
    expect(MemoryFileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([
        ["index.md", Entity.createFile("empty")]
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.mk([
          ["index.md", Entity.createFile("empty")],
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
        ]))
      )
  })
  it("rewrite one directory file", () => {
    expect(MemoryFileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([
        ["adalinda.md", Entity.createFile("empty")]
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.mk([
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
        ]))
      )
  })
  it("rewrite one subdirectory file", () => {
    expect(MemoryFileSystem.writeFile(
      ["users", "adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([
        ["users", Entity.createDirectory([
          ["adalinda.md", Entity.createFile("empty")],
        ])],
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.mk([
          ["users", Entity.createDirectory([
            ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
          ])],
        ]))
      )
  })
  it("create discord/users/adalinda.md in discord/index.md", () => {
    expect(MemoryFileSystem.writeFile(
      ["discord", "users", "adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([
        ["discord", Entity.createDirectory([
          ["index.md", Entity.createFile("empty")],
        ])],
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.mk([
          ["discord", Entity.createDirectory([
            ["index.md", Entity.createFile("empty")],
            ["users", Entity.createDirectory([
              ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
            ])],
          ])],
        ]))
      )
  })
  it("create discord/users/lumi.md in discord", () => {
    expect(MemoryFileSystem.writeFile(
      ["discord", "users", "adalinda.md"], "Hello, I'm Adalinda!",
      MemoryFileSystem.mk([
        ["discord", Entity.createDirectory([])],
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.mk([
          ["discord", Entity.createDirectory([
            ["users", Entity.createDirectory([
              ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
            ])],
          ])],
        ]))
      )
  })
})
