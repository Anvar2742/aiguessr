import { ref, get, update, remove } from "firebase/database";
import { realtimeDb } from '../firebase';

export const getRoomRef = (roomCode: string) => ref(realtimeDb, `rooms/${roomCode}`);
export const getPlayersRef = (roomCode: string) => ref(realtimeDb, `rooms/${roomCode}/players`);
export const getMessagesRef = (roomCode: string) => ref(realtimeDb, `rooms/${roomCode}/messages`);

export const fetchData = async (firebaseRef: ReturnType<typeof ref>)=> {
    try {
        const snapshot = await get(firebaseRef);
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}; 

export const updateData = async (firebaseRef: ReturnType<typeof ref>, data: object) => {
    try {
        await update(firebaseRef, data);
        console.log("Data updated successfully:", data);
    } catch (error) {
        console.error("Error updating data:", error);
    }
};

export const deleteData = async (firebaseRef: ReturnType<typeof ref>) => {
    try {
        await remove(firebaseRef);
        console.log("Data deleted successfully.");
    } catch (error) {
        console.error("Error deleting data:", error);
    }
};
