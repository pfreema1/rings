// https://www.shadertoy.com/view/Xsl3RX

precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 offsetUv = uv;

    // offsetUv.x = sin(map(uv.x, 0.0, 1.0, 0.0, 1.5) * map(uv.y, 0.0, 1.0, -0.3, 1.5));
    // offsetUv.y = cos(uv.y * uv.x);

    float dist = distance(offsetUv, vec2(0.5, 0.5));
    float rings = 20.0;
    float velocity = 0.5;
    float b = 0.003;  // size of smoothed border
    
    float offset = uTime * velocity;
    
    float v = dist * rings - offset;
    float ringr = floor(v);
    float val = float(fract(v) > 0.5);
    float ssval = abs(dist - (ringr + val + offset) / rings);
    float color = smoothstep(-b, b, ssval);

    if(mod(ringr, 2.0) == 1.0) {
        color = 1. - color;
    }
    
    gl_FragColor = vec4(color);
}