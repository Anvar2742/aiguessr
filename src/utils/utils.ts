export const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  // Swap elements
    }
    return array
};

export const shuffleRecord = <T>(record: Record<string, T>): Record<string, T> => {
    const entries = Object.entries(record); // Convert record to an array of key-value pairs

    for (let i = entries.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [entries[i], entries[j]] = [entries[j], entries[i]]; // Swap elements
    }

    return Object.fromEntries(entries); // Convert the shuffled array back to a record
};




export const getChatKey = (from: string, to: string) => {
    return [from, to].sort((a, b) => a.localeCompare(b)).join('-').toLowerCase();
}

// Sanitize email by taking only the part before "@"
export const sanitizeEmail = (email: string): string => {
    return email.replace(/@|\./g, '_');
};

export interface Player {
    email: string;
    status: 'connected' | 'disconnected';
    state: "dead" | "alive";
}

export const isInvalidEmailAndContainsChatGPT = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    return !emailRegex.test(email) && email.toLowerCase().includes("chatgpt");
};