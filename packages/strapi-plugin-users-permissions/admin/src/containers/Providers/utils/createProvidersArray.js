import { sortBy } from 'lodash';

const createProvidersArray = data => {
  return sortBy(
    Object.keys(data).reduce((acc, current) => {
      const { icon: iconName, enabled, subdomain, authorize_url } = data[current];
      const icon = iconName === 'envelope' ? ['fas', 'envelope'] : ['fab', iconName];

      const provider = {
        name: current,
        icon,
        enabled,
        subdomain,
        authorize_url,
      };

      Object.keys(provider).forEach(key =>
        provider[key] === undefined ? delete provider[key] : {}
      );

      acc.push(provider);

      return acc;
    }, []),
    'name'
  );
};

export default createProvidersArray;
