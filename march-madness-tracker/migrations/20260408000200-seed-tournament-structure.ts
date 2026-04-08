import { Db } from 'mongodb';

const year = 2026;
const regions = ['East', 'West', 'South', 'Midwest'];
const rounds = [
  { number: 1, name: 'Round of 64', games: 32 },
  { number: 2, name: 'Round of 32', games: 16 },
  { number: 3, name: 'Sweet 16', games: 8 },
  { number: 4, name: 'Elite 8', games: 4 },
  { number: 5, name: 'Final Four', games: 2 },
  { number: 6, name: 'Championship', games: 1 },
];

const teamSlots = regions.flatMap((region) =>
  Array.from({ length: 16 }, (_, index) => ({
    region,
    seed: index + 1,
    slot: `${region}-${index + 1}`,
  }))
);

export async function up(db: Db): Promise<void> {
  await db.collection('tournaments').updateOne(
    { year },
    {
      $setOnInsert: {
        year,
        name: `NCAA Men's Basketball Tournament ${year}`,
        status: 'upcoming',
        startDate: new Date(Date.UTC(year, 2, 15)),
        endDate: new Date(Date.UTC(year, 3, 10)),
        createdAt: new Date(),
      },
      $set: {
        regions,
        rounds,
        teamSlots,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function down(db: Db): Promise<void> {
  await db.collection('tournaments').updateOne(
    { year },
    {
      $unset: {
        regions: '',
        rounds: '',
        teamSlots: '',
      },
      $set: {
        updatedAt: new Date(),
      },
    }
  );
}
