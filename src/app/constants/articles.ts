import { getPublishedEditorialArticles, getEditorialArticlesByCategory } from './editorial-articles';

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  date: string;
  published: boolean;
  author: string;
}

// Available categories mapping to build sections
export const ARTICLE_CATEGORIES = {
  APPS: 'APPS',
  WEB: 'WEB', 
  AI: 'AI',
  CIRCLE: 'CIRCLE',
  SERVICES: 'SERVICES',
  RESOURCES: 'RESOURCES'
} as const;

// Convert editorial articles to Article format for compatibility
function editorialToArticle(): Article[] {
  return getPublishedEditorialArticles().map(editorial => ({
    slug: editorial.slug,
    title: editorial.title,
    description: editorial.description,
    category: editorial.category,
    date: editorial.date,
    published: editorial.published,
    author: editorial.author
  }));
}

// Legacy articles (will be converted to editorial format)
const LEGACY_ARTICLES: Article[] = [
   {
     slug: 'unkey',
     title: 'unparty.app',
     description: 'Welcome from Unparty',
     category: 'Resources',
     date: '2024-04-18',
     published: false,
     author: 'your name'
   },
];

// Combined articles (editorial + legacy)
export const ARTICLES: Article[] = [
  ...editorialToArticle(),
  ...LEGACY_ARTICLES.filter(article => article.published)
];

// Helper function to get articles by category
export const getArticlesByCategory = (category: string): Article[] => {
  // Prioritize editorial articles, fallback to legacy
  const editorialArticles = getEditorialArticlesByCategory(category).map(editorial => ({
    slug: editorial.slug,
    title: editorial.title,
    description: editorial.description,
    category: editorial.category,
    date: editorial.date,
    published: editorial.published,
    author: editorial.author
  }));
  
  const legacyArticles = LEGACY_ARTICLES.filter(article => 
    article.category === category && 
    article.published &&
    !editorialArticles.find(e => e.slug === article.slug)
  );
  
  return [...editorialArticles, ...legacyArticles];
};

// Helper function to get all articles
export const getAllArticles = (): Article[] => {
  return ARTICLES;
};