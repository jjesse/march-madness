// filepath: /march-madness-tracker/src/services/schedulerService.ts
import cron from 'node-cron';
import { BracketIngestionService } from './bracketIngestionService';
import logger from '../config/logger';

export class SchedulerService {
    private bracketIngestionService: BracketIngestionService;
    private bracketSyncJob?: cron.ScheduledTask;
    private liveScoresSyncJob?: cron.ScheduledTask;

    constructor() {
        this.bracketIngestionService = new BracketIngestionService();
    }

    /**
     * Initialize all scheduled jobs
     */
    public initializeScheduledJobs(): void {
        logger.info('Initializing scheduled jobs for bracket sync');

        // Full bracket sync - once daily at 6 AM
        // Cron: minute hour day month weekday
        this.bracketSyncJob = cron.schedule('0 6 * * *', async () => {
            logger.info('Running scheduled bracket sync');
            try {
                await this.bracketIngestionService.syncBracket();
                logger.info('Scheduled bracket sync completed successfully');
            } catch (error) {
                logger.error('Scheduled bracket sync failed:', error);
            }
        });

        // Live scores sync - every 5 minutes during March Madness (March 15 - April 10)
        // Only runs during tournament time
        this.liveScoresSyncJob = cron.schedule('*/5 * * * *', async () => {
            if (this.isTournamentSeason()) {
                logger.info('Running scheduled live scores sync');
                try {
                    await this.bracketIngestionService.syncLiveScores();
                    logger.info('Scheduled live scores sync completed successfully');
                } catch (error) {
                    logger.error('Scheduled live scores sync failed:', error);
                }
            }
        });

        logger.info('Scheduled jobs initialized successfully');
        logger.info('- Bracket sync: Daily at 6:00 AM');
        logger.info('- Live scores sync: Every 5 minutes during tournament season');
    }

    /**
     * Check if we're in tournament season (mid-March to early April)
     */
    private isTournamentSeason(): boolean {
        const now = new Date();
        const month = now.getMonth(); // 0-indexed (0 = January, 2 = March)
        const day = now.getDate();

        // Tournament runs from March 15 to April 10 approximately
        if (month === 2 && day >= 15) { // March (month 2), day 15 onwards
            return true;
        }
        if (month === 3 && day <= 10) { // April (month 3), up to day 10
            return true;
        }

        return false;
    }

    /**
     * Stop all scheduled jobs (useful for graceful shutdown)
     */
    public stopAllJobs(): void {
        logger.info('Stopping all scheduled jobs');
        
        if (this.bracketSyncJob) {
            this.bracketSyncJob.stop();
        }
        
        if (this.liveScoresSyncJob) {
            this.liveScoresSyncJob.stop();
        }
        
        logger.info('All scheduled jobs stopped');
    }

    /**
     * Manually trigger bracket sync (for testing or admin use)
     */
    public async triggerBracketSync(): Promise<void> {
        logger.info('Manually triggered bracket sync');
        await this.bracketIngestionService.syncBracket();
    }

    /**
     * Manually trigger live scores sync (for testing or admin use)
     */
    public async triggerLiveScoresSync(): Promise<void> {
        logger.info('Manually triggered live scores sync');
        await this.bracketIngestionService.syncLiveScores();
    }
}
