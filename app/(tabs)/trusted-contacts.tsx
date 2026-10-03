import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/context/AuthContext';
import {
  deleteTrustedContact,
  saveTrustedContact,
  subscribeToTrustedContacts,
  type TrustedContact,
  type TrustedContactInput,
} from '@/src/services/trusted-contacts-service';

const COLORS = {
  primary: '#C43D74',
  primaryDark: '#A92F61',
  background: '#FFF8FB',
  white: '#FFFFFF',
  text: '#392631',
  secondaryText: '#876F7A',
  border: '#F1DDE6',
  lightPink: '#F9E4EE',
  danger: '#C0392B',
  green: '#287550',
  lightGreen: '#E8F5ED',
};

const RELATIONSHIPS = [
  'Parent',
  'Sibling',
  'Partner',
  'Friend',
  'Relative',
  'Other',
];

const EMPTY_FORM: TrustedContactInput = {
  name: '',
  relationship: '',
  phoneNumber: '',
  email: '',
  isPrimary: false,
};

export default function TrustedContactsScreen() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
    isGuest,
    isRegisteredUser,
  } = useAuth();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [form, setForm] = useState<TrustedContactInput>(EMPTY_FORM);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || isGuest || !isRegisteredUser) {
      setContacts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTrustedContacts(
      user.uid,
      savedContacts => {
        setContacts(savedContacts);
        setLoading(false);
        setError(null);
      },
      () => {
        setLoading(false);
        setError(
          'We could not load your trusted contacts. Please try again.'
        );
      }
    );

    return unsubscribe;
  }, [user, authLoading, isGuest, isRegisteredUser]);

  function openAddModal() {
    setEditingContactId(null);
    setForm({ ...EMPTY_FORM });
    setModalVisible(true);
  }

  function openEditModal(contact: TrustedContact) {
    setEditingContactId(contact.id);

    setForm({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      email: contact.email ?? '',
      isPrimary: contact.isPrimary,
    });

    setModalVisible(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalVisible(false);
    setEditingContactId(null);
    setForm({ ...EMPTY_FORM });
  }

  function updateForm(
    field: keyof TrustedContactInput,
    value: string | boolean
  ) {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    const name = form.name.trim();
    const relationship = form.relationship.trim();
    const phoneNumber = form.phoneNumber.trim();
    const email = form.email?.trim() ?? '';

    if (!name || !relationship || !phoneNumber) {
      Alert.alert(
        'Missing information',
        'Please enter the name, relationship and phone number.'
      );
      return;
    }

    if (!/^\+?[\d\s()-]{7,20}$/.test(phoneNumber)) {
      Alert.alert(
        'Invalid phone number',
        'Please enter a valid phone number.'
      );
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert(
        'Invalid email address',
        'Please enter a valid email address or leave the email field empty.'
      );
      return;
    }

    const contactInput: TrustedContactInput = {
      name,
      relationship,
      phoneNumber,
      email,
      isPrimary: form.isPrimary,
    };

    try {
      setSaving(true);

      await saveTrustedContact(
        user.uid,
        editingContactId,
        contactInput
      );

      setModalVisible(false);
      setEditingContactId(null);
      setForm({ ...EMPTY_FORM });

      Alert.alert(
        'Success',
        editingContactId
          ? 'Trusted contact updated successfully.'
          : 'Trusted contact added successfully.'
      );
    } catch {
      Alert.alert(
        'Something went wrong',
        'We could not save this contact. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(contact: TrustedContact) {
    Alert.alert(
      'Delete trusted contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDelete(contact.id);
          },
        },
      ]
    );
  }

  async function handleDelete(contactId: string) {
    if (!user) {
      return;
    }

    try {
      await deleteTrustedContact(user.uid, contactId);

      Alert.alert(
        'Deleted',
        'Trusted contact removed successfully.'
      );
    } catch {
      Alert.alert(
        'Delete failed',
        'We could not delete this contact. Please try again.'
      );
    }
  }

  async function handleMakePrimary(contact: TrustedContact) {
    if (!user || contact.isPrimary) {
      return;
    }

    try {
      await saveTrustedContact(
        user.uid,
        contact.id,
        {
          name: contact.name,
          relationship: contact.relationship,
          phoneNumber: contact.phoneNumber,
          email: contact.email ?? '',
          isPrimary: true,
        }
      );

      Alert.alert(
        'Primary contact updated',
        `${contact.name} is now your primary contact.`
      );
    } catch {
      Alert.alert(
        'Update failed',
        'We could not update your primary contact.'
      );
    }
  }

  if (authLoading || loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text style={styles.loadingText}>
            Loading trusted contacts...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isGuest || !isRegisteredUser || !user) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top']}
      >
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={38}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.restrictedTitle}>
            Registered account required
          </Text>

          <Text style={styles.restrictedDescription}>
            Trusted contacts are available to registered
            SafeHer users. Please sign in with your account
            to manage your trusted contacts.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.pageTitle}>
                Trusted Contacts
              </Text>

              <Text style={styles.pageSubtitle}>
                People you trust to support you during
                journeys and emergencies.
              </Text>
            </View>

            <View style={styles.headerIcon}>
              <Ionicons
                name="people-outline"
                size={26}
                color={COLORS.primaryDark}
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={23}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>
                Your safety network
              </Text>

              <Text style={styles.infoDescription}>
                Add people you trust. They can be selected
                for journey and emergency support.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Saved Contacts
              </Text>

              <Text style={styles.sectionSubtitle}>
                {contacts.length}{' '}
                {contacts.length === 1 ? 'contact' : 'contacts'}{' '}
                saved
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.pressed,
              ]}
              onPress={openAddModal}
              accessibilityRole="button"
              accessibilityLabel="Add trusted contact"
            >
              <Ionicons
                name="add"
                size={20}
                color={COLORS.white}
              />

              <Text style={styles.addButtonText}>
                Add
              </Text>
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorCard}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={COLORS.danger}
              />

              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

          {!error && contacts.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={42}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No trusted contacts yet
              </Text>

              <Text style={styles.emptyDescription}>
                Add someone you trust so they can be
                available for your safe journeys and
                emergencies.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed && styles.pressed,
                ]}
                onPress={openAddModal}
              >
                <Ionicons
                  name="person-add-outline"
                  size={19}
                  color={COLORS.white}
                />

                <Text style={styles.emptyButtonText}>
                  Add Your First Contact
                </Text>
              </Pressable>
            </View>
          )}

          {contacts.map(contact => (
            <View
              key={contact.id}
              style={styles.contactCard}
            >
              <View style={styles.contactHeader}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.avatarText}>
                    {contact.name
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.contactMain}>
                  <Text style={styles.contactName}>
                    {contact.name}
                  </Text>

                  <Text style={styles.contactRelationship}>
                    {contact.relationship}
                  </Text>
                </View>

                {contact.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Ionicons
                      name="star"
                      size={12}
                      color="#9A621F"
                    />

                    <Text style={styles.primaryBadgeText}>
                      Primary
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.contactDivider} />

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                </View>

                <Text style={styles.detailText}>
                  {contact.phoneNumber}
                </Text>
              </View>

              {!!contact.email?.trim() && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                  </View>

                  <Text style={styles.detailText}>
                    {contact.email}
                  </Text>
                </View>
              )}

              {!contact.isPrimary && (
                <Pressable
                  style={styles.makePrimaryButton}
                  onPress={() => void handleMakePrimary(contact)}
                >
                  <Ionicons
                    name="star-outline"
                    size={16}
                    color={COLORS.primary}
                  />

                  <Text style={styles.makePrimaryText}>
                    Make Primary Contact
                  </Text>
                </Pressable>
              )}

              <View style={styles.contactActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => openEditModal(contact)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${contact.name}`}
                >
                  <Ionicons
                    name="create-outline"
                    size={17}
                    color={COLORS.primary}
                  />

                  <Text style={styles.editButtonText}>
                    Edit
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => confirmDelete(contact)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${contact.name}`}
                >
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color={COLORS.danger}
                  />

                  <Text style={styles.deleteButtonText}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

          {contacts.length > 0 && (
            <View style={styles.footerInfo}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={COLORS.secondaryText}
              />

              <Text style={styles.footerInfoText}>
                Your trusted contacts are stored securely
                under your account.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingContactId
                    ? 'Edit Contact'
                    : 'Add Trusted Contact'}
                </Text>

                <Text style={styles.modalSubtitle}>
                  Enter the contact details below.
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.text}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>
                Full Name *
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="Enter contact name"
                placeholderTextColor="#A8959E"
                value={form.name}
                onChangeText={value => updateForm('name', value)}
                autoCapitalize="words"
                editable={!saving}
              />

              <Text style={styles.inputLabel}>
                Relationship *
              </Text>

              <View style={styles.relationshipContainer}>
                {RELATIONSHIPS.map(relationship => {
                  const selected =
                    form.relationship === relationship;

                  return (
                    <Pressable
                      key={relationship}
                      style={[
                        styles.relationshipChip,
                        selected && styles.relationshipChipSelected,
                      ]}
                      onPress={() =>
                        updateForm('relationship', relationship)
                      }
                      disabled={saving}
                    >
                      <Text
                        style={[
                          styles.relationshipText,
                          selected && styles.relationshipTextSelected,
                        ]}
                      >
                        {relationship}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>
                Phone Number *
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number"
                placeholderTextColor="#A8959E"
                value={form.phoneNumber}
                onChangeText={value =>
                  updateForm('phoneNumber', value)
                }
                keyboardType="phone-pad"
                editable={!saving}
              />

              <Text style={styles.inputLabel}>
                Email Address (Optional)
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="Enter email address"
                placeholderTextColor="#A8959E"
                value={form.email ?? ''}
                onChangeText={value =>
                  updateForm('email', value)
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                editable={!saving}
              />

              <Text style={styles.optionalHint}>
                You can leave this field empty if the contact
                does not have an email address.
              </Text>

              <Pressable
                style={styles.primaryOption}
                onPress={() =>
                  updateForm('isPrimary', !form.isPrimary)
                }
                disabled={saving}
              >
                <View
                  style={[
                    styles.checkbox,
                    form.isPrimary && styles.checkboxSelected,
                  ]}
                >
                  {form.isPrimary && (
                    <Ionicons
                      name="checkmark"
                      size={15}
                      color={COLORS.white}
                    />
                  )}
                </View>

                <View style={styles.primaryOptionText}>
                  <Text style={styles.primaryOptionTitle}>
                    Set as primary contact
                  </Text>

                  <Text style={styles.primaryOptionDescription}>
                    Only one contact can be primary at a time.
                  </Text>
                </View>
              </Pressable>

              <View style={styles.modalActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.disabledButton,
                  ]}
                  onPress={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator
                      color={COLORS.white}
                      size="small"
                    />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {editingContactId
                        ? 'Save Changes'
                        : 'Add Contact'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    color: COLORS.secondaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    minHeight: 85,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  pageSubtitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
  },
  headerIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    backgroundColor: COLORS.lightPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderWidth: 1,
    borderColor: '#F1D3E0',
    borderRadius: 18,
    padding: 15,
    marginTop: 12,
  },
  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  infoDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.secondaryText,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 27,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  pressed: {
    opacity: 0.7,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3F2',
    borderColor: '#FDA29B',
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 19,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 25,
    paddingVertical: 35,
    marginTop: 5,
  },
  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.secondaryText,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 23,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactAvatar: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  contactMain: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  contactRelationship: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1DF',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 20,
  },
  primaryBadgeText: {
    color: '#9A621F',
    fontSize: 10,
    fontWeight: '800',
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F3E7EC',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 9,
  },
  detailIcon: {
    width: 33,
    height: 33,
    borderRadius: 10,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  makePrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
    alignSelf: 'flex-start',
    paddingVertical: 5,
  },
  makePrimaryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FFF0F5',
  },
  editButtonText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#FEF3F2',
  },
  deleteButtonText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 8,
  },
  footerInfoText: {
    fontSize: 11,
    color: COLORS.secondaryText,
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  restrictedIcon: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 20,
    textAlign: 'center',
  },
  restrictedDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 10,
  },
  backButton: {
    marginTop: 25,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 13,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(35, 19, 28, 0.45)',
  },
  modalContainer: {
    maxHeight: '90%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 23,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSubtitle: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.secondaryText,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.lightPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 9,
    marginTop: 15,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 13,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.text,
  },
  optionalHint: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
    marginTop: 7,
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  relationshipChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  relationshipChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightPink,
  },
  relationshipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondaryText,
  },
  relationshipTextSelected: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  primaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.white,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  primaryOptionText: {
    flex: 1,
    marginLeft: 11,
  },
  primaryOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  primaryOptionDescription: {
    fontSize: 11,
    color: COLORS.secondaryText,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 25,
    marginBottom: 10,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 13,
    backgroundColor: '#F3E7EC',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  saveButton: {
    flex: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
});