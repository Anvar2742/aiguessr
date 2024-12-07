import { ref, onValue, off, remove, update, get } from "firebase/database";
import { fetchData, getRoomRef } from "../../utils/firebaseUtils";
import { Player, shuffleRecord } from "../../utils/utils";
import { addChatGPTAtRandomPosition } from "./GptUtils";
import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { realtimeDb } from "../../firebase";
import { Message } from "./GamePage";

/**
 * Fetch room data and update the seeker and players.
 * @param roomCode - Room code.
 * @param setSeeker - Function to update the seeker.
 * @param shuffledPlayersRef - Mutable reference for shuffled players.
 * @param setPlayers - Function to update the players state.
 * @param navigate - Function to navigate to another route.
 */
export const fetchRoomData = async (
    roomCode: string | undefined,
    setSeeker: (seeker: string) => void,
    shuffledPlayersRef: MutableRefObject<Record<string, Player> | undefined>,
    setPlayers: Dispatch<SetStateAction<Record<string, Player> | undefined>>,
    navigate: (path: string) => void
) => {
    if (!roomCode) return;

    try {
        const roomRef = getRoomRef(roomCode);
        const roomData = await fetchData(roomRef); // Use fetchData helper

        if (roomData) {
            setSeeker(roomData.seeker);

            // if (!shuffledPlayersRef.current) return
            // Shuffle players only once and store the result in a ref
            if (!shuffledPlayersRef.current) {
                // Assert that players in roomData are of type Record<string, Player>
                const players = roomData.players as Record<string, Player>;

                const shuffledPlayers = shuffleRecord(players);
                shuffledPlayersRef.current = addChatGPTAtRandomPosition(shuffledPlayers);
            }

            setPlayers(shuffledPlayersRef.current);
        } else {
            console.error("Room not found:", roomCode);
            navigate("/");
        }
    } catch (error) {
        console.error("Error fetching room data:", error);
    }
};

/**
 * Fetch messages from the room and update the messages state.
 * @param roomCode - Room code.
 * @param setMessages - Function to update the messages state.
 */
export const fetchMessages = (
    roomCode: string | undefined,
    setMessages: Dispatch<SetStateAction<Message[]>>
) => {
    console.log("fetching msg");
    
    if (!roomCode) return;

    const messagesRef = ref(realtimeDb, `rooms/${roomCode}/messages`);

    onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
            const fetchedMessages: Message[] = [];
            snapshot.forEach((childSnapshot) => {
                const messageData = childSnapshot.val();
                fetchedMessages.push({
                    id: childSnapshot.key || "",
                    ...messageData,
                });
            });
            
            setMessages(fetchedMessages);
        }
    });

    return () => off(messagesRef);
};

/**
 * Handle a player leaving the lobby.
 * @param roomCode - The room code.
 * @param userEmail - The email of the user leaving the lobby.
 * @param navigate - Function to navigate to another route.
 */
export const handleLeaveLobby = async (
    roomCode: string | undefined,
    userEmail: string | undefined,
    navigate: (path: string) => void
) => {
    if (!roomCode || !userEmail) return;

    const sanitizedEmail = userEmail.split("@")[0];
    const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

    try {
        // Remove the player from the room
        await remove(playerRef);

        // Check if the leaving player is the host
        const roomSnapshot = await get(roomRef);

        if (roomSnapshot.exists() && roomSnapshot.val().host === userEmail) {
            // Notify players that the room is deleted
            await update(roomRef, { roomDeleted: true });

            remove(roomRef)
        }
    } catch (error) {
        console.error("Error leaving lobby:", error);
    }

    // Navigate back to the main page
    navigate("/");
};

export const handleReStartGame = async (roomCode: string | undefined) => {
    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
    const roomData = await fetchData(roomRef);

    if (!roomData) {
        console.log("Room not found");
        return;
    }

    const playersLength: number = Object.entries(roomData.players).length;
    if (playersLength === 0) {
        console.error("No players in the lobby to start the game.");
        return;
    }

    const playersArr: [string, Player][] = Object.entries(roomData.players);
    const randomSeeker = playersArr[Math.floor(Math.random() * playersLength)][1].email;

    // Update all players' state to "alive"
    const updatedPlayers = playersArr.reduce((acc, [key, player]) => {
        acc[key] = { ...player, state: "alive" };
        return acc;
    }, {} as Record<string, Player>);

    try {
        await update(roomRef, {
            players: updatedPlayers, // Update all players with state "alive"
            gameState: "round",
            seeker: randomSeeker,
            winner: ""
        });

        console.log("Game started successfully. Players updated.");
    } catch (error) {
        console.error("Error starting the game:", error);
    }
};
