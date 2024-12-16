import React, { useState } from "react";
import { SoonEntry } from "./SoonPage";

type LeaderboardProps = {
    soonEntrys: SoonEntry[];
};

type LeaderboardItemProps = {
    soonEntry: SoonEntry;
    rank: number;
    onSeeMore: (entry: SoonEntry) => void;
};

const Leaderboard: React.FC<LeaderboardProps> = ({ soonEntrys }) => {
    const [selectedEntry, setSelectedEntry] = useState<SoonEntry | null>(null);

    return (
        <>
            <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Leaderboard
                </h2>
                <ul className="list-none space-y-6">
                    {soonEntrys.map((soonEntry, index) => (
                        <LeaderboardItem
                            key={index}
                            soonEntry={soonEntry}
                            rank={index + 1}
                            onSeeMore={(entry) => setSelectedEntry(entry)}
                        />
                    ))}
                </ul>
            </div>
            {selectedEntry && (
                <Modal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            )}
        </>
    );
};

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
    soonEntry,
    rank,
    onSeeMore,
}) => {
    return (
        <li className="bg-purple-950 text-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white-800">
                    {soonEntry.username}
                </h3>
                <span className="text-sm font-medium text-white-500">
                    Rank: #{rank}
                </span>
            </div>
            <p className="text-sm text-white-600 italic mb-2">
                "{soonEntry.input}"
            </p>
            <p className="text-lg font-bold text-orange-600 mb-4">
                Total Points: {soonEntry.totalPoints}
            </p>
            <button
                onClick={() => onSeeMore(soonEntry)}
                className="mt-4 text-sm text-orange-600 hover:underline"
            >
                See More
            </button>
        </li>
    );
};

type ModalProps = {
    entry: SoonEntry;
    onClose: () => void;
};

const Modal: React.FC<ModalProps> = ({ entry, onClose }) => {
    const handleClickOutside = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).id === "modal-overlay") {
            onClose();
        }
    };

    return (
        <div
            id="modal-overlay"
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-left"
            onClick={handleClickOutside}
        >
            <div className="bg-purple-950 rounded-lg shadow-lg max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white-600 hover:text-white-900"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold mb-4 text-white-800">
                    {entry.username}'s Details
                </h2>
                <p className="mb-2">
                    <strong>Input:</strong> {entry.input}
                </p>
                <p className="mb-2">
                    <strong>Total Points:</strong> {entry.totalPoints}
                </p>
                <h3 className="text-lg font-semibold mb-2 text-white-800">GPT Response:</h3>
                <ul className="list-disc ml-6 space-y-1 capitalize">
                    {Object.entries(entry.gptResponse)
                        .filter(([key]) => key !== "totalPoints" && key !== "shortExplanation")
                        .map(([key, value]) => (
                            <li key={key} className="text-white-700">
                                <strong>{key}:</strong> {value}
                            </li>
                        ))}
                    <li className="text-white-700"><strong>Short Explanation:</strong> {entry.gptResponse["shortExplanation"]}</li>
                </ul>
            </div>
        </div>
    );
};

export default Leaderboard;
