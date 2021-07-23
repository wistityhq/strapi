import * as yup from 'yup';
import { toLower, trim } from 'lodash';
import { translatedErrors as errorsTrads } from '@strapi/helper-plugin';
import getTrad from '../../../utils/getTrad';
import { createUid } from '../utils/createUid';

const createContentTypeSchema = (usedContentTypeNames, reservedNames) => {
  const shape = {
    name: yup
      .string()
      .test({
        name: 'nameAlreadyUsed',
        message: errorsTrads.unique,
        test: value => {
          if (!value) {
            return false;
          }

          const name = createUid(value);

          return !usedContentTypeNames.includes(name);
        },
      })
      .test({
        name: 'nameNotAllowed',
        message: getTrad('error.contentTypeName.reserved-name'),
        test: value => {
          if (!value) {
            return false;
          }

          return !reservedNames.includes(toLower(trim(value)));
        },
      })
      .required(errorsTrads.required),

    draftAndPublish: yup.boolean(),
    kind: yup.string().oneOf(['singleType', 'collectionType']),
  };

  return yup.object(shape);
};

export default createContentTypeSchema;
