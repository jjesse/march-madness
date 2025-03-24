import { Bracket } from '../src/components/Bracket';
import { Game } from '../src/components/Game';
import { Team } from '../src/components/Team';

describe('Bracket Component', () => {
    let bracket: Bracket;
    const mockTeams = [
        new Team('Team A', 1),
        new Team('Team B', 16),
        new Team('Team C', 8),
        new Team('Team D', 9),
    ];

    beforeEach(() => {
        bracket = new Bracket(mockTeams);
    });

    test('should initialize with no games', () => {
        expect(bracket.getGames()).toHaveLength(0);
    });

    test('should add a game to the bracket', () => {
        const team1 = new Team('Team A', 1);
        const team2 = new Team('Team B', 2);
        const game = new Game(team1, team2);
        
        bracket.addGame(game);
        
        expect(bracket.getGames()).toHaveLength(1);
        expect(bracket.getGames()[0]).toBe(game);
    });

    test('should render the bracket correctly', () => {
        const team1 = new Team('Team A', 1);
        const team2 = new Team('Team B', 2);
        const game = new Game(team1, team2);
        
        bracket.addGame(game);
        
        const renderedBracket = bracket.render();
        expect(renderedBracket).toContain('Team A vs Team B');
    });

    test('should update matchups correctly', () => {
        const team1 = new Team('Team A', 1);
        const team2 = new Team('Team B', 2);
        const game = new Game(team1, team2);
        
        bracket.addGame(game);
        bracket.updateMatchup(game, 'Team A', 'Team B', 1, 0);
        
        expect(game.getScore()).toEqual({ teamA: 1, teamB: 0 });
    });

    test('should handle invalid game updates', () => {
        expect(() => {
            bracket.updateMatchup(-1, 70, 65);
        }).toThrow('Invalid game index');
    });

    test('should calculate winner correctly', () => {
        bracket.updateMatchup(0, 70, 65);
        const game = bracket.getGames()[0];
        expect(game.getWinner()).toBe('Team A');
    });

    test('should handle tournament progression', () => {
        bracket.updateMatchup(0, 70, 65);
        bracket.updateMatchup(1, 80, 75);
        expect(bracket.getNextRoundTeams()).toHaveLength(1);
    });
});