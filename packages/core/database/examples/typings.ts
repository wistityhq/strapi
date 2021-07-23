type ID = number | string;

interface Category {
  id: ID;
  title: string;
}

interface Article {
  id: ID;
  title: string;
  category: Category | ID;
}

interface AllTypes {
  article: Article;
  category: Category;
}
