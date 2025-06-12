// @ts-check
import { task, watch, series } from "gulp"

task("watch", (cb) => {
  watch("src/*")
    .on("change", (path) => {
      console.log(`${path} changed...`)
      cb()
    })
})

task("default", series("watch"))
