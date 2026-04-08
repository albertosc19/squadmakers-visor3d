import * as THREE from 'three';

export interface GeoPoint {
  x: number;
  y: number;
  z: number;
}

export interface CameraControlsLike {
  target: THREE.Vector3;
  update: () => void;
}

/**
 * Converts source XYZ geospatial coordinates (Z-up) into Three.js scene coordinates (Y-up).
 * Mapping used:
 *   scene.x = geo.x - origin.x
 *   scene.y = geo.z - origin.z
 *   scene.z = -(geo.y - origin.y)
 */
export function toSceneCoords(point: GeoPoint, origin: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3(
    point.x - origin.x,
    point.z - origin.z,
    -(point.y - origin.y)
  );
}

/**
 * Builds a transform matrix that first translates the model to a local origin
 * and then converts from Z-up to Three.js Y-up.
 */
export function buildGeoTransform(origin: THREE.Vector3): THREE.Matrix4 {
  const translation = new THREE.Matrix4().makeTranslation(-origin.x, -origin.y, -origin.z);
  const rotation = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
  return new THREE.Matrix4().multiplyMatrices(rotation, translation);
}

export function fitCameraToBox(
  camera: THREE.PerspectiveCamera,
  controls: CameraControlsLike,
  box: THREE.Box3
): void {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = 1.4 * Math.max(fitHeightDistance, fitWidthDistance);

  const direction = new THREE.Vector3(1, 0.8, 1).normalize();

  camera.position.copy(center).add(direction.multiplyScalar(distance));
  camera.near = Math.max(0.1, distance / 1000);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}
