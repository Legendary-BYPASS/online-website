const { Telegraf } = require('telegraf');

const botToken = '7603633855:AAGqwe6Yxsnd6p7GYq8zk2hcH4pND9xKEzo'; // Ganti dengan token bot Anda
const bot = new Telegraf(botToken);

// Definisikan perintah bot
bot.command('start', (ctx) => ctx.reply('Bot is up and running! 🎉'));
bot.command('about', (ctx) => ctx.reply('This is a Telegram bot running on Vercel using webhook.'));

bot.on('text', (ctx) => ctx.reply(`You said: ${ctx.message.text}`));

// Fungsi utama untuk menangani permintaan
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body); // Tangani pembaruan dari Telegram
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Use POST method to interact with this API.');
  }
};
