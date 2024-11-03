// Import three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { PointerLockControls } from './src/PointerLockControls.js';
import { GLTFLoader } from './src/GLTFLoader.js';


// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Loader to load models
const loader = new GLTFLoader();

// ---------------------------------------- Section: Welcome ---------------------------------------- //

// Ensure this function runs after the scene has loaded or a delay
function fadeOutOverlay() {
    const overlay = document.getElementById("welcomeOverlay");
    overlay.style.opacity = '0'; // Trigger CSS transition to fade out

    // Remove overlay from display after fade-out completes
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 1000); // 2 seconds matches the transition time
}

// Call this function once your scene is ready to display
setTimeout(fadeOutOverlay, 3000); // Adjust timing as needed


// ---------------------------------------- Section: Gallery layout ---------------------------------------- //

// Setup the scene & camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadow maps for the renderer
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use PCF Soft Shadows for better quality
document.getElementById("gallery").appendChild(renderer.domElement);

// Add a basic cube as a placeholder
// const geometry = new THREE.BoxGeometry();
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
// const cube = new THREE.Mesh(geometry, material);
// scene.add(cube);
// cube.position.set(0, 2, 0);

// Define outer gallery bounds first (floor, outer walls)
const galleryWidth = 30;
const galleryHeight = 6;
const galleryDepth = 35;

// -------------- Gallery Textures -------------- //

// Create a texture loader
const textureLoader = new THREE.TextureLoader();

// Load each texture from your file paths
const woodTexture = textureLoader.load('./models/textures/gallery/WoodFloor039_1K-JPG_Color.jpg');           // Base color texture
const woodNormalTexture = textureLoader.load('./models/textures/gallery/WoodFloor039_1K-JPG_NormalGL.jpg');    // Normal map
const woodAOTexture = textureLoader.load('./models/textures/gallery/WoodFloor039_1K-JPG_AmbientOcclusion.jpg');            // Ambient Occlusion map
const woodRoughnessTexture = textureLoader.load('./models/textures/gallery/WoodFloor039_1K-JPG_Roughness.jpg'); // Roughness map

const concreteTexture = textureLoader.load('./models/textures/gallery/Plaster002_1K-JPG_Color.jpg');           // Base color texture
const concreteNormalTexture = textureLoader.load('./models/textures/gallery/Plaster002_1K-JPG_NormalDX.jpg');    // Normal map
const concreteAOTexture = textureLoader.load('./models/textures/gallery/Plaster-AmbientOcclusionMap.jpg');            // Ambient Occlusion map
const concreteRoughnessTexture = textureLoader.load('./models/textures/gallery/Plaster002_1K-JPG_Roughness.jpg'); // Roughness map

// Set texture wrapping and repeat as needed
woodTexture.wrapS = THREE.RepeatWrapping;
woodTexture.wrapT = THREE.RepeatWrapping;
woodNormalTexture.wrapS = THREE.RepeatWrapping;
woodNormalTexture.wrapT = THREE.RepeatWrapping;
woodAOTexture.wrapS = THREE.RepeatWrapping;
woodAOTexture.wrapT = THREE.RepeatWrapping;
woodRoughnessTexture.wrapS = THREE.RepeatWrapping;
woodRoughnessTexture.wrapT = THREE.RepeatWrapping;

concreteTexture.wrapS = THREE.RepeatWrapping;
concreteTexture.wrapT = THREE.RepeatWrapping;
concreteNormalTexture.wrapS = THREE.RepeatWrapping;
concreteNormalTexture.wrapT = THREE.RepeatWrapping;
concreteAOTexture.wrapS = THREE.RepeatWrapping;
concreteAOTexture.wrapT = THREE.RepeatWrapping;
concreteRoughnessTexture.wrapS = THREE.RepeatWrapping;
concreteRoughnessTexture.wrapT = THREE.RepeatWrapping;

// -------------- Create Floor -------------- //


// Scale the textures to match the floor dimensions if needed
woodTexture.repeat.set(10, 10);         // Repeat the texture to fit the floor
woodNormalTexture.repeat.set(10, 10);
woodAOTexture.repeat.set(10, 10);
woodRoughnessTexture.repeat.set(10, 10);

// Create floor material
const floorMaterial = new THREE.MeshStandardMaterial({
    map: woodTexture,               // Base color map
    normalMap: woodNormalTexture,    // Adds surface detail
    aoMap: woodAOTexture,            // Ambient occlusion for added depth
    roughnessMap: woodRoughnessTexture, // Controls roughness/shininess
    roughness: 1                      // Adjust this value to control glossiness
});

// Create floor geometry
const floorGeometry = new THREE.PlaneGeometry(galleryWidth, galleryDepth); // Adjust dimensions as needed

// Create floor
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.receiveShadow = true; // Enable the floor to receive shadows
floor.rotation.x = -Math.PI / 2; // Rotate to be flat on the ground
floor.position.y = 0;
scene.add(floor);


// -------------- Create Walls -------------- //

// Function to create a wall or block
function createWall(width, height, depth, color, position, rotation = { x: 0, y: 0, z: 0 }) {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: color,        // Pure white color
        roughness: 0.9,         // High roughness for a matte effect
        metalness: 0            // No metalness for a non-reflective surface
    });    
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);

    // Set position and rotation
    wall.position.set(position.x, position.y, position.z);
    wall.rotation.set(rotation.x, rotation.y, rotation.z);

    // Walls cast shadows
    wall.castShadow = true;
    wall.receiveShadow = true;

    // Add wall to scene
    scene.add(wall);
    return wall;
}

// Outer wall Skirting Setup
const outerBlockSkirtingWidth = 0.52;
const outerBlockSkirtingHeight = 0.03;
const outerBlockSkirtingDepth = galleryDepth + 0.02;
const outerBlockSkirtingColor = 0x545454;

// Outer walls
createWall(0.5, galleryHeight, galleryDepth, 0xe9e9e9, { x: -galleryWidth / 2, y: galleryHeight / 2, z: 0 }); // Left
createWall(0.5, galleryHeight, galleryDepth, 0xe9e9e9, { x: galleryWidth / 2, y: galleryHeight / 2, z: 0 }); // Right
createWall(galleryWidth, galleryHeight, 0.5, 0xe9e9e9, { x: 0, y: galleryHeight / 2, z: -galleryDepth / 2 }); // Back
createWall(galleryWidth, galleryHeight, 0.5, 0xe9e9e9, { x: 0, y: galleryHeight / 2, z: galleryDepth / 2 }); // Front

// Outer wall skirting
createWall(0.52, outerBlockSkirtingHeight, galleryDepth + 0.02, outerBlockSkirtingColor, { x: -galleryWidth / 2, y: 0.02, z: 0 }); // Left
createWall(0.52, outerBlockSkirtingHeight, galleryDepth, outerBlockSkirtingColor, { x: galleryWidth / 2, y: 0.02, z: 0 }); // Right
createWall(galleryWidth + 0.02, outerBlockSkirtingHeight, 0.52, outerBlockSkirtingColor, { x: 0, y: 0.02, z: -galleryDepth / 2 }); // Back
createWall(galleryWidth + 0.02, outerBlockSkirtingHeight, 0.52, outerBlockSkirtingColor, { x: 0, y: 0.02, z: galleryDepth / 2 }); // Front

// Inner Block Row Setup
const blockWidth = 6;
const blockHeight = 3;
const blockDepth = 0.5;
const blockColor = 0xe9e9e9; // White

// Inner Block Skirting Setup
const innerBlockSkirtingWidth = 6.02;
const innerBlockSkirtingHeight = 0.03;
const innerBlockSkirtingDepth = 0.52;
const innerBlockSkirtingColor = 0x545454;

// Inner Row 1 with skirting
createWall(blockWidth, blockHeight, blockDepth, blockColor, { x: -7, y: blockHeight / 2, z: -7 });
createWall(blockWidth, blockHeight, blockDepth, blockColor, { x: 7, y: blockHeight / 2, z: -7 });
createWall(innerBlockSkirtingWidth, innerBlockSkirtingHeight, innerBlockSkirtingDepth, innerBlockSkirtingColor, { x: -7, y: 0.02, z: -7 });
createWall(innerBlockSkirtingWidth, innerBlockSkirtingHeight, innerBlockSkirtingDepth, innerBlockSkirtingColor, { x: 7, y: 0.02, z: -7 });

// Inner Row 2 with skirting
createWall(blockWidth, blockHeight, blockDepth, blockColor, { x: -7, y: blockHeight / 2, z: 7 });
createWall(blockWidth, blockHeight, blockDepth, blockColor, { x: 7, y: blockHeight / 2, z: 7 });
createWall(innerBlockSkirtingWidth, innerBlockSkirtingHeight, innerBlockSkirtingDepth, innerBlockSkirtingColor, { x: -7, y: 0.02, z: 7 });
createWall(innerBlockSkirtingWidth, innerBlockSkirtingHeight, innerBlockSkirtingDepth, innerBlockSkirtingColor, { x: 7, y: 0.02, z: 7 });

// Inner Row 3 with skirting
createWall(blockWidth, blockHeight, blockDepth, blockColor, { x: -7, y: blockHeight / 2, z: 0 });
createWall(blockWidth, blockHeight, blockDepth, blockColor, { x: 7, y: blockHeight / 2, z: 0 });
createWall(innerBlockSkirtingWidth, innerBlockSkirtingHeight, innerBlockSkirtingDepth, innerBlockSkirtingColor, { x: -7, y: 0.02, z: 0 });
createWall(innerBlockSkirtingWidth, innerBlockSkirtingHeight, innerBlockSkirtingDepth, innerBlockSkirtingColor, { x: 7, y: 0.02, z: 0 });


// -------------- Create Ceiling -------------- //

// Create concrete ceiling with openings and padding
const concreteThickness = 0.5;

// Center concrete section
const centerCeilingGeometry = new THREE.BoxGeometry(galleryWidth / 3, concreteThickness, galleryDepth);
const centerConcreteMaterial = new THREE.MeshStandardMaterial({ color: 0xececec });
const centerCeilingMesh = new THREE.Mesh(centerCeilingGeometry, centerConcreteMaterial);
centerCeilingMesh.position.set(0, galleryHeight + concreteThickness / 2, 0);
centerCeilingMesh.receiveShadow = true;
centerCeilingMesh.castShadow = true;
scene.add(centerCeilingMesh);

// Left concrete section
const leftCeilingGeometry = new THREE.BoxGeometry(galleryWidth / 6, concreteThickness, galleryDepth);
const leftConcreteMaterial = new THREE.MeshStandardMaterial({ color: 0xececec });
const leftCeilingMesh = new THREE.Mesh(leftCeilingGeometry, leftConcreteMaterial);
leftCeilingMesh.position.set(-galleryWidth/2, galleryHeight + concreteThickness / 2, 0);
leftCeilingMesh.receiveShadow = true;
leftCeilingMesh.castShadow = true;
scene.add(leftCeilingMesh);

// Right concrete section
const rightCeilingGeometry = new THREE.BoxGeometry(galleryWidth / 6, concreteThickness, galleryDepth);
const rightConcreteMaterial = new THREE.MeshStandardMaterial({ color: 0xececec });
const rightCeilingMesh = new THREE.Mesh(rightCeilingGeometry, rightConcreteMaterial);
rightCeilingMesh.position.set(galleryWidth/2, galleryHeight + concreteThickness / 2, 0);
rightCeilingMesh.receiveShadow = true;
rightCeilingMesh.castShadow = true;
scene.add(rightCeilingMesh);

// Front concrete section
const frontCeilingGeometry = new THREE.BoxGeometry(galleryWidth, concreteThickness, galleryDepth / 6);
const frontConcreteMaterial = new THREE.MeshStandardMaterial({ color: 0xececec });
const frontCeilingMesh = new THREE.Mesh(frontCeilingGeometry, frontConcreteMaterial);
frontCeilingMesh.position.set(0, galleryHeight + concreteThickness / 2, galleryDepth/2.4);
frontCeilingMesh.receiveShadow = true;
frontCeilingMesh.castShadow = true;
scene.add(frontCeilingMesh);

// Back concrete section
const backCeilingGeometry = new THREE.BoxGeometry(galleryWidth, concreteThickness, galleryDepth / 6);
const backConcreteMaterial = new THREE.MeshStandardMaterial({ color: 0xececec });
const backCeilingMesh = new THREE.Mesh(backCeilingGeometry, backConcreteMaterial);
backCeilingMesh.position.set(0, galleryHeight + concreteThickness / 2, -galleryDepth/2.4);
backCeilingMesh.receiveShadow = true;
backCeilingMesh.castShadow = true;
scene.add(backCeilingMesh);

// Ceiling Grid with Windows
const beamThickness = 0.1;
const gridSize = 16;

// Create ceiling frame beams with shadow casting
for (let i = -galleryWidth / 2; i <= galleryWidth / 2; i += galleryWidth / (gridSize * 1.4)) {
    // Vertical beams (along Z-axis)
    const verticalBeam = createWall(beamThickness, 0.1, galleryDepth, 0xfafafa, { x: i, y: galleryHeight + concreteThickness, z: 0 });
    verticalBeam.castShadow = true; // Enable shadow casting for vertical beams
    verticalBeam.receiveShadow = true;
}
for (let j = -galleryDepth / 2; j <= galleryDepth / 2; j += galleryDepth / gridSize) {
    // Horizontal beams (along X-axis)
    const horizontalBeam = createWall(galleryWidth, 0.1, beamThickness, 0xfafafa, { x: 0, y: galleryHeight + concreteThickness, z: j });
    horizontalBeam.castShadow = true; // Enable shadow casting for horizontal beams
    horizontalBeam.receiveShadow = true;
}

// Create transparent window panels between beams
const windowPanelGeometry = new THREE.BoxGeometry(galleryWidth, 0.05, galleryDepth);
const windowPanelMaterial = new THREE.MeshPhongMaterial({
    color: 0xaec6cf,
    transparent: true,
    opacity: 0.1,
    depthWrite: true,  // Set depthWrite to true to improve visual stacking
    side: THREE.DoubleSide  // Make the material visible from both sides
});
const windowPanelMesh = new THREE.Mesh(windowPanelGeometry, windowPanelMaterial);
windowPanelMesh.position.set(0, galleryHeight + concreteThickness + beamThickness, 0);
windowPanelMesh.castShadow = false;  // Windows typically don't cast shadows
windowPanelMesh.receiveShadow = true;  // Allow windows to receive some lighting effects
scene.add(windowPanelMesh);

// Load skybox
textureLoader.load('./img/eveningsky.jpg', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping; // Use equirectangular reflection mapping to create a smooth sky
    scene.background = texture;
});

// ---------------------------------------- Section: Decor ---------------------------------------- //


// Function to load and add the model to the scene
function loadModel(modelPath, scene, position = { x: 0, y: 0, z: 0 }, scale = 1, rotationY = 0) {
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;

            // Set the model's position
            model.position.set(position.x, position.y, position.z);

            // Adjust scale if needed
            model.scale.set(scale, scale, scale);

            // Rotate model
            model.rotation.y += rotationY;

            // Enable shadows (optional, depending on your lighting setup)
            model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Add the model to the scene
            scene.add(model);
            console.log('Model loaded successfully');
        },
        undefined,
        (error) => {
            console.error('An error occurred while loading the model:', error);
        }
    );
}

// Load plants
loadModel('./models/potted_plant_mediterranean_med_leaf_low_poly.glb', scene, { x: 14, y: 0, z: galleryWidth/2 + 1.5 }, 2);
loadModel('./models/potted_plant_mediterranean_med_leaf_low_poly.glb', scene, { x: -14, y: 0, z: -galleryWidth/2 - 1.5 }, 2);

// Load benches
loadModel('./models/granite_bench.glb', scene, { x: 7, y: 0.24, z: galleryWidth/2 + 1.6 }, 1.3);
loadModel('./models/granite_bench.glb', scene, { x: -7, y: 0.24, z: galleryWidth/2 + 1.6 }, 1.3);

// Load doors
loadModel('./models/double_sliding_doors.glb', scene, { x: 14.95, y: 0, z: galleryWidth/2 }, 0.035, Math.PI/2);
loadModel('./models/double_sliding_doors.glb', scene, { x: -14.65, y: 0, z: galleryWidth/2 }, 0.035, Math.PI/2);


// Load small round lights
loadModel('./models/cylinder_ceiling_light.glb', scene, { x: 7, y: galleryHeight, z: 14.5 }, 0.25);
loadModel('./models/cylinder_ceiling_light.glb', scene, { x: -7, y: galleryHeight, z: 14.5 }, 0.25);
loadModel('./models/cylinder_ceiling_light.glb', scene, { x: 7, y: galleryHeight, z: -14.5 }, 0.25);
loadModel('./models/cylinder_ceiling_light.glb', scene, { x: -7, y: galleryHeight, z: -14.5 }, 0.25);

// Load long ceiling lights
loadModel('./models/ceiling_lamp.glb', scene, { x: 0, y: galleryHeight - 4.5, z: 14.5 }, 1.8);
loadModel('./models/ceiling_lamp.glb', scene, { x: 0, y: galleryHeight - 4.5, z: 3.5 }, 1.8);
loadModel('./models/ceiling_lamp.glb', scene, { x: 0, y: galleryHeight - 4.5, z: -3.5 }, 1.8);
loadModel('./models/ceiling_lamp.glb', scene, { x: 0, y: galleryHeight - 4.5, z: -14.5 }, 1.8);

// Load spotlights right
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 13, y: galleryHeight - 0.5, z: -14.5 }, 0.002, -1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 13, y: galleryHeight - 0.5, z: -7 }, 0.002, -1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 13, y: galleryHeight - 0.5, z: 0 }, 0.002, 1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 13, y: galleryHeight - 0.5, z: 7 }, 0.002, -1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 13, y: galleryHeight - 0.5, z: 14.5 }, 0.002, 1);

// Load spotlights left
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -13, y: galleryHeight - 0.5, z: -14.5 }, 0.002, -2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -13, y: galleryHeight - 0.5, z: -7 }, 0.002, -2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -13, y: galleryHeight - 0.5, z: 0 }, 0.002, 2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -13, y: galleryHeight - 0.5, z: 7 }, 0.002, -2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -13, y: galleryHeight - 0.5, z: 14.5 }, 0.002, 2);

// Load spotlights center
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -4.3, y: galleryHeight - 0.5, z: -14.5 }, 0.002, -2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -4.3, y: galleryHeight - 0.5, z: -7 }, 0.002, -2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -4.3, y: galleryHeight - 0.5, z: 0 }, 0.002, 2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -4.3, y: galleryHeight - 0.5, z: 7 }, 0.002, -2);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: -4.3, y: galleryHeight - 0.5, z: 14.5 }, 0.002, 2);

loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 4.3, y: galleryHeight - 0.5, z: -14.5 }, 0.002, -1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 4.3, y: galleryHeight - 0.5, z: -7 }, 0.002, -1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 4.3, y: galleryHeight - 0.5, z: 0 }, 0.002, 1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 4.3, y: galleryHeight - 0.5, z: 7 }, 0.002, -1);
loadModel('./models/rullo_lightstar_ceiling_lamp_1.glb', scene, { x: 4.3, y: galleryHeight - 0.5, z: 14.5 }, 0.002, 1);


// ---------------------------------------- Section: Lighting ---------------------------------------- //

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 2); // Soft white ambient light to brighten up the scene
scene.add(ambientLight);

// Add directional light to simulate sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Bright white light with adjusted intensity
directionalLight.position.set(0, 20, 8); // Position above the scene
directionalLight.castShadow = true; // Enable shadows

// Add directional light to simulate sunlight
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5); // Bright white light with adjusted intensity
directionalLight2.position.set(0, 17, -10); // Position above the scene
directionalLight2.castShadow = true; // Enable shadows

// Configure shadow properties for better quality
directionalLight.shadow.mapSize.width = 512;  // Default is 512, increased for better quality
directionalLight.shadow.mapSize.height = 512; // Default is 512, increased for better quality
directionalLight.shadow.camera.near = 1;    // Near clipping plane for the shadow camera
directionalLight.shadow.camera.far = 60;      // Far clipping plane for the shadow camera
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;

scene.add(directionalLight);

// Add a helper to visualize the directional light
// const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
// scene.add(dirLightHelper);

// const dirLightHelper2 = new THREE.DirectionalLightHelper(directionalLight2, 5);
// scene.add(dirLightHelper2);

// Point Lights

// Light near the center of the room
const centerLight = new THREE.PointLight(0xffffff, 50, 100);
centerLight.position.set(0, 6, 0);
centerLight.castShadow = true;
scene.add(centerLight);

// Light near a center-corner of the gallery
const cornerLight1 = new THREE.PointLight(0xffffff, 50, 100);
cornerLight1.position.set(-8, 5, -5);
cornerLight1.castShadow = true;
scene.add(cornerLight1);

// Light on the center-opposite corner
const cornerLight2 = new THREE.PointLight(0xffffff, 50, 100);
cornerLight2.position.set(8, 5, 5);
cornerLight2.castShadow = true;
scene.add(cornerLight2);

// Light on the entrance center
const cornerLight3 = new THREE.PointLight(0xffffff, 50, 100);
cornerLight3.position.set(0, 5, 14);
cornerLight3.castShadow = true;
scene.add(cornerLight3);

// Light on the back center
const cornerLight4 = new THREE.PointLight(0xffffff, 50, 100);
cornerLight4.position.set(0, 5, -14);
cornerLight4.castShadow = true;
scene.add(cornerLight4);



// ---------------------------------------- Section: Artwork ---------------------------------------- //

// Placeholders (where Firebase art will come later)

// Function to create framed artwork
const framedArtworks = {};

function createFramedArtwork(id, imageURL, frameDepth, position, rotation, height = 1.5) {
    const textureLoader = new THREE.TextureLoader();

    // Load the artwork texture
    textureLoader.load(imageURL, (texture) => {
        
        // Calculate the aspect ratio of the image
        const aspectRatio = texture.image.width / texture.image.height;
        
        // Define base height or width and adjust the other dimension to keep the aspect ratio
        const baseHeight = height; // Set a base height for all artworks (adjust as desired)
        const artworkHeight = baseHeight;
        const artworkWidth = artworkHeight * aspectRatio;
        
        // Create PlaneGeometry for the artwork with correct dimensions
        const artworkGeometry = new THREE.PlaneGeometry(artworkWidth, artworkHeight);
        const artworkMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const artworkMesh = new THREE.Mesh(artworkGeometry, artworkMaterial);

        // Create a frame geometry around the artwork
        const frameWidth = artworkWidth + frameDepth;
        const frameHeight = artworkHeight + frameDepth;
        const frameGeometry = new THREE.BoxGeometry(frameWidth, frameHeight, frameDepth);
        const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Brown color for the frame
        const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);

        // Position the artwork slightly in front of the frame
        artworkMesh.position.z = frameDepth / 2 + 0.01;

        // Create a group to hold both the frame and the artwork
        const framedArtwork = new THREE.Group();
        framedArtwork.add(frameMesh);
        framedArtwork.add(artworkMesh);
        framedArtwork.imageURL = imageURL;
        framedArtwork.imageId = id;

        // Set position and rotation
        framedArtwork.position.set(position.x, position.y, position.z);
        framedArtwork.rotation.set(rotation.x, rotation.y, rotation.z);

        // Add the framed artwork to the scene
        scene.add(framedArtwork);

        // Store the framed artwork in the array
        framedArtworks[id] = framedArtwork;
    });
}

// Left inner block 1 front
createFramedArtwork(
    1,
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730628909/beeb1_mj4scm.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: -7, y: 1.5, z: blockDepth + 6.8 }, // Position on the wall
    { x: 0, y: 0, z: 0 } // Rotation
);

// Left inner block 1 back
createFramedArtwork(
    2,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629010/beeb2_gm9gka.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: -7, y: 1.5, z: 6.7 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 } // Rotation
);

// Left inner block 2
createFramedArtwork(
    3,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/beeb9_optimized_spczzb.png',
    // 'https://awsimages.detik.net.id/community/media/visual/2024/09/12/ilustrasi-boneka-labubu_169.jpeg?w=600&q=90', // Replace with your image URL
    0.05, // Frame depth
    { x: -7, y: 1.5, z: blockDepth - 7.2 }, // Position on the wall
    { x: 0, y: 0, z: 0 }, // Rotation
    2.5
);

// Left inner block 2 back
createFramedArtwork(
    4,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/beeb10_optimized_uwzapp.png', // Replace with your image URL
    0.05, // Frame depth
    { x: -7, y: 1.5, z: -7.3 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 }, // Rotation
    2.5
);

// Left inner block 3
createFramedArtwork(
    5,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/bunny_kfwbzn.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: -7, y: 1.5, z: blockDepth - 0.2 }, // Position on the wall
    { x: 0, y: 0, z: 0 } // Rotation
);

// Left inner block 3 back
createFramedArtwork(
    6,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629013/bobby_fywpzl.png',
    0.05, // Frame depth
    { x: -7, y: 1.5, z: -0.3 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 } // Rotation
);

// Right inner block 1 front
createFramedArtwork(
    7,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629011/beeb4_tqvsxy.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: 7, y: 1.5, z: blockDepth + 6.8 }, // Position on the wall
    { x: 0, y: 0, z: 0 } // Rotation
);

// Right inner block 1 back
createFramedArtwork(
    8,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629011/beeb5_tzqowu.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: 7, y: 1.5, z: 6.7 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 } // Rotation
);

// Right inner block 2
createFramedArtwork(
    9,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/beeb7_re7kcq.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: 7, y: 1.5, z: blockDepth - 7.2 }, // Position on the wall
    { x: 0, y: 0, z: 0 } // Rotation
);

// Right inner block 2 back
createFramedArtwork(
    10,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/beeb11_optimized_xrovyr.png',
    0.05, // Frame depth
    { x: 7, y: 1.5, z: -7.3 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 }, // Rotation
    2.5
);

// Right inner block 3
createFramedArtwork(
    11,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629013/beeb8_wzbs73.jpg',
    // 'https://awsimages.detik.net.id/community/media/visual/2024/09/12/ilustrasi-boneka-labubu_169.jpeg?w=600&q=90', // Replace with your image URL
    0.05, // Frame depth
    { x: 7, y: 1.5, z: blockDepth - 0.2 }, // Position on the wall
    { x: 0, y: 0, z: 0 } // Rotation
);

// Right inner block 3 back
createFramedArtwork(
    12,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629014/bobby2_q2jy1t.png',
    0.05, // Frame depth
    { x: 7, y: 1.5, z: -0.3 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 } // Rotation
);

// Left wall

createFramedArtwork(
    13,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630876/pants3_x2jaac.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: -14.7, y: 1.5, z: 7.5 }, // Position on the wall
    { x: 0, y: Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    14,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630876/pants7_iyqkwn.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: -14.7, y: 1.5, z: 3 }, // Position on the wall
    { x: 0, y: Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    15,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630877/pants5_pumxsq.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: -14.7, y: 1.5, z: -1.5 }, // Position on the wall
    { x: 0, y: Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    16,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630877/pants9_takxvh.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: -14.7, y: 1.5, z: -6 }, // Position on the wall
    { x: 0, y: Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    17,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630877/pants8_wt29xy.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: -14.7, y: 1.5, z: -12 }, // Position on the wall
    { x: 0, y: Math.PI/2, z: 0 } // Rotation
);

// Right wall

createFramedArtwork(
    18,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/pants1_prxhll.png',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: 14.7, y: 1.5, z: 7.5 }, // Position on the wall
    { x: 0, y: -Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    19,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629013/pants2_vapfd3.png',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: 14.7, y: 1.5, z: 3 }, // Position on the wall
    { x: 0, y: -Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    20,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630902/pants6_xqtqri.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: 14.7, y: 1.5, z: -1.5 }, // Position on the wall
    { x: 0, y: -Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    21,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730630878/pants4_sixyia.jpg',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: 14.7, y: 1.5, z: -6 }, // Position on the wall
    { x: 0, y: -Math.PI/2, z: 0 } // Rotation
);

createFramedArtwork(
    22,
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629012/hammy_2_optimized_vrngwm.png',
    // 'https://images.prestigeonline.com/wp-content/uploads/sites/3/2024/09/20213028/449845721_860060342834580_5680899768624535938_n-1024x682.jpeg', // Replace with your image URL
    0.05, // Frame depth
    { x: 14.7, y: 1.5, z: -12 }, // Position on the wall
    { x: 0, y: -Math.PI/2, z: 0 }, // Rotation
    0.4,
);

// Far wall

createFramedArtwork(
    23,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629011/beeb6_ufqxwn.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: 0, y: 2.9, z: -17.2 }, // Position on the wall
    { x: 0, y: 0, z: 0 }, // Rotation
    4.8
);

// Near back wall

createFramedArtwork(
    24,
    // './img/sky.jpg',
    'https://res.cloudinary.com/dsjopahtl/image/upload/v1730629013/beeb12_da3pn9.jpg', // Replace with your image URL
    0.05, // Frame depth
    { x: 0, y: 2.8, z: 17.2 }, // Position on the wall
    { x: 0, y: Math.PI, z: 0 }, // Rotation
    4.2
);

// ---------------------------------------- Section: View control with mouse movement ---------------------------------------- //

// Initialize PointerLockControls with the camera and renderer
const controls = new PointerLockControls(camera, document.body);
document.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    console.log('PointerLockControls: locked');
});

controls.addEventListener('unlock', () => {
    console.log('PointerLockControls: unlocked');
});

scene.add(controls.getObject());

// Add a simple pointer (crosshair) in the center of the viewport
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.width = '10px';
crosshair.style.height = '10px';
crosshair.style.backgroundColor = 'red';
crosshair.style.borderRadius = '50%';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.pointerEvents = 'none';
document.body.appendChild(crosshair);

// ---------------------------------------- Section: Focus on artwork & art overlay ---------------------------------------- //

// Define Raycaster and Mouse Vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// State variables (for art overlay)
let isFocused = false; // Tracks if we're in focus mode in front of an artwork
let overlayOpen = false; // Tracks if the overlay is open
let currentFocusedArtwork = null; // Tracks the currently focused artwork

// Event Listener for Mouse Clicks: Add an event listener to handle mouse clicks, update the mouse position, and initiate raycasting.
document.addEventListener('click', onPointerClick, false);

// Helper function to get the top-level visitor object (when clicked)
function getTopLevelVisitor(object) {
    while (object.parent && object.parent.type !== "Scene") {
        object = object.parent;
    }
    return object;
}

// On pointer click, trigger a whole load of stuff
function onPointerClick(event) {

    if (chatOpen || overlayOpen) return; // Prevent any action if chat or artwork overlay is open

    const maxDistance = 7; // Set the max distance for raycasting (e.g., 5 units)
    
    // Since we're using PointerLockControls, raycast from the center of the screen instead of mouse coordinates
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);

    // Check for intersections with visitors first, within max raycasting distance
    // const visitorIntersections = raycaster.intersectObjects(visitors, true); // 'true' checks nested objects in groups
    const visitorIntersections = raycaster.intersectObjects(visitors, true).filter(intersect => intersect.distance <= maxDistance);


    if (visitorIntersections.length > 0) {
        console.log("found marshal");
        const clickedObject = visitorIntersections[0].object;
        const clickedVisitor = getTopLevelVisitor(clickedObject);
        console.log(clickedVisitor);
        console.log(clickedVisitor.userData);
        // Start chat if the visitor is focused on an artwork and is not moving
        if (!clickedVisitor.userData.isMoving && clickedVisitor.userData.currentArtwork) {
            startChatWithVisitor(clickedVisitor);
            console.log(clickedVisitor);
            console.log(clickedVisitor.userData.currentArtwork.userData.imageURL);
            return; // Exit early to avoid checking for artwork interactions
        }
    }

    // If no visitors clicked, check for intersections with artwork

    // Convert framedArtworks object to an array for raycasting
    const framedArtworksArray = Object.values(framedArtworks);

    // Find intersections with framed artworks
    const artworkIntersects = raycaster.intersectObjects(framedArtworksArray, true).filter(intersect => intersect.distance <= maxDistance); // 'true' to check child objects within groups

    if (artworkIntersects.length > 0) {
        const targetArtwork = artworkIntersects[0].object.parent; // Get the parent group (frame and artwork)
        // Check if we're already focused on this artwork
        if (!isFocused || currentFocusedArtwork !== targetArtwork) {
            // Move to focus on the artwork if not already focused
            focusOnArtwork(targetArtwork);
            currentFocusedArtwork = targetArtwork;
            isFocused = true;
            console.log(isFocused);
            console.log(currentFocusedArtwork);
        } else if (isFocused && !overlayOpen) {
            console.log(isFocused);
            console.log(currentFocusedArtwork);
            // If already in focus, open the overlay
            // showArtworkOverlay({
            //     title: "Beautiful Artwork", // Replace with actual dynamic data
            //     artist: "Jane Doe",
            //     date: "2023-05-14",
            //     description: "This is a description of the beautiful artwork.",
            //     imageURL: "./img/sky.jpg"
            // });
            // console.log("Overlay open sesame");
        }
    }

    // console.log(isFocused);
    // console.log(overlayOpen);
    // console.log(currentFocusedArtwork);
}

// Function to Smoothly Focus on Artwork
function focusOnArtwork(artwork) {
    // Calculate the position to move the camera
    const targetPosition = new THREE.Vector3();
    artwork.getWorldPosition(targetPosition); // Get the artwork's world position

    const distance = 2; // Distance from the artwork (adjust as needed for framing)
    const direction = new THREE.Vector3();
    artwork.getWorldDirection(direction);
    direction.negate(); // Invert direction to ensure camera moves in front of the artwork // Get direction the artwork is facing

    // Calculate the target camera position a little back from the artwork
    const cameraTargetPosition = targetPosition.clone().add(direction.multiplyScalar(-distance));

    // Smoothly move the camera to the target position
    gsap.to(camera.position, {
        duration: 1,
        x: cameraTargetPosition.x,
        // y: cameraTargewtPosition.y,
        z: cameraTargetPosition.z,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.lookAt(targetPosition); // Continuously update the camera to look at the target during movement
        }
    });

    // Smoothly rotate the camera to face the artwork
    camera.lookAt(targetPosition);
}

// Disable movement function when overlay is open
function disableMovement() {
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
}

// Show Artwork Overlay
function showArtworkOverlay(artworkData) {
    if (overlayOpen) return; // Avoid opening multiple overlays

    // Populate overlay with artwork data
    document.getElementById("artwork-title").innerText = artworkData.title;
    document.getElementById("artwork-artist").innerText = `Artist: ${artworkData.artist}`;
    document.getElementById("artwork-date").innerText = `Date: ${artworkData.date}`;
    document.getElementById("artwork-description").innerText = artworkData.description;
    document.getElementById("artwork-image").src = artworkData.imageURL;

    // Display the overlay
    const overlay = document.getElementById("artwork-overlay");
    overlay.classList.add("visible");
    overlay.classList.remove("hidden");
    overlayOpen = true;

    // Unlock pointer controls and disable movement
    controls.unlock();
    disableMovement();
}

// Close Artwork Overlay
function closeOverlay() {
    const overlay = document.getElementById("artwork-overlay");
    if (overlay) {
        console.log("Closing overlay..."); // Debug statement to ensure function is triggered
        // overlay.style.display = "none";
        overlay.classList.remove("visible");
        overlay.classList.add("hidden");
        overlayOpen = false;
        isFocused = false; // Reset focus state to allow interaction again.

        // Relock pointer controls and re-enable movement
        controls.lock();
    } else {
        console.error("Overlay element not found!");
    }
}

// Wait for DOM content to load
document.addEventListener("DOMContentLoaded", () => {
    
    // Attach an event listener for the close button on the Art overlay
    const closeButton = document.getElementById("overlay-close-btn");
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            console.log("close!");
            closeOverlay();
        });
    } else {
        console.error("Close button for overlay not found");
    }

    // Attach an event listener for the close button on the Chat overlay
    const chatCloseButton = document.getElementById("chat-close-btn");
    if (chatCloseButton) {
        chatCloseButton.addEventListener("click", () => {
            console.log("chat close button clicked!");
            closeChatOverlay();
        });
    } else {
        console.error("Close button for chat overlay not found");
    }
});


// ---------------------------------------- Section: Movement around the gallery ---------------------------------------- //

// Movement flags
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Event listeners for key press and release
document.addEventListener("keydown", (event) => {
    if (chatOpen) return; // Disable movement when chat is open
    switch (event.key) {
        case "w":
            moveForward = true;
            break;
        case "s":
            moveBackward = true;
            break;
        case "a":
            moveLeft = true;
            break;
        case "d":
            moveRight = true;
            break;
    }
});

document.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "w":
            moveForward = false;
            break;
        case "s":
            moveBackward = false;
            break;
        case "a":
            moveLeft = false;
            break;
        case "d":
            moveRight = false;
            break;
    }
});

// ---------------------------------------- Section: Create AI Visitors & get them moving ---------------------------------------- //

// // Create basic 3D blocks as visitors first
// function createVisitor(id, color) {
//     const visitorGeometry = new THREE.BoxGeometry(0.5, 1, 0.5); // Simple box for the visitor
//     const visitorMaterial = new THREE.MeshStandardMaterial({ color });
//     const visitor = new THREE.Mesh(visitorGeometry, visitorMaterial);

//     // Create an indicator to highlight the 'front' of the visitor
//     const frontIndicatorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2);
//     const frontIndicatorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red to clearly indicate the front
//     const frontIndicator = new THREE.Mesh(frontIndicatorGeometry, frontIndicatorMaterial);
//     frontIndicator.position.set(0, 0.6, 0.3); // Place the indicator slightly in front and above the visitor
//     visitor.add(frontIndicator);

//     // Position the visitor randomly within the gallery bounds
//     visitor.position.set(
//         THREE.MathUtils.randFloatSpread(10), // Random X within bounds
//         0.5, // Set to half the height
//         THREE.MathUtils.randFloatSpread(10) // Random Z within bounds
//     );

//     visitor.userData = {
//         id: id,
//         currentArtwork: null, // The artwork the AI visitor is viewing
//         isMoving: true, // Track if the visitor is in motion
//         waypointIndex: 0 // Track current waypoint
//     };

//     scene.add(visitor);
//     return visitor;
// }

// Create a few visitors with random colors
const visitors = [
    // createVisitor(1, 0xff6347), // Visitor 1 with a unique color
    // createVisitor(2, 0x4682b4), // Visitor 2
    // createVisitor(3, 0x32cd32) // Visitor 3
];

// Move visitor to artwork
function moveVisitorToArtwork(visitor, visitorIndex) {
    const artworkKeys = Object.keys(framedArtworks);
    if (artworkKeys.length === 0) {
        console.warn("No artworks available to target.");
        return; // Exit if there are no artworks yet
    }

    const targetArtwork = framedArtworks[artworkKeys[Math.floor(Math.random() * artworkKeys.length)]];
    if (!targetArtwork) {
        console.warn("Target artwork not found.");
        return;
    }

    // Get the artwork's world position and rotation
    const targetPosition = new THREE.Vector3();
    targetArtwork.getWorldPosition(targetPosition);

    // console.log(targetArtwork.children[1].material.map.source.data.currentSrc);

    // Calculate the "front-facing" direction based on artwork's rotation
    const direction = new THREE.Vector3(0, 0, 1); // Default forward direction
    direction.applyQuaternion(targetArtwork.quaternion); // Rotate direction to match artwork's orientation
    
    // Define the distance for visitors (a bit further back than the user’s focus distance)
    const visitorDistance = 3;

    // Calculate an offset for each visitor based on index
    const angleOffset = (Math.PI/6.5) * (visitorIndex - 1); // Unique angle offset for each visitor
    // targetArtwork.getWorldDirection(direction).negate(); // Invert to face away from the artwork

    // Calculate the position in front of the artwork with slight lateral offset
    const visitorTargetPosition = targetPosition.clone()
        .add(direction.multiplyScalar(visitorDistance)) // Move back by visitorDistance
        .add(new THREE.Vector3(Math.sin(angleOffset), 0, Math.cos(angleOffset)).multiplyScalar(2)); // Add lateral offset

    // Save the initial y-position of the visitor to ensure hopping only adds to this value
    const initialYPosition = visitor.position.y;

    // Move visitor to target position and face the artwork
    gsap.to(visitor.position, {
        duration: 5,
        x: visitorTargetPosition.x,
        z: visitorTargetPosition.z,
        // ease: "power2.inOut",w
        onUpdate: () => {
            // Setup the hopping
            // Calculate the progress of the hop from 0 to 1
            const progress = gsap.globalTimeline.time() * 3 % 1;

            // Apply a parabolic effect for each hop
            const hopHeight = 0.1; // Adjust hop height as needed
            const parabolicFactor = 4; // Controls steepness of bounce (higher = sharper bounce)

            // Use a quadratic easing function to simulate a bounce
            const hopOffset = hopHeight * (1 - Math.pow(2 * progress - 1, parabolicFactor));
            visitor.position.y = initialYPosition + hopOffset;
            
            // Orient the visitor to face the artwork
            const adjustedTargetPosition = targetPosition.clone();
            adjustedTargetPosition.y = visitor.position.y; // Maintain the visitor's height to avoid tilting
            visitor.lookAt(adjustedTargetPosition);

        },
        onComplete: () => {
            // Visitor finishes hopping on the ground
            visitor.position.y = initialYPosition

            // Visitor states
            visitor.userData.currentArtwork = targetArtwork;
            visitor.userData.isMoving = false;

            // console.log(`Visitor ${visitor.userData.id} reached artwork and will pause`);

            // Start a countdown for this visitor before it moves to next artwork
            startVisitorCountdown(visitor, visitorIndex);
        }
    });
}

// Set a random countdown for each visitor. If the countdown completes, the visitor moves to a new artwork. 
// If interrupted by a chat, the countdown pauses.
function startVisitorCountdown(visitor, visitorIndex) {
    const countdownTime = THREE.MathUtils.randInt(3000, 10000); // 3 to 10 seconds

    visitorPauseTimers[visitor.userData.id] = setTimeout(() => {
        // If chat is open, don't move; wait until chat closes
        if (!chatOpen || currentChatVisitor !== visitor) {
            visitor.userData.isMoving = true;
            moveVisitorToArtwork(visitor, visitorIndex); // Move to the next artwork
        }
    }, countdownTime);
}

// Delay starting the visitors until artworks are loaded
setTimeout(() => {
    visitors.forEach((visitor, index) => {
        console.log(`Starting movement for visitor ${visitor.userData.id}`);
        moveVisitorToArtwork(visitor, index);
    });
}, 2000); // Delay by 2 seconds to ensure artworks are ready


// ---------------------------------------- Section: Create Visitors with Models ---------------------------------------- //

// Function to load and add visitor model to the scene
function loadVisitorModel(visitorId, modelPath, scaleX, scaleY, scaleZ, positionY) {
    loader.load(
        modelPath,
        (gltf) => {
            const visitor = gltf.scene;
            
            // Adjust scale and position
            visitor.scale.set(scaleX, scaleY, scaleZ); // Adjust scale as needed
            
            // Add necessary user data to behave like other visitors
            visitor.userData = {
                id: visitorId,
                isMoving: true, // Mark visitor as moving initially
                currentArtwork: null // Artwork focus starts as null
            };

            // Apply castShadow and other properties to each mesh in the model
            visitor.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Position the visitor randomly within the gallery bounds
            visitor.position.set(
                THREE.MathUtils.randFloatSpread(10), // Random X within bounds
                positionY, // Set to half the height
                THREE.MathUtils.randFloatSpread(10) // Random Z within bounds
            );

            // Add visitor model to the scene and to the visitors array
            scene.add(visitor);
            visitors.push(visitor); // Add to global visitors array for interaction handling
            console.log(visitor);

        },
        undefined,
        (error) => {
            console.error('An error occurred while loading the model:', error);
        }
    );
}

// Load Marshal
loadVisitorModel(1, './models/marshal.gltf', 0.18, 0.18, 0.18, -0.2);
// Load Isabelle
loadVisitorModel(2, './models/isabelle.gltf', 0.017, 0.017, 0.017, 0.05);
// Load agent S
loadVisitorModel(3, './models/agent_s.gltf', 7, 7, 7, 0.01);
// Load Celeste
loadVisitorModel(4, './models/celeste.gltf', 0.045, 0.045, 0.045, 0.02);


// ---------------------------------------- Section: Chat with Visitors ---------------------------------------- //

let chatOpen = false; // Tracks if a chat is open
let currentChatVisitor = null; // Tracks the visitor currently in chat
let visitorPauseTimers = {}; // Store countdown timers for visitors

// Start chat with visitor and pause countdown
function startChatWithVisitor(visitor) {
    console.log("starting chat with visitor");
    chatOpen = true;
    currentChatVisitor = visitor;

    // Load this visitor's chat history into the chat window
    loadChatHistory(visitor.userData.id);

    // Pause the visitor's countdown timer
    clearTimeout(visitorPauseTimers[visitor.userData.id]);

    // Smoothly pan the camera to focus on the visitor, maintaining current height
    const visitorPosition = visitor.position.clone();
    const cameraOffsetDistance = 2; // Set distance from visitor to avoid flipping behind

    // Calculate the direction towards the visitor and position the camera accordingly
    const directionToCamera = new THREE.Vector3();
    visitor.getWorldDirection(directionToCamera);
    directionToCamera.negate().normalize(); // Invert the direction to face the visitor from the front

    const cameraTargetPosition = visitorPosition.clone().add(directionToCamera.multiplyScalar(cameraOffsetDistance));
    cameraTargetPosition.y = camera.position.y; // Maintain the same height for the camera

    gsap.to(camera.position, {
        duration: 1,
        x: cameraTargetPosition.x,
        y: cameraTargetPosition.y, // Keep the camera height unchanged
        z: cameraTargetPosition.z,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.lookAt(visitorPosition);
            const updatedTarget = camera.position.clone();
            updatedTarget.y = visitor.position.y;
            visitor.lookAt(updatedTarget); // Make sure visitor faces the camera after the update
        }
    });

    // Pan the camera view slightly to the right of the visitor
    panCameraRight(visitor);

    // Make the visitor face the camera directly
    gsap.to(visitor.rotation, {$1y: Math.atan2(camera.position.x - visitor.position.x, camera.position.z - visitor.position.z),
    x: 0, // Prevent tilting upwards or downwards
    z: 0, // Prevent unintended roll
    x: 0, // Prevent tilting upwards or downwards
    z: 0,
        ease: "power2.inOut"
    });

    // Start the conversation with an OpenAI-generated comment about the artwork
    const artworkURL = visitor.userData.currentArtwork.imageURL;
    generateArtworkComment(visitor, artworkURL);

    showChatOverlay();
    controls.unlock(); // Unlock controls to disable movement
    disableMovement();
}

// Show chat overlay
function showChatOverlay() {
    const chatOverlay = document.getElementById("chat-overlay");
    chatOverlay.classList.add("visible");
    chatOverlay.classList.remove("hidden");
}

// Pan camera to show the visitor on the left and chat on the right
function panCameraRight(visitor) {
    const visitorPosition = visitor.position.clone();

    // Calculate an offset to the right (along the x-axis)
    const rightwardOffset = new THREE.Vector3(0.8, 0, 0); // Adjust 0.8 as needed for pan distance

    // Apply the offset to the visitor's position to create a new look target
    const targetPosition = visitorPosition.add(rightwardOffset);

    gsap.to(camera, {
        duration: 1,
        ease: "power2.inOut",
        onUpdate: () => {
            camera.lookAt(targetPosition);
        }
    });
}

// Load visitor-specific chat history
function loadChatHistory(visitorId) {
    // Clear current chat window
    chatWindow.innerHTML = '';

    // Load chat history for the selected visitor
    chatHistories[visitorId].forEach(message => {
        displayMessage(message.content, message.role === 'user' ? 'user' : 'visitor', false);
    });
}

// Close chat and resume countdown
function closeChatOverlay() {
    const chatOverlay = document.getElementById("chat-overlay");
    chatOverlay.classList.add("hidden");
    chatOverlay.classList.remove("visible");

    console.log("closeChatOverlay");

    chatOpen = false;
    if (currentChatVisitor) {
        // Calculate the target rotation angle to face the artwork
        const artworkPosition = currentChatVisitor.userData.currentArtwork.position.clone();
        const visitorPosition = currentChatVisitor.position.clone();
        
        // Keep the target's height level with the visitor to prevent tilting
        artworkPosition.y = visitorPosition.y;
        
        // Calculate the desired rotation angle to face the artwork
        const directionVector = new THREE.Vector3().subVectors(artworkPosition, visitorPosition);
        const targetRotationY = Math.atan2(directionVector.x, directionVector.z);

        // Smoothly rotate the visitor to face the artwork using GSAP
        gsap.to(currentChatVisitor.rotation, {
            duration: 1,
            y: targetRotationY,
            ease: "power2.inOut",
            onComplete: () => {
                // Resume countdown for the visitor to move to the next artwork
                resumeVisitorCountdown(currentChatVisitor);
                currentChatVisitor = null;
            }
        });
    }

    controls.lock(); // Re-lock controls for movement
}

// Resume allowing visitors to move around after a chat is ended
function resumeVisitorCountdown(visitor) {
    // Calculate a new countdown time and restart the timer
    const remainingTime = THREE.MathUtils.randInt(3000, 10000); // New random time
    visitorPauseTimers[visitor.userData.id] = setTimeout(() => {
        if (!chatOpen || currentChatVisitor !== visitor) {
            visitor.userData.isMoving = true;
            moveVisitorToArtwork(visitor, visitors.indexOf(visitor));
        }
    }, remainingTime);
}

// Initialize chat histories for each visitor
const chatHistories = {
    1: [], // Visitor 1's chat history
    2: [], // Visitor 2's chat history
    3: [],  // Visitor 3's chat history
    4: [],  // Visitor 4's chat history
    5: [],  // Visitor 5's chat history
    6: []  // Visitor 6's chat history
};

// User chat input and display messages
const chatInput = document.getElementById("user-chat-input");
const chatWindow = document.getElementById("chat-messages");

// Send message on Enter key
chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && chatInput.value.trim()) {
        const message = chatInput.value.trim();
        
        // Display the message on chat
        displayMessage(message, 'user', true);
        chatInput.value = ""; // Clear input

        // Send message via OpenAI
        sendMessageToVisitor(currentChatVisitor); // Placeholder function to handle the AI response
    }
});

// Display the sent or received message on the chat window & save it to history
function displayMessage(message, sender, addToHistory) {
    // Create a new div for the chat message
    const messageElement = document.createElement("div");
    messageElement.classList.add("chat-message");

    // Add specific class based on sender (user or visitor)
    if (sender === 'user') {
        messageElement.classList.add("user-message");
    } else {
        messageElement.classList.add("visitor-message");
    }

    // Create a span to hold the message text
    const messageText = document.createElement("span");
    messageText.innerText = message;

    // Append the message text span to the message element
    messageElement.appendChild(messageText);

    // Append the message element to the chat window
    chatWindow.appendChild(messageElement);

    // Add to the visitor's chat history
    if (currentChatVisitor && addToHistory) {
        chatHistories[currentChatVisitor.userData.id].push({ role: sender, content: message });
    }

    // Auto-scroll to the latest message
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ---------------------------------------- Section: AI conversations ---------------------------------------- //

// OpenAI API Key
const OPENAI_API_KEY = "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";

// Visitor personalities (one for each visitor): Marshal, Isabelle, Agent S, Celeste
const visitorPersonalities = [
    "Conan O'Brien's humor. Pervy. Talk simply and be rude. Makes silly insults of the user.",
    "Art gallery guide, who loves to crack dad jokes every time. Be very direct and simple.",
    "A spy on a secret mission. Wants to share about it, but only if you push hard enough. Something random about naughty or evil hamsters)",
    "An arty farty person who wants to show off how arty farty they are",
];

// Visitor response limit to control conversation length
const RESPONSE_LIMIT = 5;

// Chat state
let currentResponseCount = 0;

// Send the message to visitor, and send the visitor's chat history to OpenAI
function sendMessageToVisitor(visitor) {
    
    // Show a placeholder response for testing's sake
    // setTimeout(() => {
    //     const visitorResponse = `I see! You said: ${message}`; // Placeholder response
    //     displayMessage(visitorResponse, 'visitor');
    // }, 1000); // 1-second delay

    // Get the visitor and its chat history
    const visitorId = currentChatVisitor.userData.id;
    const chatHistory = chatHistories[visitorId];

    // Define visitor's personality
    const personality = visitorPersonalities[visitor.userData.id - 1];
    
    // Create OpenAI prompt and send visitor's chat history
    const openAIMessages = [
        // set the system instruction to use visitor's personality
        { role: "system", content: `You have this personality ${personality}.` },
        // loop through the chatHistory array and create an object with all the messages
        ...chatHistory.map(item => ({
            role: item.role === 'user' ? 'user' : 'assistant',
            content: item.content
        }))
    ];

    getOpenAIResponse(openAIMessages)
        .then(visitorMessage => {
            displayMessage(visitorMessage, 'visitor', true);
            currentResponseCount++;
        })
        .catch(error => {
            console.error("Error generating response:", error);
        });
}

// Helper function to generate artwork comment. Calls the general OpenAI interaction function
async function generateArtworkComment(visitor, artworkURL) {
    
    // Identify the personality to use
    const personality = visitorPersonalities[visitor.userData.id - 1];
    
    // Create prompt
    const artPrompt = `You have ${personality}. Tell me what you're thinking about this artwork?`;
    // call the getOpenAIResponse function to call OpenAPI to get a response
    
    const openAIMessages = [
        // set the system instruction to use visitor's personality
        { role: "system", content: `You (gallery visitor) have this personality: ${personality}.` },
        {
            role: "user",
            content: [
              { type: "text", "text": "What are you thinking as you look at this art? In less than 60 words."},
              {
                type: "image_url",
                image_url: {
                  "url": artworkURL,
                },
              },
            ],
          }
    ];

    getOpenAIResponse(openAIMessages)
        .then(visitorMessage => {
            displayMessage(visitorMessage, 'visitor', true);
            currentResponseCount++;
        })
        .catch(error => {
            console.error("Error generating response:", error);
        });
}

// OpenAI general interaction function for all messages
async function getOpenAIResponse(messages) {
    // Call the completions API (POST) with my API key and prompt
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: messages
        })
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${await response.text()}`);
    }
    // store OpenAI's successful response in the data constant in json format
    const data = await response.json();
    // return the "content" value in OpenAI's response
    return data.choices[0].message.content;
}




// ---------------------------------------- Section: Render and animate ---------------------------------------- //

// Position the camera and render the scene
camera.position.set(-13.2, 1.6, 14);
camera.lookAt(0, 1.6, 0);



// Update Camera Position Based on Movement

function animate() {
    requestAnimationFrame(animate);

    // Test cube
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

    // ----- Movement ----- //
    
    const moveSpeed = 0.15; // Adjust for desired movement speed
    const direction = new THREE.Vector3();
    const velocity = new THREE.Vector3();

    if (moveForward) velocity.z += moveSpeed;
    if (moveBackward) velocity.z -= moveSpeed;
    if (moveLeft) velocity.x -= moveSpeed;
    if (moveRight) velocity.x += moveSpeed;

    // Get the direction the camera is facing, but keep only horizontal components
    controls.getDirection(direction);
    direction.y = 0; // Ensure no vertical movement
    direction.normalize();
    direction.multiplyScalar(velocity.z);
    camera.position.add(direction);

    // Move horizontally for strafing
    const strafeDirection = new THREE.Vector3();
    strafeDirection.setFromMatrixColumn(camera.matrix, 0);
    strafeDirection.y = 0; // Ensure no vertical movement
    strafeDirection.normalize();
    strafeDirection.multiplyScalar(velocity.x);
    camera.position.add(strafeDirection);

    renderer.render(scene, camera);
}
animate();
