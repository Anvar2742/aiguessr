import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { GridHelper } from 'three';
import * as THREE from 'three';

// Helper functions
function lerp(x: number, y: number, a: number): number {
    return (1 - a) * x + a * y;
}

// Will convert a scroll percentage range into a normalized 0 to 1 for that segment
function scalePercent(scrollPercent: number, start: number, end: number): number {
    return (scrollPercent - start) / (end - start);
}

type AnimationScript = {
    start: number;
    end: number;
    func: (scrollPercent: number, cube: THREE.Mesh, camera: THREE.PerspectiveCamera, material: THREE.MeshBasicMaterial) => void;
};

// We replicate the animation scripts logic from the original code
const animationScripts: AnimationScript[] = [
    // Changes the cube's color green channel continuously
    {
        start: 0,
        end: 101,
        func: (scrollPercent, cube, camera, material) => {
            let g = material.color.g;
            g -= 0.05;
            if (g <= 0) {
                g = 1.0;
            }
            material.color.g = g;
        },
    },

    // Move cube from z = -10 to z = 0 from 0% to 40% scroll
    {
        start: 0,
        end: 40,
        func: (scrollPercent, cube, camera, material) => {
            camera.lookAt(cube.position);
            camera.position.set(0, 1, 2);
            cube.position.z = lerp(-10, 0, scalePercent(scrollPercent, 0, 40));
        },
    },

    // Rotate the cube between 40% and 60% scroll
    {
        start: 40,
        end: 60,
        func: (scrollPercent, cube, camera, material) => {
            camera.lookAt(cube.position);
            camera.position.set(0, 1, 2);
            cube.rotation.z = lerp(0, Math.PI, scalePercent(scrollPercent, 40, 60));
        },
    },

    // Move camera between 60% and 80% scroll
    {
        start: 60,
        end: 80,
        func: (scrollPercent, cube, camera, material) => {
            camera.position.x = lerp(0, 5, scalePercent(scrollPercent, 60, 80));
            camera.position.y = lerp(1, 5, scalePercent(scrollPercent, 60, 80));
            camera.lookAt(cube.position);
        },
    },

    // Auto rotate the cube after 80% scroll
    {
        start: 80,
        end: 101,
        func: (scrollPercent, cube, camera, material) => {
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
        },
    },
];

// The 3D scene component
const Scene: React.FC<{ scrollPercent: number }> = ({ scrollPercent }) => {
    const { camera, scene } = useThree();
    const cubeRef = useRef<THREE.Mesh>(null!);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null!);

    // Add grid helper (equivalent to the original code)
    useEffect(() => {
        const gridHelper = new THREE.GridHelper(10, 10, 0xaec6cf, 0xaec6cf);
        scene.add(gridHelper);
        return () => {
            scene.remove(gridHelper);
        };
    }, [scene]);

    // Every frame, run the appropriate animation scripts based on scrollPercent
    useFrame(() => {
        const cube = cubeRef.current;
        const material = materialRef.current;
        if (!cube || !material) return;

        for (const script of animationScripts) {
            if (scrollPercent >= script.start && scrollPercent < script.end) {
                script.func(scrollPercent, cube, camera as THREE.PerspectiveCamera, material);
            }
        }
    });

    return (
        <mesh ref={cubeRef} position={[0, 0.5, -10]}>
            <boxGeometry />
            <meshBasicMaterial ref={materialRef} color={0x00ff00} wireframe />
        </mesh>
    );
};

const ScrollAnim: React.FC = () => {
    const [scrollPercent, setScrollPercent] = useState(0);

    const handleScroll = useCallback(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = (document.documentElement.scrollHeight || document.body.scrollHeight) - document.documentElement.clientHeight;
        const percent = (scrollTop / scrollHeight) * 100;
        setScrollPercent(percent);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    return (
        <>
            <Canvas
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                }}
                camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 1, 2] }}
            >
                {/* <color attach="background" args={['#000000']} /> */}
                <Scene scrollPercent={scrollPercent} />
            </Canvas>
        </>
    );
};

export default ScrollAnim;