import {OVER_EDIT, OVER_GRAB, OVER_REMOVE, OVER_RESIZE} from "../constants";

const getColor = (isOver, isSelected) => {
  if (isOver === OVER_REMOVE) {
    return '#f64d0a';
  }
  if (isOver === OVER_RESIZE) {
    return '#34ac64';
  }
  if (isSelected || isOver === OVER_EDIT || isOver === OVER_GRAB) {
    return '#007eff';
  }

  return '#b4b6ba';
};

export default getColor;
