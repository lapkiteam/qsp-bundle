import { Command } from "commander"
import { writeFileSync } from "fs"

import { bundle } from "./lib"

const program = new Command()

program
  .name("qsp-bundle")
  .description("Собирает воедино все QSP исходники в папках и в подпапках согласно указанному главному исходнику.")
  .version("0.1.0")

program
  .argument("<main_source_path>", "string to split")
  .option("-o, --output <path>", "output path")
  .action((mainSourcePath, options) => {
    const result = bundle(mainSourcePath)
    const outputPath: string | undefined = options.output
    if (!outputPath) {
      console.log(result)
      return
    }
    writeFileSync(outputPath, result)
  })

program.parse()
