import React, { useEffect, useState } from 'react';
import { getFirestore, collection, doc, getDocs, query, where } from 'firebase/firestore';
import useFingerprint from './useFingerprint';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../../firebase';
import Leaderboard from './LeaderBoard';

export type SoonEntry = {
    username: string;
    gptResponse: Record<string, string>; // Keys are strings, values are strings
    input: string;
    totalPoints: number;
};

const db = getFirestore();

const SoonPage: React.FC = () => {
    const [input, setInput] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const fingerprint = useFingerprint();

    const [soonEntrys, setSoonEntrys] = useState<SoonEntry[]>([]);

    useEffect(() => {
        const userInputsRef = ref(realtimeDb, 'userInputs');

        // Set up a listener that runs the callback anytime the data changes
        const unsubscribe = onValue(userInputsRef, (snapshot) => {
            const data = snapshot.val();

            // Convert the object into an array (if data is not null)
            const soonEntrysArray: SoonEntry[] = data ? Object.values(data) : [];

            // Sort the array in descending order by totalPoints
            soonEntrysArray.sort((a, b) => b.totalPoints - a.totalPoints);

            // Update state with the sorted array
            setSoonEntrys(soonEntrysArray);
        });

        // Cleanup listener on unmount
        return () => {
            unsubscribe();
        };
    }, []);



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!fingerprint) {
            console.log('Failed to generate browser fingerprint.');
            return;
        }

        try {
            // Check if email or fingerprint already exists in Firestore
            const querySnapshot = await getDocs(
                query(collection(db, 'userInputs'), where('email', '==', email))
            );
            const fingerprintDoc = doc(db, 'fingerprints', fingerprint);

            if (!querySnapshot.empty) {
                alert('We already have your question, thank you! ');
                setLoading(false);
                return;
            }

            // Call Firebase Function for GPT response
            const res = await fetch('http://127.0.0.1:5001/aiguessr-vf/europe-west1/theQuestionGPT', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input, email, username, fingerprint }),
            });

            const safeParseJSON = (str: string) => {
                try {
                    return JSON.parse(str);
                } catch {
                    return str; // Return the original string if parsing fails
                }
            };

            const data = await res.json();
            const parsedReply = safeParseJSON(data.reply);
            console.log(parsedReply);

            setResults(parsedReply);
        } catch (error) {
            console.error('Error saving input or fetching response:', error);
        } finally {
            setLoading(false);
        }
    };




    return (
        <div className="min-h-screen bg-gray-900 text-white px-4 max-w-5xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">AI Guesser</h1>
            <p className="text-lg mb-8">The ultimate AI vs human multisoonEntry showdown is coming soon!</p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col items-center text-slate-950">
                <input
                    type="email"
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    required
                />
                <input
                    type="text"
                    placeholder="Enter a username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    required
                />
                <input
                    type="text"
                    placeholder="Ask me something..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Submit'}
                </button>
            </form>

            {results && (
                <div className="mt-4 p-4 bg-gray-800 text-white rounded-md">
                    <p>GPT Response:</p>
                    {Object.entries(results).map(([name, score]) => ((
                        <div className='flex' key={name + score}>
                            <p>{name}</p>
                            -
                            <p>{score}</p>
                        </div>
                    )))}
                </div>
            )}

            <Leaderboard soonEntrys={soonEntrys} />

            <footer className="mt-12 text-sm text-gray-400">
                &copy; 2024 AI Guesser. All Rights Reserved.
            </footer>
        </div>
    );
};

export default SoonPage;
