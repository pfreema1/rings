import * as THREE from 'three';
import glslify from 'glslify';
import fitPlaneToScreen from './utils/fitPlaneToScreen';
import ringsFrag from '../shaders/rings.frag';
import basicDiffuseVert from '../shaders/basicDiffuse.vert';
import TweenMax from 'TweenMax';
import GLTFLoader from 'three-gltf-loader';
import { Loader } from 'three';

function CustomSinCurve(scale) {

    THREE.Curve.call(this);

    this.scale = (scale === undefined) ? 1 : scale;

}

CustomSinCurve.prototype = Object.create(THREE.Curve.prototype);
CustomSinCurve.prototype.constructor = CustomSinCurve;

CustomSinCurve.prototype.getPoint = function (t) {

    var tx = t * 6 - 3;
    var ty = Math.sin(2 * Math.PI * t);
    var tz = 0; //Math.cos(0.5 * Math.PI * t);

    return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale);

};


export default class Rings {
    constructor(bgScene, bgCamera, pane, PARAMS) {
        this.bgScene = bgScene;
        this.bgCamera = bgCamera;
        this.NUM_RINGS = 1;
        this.rings = [];
        this.MOVEMENT_RADIUS = 6;
        this.pane = pane;
        this.PARAMS = PARAMS;

        this.init();

        this.addGUI();
    }

    addGUI() {
        this.PARAMS.timeAtten = 0.7;
        this.PARAMS.offsetAtten = 0.0;
        this.PARAMS.vertWobble = 0.0;

        this.pane.addInput(this.PARAMS, 'timeAtten', {
            min: 0.0,
            max: 3.0
        }).on('change', value => {
            this.mat.uniforms.timeAtten.value = value;
        });

        this.pane.addInput(this.PARAMS, 'offsetAtten', {
            min: -1.0,
            max: 1.0
        }).on('change', value => {
            this.mat.uniforms.offsetAtten.value = value;
        });

        this.pane.addInput(this.PARAMS, 'vertWobble', {
            min: -5.0,
            max: 5.0
        }).on('change', value => {
            this.mat.uniforms.vertWobble.value = value;
        })
    }

    async init() {
        await this.loadMesh();

        this.dims = fitPlaneToScreen(this.bgCamera, 0, window.innerWidth, window.innerHeight);

        this.initMaterial();

        // this.addEvent();
    }

    loadMesh() {
        return new Promise((res, rej) => {
            this.loader = new GLTFLoader();

            this.loader.load('./mesh.glb', object => {

                this.mesh = object.scene.children[0];

                res();
            })
        });
    }

    addEvent() {
        document.addEventListener('click', () => {
            TweenMax.fromTo(this.mat.uniforms.timeMulti, 0.4, {
                value: 1.2
            }, {
                value: 1.0,
                ease: Power3.easeInOut,
            });

            // TweenMax.fromTo(this.mat.uniforms.timeMulti, 0.4, {
            //     value: 1.0
            // }, {
            //     value: 0.0,
            //     delay: 0.4,
            //     ease: Power3.easeInOut,
            // });
        });
    }



    initMaterial() {
        // this.geo = new THREE.PlaneBufferGeometry(this.dims.width, this.dims.height, 128, 128);
        // this.geo = new THREE.ParametricBufferGeometry(this.paraFunction, 120, 120);
        // this.geo = new THREE.SphereBufferGeometry(3, 128, 128);

        var path = new CustomSinCurve(10);
        this.geo = new THREE.TubeBufferGeometry(path, 128, 8, 128, false);
        this.mat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0.0
                },
                uResolution: {
                    value: new THREE.Vector2(window.innerWidth, window.innerHeight)
                },
                timeAtten: {
                    value: 0.7
                },
                offsetAtten: {
                    value: 0.0
                },
                vertWobble: {
                    value: 0.0
                }
            },
            vertexShader: glslify(basicDiffuseVert),
            fragmentShader: glslify(ringsFrag)
        });
        this.mat.side = THREE.DoubleSide;

        this.mesh = new THREE.Mesh(this.geo, this.mat);
        this.mesh.material = this.mat;
        this.mesh.material.needsUpdate = true;

        this.mesh.scale.set(3, 3, 3);

        this.bgScene.add(this.mesh);
    }

    paraFunction(u, v, target) {
        // klein - supa coo
        u *= Math.PI;
        v *= 2 * Math.PI;

        u = u * 2;
        var x, y, z;
        if (u < Math.PI) {
            x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(u) * Math.cos(v);
            z = -8 * Math.sin(u) - 2 * (1 - Math.cos(u) / 2) * Math.sin(u) * Math.cos(v);
        } else {
            x = 3 * Math.cos(u) * (1 + Math.sin(u)) + (2 * (1 - Math.cos(u) / 2)) * Math.cos(v + Math.PI);
            z = -8 * Math.sin(u);
        }

        y = -2 * (1 - Math.cos(u) / 2) * Math.sin(v);

        target.set(x, y, z);

    }

    update(time) {
        if (this.mat) {
            this.mat.uniforms.uTime.value = time;
        }
    }
}
