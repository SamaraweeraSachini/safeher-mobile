import TabPlaceholder from '@/src/components/navigation/TabPlaceholder';

export default function SosScreen() {
  return (
    <TabPlaceholder
      title="SOS"
      description="Access emergency assistance when you feel unsafe."
      icon="alert-circle-outline"
      iconColor="#C83B4D"
      iconBackgroundColor="#FCE7EA"
      availability="Full emergency functionality is planned for a future sprint."
      showBackButton
    />
  );
}