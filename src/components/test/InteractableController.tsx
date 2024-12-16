import React, { useEffect, useRef, useState } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const InteractableController: React.FC<{
    interactables: React.RefObject<THREE.Object3D[]>;
    onPickUp: (object: THREE.Object3D) => void;
    onDrop: () => void;
    isEdit: boolean
}> = ({ interactables, onPickUp, onDrop, isEdit }) => {
    const { camera } = useThree();
    const raycaster = useRef(new THREE.Raycaster());
    const interactKey = "KeyE";
    const [heldObject, setHeldObject] = useState<THREE.Object3D | null>(null);

    useEffect(() => {
        if (isEdit) return;
        const handleInteraction = (e: KeyboardEvent) => {
            if (e.code === interactKey) {
                if (heldObject) {
                    // Drop the held object
                    heldObject.position.copy(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2)));
                    setHeldObject(null);
                    onDrop();
                    console.log("Dropped object:", heldObject.name);
                } else if (interactables.current) {
                    // Attempt to pick up an object
                    raycaster.current.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
                    const intersects = raycaster.current.intersectObjects(interactables.current);

                    if (intersects.length > 0) {
                        const target = intersects[0].object;
                        if (target.userData.canPickUp) {
                            setHeldObject(target);
                            onPickUp(target);
                            console.log("Picked up:", target.name);
                        } else {
                            console.log("Cannot pick up:", target.name);
                        }
                    }
                }
            }
        };

        window.addEventListener("keydown", handleInteraction);
        return () => {
            window.removeEventListener("keydown", handleInteraction);
        };
    }, [camera, interactables, heldObject, onPickUp, onDrop]);

    // Update the position of the held object to follow the camera
    useFrame(() => {
        if (heldObject) {
            heldObject.position.copy(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1.5)));
        }
    });

    return null;
};


export default InteractableController
