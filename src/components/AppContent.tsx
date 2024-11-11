import { Link } from "react-router-dom";
import CreateRoom from "./CreateRoom";
import JoinRoom from "./JoinRoom";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { auth } from "../firebase";

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);

    const handleLogout = async () => {
        await signOut(auth); // Sign out the user
    };

    return (
        <div className="h-screen bg-gray-100 flex justify-center items-center">
            {!user ? (
                <div className="text-center">
                    <p>Please log in to create or join rooms.</p>
                    <p>
                        <Link to="/signup" className="text-blue-500 hover:underline">
                            Sign up
                        </Link>{' '}
                        or{' '}
                        <Link to="/login" className="text-blue-500 hover:underline">
                            Log in
                        </Link>
                        .
                    </p>
                </div>
            ) : (
                <div className="w-full max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
                    {isCreatingRoom ? (
                        <CreateRoom />
                    ) : (
                        <JoinRoom />
                    )}
                    <div className="flex justify-between mt-6">
                        <button
                            className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onClick={() => setIsCreatingRoom(true)}
                        >
                            Create Room
                        </button>
                        <button
                            className="py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                            onClick={() => setIsCreatingRoom(false)}
                        >
                            Join Room
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 mt-6"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppContent