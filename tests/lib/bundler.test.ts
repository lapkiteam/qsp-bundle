import { describe, it, expect } from "@jest/globals"
import { Result } from "@fering-org/functional-helper"
import { pipeInto } from "ts-functional-pipe"

import { Bundler } from "../../src/lib/bundler"
import { Path, ResultExt } from "../../src/lib/fileSystem"

describe("bundle", () => {
  it("just file with content", () => {
    const mainSourcePath = "main.qsps"
    const sourcesSeparator = "\r\n"
    expect(pipeInto(
      Bundler.create(Path.split(mainSourcePath)),
      bundler => Bundler.writeFiles(
        bundler,
        [
          ["lib.qsps", "# lib\r\n\r\n-\r\n"],
          [mainSourcePath, "# main\r\n\r\n-\r\n"],
          ["version.qsps", "# version\r\n\r\n-\r\n"],
          ["characters/hero.qsps", "# hero\r\n\r\n-\r\n"],
          ["items/potion.qsps", "# potion\r\n\r\n-\r\n"],
          ["items/shield.qsps", "# shield\r\n\r\n-\r\n"],
          ["items/sword.qsps", "# sword\r\n\r\n-\r\n"],
          ["locations/city.qsps", "# city\r\n\r\n-\r\n"],
          ["locations/forest.qsps", "# forest\r\n\r\n-\r\n"],
        ].map(([path, content]) => [Path.split(path, "/"), content]),
      ),
      result => Result.reduce(result,
        (bundler: Bundler) => pipeInto(
          Bundler.bundle(bundler, sourcesSeparator),
          result => ResultExt.mapError(result,
            error => JSON.stringify(error),
        )),
        error => Result.mkError(JSON.stringify(error)),
      ),
    ))
      .toStrictEqual(Result.mkOk([
        "# main\r\n\r\n-\r\n",
        "# lib\r\n\r\n-\r\n",
        "# version\r\n\r\n-\r\n",
        "# hero\r\n\r\n-\r\n",
        "# potion\r\n\r\n-\r\n",
        "# shield\r\n\r\n-\r\n",
        "# sword\r\n\r\n-\r\n",
        "# city\r\n\r\n-\r\n",
        "# forest\r\n\r\n-\r\n",
      ].join(sourcesSeparator)))
  })
})
