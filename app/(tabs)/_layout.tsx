import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const COLORS = {
  primary: '#C43D74',
  inactive: '#9A8790',
  background: '#FFFFFF',
  border: '#F1DDE6',
};

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          height: 68,
          paddingTop: 7,
          paddingBottom: 9,
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          elevation: 10,
          shadowColor: '#5A3D4D',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="safety-map"
        options={{
          title: 'Safety Map',
          tabBarAccessibilityLabel: 'Safety Map tab',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarAccessibilityLabel: 'Report Incident tab',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'warning' : 'warning-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarAccessibilityLabel: 'Safe Journey tab',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'navigate' : 'navigate-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="safe-route"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="trusted-contacts"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="sos"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
  name="privacy-safety"
  options={{
    href: null,
  }}
/>

<Tabs.Screen
  name="reporting-guidelines"
  options={{
    href: null,
  }}
/>


      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}