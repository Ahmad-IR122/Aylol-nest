export default function OrderInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#817571] dark:text-[#aaa09b]">{label}</p>
      <p className="mt-1 wrap-anywhere whitespace-pre-wrap">{value}</p>
    </div>
  );
}
