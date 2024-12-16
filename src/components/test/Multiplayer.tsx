import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import FirstPersonController from "./FirstPersonController";
import InputArea from "./InputArea";
import * as THREE from "three";
import InteractableController from "./InteractableController";
import LetterSender from "./LetterSender";

const Multiplayer: React.FC = () => {
    const interactables = useRef<THREE.Object3D[]>([]);
    const [heldObject, setHeldObject] = useState<THREE.Object3D | null>(null);
    const [isEdit, setIsEdit] = useState<boolean>(false);

    return (
        <div style={{ height: "100vh", position: "relative" }}>
            <Canvas camera={{ fov: 75, position: [0, 1.6, 5] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <directionalLight position={[6, 5, 6]} intensity={1} />

                {/* Ground */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                    <planeGeometry args={[50, 50]} />
                    <meshStandardMaterial color="white" />
                </mesh>

                {/* Test Cube (Interactable) */}
                <mesh
                    position={[0, 1, 0]}
                    ref={(mesh) => {
                        if (mesh && !interactables.current.includes(mesh)) {
                            mesh.userData.canPickUp = true; // Mark the cube as pickable
                            interactables.current.push(mesh);
                        }
                    }}
                    name="Letter"
                >
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="red" />
                </mesh>

                {/* {The office walls} */}
                <mesh position={[0, 2, 0]}>
                    <boxGeometry args={[15, 5, 15]} />
                    <meshStandardMaterial color="orange" side={THREE.BackSide} />
                </mesh>
                <gridHelper args={[50, 50]} position={[0, 0.02, 0]} />

                {/* Controllers */}
                <FirstPersonController isEdit={isEdit} />
                <InteractableController
                    interactables={interactables}
                    onPickUp={(object) => setHeldObject(object)}
                    onDrop={() => setHeldObject(null)}
                    isEdit={isEdit}
                />
                <PointerLockControls />

                <LetterSender heldObject={heldObject} setHeldObject={setHeldObject} />
            </Canvas>

            {/* Input Area */}
            <InputArea heldObject={heldObject} setIsEdit={setIsEdit} />
        </div>
    );
};

export default Multiplayer;
