import { formatVnd } from "@/lib/money";
import type { RevenueDay, StatusSlice, TopProduct } from "@/lib/crm";
import type { OrderStatus } from "@/lib/store";

const statusLabel: Record<OrderStatus, string> = {
  new: "Mới",
  confirmed: "Đã xác nhận",
  done: "Hoàn tất",
  cancelled: "Hủy",
};

const statusColor: Record<OrderStatus, string> = {
  new: "#1a4f86",
  confirmed: "#2f6f4e",
  done: "#24344a",
  cancelled: "#c4b8b4",
};

export function RevenueChart({ days }: { days: RevenueDay[] }) {
  const max = Math.max(...days.map((day) => day.revenue), 1);
  const width = 640;
  const height = 160;
  const gap = 8;
  const barWidth = (width - gap * (days.length - 1)) / days.length;
  return (
    <svg viewBox={`0 0 ${width} ${height + 22}`} className="w-full" role="img" aria-label="Doanh thu 14 ngày">
      {days.map((day, index) => {
        const barHeight = day.revenue === 0 ? 0 : Math.max(4, (day.revenue / max) * height);
        const x = index * (barWidth + gap);
        return (
          <g key={day.key}>
            <rect
              x={x}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={5}
              fill="#1a4f86"
              aria-label={`${day.label}: ${formatVnd(day.revenue)}, ${day.orders} đơn`}
            />
            <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize={10} fill="#5d7388">
              {day.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function StatusChart({ slices }: { slices: StatusSlice[] }) {
  const max = Math.max(...slices.map((slice) => slice.count), 1);
  return (
    <ul className="grid gap-3">
      {slices.map((slice) => (
        <li key={slice.status}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold">{statusLabel[slice.status]}</span>
            <span className="text-[#5d7388]">
              {slice.count} đơn
              {slice.status === "cancelled" ? "" : ` · ${formatVnd(slice.revenue)}`}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#e7eef5]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(slice.count / max) * 100}%`, background: statusColor[slice.status] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProductChart({ products }: { products: TopProduct[] }) {
  const max = Math.max(...products.map((product) => product.quantity), 1);
  return (
    <ul className="grid gap-3">
      {products.map((product) => (
        <li key={product.name}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-semibold">{product.name}</span>
            <span className="shrink-0 text-[#5d7388]">
              {product.quantity} · {formatVnd(product.revenue)}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[#e7eef5]">
            <div className="h-full rounded-full bg-[#8eb8d6]" style={{ width: `${(product.quantity / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
