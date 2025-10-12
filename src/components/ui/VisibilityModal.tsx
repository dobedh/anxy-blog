'use client';

import React, { useEffect, useState } from 'react';
import { PostVisibility } from '@/types/post';

interface VisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (visibility: PostVisibility) => void;
  currentVisibility?: PostVisibility;
}

const VisibilityModal: React.FC<VisibilityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentVisibility = 'public',
}) => {
  const [selectedVisibility, setSelectedVisibility] = useState<PostVisibility>(currentVisibility);

  useEffect(() => {
    if (isOpen) {
      setSelectedVisibility(currentVisibility || 'public'); // Reset to current when modal opens
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentVisibility]);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
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
              onClick={() => setSelectedVisibility(option.value)}
              className={`w-full p-4 rounded-lg border-2 transition-gentle text-left hover:border-gray-400 hover:shadow-md ${
                selectedVisibility === option.value
                  ? 'border-gray-900 bg-gray-50 opacity-100'
                  : 'border-gray-200 opacity-40 hover:opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{option.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {option.title}
                  </div>
                </div>
                {selectedVisibility === option.value && (
                  <div className="text-gray-900">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="pt-4 border-t border-gray-200 flex flex-col items-center gap-4">
          {/* Save button - Primary action */}
          <button
            onClick={() => onConfirm(selectedVisibility)}
            className="max-w-xs w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-gentle"
          >
            저장
          </button>

          {/* Cancel link - Secondary action */}
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-900 transition-gentle"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisibilityModal;
