import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrading } from "@/lib/trading-context";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export default function MLTrainingScreen() {
  const colors = useColors();
  const { state, isLoading, mlMetadata, isTrainingML, trainingProgress, trainMLModel, getMLPrediction } = useTrading();
  const [prediction, setPrediction] = useState<any>(null);

  if (isLoading || !state) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Lade ML-Daten...</Text>
      </ScreenContainer>
    );
  }

  const handleTrainModel = async () => {
    if (state.trades.length < 30) {
      Alert.alert(
        "Nicht genug Daten",
        "Mindestens 30 Trades erforderlich für das Training. Führe mehr Trades aus, um das Modell zu trainieren."
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await trainMLModel(50);
      Alert.alert("Training abgeschlossen", "Das Transfer Learning Modell wurde erfolgreich trainiert!");
    } catch (error: any) {
      Alert.alert("Training fehlgeschlagen", error.message);
    }
  };

  const handleGetPrediction = async () => {
    if (state.trades.length < 20) {
      Alert.alert(
        "Nicht genug Daten",
        "Mindestens 20 Trades erforderlich für Vorhersagen."
      );
      return;
    }

    if (!mlMetadata || mlMetadata.trainingEpochs === 0) {
      Alert.alert(
        "Modell nicht trainiert",
        "Bitte trainiere das Modell zuerst, bevor du Vorhersagen machst."
      );
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const pred = await getMLPrediction();
      setPrediction(pred);
    } catch (error: any) {
      Alert.alert("Vorhersage fehlgeschlagen", error.message);
    }
  };

  const isTrained = mlMetadata && mlMetadata.trainingEpochs > 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-3xl font-bold text-foreground">Transfer Learning</Text>
          <Text className="text-muted text-sm mt-1">KI-gestützte Preisvorhersage mit TensorFlow.js</Text>
        </View>

        {/* Model Status Card */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground font-semibold text-lg">Modell-Status</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: isTrained ? colors.success + "30" : colors.warning + "30" }}
            >
              <Text
                style={{ color: isTrained ? colors.success : colors.warning }}
                className="text-xs font-medium"
              >
                {isTrained ? "Trainiert" : "Nicht trainiert"}
              </Text>
            </View>
          </View>

          {mlMetadata ? (
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-muted">Version</Text>
                <Text className="text-foreground">{mlMetadata.version}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Training-Epochen</Text>
                <Text className="text-foreground">{mlMetadata.trainingEpochs}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Genauigkeit</Text>
                <Text className="text-foreground">{(mlMetadata.accuracy * 100).toFixed(2)}%</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Verlust</Text>
                <Text className="text-foreground">{mlMetadata.loss.toFixed(4)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Trainingssamples</Text>
                <Text className="text-foreground">{mlMetadata.samplesCount}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Trainiert am</Text>
                <Text className="text-foreground text-xs">
                  {new Date(mlMetadata.trainedAt).toLocaleString("de-DE")}
                </Text>
              </View>
            </View>
          ) : (
            <View className="items-center py-4">
              <IconSymbol name="brain.head.profile" size={32} color={colors.muted} />
              <Text className="text-muted text-center mt-2">Modell noch nicht initialisiert</Text>
            </View>
          )}
        </View>

        {/* Training Progress */}
        {isTrainingML && trainingProgress && (
          <View className="mx-5 mt-4 bg-primary/10 rounded-2xl p-5 border border-primary">
            <View className="flex-row items-center mb-3">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-primary font-semibold ml-2">Training läuft...</Text>
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-primary">Epoche</Text>
                <Text className="text-primary font-mono">
                  {trainingProgress.epoch} / {trainingProgress.totalEpochs}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary">Verlust</Text>
                <Text className="text-primary font-mono">{trainingProgress.loss.toFixed(4)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-primary">Genauigkeit</Text>
                <Text className="text-primary font-mono">{(trainingProgress.accuracy * 100).toFixed(2)}%</Text>
              </View>

              {/* Progress Bar */}
              <View className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                <View
                  className="h-full bg-primary"
                  style={{ width: `${(trainingProgress.epoch / trainingProgress.totalEpochs) * 100}%` }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Train Button */}
        <View className="mx-5 mt-4">
          <TouchableOpacity
            className="py-4 rounded-xl items-center flex-row justify-center"
            style={{ backgroundColor: colors.primary, opacity: isTrainingML ? 0.5 : 1 }}
            onPress={handleTrainModel}
            disabled={isTrainingML}
          >
            <IconSymbol name="brain.head.profile" size={20} color={colors.background} />
            <Text className="text-background font-bold ml-2">
              {isTrainingML ? "Training läuft..." : "Modell trainieren (50 Epochen)"}
            </Text>
          </TouchableOpacity>

          <View className="mt-2 px-2">
            <Text className="text-muted text-xs text-center">
              Benötigt mindestens 30 Trades. Training kann 1-2 Minuten dauern.
            </Text>
          </View>
        </View>

        {/* Prediction Section */}
        <View className="mx-5 mt-6 bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold text-lg mb-4">Preisvorhersage</Text>

          {prediction ? (
            <View className="gap-4">
              <View className="items-center py-4 bg-background/50 rounded-xl">
                <Text className="text-muted text-sm mb-2">Richtung</Text>
                <View className="flex-row items-center">
                  <IconSymbol
                    name={prediction.direction === "up" ? "arrow.up" : prediction.direction === "down" ? "arrow.down" : "minus"}
                    size={32}
                    color={
                      prediction.direction === "up"
                        ? colors.success
                        : prediction.direction === "down"
                        ? colors.error
                        : colors.muted
                    }
                  />
                  <Text
                    className="text-2xl font-bold ml-2"
                    style={{
                      color:
                        prediction.direction === "up"
                          ? colors.success
                          : prediction.direction === "down"
                          ? colors.error
                          : colors.muted,
                    }}
                  >
                    {prediction.direction === "up" ? "Aufwärts" : prediction.direction === "down" ? "Abwärts" : "Neutral"}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 bg-background/50 rounded-xl p-3">
                  <Text className="text-muted text-xs">Konfidenz</Text>
                  <Text className="text-foreground font-bold text-lg">
                    {(prediction.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-1 bg-background/50 rounded-xl p-3">
                  <Text className="text-muted text-xs">Erwartete Änderung</Text>
                  <Text
                    className="font-bold text-lg"
                    style={{
                      color: prediction.expectedChange >= 0 ? colors.success : colors.error,
                    }}
                  >
                    {prediction.expectedChange >= 0 ? "+" : ""}
                    {prediction.expectedChange.toFixed(2)}%
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="items-center py-6">
              <IconSymbol name="chart.line.uptrend.xyaxis" size={32} color={colors.muted} />
              <Text className="text-muted text-center mt-2">Noch keine Vorhersage erstellt</Text>
            </View>
          )}

          <TouchableOpacity
            className="mt-4 py-3 rounded-xl items-center"
            style={{ backgroundColor: colors.secondary, opacity: !isTrained || isTrainingML ? 0.5 : 1 }}
            onPress={handleGetPrediction}
            disabled={!isTrained || isTrainingML}
          >
            <Text className="text-background font-semibold">Vorhersage erstellen</Text>
          </TouchableOpacity>
        </View>

        {/* How it Works */}
        <View className="mx-5 mt-4 bg-surface rounded-2xl p-5 border border-border">
          <Text className="text-foreground font-semibold text-lg mb-3">Wie funktioniert Transfer Learning?</Text>

          <View className="gap-3">
            <View className="flex-row">
              <Text className="text-primary font-bold mr-2">1.</Text>
              <Text className="text-muted flex-1 text-sm leading-5">
                Das Modell verwendet eine vortrainierte LSTM-Architektur für Zeitreihen-Analyse
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-primary font-bold mr-2">2.</Text>
              <Text className="text-muted flex-1 text-sm leading-5">
                Deine Trading-Daten werden verwendet, um das Modell auf deine spezifischen Muster zu spezialisieren
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-primary font-bold mr-2">3.</Text>
              <Text className="text-muted flex-1 text-sm leading-5">
                Das Modell lernt aus 20-Trade-Sequenzen und sagt die nächste Preisbewegung voraus
              </Text>
            </View>
            <View className="flex-row">
              <Text className="text-primary font-bold mr-2">4.</Text>
              <Text className="text-muted flex-1 text-sm leading-5">
                Die Vorhersagen werden mit dem genetischen Algorithmus kombiniert für optimale Strategien
              </Text>
            </View>
          </View>
        </View>

        {/* Data Requirements */}
        <View className="mx-5 mt-4 p-4 bg-warning/10 rounded-xl">
          <View className="flex-row items-start">
            <IconSymbol name="info.circle.fill" size={16} color={colors.warning} />
            <Text className="text-warning text-xs ml-2 flex-1">
              Je mehr Trades du ausführst, desto genauer werden die Vorhersagen. Für beste Ergebnisse empfehlen wir
              mindestens 100 Trades vor dem Training.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
