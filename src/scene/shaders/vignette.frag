#pragma glslify: vignette = require('glsl-vignette')

uniform sampler2D tDiffuse;
uniform float radius;
uniform float smoothness;

in vec2 vUv;

void main() {
  vec4 texColor = texture(tDiffuse, vUv);

  float vignetteValue = vignette(vUv, radius, smoothness);
  texColor.rgb *= vignetteValue;

  gl_FragColor = texColor;
}
