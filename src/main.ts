import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  applyGeoTransformToObject,
  loadGeoObj,
  type LoadedGeoModel,
  type ModelDefinition
} from './loaders/loadGeoObj';
import { fitCameraToBox, toSceneCoords } from './spatial/spatial';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('No se encontró el contenedor principal de la aplicación');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1220);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const modelsGroup = new THREE.Group();
modelsGroup.name = 'grupo-modelos';
scene.add(modelsGroup);

const helpersGroup = new THREE.Group();
helpersGroup.name = 'grupo-helpers';
scene.add(helpersGroup);

const markersGroup = new THREE.Group();
markersGroup.name = 'grupo-marcadores';
scene.add(markersGroup);

// Referencias visuales globales
const worldAxesHelper = new THREE.AxesHelper(200);
scene.add(worldAxesHelper);

let gridHelper = new THREE.GridHelper(2000, 40, 0x64748b, 0x334155);
scene.add(gridHelper);

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xbfd7ff, 0x2b3340, 0.55);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(300, 400, 250);
dirLight.castShadow = true;
scene.add(dirLight);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.55);
dirLight2.position.set(-250, 180, -300);
scene.add(dirLight2);

// Definición de modelos
const modelDefs: ModelDefinition[] = [
  {
    id: 'n720',
    label: 'N720',
    url: '/models/N720.obj',
    color: 0x60a5fa
  },
  {
    id: 'rse',
    label: 'RSE',
    url: '/models/RSE.obj',
    color: 0xf59e0b
  }
];

type ModelRecord = LoadedGeoModel & {
  boxHelper?: THREE.BoxHelper;
};

const modelMap = new Map<string, ModelRecord>();
let globalOrigin: THREE.Vector3 | null = null;

// UI
const statusEl = document.querySelector<HTMLDivElement>('#status');
const toggleN720 = document.querySelector<HTMLInputElement>('#toggle-n720');
const toggleRSE = document.querySelector<HTMLInputElement>('#toggle-rse');
const inputX = document.querySelector<HTMLInputElement>('#input-x');
const inputY = document.querySelector<HTMLInputElement>('#input-y');
const inputZ = document.querySelector<HTMLInputElement>('#input-z');
const addMarkerBtn = document.querySelector<HTMLButtonElement>('#add-marker');

const frameAllBtn = document.querySelector<HTMLButtonElement>('#frame-all');
const frameN720Btn = document.querySelector<HTMLButtonElement>('#frame-n720');
const frameRSEBtn = document.querySelector<HTMLButtonElement>('#frame-rse');

if (
  !statusEl ||
  !toggleN720 ||
  !toggleRSE ||
  !inputX ||
  !inputY ||
  !inputZ ||
  !addMarkerBtn
) {
  throw new Error('No se encontraron todos los elementos de interfaz necesarios');
}

function updateDynamicGrid(): void {
  const sceneBox = new THREE.Box3().setFromObject(modelsGroup);
  const size = sceneBox.getSize(new THREE.Vector3());

  const maxHorizontalSize = Math.max(size.x, size.z);
  const gridSize = Math.max(200, Math.ceil(maxHorizontalSize * 1.5));
  const gridDivisions = 30;

  scene.remove(gridHelper);

  gridHelper = new THREE.GridHelper(
    gridSize,
    gridDivisions,
    0x64748b,
    0x334155
  );
  scene.add(gridHelper);
}

function frameObject(object: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(object);
  fitCameraToBox(camera, controls, box);
}

function setModelVisibility(modelId: string, visible: boolean): void {
  const model = modelMap.get(modelId);
  if (!model) return;

  model.object.visible = visible;
  if (model.boxHelper) {
    model.boxHelper.visible = visible;
  }
}

async function init(): Promise<void> {
  try {
    const loadedModels = await Promise.all(
      modelDefs.map((def) => loadGeoObj(def))
    );

    // Bounding box combinado en coordenadas de origen
    const combinedSourceBox = loadedModels.reduce((acc, model, index) => {
      if (index === 0) return model.sourceBox.clone();
      return acc.union(model.sourceBox);
    }, new THREE.Box3());

    globalOrigin = combinedSourceBox.getCenter(new THREE.Vector3());

    inputX.value = globalOrigin.x.toFixed(4);
    inputY.value = globalOrigin.y.toFixed(4);
    inputZ.value = globalOrigin.z.toFixed(4);

    // Transformación y carga en escena
    loadedModels.forEach((model) => {
      applyGeoTransformToObject(model.object, globalOrigin!);

      const record: ModelRecord = { ...model };
      modelMap.set(model.id, record);

      modelsGroup.add(model.object);

      const boxHelper = new THREE.BoxHelper(model.object, 0xffffff);
      boxHelper.name = `${model.id}-box-helper`;
      helpersGroup.add(boxHelper);
      record.boxHelper = boxHelper;
    });

    setModelVisibility('n720', true);
    setModelVisibility('rse', true);

    updateDynamicGrid();
    frameObject(modelsGroup);

    statusEl.textContent = 'Modelos cargados correctamente.';
  } catch (error) {
    console.error(error);
    statusEl.textContent = 'Error al cargar los modelos.';
  }
}

function createMarkerAtSourceCoords(x: number, y: number, z: number): void {
  if (!globalOrigin) return;

  markersGroup.clear();

  const scenePosition = toSceneCoords({ x, y, z }, globalOrigin);

  const markerGroup = new THREE.Group();

  const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);

  const cube = new THREE.Mesh(
    cubeGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xff3366,
      emissive: 0x661122,
      roughness: 0.5,
      metalness: 0.1
    })
  );
  cube.position.copy(scenePosition);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(cubeGeometry),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  edges.position.copy(scenePosition);

  const localAxes = new THREE.AxesHelper(35);
  localAxes.position.copy(scenePosition);

  markerGroup.add(cube);
  markerGroup.add(edges);
  markerGroup.add(localAxes);
  markersGroup.add(markerGroup);

  statusEl.textContent =
    `Marcador creado en coordenadas de origen (${x}, ${y}, ${z}) → ` +
    `escena (${scenePosition.x.toFixed(2)}, ${scenePosition.y.toFixed(2)}, ${scenePosition.z.toFixed(2)})`;

  controls.target.copy(scenePosition);
  controls.update();
}

toggleN720.addEventListener('change', () => {
  setModelVisibility('n720', toggleN720.checked);
});

toggleRSE.addEventListener('change', () => {
  setModelVisibility('rse', toggleRSE.checked);
});

addMarkerBtn.addEventListener('click', () => {
  const x = Number(inputX.value);
  const y = Number(inputY.value);
  const z = Number(inputZ.value);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    statusEl.textContent = 'Introduce valores numéricos válidos para X, Y y Z.';
    return;
  }

  createMarkerAtSourceCoords(x, y, z);
});

frameAllBtn?.addEventListener('click', () => {
  frameObject(modelsGroup);
});

frameN720Btn?.addEventListener('click', () => {
  const model = modelMap.get('n720');
  if (model) frameObject(model.object);
});

frameRSEBtn?.addEventListener('click', () => {
  const model = modelMap.get('rse');
  if (model) frameObject(model.object);
});

function animate(): void {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

await init();
animate();