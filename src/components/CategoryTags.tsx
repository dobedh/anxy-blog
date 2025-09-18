'use client';

import { useState } from 'react';

interface CategoryTagsProps {
  onCategoryChange?: (category: string | null) => void;
}

const categories = [
  { id: 'all', label: '전체' },
  { id: 'free', label: '자유' },
  { id: 'thoughts', label: '생각' },
  { id: 'music', label: '음악' },
  { id: 'books', label: '책' },
  { id: 'daily', label: '일상' },
  { id: 'review', label: '후기' },
  { id: 'question', label: '질문' },
  { id: 'tip', label: '팁' },
  { id: 'story', label: '이야기' },
  { id: 'wellness', label: '웰니스' },
  { id: 'mindful', label: '마음챙김' },
  { id: 'recovery', label: '회복' },
];

export default function CategoryTags({ onCategoryChange }: CategoryTagsProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleCategoryClick = (categoryId: string) => {
    const newCategory = categoryId === 'all' ? null : categoryId;
    setActiveCategory(categoryId);
    onCategoryChange?.(newCategory);
  };

  return (
    <div className="border-b border-gray-200 bg-white sticky top-16 z-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`category-tag ${
                activeCategory === category.id ? 'category-tag-active' : ''
              } hover:border-brunch-green hover:text-brunch-green transition-all`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}