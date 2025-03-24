// filepath: /march-madness-tracker/march-madness-tracker/src/utils/index.ts

export function formatScore(score: number): string {
    return score.toString();
}

export function validateTeamData(teamName: string, seed: number): boolean {
    return teamName.length > 0 && seed > 0 && seed <= 16;
}