import {OVER_EDIT, OVER_GRAB, OVER_REMOVE, OVER_RESIZE} from "../constants";

const getBorderColor = (isOver, isSelected) => {
  if (isOver === OVER_REMOVE) {
    return '#ffa784';
  }
  if (isOver === OVER_RESIZE) {
    return '#bafbae';
  }
  if (isSelected || isOver === OVER_EDIT || isOver === OVER_GRAB) {
    return '#aed4fb';
  }

  return '#e9eaeb';
};

export default getBorderColor;
