import * as ThreeJS from './three.js';

let currentId = 0;

const data = {
    panoramas: [
        {
            id: 0,
            url: 'texture0.png',
            pointers: [
                {
                    destinationPanoramaId: 2,
                    x: 0.6,
                    y: 0,
                    z: -0.4,
                },
                {
                    destinationPanoramaId: 1,
                    x: -0.3,
                    y: 0,
                    z: -0.7,
                }
            ]
        },
        {
            id: 1,
            url: 'texture1.png',
            pointers: [
                {
                    destinationPanoramaId: 0,
                    x: -0.6,
                    y: 0,
                    z: 0.8,
                },
                {
                    destinationPanoramaId: 3,
                    x: 1,
                    y: 0,
                    z: 0.1,
                }
            ]
        }
    ],
};

let pointers = data.panoramas[0].pointers;

const canvas = document.createElement('canvas');
canvas.style.position = 'fixed';
canvas.style.top = '0px';
canvas.style.left = '0px';

const uidiv = document.createElement('div');
uidiv.style.position = 'fixed';
uidiv.style.top = '0px';
uidiv.style.left = '0px';

const scene = new ThreeJS.Scene();
const camera = new ThreeJS.PerspectiveCamera(
    90, // Поле зрения (field of view, FOV)
    window.innerWidth / window.innerHeight, // Соотношение сторон (aspect ratio)
    0.1, // Ближняя плоскость отсечения (near clipping plane)
    200 // Дальняя плоскость отсечения (far clipping plane)
);

const OMNIVEC = new ThreeJS.Vector3();
function alignArrowImg(pointer) {
    OMNIVEC.x = pointer.x;
    OMNIVEC.y = pointer.y;
    OMNIVEC.z = pointer.z;
    OMNIVEC.project(camera);
    OMNIVEC.x = (OMNIVEC.x + 1) * window.innerWidth / 2;
    OMNIVEC.y = (-OMNIVEC.y + 1) * window.innerHeight / 2;

    pointer.element.style.translate = `${ OMNIVEC.x }px ${ OMNIVEC.y }px`;
    pointer.element.style.visibility = OMNIVEC.z <= 1 ? 'visible' : 'hidden';
}

function createArrowImg(pointer) {
    pointer.element = document.createElement('img');
    pointer.element.src = './point.svg';
    pointer.element.classList.add('arrow-img');
    pointer.element.dataset.destinationId = pointer.destinationPanoramaId;
    uidiv.appendChild(pointer.element);
}

function allocatePointers() {
    for (const pointer of pointers) {
        createArrowImg(pointer);
        alignArrowImg(pointer);
    }
}
allocatePointers();

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

let pointersNeedUpdate = false;
const lookingAt = {
    theta: 0,
    phi: 0,
    needsUpdate: false
};

function render() {
    if (lookingAt.needsUpdate) {
        const sphericalDirection = new ThreeJS.Spherical().setFromVector3(new ThreeJS.Vector3(0, 0, -1));
        sphericalDirection.theta += lookingAt.theta;
        sphericalDirection.phi -= lookingAt.phi;
        camera.lookAt(new ThreeJS.Vector3().setFromSpherical(sphericalDirection));

        lookingAt.needsUpdate = false;
        pointersNeedUpdate = true;
    }

    renderer.render(scene, camera);

    if (pointersNeedUpdate) {
        for (const pointer of pointers) {
            alignArrowImg(pointer);
        }

        pointersNeedUpdate = false;
    }

    requestAnimationFrame(render);
}
requestAnimationFrame(render);

const loader = new ThreeJS.TextureLoader();
const texture = loader.load('texture0.png');
texture.colorSpace = ThreeJS.SRGBColorSpace;

const sphereMaterial = new ThreeJS.MeshBasicMaterial({
    side: ThreeJS.BackSide,
    map: texture,
});
const sphereGeometry = new ThreeJS.SphereGeometry(1, 90, 90);
const sphereMesh = new ThreeJS.Mesh(sphereGeometry, sphereMaterial);
sphereMesh.scale.x = -1;

scene.add(sphereMesh);

const LOWER_LIMIT = -90 / 180 * Math.PI;
const HIGHER_LIMIT = (90 - 0.001) / 180 * Math.PI;
const PAN_SPEED_FACTOR = 4;
let isDragging = false;
const handleMousemove = (e) => {
    if (isDragging) {
        lookingAt.theta += e.movementX / PAN_SPEED_FACTOR * ThreeJS.MathUtils.DEG2RAD;
        lookingAt.phi += e.movementY / PAN_SPEED_FACTOR * ThreeJS.MathUtils.DEG2RAD;
        lookingAt.phi = Math.max(
            LOWER_LIMIT,
            Math.min(HIGHER_LIMIT, lookingAt.phi)
        );
        lookingAt.needsUpdate = true;
    }
};

const startDragging = () => { isDragging = true };
const endDragging = () => { isDragging = false };
canvas.addEventListener('mousedown', startDragging);
canvas.addEventListener('mousemove', handleMousemove);
canvas.addEventListener('mouseup', endDragging);
document.body.addEventListener('mouseleave', endDragging);

document.body.appendChild(canvas);
document.body.appendChild(uidiv);

function reloadTexture(e) {
    const destinationId = e.target.dataset.destinationId;
    const destination = data.panoramas.find(
        panorama => panorama.id.toString() === destinationId
    );
    
    const texture = loader.load(destination.url);
    texture.colorSpace = ThreeJS.SRGBColorSpace;

    sphereMaterial.map = texture;
    currentId = destinationId;
}

function reallocatePointers() {
    for (const pointer of pointers) {
        pointer.element.remove();
        delete pointer.element;
    }

    pointers = data.panoramas[currentId].pointers;

    allocatePointers();
}

uidiv.addEventListener('click', (e) => {
    reloadTexture(e);
    reallocatePointers(e);
});