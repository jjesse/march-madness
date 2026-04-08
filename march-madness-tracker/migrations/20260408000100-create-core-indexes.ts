import { Db } from 'mongodb';

export async function up(db: Db): Promise<void> {
  await db.collection('users').createIndex({ email: 1 }, { unique: true, name: 'users_email_unique' });
  await db.collection('users').createIndex({ username: 1 }, { unique: true, name: 'users_username_unique' });
  await db.collection('brackets').createIndex({ userId: 1, year: 1 }, { name: 'brackets_user_year' });
  await db.collection('games').createIndex({ id: 1 }, { unique: true, name: 'games_id_unique' });
  await db.collection('games').createIndex({ bracketId: 1, round: 1 }, { name: 'games_bracket_round' });
  await db.collection('scoreboards').createIndex(
    { bracketId: 1, userId: 1, year: 1 },
    { unique: true, name: 'scoreboards_bracket_user_year' }
  );
}

export async function down(db: Db): Promise<void> {
  await db.collection('users').dropIndex('users_email_unique');
  await db.collection('users').dropIndex('users_username_unique');
  await db.collection('brackets').dropIndex('brackets_user_year');
  await db.collection('games').dropIndex('games_id_unique');
  await db.collection('games').dropIndex('games_bracket_round');
  await db.collection('scoreboards').dropIndex('scoreboards_bracket_user_year');
}
