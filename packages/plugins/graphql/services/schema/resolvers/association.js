'use strict';

const buildAssociationResolver = (contentTypeUID, attributeName, { type }) => {
  return (/*root*/) => {
    // const resourceID = root.id;
    // return strapi.query(contentTypeUID).load(resourceID, attributeName, args);
    return type ? [] : { name: 'foo', rating: 5 };
  };
};

module.exports = { buildAssociationResolver };
