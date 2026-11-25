const { cmd, commands } = require('../arslan');
const config = require('../config');
const { getOwnerPic } = require('../lib/botpic');

cmd({
    pattern: "alive",
    alias: ["status", "live"],
    desc: "Check uptime and system status",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const totalCmds = commands.length;
        const uptime = () => {
            let sec = process.uptime();
            let h = Math.floor(sec / 3600);
            let m = Math.floor((sec % 3600) / 60);
            let s = Math.floor(sec % 60);
            return `${h}h ${m}m ${s}s`;
        };

        const status = `
╔═══════◥◣◆◢◤═══════╗
   ༺ 💎 *${config.BOT_NAME || '᯽𝐀𝐒𝐇𝐔-𝐌𝐃᯽'}* 💎 ༻
╚═══════◢◤◆◥◣═══════╝
┃ ✅ *ɪs ᴏɴʟɪɴᴇ* 🤗♥️
┣━━━━ ⟡ *𝐈𝐍𝐅𝐎* ⟡ ━━━━
┃ 🔐 ᴍᴏᴅᴇ ⟫ ${(config.WORK_TYPE || 'public').toUpperCase()}
┃ 👑 ᴏᴡɴᴇʀ ⟫ ${config.OWNER_NAME}
┃ 📞 ᴄᴏɴᴛᴀᴄᴛ ⟫ wa.me/${config.OWNER_NUMBER}
┃ ⚡ ᴘʀᴇғɪx ⟫ ${config.PREFIX || '.'}
┃ 📦 ᴄᴏᴍᴍᴀɴᴅs ⟫ ${totalCmds}
┃ ⏱️ ᴜᴘᴛɪᴍᴇ ⟫ ${uptime()}
┃ 💎 ${config.PREFIX || '.'}ᴠɪᴘᴍᴅ ⟫ ᴠɪᴘ ʟɪɴᴋ ✨
╰━━━━━━━⟡ ✦ ⟡━━━━━━━╯`;

        const pic = getOwnerPic();
        if (pic) {
            try { await conn.sendMessage(from, { image: pic, caption: status }, { quoted: mek }); return; }
            catch (e) { console.error('alive image failed:', e.message); }
        }
        await conn.sendMessage(from, { text: status }, { quoted: mek });

    } catch (e) {
        console.error("Error in alive command:", e);
        reply(`An error occurred: ${e.message}`);
    }
});
