import { Player } from "../../utils/utils";

export const addChatGPTAtRandomPosition = (players: Record<string, Player>): Record<string, Player> => {
    const chatGPTKey = "chatgpt";
    const chatGPT: Player = { email: "chatgpt", status: "connected", state: "alive" };

    // Convert the record to an array of entries
    const playersArray = Object.entries(players);

    // Generate a random index
    const randomIndex = Math.floor(Math.random() * (playersArray.length + 1));

    // Add ChatGPT at the random position
    playersArray.splice(randomIndex, 0, [chatGPTKey, chatGPT]);

    // Convert the array back to a record
    return Object.fromEntries(playersArray);
};



export const sendMessageToGPT = async (message: string, user: { email: string; }, roomCode: string | undefined) => {
    if (!roomCode) return
    try {
        const response = await fetch(import.meta.env.DEV ? 'http://127.0.0.1:5001/aiguessr-vf/europe-west1/sendMessageToGPT' : "https://sendmessagetogpt-zfgfpmp7fq-ew.a.run.app", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userId: user?.email, roomCode }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        // const data = await response.json();
        // console.log('GPT Response:', data.reply || 'No response');
    } catch (error) {
        console.error('Error sending message to GPT:', error);
    }
};