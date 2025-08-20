import {config as loadEnv} from 'dotenv';
loadEnv();
loadEnv({ path: '.env.local', override: true });

import {defineCliConfig} from 'sanity/cli';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET


export default defineCliConfig({
  studioHost: 'gptweb',
  api: {
      projectId,
      dataset,
  },
});
