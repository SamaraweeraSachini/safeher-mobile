import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export interface SelectableTrustedContact {
  id: string;
  name: string;
  relationship?: string;
  phoneNumber?: string;
}

type TrustedContactSelectorProps = {
  contacts: SelectableTrustedContact[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  selectionMode?: 'single' | 'multiple';
  disabled?: boolean;
  emptyMessage?: string;
};

export default function TrustedContactSelector({
  contacts,
  selectedIds,
  onSelectionChange,
  selectionMode = 'multiple',
  disabled = false,
  emptyMessage = 'No saved trusted contacts yet. Add contacts from the Trusted Contacts screen.',
}: TrustedContactSelectorProps) {
  const toggleContact = (contactId: string) => {
    if (disabled) return;

    if (selectionMode === 'single') {
      onSelectionChange(
        selectedIds.includes(contactId) ? [] : [contactId],
      );
      return;
    }

    onSelectionChange(
      selectedIds.includes(contactId)
        ? selectedIds.filter((id) => id !== contactId)
        : [...selectedIds, contactId],
    );
  };

  if (contacts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={24} color="#8D7781" />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {contacts.map((contact) => {
        const selected = selectedIds.includes(contact.id);

        return (
          <Pressable
            key={contact.id}
            style={({ pressed }) => [
              styles.contactRow,
              selected && styles.selectedContactRow,
              disabled && styles.disabledContactRow,
              pressed && !disabled && styles.pressedContactRow,
            ]}
            onPress={() => toggleContact(contact.id)}
            disabled={disabled}
            accessibilityRole={selectionMode === 'single' ? 'radio' : 'checkbox'}
            accessibilityLabel={`Select ${contact.name}`}
            accessibilityState={{
              checked: selected,
              selected,
              disabled,
            }}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color="#A92F61" />
            </View>

            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{contact.name}</Text>
              {contact.relationship ? (
                <Text style={styles.relationship}>{contact.relationship}</Text>
              ) : null}
              {contact.phoneNumber ? (
                <Text style={styles.phoneNumber}>{contact.phoneNumber}</Text>
              ) : null}
            </View>

            <Ionicons
              name={
                selectionMode === 'single'
                  ? selected ? 'radio-button-on' : 'radio-button-off'
                  : selected ? 'checkbox' : 'square-outline'
              }
              size={23}
              color={selected ? '#A92F61' : '#9B8A92'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 9,
  },
  contactRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5DCE1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  selectedContactRow: {
    borderColor: '#A92F61',
    backgroundColor: '#FFF0F6',
  },
  disabledContactRow: {
    opacity: 0.55,
  },
  pressedContactRow: {
    opacity: 0.75,
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    borderRadius: 19,
    backgroundColor: '#FFF0F6',
  },
  contactDetails: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    color: '#32252B',
    fontSize: 14,
    fontWeight: '700',
  },
  relationship: {
    color: '#75636C',
    fontSize: 12,
  },
  phoneNumber: {
    color: '#8D7781',
    fontSize: 11,
  },
  emptyContainer: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5DCE1',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    flex: 1,
    color: '#75636C',
    fontSize: 13,
    lineHeight: 19,
  },
});
