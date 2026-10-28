import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[44rem] px-4 pb-16 sm:px-6">
      <header className="flex items-baseline justify-between py-6">
        <Link href="/" className="font-semibold tracking-tight">
          Rental Agent
        </Link>
        <span className="text-sm text-muted">New York City</span>
      </header>
      {children}
    </div>
  );
}
