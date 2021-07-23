import get from 'lodash/get';
import makeUnique from '../../../utils/makeUnique';

const retrieveComponentsThatHaveComponents = allComponents => {
  const componentsThatHaveNestedComponents = Object.keys(allComponents).reduce((acc, current) => {
    const currentComponent = get(allComponents, [current], {});
    const uid = currentComponent.uid;

    if (doesComponentHaveAComponentField(currentComponent)) {
      acc.push(uid);
    }

    return acc;
  }, []);

  return makeUnique(componentsThatHaveNestedComponents);
};

const doesComponentHaveAComponentField = component => {
  const attributes = get(component, ['schema', 'attributes'], []);

  return attributes.some(attribute => {
    const { type } = attribute;

    return type === 'component';
  });
};

export { doesComponentHaveAComponentField, retrieveComponentsThatHaveComponents };
