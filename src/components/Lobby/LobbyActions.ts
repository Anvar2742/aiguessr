import { Database, onValue, ref, set, update } from "firebase/database";
import { Player, sanitizeEmail } from "../../utils/utils";
import { useEffect } from "react";

export const handleCopyClick = async (roomCode: string | undefined, setCopySuccess: (arg0: boolean) => void) => {
    try {
        if (!roomCode) return;
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
        setCopySuccess(false);
        console.error('Failed to copy: ', err);
    }
};

export const handleStartGame = async (players: Record<string, Player>, setError: (arg0: string) => void, realtimeDb: Database, roomCode: string | undefined) => {
    const playersLength: number = Object.entries(players).length
    if (playersLength === 0) {
        setError("No players in the lobby to start the game.");
        return;
    }

    const playersValues = Object.values(players); // Convert Record to an array of Player objects
    const randomSeeker = playersValues[Math.floor(Math.random() * playersValues.length)]?.email;

    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
    console.log(players);

    try {
        await update(roomRef, {
            gameState: "start",
            seeker: randomSeeker
        });
    } catch (error) {
        console.error("Error starting the game:", error);
        setError("Failed to start the game. Please try again.");
    }
};

interface LobbyManagerArgs {
    realtimeDb: Database; // Firebase Realtime Database instance
    user: { email: string } | null; // User object with email
    roomCode: string | undefined; // Room code
    setPlayers: (players: Record<string, any>) => void; // Function to update players state
    setError: (error: string) => void; // Function to update error state
    setLoading: (loading: boolean) => void; // Function to update loading state
    setHost: (host: string | null) => void; // Function to update host state
    navigate: (path: string) => void; // Function to navigate to a new route
}

export const useLobbyManager = ({
    realtimeDb,
    user,
    roomCode,
    setPlayers,
    setError,
    setLoading,
    setHost,
    navigate,
}: LobbyManagerArgs) => {
    useEffect(() => {
        if (!user || !roomCode) return;

        const sanitizedEmail = sanitizeEmail(user.email);
        const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);

        // Attempt to set player in Realtime Database
        set(playerRef, { email: user.email, status: 'connected', state: "alive" })
            .then(() => {
                // console.log("Player set successfully.");
                setError("");
            })
            .catch((error) => {
                console.error("Error adding player to database:", error);
                setError("Failed to join the lobby. Please check your network or database permissions.");
                setLoading(false);
            });

        // Listen for changes to player statuses
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        const roomListener = onValue(
            roomRef,
            (snapshot) => {
                const roomData = snapshot.val();

                if (roomData) {
                    const playersData = roomData.players || {};
                    setPlayers(playersData);
                    // console.log("Players data updated:", playersData);

                    if (!roomData.host && Object.entries(playersData).length > 0) {
                        const firstPlayerKey = Object.keys(playersData)[0];
                        const firstPlayerEmail = playersData[firstPlayerKey].email;

                        setHost(firstPlayerEmail);

                        update(roomRef, { host: firstPlayerEmail })
                            // .then(() => console.log("Host set successfully:", firstPlayerEmail))
                            .catch((error) => console.error("Failed to set host:", error));
                    } else {
                        setHost(roomData.host);
                    }
                } else {
                    // console.error("Room data not found.");
                    setError("Room not found. Please check the room code.");
                }
                setLoading(false);
            },
            (error) => {
                console.error("Error listening to room data:", error);
                setError("Error loading room. Please try again.");
                setLoading(false);
            }
        );

        // Listen for game start
        const gameRef = ref(realtimeDb, `rooms/${roomCode}/gameState`);
        const gameListener = onValue(gameRef, (snapshot) => {
            const gameState = snapshot.val();
            if (gameState === "start") {
                navigate(`/game/${roomCode}`);
            }
        });

        return () => {
            roomListener();
            gameListener();
        };
    }, [roomCode, user, setPlayers, setError, setLoading, setHost, navigate, realtimeDb]);
};