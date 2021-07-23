'use strict';
/**
 * Image manipulation functions
 */
const sharp = require('sharp');

const { bytesToKbytes } = require('../utils/file');

const getMetadatas = buffer =>
  sharp(buffer)
    .metadata()
    .catch(() => ({})); // ignore errors

const getDimensions = buffer =>
  getMetadatas(buffer)
    .then(({ width = null, height = null }) => ({ width, height }))
    .catch(() => ({})); // ignore errors

const THUMBNAIL_RESIZE_OPTIONS = {
  width: 245,
  height: 156,
  fit: 'inside',
};

const resizeTo = (buffer, options) =>
  sharp(buffer)
    .withMetadata()
    .resize(options)
    .toBuffer()
    .catch(() => null);

const generateThumbnail = async file => {
  if (!(await canBeProccessed(file.buffer))) {
    return null;
  }

  const { width, height } = await getDimensions(file.buffer);

  if (width > THUMBNAIL_RESIZE_OPTIONS.width || height > THUMBNAIL_RESIZE_OPTIONS.height) {
    const newBuff = await resizeTo(file.buffer, THUMBNAIL_RESIZE_OPTIONS);

    if (newBuff) {
      const { width, height, size } = await getMetadatas(newBuff);

      return {
        name: `thumbnail_${file.name}`,
        hash: `thumbnail_${file.hash}`,
        ext: file.ext,
        mime: file.mime,
        width,
        height,
        size: bytesToKbytes(size),
        buffer: newBuff,
        path: file.path ? file.path : null,
      };
    }
  }

  return null;
};

const optimize = async buffer => {
  const {
    sizeOptimization = false,
    autoOrientation = false,
  } = await strapi.plugins.upload.services.upload.getSettings();

  if (!sizeOptimization || !(await canBeProccessed(buffer))) {
    return { buffer };
  }

  const sharpInstance = autoOrientation ? sharp(buffer).rotate() : sharp(buffer);

  return sharpInstance
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const output = buffer.length < data.length ? buffer : data;

      return {
        buffer: output,
        info: {
          width: info.width,
          height: info.height,
          size: bytesToKbytes(output.length),
        },
      };
    })
    .catch(() => ({ buffer }));
};

const DEFAULT_BREAKPOINTS = {
  large: 1000,
  medium: 750,
  small: 500,
};

const getBreakpoints = () => strapi.config.get('plugins.upload.breakpoints', DEFAULT_BREAKPOINTS);

const generateResponsiveFormats = async file => {
  const {
    responsiveDimensions = false,
  } = await strapi.plugins.upload.services.upload.getSettings();

  if (!responsiveDimensions) return [];

  if (!(await canBeProccessed(file.buffer))) {
    return [];
  }

  const originalDimensions = await getDimensions(file.buffer);

  const breakpoints = getBreakpoints();
  return Promise.all(
    Object.keys(breakpoints).map(key => {
      const breakpoint = breakpoints[key];

      if (breakpointSmallerThan(breakpoint, originalDimensions)) {
        return generateBreakpoint(key, { file, breakpoint, originalDimensions });
      }
    })
  );
};

const generateBreakpoint = async (key, { file, breakpoint }) => {
  const newBuff = await resizeTo(file.buffer, {
    width: breakpoint,
    height: breakpoint,
    fit: 'inside',
  });

  if (newBuff) {
    const { width, height, size } = await getMetadatas(newBuff);

    return {
      key,
      file: {
        name: `${key}_${file.name}`,
        hash: `${key}_${file.hash}`,
        ext: file.ext,
        mime: file.mime,
        width,
        height,
        size: bytesToKbytes(size),
        buffer: newBuff,
        path: file.path ? file.path : null,
      },
    };
  }
};

const breakpointSmallerThan = (breakpoint, { width, height }) => {
  return breakpoint < width || breakpoint < height;
};

const formatsToProccess = ['jpeg', 'png', 'webp', 'tiff'];
const canBeProccessed = async buffer => {
  const { format } = await getMetadatas(buffer);
  return format && formatsToProccess.includes(format);
};

module.exports = () => ({
  getDimensions,
  generateResponsiveFormats,
  generateThumbnail,
  bytesToKbytes,
  optimize,
});
