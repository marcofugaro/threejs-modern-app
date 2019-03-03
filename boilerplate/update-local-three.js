#!/usr/bin/env node
const fs = require('fs-extra')
const glob = require('glob')
const outdent = require('outdent')

const THREE_PATH = './node_modules/three/examples/js'
const LOCAL_PATH = './src/lib/three'
const DEPS = {
  RenderPass: ['Pass'],
  ShaderPass: ['Pass'],
  EffectComposer: ['CopyShader', 'ShaderPass'],
}

const localFiles = fs.readdirSync(LOCAL_PATH)

function addDep(dep) {
  return outdent`
    import { ${dep} } from './${dep}'
    THREE.${dep} = ${dep}
  `
}

localFiles.forEach(file => {
  const threeFile = glob.sync(`${THREE_PATH}/**/${file}`)[0]

  if (!threeFile) {
    return
  }

  const name = file.slice(0, file.indexOf('.js'))
  const deps = DEPS[name] ? DEPS[name].map(addDep).join('\n') : ''
  const contents = fs.readFileSync(threeFile, 'utf8')

  const localFile = outdent`
    import * as THREE from 'three'
    ${deps}

    ${contents}

    export const ${name} = THREE.${name}
  `

  console.log(`Writing ${file}`)
  fs.writeFileSync(`${LOCAL_PATH}/${file}`, localFile)
})
