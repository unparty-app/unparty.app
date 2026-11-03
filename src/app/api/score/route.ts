import { NextResponse } from 'next/server';

type PlayerScore = {
    initials: string;
    score: number;
    currentRound: number;
    sessionEnded?: boolean;
};

type Scores = {
    player1?: PlayerScore;
    player2?: PlayerScore;
    timestamp: number;
};

// Initial score object with a timestamp
let currentScores: Scores = {
    timestamp: Date.now()
};

// Function to handle POST requests, which update or reset scores
export async function POST(req: Request) {
    try {
        const { 
            score, 
            player, 
            initials, 
            currentRound, 
            sessionEnded,
            reset 
        }: { 
            score: number; 
            player: 'player1' | 'player2'; 
            initials: string;
            currentRound: number;
            sessionEnded?: boolean;
            reset?: boolean;
        } = await req.json();

        // Handle reset request
        if (reset) {
            currentScores = { timestamp: Date.now() };
            return NextResponse.json(currentScores);
        }

        // Validate required fields
        if (typeof score !== 'number' || !player || !initials || typeof currentRound !== 'number') {
            return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
        }

        // Update the score for the specified player
        if (player === 'player1' || player === 'player2') {
            currentScores[player] = {
                ...currentScores[player],  // Keep existing data if any
                initials,
                score,
                currentRound,
                ...(sessionEnded !== undefined ? { sessionEnded } : {})
            };
            currentScores.timestamp = Date.now();
        }

        // Respond with the updated scores
        return NextResponse.json(currentScores);

    } catch (error) {
        console.error("Error in POST request:", error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

// Function to handle GET requests, which retrieve current scores
export async function GET() {
    try {
        return NextResponse.json(currentScores);
    } catch (error) {
        console.error("Error in GET request:", error);
        return NextResponse.json({ error: 'Failed to retrieve scores' }, { status: 500 });
    }
}