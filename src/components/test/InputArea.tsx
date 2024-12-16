import React, { useState, useEffect, useRef } from "react";

const InputArea: React.FC<{ heldObject: any | null; setIsEdit: React.Dispatch<React.SetStateAction<boolean>> }> = ({ heldObject, setIsEdit }) => {
    const [isInputVisible, setInputVisible] = useState(false);
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {

        const handleInputToggle = (e: KeyboardEvent) => {

            if (e.code === "Tab") {
                e.preventDefault();
                if (heldObject) {
                    setInputVisible(prev => !prev);
                    setIsEdit(prev => !prev);
                }
            }
        };

        window.addEventListener("keydown", handleInputToggle);
        return () => {
            window.removeEventListener("keydown", handleInputToggle);
        };
    }, [heldObject]);

    useEffect(() => {
        if (isInputVisible && textareaRef.current) {
            textareaRef.current.focus(); // Focus on the textarea when it becomes visible
            textareaRef.current.selectionStart = textareaRef.current.value.length; // Move cursor to the end
            textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
    }, [isInputVisible]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        if (heldObject) {
            heldObject.userData.message = e.target.value;
        }
    };

    return (
        <>
            {isInputVisible && (
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 p-5 rounded-lg text-white z-10"
                >
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInputChange}
                        className="text-gray-900 text-lg w-64 h-32 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            )}
        </>
    );
};

export default InputArea;
