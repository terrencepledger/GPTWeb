import {createClient} from '@sanity/client';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_READ_TOKEN;

if (!projectId || !dataset || !token) {
  console.error('Missing required Sanity environment variables');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  useCdn: false,
  apiVersion: '2025-08-01'
});

async function run() {
  await client.createOrReplace({
    _id: 'mission-statement',
    _type: 'missionStatement',
    headline: 'Living the Story of Grace',
    tagline: 'Gathering, Growing, and Going in Christ\'s Love',
    message:
      'Greater Pentecostal Temple exists to reflect the story of grace: we gather as a mosaic of people, we grow as disciples on an adventurous journey, and we go to serve with compassion.'
  });
  console.log('Seeded mission statement document');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
