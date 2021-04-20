import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useHistory } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { upperFirst, isEmpty } from 'lodash';
import { LoadingIndicator, useGlobalContext } from 'strapi-helper-plugin';
import { useDrop } from 'react-dnd';
import useListView from '../../hooks/useListView';
import { getTrad } from '../../utils';
import State from '../State';
import { LoadingContainer, LoadingWrapper, Table, TableEmpty } from './styledComponents';
import ActionCollapse from './ActionCollapse';
import Headers from './Headers';
import Row from './Row';

const CustomTable = ({
  canCreate,
  canUpdate,
  canDelete,
  data,
  displayedHeaders,
  hasDraftAndPublish,
  isBulkable,
  showLoader,
  handleSortChange,
}) => {
  const [rows, setRows] = useState(data);
  const { formatMessage } = useIntl();
  const { entriesToDelete, label, filters, _q } = useListView();
  const { emitEvent } = useGlobalContext();

  const [, drop] = useDrop({ accept: 'ROW' });

  useEffect(() => {
    if (rows !== data) {
      setRows(data);
    }
  }, [data, rows]);

  const { pathname } = useLocation();
  const { push } = useHistory();
  const headers = useMemo(() => {
    if (hasDraftAndPublish) {
      return [
        ...displayedHeaders,
        {
          key: '__published_at_temp_key__',
          name: 'published_at',
          fieldSchema: {
            type: 'custom',
          },
          metadatas: {
            label: formatMessage({
              id: getTrad('containers.ListPage.table-headers.published_at'),
            }),
            searchable: false,
            sortable: true,
          },
          cellFormatter: cellData => {
            const isPublished = !isEmpty(cellData.published_at);

            return <State isPublished={isPublished} />;
          },
        },
      ];
    }

    return displayedHeaders;
  }, [formatMessage, hasDraftAndPublish, displayedHeaders]);

  const colSpanLength = isBulkable && canDelete ? headers.length + 2 : headers.length + 1;

  const handleRowGoTo = id => {
    emitEvent('willEditEntryFromList');
    push({
      pathname: `${pathname}/${id}`,
      state: { from: pathname },
    });
  };
  const handleEditGoTo = id => {
    emitEvent('willEditEntryFromButton');
    push({
      pathname: `${pathname}/${id}`,
      state: { from: pathname },
    });
  };

  const values = { contentType: upperFirst(label), search: _q };
  let tableEmptyMsgId = filters.length > 0 ? 'withFilters' : 'withoutFilter';

  if (_q !== '') {
    tableEmptyMsgId = 'withSearch';
  }

  const findRow = useCallback(
    id => {
      const row = rows.find(c => c.id === id);
      const index = rows.findIndex(c => c.id === id);

      return {
        row,
        index,
      };
    },
    [rows]
  );

  const moveRow = useCallback(
    (id, atIndex) => {
      const { row, index } = findRow(id);

      if (row) {
        const newOrder = [...rows];
        newOrder.splice(index, 1);
        newOrder.splice(atIndex, 0, row);

        setRows(newOrder);

        const sorter = headers.find(header => header.fieldSchema.type === 'sorter');

        handleSortChange(
          newOrder.map(({ id }, index) => ({
            id,
            body: {
              [sorter.name]: index,
            },
          }))
        );
      }
    },
    [findRow, handleSortChange, headers, rows]
  );

  const content =
    rows.length === 0 ? (
      <TableEmpty>
        <td colSpan={colSpanLength}>
          <FormattedMessage
            id={`content-manager.components.TableEmpty.${tableEmptyMsgId}`}
            values={values}
          />
        </td>
      </TableEmpty>
    ) : (
      rows.map(row => {
        if (!row) {
          return null;
        }

        return (
          <Row
            key={row.id}
            canCreate={canCreate}
            canDelete={canDelete}
            canUpdate={canUpdate}
            isBulkable={isBulkable && canDelete}
            headers={headers}
            row={row}
            rowGoTo={handleRowGoTo}
            goTo={handleEditGoTo}
            findRow={findRow}
            moveRow={moveRow}
          />
        );
      })
    );

  if (showLoader) {
    return (
      <>
        <Table className="table">
          <Headers headers={headers} isBulkable={isBulkable && canDelete} />
        </Table>
        <LoadingWrapper>
          <LoadingContainer>
            <LoadingIndicator />
          </LoadingContainer>
        </LoadingWrapper>
      </>
    );
  }

  return (
    <Table className="table">
      <Headers headers={headers} isBulkable={isBulkable && canDelete} />
      <tbody ref={drop}>
        {entriesToDelete.length > 0 && <ActionCollapse colSpan={colSpanLength} />}
        {content}
      </tbody>
    </Table>
  );
};

CustomTable.propTypes = {
  canCreate: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  canUpdate: PropTypes.bool.isRequired,
  data: PropTypes.array.isRequired,
  displayedHeaders: PropTypes.array.isRequired,
  hasDraftAndPublish: PropTypes.bool.isRequired,
  isBulkable: PropTypes.bool.isRequired,
  showLoader: PropTypes.bool.isRequired,
  handleSortChange: PropTypes.func.isRequired,
};

export default memo(CustomTable);
