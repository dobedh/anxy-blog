'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { User } from '@/types/user';
import { Post } from '@/types/post';
import { getUserByUsername } from '@/utils/userUtils';
import { getPostsByAuthor } from '@/utils/postUtils';
import { getFollowerCount, getFollowingCount } from '@/utils/followUtils';
import PostCard from '@/components/PostCard';
import FollowButton from '@/components/FollowButton';

interface UserPageProps {
  params: { username: string };
}

export default function UserPage({ params }: UserPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const username = params.username;

  useEffect(() => {
    const loadUserData = () => {
      setIsLoading(true);
      
      console.log('Loading user data for username:', username);
      
      // Get user data
      const userData = getUserByUsername(username);
      
      if (!userData) {
        console.log('User not found:', username);
        notFound();
        return;
      }
      
      console.log('User found:', userData);
      setUser(userData);
      
      // Get user's posts
      const userPosts = getPostsByAuthor(userData.id);
      console.log('User posts:', userPosts);
      setPosts(userPosts);
      
      // Get follower/following counts
      const followers = getFollowerCount(userData.id);
      const following = getFollowingCount(userData.id);
      setFollowerCount(followers);
      setFollowingCount(following);
      
      setIsLoading(false);
    };

    loadUserData();
  }, [username]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // notFound() will handle this
  }

  return (
    <div className="content-container" style={{paddingTop: '80px'}}>
      {/* User Profile Section */}
      <div className="text-center mb-16">
        <h1 className="text-hero font-bold text-foreground mb-4">
          {user.displayName}
        </h1>
        {user.bio && (
          <p className="text-body text-foreground max-w-md mx-auto leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Follow Button */}
        <div className="mt-6">
          <FollowButton
            targetUserId={user.id}
            targetUsername={user.username}
            onFollowChange={(isFollowing) => {
              // 팔로우 상태가 변경되면 카운트 업데이트
              const newFollowerCount = isFollowing ? followerCount + 1 : followerCount - 1;
              setFollowerCount(Math.max(0, newFollowerCount));
            }}
          />
        </div>

        {/* Basic stats */}
        <div className="flex items-center justify-center gap-8 mt-8 text-body text-muted">
          <div className="text-center">
            <div className="font-semibold text-foreground">{posts.length}</div>
            <div>글</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">{followerCount}</div>
            <div>팔로워</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">{followingCount}</div>
            <div>팔로잉</div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-8">
        {posts.length > 0 ? (
          <>
            <h2 className="text-title font-semibold text-foreground border-b border-accent pb-4">
              {user.displayName}님의 글
            </h2>
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-subtle rounded-xl border border-accent">
            <p className="text-body text-muted mb-4">아직 작성된 글이 없습니다</p>
            <p className="text-caption text-muted">
              {user.displayName}님의 첫 번째 글을 기다리고 있어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}