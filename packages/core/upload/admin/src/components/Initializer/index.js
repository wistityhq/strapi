/**
 *
 * Initializer
 *
 */

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import get from 'lodash/get';
import { request, useNotification } from '@strapi/helper-plugin';
import pluginId from '../../pluginId';
import { setFileModelTimestamps } from './actions';

// TODO use the models API and remove this component
const Initializer = ({ setPlugin }) => {
  const ref = useRef();
  const dispatch = useDispatch();
  ref.current = setPlugin;
  const toggleNotification = useNotification();

  useEffect(() => {
    const getData = async () => {
      const requestURL = '/content-manager/content-types';

      try {
        const { data } = await request(requestURL, { method: 'GET' });
        const fileModel = data.find(model => model.uid === 'plugins::upload.file');
        const timestamps = get(fileModel, ['options', 'timestamps']);

        dispatch(setFileModelTimestamps(timestamps));

        ref.current(pluginId);
      } catch (err) {
        toggleNotification({
          type: 'warning',
          message: { id: 'content-manager.error.model.fetch' },
        });
      }
    };

    getData();
  }, [dispatch, toggleNotification]);

  return null;
};

Initializer.propTypes = {
  setPlugin: PropTypes.func.isRequired,
};

export default Initializer;
