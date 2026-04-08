import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { buildGeoTransform } from '../spatial/spatial';

export interface ModelDefinition {
  id: string;
  label: string;
  url: string;
  color: number;
}

export interface LoadedGeoModel {
  id: string;
  label: string;
  object: THREE.Group;
  sourceBox: THREE.Box3;
  sourceReferencePoint: THREE.Vector3;
}

/**
 * Some source OBJ files use decimal commas in v/vn/vt lines.
 * Three.js expects decimal points, so we normalize only numeric coordinate lines.
 */
export function normalizeObjNumericFormat(objText: string): string {
  return objText
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trimStart();

      if (trimmed.startsWith('v ') || trimmed.startsWith('vn ') || trimmed.startsWith('vt ')) {
        return line.replace(/,/g, '.');
      }

      return line;
    })
    .join('\n');
}

function findReferencePointOnGeometry(
  object: THREE.Object3D,
  sourceBox: THREE.Box3
): THREE.Vector3 {
  const boxCenter = sourceBox.getCenter(new THREE.Vector3());
  const candidate = new THREE.Vector3();
  const bestPoint = new THREE.Vector3();
  let bestDistanceSq = Number.POSITIVE_INFINITY;

  object.updateMatrixWorld(true);

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const geometry = mesh.geometry as THREE.BufferGeometry;
    const positions = geometry.getAttribute('position');
    if (!positions) return;

    for (let i = 0; i < positions.count; i += 1) {
      candidate
        .fromBufferAttribute(positions, i)
        .applyMatrix4(mesh.matrixWorld);

      const distanceSq = candidate.distanceToSquared(boxCenter);
      if (distanceSq < bestDistanceSq) {
        bestDistanceSq = distanceSq;
        bestPoint.copy(candidate);
      }
    }
  });

  if (Number.isFinite(bestDistanceSq)) {
    return bestPoint;
  }

  return boxCenter;
}

export async function loadGeoObj(def: ModelDefinition): Promise<LoadedGeoModel> {
  const response = await fetch(def.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${def.url}`);
  }

  const rawText = await response.text();
  const normalizedText = normalizeObjNumericFormat(rawText);

  const loader = new OBJLoader();
  const object = loader.parse(normalizedText);
  object.name = def.label;

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const geometry = mesh.geometry as THREE.BufferGeometry;
    geometry.computeVertexNormals();

    mesh.material = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  const sourceBox = new THREE.Box3().setFromObject(object);
  const sourceReferencePoint = findReferencePointOnGeometry(object, sourceBox);

  return {
    id: def.id,
    label: def.label,
    object,
    sourceBox,
    sourceReferencePoint
  };
}

export function applyGeoTransformToObject(object: THREE.Object3D, origin: THREE.Vector3): void {
  const matrix = buildGeoTransform(origin);

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const geometry = mesh.geometry as THREE.BufferGeometry;
    geometry.applyMatrix4(matrix);
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    geometry.computeVertexNormals();
  });
}
