// filepath: /march-madness-tracker/src/services/schedulerService.ts
import cron from 'node-cron';
import { BracketIngestionService } from './bracketIngestionService';
import logger from '../config/logger';

export class SchedulerService {
    private bracketIngestionService: BracketIngestionService;
    private bracketSyncJob?: cron.ScheduledTask;

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

        logger.info('Scheduled jobs initialized successfully');
        logger.info('- Bracket sync: Daily at 6:00 AM (includes final scores)');
    }

    /**
     * Stop all scheduled jobs (useful for graceful shutdown)
     */
    public stopAllJobs(): void {
        logger.info('Stopping all scheduled jobs');
        
        if (this.bracketSyncJob) {
            this.bracketSyncJob.stop();
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
}
