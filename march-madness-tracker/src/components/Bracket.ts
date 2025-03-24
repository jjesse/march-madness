// filepath: /march-madness-tracker/march-madness-tracker/src/components/Bracket.ts

import { Game } from './Game';
import { Team } from './Team';

export class Bracket {
    private games: Game[];

    constructor(teams: Team[]) {
        this.games = this.initializeGames(teams);
    }

    private initializeGames(teams: Team[]): Game[] {
        const games: Game[] = [];
        for (let i = 0; i < teams.length; i += 2) {
            games.push(new Game(teams[i], teams[i + 1]));
        }
        return games;
    }

    public render(): void {
        // Logic to render the bracket
        console.log('Rendering bracket with games:', this.games);
    }

    public updateMatchup(gameIndex: number, team1Score: number, team2Score: number): void {
        if (this.games[gameIndex]) {
            this.games[gameIndex].updateScore(team1Score, team2Score);
        }
    }
}