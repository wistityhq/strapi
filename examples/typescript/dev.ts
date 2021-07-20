// TODO - Update this to import directly from package once fileExtension changes are merged.
import * as strapi from '../../packages/strapi';

export default function startDev() {
  // @ts-ignore
  strapi({ autoReload: true }).start();
}

startDev();
