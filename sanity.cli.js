import {defineCliConfig} from 'sanity/cli';

export default defineCliConfig({
  studioHost: 'gptweb',
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
});
