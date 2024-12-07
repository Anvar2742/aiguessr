import { onValue, ref } from "firebase/database";
import { realtimeDb } from "../../firebase";
import { getMessagesRef, deleteData, getPlayersRef, fetchData, updateData, getRoomRef } from "../../utils/firebaseUtils";
import { Dispatch, MutableRefObject, SetStateAction } from "react";
import { isInvalidEmailAndContainsChatGPT, Player, sanitizeEmail, shuffleRecord } from "../../utils/utils";
import { addChatGPTAtRandomPosition } from "./GptUtils";

export const deleteMessagesInRoom = async (
    roomCode: string,
    setMessages: Dispatch<SetStateAction<any[]>>
) => {
    const messagesRef = getMessagesRef(roomCode);
    setMessages([]); // Clear the state
    await deleteData(messagesRef); // Delete from the database
};

export const murderPlayer = async (roomCode: string, emailToMurder: string) => {
    const playersRef = getPlayersRef(roomCode);
    const players: Record<string, Player> = await fetchData(playersRef);

    if (!players) {
        console.error("No players found in the database.");
        return;
    }

    const sanitizedEmail = sanitizeEmail(emailToMurder)

    if (sanitizedEmail) {
        const playerRef = ref(realtimeDb, `rooms/${roomCode}/players/${sanitizedEmail}`);
        await updateData(playerRef, { state: "dead" });
    } else {
        console.error("Player not found with the given email.");
    }
};

export const handleGuess = async (
    guessEmail: string,
    seeker: string,
    user: { email: string },
    players: Record<string, Player> | undefined,
    setSeeker: (newSeeker: string) => void,
    roomCode: string,
    setMessages: Dispatch<SetStateAction<any[]>>,
    shuffledPlayersRef: MutableRefObject<Record<string, Player> | undefined>,
    setPlayers: (players: Record<string, Player>) => void
) => {
    if (seeker !== user?.email) {
        alert("Only the seeker can make guesses.");
        return;
    }

    if (!guessEmail) {
        console.log("No chat chosen.");
        return;
    }

    const roomRef = getRoomRef(roomCode);

    if (!players) return
    await deleteMessagesInRoom(roomCode, setMessages);
    if (isInvalidEmailAndContainsChatGPT(guessEmail)) {
        // game over winner is seeker
        console.log("game over seeker WON!");
        await updateData(roomRef, {
            winner: seeker,
            gameState: "over",
        });
    } else {
        const playersArr = Object.entries(players)
        await murderPlayer(roomCode, seeker);
        const humanAlivePlayers = playersArr.filter(
            ([, player]) =>
                player.email.toLowerCase() !== "chatgpt" &&
                player.email.toLowerCase() !== seeker
        );

        if (humanAlivePlayers.length > 1) {
            const randomSeeker =
                humanAlivePlayers[
                    Math.floor(Math.random() * humanAlivePlayers.length)
                ][1].email;

            setSeeker(randomSeeker);

            await updateData(roomRef, {
                gameState: "round",
                seeker: randomSeeker
            });

        } else {
            // game over, the last person alive won
            // Log the single human alive player
            console.log("Only one human player is alive:", humanAlivePlayers[0][1].email);
            await updateData(roomRef, {
                winner: humanAlivePlayers[0][1].email,
                gameState: "over",
            });
            return
        }


        // shuffle players and set gpt
        onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.val();

                if (!shuffledPlayersRef.current) return
                if (Object.entries(shuffledPlayersRef.current).length === 0) {
                    const playersArray = Object.entries(roomData.players) as [string, Player][];
                    const alivePlayers = playersArray.filter(([, player]) => player.state === "alive");

                    if (alivePlayers.length === 0) return;

                    shuffledPlayersRef.current = addChatGPTAtRandomPosition(
                        shuffleRecord(Object.fromEntries(alivePlayers))
                    );
                }

                setPlayers(shuffledPlayersRef.current);
            } else {
                console.error("Room not found:", roomCode);
            }
        });
    }
};