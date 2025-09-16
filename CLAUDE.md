# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Anxy** is a therapeutic personal blog platform designed for people dealing with anxiety, similar to Naver Blog/Brunch with a follow system. Users have individual blogs where they publish content, and can follow other users to see their posts in a personalized feed.

### MVP Approach 🎯
**Focus: Core feature validation over polished product**

This project prioritizes **MVP development for rapid feature validation** rather than building a complete, production-ready product. The goal is to test core hypotheses about personal blogging + follow system for anxiety communities.

**Key MVP Principles:**
- Speed over perfection
- Core feature validation
- Simple implementations (localStorage, basic auth, no advanced security)
- Mobile-first responsive design for future app expansion
- Therapeutic UI/UX maintained throughout

### MVP Development Roadmap 📋

**✅ Phase 1 Complete: Foundation (Days 1-2)**
- Basic post system with localStorage ✅
- Therapeutic design system and responsive layout ✅  
- User authentication system (signup/login) ✅
- Protected routes and header navigation ✅
- Write page with authentication integration ✅

**🚧 Phase 2 Current: Personal Blogs (Days 3-4)**
- `@username` dynamic routing for personal pages 🔄
- Display user's posts on personal blog page
- Basic profile information (text-only, no avatars)
- Follow/unfollow functionality with localStorage storage

**📋 Phase 3 Next: Feed System (Day 5)**
- Convert homepage to following feed
- Show posts only from followed users
- Simple feed algorithms (chronological)

**🎯 MVP Validation Goals:**
1. Do users want personal blog spaces in anxiety communities?
2. Does the follow system create meaningful connections?
3. Is the therapeutic UI/UX approach effective?
4. Does the platform encourage regular posting and engagement?

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
- **Client-side localStorage** for data persistence

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

### Data Architecture & State Management

**User-Centric Architecture**:
- **Users**: Stored in `localStorage.anxy_users` with authentication system
- **Current Session**: `localStorage.anxy_currentUser` tracks logged-in user
- **Posts**: `localStorage.anxy_posts` with author relationships to users
- **Follows**: `localStorage.anxy_follows` for user-to-user relationships

**User System Structure**:
```typescript
interface User {
  id: string;
  username: string;        // @username for personal pages
  displayName: string;     // Display name shown in UI
  bio: string;            // Profile description
  avatar: string;         // Avatar URL (future feature)
  createdAt: string;      // Account creation date
  isPrivate: boolean;     // Private profile setting
  allowFollow: boolean;   // Can be followed by others
}
```

**Authentication & State Management**:
- **UserContext**: React Context + useReducer for global user state
- **useAuth Hook**: Login/signup/logout functions with localStorage sync
- **Route Protection**: `ProtectedRoute` component for auth-required pages
- **Data Migration**: Automatic migration from old post structure to user-centric model
- **Mock Users**: Pre-populated test users with passwords (password1-5)

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

**PostCard Component** (`src/components/PostCard.tsx`):
- Card-based design with surface background and soft borders
- Includes category badge, metadata, and interaction buttons (likes/comments)
- Uses therapeutic spacing (p-6 lg:p-8) and hover effects
- Links to `/post/{id}` (not yet implemented)

**Header Component** (`src/components/layout/Header.tsx`):  
- Top navigation with logo, category links, and auth-aware buttons
- Always visible design (no mobile hamburger menu)
- Active state indicators using primary color and background
- Conditional rendering based on authentication state

**Authentication Components**:
- **`ProtectedRoute`** (`src/components/ProtectedRoute.tsx`): Route protection with loading states
- **`RequireAuth`**: Wrapper for pages requiring login
- **`RequireGuest`**: Wrapper for login/signup pages (redirects if authenticated)

**User System Files**:
- **`UserContext`** (`src/contexts/UserContext.tsx`): Global state management with useReducer
- **`useAuth`** (`src/hooks/useAuth.ts`): Authentication hook with login/signup/logout
- **`userUtils`** (`src/utils/userUtils.ts`): User CRUD operations and validation
- **User types** (`src/types/user.ts`): TypeScript interfaces and constants

### Page Structure
All pages follow a consistent pattern:
- Use `content-container` for optimal reading width (720px max)
- Apply appropriate padding (py-8 lg:py-12)
- Center-aligned headers with hero typography
- Consistent "더 많은 글 보기" pagination button

**Homepage** (`/`):
- Client component that loads and combines localStorage posts with mock data
- Refreshes post list when pathname changes (enables write → home flow)
- Shows all posts in chronological order

**Category Pages**: `/free`, `/thoughts`, `/music`, `/books`
- Static pages with category-specific mock data
- Identical layout structure with different content and page titles

**Write Page** (`/write`): 
- Protected route requiring authentication (`RequireAuth` wrapper)
- Integrates with user authentication system
- Uses `createPost()` utility for proper user-post relationships
- Form validation and success handling with automatic redirection

**Authentication Pages**:
- **Login Page** (`/login`): Mobile-first design with developer test accounts shown
- **Signup Page** (`/signup`): Real-time username validation with availability checking
- Both pages auto-redirect authenticated users to homepage
- 44px touch targets for mobile accessibility
- Form validation with inline error display

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

### Data Flow
- Write page → localStorage → Homepage refresh via pathname change
- No server-side persistence - fully client-side application
- Mock data provides realistic content for demonstration

### Post Creation Flow
1. User fills form on `/write` page
2. Form submission creates post object with auto-generated excerpt and ID
3. Post saved to `localStorage.userPosts` array  
4. User navigated to homepage with `router.push('/')`
5. Homepage detects pathname change and reloads all posts including new one

### Responsive Design
- Mobile padding: 1rem, Desktop padding: 2rem
- Container max-widths: content (720px), wide (1200px)
- Typography scales appropriately across breakpoints
- Always-visible navigation works across all screen sizes