// filepath: /march-madness-tracker/march-madness-tracker/src/components/Game.ts

export class Game {
    private teamA: string;
    private teamB: string;
    private scoreA: number;
    private scoreB: number;
    private status: 'upcoming' | 'in-progress' | 'completed';

    constructor(teamA: string, teamB: string) {
        this.teamA = teamA;
        this.teamB = teamB;
        this.scoreA = 0;
        this.scoreB = 0;
        this.status = 'upcoming';
    }

    public updateScore(scoreA: number, scoreB: number): void {
        this.scoreA = scoreA;
        this.scoreB = scoreB;
        this.status = 'completed';
    }

    public getGameInfo(): { teamA: string; teamB: string; scoreA: number; scoreB: number; status: string } {
        return {
            teamA: this.teamA,
            teamB: this.teamB,
            scoreA: this.scoreA,
            scoreB: this.scoreB,
            status: this.status,
        };
    }
}