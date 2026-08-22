import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { AppButton } from '@/components/onboarding/app-button';
import { FeatureIllustration } from '@/components/onboarding/feature-illustration';
import { PagerDots } from '@/components/onboarding/pager-dots';
import { Brand } from '@/constants/brand';
import { ONBOARDING_SLIDES } from '@/constants/onboarding';

const { width } = Dimensions.get('window');

export default function OnboardingTourScreen() {
  const router = useRouter();

  const listRef =
    useRef<
      FlatList<(typeof ONBOARDING_SLIDES)[number]>
    >(null);

  const [index, setIndex] = useState(0);

  const isLast =
    index === ONBOARDING_SLIDES.length - 1;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
    }) => {
      const nextIndex =
        viewableItems[0]?.index;

      if (
        typeof nextIndex === 'number'
      ) {
        setIndex(nextIndex);
      }
    }
  ).current;

  function goTo(nextIndex: number) {
    listRef.current?.scrollToIndex({
      index: nextIndex,
      animated: true,
    });

    setIndex(nextIndex);

    void Haptics.selectionAsync();
  }

  function onMomentumEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x /
        width
    );

    setIndex(nextIndex);
  }

  function handleBack() {
    if (index === 0) {
      router.back();
      return;
    }

    goTo(index - 1);
  }

  function finishOnboarding() {
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              index === 0
                ? 'Return to Welcome'
                : 'Previous onboarding screen'
            }
            onPress={handleBack}
            hitSlop={12}
            style={styles.topSide}
          >
            <Text style={styles.topAction}>
              {index === 0
                ? 'Welcome'
                : 'Back'}
            </Text>
          </Pressable>

          <PagerDots
            count={ONBOARDING_SLIDES.length}
            activeIndex={index}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={finishOnboarding}
            hitSlop={12}
            style={styles.topSide}
          >
            <Text
              style={[
                styles.topAction,
                styles.skip,
              ]}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={
            false
          }
          onMomentumScrollEnd={
            onMomentumEnd
          }
          onViewableItemsChanged={
            onViewableItemsChanged
          }
          viewabilityConfig={
            viewabilityConfig
          }
          getItemLayout={(
            _,
            itemIndex
          ) => ({
            length: width,
            offset: width * itemIndex,
            index: itemIndex,
          })}
          extraData={index}
          renderItem={({ item }) => (
            <View
              style={[
                styles.page,
                { width },
              ]}
            >
              <FeatureIllustration
                id={item.id}
              />

              <Text style={styles.eyebrow}>
                {item.eyebrow}
              </Text>

              <Text style={styles.title}>
                {item.title}
              </Text>

              <Text style={styles.body}>
                {item.body}
              </Text>

              <View style={styles.highlight}>
                <Text
                  style={
                    styles.highlightText
                  }
                >
                  {item.highlight}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={styles.footer}>
          {isLast ? (
            <AppButton
              label="Get Started"
              onPress={finishOnboarding}
            />
          ) : (
            <AppButton
              label="Next"
              onPress={() =>
                goTo(index + 1)
              }
            />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.cream,
  },

  safe: {
    flex: 1,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },

  topSide: {
    minWidth: 72,
  },

  topAction: {
    color: Brand.burgundy,
    fontWeight: '700',
    fontSize: 15,
  },

  skip: {
    textAlign: 'right',
  },

  page: {
    paddingHorizontal: 28,
    paddingTop: 12,
  },

  eyebrow: {
    marginTop: 18,
    color: Brand.rose,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },

  title: {
    marginTop: 8,
    color: Brand.ink,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },

  body: {
    marginTop: 12,
    color: Brand.muted,
    fontSize: 16,
    lineHeight: 24,
  },

  highlight: {
    marginTop: 18,
    backgroundColor: Brand.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Brand.line,
  },

  highlightText: {
    color: Brand.ink,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
});

