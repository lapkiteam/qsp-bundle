import { describe, it, expect } from "@jest/globals"
import { Result } from "@fering-org/functional-helper"

import { FileSystem, WriteFileError } from "../../src/lib/fileSystem"

describe("create", () => {
  it("just file with content", () => {
    expect(FileSystem.create(["adalinda.md"], "Hello, I'm Adalinda!"))
      .toStrictEqual(
        FileSystem.createDirectory([[
          "adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")
        ]])
      )
  })

  it("full path with content", () => {
    expect(FileSystem.create(
      ["discord", "users", "adalinda.md"],
      "Hello, I'm Adalinda!",
    )).toStrictEqual(
        FileSystem.createDirectory([[
          "discord", FileSystem.createDirectory([[
            "users", FileSystem.createDirectory([[
              "adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")
            ]])
          ]])
        ]])
      )
  })

  it("full path with content and path start index", () => {
    expect(FileSystem.create(
      ["discord", "users", "adalinda.md"],
      "Hello, I'm Adalinda!",
      1,
    )).toStrictEqual(
        FileSystem.createDirectory([[
          "users", FileSystem.createDirectory([[
            "adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")
          ]])
        ]])
      )
  })
})

describe("writeFile", () => {
  it("is directory error", () => {
    expect(FileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([
        ["adalinda.md", FileSystem.createDirectory([])]
      ]),
    ))
      .toStrictEqual(
        Result.mkError(WriteFileError.IsDirectory)
      )
  })
  it("empty path error", () => {
    expect(FileSystem.writeFile(
      [], "",
      FileSystem.mk([]),
    ))
      .toStrictEqual(
        Result.mkError(WriteFileError.PathFragmentsIsEmpty)
      )
  })
  it("create and write file in empty directory", () => {
    expect(FileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([]),
    ))
      .toStrictEqual(
        Result.mkOk(FileSystem.mk([
          ["adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")]
        ]))
      )
  })
  it("create and write file in not empty directory", () => {
    expect(FileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([
        ["index.md", FileSystem.createFile("empty")]
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(FileSystem.mk([
          ["index.md", FileSystem.createFile("empty")],
          ["adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")],
        ]))
      )
  })
  it("rewrite one directory file", () => {
    expect(FileSystem.writeFile(
      ["adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([
        ["adalinda.md", FileSystem.createFile("empty")]
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(FileSystem.mk([
          ["adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")]
        ]))
      )
  })
  it("rewrite one subdirectory file", () => {
    expect(FileSystem.writeFile(
      ["users", "adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([
        ["users", FileSystem.createDirectory([
          ["adalinda.md", FileSystem.createFile("empty")],
        ])],
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(FileSystem.mk([
          ["users", FileSystem.createDirectory([
            ["adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")],
          ])],
        ]))
      )
  })
  it("create discord/users/adalinda.md in discord/index.md", () => {
    expect(FileSystem.writeFile(
      ["discord", "users", "adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([
        ["discord", FileSystem.createDirectory([
          ["index.md", FileSystem.createFile("empty")],
        ])],
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(FileSystem.mk([
          ["discord", FileSystem.createDirectory([
            ["index.md", FileSystem.createFile("empty")],
            ["users", FileSystem.createDirectory([
              ["adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")],
            ])],
          ])],
        ]))
      )
  })
  it("create discord/users/lumi.md in discord", () => {
    expect(FileSystem.writeFile(
      ["discord", "users", "adalinda.md"], "Hello, I'm Adalinda!",
      FileSystem.mk([
        ["discord", FileSystem.createDirectory([])],
      ]),
    ))
      .toStrictEqual(
        Result.mkOk(FileSystem.mk([
          ["discord", FileSystem.createDirectory([
            ["users", FileSystem.createDirectory([
              ["adalinda.md", FileSystem.createFile("Hello, I'm Adalinda!")],
            ])],
          ])],
        ]))
      )
  })
})
