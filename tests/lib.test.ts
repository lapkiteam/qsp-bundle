import { describe, it, expect } from "@jest/globals"

import { bundle, Options } from "../src/lib"

describe("bundle", () => {
  it("mockgame", () => {
    expect(
      bundle("./tests/mockGame/main.qsps")
    ).toStrictEqual((() => {
      if (process.platform === "win32") {
        return [
          "# main\r\n\r\n-\r\n",
          "# lib\r\n\r\n-\r\n",
          "# version\r\n\r\n-\r\n",
          "# hero\r\n\r\n-\r\n",
          "# potion\r\n\r\n-\r\n",
          "# shield\r\n\r\n-\r\n",
          "# sword\r\n\r\n-\r\n",
          "# city\r\n\r\n-\r\n",
          "# forest\r\n\r\n-\r\n",
        ]
      }
      return [
        "# main\r\n\r\n-\r\n",
        "# lib\r\n\r\n-\r\n",
        "# version\r\n\r\n-\r\n",
        "# hero\r\n\r\n-\r\n",
        "# city\r\n\r\n-\r\n",
        "# forest\r\n\r\n-\r\n",
        "# sword\r\n\r\n-\r\n",
        "# potion\r\n\r\n-\r\n",
        "# shield\r\n\r\n-\r\n",
      ]
    }
    )().join(Options.separatorDefault))
  })
})
