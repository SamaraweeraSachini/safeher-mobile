import TabPlaceholder from '@/src/components/navigation/TabPlaceholder';

export default function SafeRouteScreen() {
  return (
    <TabPlaceholder
      title="Safe Route"
      description="Compare route safety information before travelling."
      icon="trail-sign-outline"
      iconColor="#38785A"
      iconBackgroundColor="#E8F5ED"
      availability="Planned for a future Safe Route sprint."
      showBackButton
    />
  );
}