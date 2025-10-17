'use client';

import { Post } from '@/types/post';
import { useMemo, useState } from 'react';

interface ActivityCalendarProps {
  posts: Post[];
}

interface DayData {
  date: Date;
  hasPost: boolean;
  isEmpty: boolean;
}

export default function ActivityCalendar({ posts }: ActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: Date; count: number; x: number; y: number } | null>(null);

  // GitHub 스타일 히트맵 데이터 생성 (올해 1월 1일 ~ 12월 31일)
  const heatmapData = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // 올해 1월 1일
    const endOfYear = new Date(now.getFullYear(), 11, 31); // 올해 12월 31일

    // 일요일부터 시작하도록 조정
    const startDate = new Date(startOfYear);
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    // 날짜별 글 개수 계산
    const postCountByDate = new Map<string, number>();
    posts.forEach(post => {
      if (post.createdAt) {
        const postDate = new Date(post.createdAt);
        const dateKey = postDate.toISOString().split('T')[0];
        postCountByDate.set(dateKey, (postCountByDate.get(dateKey) || 0) + 1);
      }
    });

    // 53주 × 7일 그리드 생성
    const grid: DayData[][] = [];
    const currentDate = new Date(startDate);

    // 올해 전체를 커버하는 주 수 계산
    const totalWeeks = 53;

    for (let week = 0; week < totalWeeks; week++) {
      const weekData: DayData[] = [];
      for (let day = 0; day < 7; day++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const isInRange = currentDate >= startOfYear && currentDate <= endOfYear;

        weekData.push({
          date: new Date(currentDate),
          hasPost: postCountByDate.has(dateKey) && isInRange,
          isEmpty: false // 모든 칸을 채움
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      grid.push(weekData);
    }

    return { grid, postCountByDate };
  }, [posts]);

  const weekdayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-3">
      {/* 제목 */}
      <div className="text-body font-semibold text-foreground mb-4">
        Anxy note log
      </div>

      {/* GitHub 스타일 히트맵 */}
      <div className="w-full">
        <div className="w-full">
          <div className="flex gap-[2px] w-full">
            {/* 그리드 섹션 */}
            <div className="w-full">
              {/* 월 레이블 */}
              <div className="flex gap-[3px] mb-[3px] h-3">
                {heatmapData.grid.map((week, weekIndex) => {
                  const firstDay = week[0].date;
                  const isFirstWeekOfMonth = firstDay.getDate() <= 7;
                  const monthLabel = isFirstWeekOfMonth ? months[firstDay.getMonth()] : '';

                  return (
                    <div key={weekIndex} className="text-[10px] text-muted w-[14px]">
                      {monthLabel}
                    </div>
                  );
                })}
              </div>

              {/* 날짜 그리드 */}
              <div className="flex gap-[3px]">
                {heatmapData.grid.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[3px]">
                    {week.map((day, dayIndex) => {
                      const dateKey = day.date.toISOString().split('T')[0];
                      const postCount = heatmapData.postCountByDate.get(dateKey) || 0;

                      return (
                        <div
                          key={dayIndex}
                          className={`
                            w-[14px] h-[14px] rounded-[2px] cursor-default
                            ${day.hasPost
                              ? 'bg-green-400'
                              : 'bg-accent'
                            }
                          `}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredDay({
                              date: day.date,
                              count: postCount,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8
                            });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 툴팁 */}
      {hoveredDay && (
        <div
          className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {hoveredDay.date.getMonth() + 1}/{hoveredDay.date.getDate()}{' '}
          {hoveredDay.count > 0 ? `${hoveredDay.count}개의 불안 노트` : '불안 노트 없음'}
        </div>
      )}
    </div>
  );
}
