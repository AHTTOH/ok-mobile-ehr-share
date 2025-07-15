'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
} from 'lucide-react';
import { signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppLogo } from './icons';
import { auth } from '@/lib/firebase';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === '/dashboard';

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
      // You could add a toast notification here for the user
    }
  };

  const getTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'OK금융그룹 mobile eHR';
      case '/leave':
        return '휴가 신청';
      case '/overtime':
        return '연장근로 신청';
      case '/business-trip':
        return '출장 신청';
      case '/welfare/condo-reservation':
        return '콘도 예약';
      case '/resignation':
        return '사직서 제출';
      case '/resignation/interview':
        return 'AI 퇴사 면담';
      case '/payslip':
        return '급여명세서';
      default:
        return 'OK금융그룹 mobile eHR';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <div className="flex items-center gap-2">
        {isDashboard ? (
          <AppLogo className="h-7 w-7 text-primary" />
        ) : (
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        )}
        <h1 className="font-headline text-lg font-semibold">{getTitle()}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>홍길동</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>설정</DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
