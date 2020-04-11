// concept mostly taken from here: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7

import * as THREE from 'three';
import glslify from 'glslify';
import fullScreenTriFrag from './../shaders/fullScreenTri.frag';
import fullScreenTriVert from './../shaders/fullScreenTri.vert';

export default class RenderTri {
  constructor(scene, renderer, bgRenderTarget, pane, PARAMS) {
    this.scene = scene;
    this.renderer = renderer;
    this.bgRenderTarget = bgRenderTarget;
    this.pane = pane;
    this.PARAMS = PARAMS;

    const resolution = new THREE.Vector2();
    this.renderer.getDrawingBufferSize(resolution);

    this.RenderTriTarget = new THREE.WebGLRenderTarget(
      resolution.x,
      resolution.y,
      {
        format: THREE.RGBFormat,
        stencilBuffer: false,
        depthBuffer: true
      }
    );

    this.triMaterial = new THREE.RawShaderMaterial({
      fragmentShader: glslify(fullScreenTriFrag),
      vertexShader: glslify(fullScreenTriVert),
      uniforms: {
        uScene: {
          type: 't',
          value: this.bgRenderTarget.texture
        },
        uResolution: { value: resolution },
        uTime: {
          value: 0.0
        },
        caAtten: {
          value: 0.0
        },
        cmykAtten: {
          value: 0.0
        }
      }
    });

    let renderTri = new THREE.Mesh(
      this.returnRenderTriGeometry(),
      this.triMaterial
    );
    renderTri.frustumCulled = false;

    this.scene.add(renderTri);

    this.addEvent();

    this.addGUI();
  }

  addGUI() {
    this.PARAMS.caAtten = 0;
    this.PARAMS.cmykAtten = 0;

    this.pane.addInput(this.PARAMS, 'caAtten', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.caAtten.value = value;
    });

    this.pane.addInput(this.PARAMS, 'cmykAtten', {
      min: 0.0,
      max: 1.0
    }).on('change', value => {
      this.triMaterial.uniforms.cmykAtten.value = value;
    });
  }

  addEvent() {
    // document.addEventListener
  }

  returnRenderTriGeometry() {
    const geometry = new THREE.BufferGeometry();

    // triangle in clip space coords
    const vertices = new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]);

    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 2));

    return geometry;
  }
}
