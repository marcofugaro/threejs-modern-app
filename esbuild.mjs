import fs from 'fs/promises'
import { execSync } from 'child_process'
import esbuild from 'esbuild'
import { glsl } from 'esbuild-plugin-glsl'
import browserSync from 'browser-sync'
import chalk from 'chalk'
import prettyMs from 'pretty-ms'
import openBrowser from 'react-dev-utils/openBrowser.js'
import indentString from 'indent-string'
import _ from 'lodash-es'
import ora from 'ora'
import compile from 'babel-plugin-glsl/lib/compile.js'

const HTTPS = false // enable https here
const PORT = '8080'

const isDevelopment = process.env.NODE_ENV === 'development'

let local
let external
if (isDevelopment) {
  const server = browserSync.create()
  server.init({
    server: './public',
    watch: true,
    https: HTTPS,
    port: PORT,

    open: false, // don't open automatically
    notify: false, // don't show the browser notification
    minify: false, // don't minify files
    logLevel: 'silent', // no logging to console
  })

  const urlOptions = server.instance.utils.getUrlOptions(server.instance.options)
  local = urlOptions.get('local')
  external = urlOptions.get('external')
}

esbuild
  .build({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'iife',
    metafile: true, // TODO
    logLevel: 'silent', // sssh...
    legalComments: 'none', // don't include licenses txt file
    sourcemap: true,
    ...(isDevelopment
      ? //
        //  $$$$$$\    $$$$$$$$\     $$$$$$\     $$$$$$$\    $$$$$$$$\
        // $$  __$$\   \__$$  __|   $$  __$$\    $$  __$$\   \__$$  __|
        // $$ /  \__|     $$ |      $$ /  $$ |   $$ |  $$ |     $$ |
        // \$$$$$$\       $$ |      $$$$$$$$ |   $$$$$$$  |     $$ |
        //  \____$$\      $$ |      $$  __$$ |   $$  __$$<      $$ |
        // $$\   $$ |     $$ |      $$ |  $$ |   $$ |  $$ |     $$ |
        // \$$$$$$  |     $$ |      $$ |  $$ |   $$ |  $$ |     $$ |
        //  \______/      \__|      \__|  \__|   \__|  \__|     \__|
        //
        {
          outfile: 'public/app.js',
          watch: true,
          plugins: [
            glsl(),
            devLogger({
              localUrl: local,
              networkUrl: external,
              onFisrtBuild() {
                openBrowser(local)
              },
            }),
          ],
        }
      : //
        // $$$$$$$\     $$\   $$\    $$$$$$\    $$\          $$$$$$$\
        // $$  __$$\    $$ |  $$ |   \_$$  _|   $$ |         $$  __$$\
        // $$ |  $$ |   $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
        // $$$$$$$\ |   $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
        // $$  __$$\    $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
        // $$ |  $$ |   $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
        // $$$$$$$  |   \$$$$$$  |   $$$$$$\    $$$$$$$$\    $$$$$$$  |
        // \_______/     \______/    \______|   \________|   \_______/
        //
        {
          outfile: 'build/app.js',
          minify: true,
          plugins: [glslify(), glsl({ minify: true }), prodLogger({ outDir: 'build/' })],
        }),
  })
  .catch(() => process.exit(1))

function devLogger({ localUrl, networkUrl, onFisrtBuild = () => {} }) {
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

function prodLogger({ outDir }) {
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
function beautifyTree(tree) {
  const trimEnd = (s) => s.slice(0, s.indexOf('\n\n'))
  const addByteUnit = (s) => s.replace(/\[ *([0-9]+)\]/g, '[$1B]')
  const replaceBrackets = (s) => s.replace(/\[(.+)\]/g, chalk.yellow('$1'))
  const boldFirstLine = (s) => s.replace(/^(.*\n)/g, chalk.bold('$1'))
  const colorIt = (s) => chalk.cyan(s)
  const indent = (s) => indentString(s, 2)

  const beautify = _.flow([trimEnd, addByteUnit, replaceBrackets, boldFirstLine, colorIt, indent])

  return beautify(tree)
}

function glslify() {
  return {
    name: 'glslify',
    setup(build) {
      // https://medium.com/@chris_72272/what-is-the-fastest-node-js-hashing-algorithm-c15c1a0e164e
      build.onLoad({ filter: /\.(js|jsx|ts)$/ }, async (args) => {
        if (args.path.includes('/node_modules/')) {
          return
        }

        let text = await fs.readFile(args.path, 'utf8')

        if (!text.includes('#pragma glslify')) {
          return
        }

        // remove the unnecessary import
        text = text.replace(/import glsl from ('|")glslify('|");?/, '')

        // remove the unnecessary glsl function call
        text = text.replaceAll('glsl`', '`')

        // resolve glslify imports
        text = text.replace(/^(\s*)#pragma glslify(.*)/gm, (match) => {
          return compile(match.trim())
        })

        return {
          contents: text,
        }
      })
    },
  }
}
