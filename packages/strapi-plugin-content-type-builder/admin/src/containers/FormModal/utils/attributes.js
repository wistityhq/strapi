const getAttributes = (dataTarget = '', targetUid, nestedComponents, attributes) => {
  const defaultAttributes = [
    [
      'text',
      'email',
      'richtext',
      'password',
      'number',
      'enumeration',
      'date',
      'media',
      'boolean',
      'json',
      'relation',
    ],
  ];
  const hasSorterInCollection = Object.values(attributes || {}).find(
    ({ type }) => type === 'sorter'
  );

  const isPickingAttributeForAContentType = dataTarget === 'contentType';
  const isNestedInAnotherComponent = nestedComponents.includes(targetUid);
  const canAddComponentInAnotherComponent =
    !isPickingAttributeForAContentType && !isNestedInAnotherComponent;
  const items = defaultAttributes.slice();

  if (isPickingAttributeForAContentType) {
    items[0].push('uid');

    const advancedComponents = ['component', 'dynamiczone'];

    if (!hasSorterInCollection) {
      advancedComponents.push('sorter');
    }

    items.push(advancedComponents);
  }

  if (canAddComponentInAnotherComponent) {
    items.push(['component']);
  }

  return items;
};

export default getAttributes;
