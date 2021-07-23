'use strict';

const _ = require('lodash');

const { Database } = require('../lib/index');
const models = require('./models');
const connections = require('./connections');

async function main(connection) {
  const orm = await Database.init({
    connection,
    models: Database.transformContentTypes(models),
  });

  try {
    // await orm.schema.drop();
    // await orm.schema.create();

    console.log(orm.connection.client.config.client);

    await orm.schema.sync();
    // await orm.schema.reset();

    // await orm.query('compo').create({
    //   data: {
    //     key: 'A',
    //     value: 1,
    //   },
    // });

    // await orm.query('article').create({
    //   // select: {},
    //   // populate: {},
    //   data: {
    //     compo: 1,
    //   },
    // });

    console.log(await orm.query('article').load({ id: 1 }, 'category'));

    console.log(
      await orm.query('category').populate(
        { title: 'A', id: 2 },
        {
          articles: {
            count: true,
          },
        }
      )
    );

    console.log(
      await orm.query('category').findMany({
        populate: {
          articles: {
            count: true,
          },
        },
      })
    );

    // await orm.query('article').delete({ where: { id: 1 } });

    // await tests(orm);
  } finally {
    orm.destroy();
  }
}

// (async function() {
//   for (const key in connections) {
//     await main(connections[key]);
//   }
// })().catch(err => {
//   console.error(err);
//   process.exit();
// });

main(connections.sqlite);

// const entityService = uid => {
//   // knows more about abstraction then the query layer
//   // will be moved in the core services not the db
//   // D&P should wrap some d&p logic
//   // i18N should wrapp some i18n logic etc etc

//   const repo = orm.query(uid);

//   return {
//     findById(id) {
//       return repo.findOne({ where: { id } });
//     },

//     async update(id, data) {
//       await repo.update({ where: { id }, data });

//       return repo.findOne({ where: { id } });
//     },
//   };
// };

/*

db.migration.create();
db.migration.up();
db.migration.down();

db.seed.run();
db.seed.create();

db.exporter.dump()
db.importer.restore()

db.schema.addField
db.schema.removeField
db.schema.addCollection
db.schema.removeCollection

*/

// const r = await orm.entityManager
//   .createQueryBuilder('article')
//   .select('*')
//   .join({
//     rootColumn: 'id',
//     alias: 'ac',
//     referencedTable: 'categories_articles_articles_links',
//     referencedColumn: 'article_id',
//   })
//   .join({
//     rootTable: 'ac',
//     rootColumn: 'category_id',
//     alias: 'c',
//     referencedTable: 'categories',
//     referencedColumn: 'id',
//   })
//   .where({
//     $and: [],
//   })
//   .populate({
//     category: true,
//   })
//   .execute();

// console.log(r);

// const catA = await entityService('category').findById(348);
// console.log(catA);
/*
    orm.contentType('category').loadRelation()
    => query('category').load('xxx')
  */

// await orm.query('category').delete();

// const article = await orm.query('article').create({
//   select: ['id', 'title'],
//   populate: {
//     category: {
//       select: ['price'],
//       where: {
//         price: {
//           $gte: 12,
//         },
//       },
//     },
//   },
//   data: {
//     title: 'my category',
//     category_id: 1, // TODO: handle category: 1 too
//   },
// });

// console.log(JSON.stringify(article, null, 4));
const tests = async orm => {
  // await orm.query('category').createMany({
  //   // select: {},
  //   // populate: {},
  //   data: Array(5)
  //     .fill({})
  //     .map((v, idx) => ({
  //       title: `Category ${_.padStart(idx, 3, '0')}`,
  //       articles: [idx + 1, idx + 2],
  //     })),
  // });

  await orm.query('article').createMany({
    // select: {},
    // populate: {},
    data: Array(5)
      .fill({})
      .map((v, idx) => ({
        title: `Article ${_.padStart(idx, 3, '0')}`,
        // category_id: idx + 1,
        category: idx + 1,
      })),
  });

  const cat = await orm.query('category').create({
    data: {
      articles: [1, 2, 3, 4, 5],
    },
    populate: ['articles'],
  });

  console.log(cat);

  const tag = await orm.query('tag').create({
    data: {
      articles: [1, 2, 3, 4, 5],
    },
    populate: ['articles'],
  });

  console.log(tag);

  const someArticles = await orm.query('article').findMany({
    where: {
      id: [1, 2, 3, 4, 5],
    },
    populate: ['tags', 'category'],
  });

  console.log(someArticles);

  await orm.query('category').updateMany({
    where: {
      // articles: {
      //   title: {
      //     $contains: 'Category',
      //   },
      // },
    },
    data: {
      title: 'Category 007',
    },
  });

  let r = await orm.query('category').findMany({
    where: {
      $and: [
        {
          title: {
            $ne: 'salut',
          },
        },
      ],
      title: 'test',
      price: {
        $gt: 12,
      },
      articles: {
        title: {
          $startsWith: 'Test',
          // $mode: 'insensitive',
        },
      },
      compo: {
        key: 'x',
      },
    },
  });

  // escape stuff
  // const raw = (strings, )

  const params = {
    select: ['id', 'title'],
    where: {
      $not: {
        $or: [
          {
            articles: {
              category: {
                title: 'Category 003',
              },
            },
          },
          {
            title: {
              $in: ['Category 001', 'Category 002'],
            },
          },
          {
            title: {
              $not: 'Category 001',
            },
          },
        ],
      },
    },
    orderBy: [{ articles: { title: 'asc' } }],
    limit: 10,
    offset: 0,
  };

  r = await orm.query('category').findMany(params);

  console.log(r);

  r = await orm.query('category').findMany({
    where: {
      $or: [
        {
          compo: {
            value: {
              $gte: 3,
            },
          },
        },
        {
          articles: {
            title: {
              $contains: 'test',
            },
          },
        },
      ],
    },
  });

  console.log(r);

  r = await orm.query('user').findMany({
    where: {
      address: {
        name: 'A',
      },
    },
  });

  console.log(r);

  const [results, count] = await orm.query('category').findWithCount(params);

  console.log({ results, count });

  await orm.query('category', {
    populate: ['articles'],
  });

  const address = await orm.query('address').findMany({
    populate: {
      user: {
        // select: ['id', 'address_id'],
      },
    },
  });

  console.log(address);

  const user = await orm.query('user').findMany({
    populate: {
      address: {
        // select: ['id', 'name'],
      },
    },
  });

  console.log(user);

  const article = await orm.query('article').findMany({
    populate: {
      category: true,
    },
  });

  console.log(article);

  await orm.query('category').findMany({
    populate: {
      compo: true,
      articles: {
        select: ['title'],
        populate: {
          category: {
            select: ['title'],
          },
        },
      },
    },
    limit: 5,
  });

  await orm.query('article').findMany({
    populate: {
      tags: true,
    },
    limit: 5,
  });

  await orm.query('tag').findMany({
    populate: {
      articles: true,
    },
    limit: 5,
  });

  // const articleCategory = orm.query('article').load(article, 'category', {
  //   select: ['id', 'title'],
  //   limit: 5,
  //   offset: 2,
  //   orderBy: 'title',
  //   where: {},
  // });

  // const article = await orm.query('article').populate(article, {
  //   category: true,
  //   tags: true,
  // });

  await orm.query('article').findMany({
    where: {
      $not: {
        $or: [
          {
            category: {
              title: 'Article 003',
            },
          },
          {
            title: {
              $in: ['Article 001', 'Article 002'],
            },
          },
        ],
        title: {
          $not: 'Article 007',
        },
      },
    },
    orderBy: [{ category: { name: 'asc' } }],
    offset: 0,
    limit: 10,
    populate: {
      category: {
        orderBy: 'title',
        populate: {
          categories: {
            populate: {
              tags: true,
            },
          },
        },
      },
      seo: true,
    },
  });
};
