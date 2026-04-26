export interface NaverNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface StockContext {
  news: NaverNewsItem[];
  newsError: string | null;
}
