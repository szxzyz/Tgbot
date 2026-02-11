import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupBot } from "./bot";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Start the Telegram Bot
  setupBot();

  // --- Admin API Routes ---

  app.get(api.admin.stats.path, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.admin.users.list.path, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.admin.withdrawals.list.path, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/ads/complete", async (req, res) => {
    try {
      const { userId, token, deviceId, ad_completed } = req.body;
      const user = await storage.getUserByTelegramId(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Anti-fraud: device check
      if (user.deviceId && user.deviceId !== deviceId) {
        return res.json({ success: false, message: "Fraud detected" });
      }

      // Cooldown check (60s)
      const now = new Date();
      if (user.lastAdWatchTime && (now.getTime() - new Date(user.lastAdWatchTime).getTime() < 60000)) {
        return res.json({ success: false, message: "Cooldown active" });
      }

      if (ad_completed) {
        const reward = 0.005; // Standard ad reward
        await storage.updateUser(user.id, {
          balance: (user.balance || 0) + reward,
          lastAdWatchTime: now,
          dailyAdsCount: (user.dailyAdsCount || 0) + 1,
          deviceId: deviceId || user.deviceId // Link device on first successful watch
        });
        
        res.json({ success: true, message: "🎉 Ad completed successfully. Reward will be credited shortly" });
      } else {
        res.json({ success: false });
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/verify", async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send("Missing token");
    
    const user = await storage.getUserByVerificationToken(token as string);
    if (!user || !user.verificationExpiresAt || user.verificationExpiresAt < new Date()) {
      return res.status(400).send("Invalid or expired token");
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ipString: string = (Array.isArray(ip) ? ip[0] : (ip as string | undefined)) || "unknown";
    await storage.updateUser(user.id, { 
      isVerified: true, 
      verificationToken: null, 
      verificationExpiresAt: null,
      ipAddress: ipString
    });

    res.send(`
      <html>
        <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <h1>✅ Verified!</h1>
          <p>You can now return to the bot.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
      </html>
    `);
  });

  app.patch(api.admin.withdrawals.updateStatus.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      const { status } = api.admin.withdrawals.updateStatus.input.parse(req.body);
      
      const withdrawal = await storage.updateWithdrawalStatus(id, status);
      if (!withdrawal) {
        return res.status(404).json({ message: "Withdrawal not found" });
      }
      
      res.json(withdrawal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
