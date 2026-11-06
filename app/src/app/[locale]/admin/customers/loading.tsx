export default function CustomersLoading() {
  return (
    <main className="p-5 md:p-8">
      <div role="status" aria-live="polite" className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-9 w-52 rounded-lg bg-[#eee5e0] dark:bg-[#3a3431]" />
        <div className="h-24 rounded-2xl bg-[#eee5e0] dark:bg-[#3a3431]" />
        <div className="h-80 rounded-2xl bg-[#eee5e0] dark:bg-[#3a3431]" />
      </div>
    </main>
  );
}
