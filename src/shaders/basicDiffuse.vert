#pragma glslify: inverse = require(glsl-inverse)
#pragma glslify: transpose = require(glsl-transpose)

varying vec3 vNormal;
varying vec3 fragPos;
varying vec2 vUv;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

const float PI = 3.14159265359;

void main() {
  vUv = uv;
  
  vNormal = mat3(transpose(inverse(modelMatrix))) * normal;

  fragPos = vec3(modelMatrix * vec4(position, 1.0));


  /**********************************/
  vec3 offsetPos = position;

  float v = map(uv.y, 0.0, 1.0, 0.0, PI);

  offsetPos.z = sin(v) * -8.0;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(offsetPos,1.0);
}