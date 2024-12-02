export const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  // Swap elements
    }
    return array
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
