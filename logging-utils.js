import { execSync } from 'child_process'
import { performance } from 'perf_hooks'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import indentString from 'indent-string'
import _ from 'lodash-es'
import ora from 'ora'
import tree from 'tree-node-cli'

export function devLogger({ localUrl, networkUrl, onFisrtBuild = () => {} }) {
  return {
    name: 'devLogger',
    setup(build) {
      let startTime
      let isFirstBuild = true
      let spinner

      build.onStart(() => {
        startTime = performance.now()

        console.clear()
        spinner = ora(`Compiling...`).start()
      })

      build.onEnd(({ errors }) => {
        if (errors.length > 0) {
          console.clear()
          spinner.fail(chalk.red`Failed to compile.`)
          const error = formatError(errors[0])
          console.log(error)
          return
        }

        if (isFirstBuild) {
          isFirstBuild = false
          onFisrtBuild()
        }

        const buildTime = prettyMs(performance.now() - startTime)

        console.clear()
        spinner.succeed(chalk.green`Compiled successfully in ${chalk.cyan(buildTime)}`)
        console.log()
        console.log(`  ${chalk.bold(`Local`)}:           ${chalk.cyan(localUrl)}`)
        console.log(`  ${chalk.bold(`On your network`)}: ${chalk.cyan(networkUrl)}`)
        console.log()
      })
    },
  }
}

export function prodLogger({ outDir }) {
  return {
    name: 'prodLogger',
    setup(build) {
      const startTime = performance.now()

      console.log()
      const spinner = ora(`Compiling...`).start()

      build.onEnd(({ errors }) => {
        if (errors.length > 0) {
          spinner.fail(chalk.red`Failed to compile.`)
          const error = formatError(errors[0])
          console.log(error)
          return
        }

        const buildTime = prettyMs(performance.now() - startTime)

        spinner.succeed(chalk.green`Compiled successfully in ${chalk.cyan(buildTime)}`)
        console.log(`The folder ${chalk.bold(`${outDir}`)} is ready to be deployed`)
        console.log()

        const fileTree = tree(outDir, { dirsFirst: true, sizes: true })
        console.log(beautifyTree(fileTree))

        console.log()
      })
    },
  }
}

// format an esbuild error json
function formatError(error) {
  const { text } = error
  const { column, file, line, lineText } = error.location
  const spacing = Array(column).fill(' ').join('')

  return `
 ${chalk.bgWhiteBright.black(file)}
 ${chalk.red.bold`error:`} ${text} (${line}:${column})

${chalk.dim`    ${line} │ ${lineText}
       ╵ `}${spacing}${chalk.green`^`}
`
}

// make the console >tree command look pretty
export function beautifyTree(tree) {
  const removeFolderSize = (s) => s.slice(s.indexOf(' ') + 1)
  const colorFilesizes = (s) =>
    s.replace(/ ([A-Za-z0-9.]+) ([A-Za-z0-9.-]+)$/gm, ` ${chalk.yellow('$1')} $2`)
  const boldFirstLine = (s) => s.replace(/^(.*\n)/g, chalk.bold('$1'))
  const colorIt = (s) => chalk.cyan(s)
  const indent = (s) => indentString(s, 2)

  const beautify = _.flow([removeFolderSize, colorFilesizes, boldFirstLine, colorIt, indent])

  return beautify(tree)
}
