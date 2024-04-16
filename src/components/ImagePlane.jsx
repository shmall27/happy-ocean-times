import { useRef, useEffect } from 'react';
import { useLoader, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ImagePlane = ({ position, path }) => {
  const imageTexture = useLoader(THREE.TextureLoader, path);
  const planeRef = useRef();
  const { camera } = useThree();


  useEffect(() => {
    if (planeRef.current && imageTexture) {
      planeRef.current.material.map = imageTexture;
      imageTexture.needsUpdate = true;
    }
  }, [imageTexture]);

  useFrame(() => {
    if (planeRef.current) {
      planeRef.current.lookAt(camera.position);
    }
  });

  return (
    <mesh
      ref={planeRef}
      position={position}
      geometry={new THREE.PlaneGeometry(20, 20)}
      material={new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
        map: imageTexture
      })}
    />
  );
}
