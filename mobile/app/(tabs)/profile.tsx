import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert, Switch } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrading } from "@/lib/trading-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function ProfileScreen() {
  const colors = useColors();
  const { state, isLoading, reset } = useTrading();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);

  if (isLoading || !state) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Lade Profil-Daten...</Text>
      </ScreenContainer>
    );
  }

  const { portfolio, stats, trades, geneticAlgorithm } = state;
  const totalValue = portfolio.virtualBalance + portfolio.unrealizedPnL;
  const totalPnL = totalValue - portfolio.startingBalance;
  const totalPnLPercent = (totalPnL / portfolio.startingBalance) * 100;

  const handleReset = () => {
    Alert.alert(
      "Daten zurücksetzen",
      "Sind Sie sicher, dass Sie alle Trading-Daten zurücksetzen möchten? Dies kann nicht rückgängig gemacht werden.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Zurücksetzen",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await reset();
            Alert.alert("Erfolg", "Alle Daten wurden zurückgesetzt");
          },
        },
      ]
    );
  };

  const closedTrades = trades.filter((t) => t.status === "closed");
  const recentTrades = closedTrades.slice(0, 10);

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Profil</Text>
          <Text className="text-muted text-sm mt-1">Statistiken & Einstellungen</Text>
        </View>

        {/* Portfolio Summary */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center">
              <IconSymbol name="person.fill" size={32} color={colors.primary} />
            </View>
            <View className="ml-4">
              <Text className="text-foreground font-bold text-xl">Papertrader</Text>
              <Text className="text-muted text-sm">Aether Trader Pro</Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Portfolio-Wert</Text>
              <Text className="text-foreground font-bold text-lg">
                €{totalValue.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Gesamt P&L</Text>
              <Text
                className="font-bold text-lg"
                style={{ color: totalPnL >= 0 ? colors.success : colors.error }}
              >
                {totalPnL >= 0 ? "+" : ""}{totalPnLPercent.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Trading Statistics */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold text-lg mb-4">Trading-Statistiken</Text>

          <View className="flex-row flex-wrap gap-3">
            <View className="w-[47%] bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Trades gesamt</Text>
              <Text className="text-foreground font-bold text-2xl">{stats.totalTrades}</Text>
            </View>
            <View className="w-[47%] bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Win Rate</Text>
              <Text className="text-foreground font-bold text-2xl">
                {(stats.winRate * 100).toFixed(1)}%
              </Text>
            </View>
            <View className="w-[47%] bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Gewinnende Trades</Text>
              <Text className="text-success font-bold text-2xl">{stats.winningTrades}</Text>
            </View>
            <View className="w-[47%] bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Verlierende Trades</Text>
              <Text className="text-error font-bold text-2xl">{stats.losingTrades}</Text>
            </View>
            <View className="w-[47%] bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Bester Trade</Text>
              <Text className="text-success font-bold text-lg">
                +€{stats.bestTrade.toFixed(2)}
              </Text>
            </View>
            <View className="w-[47%] bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Schlechtester Trade</Text>
              <Text className="text-error font-bold text-lg">
                €{stats.worstTrade.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Advanced Metrics */}
          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-muted text-sm mb-3">Erweiterte Metriken</Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-muted text-xs">Sharpe Ratio</Text>
                <Text className="text-foreground font-semibold">{stats.sharpeRatio.toFixed(2)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted text-xs">Profit Factor</Text>
                <Text className="text-foreground font-semibold">{stats.profitFactor.toFixed(2)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted text-xs">Ø Gewinn</Text>
                <Text className="text-success font-semibold">€{stats.avgWin.toFixed(2)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-muted text-xs">Ø Verlust</Text>
                <Text className="text-error font-semibold">€{stats.avgLoss.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Learning Stats */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold text-lg mb-4">KI-Lernfortschritt</Text>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Generation</Text>
              <Text className="text-primary font-bold text-2xl">{geneticAlgorithm.generation}</Text>
            </View>
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Strategien</Text>
              <Text className="text-foreground font-bold text-2xl">{geneticAlgorithm.population.length}</Text>
            </View>
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Beste Fitness</Text>
              <Text className="text-foreground font-bold text-lg">{geneticAlgorithm.bestFitness.toFixed(3)}</Text>
            </View>
          </View>

          {geneticAlgorithm.activeStrategy && (
            <View className="mt-3 bg-primary/10 rounded-xl p-3">
              <Text className="text-primary text-xs font-mono">
                Aktiv: {geneticAlgorithm.activeStrategy.genomeId}
              </Text>
            </View>
          )}
        </View>

        {/* Recent Trades */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-foreground font-semibold text-lg">Letzte Trades</Text>
            <Text className="text-muted text-sm">{closedTrades.length} abgeschlossen</Text>
          </View>

          {recentTrades.length === 0 ? (
            <View className="items-center py-6">
              <IconSymbol name="chart.bar.fill" size={32} color={colors.muted} />
              <Text className="text-muted text-sm mt-2">Noch keine abgeschlossenen Trades</Text>
            </View>
          ) : (
            recentTrades.map((trade) => (
              <View key={trade.id} className="flex-row justify-between items-center py-3 border-b border-border">
                <View className="flex-row items-center">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: trade.pnl >= 0 ? colors.success + "20" : colors.error + "20" }}
                  >
                    <IconSymbol
                      name={trade.pnl >= 0 ? "arrow.up" : "arrow.down"}
                      size={16}
                      color={trade.pnl >= 0 ? colors.success : colors.error}
                    />
                  </View>
                  <View>
                    <Text className="text-foreground font-medium">{trade.symbol}</Text>
                    <Text className="text-muted text-xs">
                      {trade.side.toUpperCase()} • {new Date(trade.executedAt).toLocaleDateString("de-DE")}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className="font-semibold"
                    style={{ color: trade.pnl >= 0 ? colors.success : colors.error }}
                  >
                    {trade.pnl >= 0 ? "+" : ""}€{trade.pnl.toFixed(2)}
                  </Text>
                  <Text
                    className="text-xs"
                    style={{ color: trade.pnl >= 0 ? colors.success : colors.error }}
                  >
                    {trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Settings */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold text-lg mb-4">Einstellungen</Text>

          {/* Notifications */}
          <View className="flex-row justify-between items-center py-3 border-b border-border">
            <View className="flex-row items-center">
              <IconSymbol name="bell.fill" size={20} color={colors.muted} />
              <View className="ml-3">
                <Text className="text-foreground">Benachrichtigungen</Text>
                <Text className="text-muted text-xs">Trading-Alerts erhalten</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + "50" }}
              thumbColor={notificationsEnabled ? colors.primary : colors.muted}
            />
          </View>

          {/* Auto Trade */}
          <View className="flex-row justify-between items-center py-3 border-b border-border">
            <View className="flex-row items-center">
              <IconSymbol name="brain.head.profile" size={20} color={colors.muted} />
              <View className="ml-3">
                <Text className="text-foreground">Auto-Trading</Text>
                <Text className="text-muted text-xs">KI führt Trades automatisch aus</Text>
              </View>
            </View>
            <Switch
              value={autoTradeEnabled}
              onValueChange={setAutoTradeEnabled}
              trackColor={{ false: colors.border, true: colors.primary + "50" }}
              thumbColor={autoTradeEnabled ? colors.primary : colors.muted}
            />
          </View>

          {/* Reset Data */}
          <TouchableOpacity
            className="flex-row items-center py-3"
            style={{ opacity: 1 }}
            onPress={handleReset}
          >
            <IconSymbol name="trash.fill" size={20} color={colors.error} />
            <View className="ml-3">
              <Text className="text-error">Daten zurücksetzen</Text>
              <Text className="text-muted text-xs">Alle Trading-Daten löschen</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold text-lg mb-4">Über</Text>

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-muted">Version</Text>
              <Text className="text-foreground">1.0.0</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Build</Text>
              <Text className="text-foreground">Aether Trader Pro</Text>
            </View>
          </View>

          <View className="mt-4 pt-4 border-t border-border">
            <Text className="text-muted text-xs leading-5">
              Diese App kombiniert die besten Features aus den Original-Repositories:
              Aethel_Trader_Gens, Trade_Bot_Emergent und trading-bot-bolt. Sie verwendet
              genetische Algorithmen, Sentiment-Analyse und selbstlernende Trading-Regeln.
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View className="mx-5 mt-4 p-4 bg-warning/10 rounded-xl mb-4">
          <View className="flex-row items-start">
            <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
            <Text className="text-warning text-xs ml-2 flex-1">
              Dies ist ein Papertrading-Modus mit virtuellem Geld. Kein echtes Geld ist involviert.
              Die Ergebnisse sind simuliert und stellen keine Anlageberatung dar.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
