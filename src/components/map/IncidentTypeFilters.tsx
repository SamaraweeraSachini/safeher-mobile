import { Ionicons } from '@expo/vector-icons';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    INCIDENT_CATEGORIES,
} from '@/constants/incident-categories';

import type {
    IncidentCategoryId,
} from '@/src/types/incident';

export type IncidentFilterValue =
  | 'all'
  | IncidentCategoryId;

type IncidentTypeFiltersProps = {
  selectedFilter: IncidentFilterValue;
  onSelect: (
    filter: IncidentFilterValue
  ) => void;
};

export default function IncidentTypeFilters({
  selectedFilter,
  onSelect,
}: IncidentTypeFiltersProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable
          style={({ pressed }) => [
            styles.filterButton,
            selectedFilter === 'all' &&
              styles.selectedButton,
            pressed &&
              styles.pressedButton,
          ]}
          onPress={() => onSelect('all')}
          accessibilityRole="button"
          accessibilityState={{
            selected:
              selectedFilter === 'all',
          }}
          accessibilityLabel="Show all incident types"
        >
          <Ionicons
            name="apps-outline"
            size={17}
            color={
              selectedFilter === 'all'
                ? '#FFFFFF'
                : '#A92F61'
            }
          />

          <Text
            style={[
              styles.filterText,
              selectedFilter === 'all' &&
                styles.selectedText,
            ]}
          >
            All
          </Text>
        </Pressable>

        {INCIDENT_CATEGORIES.map(
          category => {
            const isSelected =
              selectedFilter === category.id;

            return (
              <Pressable
                key={category.id}
                style={({ pressed }) => [
                  styles.filterButton,
                  isSelected &&
                    styles.selectedButton,
                  pressed &&
                    styles.pressedButton,
                ]}
                onPress={() =>
                  onSelect(category.id)
                }
                accessibilityRole="button"
                accessibilityState={{
                  selected: isSelected,
                }}
                accessibilityLabel={`Show ${category.label} incidents`}
              >
                <Ionicons
                  name={category.icon}
                  size={17}
                  color={
                    isSelected
                      ? '#FFFFFF'
                      : category.color
                  }
                />

                <Text
                  style={[
                    styles.filterText,
                    isSelected &&
                      styles.selectedText,
                  ]}
                >
                  {category.label}
                </Text>
              </Pressable>
            );
          }
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },

  content: {
    gap: 9,
    paddingHorizontal: 16,
  },

  filterButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#E8D5DD',
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#5A3D4D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  selectedButton: {
    borderColor: '#C43D74',
    backgroundColor: '#C43D74',
  },

  pressedButton: {
    opacity: 0.72,
  },

  filterText: {
    color: '#5D4B53',
    fontSize: 12,
    fontWeight: '700',
  },

  selectedText: {
    color: '#FFFFFF',
  },
});