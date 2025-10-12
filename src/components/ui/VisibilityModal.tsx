'use client';

import React, { useEffect } from 'react';
import { PostVisibility } from '@/types/post';

interface VisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (visibility: PostVisibility) => void;
  currentVisibility?: PostVisibility;
}

const VisibilityModal: React.FC<VisibilityModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentVisibility = 'public',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const visibilityOptions = [
    {
      value: 'public' as PostVisibility,
      icon: '🌐',
      title: '전체 공개',
      description: '누구나 이 글을 볼 수 있습니다',
    },
    {
      value: 'followers' as PostVisibility,
      icon: '👥',
      title: '팔로워 공개',
      description: '나를 팔로우하는 사람만 볼 수 있습니다',
    },
    {
      value: 'private' as PostVisibility,
      icon: '🔒',
      title: '비공개',
      description: '나만 볼 수 있습니다',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-6 transition-gentle"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            공개 범위 선택
          </h2>
          <p className="text-sm text-gray-500">
            이 글을 누구에게 공개할지 선택해주세요
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {visibilityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`w-full p-4 rounded-lg border-2 transition-gentle text-left hover:border-gray-400 hover:shadow-md ${
                currentVisibility === option.value
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">
                    {option.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {option.description}
                  </div>
                </div>
                {currentVisibility === option.value && (
                  <div className="text-gray-900">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Cancel button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 hover:text-gray-900 transition-gentle"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisibilityModal;
