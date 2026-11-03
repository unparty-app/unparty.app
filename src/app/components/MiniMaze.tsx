'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle } from '@/app/components/icons';
import MazeInstructions from './MazeInstructions';
import { useInModal } from '../context/ModalContext';
import { useTheme } from '../contexts/ThemeContext';
import { useHydrated } from '@/hooks/useHydrated';
import Image from 'next/image';


const gridSize = 5;
const emptyCell = ' ';
const funCell = 'J';
const wallCell = 'W';
const goalCell = 'G';
const playerStart = { x: 0, y: 0 };
const SWIPE_THRESHOLD = 50;

// Asset collections for visual variety
const obstacles = [
  '/svgs/unparty/Pyramid-Wood.png',
  '/svgs/unparty/Pyramid-Sponge.png', 
  '/svgs/unparty/Pyramid-Mesh.png',
  '/svgs/unparty/Pyramid-Ref Blue.png'
];

const goals = [
  '/svgs/unparty/Cube-Mesh.png',
  '/svgs/unparty/Cube-Checkered.png',
  '/svgs/unparty/Cube-Wood.png'
];

const getRandomObstacle = () => obstacles[Math.floor(Math.random() * obstacles.length)];
const getRandomGoal = () => goals[Math.floor(Math.random() * goals.length)];

// Function to check if there's a valid path using BFS
const isValidMaze = (maze: string[][], start: { x: number; y: number }, goal: { x: number; y: number }) => {
  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const visited = Array.from(Array(gridSize), () => Array(gridSize).fill(false));
  const queue = [{ x: start.x, y: start.y }];
  
  visited[start.x][start.y] = true;

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    if (x === goal.x && y === goal.y) return true;

    for (const dir of directions) {
      const newX = x + dir.x;
      const newY = y + dir.y;

      if (
        newX >= 0 && newX < gridSize &&
        newY >= 0 && newY < gridSize &&
        !visited[newX][newY] &&
        maze[newX][newY] !== wallCell
      ) {
        visited[newX][newY] = true;
        queue.push({ x: newX, y: newY });
      }
    }
  }

  return false;
};

const generateRandomMaze = () => {
  let maze = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(emptyCell));

  do {
    maze = maze.map(row =>
      row.map(() => (Math.random() < 0.3 ? wallCell : emptyCell))
    );

    maze[playerStart.x][playerStart.y] = emptyCell;
    maze[gridSize - 1][gridSize - 1] = goalCell;

    let placedFunCells = 0;
    while (placedFunCells < 3) {
      const randX = Math.floor(Math.random() * gridSize);
      const randY = Math.floor(Math.random() * gridSize);

      if (maze[randX][randY] === emptyCell) {
        maze[randX][randY] = funCell;
        placedFunCells++;
      }
    }

  } while (!isValidMaze(maze, playerStart, { x: gridSize - 1, y: gridSize - 1 }));

  return maze;
};

const MiniMaze = () => {
  const [playerPosition, setPlayerPosition] = useState(playerStart);
  // Random, so only rendered once hydrated (keeps SSR deterministic)
  const [maze, setMaze] = useState(generateRandomMaze);
  const hydrated = useHydrated();
  const [bgColor, setBgColor] = useState('bg-clear');
  const [invalidMove, setInvalidMove] = useState<{ x: number; y: number } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [moves, setMoves] = useState(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showInstructionsPopup, setShowInstructionsPopup] = useState(false);
  const [finalMoveCount, setFinalMoveCount] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const mazeRef = useRef<HTMLDivElement>(null);
  const { colorValue } = useTheme();
  const isInModal = useInModal();

  useEffect(() => {
    // Auto-focus the maze on mount for better UX
    setTimeout(() => {
      if (mazeRef.current) {
        mazeRef.current.focus();
      }
    }, 100);
  }, []);
  

  // Increase difficulty by adding more walls
  const increaseDifficulty = useCallback(() => {
    setIsAnimating(true);
    let newMaze = [...maze];

    // Randomly add walls while ensuring the maze remains solvable
    let attempts = 0;
    do {
      newMaze = maze.map((row) =>
        row.map((cell) => {
          if (cell === emptyCell && Math.random() < 0.3) {
            return wallCell;
          }
          return cell;
        })
      );
      attempts++;
    } while (!isValidMaze(newMaze, playerPosition, { x: gridSize - 1, y: gridSize - 1 }) && attempts < 10);

    setMaze(newMaze);
    setTimeout(() => setIsAnimating(false), 500);
  }, [maze, playerPosition]);

  // Handle player movement with boundaries and cell checks
  const movePlayer = useCallback((newX: number, newY: number) => {

    if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
      const cell = maze[newX][newY];

      if (cell === wallCell) {
        setInvalidMove({ x: newX, y: newY });
        setTimeout(() => setInvalidMove(null), 500);
        return;
      }

      setPlayerPosition({ x: newX, y: newY });
      setMoves(prev => prev + 1);

      if (cell === funCell) {
        setBgColor('bg-yellow-50');
        setTimeout(() => setBgColor('bg-clear'), 1000);
        increaseDifficulty();
      }

      if (cell === goalCell) {
        setTimeout(() => {
          setFinalMoveCount(moves + 1); // Include the final move to goal
          setShowSuccessPopup(true);
        }, 500);
      }
    }
  }, [maze, moves, increaseDifficulty]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle keys when maze is focused
    if (!isFocused) return;
    
    const { x, y } = playerPosition;
    
    switch (e.key) {
      case 'ArrowUp': 
        e.preventDefault();
        movePlayer(x - 1, y); 
        break;
      case 'ArrowDown': 
        e.preventDefault();
        movePlayer(x + 1, y); 
        break;
      case 'ArrowLeft': 
        e.preventDefault();
        movePlayer(x, y - 1); 
        break;
      case 'ArrowRight': 
        e.preventDefault();
        movePlayer(x, y + 1); 
        break;
    }
  }, [playerPosition, movePlayer, isFocused]);

  // Handle focus and blur events
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  // Handle clicks to focus the maze
  const handleMazeClick = () => {
    if (mazeRef.current) {
      mazeRef.current.focus();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
  
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;
    const { x, y } = playerPosition;
  
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          movePlayer(x, y + 1); // Swipe right
        } else {
          movePlayer(x, y - 1); // Swipe left
        }
      }
    } else {
      if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) {
          movePlayer(x + 1, y); // Swipe down
        } else {
          movePlayer(x - 1, y); // Swipe up
        }
      }
    }
  };

  const resetGame = () => {
    setPlayerPosition(playerStart);
    setBgColor('bg-clear');
    setMaze(generateRandomMaze());
    setMoves(0);
    setIsAnimating(false);
  };

    useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!hydrated) return null;

  return (
    <div className={`mx-auto w-full max-w-2xl ${isInModal ? 'scale-75' : 'scale-100'}`}>
      
      {/* Premium Header with Visual Hierarchy */}
      <div className="mb-8 space-y-4">
        {/* Primary Heading - PageAsterisk */}
        
        
        {/* Secondary Info Row */}
        <div className="flex items-center justify-between">
          
          
          {moves > 0 && (
            <div className="flex flex-col gap-1 text-right">
              <span className="font-['Brandon-Grotesque'] text-sm font-bold uppercase tracking-wider" style={{ color: colorValue }}>
                MOVES
              </span>
              <span className="font-google-sans-code text-lg font-bold" style={{ color: colorValue }}>
                {moves}
              </span>
            </div>
          )}
        </div>
        
        {/* Instructional Text - Tertiary Level */}
        {!isFocused && (
          <div className="text-center font-google-sans-code text-xs text-black/50 opacity-75 dark:text-white/50">
            Click maze to focus, then use arrow keys to navigate
          </div>
        )}
      </div>

      {/* Edge-to-edge Premium Maze */}
      <div
        ref={mazeRef}
        tabIndex={0}
        className={`
          mx-auto grid aspect-square w-full max-w-lg grid-cols-5 gap-0
          ${bgColor} overflow-hidden rounded-2xl border-2 
          outline-none transition-colors duration-300 ease-in-out
          ${isFocused ? 'ring-4 ring-opacity-30' : 'border-opacity-20'}
        `}
        style={{
          borderColor: isFocused ? colorValue : '#F9C22E'
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleMazeClick}
      >
        {maze.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isPlayer = playerPosition.x === rowIndex && playerPosition.y === colIndex;
            const isInvalidMove = invalidMove?.x === rowIndex && invalidMove?.y === colIndex;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  flex size-full items-center justify-center
                  ${isPlayer 
                    ? 'border-0 bg-transparent' 
                    : 'border border-[#F9C22E]/20 hover:border-[#F9C22E]/30'
                  }
                  ${isAnimating ? 'animate-pulse' : ''}
                  ${isInvalidMove ? 'border-[#F9C22E]/40 bg-[#F9C22E]/10' : ''}
                  transition-all duration-300 ease-in-out
                  ${!isPlayer ? 'hover:bg-[#F9C22E]/5' : ''}
                `}
                style={{
                  backgroundColor: isPlayer ? 'transparent' : undefined,
                  borderColor: !isPlayer ? `${colorValue}20` : undefined
                }}
              >
                {isPlayer && (
                  <div className={`transition-transform duration-300 ease-in-out ${isAnimating ? 'scale-110' : ''}`}>
                    <Image
                      src="/svgs/unparty/Sphere-Wood.png"
                      alt="Player - Wood Sphere"
                      width={28}
                      height={28}
                      className="opacity-90 w-auto h-auto"
                      priority
                    />
                  </div>
                )}
                {cell === wallCell && (
                  <div className="flex size-full items-center justify-center">
                    <Image
                      src={getRandomObstacle()}
                      alt="Obstacle"
                      width={30}
                      height={30}
                      className={`transition-opacity duration-300 w-auto h-auto ${isAnimating ? 'opacity-60' : 'opacity-85'}`}
                    />
                  </div>
                )}
                {cell === funCell && (
                  <div className="flex size-full items-center justify-center">
                    <Image
                      src={getRandomObstacle()}
                      alt="Challenge"
                      width={28}
                      height={28}
                      className="animate-bounce opacity-80 w-auto h-auto"
                    />
                  </div>
                )}
                {cell === goalCell && (
                  <div className="flex size-full items-center justify-center">
                    <Image
                      src={getRandomGoal()}
                      alt="Goal"
                      width={30}
                      height={30}
                      className="animate-pulse opacity-90 w-auto h-auto"
                    />
                  </div>
                )}
                {isInvalidMove && (
                  <AlertCircle className="absolute animate-ping text-black/50" size={16} />
                )}
              </div>
            );
          })
        )}
      </div>
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm dark:bg-black/40">
          <div className="border-l-2 border-black bg-white p-6 font-google-sans-code dark:border-white dark:bg-black">
            <h2 className="mb-4 text-xl text-black dark:text-white">Congratulations!</h2>
            <p className="text-black dark:text-white">You completed the maze in {finalMoveCount} moves!</p> 
            <button
              onClick={() => {
                setFinalMoveCount(null);
                setShowSuccessPopup(false);
                resetGame();
              }}
              className="mt-6 bg-black px-4 py-2 font-google-sans-code text-sm text-white transition-colors hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
      
      {showInstructionsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm dark:bg-black/40">
          <div className="max-w-md border-l-2 border-black bg-white p-6 font-google-sans-code dark:border-white dark:bg-black">
            <h2 className="mb-4 text-xl text-black dark:text-white">How to Play</h2>
            <div className="mb-4">
              <MazeInstructions />
            </div>
            <button
              onClick={() => setShowInstructionsPopup(false)}
              className="mt-2 bg-black px-4 py-2 font-google-sans-code text-sm text-white transition-colors hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Premium Brandon G styled buttons */}
      <div className="mx-auto mt-6 flex max-w-md flex-col justify-center gap-3 sm:flex-row">
        <button
          onClick={() => setShowInstructionsPopup(true)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[#F9C22E] px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-[#F9C22E]/5"
          style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}
        >
          <span className="font-['Brandon-Grotesque'] uppercase tracking-wide">Instructions</span>
        </button>
        <button
          onClick={resetGame}
          className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200"
          style={{ 
            backgroundColor: colorValue, 
            color: 'var(--background)',
            boxShadow: `0 2px 8px ${colorValue}20`
          }}
        >
          <span className="font-['Brandon-Grotesque'] uppercase tracking-wide">
            {moves === 0 ? "Start Game" : "Reset Game"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MiniMaze;