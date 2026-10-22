/* ============================================================
   EDIT DI SINI: data credit video (sekarang masih dummy)
   ============================================================ */
const CREDIT = {
  "Brand": "Nama Brand (dummy)",
  "Agensi": "Nama Agensi (dummy)",
  "Director": "Nama Director (dummy)",
  "Produksi": "Nama Production House (dummy)",
  "Tahun": "2026"
};
/* ============================================================ */

const $ = (id) => document.getElementById(id);
const form = $("form"), input = $("url"), errorBox = $("error");
const result = $("result"), card = $("card"), skeleton = $("skeleton");

// Ambil ID video dari berbagai format link YouTube
function getVideoId(raw) {
  let url;
  try { url = new URL(raw.trim().match(/^https?:\/\//i) ? raw.trim() : "https://" + raw.trim()); }
  catch { return null; }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const isId = (s) => /^[\w-]{11}$/.test(s || "");

  if (host === "youtu.be") {
    const id = url.pathname.split("/")[1];
    return isId(id) ? { id, short: false } : null;
  }
  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") { const id = url.searchParams.get("v"); return isId(id) ? { id, short: false } : null; }
    if (["shorts", "embed", "live", "v"].includes(parts[0])) {
      return isId(parts[1]) ? { id: parts[1], short: parts[0] === "shorts" } : null;
    }
  }
  return null;
}


// Ambil judul & nama channel (oEmbed, tanpa API key). Kalau gagal, preview tetap tampil.
async function fetchInfo(id) {
  const target = encodeURIComponent(`https://www.youtube.com/watch?v=${id}`);
  for (const api of [
    `https://www.youtube.com/oembed?url=${target}&format=json`,
    `https://noembed.com/embed?url=${target}`
  ]) {
    try {
      const res = await fetch(api);
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.title) return data;
    } catch { /* coba sumber berikutnya */ }
  }
  return null;
}

function renderCredit() {
  const dl = $("credit");
  dl.innerHTML = "";
  for (const [label, value] of Object.entries(CREDIT)) {
    const wrap = document.createElement("div");
    const dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = label; dd.textContent = value;
    wrap.append(dt, dd);
    dl.append(wrap);
  }
}

function renderThumb(id) {
  const img = $("thumb");
  img.onerror = () => { img.onerror = null; img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; };
  img.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  // maxresdefault yang tidak ada mengembalikan gambar kecil 120px, bukan error
  img.onload = () => { if (img.naturalWidth <= 120) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; };
}

let token = 0;
async function preview(raw) {
  errorBox.hidden = true;
  const parsed = getVideoId(raw);
  if (!parsed) {
    showError("Link tidak dikenali. Gunakan link video YouTube, misalnya youtube.com/watch?v=… atau youtu.be/…");
    return;
  }
  const { id, short } = parsed;
  const mine = ++token;

  result.hidden = false;
  card.hidden = true;
  skeleton.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "start" });

  const info = await fetchInfo(id);
  if (mine !== token) return; // ada permintaan yang lebih baru

  $("player").innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Player video YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`;
  renderThumb(id);
  $("title").textContent = info ? info.title : "Judul tidak bisa diambil";
  const ch = $("channel");
  ch.textContent = info && info.author_name ? info.author_name : "";
  ch.href = info && info.author_url ? info.author_url : "#";
  $("open").href = `https://www.youtube.com/watch?v=${id}`;
  card.classList.toggle("vertical", short);
  renderCredit();

  skeleton.hidden = true;
  card.hidden = false;
  // jalankan ulang animasi masuk saat kartu diganti
  card.style.animation = "none"; void card.offsetWidth; card.style.animation = "";
}
const VIDEO_URL = "https://www.youtube.com/watch?v=VXtjG_GzO7Q"
preview(VIDEO_URL)