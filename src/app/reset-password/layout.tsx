import React from 'react';

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      {children}
    </main>
  );
}
