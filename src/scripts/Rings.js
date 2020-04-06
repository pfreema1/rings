import * as THREE from 'three';
import glslify from 'glslify';
import fitPlaneToScreen from './utils/fitPlaneToScreen';

export default class Rings {
    constructor(bgScene, bgCamera) {
        this.bgScene = bgScene;
        this.bgCamera = bgCamera;
        this.NUM_RINGS = 1;
        this.rings = [];
        this.MOVEMENT_RADIUS = 6;

        this.dims = fitPlaneToScreen(this.bgCamera, 0, window.innerWidth, window.innerHeight);

        this.initMeshes();
    }

    initMeshes() {
        for (let i = 0; i < this.NUM_RINGS; i++) {
            this.size = Math.max(this.dims.width, this.dims.height);
            const geo = new THREE.RingBufferGeometry(0.95 * this.size, this.size, 30, 1, 0, 6.3);
            const mat = new THREE.MeshBasicMaterial({ color: 0xECBDF1, side: THREE.DoubleSide });

            const mesh = new THREE.Mesh(geo, mat);
            this.bgScene.add(mesh);
            this.rings.push(mesh);
        }
    }

    updateRing(i, time) {
        const mesh = this.rings[i];

        mesh.position.y = -this.MOVEMENT_RADIUS * Math.sin(time * 2 + i);
        mesh.position.z = this.MOVEMENT_RADIUS * Math.cos(time * 2 + i);

        // mesh.rotation.x = -(2 * Math.PI * 2) * time + i;
    }

    update(time) {
        time *= 0.1;

        for (let i = 0; i < this.NUM_RINGS; i++) {
            this.updateRing(i, time);
        }
    }
}