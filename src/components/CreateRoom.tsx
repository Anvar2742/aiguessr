import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Using react-router for navigation

const CreateRoom: React.FC = () => {
	const [roomCode, setRoomCode] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	function generateRoomCode() {
		return Math.random().toString(36).substring(2, 8).toUpperCase();
	}

	useEffect(() => {
		setRoomCode(generateRoomCode())
	}, [])

	const handleCreateRoom = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!roomCode) {
			setError('Room name is required');
			return;
		}
		setLoading(true);
		setError('');
		try {
			// Create a new room document in Firestore

			// Navigate to the newly created room's lobby page
			navigate(`/lobby/${roomCode}`); // Redirect to lobby using room name as code
		} catch (error: any) {
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

	if (!roomCode) return;
	return (
		<div className="max-w-sm mx-auto p-6 bg-white shadow-lg rounded-lg">
			<h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Create a Room</h2>
			<p className='mb-5'>Room code: <b>{roomCode}</b></p>
			<form onSubmit={handleCreateRoom} className="space-y-4">
				{error && <p className="text-red-500 text-sm">{error}</p>}
				<button
					type="submit"
					disabled={loading}
					className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
				>
					{loading ? 'Creating room...' : 'Create Room'}
				</button>
			</form>
		</div>
	);
};

export default CreateRoom;
