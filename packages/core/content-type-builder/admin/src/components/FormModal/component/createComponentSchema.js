import * as yup from 'yup';
import { toLower, trim } from 'lodash';
import { translatedErrors as errorsTrads } from '@strapi/helper-plugin';
import getTrad from '../../../utils/getTrad';
import { createComponentUid } from '../utils/createUid';
import { CATEGORY_NAME_REGEX } from '../category';

const createComponentSchema = (usedComponentNames, reservedNames, category) => {
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

          const name = createComponentUid(value, category);

          return !usedComponentNames.includes(name);
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
    category: yup
      .string()
      .matches(CATEGORY_NAME_REGEX, errorsTrads.regex)
      .required(errorsTrads.required),

    icon: yup.string().required(errorsTrads.required),
  };

  return yup.object(shape);
};

export default createComponentSchema;
