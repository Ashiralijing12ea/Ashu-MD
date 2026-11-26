const { cmd, commands } = require("../arslan");
const config = require("../config");
const path = require("path");
const fs = require("fs");
const { runtime } = require("../lib/functions");
const shortUptime = (sec) => {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), x = sec % 60;
    return (d ? d + "d " : "") + h + "h " + m + "m " + x + "s";
};
const { getBotPic } = require("../lib/botpic");

const UPDATE_CHANNEL_JID = null;   // channel JID config.CHANNEL_LINK se khud nikalta hai (fallback nahi)
// Channel JID is taken from config.CHANNEL_LINK automatically (cached after the first lookup).
// The hard-coded JID is only a fallback if WhatsApp does not answer in time.
const FALLBACK_JID = UPDATE_CHANNEL_JID;
let resolvedChannel = null;
let channelFailedAt = 0;
async function getChannelInfo(conn, botName) {
    if (resolvedChannel) return resolvedChannel;
    if (channelFailedAt && Date.now() - channelFailedAt < 10 * 60 * 1000) return { jid: FALLBACK_JID, name: botName };
    try {
        const link = config.CHANNEL_LINK || config.FORCE_CHANNEL_1;
        const code = new URL(String(link)).pathname.split("/").filter(Boolean)[1];
        if (code && typeof conn.newsletterMetadata === "function") {
            const meta = await Promise.race([
                conn.newsletterMetadata("invite", code),
                new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000))
            ]);
            const jid = meta && (meta.id || meta.jid);
            if (jid && String(jid).endsWith("@newsletter")) {
                resolvedChannel = { jid, name: (meta.name || botName) };
                return resolvedChannel;
            }
        }
    } catch (_) { /* use fallback */ }
    channelFailedAt = Date.now();
    return { jid: FALLBACK_JID, name: botName };
}

const audioDir = path.join(__dirname, "../data/menu-voice");

// Menu image: .menu par ye photo jayegi (video hata di gayi hai). Badalni ho to sirf ye link badlein.
// Link na khule to bot ki apni photo (getBotPic) chali jayegi.
const MENU_IMAGE_URL = process.env.MENU_IMAGE || path.join(__dirname, "../data/assets/banner.jpg");

let VERSION = "1.0.0";
try { VERSION = require("../package.json").version || VERSION; } catch (_) {}

// Menu ke saath SIRF ek gana: data/menu-voice/menu.mp3 (random nahi). Gana badalna ho to is file ko replace karo.
const MENU_SONG = "menu.mp3";
const getRandomAudio = () => {
    try {
        const f = path.join(audioDir, MENU_SONG);
        return fs.existsSync(f) ? f : null;
    } catch (_) { return null; }
};

// Menu ke saath gana (data/menu-voice/*.mp3) — voice note ki tarah, background mein
const sendMenuVoice = (conn, from, mek) => {
    try {
        const audioPath = getRandomAudio();
        if (!audioPath) return;
        conn.sendMessage(from, { audio: { url: audioPath }, mimetype: "audio/mpeg", ptt: false }, { quoted: mek })
            .catch(err => console.log("Menu audio error:", err.message));
    } catch (_) {}
};

const toSmallCaps = (text) => {
    if (!text || typeof text !== "string") return "";
    const map = {
        a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ғ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ",
        n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
    };
    return text.split("").map(ch => map[ch.toLowerCase()] || ch).join("");
};

const toBold = (text) => String(text || "").replace(/[A-Za-z]/g, ch => {
    const c = ch.charCodeAt(0);
    return String.fromCodePoint(c <= 90 ? 0x1D400 + (c - 65) : 0x1D41A + (c - 97));
});

// "<name>" jaise arguments .use se nikalta hai (sirf jab command ke .use mein likhe hon)
const argHint = (c) => {
    const use = String(c.use || "");
    if (!use) return "";
    const tags = use.match(/<[^<>]{1,24}>/g);
    if (!tags) return "";
    // chhote hints (<jid>, <link>, <name>) taake WhatsApp pe line wrap na ho
    const short = (t) => {
        const w = t.slice(1, -1).toLowerCase();
        if (/jid1/.test(w)) return "<jids>";
        if (/jid/.test(w)) return "<jid>";
        if (/link|url/.test(w)) return "<link>";
        if (/server/.test(w)) return "<id>";
        if (/\|/.test(w)) return "<option>";
        if (/number/.test(w)) return "<num>";
        if (/name/.test(w)) return "<name>";
        if (/message|details|text|lines|description/.test(w)) return "<text>";
        if (/category/.test(w)) return "<cat>";
        return w.length > 8 ? "<" + w.slice(0, 8) + ">" : t;
    };
    return " " + tags.slice(0, 1).map(t => toSmallCaps(short(t))).join(" ");
};

const getCategoryEmoji = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes("video")) return "🎬";
    if (cat.includes("prank")) return "😈";
    if (cat.includes("audio") || cat.includes("voice") || cat.includes("sound") || cat.includes("music")) return "🎵";
    if (cat.includes("download") || cat.includes("dl")) return "📥";
    if (cat.includes("group") || cat.includes("gc")) return "👥";
    if (cat.includes("owner") || cat.includes("admin")) return "👑";
    if (cat.includes("anime")) return "✨";
    if (cat.includes("islam")) return "🕌";
    if (cat.includes("logo") || cat.includes("img") || cat.includes("image") || cat.includes("sticker")) return "🖼️";
    if (cat.includes("converter") || cat.includes("tools")) return "🛠️";
    if (cat.includes("fun") || cat.includes("game") || cat.includes("love") || cat.includes("emotion")) return "🎮";
    if (cat.includes("search") || cat.includes("find")) return "🔍";
    return "⚡";
};

// ═══════════════════════════════════════════════════════════
//  🎨 MENU DESIGN — yahan se apna design khud badlein
//  Placeholders:
//    HEADER: {BOT} {OWNER} {PREFIX} {UPTIME} {COUNT} {MODE} {VERSION}
//    CATEGORY_TOP: {EMOJI} {CAT} {COUNT}
//    COMMAND: {PREFIX} {CMD}
// ═══════════════════════════════════════════════════════════
const DESIGN = {
    // {BOT} {OWNER} {PLATFORM} {PREFIX} {VERSION} {UPTIME} {COUNT} {MODE}
    HEADER: [
        "╔═══◥◣◆◢◤═══╗",
        "  ༺ 👑 {BOT} 👑 ༻",
        "╚═══◢◤◆◥◣═══╝",
        "┃ *𝐎𝚆𝙽𝙴𝚁:* {OWNER}",
        "┃ *𝐏𝚁𝙴𝙵𝙸𝚇:* {PREFIX}",
        "┃ *𝐔𝙿𝚃𝙸𝙼𝙴:* {UPTIME}",
        "┃ *𝐂𝙾𝙼𝙼𝙰𝙽𝙳𝚂:* {COUNT}",
        "┃ *𝐌𝙾𝙳𝙴:* {MODE}",
        "┃ *𝐕𝙴𝚁𝚂𝙸𝙾𝙽:* {VERSION}",
        "╰━━━━━━⟡ ✦ ⟡━━━━━━╯"
    ].join("\n"),

    ALL_TITLE: "> {TITLE}",                       // sari commands se pehle wali line
    ALL_TITLE_TEXT: "ALL COMMANDS BY ASHU MD",

    // har category ka dabba (naya design: ┏━═❲ TITLE / ┋╭┈⌖ cmd / ┋├┈⌖ cmd / ┋╰┈⌖ cmd / ┗───𒁍)
    CATEGORY_TOP:    "",                          // khali = is line ko skip karo
    CATEGORY_TITLE:  "┏━═❲ ✦ {CAT} ✦ ❳═━┓",
    COMMAND_FIRST:   "┋❖ {PREFIX}{CMD}",
    COMMAND:         "┋❖ {PREFIX}{CMD}",
    COMMAND_LAST:    "┋❖ {PREFIX}{CMD}",
    CATEGORY_BOTTOM: "┗━━━━━━━━⟡ ✦ ⟡━━━━━━━━┛",

    // ".menu list" likhne par sirf categories ki list is design mein aati hai
    LIST_TOP:    "╭╍╍╍╍╍╍╍╍╍╍┈⊷",
    LIST_TITLE:  "┣═❲ 𝗖𝗔𝗧𝗘𝗚𝗢𝗥𝗜𝗘𝗦",
    LIST_ITEM:   "┃{CAT}",
    LIST_BOTTOM: "╰╍╍╍╍╍╍╍╍╍╍┈⊷",
    LIST_PER_ROW: 2,


    FOOTER: "©𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 ᯽𝐀𝐒𝐇𝐔-𝐌𝐃᯽",   // null = config.BOT_FOOTER ya "© Powered by BOT"
    SORT_COMMANDS: true,     // true = A-Z, false = jaise plugins mein likhe hain
    SHOW_HIDDEN: false,      // true = dontAddCommandList wale commands bhi dikhao
    VIDEO_AS_GIF: false,      // true = video GIF ki tarah autoplay/loop; false = normal video
    MAX_CHARS: 3500          // ek message ki limit; zyada ho to menu khud agle message mein chala jata hai
};
// ═══════════════════════════════════════════════════════════

// Saari commands ek hi message mein (WhatsApp text limit ~65000 chars; 836 commands ~15000 chars)
const ONE_MESSAGE_MAX = 60000;

const fill = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));

// Command ka pehla harf monospace capital (𝙱), baqi small-caps (ʟᴜʀ)  ->  𝙱ʟᴜʀ
const toMonoCap = (ch) => /[a-z]/i.test(ch) ? String.fromCodePoint(0x1D670 + ch.toUpperCase().charCodeAt(0) - 65) : ch;
const styleName = (name) => { const t = String(name || ""); return t ? toMonoCap(t[0]) + toSmallCaps(t.slice(1)) : ""; };

const formatCategory = (category, items, prefix) => {
    if (!items.length) return "";
    const title = fill(DESIGN.CATEGORY_TITLE, { EMOJI: getCategoryEmoji(category), CAT: toBold(category.toUpperCase()), COUNT: items.length });
    const last = items.length - 1;
    const body = items.map((it, i) => fill(i === 0 ? DESIGN.COMMAND_FIRST : (i === last ? DESIGN.COMMAND_LAST : DESIGN.COMMAND),
        { PREFIX: prefix, CMD: styleName(it.name) + (it.hint || "") })).join("\n");
    const vipLine = `┋💎 ${prefix}${toSmallCaps("vipmd")} ⟫ ${toSmallCaps("vip link")} ✨`;   // har command-list ke upar .vipmd
    return [DESIGN.CATEGORY_TOP, title, vipLine, body, DESIGN.CATEGORY_BOTTOM].filter(Boolean).join("\n");
};

// bahut lambi category (jaise tools) ko kai POORE dabbon mein todta hai taake box kabhi adhura na kate
const formatCategoryParts = (category, items, prefix, max) => {
    const parts = [];
    let cur = [];
    const sizeOf = (arr, n) => formatCategory(n > 1 ? `${category} ${n}` : category, arr, prefix).length;
    for (const it of items) {
        if (cur.length && sizeOf([...cur, it], parts.length + 1) > max - 400) { parts.push(cur); cur = []; }
        cur.push(it);
    }
    if (cur.length) parts.push(cur);
    return parts.map((arr, i) => formatCategory(i ? `${category} ${i + 1}` : category, arr, prefix));
};

// text ko MAX_CHARS ke hisaab se tukron mein todta hai (category ke beech se tabhi jab category khud bahut lambi ho)
const splitBlocks = (blocks, max) => {
    const out = [];
    let cur = "";
    const push = () => { if (cur.trim()) out.push(cur.trim()); cur = ""; };
    for (const b of blocks) {
        if (b.length > max) {
            push();
            let part = "";
            for (const line of b.split("\n")) {
                if ((part + "\n" + line).length > max) { out.push(part.trim()); part = ""; }
                part += (part ? "\n" : "") + line;
            }
            if (part.trim()) out.push(part.trim());
            continue;
        }
        if ((cur + "\n\n" + b).length > max) push();
        cur += (cur ? "\n\n" : "") + b;
    }
    push();
    return out;
};

const LIST_ORDER = ["video", "prank", "voice", "name", "tools", "owner", "anime", "group", "main", "fun", "emotions",
    "image", "download", "love", "system", "utility", "games", "settings", "general", "islamic", "textfx", "calc", "funzone"];

const ORDER = ["ashu", "utility", "group", "download", "music", "general",
    "extra", "tools", "sticker", "fun", "islamic", "search"];

cmd({
    pattern: "menu",
    alias: ["m", "help", "allmenu", "fullmenu", "commandlist"],
    use: ".menu  |  .menu <category>",
    desc: "Show bot categories, or one category's commands",
    category: "system",
    react: "⚡",
    filename: __filename,
}, async (conn, mek, m, ctx) => {
    const from = ctx.from || m.chat;
    try {
        try { Promise.resolve(conn.sendPresenceUpdate("composing", from)).catch(() => {}); } catch (_) {}

        // saari commands category ke hisaab se (duplicate nahi; bina category wali "misc" mein)
        const grouped = {};
        let totalCommands = 0;
        const seen = new Set();
        for (const c of commands) {
            if (!c.pattern) continue;
            if (c.dontAddCommandList && !DESIGN.SHOW_HIDDEN) continue;
            let cat = String(c.category || "misc").toLowerCase();
            if (cat === "downloader") cat = "download";
            const key = `${cat}:${c.pattern}`;
            if (seen.has(key)) continue;
            seen.add(key);
            totalCommands++;
            (grouped[cat] = grouped[cat] || []).push({ name: c.pattern, hint: argHint(c) });
        }

        const PREFIX = config.PREFIX || ".";
        const BOT_NAME = String(config.BOT_NAME || "᯽𝐀𝐒𝐇𝐔-𝐌𝐃᯽").replace(/(\s*[-_ ]\s*bot)+\s*$/i, "").trim() || "᯽𝐀𝐒𝐇𝐔-𝐌𝐃᯽";
        const OWNER_NAME = config.OWNER_NAME || "Owner";
        const MODE = config.WORK_TYPE || "public";
        const FOOTER = DESIGN.FOOTER || config.BOT_FOOTER || `> ©𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 ${BOT_NAME}`;

        const cats = [...LIST_ORDER.filter(c => grouped[c]), ...Object.keys(grouped).filter(c => !LIST_ORDER.includes(c)).sort()];

        // 🆕 Ab har .menu (.menu list / .menu <category> / .menu all sab) = ek hi list mein saari commands
        let cm = null;
        try { cm = require("./carousel-menu"); } catch (_) { cm = null; }
        const channel = await getChannelInfo(conn, BOT_NAME);
        const newsletterContext = {
            mentionedJid: [m.sender].filter(Boolean),
            ...(channel.jid ? {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: channel.jid,
                    newsletterName: channel.name,
                    serverMessageId: 143
                }
            } : {})
        };

        // header: profile card (photo ke saath), phir SARI commands ek hi list mein
        let header = "";
        try { header = cm.profileText(await cm.getProfile(conn, mek, ctx)); } catch (_) {
            header = fill(DESIGN.HEADER, {
                BOT: BOT_NAME, OWNER: OWNER_NAME, PLATFORM: "WHATSAPP", PREFIX, UPTIME: shortUptime(process.uptime()),
                COUNT: totalCommands, MODE, VERSION
            });
        }

        // 1) menu photo + header
        try {
            await conn.sendMessage(from, { image: { url: MENU_IMAGE_URL }, caption: header, contextInfo: newsletterContext, __noFooter: true }, { quoted: mek });
        } catch (e) {
            console.log("Menu image error:", e.message);
            try {
                await conn.sendMessage(from, { image: getBotPic(conn), caption: header, contextInfo: newsletterContext, __noFooter: true }, { quoted: mek });
            } catch (e2) {
                await conn.sendMessage(from, { text: header, contextInfo: newsletterContext, __noFooter: true }, { quoted: mek });
            }
        }

        // 2) ek hi list: saari commands A-Z (zyada hon to agle message mein chali jati hain)
        const parts = cm ? cm.fullListMessages(ONE_MESSAGE_MAX, BOT_NAME) : [];
        for (let i = 0; i < parts.length; i++) {
            const last = i === parts.length - 1;
            await conn.sendMessage(from, { text: parts[i], contextInfo: last ? newsletterContext : undefined });
            if (!last) await new Promise(r => setTimeout(r, 500));
        }

        // menu voice (data/menu-voice/menu.mp3)
        sendMenuVoice(conn, from, mek);
    } catch (e) {
        console.error("AllMenu Error:", e);
        try { await ctx.reply("❌ Menu error: " + e.message); } catch (_) {}
    }
});
