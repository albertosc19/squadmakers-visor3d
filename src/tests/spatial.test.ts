import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { toSceneCoords } from '../spatial/spatial';

describe('toSceneCoords', () => {
  it('maps geospatial XYZ to Three.js scene coordinates', () => {
    const origin = new THREE.Vector3(100, 200, 300);

    const scenePoint = toSceneCoords({ x: 110, y: 230, z: 315 }, origin);

    expect(scenePoint.x).toBe(10);
    expect(scenePoint.y).toBe(15);
    expect(scenePoint.z).toBe(-30);
  });
});
