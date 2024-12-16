import React, { useEffect } from "react";
import { io } from "socket.io-client";
import * as THREE from "three";

const socket = io("http://localhost:3001");

const LetterSender: React.FC<{
    heldObject: THREE.Object3D | null;
    setHeldObject: React.Dispatch<React.SetStateAction<THREE.Object3D | null>>;
}> = ({ heldObject, setHeldObject }) => {

    useEffect(() => {
        const handleSendLetter = (e: KeyboardEvent) => {
            if (e.code === "KeyT" && heldObject) {
                const message = heldObject.userData.message || "";
                console.log(heldObject);
                
                const letterData = {
                    id: heldObject.uuid,
                    name: heldObject.name,
                    message,
                    position: heldObject.position.toArray(),
                };

                socket.emit("sendLetter", letterData);
                console.log("Sent letter:", letterData);

                // Drop the letter after sending !NOT DROPPING VISUALLY!
                // setHeldObject(null);
            }
        };

        window.addEventListener("keydown", handleSendLetter);
        return () => {
            window.removeEventListener("keydown", handleSendLetter);
        };
    }, [heldObject, setHeldObject]);

    useEffect(() => {
        socket.on("receiveLetter", (data) => {
            console.log("Received letter:", data);
            // Handle receiving the letter, e.g., placing it in the scene
        });

        return () => {
            socket.off("receiveLetter");
        };
    }, []);

    return null;
};

export default LetterSender;
