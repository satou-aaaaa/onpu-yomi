// 音符よみ：音符・休符の長さ、音の名前（ドレミ・ハニホ・CDE）、楽譜の音の高さ、強弱・速さ・演奏のしかた・くり返しの記号を当てる。
// 記号の意味は README の出典（英語版 Wikipedia の Dynamics・Tempo・Glossary of musical terminology）で確かめたもの。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  // 組（練習の組・記号の帳の分け方）
  const AREAS = ["音符・休符", "音の名前", "強弱", "速さ", "演奏のしかた", "くり返し・変化記号"];

  // ---- 絵（SVG）。色は文字と同じ（currentColor）----
  const svg = (vb, w, body, label, cls = "") => `<svg class="pic${cls ? " " + cls : ""}" viewBox="${vb}" width="${w}" role="img" aria-label="${label}" fill="currentColor" stroke="currentColor">${body}</svg>`;
  const HEAD = (x, y, open) => `<ellipse cx="${x}" cy="${y}" rx="8.6" ry="6.2" transform="rotate(-22 ${x} ${y})" ${open ? 'fill="none" stroke-width="2.8"' : 'stroke="none"'}/>`;
  const flags = (x, top, n) => { let s = ""; for (let i = 0; i < n; i++) { const y = top + i * 10; s += `<path d="M${x} ${y} C${x + 2} ${y + 10} ${x + 15} ${y + 13} ${x + 11} ${y + 28}" fill="none" stroke-width="3.2"/>`; } return s; };
  // 音符1つ：v＝長さ（4分音符を1拍）。付点は 3・1.5・0.75
  function noteBody(x, y, v, up = true) {
    const dot = [3, 1.5, 0.75].includes(v), base = dot ? v / 1.5 : v, open = base >= 2;
    let s = HEAD(x, y, open);
    if (base < 4) { const sx = up ? x + 8 : x - 8, top = up ? y - 52 : y + 52; s += `<line x1="${sx}" y1="${y - (up ? 2 : -2)}" x2="${sx}" y2="${top}" stroke-width="2.6"/>`; const n = base === 0.5 ? 1 : base === 0.25 ? 2 : 0; if (n) s += up ? flags(sx, top, n) : flags(sx, top - 28, 0); }
    if (dot) s += `<circle cx="${x + 16}" cy="${y - 3}" r="3.2" stroke="none"/>`;
    return s;
  }
  const staff5 = (w, y0 = 30) => [0, 1, 2, 3, 4].map((i) => `<line x1="2" x2="${w - 2}" y1="${y0 + i * 10}" y2="${y0 + i * 10}" stroke-width="1.2" opacity=".55"/>`).join("");
  // 休符1つ（5本線の上に置く。線は y=30〜70）
  function restBody(x, v) {
    const dot = [3, 1.5, 0.75].includes(v), base = dot ? v / 1.5 : v;
    let s = "";
    if (base === 4) s += `<rect x="${x - 11}" y="40" width="22" height="6" stroke="none"/>`;
    else if (base === 2) s += `<rect x="${x - 11}" y="44" width="22" height="6" stroke="none"/>`;
    else if (base === 1) s += `<path d="M${x - 4} 31 L${x + 6} 43 L${x - 3} 52 L${x + 6} 63 C${x - 2} 59 ${x - 9} 63 ${x - 1} 71" fill="none" stroke-width="3.6" stroke-linejoin="round"/>`;
    else { const n = base === 0.5 ? 1 : 2; for (let i = 0; i < n; i++) { const y = 42 + i * 10; s += `<circle cx="${x - 5 + -i * 2}" cy="${y}" r="3.6" stroke="none"/><path d="M${x - 5 - i * 2} ${y + 2} Q${x + 1} ${y + 3} ${x + 6 - i * 2} ${y - 4}" fill="none" stroke-width="2.4"/>`; } s += `<line x1="${x + 6}" y1="38" x2="${x - 4}" y2="${n === 1 ? 66 : 72}" stroke-width="2.6"/>`; }
    if (dot) s += `<circle cx="${x + 17}" cy="45" r="3.2" stroke="none"/>`;
    return s;
  }

  // ---- 音符・休符（4分音符を1拍とする）----
  const BEAT = { 4: "4拍", 3: "3拍", 2: "2拍", 1.5: "1拍半", 1: "1拍", 0.5: "半拍", 0.25: "4分の1拍" };
  const beatStr = (x) => BEAT[x] || (Number.isInteger(x) ? x + "拍" : Math.floor(x) + "拍半");
  const NV = [[4, "全"], [3, "付点2分"], [2, "2分"], [1.5, "付点4分"], [1, "4分"], [0.5, "8分"], [0.25, "16分"]];
  const ITEMS = [];
  const add = (o) => { o.no = ITEMS.length + 1; ITEMS.push(o); return o; };
  for (const r of [0, 1]) for (const [v, nm] of NV) add({ g: 0, rest: !!r, v, nm: nm + (r ? "休符" : "音符"), yomi: nm + (r ? "きゅうふ" : "おんぷ"), mean: BEAT[v] + (r ? "休む" : "のばす") });

  // ---- 音の名前：ド〜シ ----
  const DO = ["ド", "レ", "ミ", "ファ", "ソ", "ラ", "シ"], HA = ["ハ", "ニ", "ホ", "ヘ", "ト", "イ", "ロ"], EN = ["C", "D", "E", "F", "G", "A", "B"];
  for (let i = 0; i < 7; i++) add({ g: 1, step: i, nm: DO[i], yomi: DO[i], mean: `日本の音名は「${HA[i]}」、英語の音名は「${EN[i]}」` });

  // ---- 記号：[組, 記号, 読み（ちがう言い方は /）, 意味, 同じ意味の仲間（まちがいの選び肢に入れない）, 絵] ----
  const T = (s) => `<span class="sym">${s}</span>`;
  const quarterWith = (mark) => svg("0 0 60 104", 48, noteBody(24, 76, 1) + mark, "");
  const PICS = {
    "<": svg("0 0 110 40", 96, `<path d="M100 6 L10 20 L100 34" fill="none" stroke-width="3"/>`, "だんだん開く松葉の形", "wide"),
    ">": svg("0 0 110 40", 96, `<path d="M10 6 L100 20 L10 34" fill="none" stroke-width="3"/>`, "だんだん閉じる松葉の形", "wide"),
    stac: quarterWith(`<circle cx="24" cy="92" r="3.6" stroke="none"/>`),
    ten: quarterWith(`<line x1="13" x2="35" y1="92" y2="92" stroke-width="3.4"/>`),
    acc: quarterWith(`<path d="M12 87 L36 93 L12 99" fill="none" stroke-width="3"/>`),
    ferm: quarterWith(`<path d="M8 15 A17 14 0 0 1 42 15" fill="none" stroke-width="3"/><circle cx="25" cy="11" r="3" stroke="none"/>`).replace("0 0 60 104", "0 -4 60 108"),
    slur: svg("0 0 110 104", 84, noteBody(26, 80, 1) + noteBody(76, 62, 1) + `<path d="M20 92 Q54 104 80 76" fill="none" stroke-width="2.6"/>`, ""),
    tie: svg("0 0 110 104", 84, noteBody(26, 76, 1) + noteBody(76, 76, 1) + `<path d="M28 88 Q51 102 74 88" fill="none" stroke-width="2.6"/>`, ""),
    rep: svg("0 0 64 100", 52, staff5(64) + `<circle cx="30" cy="45" r="3.4" stroke="none"/><circle cx="30" cy="55" r="3.4" stroke="none"/><line x1="40" x2="40" y1="30" y2="70" stroke-width="2"/><rect x="46" y="30" width="6" height="40" stroke="none"/>`, ""),
  };
  const SYMS = [
    [2, "pp", "ピアニッシモ", "とても弱く", ""], [2, "p", "ピアノ", "弱く", ""], [2, "mp", "メゾピアノ/メッゾピアノ", "少し弱く", ""], [2, "mf", "メゾフォルテ/メッゾフォルテ", "少し強く", ""],
    [2, "f", "フォルテ", "強く", ""], [2, "ff", "フォルティッシモ/フォルテッシモ", "とても強く", ""],
    [2, "cresc.", "クレシェンド/クレッシェンド", "だんだん強く", "up"], [2, "decresc.", "デクレシェンド/デクレッシェンド", "だんだん弱く", "down"], [2, "dim.", "ディミヌエンド", "だんだん弱く", "down"],
    [2, "sf", "スフォルツァンド/スフォルツァート", "その音を急に強く", ""], [2, "fp", "フォルテピアノ", "強く、すぐに弱く", ""],
    [2, "<", "クレシェンド/クレッシェンド", "だんだん強く（松葉の形）", "up", "<"], [2, ">", "デクレシェンド/デクレッシェンド", "だんだん弱く（松葉の形）", "down", ">"],
    [3, "Largo", "ラルゴ", "幅広く、ゆるやかに", "slow"], [3, "Lento", "レント", "ゆるやかに", "slow"], [3, "Adagio", "アダージョ/アダージオ", "ゆるやかに、表情ゆたかに", "slow"],
    [3, "Andante", "アンダンテ", "歩くような速さで", ""], [3, "Moderato", "モデラート", "中くらいの速さで", ""], [3, "Allegretto", "アレグレット", "やや速く", ""],
    [3, "Allegro", "アレグロ", "速く、明るく", ""], [3, "Vivace", "ヴィヴァーチェ/ビバーチェ/ヴィバーチェ", "生き生きと速く", ""], [3, "Presto", "プレスト", "とても速く", ""],
    [3, "rit.", "リタルダンド/リタルダント", "だんだん遅く", "rit"], [3, "rall.", "ラレンタンド", "だんだんゆるやかに", "rit"], [3, "accel.", "アッチェレランド", "だんだん速く", ""],
    [3, "a tempo", "ア・テンポ/アテンポ", "もとの速さに戻って", "back"], [3, "Tempo I", "テンポ・プリモ/テンポプリモ", "はじめの速さに戻って", "back"],
    [4, "staccato", "スタッカート", "その音を短く切って", "", "stac"], [4, "tenuto", "テヌート", "その音の長さを十分に保って", "", "ten"], [4, "accent", "アクセント", "その音を目立たせて", "", "acc"],
    [4, "fermata", "フェルマータ", "その音や休符を、ほどよくのばす", "", "ferm"], [4, "legato", "レガート", "音と音をなめらかにつないで", "smooth"],
    [4, "slur", "スラー", "高さのちがう音を、切らずになめらかに", "smooth", "slur"], [4, "tie", "タイ", "同じ高さの音をつないで、1つの音にする", "", "tie"],
    [5, "D.C.", "ダ・カーポ/ダカーポ", "曲のはじめに戻る", ""], [5, "D.S.", "ダル・セーニョ/ダルセーニョ", "セーニョ記号のところに戻る", ""], [5, "Fine", "フィーネ", "終わり", ""],
    [5, "Coda", "コーダ", "曲の終わりにつける部分", ""], [5, "♯", "シャープ", "半音上げる", ""], [5, "♭", "フラット", "半音下げる", ""], [5, "♮", "ナチュラル", "もとの高さに戻す", ""],
    [5, "repeat", "リピート", "記号のあいだを、くり返す", "", "rep"],
  ];
  // 絵のある記号の名前（読み上げ用）
  const PNAME = { "<": "クレシェンドの松葉", ">": "デクレシェンドの松葉", staccato: "音符の下に点", tenuto: "音符の下に横線", accent: "音符の下に＞", fermata: "音符の上に半円と点", slur: "高さのちがう2つの音を結ぶ弧", tie: "同じ高さの2つの音を結ぶ弧", repeat: "2つの点と2本の縦線" };
  const NMX = { "<": "＜（松葉）", ">": "＞（松葉）", repeat: "リピート記号" };
  for (const [g, sym, y, mean, fam, pic] of SYMS) { const ys = y.split("/"); add({ g, sym, nm: NMX[sym] || sym, yomi: ys[0], yomis: ys, mean, fam, pic: pic || null }); }
  const BY = {}; for (const k of ITEMS) { k.ar = k.g; k.mi = AREAS[k.g]; if (!k.yomis) k.yomis = [k.yomi]; BY[k.no] = k; }
  const IDS = ITEMS.map((k) => k.no);

  // 記号の見た目（文字の記号は飾りの字、絵の記号は SVG）
  const symHtml = (k) => {
    if (k.g === 0) return k.rest ? svg("0 22 64 56", 52, staff5(64) + restBody(30, k.v), k.nm) : svg("0 0 60 100", 46, noteBody(22, 78, k.v), k.nm);
    if (k.pic) return PICS[k.pic].replace('aria-label=""', `aria-label="${PNAME[k.sym]}"`).replace(/aria-label="[^"]*"/, `aria-label="${PNAME[k.sym]}"`);
    const cls = k.g === 2 && !/\./.test(k.sym) ? "sym dyn" : k.g === 5 && k.sym.length === 1 ? "sym acc" : "sym";
    return `<span class="${cls}" aria-label="${k.sym}">${k.sym}</span>`;
  };
  const symLabel = (k) => (k.g === 0 ? k.nm + "の形" : PNAME[k.sym] || k.sym);

  // ---- 楽譜（ト音記号の5本線）：ド(下の加線)〜ラ(上の加線)の13の高さ ----
  const POS = []; for (let i = 0; i <= 12; i++) POS.push({ i, step: i % 7, hi: i >= 7 });
  const posName = (i) => `${i <= 6 ? "下の" : "上の"}${DO[i % 7]}`;
  function staffHtml(i, label) {
    const y = 80 - i * 5, up = i < 6;
    let s = staff5(120) + ``;
    if (i === 0) s += `<line x1="58" x2="82" y1="80" y2="80" stroke-width="1.4"/>`;
    if (i === 12) s += `<line x1="58" x2="82" y1="20" y2="20" stroke-width="1.4"/>`;
    s += noteBody(70, y, 1, up);
    return svg("0 -6 120 116", 110, s, label || "ト音記号の楽譜の音", "staff");
  }

  // ---- 種から決まる乱数（だれでも同じ問題）----
  function seedOf(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffled(arr, R) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---- 1小節をうめる問題：拍子とならんだ音符。あと1つ入るのは？ ----
  const BV = [4, 3, 2, 1.5, 1, 0.5];
  const BARS = [];
  {
    const seen = new Set();
    const seqs = (sum, n, rest) => { const out = []; const go = (pre, left) => { if (Math.abs(left) < 1e-9 && pre.length) { out.push(pre); return; } if (pre.length >= n) return; for (const v of BV) if (v <= left + 1e-9) for (const r of rest ? [false, true] : [false]) go([...pre, [v, r]], left - v); }; go([], sum); return out; };
    for (const ts of [2, 3, 4]) for (const ans of BV) {
      if (ans >= ts) continue;
      for (const q of seqs(ts - ans, 3, true)) {
        const key = ts + ":" + ans + ":" + q.map(([v, r]) => v + (r ? "r" : "")).join(",");
        if (seen.has(key)) continue; seen.add(key);
        const hard = q.length === 3 || q.some(([v, r]) => r || v === 1.5 || v === 3) || ans === 1.5 || ans === 3;
        BARS.push({ ts, ans, q, hard });
      }
    }
  }
  const pickBars = (hard, n) => shuffled(BARS.filter((b) => b.hard === hard), rng(seedOf("bars:" + hard))).slice(0, n);
  const BAR = [...pickBars(false, 40), ...pickBars(true, 40)];
  const noteItem = (v, rest) => ITEMS.find((k) => k.g === 0 && k.v === v && k.rest === !!rest);
  function barHtml(b) {
    const w = 46 + b.q.length * 36 + 40;
    let s = staff5(w) + `<text x="10" y="48" font-size="22" font-weight="900" stroke="none" font-family="serif">${b.ts}</text><text x="10" y="70" font-size="22" font-weight="900" stroke="none" font-family="serif">4</text>`;
    let x = 50;
    for (const [v, r] of b.q) { s += r ? restBody(x, v) : noteBody(x - 6, 65, v); x += 36; }
    s += `<text x="${x - 8}" y="58" font-size="26" font-weight="900" stroke="none">？</text><line x1="${w - 3}" x2="${w - 3}" y1="30" y2="70" stroke-width="2"/>`;
    const said = b.q.map(([v, r]) => noteItem(v, r).nm).join("・");
    return svg(`0 0 ${w} 100`, Math.min(300, w * 1.35), s, `4分の${b.ts}拍子の小節。${said}、そのあと「？」`, "bar");
  }

  // ---- 問題の形 ----
  // やさしい：n＝音符・休符の形 → 名前／b＝形 → 何拍／m＝ドレミ → ハニホ／s＝楽譜 → ドレミ／a＝記号 → 意味／r＝記号 → 読み
  // ふつう：N＝名前 → 形／B＝拍 → 形／h＝ハニホ → ドレミ／e＝ドレミ → 英語の音名／E＝英語 → ドレミ／S＝楽譜 → ハニホ／A＝意味 → 記号／R＝読み → 記号／x＝1小節をうめる（やさしめ）
  // むずかしい：t＝ドレミ → 楽譜／y＝記号 → 読みを入力／X＝1小節をうめる（休符・付点・3つ）
  const KIND = { n: 0, b: 0, m: 0, s: 0, a: 0, r: 0, N: 1, B: 1, h: 1, e: 1, E: 1, S: 1, A: 1, R: 1, x: 1, t: 2, y: 2, X: 2 };
  const QS = [], QBY = {}, POOL = [[], [], []];
  const addQ = (kd, key, no) => { const id = kd + key, q = { id, lv: KIND[kd], kd, no, key }; QS.push(q); QBY[id] = q; POOL[q.lv].push(id); };
  const G0 = ITEMS.filter((k) => k.g === 0), G1 = ITEMS.filter((k) => k.g === 1), GS = ITEMS.filter((k) => k.g >= 2);
  for (const kd of ["n", "b", "N", "B"]) for (const k of G0) addQ(kd, k.no, k.no);
  for (const kd of ["m", "h", "e", "E"]) for (const k of G1) addQ(kd, k.no, k.no);
  for (const kd of ["s", "S", "t"]) for (const p of POS) addQ(kd, p.i, G1[p.step].no);
  for (const kd of ["a", "r", "A", "R", "y"]) for (const k of GS) addQ(kd, k.no, k.no);
  BAR.forEach((b, i) => addQ(b.hard ? "X" : "x", i, noteItem(b.ans, false).no));

  // 選び肢のしるし：i＝記号の形、n＝名前、y＝読み、m＝意味、b＝拍、d/k/c＝ドレミ/ハニホ/CDE、p＝楽譜の位置
  function optHtml(o) {
    const t = o[0], v = o.slice(2);
    if (t === "i") return symHtml(BY[v]);
    if (t === "p") return staffHtml(+v, `楽譜の音（${posName(+v)}）`);
    return `<span class="tx">${esc(optLabel(o))}</span>`;
  }
  function optLabel(o) {
    const t = o[0], v = o.slice(2);
    if (t === "i") return symLabel(BY[v]);
    if (t === "n") return BY[v].nm; if (t === "y") return BY[v].yomi; if (t === "m") return BY[v].mean;
    if (t === "b") return BEAT[v]; if (t === "d") return DO[v]; if (t === "k") return HA[v]; if (t === "c") return EN[v];
    if (t === "p") return "楽譜の音・" + posName(+v);
    return o;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  // 同じ組の記号のうち、意味が近い仲間（fam）を外したもの
  const others = (k, R) => { const s = shuffled(GS.filter((x) => x !== k && !(k.fam && x.fam === k.fam)), R); return [...s.filter((x) => x.g === k.g), ...s.filter((x) => x.g !== k.g)]; };
  function optsOf(id) {
    const q = QBY[id]; if (q.kd === "y") return [];
    const R = rng(seedOf("opt:" + id)), k = BY[q.no];
    let ans, pick;
    if (q.kd === "n" || q.kd === "N" || q.kd === "B") {
      // 音符なら音符から、休符なら休符から先に（同じ形どうしでまよう）
      const pre = q.kd === "N" || q.kd === "B" ? "i:" : "n:";
      const same = shuffled(G0.filter((x) => x !== k && x.rest === k.rest && x.v !== k.v), R), diff = shuffled(G0.filter((x) => x.rest !== k.rest && x.v !== k.v), R);
      ans = pre + k.no; pick = [...same.slice(0, 2), ...(q.kd === "B" ? same.slice(2, 3) : diff.slice(0, 1))].map((x) => pre + x.no);
    } else if (q.kd === "b") { ans = "b:" + k.v; pick = shuffled(Object.keys(BEAT).filter((v) => +v !== k.v), R).slice(0, 3).map((v) => "b:" + v); }
    else if ("mheE".includes(q.kd)) {
      const a = { m: "k", h: "d", e: "c", E: "d" }[q.kd];
      ans = a + ":" + k.step; pick = shuffled([0, 1, 2, 3, 4, 5, 6].filter((x) => x !== k.step), R).slice(0, 3).map((x) => a + ":" + x);
    } else if (q.kd === "s" || q.kd === "S") {
      const a = q.kd === "s" ? "d" : "k", st = POS[q.key].step;
      // 近い高さ（となり・2つとなり）を先に
      const near = shuffled([1, -1, 2, -2].map((d) => (st + d + 7) % 7), R), rest = shuffled([0, 1, 2, 3, 4, 5, 6].filter((x) => x !== st && !near.includes(x)), R);
      ans = a + ":" + st; pick = [...new Set([...near, ...rest])].slice(0, 3).map((x) => a + ":" + x);
    } else if (q.kd === "t") {
      // 同じ音名（下のドと上のド）は選び肢に入れない
      const i = q.key, st = POS[i].step, cand = shuffled(POS.filter((p) => p.step !== st && Math.abs(p.i - i) <= 4), R);
      ans = "p:" + i; pick = cand.slice(0, 3).map((p) => "p:" + p.i);
    } else if (q.kd === "a") { ans = "m:" + k.no; const seenM = new Set([k.mean]); pick = others(k, R).filter((x) => !seenM.has(x.mean) && seenM.add(x.mean)).slice(0, 3).map((x) => "m:" + x.no); }
    else if (q.kd === "r") { ans = "y:" + k.no; const seenY = new Set(k.yomis); pick = others(k, R).filter((x) => !x.yomis.some((y) => seenY.has(y)) && x.yomis.every((y) => seenY.add(y))).slice(0, 3).map((x) => "y:" + x.no); }
    else if (q.kd === "A" || q.kd === "R") { ans = "i:" + k.no; pick = others(k, R).filter((x) => q.kd === "A" ? x.mean !== k.mean : !x.yomis.some((y) => k.yomis.includes(y))).slice(0, 3).map((x) => "i:" + x.no); }
    else {
      // 1小節：答えの長さの音符と、ちがう長さの音符3つ
      const b = BAR[q.key];
      ans = "i:" + noteItem(b.ans, false).no; pick = shuffled(BV.filter((v) => v !== b.ans), R).slice(0, 3).map((v) => "i:" + noteItem(v, false).no);
    }
    return shuffled([ans, ...pick], R);
  }
  function ansKey(q) {
    const k = BY[q.no];
    if (q.kd === "n") return "n:" + k.no; if (q.kd === "N" || q.kd === "B" || q.kd === "A" || q.kd === "R" || q.kd === "x" || q.kd === "X") return "i:" + k.no;
    if (q.kd === "b") return "b:" + k.v;
    if ("mheE".includes(q.kd)) return { m: "k", h: "d", e: "c", E: "d" }[q.kd] + ":" + k.step;
    if (q.kd === "s") return "d:" + POS[q.key].step; if (q.kd === "S") return "k:" + POS[q.key].step; if (q.kd === "t") return "p:" + q.key;
    if (q.kd === "a") return "m:" + k.no; if (q.kd === "r") return "y:" + k.no;
    return "";
  }
  // 問いの文（大きな絵や字と、その下の小さな字）。h は画面に出す HTML、l は読み上げの文
  function ask(q) {
    const k = BY[q.no], st = k.step;
    const tx = (s) => `<span class="tx">${esc(s)}</span>`;
    switch (q.kd) {
      case "n": return { h: symHtml(k), l: symLabel(k), sub: "この記号の名前は？" };
      case "b": return { h: symHtml(k), l: symLabel(k), sub: `4分音符を1拍とすると、何拍${k.rest ? "休む" : "のばす"}？` };
      case "N": return { h: tx(k.nm), l: k.nm, sub: "の形は？" };
      case "B": return { h: tx(BEAT[k.v] + (k.rest ? "休む" : "のばす")), l: BEAT[k.v] + (k.rest ? "休む" : "のばす"), sub: `${k.rest ? "休符" : "音符"}は？（4分音符を1拍として）` };
      case "m": return { h: tx(DO[st]), l: DO[st], sub: "は、日本の音名（ハニホ）で？" };
      case "h": return { h: tx(HA[st]), l: "日本の音名 " + HA[st], sub: "は、ドレミで？" };
      case "e": return { h: tx(DO[st]), l: DO[st], sub: "は、英語の音名で？" };
      case "E": return { h: tx(EN[st]), l: "英語の音名 " + EN[st], sub: "は、ドレミで？" };
      case "s": return { h: staffHtml(q.key), l: "ト音記号の楽譜の音", sub: "ト音記号の楽譜。この音は、ドレミで？" };
      case "S": return { h: staffHtml(q.key), l: "ト音記号の楽譜の音", sub: "ト音記号の楽譜。この音は、ハニホで？" };
      case "t": return { h: tx(posName(q.key)), l: posName(q.key), sub: "ト音記号の楽譜で、この音は？" };
      case "a": return { h: symHtml(k), l: symLabel(k), sub: "この記号の意味は？" };
      case "r": return { h: symHtml(k), l: symLabel(k), sub: "この記号の読みは？" };
      case "A": return { h: tx(k.mean), l: k.mean, sub: "という意味の記号は？" };
      case "R": return { h: tx(k.yomi), l: k.yomi, sub: "と読む記号は？" };
      case "y": return { h: symHtml(k), l: symLabel(k), sub: "この記号の読みは？（カタカナかひらがなで入力）" };
      default: { const b = BAR[q.key]; return { h: barHtml(b), l: `4分の${b.ts}拍子の小節`, sub: `あと1つで4分の${b.ts}拍子の1小節。入る音符は？` }; }
    }
  }
  // 1問：tag は「難しさ:問題の id|モードと日付…」
  function make(tag) {
    const m = String(tag).match(/^([012]):([a-zA-Z]\d+)\|/); if (!m || !QBY[m[2]] || QBY[m[2]].lv !== +m[1]) throw new Error("知らない問題 " + tag);
    const q = QBY[m[2]], k = BY[q.no], opts = optsOf(q.id), A = ask(q);
    return { tag, lv: q.lv, id: q.id, kd: q.kd, key: q.key, input: q.kd === "y", p: k, opts, ans: q.kd === "y" ? -1 : opts.indexOf(ansKey(q)), bigHtml: A.h, bigLabel: A.l, sub: A.sub };
  }
  // 入力の答え：全角・半角・ひらがな・中黒・空白をそろえて読みと比べる
  const norm = (s) => String(s || "").normalize("NFKC").replace(/[\s　・･.]/g, "").replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60)).replace(/ヴ/g, "ヴ");
  const okInput = (P, s) => P.p.yomis.some((y) => norm(y) === norm(s));
  // 入力のヒント（2回まで）：1回目は字数とはじめの字、2回目は半分の字
  function inputHint(P, n) {
    const y = [...P.p.yomi.replace(/・/g, "")];
    if (n <= 1) return y.map((c, i) => (i === 0 ? c : "○")).join("");
    return y.map((c, i) => (i % 2 === 0 ? c : "○")).join("");
  }
  // 答えのあとに出す説明
  function facts(P) {
    const k = P.p, out = [];
    if (P.kd === "x" || P.kd === "X") {
      const b = BAR[P.key], had = b.q.reduce((a, [v]) => a + v, 0);
      out.push(`4分の${b.ts}拍子は、1小節に4分音符${b.ts}つ分（${b.ts}拍）。`);
      out.push(`ならんでいたのは ${b.q.map(([v, r]) => `${noteItem(v, r).nm}（${BEAT[v]}）`).join("＋")}＝${beatStr(had)}。`);
      out.push(`あと${BEAT[b.ans]}なので、${k.nm}。`);
      return out;
    }
    if (k.g === 0) {
      out.push(`${k.nm}は、4分音符を1拍とすると${k.mean}。`);
      if ([3, 1.5, 0.75].includes(k.v)) out.push(`付点は、もとの長さの半分を足す（${BEAT[k.v / 1.5]}＋${BEAT[k.v / 3]}）。`);
      else if (k.v > 0.25) out.push(`${k.v === 4 ? "2分" : k.v === 2 ? "4分" : k.v === 1 ? "8分" : "16分"}${k.rest ? "休符" : "音符"}2つ分の長さ。`);
      return out;
    }
    if (k.g === 1) {
      const st = k.step;
      out.push(`ドレミの「${DO[st]}」＝日本の音名「${HA[st]}」＝英語の音名「${EN[st]}」。`);
      if (P.kd === "s" || P.kd === "S" || P.kd === "t") out.push(POS[P.key].i === 0 ? "5本線の下に、短い線（加線）を1本足した所。" : POS[P.key].i === 12 ? "5本線の上に、短い線（加線）を1本足した所。" : `下から${POS[P.key].i % 2 === 0 ? `${POS[P.key].i / 2}本目の線の上` : `${(POS[P.key].i - 1) / 2}本目と${(POS[P.key].i + 1) / 2}本目の線のあいだ`}。`.replace("下から0本目と1本目の線のあいだ", "いちばん下の線のすぐ下").replace("下から5本目と6本目の線のあいだ", "いちばん上の線のすぐ上"));
      return out;
    }
    out.push(`「${k.nm}」は「${k.yomi}」：${k.mean}。`);
    const fam = k.fam ? GS.filter((x) => x !== k && x.fam === k.fam) : [];
    if (fam.length) out.push(`${fam.map((x) => (x.sym === "<" || x.sym === ">" ? "松葉の形" : x.sym)).join("・")}も、近い意味。`);
    if (k.yomis.length > 1) out.push(`「${k.yomis.slice(1).join("」「")}」とも書く。`);
    return out;
  }

  // 答えの見出し：名前と、その下の小さな字
  const titleOf = (P) => { const k = P.p; if (k.g === 0) return { nm: k.nm, sm: k.mean }; if (k.g === 1) return { nm: `${DO[k.step]}＝${HA[k.step]}＝${EN[k.step]}`, sm: "ドレミ＝日本の音名＝英語の音名" }; return { nm: `${k.nm}（${k.yomi}）`, sm: k.mean }; };
  // まちがえた選び肢の説明（その選び肢が何だったか）
  function wrongNote(o) {
    const t = o[0], v = o.slice(2);
    if ("inym".includes(t) && BY[v]) { const k = BY[v]; return k.g === 0 ? `${k.nm}は${k.mean}。` : k.g === 1 ? "" : `${k.nm}は「${k.yomi}」：${k.mean}。`; }
    if (t === "p") return `それは${posName(+v)}。`;
    return "";
  }

  // ---- 今日の5問・上級（日本時間の日付から。だれでも同じ）----
  const DAY = 864e5, EPOCH = "2026-11-07";
  const dayMs = (k) => Date.parse(k + "T00:00:00Z");
  const keyOf = (ms) => new Date(ms).toISOString().slice(0, 10);
  const dayIdx = (k) => Math.max(0, Math.round((dayMs(k) - dayMs(EPOCH)) / DAY));
  const CYC = {};
  function cycle(name, lv, c) {
    const key = name + lv + ":" + c; if (CYC[key]) return CYC[key];
    let a = shuffled(POOL[lv], rng(seedOf(name + ":" + lv + ":" + c)));
    // 前の周の後ろ半分は、次の周の後ろ半分へ回す（周のつなぎ目で同じ問題がすぐ戻らない）
    if (c > 0) { const prev = cycle(name, lv, c - 1), tail = new Set(prev.slice(-Math.floor(prev.length / 2))); a = [...a.filter((id) => !tail.has(id)), ...a.filter((id) => tail.has(id))]; }
    return (CYC[key] = a);
  }
  const nth = (name, lv, idx) => cycle(name, lv, Math.floor(idx / POOL[lv].length))[idx % POOL[lv].length];
  const LVS = [0, 0, 1, 1, 2];
  // その日のほかの問題と、記号（1小節の問題は小節）が重ならない問題を選ぶ（重なる問題は次の日へ回す）。並びの問題は一度ずつ使う
  const evOf = (id) => [/^[xX]/.test(id) ? "bar" + QBY[id].key : QBY[id].no]; // 1小節の問題は答えの音符が同じでも別の問題として数える
  const SIM = {};
  function simDay(name, lvs, i, avoidOf) {
    const S = SIM[name] || (SIM[name] = { days: [], ptr: [0, 0, 0], wait: [[], [], []] });
    while (S.days.length <= i) {
      const d = S.days.length, used = new Set(avoidOf ? avoidOf(d).flatMap(evOf) : []), out = [];
      const free = (id) => evOf(id).every((e) => !used.has(e));
      for (const lv of lvs) {
        const w = S.wait[lv], wi = w.findIndex(free);
        let id = wi >= 0 ? w.splice(wi, 1)[0] : null;
        for (let g = 0; id == null; g++) { if (g > 4 * POOL[lv].length) throw new Error("問題を選べない"); const x = nth(name, lv, S.ptr[lv]++); if (free(x)) id = x; else w.push(x); }
        for (const e of evOf(id)) used.add(e); out.push([lv, id]);
      }
      S.days.push(out);
    }
    return S.days[i];
  }
  const dayPick = (i) => simDay("day", LVS, i);
  const hardPick = (i) => simDay("hard", [2, 2, 2], i, (d) => dayPick(d).map((o) => o[1]));
  const dailyTags = (k) => dayPick(dayIdx(k)).map(([lv, id]) => `${lv}:${id}|d${k}`);
  const hardTags = (k) => hardPick(dayIdx(k)).map(([lv, id]) => `${lv}:${id}|h${k}`);

  const API = { titleOf, wrongNote, posName, LV, AREAS, ITEMS, BY, IDS, QS, QBY, POOL, KIND, BAR, BARS, BEAT, DO, HA, EN, POS, optsOf, optHtml, optLabel, ansKey, symHtml, symLabel, ask, make, norm, okInput, inputHint, facts, seedOf, rng, shuffled, dailyTags, hardTags, dayIdx, EPOCH, dayMs, keyOf, evOf };
  if (typeof module === "object" && module.exports) module.exports = API;
  root.ONPU = API;
})(typeof window !== "undefined" ? window : globalThis);
