export function monkeyPatch(
  shader,
  { defines = '', head = '', main = '', objectNormal, transformed, ...replaces }
) {
  let patchedShader = shader

  const replaceAll = (str, find, rep) => str.split(find).join(rep)
  Object.keys(replaces).forEach((key) => {
    patchedShader = replaceAll(patchedShader, key, replaces[key])
  })

  patchedShader = patchedShader.replace(
    'void main() {',
    `
    ${head}
    void main() {
      ${main}
    `
  )

  if (transformed && patchedShader.includes('#include <begin_vertex>')) {
    patchedShader = patchedShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      ${transformed}
      `
    )
  }

  if (objectNormal && patchedShader.includes('#include <beginnormal_vertex>')) {
    patchedShader = patchedShader.replace(
      '#include <beginnormal_vertex>',
      `#include <beginnormal_vertex>
      ${objectNormal}
      `
    )
  }

  const stringDefines = Object.keys(defines)
    .map((d) => `#define ${d} ${defines[d]}`)
    .join('\n')

  return `
    ${stringDefines}
    ${patchedShader}
  `
}
