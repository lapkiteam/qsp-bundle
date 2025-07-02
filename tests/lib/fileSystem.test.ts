import { describe, it, expect } from "@jest/globals"
import { Result } from "@fering-org/functional-helper"

import { MemoryFileSystem, Entity, WriteFileError, ReadFileError, RemoveError } from "../../src/lib/fileSystem"

describe("Entity.create", () => {
  it("just file with content", () => {
    expect(Entity.create(["adalinda.md"], "Hello, I'm Adalinda!"))
      .toStrictEqual(
        Entity.createDirectory([
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
        ])
      )
  })

  it("full path with content", () => {
    expect(Entity.create(
      ["discord", "users", "adalinda.md"],
      "Hello, I'm Adalinda!",
    )).toStrictEqual(
        Entity.createDirectory([
          ["discord", Entity.createDirectory([
            ["users", Entity.createDirectory([
              ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
            ])]
          ])]
        ])
      )
  })

  it("full path with content and path start index", () => {
    expect(Entity.create(
      ["discord", "users", "adalinda.md"],
      "Hello, I'm Adalinda!",
      1,
    )).toStrictEqual(
        Entity.createDirectory([
          ["users", Entity.createDirectory([
            ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
          ])]
        ])
      )
  })
})

describe("writeFile", () => {
  it("is directory error", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create([
        ["adalinda.md", Entity.createDirectory()]
      ]),
      ["adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkError(WriteFileError.IsDirectory)
      )
  })
  it("empty path error", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create(),
      [], "",
    ))
      .toStrictEqual(
        Result.mkError(WriteFileError.PathFragmentsIsEmpty)
      )
  })
  it("create and write file in empty directory", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create(),
      ["adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.create([
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
        ]))
      )
  })
  it("create and write file in not empty directory", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create([
        ["index.md", Entity.createFile("empty")]
      ]),
      ["adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.create([
          ["index.md", Entity.createFile("empty")],
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
        ]))
      )
  })
  it("rewrite one directory file", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create([
        ["adalinda.md", Entity.createFile("empty")]
      ]),
      ["adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.create([
          ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")]
        ]))
      )
  })
  it("rewrite one subdirectory file", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create([
        ["users", Entity.createDirectory([
          ["adalinda.md", Entity.createFile("empty")],
        ])],
      ]),
      ["users", "adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.create([
          ["users", Entity.createDirectory([
            ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
          ])],
        ]))
      )
  })
  it("create discord/users/adalinda.md in discord/index.md", () => {
    expect(MemoryFileSystem.writeFile(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory([
          ["index.md", Entity.createFile("empty")],
        ])],
      ]),
      ["discord", "users", "adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.create([
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
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory()],
      ]),
      ["discord", "users", "adalinda.md"], "Hello, I'm Adalinda!",
    ))
      .toStrictEqual(
        Result.mkOk(MemoryFileSystem.create([
          ["discord", Entity.createDirectory([
            ["users", Entity.createDirectory([
              ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
            ])],
          ])],
        ]))
      )
  })
})

describe("readFile", () => {
  it("success read file", () => {
    expect(MemoryFileSystem.readFile(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory([
          ["users", Entity.createDirectory([
            ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
          ])],
        ])],
      ]),
      ["discord", "users", "adalinda.md"],
    ))
      .toStrictEqual(Result.mkOk("Hello, I'm Adalinda!"))
  })
  it("is directory error", () => {
    expect(MemoryFileSystem.readFile(
      MemoryFileSystem.create([
        ["adalinda.md", Entity.createDirectory()]
      ]),
      ["adalinda.md"],
    ))
      .toStrictEqual(
        Result.mkError(ReadFileError.IsDirectory)
      )
  })
  it("empty path error", () => {
    expect(MemoryFileSystem.readFile(
      MemoryFileSystem.create(),
      [],
    ))
      .toStrictEqual(
        Result.mkError(ReadFileError.PathFragmentsIsEmpty)
      )
  })
  it("read unexist file error", () => {
    expect(MemoryFileSystem.readFile(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory()]
      ]),
      ["discord", "users", "lumi.md"],
    ))
      .toStrictEqual(
        Result.mkError(ReadFileError.FileNotFound)
      )
  })
  it("one of the path fragments hits a file error", () => {
    expect(MemoryFileSystem.readFile(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory([
          ["users", Entity.createFile("")]
        ])]
      ]),
      ["discord", "users", "lumi.md"],
    ))
      .toStrictEqual(
        Result.mkError(ReadFileError.FileNotFound)
      )
  })
})

describe("remove", () => {
  it("remove file", () => {
    expect(MemoryFileSystem.remove(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory([
          ["guilds", Entity.createDirectory()],
          ["users", Entity.createDirectory([
            ["agentlapki.md", Entity.createFile("Hello, I'm Agentlapki!")],
            ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
          ])],
        ])],
      ]),
      ["discord", "users", "adalinda.md"],
    ))
      .toStrictEqual(Result.mkOk(
        MemoryFileSystem.create([
          ["discord", Entity.createDirectory([
            ["guilds", Entity.createDirectory()],
            ["users", Entity.createDirectory([
              ["agentlapki.md", Entity.createFile("Hello, I'm Agentlapki!")],
            ])],
          ])],
        ]),
      ))
  })
  it("remove directory", () => {
    expect(MemoryFileSystem.remove(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory([
          ["guilds", Entity.createDirectory()],
          ["users", Entity.createDirectory([
            ["agentlapki.md", Entity.createFile("Hello, I'm Agentlapki!")],
            ["adalinda.md", Entity.createFile("Hello, I'm Adalinda!")],
          ])],
        ])],
      ]),
      ["discord", "users"],
    ))
      .toStrictEqual(Result.mkOk(
        MemoryFileSystem.create([
          ["discord", Entity.createDirectory([
            ["guilds", Entity.createDirectory()],
          ])],
        ]),
      ))
  })
  it("empty path error", () => {
    expect(MemoryFileSystem.remove(MemoryFileSystem.create(), []))
      .toStrictEqual(Result.mkError(RemoveError.PathFragmentsIsEmpty))
  })
  it("EntityNotFound error", () => {
    expect(MemoryFileSystem.remove(
      MemoryFileSystem.create(),
      ["adalind.md"],
    ))
      .toStrictEqual(Result.mkError(RemoveError.EntityNotFound))
  })
  it("EntityNotFound error2", () => {
    expect(MemoryFileSystem.remove(
      MemoryFileSystem.create([
        ["discord", Entity.createDirectory([
          ["guilds", Entity.createDirectory()],
          ["users", Entity.createDirectory([
            ["agentlapki.md", Entity.createFile("Hello, I'm Agentlapki!")],
          ])],
        ])],
      ]),
      ["discord", "users", "adalinda.md"],
    ))
      .toStrictEqual(Result.mkError(RemoveError.EntityNotFound))
  })
})
