export type PostData = {
  slug: string;
  title: string;
  date: string;
  updatedAt?: string;
  summary: string;
  category?: string | string[];
  subCategory?: string;
  tags?: string[];
  sourceLink?: string;
  content: string;
  published?: boolean;
  expiresAt?: string;
  isIndexable?: boolean;
};

export type PostMeta = Omit<PostData, 'content'>;
