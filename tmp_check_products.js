require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'allremotes';
const collectionName = process.env.MONGODB_COLLECTION || 'products';

if (!uri) {
  console.error('MONGODB_URI not set in .env.local');
  process.exit(1);
}

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const products = db.collection(collectionName);

    const cursor = products.find({}, {
      projection: {
        _id: 1,
        name: 1,
        lastUpdatedBy: 1,
        description: 1,
        features: 1,
        specification: 1,
        compatibility: 1,
        instructions: 1,
      }
    });

    let total = 0;
    let collab = 0;
    let hasH1 = 0;
    let hasTable = 0;
    let hasBorder = 0;
    let hasWhatsIncluded = 0;
    let missingFields = [];
    let notCollab = [];
    let notGeneratedStyle = [];

    for await (const p of cursor) {
      total++;
      const desc = p.description || '';
      const spec = p.specification || '';
      const feat = p.features || '';
      const comp = p.compatibility || '';
      const inst = p.instructions || '';
      const descLower = desc.toLowerCase();
      const specLower = spec.toLowerCase();

      const allFields = desc || spec || feat || comp || inst;
      if (!desc || !spec || !feat || !comp || !inst) {
        missingFields.push({ id: String(p._id), name: p.name });
      }

      if (p.lastUpdatedBy === 'collab') {
        collab++;
      } else {
        notCollab.push({ id: String(p._id), name: p.name, lastUpdatedBy: p.lastUpdatedBy });
      }

      const generatedDesc = descLower.includes('<h1') && desc.includes("What's Included");
      const generatedSpec = specLower.includes('<table') && specLower.includes('border');
      const generatedFeat = feat.toLowerCase().includes('<ul');
      const generatedComp = comp.toLowerCase().includes('<p');
      const generatedInst = inst.toLowerCase().includes('<h4') || inst.toLowerCase().includes('<ol');

      if (generatedDesc) hasH1++;
      if (specLower.includes('<table')) hasTable++;
      if (generatedSpec) hasBorder++;
      if (desc.includes("What's Included")) hasWhatsIncluded++;

      if (p.lastUpdatedBy === 'collab' && (!generatedDesc || !generatedSpec || !generatedFeat || !generatedComp || !generatedInst)) {
        notGeneratedStyle.push({
          id: String(p._id),
          name: p.name,
          missing: [
            !generatedDesc && 'description',
            !generatedSpec && 'specification table',
            !generatedFeat && 'features',
            !generatedComp && 'compatibility',
            !generatedInst && 'instructions',
          ].filter(Boolean),
        });
      }
    }

    console.log('Total products:', total);
    console.log('lastUpdatedBy=collab:', collab);
    console.log('Not lastUpdatedBy=collab:', notCollab.length);
    console.log('Missing any content field:', missingFields.length);
    console.log('Description contains <h1 + "What\'s Included":', hasH1);
    console.log('Specification contains <table:', hasTable);
    console.log('Specification contains <table + border:', hasBorder);
    console.log('Description contains "What\'s Included":', hasWhatsIncluded);
    console.log('lastUpdatedBy=collab but missing generated style:', notGeneratedStyle.length);

    if (notCollab.length > 0) {
      console.log('\nProducts not updated by generator (lastUpdatedBy != collab):');
      for (const p of notCollab.slice(0, 50)) {
        console.log(`  ${p.id} | ${p.name} | lastUpdatedBy=${p.lastUpdatedBy}`);
      }
    }

    if (notGeneratedStyle.length > 0) {
      console.log('\nProducts with lastUpdatedBy=collab but missing generated style:');
      for (const p of notGeneratedStyle.slice(0, 50)) {
        console.log(`  ${p.id} | ${p.name} | missing: ${p.missing.join(', ')}`);
      }
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
})();
