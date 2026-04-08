import { BracketDataSource } from './types';
import { EspnBracketDataSource } from './espnBracketDataSource';
import { ManualBracketDataSource } from './manualBracketDataSource';
import { MockBracketDataSource } from './mockBracketDataSource';
import { SportsRadarBracketDataSource } from './sportsRadarBracketDataSource';

export function createBracketDataSource(
  sourceType = process.env.DATA_SOURCE_TYPE || 'mock'
): BracketDataSource {
  switch (sourceType.toLowerCase()) {
    case 'espn':
      return new EspnBracketDataSource();
    case 'sportsradar':
      return new SportsRadarBracketDataSource();
    case 'manual':
      return new ManualBracketDataSource();
    case 'mock':
    default:
      return new MockBracketDataSource();
  }
}
