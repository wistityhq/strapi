import {useCallback, useEffect, useRef, useState} from "react";
import PropTypes from 'prop-types';

const useResize = (minWidth, maxWidth) => {
  const triggerRef = useRef(null);
  const triggerPosRef = useRef(null);
  const resizedRef = useRef(null);
  const resizedInitWidthRef = useRef(null);
  const [width, setWidth] = useState(null);
  const [offset, setOffset] = useState(null);

  const handleResize = useCallback((e) => {
    if (!triggerPosRef.current) return;

    e.preventDefault();

    const offset = (e.pageX - triggerPosRef.current);
    const width = Math.min(Math.max((resizedInitWidthRef.current + offset), minWidth), maxWidth);

    setOffset(offset);
    setWidth(width);
    resizedRef.current.style.width = `${width}px`;
  }, [resizedRef, minWidth, maxWidth]);

  const stopResize = useCallback(() => {
    if (!triggerPosRef.current) return;

    triggerPosRef.current = null;
    resizedRef.current.style.width = `auto`;
  }, []);

  const startResize = useCallback((e) => {
    triggerPosRef.current = e.pageX;
    resizedInitWidthRef.current = resizedRef.current.getBoundingClientRect().width;
  }, [resizedRef]);

  useEffect(() => {
    if (!triggerRef.current) {
      return () => {};
    }
    const trigger = triggerRef.current;

    // Remove old listener
    trigger.removeEventListener('mousedown', startResize);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    // Add new listener
    trigger.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    return () => {
      trigger.removeEventListener('mousedown', startResize);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    }
  }, [triggerRef, startResize, handleResize, stopResize]);

  return [
    triggerRef,
    resizedRef,
    width,
    offset,
    !!triggerPosRef.current,
    resizedInitWidthRef.current,
  ]
}

useResize.propTypes = {
  minWidth: PropTypes.number,
  maxWidth: PropTypes.number,
}

useResize.defaultProps = {
  minWidth: 0,
  maxWidth: null,
}

export default useResize;