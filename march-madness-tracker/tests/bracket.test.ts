import { Bracket } from '../src/components/Bracket';
import { Game } from '../src/components/Game';
import { Team } from '../src/components/Team';

describe('Bracket component', () => {
    const mockTeams = [
        new Team('Team A', 1),
        new Team('Team B', 16),
        new Team('Team C', 8),
        new Team('Team D', 9),
    ];

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('initializes first-round matchups from the provided teams', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        const bracket = new Bracket(mockTeams);

        bracket.render();

        expect(logSpy).toHaveBeenCalledWith('Rendering bracket with games:', expect.any(Array));
        const renderedGames = logSpy.mock.calls[0][1] as Game[];
        expect(renderedGames).toHaveLength(2);
        expect(renderedGames[0].getGameInfo()).toMatchObject({
            teamA: 'Team A',
            teamB: 'Team B',
            scoreA: 0,
            scoreB: 0,
            status: 'upcoming',
        });
    });

    test('updates the selected matchup scores through the public API', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
        const bracket = new Bracket(mockTeams);

        bracket.updateMatchup(0, 72, 65);
        bracket.render();

        const renderedGames = logSpy.mock.calls[0][1] as Game[];
        expect(renderedGames[0].getGameInfo()).toMatchObject({
            teamA: 'Team A',
            teamB: 'Team B',
            scoreA: 72,
            scoreB: 65,
            status: 'completed',
        });
    });

    test('ignores invalid matchup indexes without throwing', () => {
        const bracket = new Bracket(mockTeams);

        expect(() => bracket.updateMatchup(99, 70, 60)).not.toThrow();
    });

    test('returns game details from the Game public API', () => {
        const game = new Game(new Team('Alpha', 1), new Team('Beta', 2));

        game.updateScore(81, 79);

        expect(game.getGameInfo()).toEqual({
            teamA: 'Alpha',
            teamB: 'Beta',
            scoreA: 81,
            scoreB: 79,
            status: 'completed',
        });
    });
});