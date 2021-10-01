import { execSync } from 'child_process'
import { performance } from 'perf_hooks'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import indentString from 'indent-string'
import _ from 'lodash-es'
import ora from 'ora'

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

        try {
          const tree = execSync(`tree --du -h --dirsfirst ${outDir}`).toString()
          console.log(beautifyTree(tree))
        } catch (e) {
          console.log(
            chalk.yellow(`⚠️  Homerew and the tree package are required for the file tree output,`),
            `please install them with the following command:`
          )
          console.log()
          console.log(
            chalk.cyan(
              `  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && brew install tree`
            )
          )
        }

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
  const trimEnd = (s) => s.slice(0, s.indexOf('\n\n'))
  const addByteUnit = (s) => s.replace(/\[ *([0-9]+)\]/g, '[$1B]')
  const replaceBrackets = (s) => s.replace(/\[(.+)\]/g, chalk.yellow('$1'))
  const boldFirstLine = (s) => s.replace(/^(.*\n)/g, chalk.bold('$1'))
  const colorIt = (s) => chalk.cyan(s)
  const indent = (s) => indentString(s, 2)

  const beautify = _.flow([trimEnd, addByteUnit, replaceBrackets, boldFirstLine, colorIt, indent])

  return beautify(tree)
}
