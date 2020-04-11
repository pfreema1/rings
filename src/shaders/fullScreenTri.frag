precision highp float;
uniform sampler2D uScene;
uniform sampler2D uMouseCanvas;
uniform sampler2D uTextCanvas;
uniform vec2 uResolution;
uniform float uTime;
uniform float caAtten;
uniform float cmykAtten;

//https://gist.github.com/aferriss/9be46b6350a08148da02559278daa244
//use like: vec3 col = finalLevels(someTex.rgb, 34.0/255.0, 1.5, 235.0/255.0);
vec3 gammaCorrect(vec3 color, float gamma){
    return pow(color, vec3(1.0/gamma));
}

vec3 levelRange(vec3 color, float minInput, float maxInput){
    return min(max(color - vec3(minInput), vec3(0.0)) / (vec3(maxInput) - vec3(minInput)), vec3(1.0));
}

vec3 finalLevels(vec3 color, float minInput, float gamma, float maxInput){
    return gammaCorrect(levelRange(color, minInput, maxInput), gamma);
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

// https://gist.github.com/mattdesl/e40d3189717333293813626cbdb2c1d1
vec4 RGBtoCMYK (vec3 rgb) {
    float r = rgb.r;
    float g = rgb.g;
    float b = rgb.b;
    float k = min(1.0 - r, min(1.0 - g, 1.0 - b));
    vec3 cmy = vec3(0.0);
    float invK = 1.0 - k;
    if (invK != 0.0) {
        cmy.x = (1.0 - r - k) / invK;
        cmy.y = (1.0 - g - k) / invK;
        cmy.z = (1.0 - b - k) / invK;
    }
    return clamp(vec4(cmy, k), 0.0, 1.0);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 offsetUv = uv;
    // offsetUv.y = 1.0 - offsetUv.y;
    offsetUv.x = 1.0 - offsetUv.x;

    vec4 color = vec4(0.0);

    vec4 sceneColor = texture2D(uScene, uv);
    vec4 offsetColor = texture2D(uScene, offsetUv);

    float offset = 0.005 * caAtten;
    float ca1 = texture2D(uScene, vec2(uv.x + offset, uv.y + offset)).r;
    float ca2 = texture2D(uScene, vec2(uv.x - offset, uv.y - offset)).r;
    float ca3 = texture2D(uScene, vec2(uv.x, uv.y)).r;

    vec3 caColor = vec3(ca1, ca2, ca3);

    // make white part have a little reflection look
    color = mix(sceneColor, offsetColor, 0.01 * sceneColor.r);

    color.rgb = mix(color.rgb, caColor, 1.0);

    // color = sceneColor;
    vec4 cmykColor = RGBtoCMYK(color.rgb);
    
    color = mix(color, cmykColor, cmykAtten);
    // gl_FragColor = RGBtoCMYK(color.rgb);
    gl_FragColor = vec4(color);
}