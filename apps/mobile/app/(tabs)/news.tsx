import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Alert } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrading } from "@/lib/trading-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type ImpactFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type SentimentFilter = "ALL" | "BULLISH" | "BEARISH" | "NEUTRAL";

export default function NewsScreen() {
  const colors = useColors();
  const { state, isLoading, refresh, addNews } = useTrading();
  const [refreshing, setRefreshing] = useState(false);
  const [impactFilter, setImpactFilter] = useState<ImpactFilter>("ALL");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("ALL");
  const [showAddNews, setShowAddNews] = useState(false);
  const [newHeadline, setNewHeadline] = useState("");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (isLoading || !state) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Lade News-Daten...</Text>
      </ScreenContainer>
    );
  }

  const { news, aggregatedSentiment } = state;

  // Filter news
  const filteredNews = news.filter((item) => {
    if (impactFilter !== "ALL" && item.sentiment.impact !== impactFilter) return false;
    if (sentimentFilter === "BULLISH" && item.sentiment.score <= 0.2) return false;
    if (sentimentFilter === "BEARISH" && item.sentiment.score >= -0.2) return false;
    if (sentimentFilter === "NEUTRAL" && (item.sentiment.score > 0.2 || item.sentiment.score < -0.2)) return false;
    return true;
  });

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return colors.success;
    if (score < -0.3) return colors.error;
    return colors.warning;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.5) return "Stark Bullish";
    if (score > 0.2) return "Bullish";
    if (score > -0.2) return "Neutral";
    if (score > -0.5) return "Bearish";
    return "Stark Bearish";
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "CRITICAL": return colors.error;
      case "HIGH": return colors.warning;
      case "MEDIUM": return colors.primary;
      default: return colors.muted;
    }
  };

  const handleAddNews = async () => {
    if (!newHeadline.trim()) {
      Alert.alert("Fehler", "Bitte geben Sie eine Schlagzeile ein");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    await addNews(newHeadline, "Benutzer", ["BTC", "ETH"]);
    setNewHeadline("");
    setShowAddNews(false);
    Alert.alert("Erfolg", "News hinzugefügt und analysiert");
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    return `vor ${diffDays} Tagen`;
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
          <Text className="text-3xl font-bold text-foreground">News</Text>
          <Text className="text-muted text-sm mt-1">Marktnachrichten mit Sentiment-Analyse</Text>
        </View>

        {/* Aggregated Sentiment Card */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-muted text-xs">Aggregierte Marktstimmung</Text>
              <Text className="text-2xl font-bold text-foreground mt-1">
                {getSentimentLabel(aggregatedSentiment)}
              </Text>
            </View>
            <View
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: getSentimentColor(aggregatedSentiment) + "20" }}
            >
              <Text
                className="text-xl font-bold"
                style={{ color: getSentimentColor(aggregatedSentiment) }}
              >
                {aggregatedSentiment >= 0 ? "+" : ""}{(aggregatedSentiment * 100).toFixed(0)}
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
            <Text className="text-muted text-xs">-100 (Bearish)</Text>
            <Text className="text-muted text-xs">0</Text>
            <Text className="text-muted text-xs">+100 (Bullish)</Text>
          </View>
        </View>

        {/* Add News Button */}
        <View className="mx-5 mt-4">
          <TouchableOpacity
            className="bg-surface rounded-xl p-4 border border-border flex-row items-center justify-center"
            style={{ opacity: 1 }}
            onPress={() => setShowAddNews(!showAddNews)}
          >
            <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
            <Text className="text-primary font-medium ml-2">News simulieren</Text>
          </TouchableOpacity>

          {showAddNews && (
            <View className="mt-3 bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground font-semibold mb-2">Schlagzeile eingeben</Text>
              <TextInput
                className="bg-background rounded-lg p-3 text-foreground"
                placeholder="z.B. Bitcoin erreicht neues Allzeithoch..."
                placeholderTextColor={colors.muted}
                value={newHeadline}
                onChangeText={setNewHeadline}
                multiline
                returnKeyType="done"
              />
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg bg-background items-center"
                  style={{ opacity: 1 }}
                  onPress={() => setShowAddNews(false)}
                >
                  <Text className="text-muted font-medium">Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 py-3 rounded-lg bg-primary items-center"
                  style={{ opacity: 1 }}
                  onPress={handleAddNews}
                >
                  <Text className="text-background font-medium">Analysieren</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Filters */}
        <View className="mx-5 mt-4">
          <Text className="text-foreground font-semibold mb-2">Filter</Text>
          
          {/* Impact Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as ImpactFilter[]).map((impact) => (
                <TouchableOpacity
                  key={impact}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: impactFilter === impact ? colors.primary + "20" : colors.surface,
                    borderColor: impactFilter === impact ? colors.primary : colors.border,
                    opacity: 1,
                  }}
                  onPress={() => {
                    setImpactFilter(impact);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{ color: impactFilter === impact ? colors.primary : colors.muted }}
                  >
                    {impact === "ALL" ? "Alle" : impact}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Sentiment Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
            <View className="flex-row gap-2">
              {(["ALL", "BULLISH", "NEUTRAL", "BEARISH"] as SentimentFilter[]).map((sentiment) => (
                <TouchableOpacity
                  key={sentiment}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: sentimentFilter === sentiment ? colors.primary + "20" : colors.surface,
                    borderColor: sentimentFilter === sentiment ? colors.primary : colors.border,
                    opacity: 1,
                  }}
                  onPress={() => {
                    setSentimentFilter(sentiment);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Text
                    className="text-sm"
                    style={{ color: sentimentFilter === sentiment ? colors.primary : colors.muted }}
                  >
                    {sentiment === "ALL" ? "Alle" : sentiment === "BULLISH" ? "Bullish" : sentiment === "BEARISH" ? "Bearish" : "Neutral"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* News List */}
        <View className="mx-5 mt-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-foreground font-semibold">Nachrichten</Text>
            <Text className="text-muted text-sm">{filteredNews.length} Artikel</Text>
          </View>

          {filteredNews.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border items-center">
              <IconSymbol name="newspaper.fill" size={32} color={colors.muted} />
              <Text className="text-muted text-sm mt-2">Keine Nachrichten gefunden</Text>
              <Text className="text-muted text-xs mt-1">Versuchen Sie andere Filter</Text>
            </View>
          ) : (
            filteredNews.map((item) => (
              <View key={item.id} className="bg-surface rounded-xl p-4 border border-border mb-3">
                {/* Header */}
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center">
                    <Text className="text-muted text-xs">{item.source}</Text>
                    <Text className="text-muted text-xs mx-2">•</Text>
                    <Text className="text-muted text-xs">{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: getImpactColor(item.sentiment.impact) + "20" }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: getImpactColor(item.sentiment.impact) }}
                    >
                      {item.sentiment.impact}
                    </Text>
                  </View>
                </View>

                {/* Headline */}
                <Text className="text-foreground font-semibold mt-2 leading-5">
                  {item.headline}
                </Text>

                {/* Summary */}
                {item.summary && (
                  <Text className="text-muted text-sm mt-2 leading-5">
                    {item.summary}
                  </Text>
                )}

                {/* Sentiment Analysis */}
                <View className="mt-3 pt-3 border-t border-border">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <IconSymbol
                        name={item.sentiment.score > 0.2 ? "arrow.up.right" : item.sentiment.score < -0.2 ? "arrow.down.right" : "arrow.left.arrow.right"}
                        size={16}
                        color={getSentimentColor(item.sentiment.score)}
                      />
                      <Text
                        className="ml-2 font-medium"
                        style={{ color: getSentimentColor(item.sentiment.score) }}
                      >
                        {getSentimentLabel(item.sentiment.score)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-muted text-xs mr-2">Konfidenz:</Text>
                      <Text className="text-foreground text-xs font-medium">
                        {(item.sentiment.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Sentiment Score Bar */}
                  <View className="mt-2">
                    <View className="h-2 bg-background rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${((item.sentiment.score + 1) / 2) * 100}%`,
                          backgroundColor: getSentimentColor(item.sentiment.score),
                        }}
                      />
                    </View>
                  </View>

                  {/* Keywords */}
                  {item.sentiment.keywords.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-2">
                      {item.sentiment.keywords.slice(0, 5).map((keyword, idx) => (
                        <View key={idx} className="bg-background/50 px-2 py-1 rounded">
                          <Text className="text-muted text-xs">{keyword}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Symbols */}
                <View className="flex-row gap-2 mt-3">
                  {item.symbols.map((symbol) => (
                    <View key={symbol} className="bg-primary/10 px-2 py-1 rounded">
                      <Text className="text-primary text-xs font-medium">{symbol}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Info Card */}
        <View className="mx-5 mt-4 p-4 bg-primary/10 rounded-xl">
          <View className="flex-row items-start">
            <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
            <Text className="text-primary text-xs ml-2 flex-1">
              Die Sentiment-Analyse verwendet Keyword-Erkennung und NLP-Techniken, um die Marktstimmung
              aus Nachrichtenartikeln zu extrahieren. Die Ergebnisse beeinflussen die Trading-Strategien.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
