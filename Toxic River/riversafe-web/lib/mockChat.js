// Mock "AI" for the chat mockup. A keyword router stands in for LLM tool-use routing;
// answers are templates filled from the station dataset. No API calls.
import { STATIONS, LATEST_ROUND } from "./rivers";
import { assessStation, LEVELS, STANDARD, thaiDate } from "./risk";
import { SOURCES } from "./sources";

export const SUGGESTIONS = [
  "ใช้น้ำแม่น้ำกกที่เชียงรายทำนาได้ไหม",
  "ต้มน้ำแล้วกำจัดสารหนูได้ไหม",
  "ปลาจากแม่น้ำกกยังกินได้ไหม",
  "ตรวจสารหนูในร่างกายได้ที่ไหน",
  "เจอปลาตายและน้ำขุ่นผิดปกติ จะแจ้งยังไง",
  "รัฐบาลแก้ปัญหาอะไรไปแล้วบ้าง",
];

const INTENTS = [
  { id: "boiling", label: "ตรวจข่าวลือ / ข้อเท็จจริง", words: ["ต้ม", "กรองน้ำ", "เครื่องกรอง", "ข่าวลือ", "จริงไหม"] },
  { id: "report", label: "แจ้งเหตุมลพิษ", words: ["แจ้ง", "ปลาตาย", "เจอ", "ร้องเรียน", "ส่งรูป", "ผิดปกติ"] },
  { id: "fish", label: "ความปลอดภัยของอาหาร", words: ["ปลา", "กุ้ง", "หอย", "สัตว์น้ำ", "กิน"] },
  { id: "health", label: "คำถามสุขภาพ", words: ["สุขภาพ", "ร่างกาย", "ปัสสาวะ", "ป่วย", "อาการ", "ตั้งครรภ์", "ตรวจสาร"] },
  { id: "gov", label: "การดำเนินงานของรัฐ", words: ["รัฐ", "รัฐบาล", "ฝาย", "เจรจา", "มาตรการ", "เมียนมา", "จีน"] },
  { id: "safety", label: "ความปลอดภัยในการใช้น้ำ", words: ["ใช้น้ำ", "ทำนา", "ปลอดภัย", "เล่นน้ำ", "รดน้ำ", "สูบน้ำ", "ดื่ม", "น้ำกก", "KK"] },
];

function route(text) {
  const scored = INTENTS.map((it) => ({ ...it, hits: it.words.filter((w) => text.includes(w)).length }));
  const best = scored.sort((a, b) => b.hits - a.hits)[0];
  if (!best.hits) return { id: "general", label: "คำถามทั่วไป", confidence: 0.62 };
  return { id: best.id, label: best.label, confidence: Math.min(0.98, 0.78 + best.hits * 0.08) };
}

function pickStation(text) {
  const m = text.match(/KK\d{2}/i);
  if (m) return STATIONS.find((s) => s.id === m[0].toUpperCase());
  if (text.includes("ท่าตอน") || text.includes("แม่อาย")) return STATIONS[0];
  if (text.includes("เชียงแสน")) return STATIONS[13];
  return STATIONS[9]; // KK10, Chiang Rai weir
}

function kb(...docs) {
  return docs.map(([key, score]) => ({ ...SOURCES[key], score }));
}

export function answer(text) {
  const intent = route(text);
  const r = { intent, tools: [], docs: [], text: "", sources: [], card: null };

  if (intent.id === "safety") {
    const st = pickStation(text);
    const a = assessStation(st, LATEST_ROUND);
    const lv = LEVELS[a.level];
    const val = a.value !== null ? `${a.value.toFixed(3)} มก./ล.` : "ไม่มีรายงานค่าเกินมาตรฐาน";
    r.tools = [
      { name: "get_river_status", input: { station: st.id }, output: `สารหนู ${val} · รอบ ${thaiDate(LATEST_ROUND)} · ความเสี่ยง ${lv.label}` },
      { name: "get_water_level", input: { station: "WL-KOK-CR" }, output: "1.62 ม. · 28% ของตลิ่ง (น้ำน้อย ฤดูแล้ง)" },
      { name: "search_knowledge", input: { query: "สารหนู การทำนา มาตรฐานน้ำใช้" }, output: "พบ 3 เอกสาร" },
    ];
    r.docs = kb(["pcdRound", 0.91], ["doh", 0.87], ["mfu", 0.79]);
    r.sources = [SOURCES.pcdRound, SOURCES.doh, SOURCES.mfu];
    r.card = { station: st.id, area: st.area, level: a.level, value: val, date: thaiDate(LATEST_ROUND), age: a.age };
    r.text = [
      `ผลตรวจล่าสุดของ คพ. บริเวณจุด ${st.id} (${st.area}) รอบ ${thaiDate(LATEST_ROUND)} พบสารหนู **${val}** ${
        a.value > STANDARD ? `ซึ่ง**เกิน**มาตรฐาน ${STANDARD.toFixed(3)} มก./ล.` : ""
      } [1]`,
      `ระดับความเสี่ยงตอนนี้: **${lv.label}** · ข้อมูลนี้เก่าแล้ว ${a.age} วัน และเป็นช่วงฤดูแล้งที่น้ำน้อย สารหนูจึงเจือจางน้อยลง`,
      "**คำแนะนำ**",
      "• ทำนาได้ แต่ควรเลี่ยงสูบน้ำช่วงที่น้ำขุ่นมาก เพราะสารหนูสะสมอยู่ในตะกอนดิน [3]",
      "• ห้ามใช้น้ำจากแม่น้ำดื่มหรือประกอบอาหาร มาตรฐานกรมอนามัยคือ น้ำดื่มไม่เกิน 0.01 และน้ำใช้ไม่เกิน 0.05 มก./ล. [2]",
      "• การต้มน้ำ**ไม่ได้**กำจัดสารหนู",
      "RiverSafe ยืนยันไม่ได้ว่าน้ำ “ปลอดภัย” เพราะไม่มีผลตรวจรอบใหม่ หากต้องการตรวจน้ำในแปลงของคุณ ติดต่อ รพ.สต. หรือสำนักงานสิ่งแวดล้อมจังหวัด",
    ].join("\n");
  } else if (intent.id === "boiling") {
    r.tools = [{ name: "search_knowledge", input: { query: "ต้มน้ำ สารหนู กรองน้ำ" }, output: "พบ 2 เอกสาร" }];
    r.docs = kb(["boilingKb", 0.95], ["doh", 0.81]);
    r.sources = [SOURCES.boilingKb, SOURCES.doh];
    r.text = [
      "**ไม่จริง** การต้มน้ำไม่ได้กำจัดสารหนู [1]",
      "เมื่อต้ม น้ำจะระเหยออกไปแต่สารหนูยังอยู่ น้ำที่เหลือจึงมี**สารหนูเข้มข้นขึ้น**",
      "**ทางเลือกที่ถูกต้อง**",
      "• ใช้น้ำประปา กปภ. หรือน้ำดื่มบรรจุขวดสำหรับดื่มและประกอบอาหาร [2]",
      "• หากต้องบำบัดเอง ต้องใช้ระบบที่ออกแบบมาเพื่อกำจัดสารหนู เช่น รีเวิร์สออสโมซิส (RO) และควรตรวจผลน้ำหลังบำบัด",
      "• เครื่องกรองทั่วไปหรือผ้ากรองช่วยลดความขุ่นได้ แต่ไม่ได้รับประกันว่าลดสารหนูได้",
    ].join("\n");
  } else if (intent.id === "fish") {
    r.tools = [{ name: "search_knowledge", input: { query: "สัตว์น้ำ แม่น้ำกก ประกาศเตือน" }, output: "พบ 2 เอกสาร" }];
    r.docs = kb(["fish", 0.93], ["sediment", 0.74]);
    r.sources = [SOURCES.fish, SOURCES.sediment];
    r.text = [
      "กรมประมงเตือนให้**หลีกเลี่ยงการบริโภคสัตว์น้ำ 10 ชนิด**จากแม่น้ำกก ที่ตรวจพบมลพิษเกินมาตรฐาน [1]",
      "**คำแนะนำ**",
      "• งดกินสัตว์น้ำตามประกาศของกรมประมง",
      "• ระวังเป็นพิเศษกับสัตว์ที่หากินตามพื้นท้องน้ำ เพราะสารหนูสะสมในตะกอนดิน ซึ่งผลตรวจล่าสุดพบเกินมาตรฐานหลายจุด [2]",
      "• เด็กเล็กและหญิงตั้งครรภ์ควรงดก่อน",
      "ดูรายชื่อชนิดสัตว์น้ำทั้งหมดได้จากประกาศฉบับเต็มของกรมประมง",
    ].join("\n");
  } else if (intent.id === "health") {
    r.tools = [{ name: "search_knowledge", input: { query: "ตรวจสารหนู ปัสสาวะ กลุ่มเสี่ยง เชียงราย" }, output: "พบ 3 เอกสาร" }];
    r.docs = kb(["noPatients", 0.9], ["urine", 0.88], ["doh", 0.7]);
    r.sources = [SOURCES.noPatients, SOURCES.urine];
    r.text = [
      "กระทรวงสาธารณสุขแจ้งว่า**ยังไม่พบผู้ป่วย**ที่ได้รับการวินิจฉัยว่าเป็นพิษจากสารหนู ทั้งระยะเฉียบพลันและเรื้อรัง [1]",
      "การคัดกรองในเชียงราย 18 อำเภอ ตรวจปัสสาวะ 549 คน พบสารหนูอนินทรีย์เกินค่าอ้างอิง 31 คน ซึ่งได้รับการตรวจซ้ำและติดตาม [2]",
      "**ถ้าคุณกังวล**",
      "• ติดต่อ รพ.สต. ใกล้บ้าน หรือสำนักงานสาธารณสุขจังหวัด (สสจ.) เพื่อขอเข้ารับการคัดกรอง",
      "• กลุ่มที่ควรระวังเป็นพิเศษ: เด็กเล็ก หญิงตั้งครรภ์ ผู้สูงอายุ และผู้ที่สัมผัสน้ำหรือตะกอนเป็นประจำ เช่น ชาวประมง",
      "RiverSafe ไม่ให้การวินิจฉัยทางการแพทย์ หากมีอาการผิดปกติ ควรพบแพทย์",
    ].join("\n");
  } else if (intent.id === "report") {
    r.tools = [
      { name: "classify_report", input: { text: "ปลาตาย น้ำขุ่น" }, output: "ประเภท: เหตุผิดปกติในแหล่งน้ำ · ความเร่งด่วน: สูง" },
      { name: "create_report", input: { channel: "web" }, output: "สร้างเรื่อง RS-2611-0042 (จำลอง)" },
    ];
    r.docs = kb(["sediment", 0.52]);
    r.sources = [];
    r.text = [
      "รับเรื่องแล้ว เลขที่ **RS-2611-0042** (จำลอง)",
      "**ขั้นต่อไป**",
      "• ส่งรูปถ่ายหรือวิดีโอ พร้อมเปิดตำแหน่ง (GPS) ระบบจะอ่านเวลาและพิกัดจากไฟล์ภาพเพื่อใช้เป็นหลักฐาน",
      "• AI จะจำแนกภาพ (น้ำขุ่น ปลาตาย สีผิดปกติ) แล้วปักหมุดบนแผนที่หลักฐาน",
      "• หากมีรายงานในพื้นที่ใกล้กันหลายเรื่อง ระบบจะรวมเป็น**ชุดหลักฐาน** ส่งถึงสำนักงานจังหวัดหรือศูนย์ดำรงธรรม",
      "ระหว่างนี้ อย่าสัมผัสหรือเก็บปลาตายไปกิน",
    ].join("\n");
  } else if (intent.id === "gov") {
    r.tools = [{ name: "search_news", input: { topic: "มาตรการรัฐ สารหนู แม่น้ำกก", days: 30 }, output: "พบ 3 ข่าว" }];
    r.docs = kb(["weir", 0.9], ["plan6", 0.88], ["mou", 0.82]);
    r.sources = [SOURCES.weir, SOURCES.plan6, SOURCES.mou];
    r.text = [
      "**มาตรการหลักที่มีรายงาน**",
      "• **ฝายอัจฉริยะ** ดักตะกอนที่มีสารหนู รายงานว่าลดได้ 94.6% เป็นโครงการนำร่อง 18 เดือน [1]",
      "• **แผน 6 ข้อ** ก่อนการเจรจาไทย–เมียนมา–จีน เช่น ติดตามแหล่งที่มาด้วยไอโซโทป และดักตะกอนก่อนเข้านาข้าว [2]",
      "• **ข้อตกลงไทย–เมียนมา** เรื่องมลพิษในแม่น้ำลงนามแล้ว แต่มีรายงานว่าเนื้อหาถูกลดทอนลง [3]",
      "ดูความคืบหน้ารายวันได้ที่หน้า “ข่าววันนี้”",
    ].join("\n");
  } else {
    r.tools = [{ name: "search_knowledge", input: { query: text.slice(0, 40) }, output: "พบ 2 เอกสาร" }];
    r.docs = kb(["pcdRound", 0.7], ["sediment", 0.66]);
    r.sources = [SOURCES.pcdRound, SOURCES.sediment];
    r.text = [
      "แม่น้ำกกพบสารหนูเกินมาตรฐานในหลายจุดตรวจ จากผลตรวจของ คพ. [1] และสารหนูสะสมเพิ่มขึ้นในตะกอนดิน [2]",
      "ฉันช่วยได้เรื่อง: การใช้น้ำ, ความปลอดภัยของอาหาร, สุขภาพ, การแจ้งเหตุ และมาตรการของรัฐ",
      "ลองถามเช่น “ใช้น้ำแม่น้ำกกที่เชียงรายทำนาได้ไหม”",
    ].join("\n");
  }
  return r;
}
