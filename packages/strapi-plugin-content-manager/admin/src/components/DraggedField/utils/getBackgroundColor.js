import {OVER_EDIT, OVER_GRAB, OVER_REMOVE, OVER_RESIZE} from "../constants";

const getBackgroundColor = (isOver, isSelected, isSub) => {
  if (isOver === OVER_REMOVE) {
    return '#ffe9e0';
  }
  if (isOver === OVER_RESIZE) {
    return '#f4fff7';
  }
  if (isSelected || isOver === OVER_EDIT || isOver === OVER_GRAB) {
    return '#e6f0fb';
  }
  if (isSub) {
    return '#ffffff';
  }

  return '#fafafb';
};

export default getBackgroundColor;
