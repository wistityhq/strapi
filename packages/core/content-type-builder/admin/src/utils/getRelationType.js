/**
 *
 * Retrieves the relation type
 * @param {string} relation
 * @param {string} targetAttribute
 * @returns {string} the relation type
 */
const getRelationType = (relation, targetAttribute) => {
  const hasNotTargetAttribute = targetAttribute === undefined || targetAttribute === null;

  if (relation === 'oneToOne' && hasNotTargetAttribute) {
    return 'oneWay';
  }

  if (relation === 'oneToMany' && hasNotTargetAttribute) {
    return 'manyWay';
  }

  return relation;
};

export default getRelationType;
