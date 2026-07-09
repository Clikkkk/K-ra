import { incrementPlaytime } from '@/lib/db/games';

/**
 * Tracks wall-clock time for a single play session and persists it to the
 * game's `playtime` column when the session ends (F4.30). Start it once the
 * player screen mounts, stop it on unmount/exit.
 */
export class PlaytimeTracker {
  private readonly gameId: string;
  private readonly startedAt: number;

  constructor(gameId: string) {
    this.gameId = gameId;
    this.startedAt = Date.now();
  }

  async stop(): Promise<void> {
    const elapsedSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
    if (elapsedSeconds > 0) {
      await incrementPlaytime(this.gameId, elapsedSeconds);
    }
  }
}
