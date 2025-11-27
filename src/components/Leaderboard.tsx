import type { LeaderboardPlayer } from '@/types';
import { formatWinRate, getMedalForRank } from '@/utils/game.utils';
import './Leaderboard.css';

interface LeaderboardProps {
  data: LeaderboardPlayer[];
  onClose: () => void;
}

export function Leaderboard({ data, onClose }: LeaderboardProps) {
  return (
    <div className="leaderboard-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leaderboard-header">
          <h2>🏆 Leaderboard</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="leaderboard-content">
          {data.length === 0 ? (
            <p className="empty-message">No players yet. Be the first to play!</p>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>Draws</th>
                  <th>Total</th>
                  <th>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => {
                  const winRate = formatWinRate(entry.wins, entry.total_games);
                  const medal = getMedalForRank(index);

                  return (
                    <tr key={entry.username} className={index < 3 ? 'top-three' : ''}>
                      <td className="rank">
                        {medal || index + 1}
                      </td>
                      <td className="username">{entry.username}</td>
                      <td className="wins">{entry.wins}</td>
                      <td className="losses">{entry.losses}</td>
                      <td className="draws">{entry.draws}</td>
                      <td className="total">{entry.total_games}</td>
                      <td className="win-rate">{winRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
