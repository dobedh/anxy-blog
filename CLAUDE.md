# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Anxy** is a therapeutic personal blog platform designed for people dealing with anxiety, similar to Naver Blog/Brunch with a follow system. Users have individual blogs where they publish content, and can follow other users to see their posts in a personalized feed.

### Current Status 🚀
**Production-Ready Supabase Integration**

The project has successfully migrated from localStorage to **Supabase** for full backend functionality, including:
- User authentication with Supabase Auth
- Database persistence for posts, users, follows, and likes
- Real-time capabilities and Row Level Security (RLS)
- Complete CRUD operations for all entities

**Key Features Implemented:**
- ✅ Supabase authentication (email/password + OAuth)
- ✅ User profiles with username system (@username routing)
- ✅ Post creation, editing, and deletion with ownership controls
- ✅ Like system with real-time counts
- ✅ Follow/unfollow functionality
- ✅ Personal blog pages (`/u/[username]`)
- ✅ Post detail pages with contextual more options menu
- ✅ Responsive therapeutic UI design
- ✅ Protected routes and authentication flow

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Production build**: `npm run build --turbopack`
- **Start production server**: `npm start`  
- **Lint code**: `npm run lint` (ESLint with Next.js config)

The development server runs on http://localhost:3000 with hot reload enabled.

## Technology Stack

- **Next.js 15.5.2** with App Router and Turbopack for faster development builds
- **React 19.1.0** with modern hooks and server components
- **TypeScript** for type safety
- **Tailwind CSS 4** with PostCSS plugin (no separate config file needed)
- **Supabase** for backend services:
  - PostgreSQL database with Row Level Security (RLS)
  - Built-in authentication (email/password + OAuth providers)
  - Real-time subscriptions
  - Auto-generated TypeScript types

## Architecture & Key Design Principles

### Therapeutic Design System
This platform implements a **therapeutic UI/UX approach** specifically designed to reduce anxiety:

- **Color Palette**: Pure white backgrounds (#ffffff) with darker text (#1a202c) for optimal readability
- **Typography**: Increased line-height (1.7) for better readability and reduced visual stress  
- **Spacing**: Consistent 8px grid system with generous padding to create breathing room
- **Interactions**: Gentle 0.3s cubic-bezier transitions, soft hover effects, and focus rings for accessibility

### CSS Architecture
The design system is built on CSS custom properties in `src/app/globals.css`:
- Therapeutic color variables (--background: #ffffff, --foreground: #1a202c, --primary: #2d3748)
- Typography classes (text-hero, text-title, text-body, text-caption)
- Spacing utilities (space-xs through space-3xl)
- Container classes (content-container: 720px, wide-container: 1200px)
- Interaction classes (transition-gentle, hover-lift, focus-ring)

### Database Architecture & Data Flow

**Supabase Database Schema**:
- **profiles**: User profiles linked to auth.users with username/display_name/bio
- **posts**: Blog posts with author relationships, likes/comments counts
- **follows**: User-to-user follow relationships
- **post_likes**: Individual like records with automatic count triggers
- **comments**: Comment system (infrastructure ready)

**Database Features**:
- Row Level Security (RLS) policies for data access control
- Automatic triggers for updated_at timestamps
- Real-time count updates for likes and comments
- Proper foreign key constraints and cascading deletes
- Performance indexes on commonly queried fields

**Authentication & State Management**:
- **Supabase Auth**: Built-in authentication with session management
- **useSupabaseAuth Hook**: Centralized auth operations (signup/signin/signout)
- **Real-time session tracking**: Automatic session state updates
- **Protected Routes**: Server-side and client-side route protection
- **OAuth Support**: Google and Kakao social login integration

**Data Utilities Structure**:
- **supabaseUserUtils**: User CRUD operations and profile management
- **supabasePostUtils**: Post creation, editing, deletion, and queries
- **supabaseFollowUtils**: Follow/unfollow operations and relationship queries
- **Type Safety**: Full TypeScript integration with auto-generated Supabase types

### Layout Structure
- **Fixed Header**: 16px height (lg:20px) with backdrop blur, contains navigation and write button
- **Main Content**: Uses pt-16 (lg:pt-24) to account for fixed header
- **Responsive Design**: Always-visible navigation, no hamburger menu needed

### Navigation Architecture
- **Category-focused navigation**: 자유, 생각, 음악, 책 (removed "홈" link per design requirements)
- **Active state tracking**: Uses `usePathname()` to highlight current page
- **Authentication-aware header**: Different navigation for logged-in vs guest users
- **Authenticated users see**: 내 블로그, 글쓰기, 로그아웃
- **Guest users see**: 로그인, 회원가입  
- **Responsive design**: Icons on mobile (📝, +, ↗), full text on desktop

### Component Architecture

**Post Components**:
- **BrunchPostCard** (`src/components/BrunchPostCard.tsx`): Compact post cards with Brunch-style typography
- **PostDetail Page** (`src/app/post/[id]/page.tsx`): Full post view with contextual more options menu
- **Edit Post Page** (`src/app/edit/[id]/page.tsx`): Post editing interface with ownership verification

**UI Components**:
- **DropdownMenu** (`src/components/ui/DropdownMenu.tsx`): Reusable dropdown with click-outside handling
- **Header Component** (`src/components/layout/Header.tsx`): Navigation with auth-aware content
- **RecommendedAuthors** (`src/components/RecommendedAuthors.tsx`): Sidebar component for user discovery

**Authentication System**:
- **useSupabaseAuth Hook** (`src/hooks/useSupabaseAuth.ts`): Centralized Supabase auth operations
- **Protected Route Logic**: Built into page components, checks auth state
- **OAuth Integration**: Google and Kakao social login support

**Key Features**:
- **More Options Menu**: Context-sensitive actions (edit/delete for own posts, share for others)
- **Real-time Like System**: Integrated with Supabase for instant updates
- **Username Validation**: Real-time availability checking during signup
- **Post Ownership**: Automatic author verification for edit/delete operations

### Page Structure
All pages follow a consistent pattern:
- Use `content-container` for optimal reading width (720px max)
- Apply appropriate padding (py-8 lg:py-12)
- Center-aligned headers with hero typography
- Consistent "더 많은 글 보기" pagination button

**Homepage** (`/`):
- Loads all posts from Supabase in chronological order
- Real-time updates when new posts are created
- Responsive grid layout with BrunchPostCard components

**Personal Blog Pages** (`/u/[username]`):
- Dynamic routing for user-specific blog pages
- Shows user's profile information and all their posts
- Edit profile functionality for authenticated users
- Follow/unfollow integration

**Post System**:
- **Write Page** (`/write`): Protected route for creating new posts
- **Post Detail** (`/post/[id]`): Full post view with comments and interactions
- **Edit Post** (`/edit/[id]`): Post editing with ownership verification
- **More Options Menu**: Context-sensitive actions based on post ownership

**Authentication Pages**:
- **Login Page** (`/login`): Supabase Auth integration with social login options
- **Signup Page** (`/signup`): Real-time username validation and profile creation
- **Auth Callback** (`/auth/callback`): OAuth redirect handling
- Auto-redirect logic for authenticated users

### Styling Approach
- **Tailwind CSS 4** integrated via PostCSS plugin
- **Unified white theme**: Consistent #ffffff background throughout
- **Dark Mode**: Automatic system preference detection with blue-gray theme
- **Typography**: Geist font family loaded via Next.js fonts
- **Accessibility**: Focus states, proper contrast ratios, and semantic HTML
- **Korean language support**: `lang="ko"` in root layout

## Key Implementation Notes

### Development Practices
- Use 'use client' only for components requiring interactivity (useState, useEffect, etc.)
- Maintain therapeutic color system - avoid stark contrasts or aggressive colors
- Follow 8px grid system for spacing consistency
- Use established typography classes instead of arbitrary Tailwind font sizes
- Interactive elements must include `transition-gentle` class

### Supabase Integration Patterns
- Always use the Supabase utilities in `src/utils/supabase*Utils.ts` for database operations
- Handle authentication state with `useSupabaseAuth` hook
- Implement proper error handling for Supabase operations
- Use Row Level Security (RLS) policies for data access control
- Leverage real-time subscriptions for live updates where appropriate

### Post Creation & Editing Flow
1. User fills form on `/write` or `/edit/[id]` page
2. Form submission calls appropriate Supabase utility function
3. Database operation with proper authentication and ownership checks
4. Real-time UI updates via Supabase triggers and counts
5. User redirected to appropriate page (home, post detail, etc.)

### Authentication Flow
1. User signs up/in via `/login` or `/signup` pages
2. Supabase Auth handles session management automatically
3. Profile creation happens automatically during signup
4. Protected routes check authentication state before rendering
5. Auth state persists across browser sessions

### Database Schema Considerations
- All tables use UUID primary keys for security
- Row Level Security (RLS) enforces data access permissions
- Automatic triggers maintain counts and timestamps
- Foreign key constraints ensure data integrity
- Categories removed from posts (no longer required)

### Next.js 15 Compatibility
- Use `React.use()` for params in dynamic routes (not direct destructuring)
- All dynamic imports properly handled with client components
- Server components used where possible for better performance