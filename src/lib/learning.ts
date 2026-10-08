import fs from 'fs';
import path from 'path';
import { CourseItem } from '@/components/learning/LearningFinderClient';

export interface LearningCoursesData<T = CourseItem> {
  updatedAt: string;
  source?: string;
  totalCount: number;
  courses: T[];
}

export function getLearningData<T = CourseItem>(): LearningCoursesData<T> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/learning-courses.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      return {
        updatedAt: data.updatedAt || '',
        source: data.source || '',
        totalCount: typeof data.totalCount === 'number' ? data.totalCount : (Array.isArray(data.courses) ? data.courses.length : 0),
        courses: Array.isArray(data.courses) ? data.courses : [],
      };
    }
  } catch (e) {
    console.error('Failed to read learning courses cache:', e);
  }
  return { updatedAt: '', source: '', totalCount: 0, courses: [] };
}
