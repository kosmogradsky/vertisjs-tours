import * as ThreeJS from './three.js';

const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0px';
canvas.style.left = '0px';

const scene = new ThreeJS.Scene();
const camera = new ThreeJS.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 200);

const renderer = new ThreeJS.WebGLRenderer({
    canvas,
    antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

const lookingAt = {
    theta: 0,
    phi: 0,
    needsUpdate: false
};

function render() {
    if (lookingAt.needsUpdate) {
        const camsph = new ThreeJS.Spherical().setFromVector3(new ThreeJS.Vector3(0, 0, -1));
        camsph.theta += lookingAt.theta;
        camsph.phi -= lookingAt.phi;
        camera.lookAt(new ThreeJS.Vector3().setFromSpherical(camsph));

        lookingAt.needsUpdate = false;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);

const loader = new ThreeJS.TextureLoader();
const texture = loader.load('texture.png');
texture.colorSpace = ThreeJS.SRGBColorSpace;

const sphereMaterial = new ThreeJS.MeshBasicMaterial({
    side: ThreeJS.BackSide,
    map: texture,
});
const sphereGeometry = new ThreeJS.SphereGeometry(1, 90, 90);
const sphereMesh = new ThreeJS.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.scale.x = -1;

scene.add(sphereMesh);

const dragHandler = {
    isDragging: false,
    handleEvent(e) {
        if (e.type === 'mousedown') {
           this.isDragging = true; 
        }

        if (this.isDragging && e.type === 'mousemove') {
            lookingAt.theta += e.movementX / 720 * Math.PI;
            lookingAt.phi += e.movementY / 720 * Math.PI;
            lookingAt.phi = Math.max(-90 / 180 * Math.PI, Math.min((90 - 0.001) / 180 * Math.PI, lookingAt.phi));
            lookingAt.needsUpdate = true;
        }

        if (e.type === 'mouseup' || e.type === 'mouseleave') {
            this.isDragging = false;
        }
    }
};
canvas.addEventListener('mousedown', dragHandler);
canvas.addEventListener('mousemove', dragHandler);
canvas.addEventListener('mouseup', dragHandler);
document.body.addEventListener('mouseleave', dragHandler);

document.body.appendChild(canvas);