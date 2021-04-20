import React, { memo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toString } from 'lodash';
import { useGlobalContext } from 'strapi-helper-plugin';
import { IconLinks } from '@buffetjs/core';
import { Duplicate } from '@buffetjs/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useListView } from '../../../hooks';
import { getDisplayedValue } from '../../../utils';
import CustomInputCheckbox from '../../CustomInputCheckbox';
import ActionContainer from './ActionContainer';
import Cell from './Cell';
import { TableRow } from '../styledComponents';

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

function Row({
  canCreate,
  canDelete,
  canUpdate,
  isBulkable,
  row,
  headers,
  goTo,
  rowGoTo,
  moveRow,
  findRow,
}) {
  const { entriesToDelete, onChangeBulk, onClickDelete } = useListView();
  const { emitEvent } = useGlobalContext();
  const emitEventRef = useRef(emitEvent);

  const memoizedDisplayedValue = useCallback(
    (name, type) => {
      return getDisplayedValue(type, row[name], name);
    },
    [row]
  );

  const links = [
    {
      icon: canCreate ? <Duplicate fill="black" /> : null,
      onClick: e => {
        e.stopPropagation();
        goTo(`create/clone/${row.id}`);
      },
    },
    {
      icon: canUpdate ? <FontAwesomeIcon icon="pencil-alt" /> : null,
      onClick: e => {
        e.stopPropagation();
        emitEventRef.current('willDeleteEntryFromList');
        goTo(row.id);
      },
    },
    {
      icon: canDelete ? <FontAwesomeIcon icon="trash-alt" /> : null,
      onClick: e => {
        e.stopPropagation();
        emitEventRef.current('willDeleteEntryFromList');
        onClickDelete(row.id);
      },
    },
  ].filter(icon => icon);

  const originalIndex = findRow(row.id).index;
  const [{ isDragging }, drag, preview] = useDrag({
    item: {
      type: 'ROW',
      id: row.id,
      originalIndex,
      row,
      // mainField,
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'ROW',
    canDrop: () => false,
    hover({ id: draggedId }) {
      if (draggedId !== row.id) {
        const { index: overIndex } = findRow(row.id);
        moveRow(draggedId, overIndex);
      }
    },
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const opacity = isDragging ? 0.2 : 1;

  return (
    <TableRow
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();

        rowGoTo(row.id);
      }}
      style={{ opacity }}
    >
      {isBulkable && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <td key="i" onClick={e => e.stopPropagation()}>
          <CustomInputCheckbox
            name={row.id}
            onChange={onChangeBulk}
            value={entriesToDelete.filter(id => toString(id) === toString(row.id)).length > 0}
          />
        </td>
      )}
      {headers.map(
        ({
          key,
          name,
          fieldSchema: { type, relationType },
          cellFormatter,
          metadatas,
          queryInfos,
        }) => (
          <td key={key}>
            {cellFormatter ? (
              cellFormatter(row)
            ) : (
              <Cell
                options={{
                  rowId: row.id,
                  relationType,
                  type,
                  name,
                  value: memoizedDisplayedValue(name, type),
                  cellId: key,
                  metadatas,
                  queryInfos,
                  drag: node => {
                    drag(drop(node));
                  },
                }}
              />
            )}
          </td>
        )
      )}
      <ActionContainer>
        <IconLinks links={links} />
      </ActionContainer>
    </TableRow>
  );
}

Row.propTypes = {
  canCreate: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  canUpdate: PropTypes.bool.isRequired,
  headers: PropTypes.array.isRequired,
  isBulkable: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
  goTo: PropTypes.func.isRequired,
  rowGoTo: PropTypes.func.isRequired,
  moveRow: PropTypes.func.isRequired,
  findRow: PropTypes.func.isRequired,
};

export default memo(Row);
