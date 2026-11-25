"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { answer, SUGGESTIONS } from "@/lib/mockChat";
import { LEVELS } from "@/lib/risk";

const WELCOME = {
  role: "assistant",
  text: "สวัสดีครับ ฉันคือผู้ช่วย RiverSafe ถามเรื่องสารหนูในแม่น้ำกก สาย รวก และโขงได้เลย ทุกคำตอบจะบอกแหล่งที่มาและวันที่ของข้อมูล",
  done: true,
};

export default function ChatApp() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [trace, setTrace] = useState(null);
  const [traceStep, setTraceStep] = useState(0);
  const [mobileTab, setMobileTab] = useState("chat");
  const [sideTab, setSideTab] = useState("trace");
  const listRef = useRef(null);
  const started = useRef(false);

  const send = useCallback(
    (text) => {
      const q = text.trim();
      if (!q || busy) return;
      setInput("");
      setBusy(true);
      const res = answer(q);
      setTrace({ question: q, ...res });
      setTraceStep(0);
      setMessages((m) => [...m, { role: "user", text: q, done: true }, { role: "assistant", text: "", pending: true, res }]);

      // Reveal the "behind the answer" steps one by one, then stream the text.
      const steps = 2 + res.tools.length;
      let s = 0;
      const stepTimer = setInterval(() => {
        s += 1;
        setTraceStep(s);
        if (s >= steps) {
          clearInterval(stepTimer);
          let i = 0;
          const full = res.text;
          const streamTimer = setInterval(() => {
            i = Math.min(full.length, i + 6);
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", text: full.slice(0, i), pending: false, done: i >= full.length, res };
              return copy;
            });
            if (i >= full.length) {
              clearInterval(streamTimer);
              setBusy(false);
            }
          }, 22);
        }
      }, 450);
    },
    [busy],
  );

  // Prefill from the map page (?q=...). Read in an effect so the page stays prerenderable.
  useEffect(() => {
    if (started.current) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    const t = setTimeout(() => {
      started.current = true;
      send(q);
    }, 300);
    return () => clearTimeout(t);
  }, [send]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col md:h-[calc(100vh-3.5rem)] md:flex-none md:flex-row">
      {/* Mobile tabs */}
      <div className="grid grid-cols-3 border-b border-line bg-white text-[13px] font-semibold md:hidden">
        {[
          ["chat", "แชต"],
          ["trace", "เบื้องหลังคำตอบ"],
          ["line", "ตัวอย่าง LINE"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setMobileTab(k)} className={`py-2.5 ${mobileTab === k ? "border-b-2 border-brand text-brand" : "text-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <section className={`${mobileTab === "chat" ? "flex" : "hidden"} min-h-[70vh] flex-1 flex-col md:flex md:min-h-0`}>
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}
        </div>

        <div className="border-t border-line bg-white p-3 md:p-4">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => send(s)}
                className="shrink-0 rounded-full border border-brand/40 bg-brand-light px-3 py-1.5 text-[12.5px] font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์คำถามเป็นภาษาไทย…"
              className="flex-1 rounded-xl border border-line bg-background px-4 py-2.5 text-[15px] outline-none focus:border-brand"
            />
            <button disabled={busy || !input.trim()} className="rounded-xl bg-brand px-5 font-bold text-white disabled:opacity-40">
              ส่ง
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted">
            ต้นแบบ: คำตอบสร้างจากแม่แบบและข้อมูลตัวอย่าง ยังไม่ได้เรียก AI จริง · ไม่ใช่คำแนะนำทางการแพทย์
          </p>
        </div>
      </section>

      {/* Side panel */}
      <aside className={`${mobileTab === "chat" ? "hidden" : "block"} w-full overflow-y-auto border-l border-line bg-white md:block md:w-[420px]`}>
        <div className="hidden border-b border-line text-[13px] font-semibold md:grid md:grid-cols-2">
          {[
            ["trace", "เบื้องหลังคำตอบ"],
            ["line", "ตัวอย่างบน LINE"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setSideTab(k)} className={`py-3 ${sideTab === k ? "border-b-2 border-brand text-brand" : "text-muted"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className={`${mobileTab === "trace" ? "block" : "hidden"} ${sideTab === "trace" ? "md:block" : "md:hidden"}`}>
          <TracePanel trace={trace} step={traceStep} />
        </div>
        <div className={`${mobileTab === "line" ? "block" : "hidden"} ${sideTab === "line" ? "md:block" : "md:hidden"}`}>
          <LinePreview messages={messages} onSend={send} busy={busy} />
        </div>
      </aside>
    </div>
  );
}

// --- Message rendering ---------------------------------------------------

function RichText({ text, citeColor = "#0f6e74" }) {
  return text.split("\n").map((line, li) => {
    const bullet = line.startsWith("• ");
    const body = bullet ? line.slice(2) : line;
    const parts = body.split(/(\*\*[^*]+\*\*|\[\d\])/g).filter(Boolean);
    return (
      <p key={li} className={`${bullet ? "flex gap-2 pl-1" : ""} mb-1.5 last:mb-0`}>
        {bullet && <span className="text-brand">•</span>}
        <span>
          {parts.map((p, i) => {
            if (p.startsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
            if (/^\[\d\]$/.test(p))
              return (
                <sup key={i} className="ml-0.5 rounded px-1 text-[10px] font-bold text-white" style={{ background: citeColor }}>
                  {p.slice(1, -1)}
                </sup>
              );
            return <span key={i}>{p}</span>;
          })}
        </span>
      </p>
    );
  });
}

function Bubble({ m }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-[15px] text-white">{m.text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-2.5">
      <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-[12px] font-bold text-white">AI</div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-white px-4 py-3 text-[15px] leading-relaxed shadow-sm">
        {m.pending ? (
          <span className="typing flex gap-1 py-1 text-muted">
            <span>●</span>
            <span>●</span>
            <span>●</span>
          </span>
        ) : (
          <RichText text={m.text} />
        )}
        {m.done && m.res?.card && <StatusCard card={m.res.card} />}
        {m.done && m.res?.sources?.length > 0 && (
          <div className="mt-3 border-t border-line pt-2">
            <div className="mb-1 text-[11px] font-bold text-muted">แหล่งที่มา</div>
            <ol className="space-y-1">
              {m.res.sources.map((s, i) => (
                <li key={i} className="flex gap-2 text-[12px]">
                  <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-brand text-[10px] font-bold text-white">{i + 1}</span>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                      {s.title} <span className="text-muted">· {s.outlet}</span>
                    </a>
                  ) : (
                    <span className="text-muted">{s.title}</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ card }) {
  const lv = LEVELS[card.level];
  return (
    <div className="mt-3 rounded-xl border p-3" style={{ borderColor: lv.color, background: lv.bg }}>
      <div className="flex items-center justify-between">
        <span className="font-bold">จุดตรวจ {card.station}</span>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: lv.color }}>
          ความเสี่ยง {lv.label}
        </span>
      </div>
      <div className="text-[12px] text-muted">{card.area}</div>
      <div className="mt-1 text-[13px]">
        สารหนู <b>{card.value}</b> · รอบ {card.date} ({card.age} วันก่อน)
      </div>
      <Link href="/" className="mt-2 inline-block text-[12px] font-bold text-brand">ดูบนแผนที่ →</Link>
    </div>
  );
}

// --- Behind the answer -----------------------------------------------------

function TracePanel({ trace, step }) {
  if (!trace) {
    return (
      <div className="p-5 text-[13px] leading-relaxed text-muted">
        <h3 className="mb-2 text-[15px] font-bold text-foreground">เบื้องหลังคำตอบ</h3>
        เมื่อคุณถามคำถาม แผงนี้จะแสดงขั้นตอนการทำงานของ AI: Router จัดประเภทคำถาม → Agent เรียกเครื่องมือ → RAG ค้นเอกสาร → เรียบเรียงคำตอบพร้อมอ้างอิง
      </div>
    );
  }
  const items = [
    { title: "1. Router จัดประเภทคำถาม", body: <><b>{trace.intent.label}</b> <span className="text-muted">· ความมั่นใจ {Math.round(trace.intent.confidence * 100)}%</span></> },
    ...trace.tools.map((t, i) => ({
      title: `${i + 2}. เรียกเครื่องมือ`,
      body: (
        <>
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[12px]">
            {t.name}({Object.entries(t.input).map(([k, v]) => `${k}: "${v}"`).join(", ")})
          </code>
          <div className="mt-1 text-[12px] text-muted">→ {t.output}</div>
        </>
      ),
    })),
    {
      title: `${trace.tools.length + 2}. RAG: เอกสารที่ค้นเจอ`,
      body: (
        <ul className="space-y-1.5">
          {trace.docs.map((d, i) => (
            <li key={i} className="text-[12px]">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 rounded bg-gray-100">
                  <div className="h-1.5 rounded bg-brand" style={{ width: `${d.score * 100}%` }} />
                </div>
                <span className="tabular-nums text-muted">{d.score.toFixed(2)}</span>
              </div>
              <div className="mt-0.5">{d.title}</div>
            </li>
          ))}
        </ul>
      ),
    },
  ];
  return (
    <div className="p-5">
      <div className="mb-3 text-[12px] text-muted">คำถาม</div>
      <div className="mb-4 rounded-lg bg-background p-3 text-[14px] font-semibold">{trace.question}</div>
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li
            key={i}
            className={`rounded-lg border border-line p-3 transition-all duration-300 ${i < step ? "opacity-100" : "translate-y-1 opacity-0"}`}
          >
            <div className="mb-1 text-[12px] font-bold text-brand">{it.title}</div>
            <div className="text-[13px]">{it.body}</div>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-lg bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
        <b>กฎความปลอดภัยของระบบ:</b> ไม่บอกว่า “ปลอดภัย” · บอกวันที่และแหล่งข้อมูลเสมอ · คำถามสุขภาพใช้แนวทางกระทรวงสาธารณสุขเท่านั้น
      </div>
    </div>
  );
}

// --- LINE preview ------------------------------------------------------------

function LinePreview({ messages, onSend, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [messages]);
  return (
    <div className="flex justify-center p-5">
      <div className="w-[300px] overflow-hidden rounded-[2rem] border-[6px] border-gray-800 bg-[#8cabd9] shadow-xl">
        <div className="flex items-center gap-2 bg-[#2b3a4a] px-3 py-2.5 text-white">
          <span className="text-[16px]">‹</span>
          <div className="grid h-7 w-7 place-items-center rounded-full bg-brand text-[10px] font-bold">RS</div>
          <div className="text-[13px] font-bold">RiverSafe</div>
          <span className="ml-auto rounded bg-[#06c755] px-1.5 text-[9px] font-bold">LINE OA</span>
        </div>
        <div ref={ref} className="h-[430px] space-y-2 overflow-y-auto p-2.5">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-[#06c755] px-3 py-1.5 text-[12.5px] text-white">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="flex gap-1.5">
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[8px] font-bold text-white">RS</div>
                <div className="max-w-[85%] space-y-1.5">
                  <div className="rounded-2xl bg-white px-3 py-1.5 text-[12.5px] leading-snug">
                    {m.pending ? "…" : <RichText text={m.text.replace(/\s?\[\d\]/g, "")} />}
                  </div>
                  {m.done && m.res?.card && <LineFlex card={m.res.card} />}
                </div>
              </div>
            ),
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto bg-white/90 p-2">
          {SUGGESTIONS.slice(0, 4).map((s) => (
            <button key={s} disabled={busy} onClick={() => onSend(s)} className="shrink-0 rounded-full border border-[#06c755] px-2.5 py-1 text-[11px] font-semibold text-[#06a346] disabled:opacity-50">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LineFlex({ card }) {
  const lv = LEVELS[card.level];
  return (
    <div className="w-[210px] overflow-hidden rounded-xl bg-white">
      <div className="px-3 py-2 text-[12px] font-bold text-white" style={{ background: lv.color }}>
        สถานะแม่น้ำ · ความเสี่ยง{lv.label}
      </div>
      <div className="px-3 py-2 text-[11.5px]">
        <div className="font-bold">จุดตรวจ {card.station}</div>
        <div className="text-muted">{card.area}</div>
        <div className="mt-1">สารหนู {card.value}</div>
        <div className="text-muted">รอบ {card.date}</div>
      </div>
      <div className="border-t border-line py-1.5 text-center text-[11.5px] font-bold text-[#06a346]">เปิดแผนที่</div>
    </div>
  );
}
