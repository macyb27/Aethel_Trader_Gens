import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrading } from "@/lib/trading-context";
import { useColors } from "@/hooks/use-colors";

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, isLoading, refresh } = useTrading();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (isLoading || !state) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Lade Trading-Daten...</Text>
      </ScreenContainer>
    );
  }

  const { portfolio, stats, aggregatedSentiment, geneticAlgorithm } = state;
  const totalValue = portfolio.virtualBalance + portfolio.unrealizedPnL;
  const totalPnL = totalValue - portfolio.startingBalance;
  const totalPnLPercent = (totalPnL / portfolio.startingBalance) * 100;

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return colors.success;
    if (sentiment < -0.3) return colors.error;
    return colors.warning;
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.5) return "Stark Bullish";
    if (sentiment > 0.2) return "Bullish";
    if (sentiment > -0.2) return "Neutral";
    if (sentiment > -0.5) return "Bearish";
    return "Stark Bearish";
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-muted text-sm mt-1">Aether Trader Pro - Papertrading</Text>
        </View>

        {/* Portfolio Card */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-muted text-sm">Virtuelles Portfolio</Text>
              <Text className="text-4xl font-bold text-foreground mt-1">
                €{totalValue.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="bg-primary/20 rounded-full p-3">
              <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.primary} />
            </View>
          </View>

          <View className="flex-row mt-4 gap-4">
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Unrealisiert</Text>
              <Text
                className="text-lg font-semibold mt-1"
                style={{ color: portfolio.unrealizedPnL >= 0 ? colors.success : colors.error }}
              >
                {portfolio.unrealizedPnL >= 0 ? "+" : ""}€{portfolio.unrealizedPnL.toFixed(2)}
              </Text>
            </View>
            <View className="flex-1 bg-background/50 rounded-xl p-3">
              <Text className="text-muted text-xs">Realisiert</Text>
              <Text
                className="text-lg font-semibold mt-1"
                style={{ color: portfolio.realizedPnL >= 0 ? colors.success : colors.error }}
              >
                {portfolio.realizedPnL >= 0 ? "+" : ""}€{portfolio.realizedPnL.toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-4 pt-4 border-t border-border">
            <IconSymbol
              name={totalPnL >= 0 ? "arrow.up.right" : "arrow.down.right"}
              size={20}
              color={totalPnL >= 0 ? colors.success : colors.error}
            />
            <Text
              className="text-base font-semibold ml-2"
              style={{ color: totalPnL >= 0 ? colors.success : colors.error }}
            >
              {totalPnL >= 0 ? "+" : ""}{totalPnLPercent.toFixed(2)}% Gesamt
            </Text>
            <Text className="text-muted text-sm ml-2">
              (Start: €{portfolio.startingBalance.toLocaleString("de-DE")})
            </Text>
          </View>
        </View>

        {/* Market Sentiment Card */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row justify-between items-center">
            <Text className="text-foreground font-semibold text-base">Marktstimmung</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getSentimentColor(aggregatedSentiment) + "30" }}
            >
              <Text style={{ color: getSentimentColor(aggregatedSentiment) }} className="text-sm font-medium">
                {getSentimentLabel(aggregatedSentiment)}
              </Text>
            </View>
          </View>

          {/* Sentiment Bar */}
          <View className="mt-4">
            <View className="h-3 bg-background rounded-full overflow-hidden flex-row">
              <View className="flex-1 bg-error/50" />
              <View className="flex-1 bg-warning/50" />
              <View className="flex-1 bg-success/50" />
            </View>
            <View
              className="absolute w-4 h-4 bg-foreground rounded-full -top-0.5 border-2"
              style={{
                left: `${((aggregatedSentiment + 1) / 2) * 100}%`,
                marginLeft: -8,
                borderColor: getSentimentColor(aggregatedSentiment),
              }}
            />
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-muted text-xs">Bearish</Text>
            <Text className="text-muted text-xs">Neutral</Text>
            <Text className="text-muted text-xs">Bullish</Text>
          </View>
        </View>

        {/* Active Strategy Card */}
        {geneticAlgorithm.activeStrategy && (
          <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row justify-between items-center">
              <Text className="text-foreground font-semibold text-base">Aktive Strategie</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: geneticAlgorithm.isRunning ? colors.success + "30" : colors.muted + "30" }}
              >
                <Text
                  style={{ color: geneticAlgorithm.isRunning ? colors.success : colors.muted }}
                  className="text-xs font-medium"
                >
                  {geneticAlgorithm.isRunning ? "Evolviert" : "Pausiert"}
                </Text>
              </View>
            </View>

            <View className="mt-3 bg-background/50 rounded-xl p-3">
              <Text className="text-primary text-xs font-mono">
                {geneticAlgorithm.activeStrategy.genomeId}
              </Text>
              <Text className="text-muted text-xs mt-1">
                Generation {geneticAlgorithm.generation} • Fitness: {geneticAlgorithm.bestFitness.toFixed(3)}
              </Text>
            </View>

            <View className="flex-row mt-3 gap-2">
              <View className="flex-1">
                <Text className="text-muted text-xs">Risiko</Text>
                <View className="h-2 bg-background rounded-full mt-1 overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${geneticAlgorithm.activeStrategy.riskLevel * 100}%` }}
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-muted text-xs">Zeithorizont</Text>
                <View className="h-2 bg-background rounded-full mt-1 overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${geneticAlgorithm.activeStrategy.timeHorizon * 100}%` }}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View className="mx-5 mt-4 flex-row gap-3">
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-xs">Win Rate</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">
              {(stats.winRate * 100).toFixed(1)}%
            </Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-xs">Trades</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{stats.totalTrades}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-muted text-xs">Sharpe</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">
              {stats.sharpeRatio.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Open Positions */}
        <View className="mx-5 mt-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-foreground font-semibold text-base">Offene Positionen</Text>
            <Text className="text-muted text-sm">{portfolio.positions.length} aktiv</Text>
          </View>

          {portfolio.positions.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border items-center">
              <IconSymbol name="chart.bar.fill" size={32} color={colors.muted} />
              <Text className="text-muted text-sm mt-2">Keine offenen Positionen</Text>
              <TouchableOpacity
                className="mt-4 bg-primary px-6 py-3 rounded-full"
                style={{ opacity: 1 }}
                onPress={() => router.push("/(tabs)/trade")}
              >
                <Text className="text-background font-semibold">Ersten Trade starten</Text>
              </TouchableOpacity>
            </View>
          ) : (
            portfolio.positions.map((position) => (
              <View
                key={position.id}
                className="bg-surface rounded-xl p-4 border border-border mb-2"
              >
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-foreground font-semibold">{position.symbol}</Text>
                    <Text className="text-muted text-xs mt-1">
                      {position.side.toUpperCase()} • {position.leverage}x Hebel
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="font-semibold"
                      style={{ color: position.unrealizedPnL >= 0 ? colors.success : colors.error }}
                    >
                      {position.unrealizedPnL >= 0 ? "+" : ""}€{position.unrealizedPnL.toFixed(2)}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{ color: position.unrealizedPnL >= 0 ? colors.success : colors.error }}
                    >
                      {position.unrealizedPnLPercent >= 0 ? "+" : ""}{position.unrealizedPnLPercent.toFixed(2)}%
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-3 pt-3 border-t border-border">
                  <View className="flex-1">
                    <Text className="text-muted text-xs">Einstieg</Text>
                    <Text className="text-foreground text-sm">€{position.entryPrice.toFixed(2)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-muted text-xs">Aktuell</Text>
                    <Text className="text-foreground text-sm">€{position.currentPrice.toFixed(2)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-muted text-xs">Größe</Text>
                    <Text className="text-foreground text-sm">{position.size}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-5 mt-4 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary rounded-xl p-4 items-center"
            style={{ opacity: 1 }}
            onPress={() => router.push("/(tabs)/trade")}
          >
            <IconSymbol name="arrow.up" size={24} color={colors.background} />
            <Text className="text-background font-semibold mt-2">Kaufen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-secondary rounded-xl p-4 items-center"
            style={{ opacity: 1 }}
            onPress={() => router.push("/(tabs)/trade")}
          >
            <IconSymbol name="arrow.down" size={24} color={colors.background} />
            <Text className="text-background font-semibold mt-2">Verkaufen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-surface rounded-xl p-4 items-center border border-border"
            style={{ opacity: 1 }}
            onPress={() => router.push("/strategy")}
          >
            <IconSymbol name="brain.head.profile" size={24} color={colors.primary} />
            <Text className="text-foreground font-semibold mt-2">Strategie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
