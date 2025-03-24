import { Counter, Registry } from 'prom-client';

export class MetricsService {
    private registry: Registry;
    private bracketUpdates: Counter;
    private scoreUpdates: Counter;

    constructor() {
        this.registry = new Registry();
        
        this.bracketUpdates = new Counter({
            name: 'bracket_updates_total',
            help: 'Total number of bracket updates',
            labelNames: ['round']
        });

        this.scoreUpdates = new Counter({
            name: 'score_updates_total',
            help: 'Total number of score updates'
        });

        this.registry.registerMetric(this.bracketUpdates);
        this.registry.registerMetric(this.scoreUpdates);
    }

    public incrementBracketUpdate(round: number): void {
        this.bracketUpdates.inc({ round });
    }

    public incrementScoreUpdate(): void {
        this.scoreUpdates.inc();
    }

    public getMetrics(): Promise<string> {
        return this.registry.metrics();
    }
}
