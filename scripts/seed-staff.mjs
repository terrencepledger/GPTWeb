import {createClient} from '@sanity/client';

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const staff = [
  {_id: 'staff-john-doe', _type: 'staff', name: 'John Doe', role: 'Senior Pastor'},
  {_id: 'staff-jane-smith', _type: 'staff', name: 'Jane Smith', role: 'Worship Leader'},
  {_id: 'staff-bob-johnson', _type: 'staff', name: 'Bob Johnson', role: 'Youth Pastor'},
];

async function seed() {
  for (const doc of staff) {
    await client.createOrReplace(doc);
  }
  console.log('Seeded staff data');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
