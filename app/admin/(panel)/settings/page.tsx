import { refreshFxAction } from "@/app/actions/admin";
import { SettingsForm } from "@/components/admin-forms";
import { SubmitButton } from "@/components/submit-button";
import { formatWhen } from "@/lib/money";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const fx = query.fx === "1";
  const fxError = query.fxError === "1";
  const settings = getSettings();

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">Cài đặt giá</h1>
        <p className="text-sm text-[#5d7388]">
          Giá bán = giá nguồn × tỷ giá × hệ số condition × (1 + % lời). Nếu nguồn đã đúng condition thì hệ số không áp dụng.
          {settings.ratesUpdatedAt ? ` Cập nhật lần cuối ${formatWhen(settings.ratesUpdatedAt)}.` : ""}
        </p>
      </div>
      {fx ? <p className="rounded-2xl bg-[#eef7f1] px-4 py-3 text-sm text-[#24573a]">Đã lấy tỷ giá mới.</p> : null}
      {fxError ? (
        <p className="rounded-2xl bg-[#fff6f4] px-4 py-3 text-sm text-[#8a3b3b]">Không lấy được tỷ giá. Nhập tay bên dưới.</p>
      ) : null}
      <form action={refreshFxAction}>
        <SubmitButton variant="outline" className="h-10 rounded-full" pendingLabel="Đang lấy tỷ giá…">
          Lấy tỷ giá USD và JPY
        </SubmitButton>
      </form>
      <SettingsForm settings={settings} />
    </div>
  );
}
