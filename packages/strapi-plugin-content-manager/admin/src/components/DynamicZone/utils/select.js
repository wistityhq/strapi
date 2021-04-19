import { useMemo } from 'react';
import { get } from 'lodash';
import useDataManager from '../../../hooks/useDataManager';

function useSelect(name) {
  const {
    addComponentToDynamicZone,
    createActionAllowedFields,
    isCreatingEntry,
    formErrors,
    modifiedData,
    moveComponent,
    removeComponentFromDynamicZone,
    readActionAllowedFields,
    updateActionAllowedFields,
  } = useDataManager();

  const dynamicDisplayedComponents = useMemo(
    () => get(modifiedData, [name], []).map(data => data.__component),
    [modifiedData, name]
  );

  const isFieldAllowed = useMemo(() => {
    const allowedFields = isCreatingEntry ? createActionAllowedFields : updateActionAllowedFields;

    return allowedFields.includes(name);
  }, [name, isCreatingEntry, createActionAllowedFields, updateActionAllowedFields]);

  const isFieldReadable = useMemo(() => {
    const allowedFields = isCreatingEntry ? [] : readActionAllowedFields;

    return allowedFields.includes(name);
  }, [name, isCreatingEntry, readActionAllowedFields]);

  return {
    addComponentToDynamicZone,
    formErrors,
    isCreatingEntry,
    isFieldAllowed,
    isFieldReadable,
    moveComponent,
    removeComponentFromDynamicZone,
    dynamicDisplayedComponents,
  };
}

export default useSelect;
