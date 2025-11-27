import type { Board as BoardType, PlayerColor, Winner } from '@/types';
import './Board.css';

interface BoardProps {
  board: BoardType;
  onColumnClick: (column: number) => void;
  currentPlayer: PlayerColor;
  yourColor: PlayerColor | null;
  winner: Winner;
}

export function Board({ board, onColumnClick, currentPlayer, yourColor, winner }: BoardProps) {
  const isYourTurn = yourColor === currentPlayer && !winner;

  const handleColumnClick = (colIndex: number) => {
    if (isYourTurn && board[0][colIndex] === null) {
      onColumnClick(colIndex);
    }
  };

  return (
    <div className="board-container">
      <div className="board">
        {board[0].map((_, colIndex) => (
          <div key={colIndex} className="column-wrapper">
            <div
              className={`column ${isYourTurn ? 'clickable' : ''}`}
              onClick={() => handleColumnClick(colIndex)}
              title={isYourTurn ? `Click to drop disc in column ${colIndex + 1}` : ''}
            >
              {board.map((row, rowIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`cell ${row[colIndex] || ''}`}
                >
                  {row[colIndex] && <div className="disc" />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
