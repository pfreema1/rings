import * as THREE from 'three';
import glslify from 'glslify';
import fitPlaneToScreen from './utils/fitPlaneToScreen';
import ringsFrag from '../shaders/rings.frag';
import basicDiffuseVert from '../shaders/basicDiffuse.vert';

export default class Rings {
    constructor(bgScene, bgCamera) {
        this.bgScene = bgScene;
        this.bgCamera = bgCamera;
        this.NUM_RINGS = 1;
        this.rings = [];
        this.MOVEMENT_RADIUS = 6;

        this.dims = fitPlaneToScreen(this.bgCamera, 0, window.innerWidth, window.innerHeight);

        this.initPlane();
    }

    initPlane() {
        this.geo = new THREE.PlaneBufferGeometry(this.dims.width, this.dims.height, 128, 128);
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0.0
                },
                uResolution: {
                    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                }
            },
            vertexShader: glslify(basicDiffuseVert),
            fragmentShader: glslify(ringsFrag)
        });

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.mesh.position.z = 0;
        this.mesh.scale.x = 3;
        this.bgScene.add(this.mesh);
    }

    update(time) {
        this.mat.uniforms.uTime.value = time;
    }
}
