"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES, DIGEST, NEWS } from "@/lib/news";
import { MOCK_NOW, thaiDate } from "@/lib/risk";

const CAT_COLORS = {
  สถานการณ์: "bg-red-50 text-red-700",
  สุขภาพ: "bg-emerald-50 text-emerald-700",
  มาตรการรัฐ: "bg-blue-50 text-blue-700",
  ต่างประเทศ: "bg-violet-50 text-violet-700",
};

export default function NewsFeed() {
  const [cat, setCat] = useState("ทั้งหมด");
  const items = NEWS.filter((n) => cat === "ทั้งหมด" || (cat === "วิดีโอ" ? n.type === "video" : n.category === cat));
  const latest = items.filter((n) => n.latest);
  const earlier = items.filter((n) => !n.latest);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-[26px] font-bold">ข่าววันนี้</h1>
          <p className="text-[13px] text-muted">{thaiDate(MOCK_NOW)} · AI อ่านและดูข่าวให้ แล้วสรุปเป็นภาษาที่เข้าใจง่าย</p>
        </div>
        <Pipeline />
      </div>

      {/* Daily digest */}
      <section className="mt-4 rounded-2xl bg-brand p-5 text-white shadow">
        <div className="text-[12px] font-semibold opacity-80">สรุปวันนี้ใน 3 บรรทัด</div>
        <ol className="mt-2 space-y-1.5">
          {DIGEST.map((d, i) => (
            <li key={i} className="flex gap-2 text-[15.5px] leading-snug">
              <span className="font-bold opacity-70">{i + 1}.</span>
              {d}
            </li>
          ))}
        </ol>
      </section>

      {/* Filters */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
              cat === c ? "bg-foreground text-white" : "border border-line bg-white text-muted hover:bg-gray-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {latest.length > 0 && <Section title="ล่าสุด" items={latest} />}
      {earlier.length > 0 && <Section title="ข่าวก่อนหน้า" items={earlier} />}
      {items.length === 0 && <p className="mt-8 text-center text-muted">ยังไม่มีข่าวในหมวดนี้</p>}

      <p className="mt-8 text-[11px] leading-relaxed text-muted">
        ต้นแบบ: การ์ดบทความสรุปจากข่าวจริงและลิงก์ไปยังต้นฉบับ · การ์ดวิดีโอเป็นตัวอย่างรูปแบบ (ช่องและคลิปจำลอง) · ระบบจริงจะแสดงเฉพาะบทสรุปพร้อมลิงก์ ไม่เผยแพร่บทความฉบับเต็ม
      </p>
    </div>
  );
}

function Pipeline() {
  const steps = ["ค้นจาก 18 แหล่ง", "อ่าน/ดู 11 รายการ", "รวมข่าวซ้ำ", "สรุป 7 การ์ด"];
  return (
    <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-muted">
      {steps.map((s, i) => (
        <span key={s} className="flex items-center gap-1">
          <span className="rounded-md bg-white px-2 py-1 font-semibold shadow-sm ring-1 ring-line">{s}</span>
          {i < steps.length - 1 && <span>→</span>}
        </span>
      ))}
      <span className="ml-1">· อัปเดต 07:00 น.</span>
    </div>
  );
}

function Section({ title, items }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[17px] font-bold">{title}</h2>
      <div className="grid items-start gap-4 md:grid-cols-2">
        {items.map((n) => (
          <NewsCard key={n.id} n={n} />
        ))}
      </div>
    </section>
  );
}

function NewsCard({ n }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      {n.type === "video" && <VideoThumb n={n} />}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[11.5px]">
          <span className={`rounded-full px-2 py-0.5 font-bold ${CAT_COLORS[n.category] ?? "bg-gray-100"}`}>{n.category}</span>
          <span className="font-semibold text-muted">{n.type === "video" ? `วิดีโอ · ${n.channel}` : "บทความ"}</span>
          <span className="text-muted">· {n.when}</span>
          {n.mock && <span className="rounded bg-amber-100 px-1.5 font-semibold text-amber-800">ตัวอย่างจำลอง</span>}
        </div>
        <h3 className="text-[17px] font-bold leading-snug">{n.title}</h3>

        <ul className="mt-2 space-y-1">
          {n.points.map((p, i) => (
            <li key={i} className="flex gap-2 text-[14px] leading-snug">
              <span className="text-brand">•</span>
              {p}
            </li>
          ))}
        </ul>

        {open && (
          <div className="mt-3 grid gap-2 text-[13px]">
            <div className="rounded-lg bg-gray-50 p-2.5">
              <div className="text-[11px] font-bold text-muted">ใครได้รับผลกระทบ</div>
              {n.who}
            </div>
            <div className="rounded-lg bg-brand-light p-2.5">
              <div className="text-[11px] font-bold text-brand">ควรทำอะไร</div>
              {n.todo}
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold text-muted">ต้นฉบับ ({n.sources.length} แหล่ง)</div>
              {n.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="block truncate text-[12.5px] text-brand hover:underline">
                  {s.outlet}: {s.title}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <SparkIcon /> {n.ai}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setOpen((o) => !o)} className="rounded-lg border border-line px-3 py-1.5 text-[12.5px] font-semibold hover:bg-gray-50">
              {open ? "ย่อ" : "อ่านเพิ่ม"}
            </button>
            <Link
              href={`/chat?q=${encodeURIComponent(n.title)}`}
              className="rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brand-dark"
            >
              ถามต่อในแชต
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function VideoThumb({ n }) {
  return (
    <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-[#123c4a] via-[#0f6e74] to-[#5b8c5a]">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white/90 shadow-lg">
        <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-[#c4302b]">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
      <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 text-[11px] font-semibold text-white">{n.duration}</span>
      <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[11px] text-white">YouTube · คลิปจำลอง</span>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-brand">
      <path d="M12 2l2.2 6.3L20 10l-5.8 1.7L12 18l-2.2-6.3L4 10l5.8-1.7z" />
    </svg>
  );
}
