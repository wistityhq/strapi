import axios from 'axios';
import { PluginBase } from '@itly/sdk';

export default class extends PluginBase {
  constructor(store) {
    super();
    this.store = store;
  }

  // eslint-disable-next-line class-methods-use-this
  id() {
    return 'strapi-destination';
  }

  track(_, event) {
    const uuid = this.store
      .getState()
      .get('app')
      .get('uuid');

    const payload = {
      event: event.name,
      properties: event.properties,
      id: event.id,
      version: event.version,
      uuid,
    };

    if (uuid) {
      axios.post('https://analytics.strapi.io/track', payload).catch(() => {
        /* Silent */
      });
    }
  }
}
