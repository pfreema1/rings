import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';
import glslify from 'glslify';
import Tweakpane from 'tweakpane';
import OrbitControls from 'three-orbitcontrols';
import TweenMax from 'TweenMax';
import baseDiffuseFrag from '../../shaders/basicDiffuse.frag';
import basicDiffuseVert from '../../shaders/basicDiffuse.vert';
import RenderTri from '../RenderTri';
import { debounce } from '../utils/debounce';
import Rings from '../Rings';

// post processing
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { AfterimagePass } from 'three/examples/jsm/postprocessing/SSAARenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';

export default class WebGLView {
  constructor(app) {
    this.app = app;
    this.PARAMS = {
    };

    this.init();
  }

  async init() {
    this.initThree();
    this.initBgScene();
    this.initLights();
    this.initTweakPane();
    this.initMouseMoveListen();
    this.initRenderTri();
    this.initPostProcessing();
    this.initResizeHandler();

    this.initRings();

    this.addEvents();
  }

  addEvents() {
    this.clickCount = 0;

    document.addEventListener('click', this.randomizeSettings.bind(this))
  }

  initRings() {
    this.rings = new Rings(this.bgScene, this.bgCamera, this.pane, this.PARAMS);
  }

  initResizeHandler() {
    window.addEventListener(
      'resize',
      debounce(() => {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.renderer.setSize(this.width, this.height);

        // render tri
        this.renderTri.renderer.setSize(this.width, this.height);
        this.renderTri.triMaterial.uniforms.uResolution.value = new THREE.Vector2(
          this.width,
          this.height
        );

        // bg scene
        this.bgRenderTarget.setSize(this.width, this.height);
        this.bgCamera.aspect = this.width / this.height;
        this.bgCamera.updateProjectionMatrix();


        // composer
        this.composer.setSize(this.width, this.height);
      }, 500)
    );
  }

  initPostProcessing() {
    this.composer = new EffectComposer(this.renderer);

    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // after image
    // this.afterimagePass = new AfterimagePass();
    // this.composer.addPass(this.afterimagePass);

    // anti aliasing
    this.ssaaRenderPass = new SSAARenderPass(this.scene, this.camera);
    this.ssaaRenderPass.unbiased = false;
    this.composer.addPass(this.ssaaRenderPass);

    this.copyPass = new ShaderPass(CopyShader);
    this.composer.addPass(this.copyPass);


  }

  initTweakPane() {
    this.pane = new Tweakpane();

    this.PARAMS.camPos = true;
    this.startingCamPos = this.bgCamera.position;

    this.pane.addInput(this.PARAMS, 'camPos').on('change', value => {
      console.log(value);
      if (!value) {
        this.bgCamera.position.set(-45.907, 26.548, 0.932);
        this.controls.update();
      } else {
        this.bgCamera.position.set(68.1257, -33.566, 0.8802);
        this.controls.update();
      }
    });

    this.pane.addButton({
      title: 'New Cam Pos'
    }).on('click', value => {
      const range = 100;
      const offset = range / 2;
      this.bgCamera.position.set(
        Math.random() * range - offset,
        Math.random() * range - offset,
        Math.random() * range - offset,
      );
      this.controls.update();
    });

    this.pane.addButton({
      title: 'Randomize All'
    }).on('click', value => {
      this.randomizeSettings();
    });
  }

  randomizeSettings() {
    this.clickCount++;

    // new pos - make it more likely to place the camera inside tube
    const range = this.clickCount % 4 === 0 ? 50 : 100;
    const offset = range / 2;
    this.bgCamera.position.set(
      Math.random() * range - offset,
      Math.random() * range - offset,
      Math.random() * range - offset,
    );
    this.controls.update();

    // new caAtten
    this.renderTri.triMaterial.uniforms.caAtten.value = this.PARAMS.caAtten = Math.random() < 0.5 ? 0.0 : 1.0;

    // new cmykAtten
    this.renderTri.triMaterial.uniforms.cmykAtten.value = this.PARAMS.cmykAtten = Math.random();

    // new vertWobble
    this.rings.mat.uniforms.vertWobble.value = Math.random() * 4 - 2;

    this.pane.refresh();
  }


  initMouseMoveListen() {
    this.mouse = new THREE.Vector2();
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    window.addEventListener('mousemove', ({ clientX, clientY }) => {
      this.mouse.x = clientX; //(clientX / this.width) * 2 - 1;
      this.mouse.y = clientY; //-(clientY / this.height) * 2 + 1;

    });
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.OrthographicCamera();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.autoClear = true;

    this.clock = new THREE.Clock();
  }


  initRenderTri() {
    this.resize();

    this.renderTri = new RenderTri(
      this.scene,
      this.renderer,
      this.bgRenderTarget,
      this.pane,
      this.PARAMS
    );
  }

  initBgScene() {
    this.bgRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );
    this.bgCamera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      500
    );
    this.controls = new OrbitControls(this.bgCamera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;

    // this.bgCamera.position.z = 3;
    // this.bgCamera.position.x = 15;
    // this.bgCamera.position.y = 7;
    this.bgCamera.position.set(68.1257, -33.566, 0.8802);
    // this.bgCamera.lookAt(new THREE.Vector3(10, 15, 0));
    this.controls.update();

    this.bgScene = new THREE.Scene();
  }

  initLights() {
    this.pointLight = new THREE.PointLight(0xff0000, 1, 100);
    this.pointLight.position.set(0, 0, 50);
    this.bgScene.add(this.pointLight);
  }

  resize() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.fovHeight =
      2 *
      Math.tan((this.camera.fov * Math.PI) / 180 / 2) *
      this.camera.position.z;
    this.fovWidth = this.fovHeight * this.camera.aspect;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.trackball) this.trackball.handleResize();
  }

  update() {
    const delta = this.clock.getDelta();
    const time = performance.now() * 0.0005;

    this.controls.update();


    // console.log("update -> this.bgCamera.position", this.bgCamera.position)


    if (this.renderTri) {
      this.renderTri.triMaterial.uniforms.uTime.value = time;
    }

    if (this.rings) {
      this.rings.update(time);
    }

    if (this.trackball) this.trackball.update();
  }

  draw() {

    this.renderer.setRenderTarget(this.bgRenderTarget);
    this.renderer.render(this.bgScene, this.bgCamera);
    this.renderer.setRenderTarget(null);

    this.renderer.render(this.scene, this.camera);

    if (this.composer) {
      this.ssaaRenderPass.sampleLevel = 0;

      this.composer.render();
    }
  }
}
