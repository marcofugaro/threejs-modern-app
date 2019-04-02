const path = require('path')
const { execSync } = require('child_process')
const merge = require('webpack-merge')
const TerserJsPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const openBrowser = require('react-dev-utils/openBrowser')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const { prepareUrls } = require('react-dev-utils/WebpackDevServerUtils')
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages')
const prettyMs = require('pretty-ms')
const EventHooksPlugin = require('event-hooks-webpack-plugin')
const chalk = require('chalk')
const indentString = require('indent-string')
const _ = require('lodash')

const HOST = '0.0.0.0'
const PORT = 8080
const urls = prepareUrls('http', HOST, PORT)

// make the console >tree command look pretty
function beautifyTree(tree) {
  const trimEnd = s => s.slice(0, s.indexOf('\n\n'))
  const addByteUnit = s => s.replace(/\[ *([0-9]+)\]/g, '[$1B]')
  const replaceBrackets = s => s.replace(/\[(.+)\]/g, chalk.yellow('$1'))
  const boldFirstLine = s => s.replace(/^(.*\n)/g, chalk.bold('$1'))
  const colorIt = s => chalk.cyan(s)
  const indent = s => indentString(s, 2)

  const beautify = _.flow([trimEnd, addByteUnit, replaceBrackets, boldFirstLine, colorIt, indent])

  return beautify(tree)
}

module.exports = merge.smart(
  {
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
        {
          test: /\.(glsl|frag|vert)$/,
          use: ['raw-loader', 'glslify-loader'],
        },
      ],
    },
    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: './public/index.html',
      }),
    ],
    // automatically split vendor and app code
    optimization: {
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
      },
    },
    // turn off performance hints
    performance: false,
    // turn off the default webpack bloat
    // TODO re-enable this when it will be more beautiful
    // https://github.com/webpack/webpack-cli/issues/575
    stats: false,
  },
  //
  //  $$$$$$\    $$$$$$$$\     $$$$$$\     $$$$$$$\    $$$$$$$$\
  // $$  __$$\   \__$$  __|   $$  __$$\    $$  __$$\   \__$$  __|
  // $$ /  \__|     $$ |      $$ /  $$ |   $$ |  $$ |     $$ |
  // \$$$$$$\       $$ |      $$$$$$$$ |   $$$$$$$  |     $$ |
  //  \____$$\      $$ |      $$  __$$ |   $$  __$$<      $$ |
  // $$\   $$ |     $$ |      $$ |  $$ |   $$ |  $$ |     $$ |
  // \$$$$$$  |     $$ |      $$ |  $$ |   $$ |  $$ |     $$ |
  //  \______/      \__|      \__|  \__|   \__|  \__|     \__|
  //
  process.env.NODE_ENV === 'development' && {
    mode: 'development',
    // a good compromise betwee fast and readable sourcemaps
    devtool: 'cheap-module-source-map',
    devServer: {
      host: HOST,
      port: PORT,
      public: urls.lanUrlForConfig,
      publicPath: '/',
      contentBase: './public/',
      // trigger reload when files in contentBase folder change
      watchContentBase: true,
      // but don't watch node_modules
      watchOptions: {
        ignored: /node_modules/,
      },
      // serve everything in gzip
      compress: true,
      // Sssh...
      quiet: true,
      clientLogLevel: 'none',
      // uncomment these lines to enable HMR
      // hot: true,
      // hotOnly: true,
      after() {
        // try to open into the already existing tab
        openBrowser(urls.localUrlForBrowser)
      },
    },
    plugins: [
      // Automatic rediscover of packages after `npm install`
      new WatchMissingNodeModulesPlugin('node_modules'),
      // TODO use webpack's api when it will be implemented
      // https://github.com/webpack/webpack-dev-server/issues/1509
      new EventHooksPlugin({
        // debounced because it gets called two times somehow
        beforeCompile: _.debounce(() => {
          console.clear()
          console.log('⏳ Compiling...')
        }, 0),
        done(stats) {
          if (stats.hasErrors()) {
            const statsJson = stats.toJson({ all: false, warnings: true, errors: true })
            const messages = formatWebpackMessages(statsJson)
            console.clear()
            console.log(chalk.red('❌ Failed to compile.'))
            console.log()
            console.log(messages.errors[0])
            return
          }

          const time = prettyMs(stats.endTime - stats.startTime)
          console.clear()
          console.log(chalk.green(`✅ Compiled successfully in ${chalk.cyan(time)}`))
          console.log()
          console.log(`  ${chalk.bold(`Local`)}:           ${chalk.cyan(urls.localUrlForTerminal)}`)
          console.log(`  ${chalk.bold(`On your network`)}: ${chalk.cyan(urls.lanUrlForTerminal)}`)
        },
      }),
    ],
  },
  //
  // $$$$$$$\     $$\   $$\    $$$$$$\    $$\          $$$$$$$\
  // $$  __$$\    $$ |  $$ |   \_$$  _|   $$ |         $$  __$$\
  // $$ |  $$ |   $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
  // $$$$$$$\ |   $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
  // $$  __$$\    $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
  // $$ |  $$ |   $$ |  $$ |     $$ |     $$ |         $$ |  $$ |
  // $$$$$$$  |   \$$$$$$  |   $$$$$$\    $$$$$$$$\    $$$$$$$  |
  // \_______/     \______/    \______|   \________|   \_______/
  //
  process.env.NODE_ENV === 'production' && {
    mode: 'production',
    devtool: 'source-map',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'app.[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].chunk.js',
      // change this if you're deploying on a subfolder
      publicPath: '',
    },
    plugins: [
      // TODO use webpack's api when it will be implemented
      // https://github.com/webpack/webpack-dev-server/issues/1509
      new EventHooksPlugin({
        // debounced because it gets called two times somehow
        beforeCompile: _.debounce(() => {
          console.log('⏳ Compiling...')
        }, 0),
        done(stats) {
          if (stats.hasErrors()) {
            const statsJson = stats.toJson({ all: false, warnings: true, errors: true })
            const messages = formatWebpackMessages(statsJson)
            console.log(chalk.red('❌ Failed to compile.'))
            console.log()
            console.log(messages.errors[0])
          }
        },
        afterEmit() {
          console.log(chalk.green(`✅ Compiled successfully!`))
          console.log(`The folder ${chalk.bold(`build/`)} is ready to be deployed`)
          console.log()

          try {
            const tree = execSync('tree --du -h --dirsfirst build/').toString()
            console.log(beautifyTree(tree))
          } catch (e) {
            console.log(
              chalk.yellow(
                `⚠️ Homerew and the tree package are required for the file tree output,`
              ),
              `please install them with the following command:`
            )
            console.log()
            console.log(
              chalk.cyan(
                `  /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" && brew install tree`
              )
            )
          }

          console.log()
        },
      }),
    ],
    optimization: {
      minimizer: [
        new TerserJsPlugin({
          terserOptions: {
            parse: {
              // we want uglify-js to parse ecma 8 code. However, we don't want it
              // to apply any minfication steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
            },
            output: {
              ecma: 5,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
          parallel: true,
          cache: true,
          sourceMap: true,
        }),
      ],
    },
  }
)
