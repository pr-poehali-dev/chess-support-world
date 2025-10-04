import { useState } from 'react';

interface SimpleChessboardProps {
  position: string;
  onMove: (from: string, to: string) => void;
  orientation?: 'white' | 'black';
}

const PIECES: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

export default function SimpleChessboard({ position, onMove, orientation = 'white' }: SimpleChessboardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const parseFen = (fen: string) => {
    const board: Record<string, string> = {};
    const rows = fen.split(' ')[0].split('/');
    
    rows.forEach((row, rankIndex) => {
      let fileIndex = 0;
      for (const char of row) {
        if (isNaN(parseInt(char))) {
          const file = FILES[fileIndex];
          const rank = RANKS[rankIndex];
          board[`${file}${rank}`] = char;
          fileIndex++;
        } else {
          fileIndex += parseInt(char);
        }
      }
    });
    
    return board;
  };

  const board = parseFen(position);
  const displayFiles = orientation === 'black' ? [...FILES].reverse() : FILES;
  const displayRanks = orientation === 'black' ? [...RANKS].reverse() : RANKS;

  const handleSquareClick = (square: string) => {
    if (selectedSquare) {
      if (selectedSquare !== square) {
        onMove(selectedSquare, square);
      }
      setSelectedSquare(null);
    } else if (board[square]) {
      setSelectedSquare(square);
    }
  };

  return (
    <div className="inline-block border-4 border-gray-800 rounded-lg shadow-2xl">
      {displayRanks.map((rank) => (
        <div key={rank} className="flex">
          {displayFiles.map((file) => {
            const square = `${file}${rank}`;
            const piece = board[square];
            const isLight = (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0;
            const isSelected = selectedSquare === square;
            
            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                className={`
                  w-16 h-16 flex items-center justify-center text-5xl cursor-pointer
                  transition-all hover:opacity-80 relative
                  ${isLight ? 'bg-amber-100' : 'bg-amber-700'}
                  ${isSelected ? 'ring-4 ring-blue-500 ring-inset' : ''}
                `}
              >
                {piece && (
                  <span className={`select-none ${piece === piece.toUpperCase() ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]'}`}>
                    {PIECES[piece]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
