import { bundle, Options } from "./lib"

const act = bundle("../tests/mockGame/main.qsps")
const exp = [
  "# main\r\n\r\n-\r\n",
  "# lib\r\n\r\n-\r\n",
  "# version\r\n\r\n-\r\n",
  "# hero\r\n\r\n-\r\n",
  "# potion\r\n\r\n-\r\n",
  "# shield\r\n\r\n-\r\n",
  "# sword\r\n\r\n-\r\n",
  "# city\r\n\r\n-\r\n",
  "# forest\r\n\r\n-\r\n",
].join(Options.separatorDefault)
console.log(act === exp)
