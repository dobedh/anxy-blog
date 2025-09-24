'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // Don't show the main header on write and edit pages
  if (pathname === '/write' || pathname.startsWith('/edit/')) {
    return null;
  }

  return <Header />;
}