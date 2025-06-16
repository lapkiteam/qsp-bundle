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
        "# main\n\n-\n",
        "# lib\n\n-\n",
        "# version\n\n-\n",
        "# hero\n\n-\n",
        "# city\n\n-\n",
        "# forest\n\n-\n",
        "# sword\n\n-\n",
        "# potion\n\n-\n",
        "# shield\n\n-\n",
      ]
    }
    )().join(Options.separatorDefault))
  })
})
