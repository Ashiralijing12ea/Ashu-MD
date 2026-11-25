// .owner — bot owner ka contact card (number fixed: 923199047305, naam us user ke .ownername se)
const { cmd } = require('../arslan');
const config = require('../config');

cmd({
    pattern: 'owner',
    alias: ['creator', 'developer', 'dev', 'ownercontact'],
    desc: 'Bot owner ka contact',
    category: 'main',
    react: '👑',
    use: '.owner',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const num = '923199047305';
    const name = String(config.OWNER_NAME || 'Ashir Badshah').replace(/[\r\n]/g, ' ');
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${config.BOT_NAME || 'ASHU-MD'};\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`;
    try {
        await conn.sendMessage(from, { contacts: { displayName: name, contacts: [{ vcard }] } }, { quoted: mek });
    } catch (e) {
        await reply(`👑 *Owner:* ${name}\n📱 wa.me/${num}`);
    }
});
