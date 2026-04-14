import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const ONBOARDING_KEY = "@onboarding_completed";

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    icon: "chart.line.uptrend.xyaxis",
    title: "Willkommen bei Aether Trader",
    description:
      "Ihre KI-gesteuerte Trading-Plattform mit Papertrading, selbstlernenden Strategien und genetischer Optimierung.",
    highlight: "Kein echtes Geld - 100% risikofrei lernen",
  },
  {
    id: "2",
    icon: "eurosign.circle.fill",
    title: "Papertrading mit €10.000",
    description:
      "Starten Sie mit €10.000 virtuellem Guthaben. Testen Sie Strategien, lernen Sie aus Fehlern und verbessern Sie Ihre Trading-Skills.",
    highlight: "Virtuelles Geld zum Üben",
  },
  {
    id: "3",
    icon: "brain.head.profile",
    title: "Selbstlernende KI",
    description:
      "Das System analysiert jeden Trade, erkennt Muster und entwickelt automatisch Trading-Regeln basierend auf erfolgreichen Strategien.",
    highlight: "Lernt aus jedem Trade",
  },
  {
    id: "4",
    icon: "arrow.clockwise",
    title: "Genetische Optimierung",
    description:
      "Evolutionäre Algorithmen optimieren Ihre Strategien über Generationen hinweg. Die besten Strategien überleben und verbessern sich.",
    highlight: "Kontinuierliche Verbesserung",
  },
  {
    id: "5",
    icon: "newspaper.fill",
    title: "News-Sentiment-Analyse",
    description:
      "Echtzeit-Analyse von Marktnachrichten. Das System erkennt bullische und bearische Signale und reagiert entsprechend.",
    highlight: "Marktintelligenz in Echtzeit",
  },
  {
    id: "6",
    icon: "exclamationmark.triangle.fill",
    title: "Wichtiger Hinweis",
    description:
      "Dies ist ein Papertrading-Modus mit virtuellem Geld. Kein echtes Geld ist involviert. Die Ergebnisse sind simuliert und stellen keine Anlageberatung dar.",
    highlight: "Nur zu Bildungszwecken",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(tabs)");
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={{ width }} className="flex-1 px-8 justify-center items-center">
      {/* Icon */}
      <View
        className="w-32 h-32 rounded-full items-center justify-center mb-8"
        style={{ backgroundColor: colors.primary + "20" }}
      >
        <IconSymbol name={item.icon as any} size={64} color={colors.primary} />
      </View>

      {/* Title */}
      <Text className="text-3xl font-bold text-foreground text-center mb-4">
        {item.title}
      </Text>

      {/* Description */}
      <Text className="text-base text-muted text-center leading-6 mb-6">
        {item.description}
      </Text>

      {/* Highlight */}
      {item.highlight && (
        <View className="bg-primary/10 px-4 py-2 rounded-full">
          <Text className="text-primary font-medium text-sm">{item.highlight}</Text>
        </View>
      )}
    </View>
  );

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View className="flex-1">
        {/* Skip Button */}
        {!isLastSlide && (
          <TouchableOpacity
            className="absolute top-4 right-4 z-10 px-4 py-2"
            style={{ opacity: 1 }}
            onPress={handleSkip}
          >
            <Text className="text-muted font-medium">Überspringen</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
        />

        {/* Bottom Section */}
        <View className="px-8 pb-8">
          {/* Pagination Dots */}
          <View className="flex-row justify-center mb-8">
            {slides.map((_, index) => (
              <View
                key={index}
                className="w-2 h-2 rounded-full mx-1"
                style={{
                  backgroundColor: index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                }}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.primary, opacity: 1 }}
            onPress={handleNext}
          >
            <Text className="text-background font-bold text-lg">
              {isLastSlide ? "Los geht's" : "Weiter"}
            </Text>
          </TouchableOpacity>

          {/* Progress Text */}
          <Text className="text-muted text-center text-sm mt-4">
            {currentIndex + 1} von {slides.length}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

export async function checkOnboardingCompleted(): Promise<boolean> {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed === "true";
  } catch {
    return false;
  }
}
