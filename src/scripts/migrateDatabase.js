import 'dotenv/config';
import mongoose from 'mongoose';

const { MongoClient } = mongoose.mongo;
const BATCH_SIZE = 500;
const overwrite = process.argv.includes('--overwrite');

function describe(uri) {
  const url = new URL(uri);
  return `${url.protocol}//${url.host}${url.pathname}`;
}

function databaseName(uri) {
  const name = new URL(uri).pathname.replace(/^\//, '');
  if (!name) throw new Error(`Add a database name to the end of ${describe(uri)}`);
  return name;
}

function readUris() {
  const source = process.env.MONGO_URI;
  const target = process.env.NEW_MONGO_URI;
  if (!source || !target) throw new Error('Set both MONGO_URI (source) and NEW_MONGO_URI (target) in .env.');
  if (describe(source) === describe(target)) throw new Error('Source and target point to the same database.');
  return { source, target };
}

async function findFilledTargets(targetDb, names) {
  const filled = [];
  for (const name of names) {
    if (await targetDb.collection(name).estimatedDocumentCount() > 0) filled.push(name);
  }
  return filled;
}

async function copyCollection(sourceDb, targetDb, name) {
  const from = sourceDb.collection(name);
  const to = targetDb.collection(name);

  if (await to.estimatedDocumentCount() > 0) await to.drop();

  let batch = [];
  let copied = 0;
  for await (const doc of from.find()) {
    batch.push(doc);
    if (batch.length === BATCH_SIZE) {
      await to.insertMany(batch, { ordered: true });
      copied += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await to.insertMany(batch, { ordered: true });
    copied += batch.length;
  }

  const indexes = (await from.indexes())
    .filter((index) => index.name !== '_id_')
    .map(({ v, ns, ...index }) => index);
  if (indexes.length) await to.createIndexes(indexes);

  const expected = await from.countDocuments();
  const actual = await to.countDocuments();
  if (expected !== actual) throw new Error(`Count mismatch in "${name}": ${expected} in source, ${actual} in target.`);

  console.log(`  ${name.padEnd(18)} ${String(copied).padStart(6)} documents, ${indexes.length} indexes`);
}

async function migrate() {
  const { source, target } = readUris();
  const sourceClient = new MongoClient(source);
  const targetClient = new MongoClient(target, { serverSelectionTimeoutMS: 15000 });

  try {
    await Promise.all([sourceClient.connect(), targetClient.connect()]);
    const sourceDb = sourceClient.db(databaseName(source));
    const targetDb = targetClient.db(databaseName(target));

    const collections = (await sourceDb.listCollections({ type: 'collection' }).toArray())
      .map((collection) => collection.name)
      .filter((name) => !name.startsWith('system.'));

    if (!collections.length) throw new Error('The source database has no collections to copy.');

    const filled = await findFilledTargets(targetDb, collections);
    if (filled.length && !overwrite) {
      throw new Error(`Target already has data in: ${filled.join(', ')}. Nothing was copied. Re-run with --overwrite to replace it.`);
    }

    console.log(`Copying ${collections.length} collections`);
    console.log(`  from ${describe(source)}`);
    console.log(`  to   ${describe(target)}${overwrite ? ' (overwrite)' : ''}\n`);

    for (const name of collections) {
      await copyCollection(sourceDb, targetDb, name);
    }
    console.log('\nMigration finished. Every collection count matches.');
  } finally {
    await Promise.allSettled([sourceClient.close(), targetClient.close()]);
  }
}

migrate().catch((error) => {
  console.error(`\nMigration failed: ${error.message}`);
  process.exitCode = 1;
});
