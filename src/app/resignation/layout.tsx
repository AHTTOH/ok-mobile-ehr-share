import Header from '@/components/header';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full justify-center">
      <div className="flex min-h-screen w-full max-w-md flex-col border-x bg-background">
        <Header />
        <main className="flex flex-1 flex-col p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
