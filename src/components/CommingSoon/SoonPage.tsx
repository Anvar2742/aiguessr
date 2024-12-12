import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';

const SoonPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4">AI Guesser</h1>
            <p className="text-lg mb-8">The ultimate AI vs human multiplayer showdown is coming soon!</p>

            <div className="w-full h-64">
                <Canvas>
                    {/* A 3D spinning sphere */}
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[2, 2, 2]} />
                    <Sphere args={[1, 32, 32]} scale={1.5}>
                        <meshStandardMaterial attach="material" color="blue" wireframe />
                    </Sphere>
                    <OrbitControls />
                </Canvas>
            </div>

            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-8"
                onClick={() => alert('Mini-game coming soon!')}
            >
                Play Mini-Game
            </button>

            <footer className="mt-12 text-sm text-gray-400">
                &copy; 2024 AI Guesser. All Rights Reserved.
            </footer>
        </div>
    );
};

export default SoonPage;
