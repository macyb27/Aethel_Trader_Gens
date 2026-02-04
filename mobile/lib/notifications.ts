import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "@notification_settings";

export interface NotificationSettings {
  enabled: boolean;
  tradeAlerts: boolean;
  priceAlerts: boolean;
  newsAlerts: boolean;
  strategyAlerts: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  tradeAlerts: true,
  priceAlerts: true,
  newsAlerts: true,
  strategyAlerts: true,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
}

export async function sendTradeNotification(
  type: "executed" | "closed" | "alert",
  symbol: string,
  details: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.tradeAlerts) return;

  const titles: Record<string, string> = {
    executed: "Trade ausgeführt",
    closed: "Position geschlossen",
    alert: "Trading-Alert",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[type],
      body: `${symbol}: ${details}`,
      data: { type: "trade", symbol },
      sound: true,
    },
    trigger: null, // Immediate
  });
}

export async function sendPriceNotification(
  symbol: string,
  currentPrice: number,
  changePercent: number
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.priceAlerts) return;

  const direction = changePercent >= 0 ? "gestiegen" : "gefallen";
  const emoji = changePercent >= 0 ? "📈" : "📉";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emoji} ${symbol} Preisalarm`,
      body: `Preis ${direction} auf €${currentPrice.toFixed(2)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`,
      data: { type: "price", symbol },
      sound: true,
    },
    trigger: null,
  });
}

export async function sendNewsNotification(
  headline: string,
  sentiment: "bullish" | "bearish" | "neutral",
  impact: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.newsAlerts) return;

  const emojis: Record<string, string> = {
    bullish: "🟢",
    bearish: "🔴",
    neutral: "🟡",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${emojis[sentiment]} Markt-News (${impact})`,
      body: headline,
      data: { type: "news", sentiment },
      sound: true,
    },
    trigger: null,
  });
}

export async function sendStrategyNotification(
  type: "evolved" | "rule_created" | "fitness_improved",
  details: string
): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.strategyAlerts) return;

  const titles: Record<string, string> = {
    evolved: "🧬 Strategie evolviert",
    rule_created: "📋 Neue Trading-Regel",
    fitness_improved: "📊 Fitness verbessert",
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titles[type],
      body: details,
      data: { type: "strategy" },
      sound: true,
    },
    trigger: null,
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  if (Platform.OS === "web") return 0;
  return await Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.setBadgeCountAsync(count);
}
