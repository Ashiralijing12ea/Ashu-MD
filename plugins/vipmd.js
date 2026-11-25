// plugins/vipmd.js — .vipmd : ASHU-MD VIP website ka link bhejta hai
// Link badalna ho to config.js mein VIPMD_LINK badlo (ya env VIPMD_LINK set karo).
const { cmd } = require('../arslan');
const config = require('../config');
const { getBotPic } = require('../lib/botpic');

const link = () => String(process.env.VIPMD_LINK || config.VIPMD_LINK || 'https://ahmadshahzadmd.vercel.app/').trim();

cmd({
    pattern: 'vipmd',
    alias: ['vipweb', 'vipsite'],
    desc: 'ASHU-MD VIP link',
    category: 'main',
    react: '💎',
    use: '.vipmd',
    dontAddCommandList: true,   // menu mein har list ke upar alag se dikhta hai
    filename: __filename
}, async (conn, mek, m, ctx) => {
    const from = ctx.from || m.chat;
    const bot = String(config.BOT_NAME || '᯽𝐀𝐒𝐇𝐔-𝐌𝐃᯽');
    const text =
        `╔═══════◥◣◆◢◤═══════╗\n` +
        `   ༺ 💎 𝐕𝐈𝐏 𝐋𝐈𝐍𝐊 💎 ༻\n` +
        `╚═══════◢◤◆◥◣═══════╝\n` +
        `┃\n` +
        `┃ 🌐 ${link()}\n` +
        `┃\n` +
        `┃ 💎 ${bot}\n` +
        `┃ 👑 ${config.OWNER_NAME || ''}\n` +
        `┃ 📞 wa.me/${config.OWNER_NUMBER}\n` +
        `╰━━━━━━━⟡ ✦ ⟡━━━━━━━╯\n\n` +
        `${config.BOT_FOOTER || '©𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 ' + bot}`;
    try {
        await conn.sendMessage(from, { image: getBotPic(conn), caption: text }, { quoted: mek });
    } catch (_) {
        await conn.sendMessage(from, { text }, { quoted: mek });
    }
});
