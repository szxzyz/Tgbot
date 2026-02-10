import TelegramBot from "node-telegram-bot-api";
import { storage } from "./storage";
import crypto from "crypto";

let botInstance: TelegramBot | null = null;
let isPolling = false;

// Translations
const translations: Record<string, Record<string, string>> = {
    en: {
    selectLanguage: "Select language / Выберите язык",
    dashboard: "💎 *MY ACCOUNT*",
    balance: "Wallet Balance",
    refresh: "♻️ Sync Balance",
    partners: "👥 Referrals",
    withdraw: "🏦 Cash Out",
    info: "ℹ️ Guide",
    back: "↩️ Menu",
    subscribe: "🚀 Join Channel",
    subscribed: "✅ Verified",
    subscribeMessage: "😉 Please join our official channel to unlock all features",
    letsGo: "🏂 Start!",
    userNotFound: "⚠️ User profile not found. Type /start",
    partnersTitle: "👥 *Referral Program*",
    partnersDesc: "Grow your network and earn more!",
    partnersReward: "Get *{amount} TON* per active friend",
    shareReferral: "🔗 Copy Link",
    shareReferralMessage: "🚀 Start earning TON with me!\n\nJoin now and get rewards 💰\n\n👉 Start here: {link}",
    language: "🌎 Language",
    support: "📞 Support",
    notification: "🔔 Alerts",
    notificationOn: "🔔 Alerts: ON",
    notificationOff: "🔕 Alerts: OFF",
    notificationToggled: "Settings updated!",
    supportMessage: "📞 *Support Center*\n\nNeed help? Contact our team anytime.",
    referralLink: "🔗 *Personal Invite Link:*",
    totalReferrals: "Friends Invited",
    infoTitle: "ℹ️ *Help Center*",
    infoWhat: "🤖 *What is TON Miner?*",
    infoWhatDesc: "A referral platform on Telegram. Invite friends and convert to real rewards.",
    infoHow: "⚙️ *Quick Start*",
    infoStep1: "1. Use \"Sync Balance\" to collect earnings.",
    infoStep3: "2. \"Invite\" friends for massive bonuses.",
    infoStep4: "3. \"Cash Out\" to your TON wallet.",
    infoNote: "⚠️ *Notice:* This is a simulation platform.",
    infoEarnings: "💸 *Rewards & Tasks*",
    earningsTitle: "💸 Earn More",
    noTasks: "No active tasks at the moment.\nCheck back soon!",
    newTasks: "New earning opportunities!\nComplete missions for rewards.",
    goToTasks: "👉 View Tasks 👈",
    taskList: "📌 *Mission Board*",
    channelTask: "🔹 Subscribe to Channel",
    botTask: "🔹 Launch Partner Bot",
    accountTitle: "👤 *Profile Details*",
    accountId: "🆔 User ID",
    accountLang: "🗣️ Language",
    accountReferrals: "👥 Friends",
    accountJoined: "📅 Member Since",
    accountStatus: "🟢 Account Status",
    withdrawTitle: "🏦 *Cash Out Funds*",
    minWithdraw: "⚠️ Min. Payout",
    requestWithdraw: "✅ Confirm Request",
    insufficientBalance: "❌ Low Balance",
    enterWallet: "🏦 Enter your destination TON wallet:",
    enterAmount: "💰 Amount to withdraw:",
    invalidAmount: "❌ Invalid figure.",
    insufficientBalanceMsg: "❌ Balance too low.",
    withdrawPending: "✅ Request queued! Status: Pending review",
    notSubscribed: "❌ Verification failed: Join channel first!",
    subscriptionError: "❌ Network error. Try again.",
    newReferral: "👥 New friend joined! You earned {amount} TON.",
    verificationPending: "⏳ Verification in progress (up to 7 days).",
    channelTaskTitle: "📌 *Task: Channel Subscription*",
    channelTaskStep1: "➡️ Join using the button below",
    channelTaskStep2: "➡️ Maintain sub for 7+ days",
    channelTaskNote: "⚠️ Reward pending manual verification.",
    botTaskTitle: "📌 *Task: Partner Bot Launch*",
    botTaskStep1: "➡️ Start the bot below",
    botTaskStep2: "➡️ Keep active for 7+ days",
    botTaskWarning: "❗ Early block will forfeit reward",
    missionChannel: "👉🏻 *Mission: Channel Engagement*\n\n❓ Join and press « ✅ Verified ».",
    missionBot: "👉🏻 *Mission: Bot Engagement*\n\n❓ Start and forward any message for verification.",
    joined: "✅ Joined",
    started: "✅ Started",
    skip: "↪️ Skip",
    check: "🔄 Verify",
    advertiseMenu: "📈 Growth Tools",
    advertiseChannel: "📢 Promo Channel",
    advertiseBots: "🤖 Promo Bot",
    myTasks: "💼 Campaigns",
    channelPromoInfo: "📈 Promote Channel\n\nReach thousands of active users.\n\n↳ 💰 Cost: 0.250 TON\n↳ 📌 Reach: 1000 users\n\n➕ Add @{botUsername} as ADMIN for verification.\n\n📝 Send channel link:",
    subscribeChannel: "📢 Open Channel",
    notJoined: "❌ Not found in channel. Join first!",
    enterChannelUrl: "📈 Promote Channel\n\nReach thousands of active users.\n\n↳ 💰 Cost: 0.250 TON\n↳ 📌 Reach: 1000 users\n\n➕ Add @{botUsername} as ADMIN for verification.\n\n📝 Send channel link:",
    taskPublished: "🎉 Campaign launched successfully!",
    botPromoInfo: "📈 Promote Bot\n\nGet new users for your project.\n\n↳ 💰 Cost: 0.250 TON\n↳ 📌 Reach: 1000 users\n\n📝 Send bot link:",
    enterBotUrl: "📝 Send bot URL (e.g., https://t.me/your_bot):",
    forwardBotMsg: "📌 Forward any message from your bot for verification.",
    botVerified: "✅ Bot linked successfully.\n\nNext step? 👇",
    publishTask: "📢 Start Campaign",
    addReferralLink: "🔗 Link Referrer",
    startBot: "🤖 Open Bot",
    forwardMessage: "📩 Please forward a message from your bot.",
    adminChannelPost: "📌 Mission: New Channel Subscription\n\n➡️ Join via button\n➡️ Stay subbed 24h+\n\n⚠️ Reward verified automatically.",
    claimReward: "👉 Claim Reward 👈",
  },
  ru: {
    selectLanguage: "Выберите язык / Select language",
    dashboard: "👤 *Account Dashboard*",
    balance: "Баланс",
    refresh: "♻️ Обновить",
    partners: "👥 Partner",
    withdraw: "🏦 Вывод",
    info: "ℹ️ Инфо",
    back: "↩️ Назад",
    subscribe: "🚀 Подписаться",
    subscribed: "✅ Я подписан",
    subscribeMessage: "😉 Подпишитесь на наш канал, чтобы начать",
    letsGo: "🏂 Поехали!",
    userNotFound: "⚠️ Пользователь не найден. Напишите /start",
    partnersTitle: "👥 *Партнёрская программа*",
    partnersDesc: "Приглашайте друзей и зарабатывайте TON!",
    partnersReward: "Получайте *{amount} TON* за каждого активного реферала",
    shareReferral: "🔗 Поделиться",
    shareReferralMessage: "🚀 Начни зарабатывать TON со мной!\n\nПрисоединяйся и получай награды 💰\n\n👉 Начать: {link}",
    language: "🌎 Language",
    support: "📞 Support",
    notification: "🔔 Уведомления",
    notificationOn: "🔔 Уведомления: ВКЛ",
    notificationOff: "🔕 Уведомления: ВЫКЛ",
    notificationToggled: "Уведомления обновлены!",
    supportMessage: "📞 *Поддержка*\n\nПо любым вопросам обращайтесь в нашу службу поддержки.",
    referralLink: "🔗 *Ваша реферальная ссылка:*",
    totalReferrals: "Всего рефералов",
    infoTitle: "ℹ️ *Информация*",
    infoWhat: "🤖 *Что это за бот?*",
    infoWhatDesc: "Это платформа для заработка TON. Вы можете приглашать друзей и выводить награды.",
    infoHow: "⚙️ *Как это работает?*",
    infoStep1: "1. Нажмите \"Обновить\" чтобы синхронизировать баланс.",
    infoStep3: "2. Приглашайте друзей для заработка.",
    infoStep4: "3. Выводите заработок на кошелёк.",
    infoNote: "⚠️ *Примечание:* Это симуляционный бот.",
    infoEarnings: "💸 *Заработок и задания*",
    earningsTitle: "💸 Заработок",
    noTasks: "В данный момент нет активных заданий.\nПроверьте позже.",
    newTasks: "Доступны новые задания!\nВыполняйте и получайте награды.",
    goToTasks: "👉 Перейти к заданиям 👈",
    taskList: "📌 *Список заданий*",
    channelTask: "🔹 Задание: Подписка на канал",
    botTask: "🔹 Задание: Запуск бота",
    accountTitle: "👤 *Информация об аккаунте*",
    accountId: "🆔 ID",
    accountLang: "🗣️ Язык",
    accountReferrals: "👥 Рефералы",
    accountJoined: "📅 Регистрация",
    accountStatus: "🟢 Статус",
    withdrawTitle: "🏦 *Вывод средств*",
    minWithdraw: "⚠️ Минимальный вывод",
    requestWithdraw: "✅ Запросить вывод",
    insufficientBalance: "❌ Недостаточный баланс",
    enterWallet: "🏦 Введите адрес вашего TON кошелька:",
    enterAmount: "💰 Введите сумму для вывода:",
    invalidAmount: "❌ Неверная сумма.",
    insufficientBalanceMsg: "❌ Недостаточный баланс.",
    withdrawPending: "✅ Заявка на вывод отправлена! Статус: Ожидание",
    notSubscribed: "❌ Вы ещё не подписаны!",
    subscriptionError: "❌ Ошибка проверки подписки.",
    newReferral: "👥 Новый реферал! Вы получили {amount} TON.",
    verificationPending: "⏳ Проверка в процессе. Подождите до 7 дней.",
    channelTaskTitle: "📌 *Новое задание: Подписка на канал*",
    channelTaskStep1: "➡️ Присоединитесь к каналу по кнопке ниже",
    channelTaskStep2: "➡️ Оставайтесь подписанным минимум 24 часа",
    channelTaskNote: "⚠️ Награда будет начислена после проверки.",
    botTaskTitle: "📌 *Новое задание: Запустить бота*",
    botTaskStep1: "➡️ Откройте бота по кнопке ниже",
    botTaskStep2: "➡️ НЕ блокируйте бота минимум 7 дней",
    botTaskWarning: "❗ Блокировка до 7 дней может привести к штрафу",
    missionChannel: "👉🏻 *Миссия: Взаимодействуйте с каналом и вступите в него.*\n\n❓ После вступления нажмите « ✅ Вступил » ниже.",
    missionBot: "👉🏻 *Mission: Engage with the bot.*\n\n❓ Нажмите « ✅ Запущен » и перешлите ЛЮБОЕ сообщение\nот этого бота сюда для проверки.",
    joined: "✅ Вступил",
    started: "✅ Запущен",
    skip: "↪️ Пропустить",
    check: "🔄 Проверить",
  },
};

function t(lang: string | null | undefined, key: string): string {
  const language = lang || "en";
  return translations[language]?.[key] || translations.en[key] || key;
}

const REFERRAL_REWARD = 0.008;

let bot: TelegramBot | null = null;

export function setupBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN is not set. Bot will not start.");
    return;
  }

  if (botInstance) {
    console.log("Stopping existing bot instance...");
    try {
      botInstance.stopPolling();
    } catch (e) {
      console.error("Error stopping bot:", e);
    }
    botInstance = null;
    isPolling = false;
  }

  try {
    bot = new TelegramBot(token, { 
      polling: {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      }
    });
    botInstance = bot;
    isPolling = true;
    
    bot.on("polling_error", (error: Error) => {
      console.error("Telegram polling error:", error.message);
      if (error.message.includes("409")) {
        console.warn("409 Conflict: Another bot instance may be running. Consider using webhooks for production.");
      }
    });
    
    bot.on("error", (error: Error) => {
      console.error("Telegram bot error:", error.message);
    });
    
    console.log("Telegram bot started successfully!");
  } catch (error) {
    console.error("Failed to start Telegram bot:", error);
    isPolling = false;
    return;
  }

  if (!bot) return;

  // --- Helpers ---
  const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || "6653616672";

  function isSuperAdmin(telegramId: string | number | undefined) {
    if (!telegramId) return false;
    const isAdmin = telegramId.toString() === SUPER_ADMIN_ID;
    if (isAdmin) {
      console.log(`[ADMIN] Admin bypass triggered for ${telegramId}`);
    }
    return isAdmin;
  }

  async function getUserOrRegister(msg: TelegramBot.Message, referrerId?: string) {
    const telegramId = msg.from?.id.toString();
    if (!telegramId) return null;

    let user = await storage.getUserByTelegramId(telegramId);
    
    if (!user) {
      try {
        user = await storage.createUser({
          telegramId,
          username: msg.from?.username || null,
          firstName: msg.from?.first_name || null,
          languageCode: msg.from?.language_code || null,
          lastClaimTime: Date.now(),
          referrerId: referrerId || null,
          referralCount: 0,
          balance: 0,
          isPremium: false,
          status: "active"
        });

        // Handle referral reward if applicable
        if (referrerId && referrerId !== telegramId) {
          const referrer = await storage.getUserByTelegramId(referrerId);
          if (referrer) {
             await storage.updateUser(referrer.id, {
               referralCount: (referrer.referralCount || 0) + 1,
               balance: (referrer.balance || 0) + REFERRAL_REWARD
             });
             
             bot?.sendMessage(referrer.telegramId, t(referrer.language, "newReferral").replace("{amount}", REFERRAL_REWARD.toString()));
          }
        }
      } catch (error: any) {
        if (error.code === '23505') {
          user = await storage.getUserByTelegramId(telegramId);
        } else {
          console.error("Error creating user:", error);
          return null;
        }
      }
    }
    return user;
  }

  function getMainMenuKeyboard(lang: string | null | undefined) {
    const adBotUrl = "https://t.me/TONAdzbot/EARN";
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📺 Watch Ads & Earn", url: adBotUrl }],
          [{ text: t(lang, "refresh"), callback_data: "refresh" }],
          [{ text: t(lang, "partners"), callback_data: "partners" }, { text: t(lang, "withdraw"), callback_data: "withdraw" }],
          [{ text: t(lang, "language"), callback_data: "language" }, { text: t(lang, "support"), callback_data: "support" }],
          [{ text: t(lang, "info"), callback_data: "info" }]
        ]
      }
    };
  }

  function getBackButton(lang: string | null | undefined) {
    return {
      reply_markup: {
        inline_keyboard: [[{ text: t(lang, "back"), callback_data: "back_to_menu" }]]
      }
    };
  }

  function getSubscribeKeyboard(lang: string | null | undefined) {
    const channelUrl = "https://t.me/your_channel_link"; // Replace with your actual channel link
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: t(lang, "advertiseChannel"), url: channelUrl },
            { text: t(lang, "subscribed"), callback_data: "check_subscription" }
          ]
        ]
      }
    };
  }

  // --- Keyboards ---
  function getLanguageKeyboard() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🇷🇺 Русский", callback_data: "set_lang_ru" }, { text: "🇬🇧 English", callback_data: "set_lang_en" }],
          [{ text: "🇪🇸 Español", callback_data: "set_lang_es" }, { text: "🇵🇹 Português", callback_data: "set_lang_pt" }],
          [{ text: "🇫🇷 Français", callback_data: "set_lang_fr" }, { text: "🇾🇪 العربية", callback_data: "set_lang_ar" }]
        ]
      }
    };
  }

  function getDashboardText(lang: string | null | undefined, balance: number, telegramId?: string) {
    return `
💎 *MY ACCOUNT*
🆔 User ID: ${telegramId || "Unknown"}

💰 Wallet Balance: ${balance.toFixed(8)} TON
`;
  }

  // --- Callback Query Handler ---
  bot.on("callback_query", async (query) => {
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const telegramId = query.from.id.toString();
    const data = query.data;

    if (!chatId || !data) return;

    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      return bot?.sendMessage(chatId, t(null, "userNotFound"));
    }

    const lang = user.language;

    try {
      if (data === "refresh") {
        const now = Date.now();
        const lastClaim = user.lastClaimTime;
        const diffSeconds = Math.floor((now - lastClaim) / 1000);
        
        // Mine 0.0000001 TON every 5 seconds (base rate)
        const minedAmount = (diffSeconds / 5) * 0.0000001;
        
        if (minedAmount > 0) {
          const newBalance = (user.balance || 0) + minedAmount;
          await storage.updateUser(user.id, { 
            balance: newBalance,
            lastClaimTime: now
          });
          
          const dashboardText = getDashboardText(lang, newBalance, telegramId);
          bot?.editMessageText(dashboardText, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...getMainMenuKeyboard(lang)
          });
          bot?.answerCallbackQuery(query.id, { text: "Balance refreshed!" });
        } else {
          bot?.answerCallbackQuery(query.id, { text: "Too early to refresh!" });
        }
      } else if (data === "partners") {
        const webAppUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
        const referralLink = `${webAppUrl}?ref=${telegramId}`;
        const partnersText = `
👥 *Partners Program*
Invite friends and earn TON!

Earn *0.008 TON* for each active referral

🔗 *Your Referral Link:*
\`${referralLink}\`

Total Referrals: ${user.referralCount || 0}
`;
        bot?.editMessageText(partnersText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getBackButton(lang)
        });
        bot?.answerCallbackQuery(query.id);
      } else if (data === "withdraw") {
        const withdrawText = `
🏦 *Withdraw Funds*
Minimum Withdrawal: 0.5 TON

Your Balance: ${user.balance.toFixed(8)} TON

Please enter your TON wallet address:
`;
        bot?.editMessageText(withdrawText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getBackButton(lang)
        });
        bot?.answerCallbackQuery(query.id);
      } else if (data === "info") {
        const infoText = `
ℹ️ *Information*

🤖 *What is this bot?*
This is a TON referral platform. You can earn TON coins by inviting friends and withdraw real rewards.

⚙️ *How it works?*
1. Press "Refresh" to sync your balance.
2. Invite friends to earn rewards.
3. Withdraw earnings to your wallet.

⚠️ *Notice:* This is a simulation platform.
`;
        bot?.editMessageText(infoText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getBackButton(lang)
        });
        bot?.answerCallbackQuery(query.id);
      } else if (data === "language") {
        bot?.editMessageText(t(lang, "selectLanguage"), {
          chat_id: chatId,
          message_id: messageId,
          ...getLanguageKeyboard()
        });
        bot?.answerCallbackQuery(query.id);
      } else if (data === "back_to_menu") {
        const dashboardText = getDashboardText(lang, user.balance, telegramId);
        bot?.editMessageText(dashboardText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getMainMenuKeyboard(lang)
        });
        bot?.answerCallbackQuery(query.id);
      } else if (data.startsWith("set_lang_")) {
        const selectedLang = data.replace("set_lang_", "");
        await storage.updateUser(user.id, { language: selectedLang, isOnboarded: true });
        
        const dashboardText = getDashboardText(selectedLang, user.balance, 0.0000001, telegramId);
        bot?.editMessageText(dashboardText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          ...getMainMenuKeyboard(selectedLang)
        });
        bot?.answerCallbackQuery(query.id, { text: "Language updated!" });
      }
    } catch (error) {
      console.error("Callback query error:", error);
      bot?.answerCallbackQuery(query.id, { text: "An error occurred." });
    }
  });

  // --- Commands ---
  bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const payload = match?.[1];
    
    const userResult = await storage.getUserByTelegramId(msg.from?.id.toString() || "");
    let user = userResult;
    
    // Check if this is a task link
    const taskMatch = payload?.match(/^task_(\d+)$/);
    
    if (!user) {
      const referralCode = taskMatch ? undefined : payload;
      const newUser = await getUserOrRegister(msg, referralCode);
      if (!newUser) return;
      user = newUser;
      
      // If user came via task link, redirect to task after onboarding
      if (taskMatch) {
        await storage.updateUser(user.id, { status: `pending_task_${taskMatch[1]}` } as any);
      }
      
      return bot?.sendMessage(chatId, t(null, "selectLanguage"), getLanguageKeyboard());
    }

    const lang_start = user.language;

    if (!user.isOnboarded) {
      if (!user.language) {
        return bot?.sendMessage(chatId, t(null, "selectLanguage"), getLanguageKeyboard());
      }
      // Skip verification - go directly to subscription check
      return bot?.sendMessage(chatId, t(user.language, "subscribeMessage"), getSubscribeKeyboard(user.language));
    }
    
    // Handle task link for existing onboarded users
    if (taskMatch) {
      const taskId = parseInt(taskMatch[1]);
      const task = await storage.getTask(taskId);
      
      if (task && task.isActive) {
        const lang = user.language;
        
        // Check if user already completed this task
        const existingUserTask = await storage.getUserTask(user.id, taskId);
        if (existingUserTask?.status === "completed") {
          bot?.sendMessage(chatId, "✅ You have already completed this task.");
          return;
        }
        
        // Create or get user task
        if (!existingUserTask) {
          await storage.createUserTask({
            userId: user.id,
            taskId: task.id,
            status: "pending"
          });
        }
        
        if (task.type === "bot") {
          const missionText = `👉🏻 *Mission: Engage with the bot.*

❓ Press « ✅ Started » and then forward ANY message
from that bot here for verification.`;
          
          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [{ text: t(lang, "startBot"), url: task.link }],
                [{ text: t(lang, "started"), callback_data: `verify_bot_task_${taskId}` }]
              ]
            }
          };
          
          bot?.sendMessage(chatId, missionText, { parse_mode: "Markdown", ...keyboard });
        } else if (task.type === "channel") {
          const missionText = `👉🏻 *Mission: Engage with the channel and join it.*

❓ After joining, press « ✅ Joined » below.`;
          
          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [{ text: t(lang, "subscribeChannel"), url: task.link }],
                [{ text: t(lang, "joined"), callback_data: `verify_channel_task_${taskId}` }]
              ]
            }
          };
          
          bot?.sendMessage(chatId, missionText, { parse_mode: "Markdown", ...keyboard });
        }
        return;
      }
    }
    
    const now = Date.now();
    const lastClaim = user.lastClaimTime;
    const diffSeconds = (now - lastClaim) / 1000;
    const miningRatePer5Sec = getMiningRate(user.miningLevel, user.referralCount);
    const miningRatePerSec = miningRatePer5Sec / 5;
    const minedAmount = diffSeconds * miningRatePerSec;
    const currentBalance = user.balance + minedAmount;
    
    const welcomeText = getDashboardText(user.language, currentBalance, miningRatePer5Sec);
    bot?.sendMessage(chatId, welcomeText, { parse_mode: "Markdown", ...getMainMenuKeyboard(user.language) });
  });

  const TASK_CHANNEL_ID = "-1002480439556";
  const ADMIN_ID = "6653616672";

  function isAdmin(telegramId: string | undefined) {
    if (!telegramId) return false;
    const superAdminId = process.env.SUPER_ADMIN_ID;
    const isSpecial = telegramId === ADMIN_ID || (superAdminId && telegramId === superAdminId);
    if (isSpecial) {
      console.log(`[ADMIN] Authorized access for user ${telegramId} (SUPER_ADMIN_ID: ${superAdminId})`);
    }
    return !!isSpecial;
  }

  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from?.id.toString();
    if (!telegramId) return;
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) return;
    const lang_msg = user.language;

    // Handle wallet address input for withdrawal
    if (msg.text && user.status === "awaiting_withdrawal_address" && !msg.text.startsWith("/")) {
      const walletAddress = msg.text.trim();
      if (walletAddress.length < 10) {
        bot?.sendMessage(chatId, "❌ Invalid wallet address. Please try again.");
        return;
      }

      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount: user.balance,
        walletAddress,
        status: "pending"
      });

      await storage.updateUser(user.id, { 
        balance: 0,
        status: "active"
      } as any);

      bot?.sendMessage(chatId, `✅ Withdrawal request submitted!\n\n💰 Amount: ${withdrawal.amount.toFixed(4)} TON\n👛 Wallet: \`${withdrawal.walletAddress}\`\n\nWait for admin processing.`, { parse_mode: "Markdown" });
      return;
    }

    if (msg.text && ["🇷🇺 Русский", "🇬🇧 English", "🇪🇸 Español", "🇵🇹 Português", "🇫🇷 Français", "🇾🇪 العربية"].includes(msg.text)) {
      if (!user.language) {
        const langMap: Record<string, string> = {
          "🇷🇺 Русский": "ru", "🇬🇧 English": "en", "🇪🇸 Español": "es",
          "🇵🇹 Português": "pt", "🇫🇷 Français": "fr", "🇾🇪 العربية": "ar"
        };
        const selectedLang = langMap[msg.text];
        await storage.updateUser(user.id, { language: selectedLang, isVerified: true });
        
        // Skip verification - go directly to subscription check
        bot?.sendMessage(msg.chat.id, t(selectedLang, "subscribeMessage"), {
          ...getSubscribeKeyboard(selectedLang),
          reply_markup: { ...getSubscribeKeyboard(selectedLang).reply_markup }
        } as any);
      }
    }
  });

  // --- Callback Queries ---
  bot.on("callback_query", async (query) => {
    if (!query.message || !query.data) return;
    const chatId = query.message.chat.id;
    const telegramId = query.from.id.toString();
    const messageId = query.message.message_id;

    if (query.data === "check_subscription") {
      try {
        const isSubscribed = true; // Simulated for now
        
        if (isSubscribed) {
          const user = await storage.getUserByTelegramId(telegramId);
          if (user) {
            await storage.updateUser(user.id, { isOnboarded: true });
            await bot?.sendMessage(chatId, t(user.language, "letsGo"));
            const welcomeText = getDashboardText(user.language, user.balance, getMiningRate(user.miningLevel, user.referralCount));
            bot?.sendMessage(chatId, welcomeText, { parse_mode: "Markdown", ...getMainMenuKeyboard(user.language) });
          }
        } else {
          const user = await storage.getUserByTelegramId(telegramId);
          bot?.answerCallbackQuery(query.id, { text: t(user?.language, "notSubscribed"), show_alert: true });
        }
      } catch (e) {
        const user = await storage.getUserByTelegramId(telegramId);
        bot?.answerCallbackQuery(query.id, { text: t(user?.language, "subscriptionError"), show_alert: true });
      }
      return;
    }

    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      bot?.sendMessage(chatId, t(null, "userNotFound"));
      return;
    }
    const lang_cb = user.language;

    if (query.data.startsWith("set_lang_")) {
      const selectedLang = query.data.replace("set_lang_", "");
      await storage.updateUser(user.id, { language: selectedLang });
      bot?.answerCallbackQuery(query.id, { text: "Language updated!" });
      
      if (!user.isOnboarded) {
        bot?.sendMessage(chatId, t(selectedLang, "subscribeMessage"), getSubscribeKeyboard(selectedLang));
      } else {
        const welcomeText = getDashboardText(selectedLang, user.balance, getMiningRate(user.miningLevel, user.referralCount));
        bot?.sendMessage(chatId, welcomeText, { parse_mode: "Markdown", ...getMainMenuKeyboard(selectedLang) });
      }
      return;
    }

    if (query.data === "upgrade") {
      const currentLevel = user.miningLevel || 1;
      const nextLevel = currentLevel + 1;
      const cost = UPGRADE_COSTS[nextLevel];
      
      let text = t(lang_cb, "upgradeTitle") + "\n\n";
      text += `${t(lang_cb, "currentLevel")}: ${currentLevel}\n`;
      text += `${t(lang_cb, "speed")}: ${getMiningRate(currentLevel).toFixed(7)} TON / 5s\n\n`;
      
      if (cost) {
        text += `${t(lang_cb, "nextLevel")}: ${nextLevel}\n`;
        text += `${t(lang_cb, "speed")}: ${getMiningRate(nextLevel).toFixed(7)} TON / 5s\n`;
        text += `${t(lang_cb, "cost")}: ${cost} TON\n\n`;
        text += `${t(lang_cb, "yourBalance")}: ${user.balance.toFixed(4)} TON`;
        
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: t(lang_cb, "buyLevel"), callback_data: `buy_level_${nextLevel}` }],
              [{ text: t(lang_cb, "back"), callback_data: "back_to_menu" }]
            ]
          }
        };
        bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...keyboard });
      } else {
        text += t(lang_cb, "maxLevelReached");
        bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...getBackButton(lang_cb) });
      }
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data.startsWith("buy_level_")) {
      const targetLevel = parseInt(query.data.split("_")[2]);
      const currentLevel = user.miningLevel || 1;
      
      if (targetLevel !== currentLevel + 1) {
        bot?.answerCallbackQuery(query.id, { text: t(lang_cb, "upgradeOneLevel"), show_alert: true });
        return;
      }
      
      const cost = UPGRADE_COSTS[targetLevel];
      if (user.balance < cost) {
        bot?.answerCallbackQuery(query.id, { text: t(lang_cb, "insufficientFunds"), show_alert: true });
        return;
      }
      
      await storage.updateUser(user.id, { 
        balance: user.balance - cost,
        miningLevel: targetLevel
      });
      
      bot?.answerCallbackQuery(query.id, { text: t(lang_cb, "upgradeSuccess"), show_alert: true });
      // Refresh to main menu
      const updatedUser = await storage.getUser(user.id);
      if (updatedUser) {
        const text = getDashboardText(lang_cb, updatedUser.balance, getMiningRate(updatedUser.miningLevel, updatedUser.referralCount));
        bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...getMainMenuKeyboard(lang_cb) });
      }
      return;
    }

    if (query.data === "partners") {
      const myBot = await bot?.getMe();
      const referralLink = `https://t.me/${myBot?.username}?start=${user.telegramId}`;
      let text = t(lang_cb, "partnersTitle") + "\n\n";
      text += t(lang_cb, "partnersDesc") + "\n\n";
      text += t(lang_cb, "partnersReward").replace("{amount}", REFERRAL_REWARD.toString()) + "\n";
      text += t(lang_cb, "partnersBonus") + "\n\n";
      text += `${t(lang_cb, "totalReferrals")}: ${user.referralCount || 0}\n\n`;
      text += `${t(lang_cb, "referralLink")}\n\`${referralLink}\``;
      
      bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...getBackButton(lang_cb) });
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "account") {
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "earnings") {
      const activeTasks = await storage.getActiveTasksForUser(user.id);
      let text = t(lang_cb, "taskList") + "\n\n";
      
      if (activeTasks.length === 0) {
        text += t(lang_cb, "noTasks");
        bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...getBackButton(lang_cb) });
      } else {
        const inline_keyboard = activeTasks.map(task => ([{
          text: task.title,
          callback_data: `view_task_${task.id}`
        }]));
        inline_keyboard.push([{ text: t(lang_cb, "back"), callback_data: "back_to_menu" }]);
        
        bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", reply_markup: { inline_keyboard } });
      }
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data.startsWith("view_task_")) {
      const taskId = parseInt(query.data.split("_")[2]);
      const task = await storage.getTask(taskId);
      if (task) {
        const text = `📌 *${task.title}*\n\n${task.description}\n\n💰 Reward: ${task.reward} TON`;
        const keyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Go to Task", url: task.link }],
              [{ text: t(lang_cb, "check"), callback_data: `verify_${task.type}_task_${taskId}` }],
              [{ text: t(lang_cb, "back"), callback_data: "earnings" }]
            ]
          }
        };
        bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...keyboard });
      }
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "withdraw") {
      let text = t(lang_cb, "withdrawTitle") + "\n\n";
      text += `${t(lang_cb, "yourBalance")}: ${user.balance.toFixed(4)} TON\n`;
      text += `${t(lang_cb, "minWithdraw")}: 0.5 TON`;
      
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: t(lang_cb, "requestWithdraw"), callback_data: "start_withdraw" }],
            [{ text: t(lang_cb, "back"), callback_data: "back_to_menu" }]
          ]
        }
      };
      bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...keyboard });
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "start_withdraw") {
      if (user.balance < 0.5) {
        bot?.answerCallbackQuery(query.id, { text: t(lang_cb, "insufficientBalance"), show_alert: true });
        return;
      }
      await storage.updateUser(user.id, { status: "awaiting_withdrawal_address" } as any);
      bot?.sendMessage(chatId, t(lang_cb, "enterWallet"));
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "info") {
      let text = t(lang_cb, "infoTitle") + "\n\n";
      text += t(lang_cb, "infoWhat") + "\n";
      text += t(lang_cb, "infoWhatDesc") + "\n\n";
      text += t(lang_cb, "infoHow") + "\n";
      text += `${t(lang_cb, "infoStep1")}\n${t(lang_cb, "infoStep2")}\n${t(lang_cb, "infoStep3")}\n${t(lang_cb, "infoStep4")}\n\n`;
      text += t(lang_cb, "infoNote");
      
      bot?.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...getBackButton(lang_cb) });
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "back_to_main") {
      const welcomeText = getDashboardText(lang_cb, user.balance, getMiningRate(user.miningLevel, user.referralCount));
      bot?.editMessageText(welcomeText, { chat_id: chatId, message_id: messageId, parse_mode: "Markdown", ...getMainMenuKeyboard(lang_cb) });
      bot?.answerCallbackQuery(query.id);
      return;
    }

    if (query.data === "launch_app") {
      const userResult = await storage.getUserByTelegramId(query.from?.id.toString() || "");
      if (!userResult) return;
      const token = crypto.randomBytes(16).toString("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
      await storage.updateUser(userResult.id, {
        authSessionToken: token,
        authSessionExpiresAt: expiresAt
      });

      const webAppUrl = process.env.APP_URL || `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
      const launchUrl = `${webAppUrl}/?userId=${userResult.telegramId}&token=${token}`;
      
      bot?.editMessageText("🚀 Launching Ad Watch App...", {
        chat_id: chatId,
        message_id: query.message?.message_id,
        reply_markup: {
          inline_keyboard: [[{ text: "▶️ Open App", url: launchUrl }]]
        }
      });
    } else if (query.data === "back_to_menu" || query.data === "refresh") {
      await storage.updateUser(user.id, { status: "active" } as any);
      const now = Date.now();
      const lastClaim = user.lastClaimTime;
      const diffSeconds = (now - lastClaim) / 1000;
      const miningRatePer5Sec = getMiningRate(user.miningLevel, user.referralCount);
      const miningRatePerSec = miningRatePer5Sec / 5;
      
      const minedAmount = diffSeconds * miningRatePerSec;
      const newBalance = user.balance + minedAmount;
      await storage.updateUser(user.id, {
        balance: newBalance,
        lastClaimTime: now
      });

      const text = getDashboardText(lang_cb, newBalance, miningRatePer5Sec);
      
      try {
        await bot?.editMessageText(text, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: getMainMenuKeyboard(lang_cb).reply_markup
        });
      } catch (e) {
        // Message might not have changed
      }

    } else if (query.data.startsWith("verify_channel_task_")) {
      const taskId = parseInt(query.data.split("_")[3]);
      const task = await storage.getTask(taskId);
      if (!task) return;

      try {
        const channelUsername = task.targetBotUsername?.startsWith("@") 
          ? task.targetBotUsername 
          : `@${task.targetBotUsername}`;
          
        const chatMember = await bot?.getChatMember(channelUsername, parseInt(telegramId));
        if (chatMember && ["member", "administrator", "creator"].includes(chatMember.status)) {
          const userTask = await storage.getUserTask(user.id, task.id);
          if (userTask?.status === "completed") {
            bot?.answerCallbackQuery(query.id, { text: "Task already completed!", show_alert: true });
            return;
          }

          await storage.updateUser(user.id, { balance: (user.balance || 0) + task.reward });
          await storage.updateUserTask(user.id, task.id, { status: "completed", verifiedAt: new Date() });
          await storage.incrementTaskCompletion(task.id);
          bot?.answerCallbackQuery(query.id, { text: "✅ Reward credited!", show_alert: true });
          
          const updatedUser = await storage.getUser(user.id);
          if (updatedUser) {
            const userLang = updatedUser.language || 'en';
            const text = getDashboardText(userLang, updatedUser.balance, getMiningRate(updatedUser.miningLevel, updatedUser.referralCount));
            bot?.sendMessage(chatId, text, {
              parse_mode: "Markdown",
              reply_markup: getMainMenuKeyboard(userLang).reply_markup
            });
          }
        } else {
          bot?.answerCallbackQuery(query.id, { text: t(user.language, "notJoined"), show_alert: true });
        }
      } catch (e) {
        bot?.answerCallbackQuery(query.id, { text: t(user.language, "subscriptionError"), show_alert: true });
      }
      return;
    } else if (query.data.startsWith("verify_bot_task_")) {
      bot?.sendMessage(chatId, t(user.language, "forwardBotMsg"), { reply_markup: { force_reply: true } });
      return;
    }
  });
}
