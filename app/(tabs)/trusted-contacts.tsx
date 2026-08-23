import TabPlaceholder from '@/src/components/navigation/TabPlaceholder';

export default function TrustedContactsScreen() {
  return (
    <TabPlaceholder
      title="Trusted Contacts"
      description="Add and manage people who can support you during a journey."
      icon="people-outline"
      iconColor="#7957A8"
      iconBackgroundColor="#F1EAF9"
      availability="Planned for a future Trusted Contacts sprint."
      showBackButton
    />
  );
}