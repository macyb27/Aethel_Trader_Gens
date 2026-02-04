import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrading } from "@/lib/trading-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const TRADING_PAIRS = [
  { symbol: "BTC/EUR", name: "Bitcoin", basePrice: 42000 },
  { symbol: "ETH/EUR", name: "Ethereum", basePrice: 2200 },
  { symbol: "SOL/EUR", name: "Solana", basePrice: 95 },
  { symbol: "XRP/EUR", name: "Ripple", basePrice: 0.55 },
];

const LEVERAGE_OPTIONS = [1, 2, 5, 10];
const AMOUNT_PRESETS = [0.25, 0.5, 0.75, 1.0];

export default function TradeScreen() {
  const colors = useColors();
  const { state, isLoading, buy, sell } = useTrading();
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);

  if (isLoading || !state) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Lade Trading-Daten...</Text>
      </ScreenContainer>
    );
  }

  const { portfolio } = state;
  const currentPrice = selectedPair.basePrice * (1 + (Math.random() - 0.5) * 0.02);
  const maxBuyAmount = portfolio.virtualBalance / currentPrice;
  const position = portfolio.positions.find((p) => p.symbol === selectedPair.symbol);
  const maxSellAmount = position?.size || 0;

  const handleAmountPreset = (preset: number) => {
    const maxAmount = side === "buy" ? maxBuyAmount : maxSellAmount;
    setAmount((maxAmount * preset).toFixed(4));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleExecuteTrade = async () => {
    const size = parseFloat(amount);
    if (isNaN(size) || size <= 0) {
      Alert.alert("Fehler", "Bitte geben Sie eine gültige Menge ein");
      return;
    }

    if (side === "buy" && size * currentPrice > portfolio.virtualBalance) {
      Alert.alert("Fehler", "Nicht genügend Guthaben für diesen Trade");
      return;
    }

    if (side === "sell" && size > maxSellAmount) {
      Alert.alert("Fehler", "Nicht genügend Position zum Verkaufen");
      return;
    }

    setIsExecuting(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const result = side === "buy"
        ? await buy(selectedPair.symbol, size, leverage)
        : await sell(selectedPair.symbol, size);

      if (result.success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert("Erfolg", result.message);
        setAmount("");
      } else {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert("Fehler", result.message);
      }
    } catch (error) {
      Alert.alert("Fehler", "Trade konnte nicht ausgeführt werden");
    } finally {
      setIsExecuting(false);
    }
  };

  const estimatedCost = parseFloat(amount || "0") * currentPrice;
  const estimatedPnL = side === "sell" && position
    ? (currentPrice - position.entryPrice) * parseFloat(amount || "0") * leverage
    : 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Trade</Text>
          <Text className="text-muted text-sm mt-1">Papertrading - Kein echtes Geld</Text>
        </View>

        {/* Balance Card */}
        <View className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-muted text-xs">Verfügbares Guthaben</Text>
              <Text className="text-2xl font-bold text-foreground">
                €{portfolio.virtualBalance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="bg-primary/20 rounded-full p-2">
              <IconSymbol name="eurosign.circle.fill" size={24} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Trading Pair Selection */}
        <View className="mx-5 mt-4">
          <Text className="text-foreground font-semibold mb-3">Handelspaar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {TRADING_PAIRS.map((pair) => (
                <TouchableOpacity
                  key={pair.symbol}
                  className="px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: selectedPair.symbol === pair.symbol ? colors.primary + "20" : colors.surface,
                    borderColor: selectedPair.symbol === pair.symbol ? colors.primary : colors.border,
                    opacity: 1,
                  }}
                  onPress={() => {
                    setSelectedPair(pair);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: selectedPair.symbol === pair.symbol ? colors.primary : colors.foreground }}
                  >
                    {pair.symbol}
                  </Text>
                  <Text className="text-muted text-xs">{pair.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Current Price */}
        <View className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-muted text-xs">Aktueller Preis</Text>
              <Text className="text-2xl font-bold text-foreground">
                €{currentPrice.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="arrow.up.right" size={16} color={colors.success} />
              <Text className="text-success text-sm ml-1">+2.4%</Text>
            </View>
          </View>
        </View>

        {/* Buy/Sell Toggle */}
        <View className="mx-5 mt-4 flex-row bg-surface rounded-xl p-1 border border-border">
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: side === "buy" ? colors.primary : "transparent",
              opacity: 1,
            }}
            onPress={() => {
              setSide("buy");
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: side === "buy" ? colors.background : colors.muted }}
            >
              Kaufen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: side === "sell" ? colors.secondary : "transparent",
              opacity: 1,
            }}
            onPress={() => {
              setSide("sell");
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
          >
            <Text
              className="font-semibold"
              style={{ color: side === "sell" ? colors.background : colors.muted }}
            >
              Verkaufen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View className="mx-5 mt-4">
          <Text className="text-foreground font-semibold mb-2">Menge</Text>
          <View className="bg-surface rounded-xl border border-border p-4">
            <TextInput
              className="text-2xl font-bold text-foreground"
              placeholder="0.0000"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              returnKeyType="done"
            />
            <Text className="text-muted text-xs mt-1">
              Max: {side === "buy" ? maxBuyAmount.toFixed(4) : maxSellAmount.toFixed(4)} {selectedPair.symbol.split("/")[0]}
            </Text>
          </View>

          {/* Amount Presets */}
          <View className="flex-row gap-2 mt-3">
            {AMOUNT_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                className="flex-1 py-2 rounded-lg bg-surface border border-border items-center"
                style={{ opacity: 1 }}
                onPress={() => handleAmountPreset(preset)}
              >
                <Text className="text-foreground text-sm font-medium">{preset * 100}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Leverage Selection (only for buy) */}
        {side === "buy" && (
          <View className="mx-5 mt-4">
            <Text className="text-foreground font-semibold mb-2">Hebel</Text>
            <View className="flex-row gap-2">
              {LEVERAGE_OPTIONS.map((lev) => (
                <TouchableOpacity
                  key={lev}
                  className="flex-1 py-3 rounded-xl border items-center"
                  style={{
                    backgroundColor: leverage === lev ? colors.primary + "20" : colors.surface,
                    borderColor: leverage === lev ? colors.primary : colors.border,
                    opacity: 1,
                  }}
                  onPress={() => {
                    setLeverage(lev);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text
                    className="font-semibold"
                    style={{ color: leverage === lev ? colors.primary : colors.foreground }}
                  >
                    {lev}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {leverage > 1 && (
              <View className="flex-row items-center mt-2">
                <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.warning} />
                <Text className="text-warning text-xs ml-1">
                  Höherer Hebel = Höheres Risiko
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Order Summary */}
        <View className="mx-5 mt-4 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-foreground font-semibold mb-3">Zusammenfassung</Text>

          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-muted">Typ</Text>
            <Text className="text-foreground">{side === "buy" ? "Kauf" : "Verkauf"} (Market)</Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-muted">Menge</Text>
            <Text className="text-foreground">
              {amount || "0"} {selectedPair.symbol.split("/")[0]}
            </Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-muted">Preis</Text>
            <Text className="text-foreground">€{currentPrice.toFixed(2)}</Text>
          </View>

          {side === "buy" && (
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted">Hebel</Text>
              <Text className="text-foreground">{leverage}x</Text>
            </View>
          )}

          <View className="flex-row justify-between py-2">
            <Text className="text-muted">{side === "buy" ? "Kosten" : "Erlös"}</Text>
            <Text className="text-foreground font-semibold">
              €{estimatedCost.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>

          {side === "sell" && position && parseFloat(amount) > 0 && (
            <View className="flex-row justify-between py-2 border-t border-border mt-2">
              <Text className="text-muted">Geschätzter P&L</Text>
              <Text
                className="font-semibold"
                style={{ color: estimatedPnL >= 0 ? colors.success : colors.error }}
              >
                {estimatedPnL >= 0 ? "+" : ""}€{estimatedPnL.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Execute Button */}
        <View className="mx-5 mt-6">
          <TouchableOpacity
            className="py-4 rounded-xl items-center"
            style={{
              backgroundColor: side === "buy" ? colors.primary : colors.secondary,
              opacity: isExecuting ? 0.7 : 1,
            }}
            onPress={handleExecuteTrade}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-background font-bold text-lg">
                {side === "buy" ? "Kaufen" : "Verkaufen"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Risk Disclaimer */}
        <View className="mx-5 mt-4 p-4 bg-warning/10 rounded-xl">
          <View className="flex-row items-start">
            <IconSymbol name="info.circle.fill" size={16} color={colors.warning} />
            <Text className="text-warning text-xs ml-2 flex-1">
              Dies ist ein Papertrading-Modus mit virtuellem Geld. Kein echtes Geld ist involviert.
              Perfekt zum Lernen und Testen von Strategien.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
