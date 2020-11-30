'use strict';

const createLockUtils = ({ rq }) => {
  const getLockUid = async (model, id, isSingleType = false) => {
    const url = isSingleType
      ? `/content-manager/single-types/${model}/actions/lock`
      : `/content-manager/collection-types/${model}/${id}/actions/lock`;

    const res = await rq({
      method: 'POST',
      url,
      body: { force: true },
    });

    if (!res.body.success) {
      throw new Error("Couldn't lock the entity");
    }

    return res.body.lockInfo.uid;
  };

  return {
    getLockUid,
  };
};

module.exports = createLockUtils;
