import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrading } from "@/lib/trading-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function StrategyScreen() {
  const colors = useColors();
  const { state, isLoading, refresh, startEvolution, stopEvolution } = useTrading();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"rules" | "evolution" | "learning">("rules");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (isLoading || !state) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Lade Strategie-Daten...</Text>
      </ScreenContainer>
    );
  }

  const { rules, geneticAlgorithm, learningHistory } = state;
  const activeRules = rules.filter((r) => r.isActive);

  const handleToggleEvolution = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (geneticAlgorithm.isRunning) {
      stopEvolution();
    } else {
      startEvolution();
    }
  };

  const renderCondition = (condition: { type: string; operator: string; value: string | number }) => {
    const typeLabels: Record<string, string> = {
      sentiment: "Sentiment",
      trend: "Trend",
      volatility: "Volatilität",
      volume: "Volumen",
      price_change: "Preisänderung",
    };
    return `${typeLabels[condition.type] || condition.type} ${condition.operator} ${condition.value}`;
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
          <Text className="text-3xl font-bold text-foreground">Strategie</Text>
          <Text className="text-muted text-sm mt-1">KI-gesteuerte Trading-Intelligenz</Text>
        </View>

        {/* Active Strategy Card */}
        {geneticAlgorithm.activeStrategy && (
          <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-muted text-xs">Aktive Strategie</Text>
                <Text className="text-primary text-sm font-mono mt-1">
                  {geneticAlgorithm.activeStrategy.genomeId}
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: geneticAlgorithm.isRunning ? colors.success + "30" : colors.muted + "30" }}
              >
                <Text
                  style={{ color: geneticAlgorithm.isRunning ? colors.success : colors.muted }}
                  className="text-xs font-medium"
                >
                  Gen {geneticAlgorithm.generation}
                </Text>
              </View>
            </View>

            {/* Strategy Parameters */}
            <View className="mt-4 gap-3">
              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-muted text-xs">Risiko-Level</Text>
                  <Text className="text-foreground text-xs">
                    {(geneticAlgorithm.activeStrategy.riskLevel * 100).toFixed(0)}%
                  </Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${geneticAlgorithm.activeStrategy.riskLevel * 100}%`,
                      backgroundColor: geneticAlgorithm.activeStrategy.riskLevel > 0.7 ? colors.error : colors.primary,
                    }}
                  />
                </View>
              </View>

              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-muted text-xs">Zeithorizont</Text>
                  <Text className="text-foreground text-xs">
                    {geneticAlgorithm.activeStrategy.timeHorizon < 0.3 ? "Kurzfristig" : geneticAlgorithm.activeStrategy.timeHorizon < 0.7 ? "Mittelfristig" : "Langfristig"}
                  </Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${geneticAlgorithm.activeStrategy.timeHorizon * 100}%` }}
                  />
                </View>
              </View>

              <View>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-muted text-xs">Trend-Bias</Text>
                  <Text className="text-foreground text-xs">
                    {(geneticAlgorithm.activeStrategy.trendBias * 100).toFixed(0)}%
                  </Text>
                </View>
                <View className="h-2 bg-background rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${geneticAlgorithm.activeStrategy.trendBias * 100}%` }}
                  />
                </View>
              </View>
            </View>

            {/* Performance Metrics */}
            <View className="flex-row mt-4 pt-4 border-t border-border gap-4">
              <View className="flex-1 items-center">
                <Text className="text-muted text-xs">Win Rate</Text>
                <Text className="text-foreground font-semibold">
                  {(geneticAlgorithm.activeStrategy.winRate * 100).toFixed(1)}%
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-muted text-xs">Sharpe</Text>
                <Text className="text-foreground font-semibold">
                  {geneticAlgorithm.activeStrategy.sharpeRatio.toFixed(2)}
                </Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-muted text-xs">Max DD</Text>
                <Text className="text-foreground font-semibold">
                  {(geneticAlgorithm.activeStrategy.maxDrawdown * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Evolution Control */}
        <View className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-foreground font-semibold">Genetischer Algorithmus</Text>
              <Text className="text-muted text-xs mt-1">
                {geneticAlgorithm.isRunning ? "Strategien werden evolviert..." : "Evolution pausiert"}
              </Text>
            </View>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: geneticAlgorithm.isRunning ? colors.error + "20" : colors.success + "20",
                opacity: 1,
              }}
              onPress={handleToggleEvolution}
            >
              <View className="flex-row items-center">
                <IconSymbol
                  name={geneticAlgorithm.isRunning ? "pause.fill" : "play.fill"}
                  size={16}
                  color={geneticAlgorithm.isRunning ? colors.error : colors.success}
                />
                <Text
                  className="ml-2 font-medium"
                  style={{ color: geneticAlgorithm.isRunning ? colors.error : colors.success }}
                >
                  {geneticAlgorithm.isRunning ? "Stop" : "Start"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Evolution Stats */}
          <View className="flex-row mt-4 gap-3">
            <View className="flex-1 bg-background/50 rounded-lg p-3">
              <Text className="text-muted text-xs">Beste Fitness</Text>
              <Text className="text-primary font-bold text-lg">{geneticAlgorithm.bestFitness.toFixed(3)}</Text>
            </View>
            <View className="flex-1 bg-background/50 rounded-lg p-3">
              <Text className="text-muted text-xs">Ø Fitness</Text>
              <Text className="text-foreground font-bold text-lg">{geneticAlgorithm.avgFitness.toFixed(3)}</Text>
            </View>
            <View className="flex-1 bg-background/50 rounded-lg p-3">
              <Text className="text-muted text-xs">Diversität</Text>
              <Text className="text-foreground font-bold text-lg">{geneticAlgorithm.diversity.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View className="mx-5 mt-4 flex-row bg-surface rounded-xl p-1 border border-border">
          {(["rules", "evolution", "learning"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              className="flex-1 py-2 rounded-lg items-center"
              style={{
                backgroundColor: activeTab === tab ? colors.primary + "20" : "transparent",
                opacity: 1,
              }}
              onPress={() => {
                setActiveTab(tab);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: activeTab === tab ? colors.primary : colors.muted }}
              >
                {tab === "rules" ? "Regeln" : tab === "evolution" ? "Population" : "Lernen"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "rules" && (
          <View className="mx-5 mt-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-foreground font-semibold">Trading-Regeln</Text>
              <Text className="text-muted text-sm">{activeRules.length} aktiv</Text>
            </View>

            {rules.map((rule) => (
              <View
                key={rule.id}
                className="bg-surface rounded-xl p-4 border border-border mb-3"
                style={{ opacity: rule.isActive ? 1 : 0.5 }}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{rule.name}</Text>
                    <Text className="text-muted text-xs mt-1">{rule.description}</Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded"
                    style={{
                      backgroundColor: rule.action === "buy" ? colors.success + "20" : rule.action === "sell" ? colors.error + "20" : colors.muted + "20",
                    }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{
                        color: rule.action === "buy" ? colors.success : rule.action === "sell" ? colors.error : colors.muted,
                      }}
                    >
                      {rule.action.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Conditions */}
                <View className="mt-3 bg-background/50 rounded-lg p-3">
                  <Text className="text-muted text-xs mb-2">Bedingungen:</Text>
                  {rule.conditions.map((condition, idx) => (
                    <Text key={idx} className="text-foreground text-sm">
                      • {renderCondition(condition)}
                    </Text>
                  ))}
                </View>

                {/* Stats */}
                <View className="flex-row mt-3 pt-3 border-t border-border gap-4">
                  <View>
                    <Text className="text-muted text-xs">Erfolgsrate</Text>
                    <Text className="text-foreground font-medium">{(rule.successRate * 100).toFixed(1)}%</Text>
                  </View>
                  <View>
                    <Text className="text-muted text-xs">Konfidenz</Text>
                    <Text className="text-foreground font-medium">{(rule.confidence * 100).toFixed(0)}%</Text>
                  </View>
                  <View>
                    <Text className="text-muted text-xs">Trades</Text>
                    <Text className="text-foreground font-medium">{rule.totalTrades}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "evolution" && (
          <View className="mx-5 mt-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-foreground font-semibold">Population</Text>
              <Text className="text-muted text-sm">{geneticAlgorithm.population.length} Genome</Text>
            </View>

            {geneticAlgorithm.population.slice(0, 10).map((genome, idx) => (
              <View
                key={genome.genomeId}
                className="bg-surface rounded-xl p-4 border border-border mb-2"
                style={{ borderColor: genome.isActive ? colors.primary : colors.border }}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <Text className="text-muted text-sm mr-2">#{idx + 1}</Text>
                    <Text className="text-primary text-xs font-mono">{genome.genomeId.slice(0, 20)}...</Text>
                  </View>
                  {genome.isActive && (
                    <View className="bg-primary/20 px-2 py-1 rounded">
                      <Text className="text-primary text-xs">Aktiv</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row mt-2 gap-4">
                  <View>
                    <Text className="text-muted text-xs">Fitness</Text>
                    <Text className="text-foreground font-medium">
                      {(0.35 * genome.sharpeRatio / 4 + 0.25 * (1 - genome.maxDrawdown) + 0.2 * genome.winRate + 0.2 * genome.profitFactor / 3).toFixed(3)}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-muted text-xs">Win Rate</Text>
                    <Text className="text-foreground font-medium">{(genome.winRate * 100).toFixed(1)}%</Text>
                  </View>
                  <View>
                    <Text className="text-muted text-xs">Sharpe</Text>
                    <Text className="text-foreground font-medium">{genome.sharpeRatio.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "learning" && (
          <View className="mx-5 mt-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-foreground font-semibold">Lernverlauf</Text>
              <Text className="text-muted text-sm">{learningHistory.length} Einträge</Text>
            </View>

            {learningHistory.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 border border-border items-center">
                <IconSymbol name="brain.head.profile" size={32} color={colors.muted} />
                <Text className="text-muted text-sm mt-2">Noch keine Lerneinträge</Text>
                <Text className="text-muted text-xs mt-1 text-center">
                  Das System lernt automatisch aus Ihren Trades
                </Text>
              </View>
            ) : (
              learningHistory.slice(0, 20).map((entry) => (
                <View key={entry.id} className="bg-surface rounded-xl p-4 border border-border mb-2">
                  <View className="flex-row items-start">
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{
                        backgroundColor:
                          entry.type === "rule_created" ? colors.success + "20" :
                          entry.type === "strategy_evolved" ? colors.primary + "20" :
                          colors.warning + "20",
                      }}
                    >
                      <IconSymbol
                        name={
                          entry.type === "rule_created" ? "plus.circle.fill" :
                          entry.type === "strategy_evolved" ? "arrow.clockwise" :
                          "chart.line.uptrend.xyaxis"
                        }
                        size={16}
                        color={
                          entry.type === "rule_created" ? colors.success :
                          entry.type === "strategy_evolved" ? colors.primary :
                          colors.warning
                        }
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground text-sm">{entry.description}</Text>
                      <Text className="text-muted text-xs mt-1">
                        {new Date(entry.timestamp).toLocaleString("de-DE")}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
