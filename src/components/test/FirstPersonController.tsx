import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const FirstPersonController: React.FC<{
    isEdit: boolean
}> = ({ isEdit }) => {
    const { camera } = useThree();
    const velocity = useRef(new THREE.Vector3());
    const direction = useRef(new THREE.Vector3());
    const keys = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
    });

    const isGrounded = useRef(true);
    const gravity = -50;
    const jumpStrength = 20;

    // Handle key events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.code) {
                case "KeyW":
                    keys.current.forward = true;
                    break;
                case "KeyS":
                    keys.current.backward = true;
                    break;
                case "KeyA":
                    keys.current.left = true;
                    break;
                case "KeyD":
                    keys.current.right = true;
                    break;
                case "Space":
                    if (isGrounded.current) {
                        keys.current.jump = true;
                        isGrounded.current = false; // Prevent double jump
                    }
                    break;
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case "KeyW":
                    keys.current.forward = false;
                    break;
                case "KeyS":
                    keys.current.backward = false;
                    break;
                case "KeyA":
                    keys.current.left = false;
                    break;
                case "KeyD":
                    keys.current.right = false;
                    break;
                case "Space":
                    keys.current.jump = false;
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Move player
    useFrame((_, delta) => {
        if (document.pointerLockElement === null || isEdit) {
            return; // Skip movement if pointer lock is not active
        }

        const speed = 60;
        direction.current.set(0, 0, 0);

        if (keys.current.forward) direction.current.z -= 1;
        if (keys.current.backward) direction.current.z += 1;
        if (keys.current.left) direction.current.x -= 1;
        if (keys.current.right) direction.current.x += 1;

        // Apply rotation to direction
        direction.current.applyEuler(camera.rotation);
        direction.current.normalize();

        // Prevent movement along the Y-axis (no flying)
        direction.current.y = 0;

        if (!keys.current.forward && !keys.current.backward && !keys.current.left && !keys.current.right) {
            velocity.current.set(0, velocity.current.y, 0);
        }

        velocity.current.addScaledVector(direction.current, speed * delta);
        velocity.current.multiplyScalar(0.9); // Friction

        // Apply gravity and jump
        if (!isGrounded.current) {
            velocity.current.y += gravity * delta;
        }
        if (keys.current.jump) {
            velocity.current.y += jumpStrength;
            keys.current.jump = false;
        }

        const newPosition = camera.position.clone().addScaledVector(velocity.current, delta);

        // Check ground collision
        if (newPosition.y <= 1.6) {
            newPosition.y = 1.6;
            velocity.current.y = 0;
            isGrounded.current = true;
        }

        camera.position.copy(newPosition);
    });

    return null;
};

export default FirstPersonController;
