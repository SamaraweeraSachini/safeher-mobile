import { Ionicons } from '@expo/vector-icons';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Brand,
} from '@/constants/brand';

import ScreenBackButton from '@/src/components/navigation/ScreenBackButton';

import {
  useAuth,
} from '@/src/context/AuthContext';

import {
  addTrustedContact,
  deleteTrustedContact,
  subscribeToTrustedContacts,
  TrustedContactError,
  updateTrustedContact,
} from '@/src/services/trusted-contact-service';

import type {
  TrustedContact,
} from '@/src/types/trusted-contact';

export default function TrustedContactsScreen() {
  const { isGuest } = useAuth();

  const [
    contacts,
    setContacts,
  ] =
    useState<TrustedContact[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    modalVisible,
    setModalVisible,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<TrustedContact | null>(
      null
    );

  useEffect(() => {
    if (
      isGuest
    ) {
      setLoading(
        false
      );

      setContacts(
        []
      );

      return;
    }

    try {
      const unsubscribe =
        subscribeToTrustedContacts(
          items => {
            setContacts(
              items
            );

            setLoading(
              false
            );

            setError(
              null
            );
          },

          message => {
            setLoading(
              false
            );

            setError(
              message
            );
          }
        );

      return unsubscribe;
    } catch (
      loadError
    ) {
      setLoading(
        false
      );

      setError(
        loadError instanceof
          Error
          ? loadError.message
          : 'Could not load contacts.'
      );
    }
  }, [
    isGuest,
  ]);

  const openNew =
    () => {
      setEditing(
        null
      );

      setModalVisible(
        true
      );
    };

  const openEdit =
    (
      contact:
        TrustedContact
    ) => {
      setEditing(
        contact
      );

      setModalVisible(
        true
      );
    };

  const remove =
    (
      contact:
        TrustedContact
    ) => {
      Alert.alert(
        'Delete trusted contact?',
        `Remove ${contact.name}?`,
        [
          {
            text:
              'Keep',

            style:
              'cancel',
          },

          {
            text:
              'Delete',

            style:
              'destructive',

            onPress:
              () => {
                void deleteTrustedContact(
                  contact.id
                ).catch(
                  deleteError => {
                    Alert.alert(
                      'Could not delete',

                      deleteError instanceof
                        Error
                        ? deleteError.message
                        : 'Please try again.'
                    );
                  }
                );
              },
          },
        ]
      );
    };

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
      edges={[
        'top',
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <ScreenBackButton
          label="Home"
        />

        <View
          style={
            styles.headerBlock
          }
        >
          <View
            style={
              styles.headerIconWrap
            }
          >
            <Ionicons
              name="people-outline"
              size={
                24
              }
              color={
                Brand.burgundy
              }
            />
          </View>

          <View
            style={{
              flex:
                1,
            }}
          >
            <Text
              style={
                styles.title
              }
            >
              Trusted Contacts
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Save people once and reuse
              them in SOS and Safe Journey.
            </Text>
          </View>
        </View>

        {isGuest ? (
          <View
            style={
              styles.infoCard
            }
          >
            <View
              style={
                styles.infoIconWrap
              }
            >
              <Ionicons
                name="person-circle-outline"
                size={
                  26
                }
                color={
                  Brand.burgundy
                }
              />
            </View>

            <Text
              style={
                styles.infoText
              }
            >
              Sign in with a registered
              account to save trusted
              contacts.
            </Text>
          </View>
        ) : (
          <>
            <Pressable
              style={({
                pressed,
              }) => [
                styles.addButton,

                pressed &&
                  styles.pressed,
              ]}
              onPress={
                openNew
              }
            >
              <Ionicons
                name="person-add-outline"
                size={
                  19
                }
                color={
                  Brand.white
                }
              />

              <Text
                style={
                  styles.addButtonText
                }
              >
                Add Trusted Contact
              </Text>
            </Pressable>

            {loading ? (
              <ActivityIndicator
                style={{
                  marginTop:
                    28,
                }}
                color={
                  Brand.burgundy
                }
              />
            ) : error ? (
              <View
                style={
                  styles.errorCard
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={
                    18
                  }
                  color="#B42318"
                />

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>
              </View>
            ) : contacts.length ===
              0 ? (
              <View
                style={
                  styles.emptyCard
                }
              >
                <View
                  style={
                    styles.emptyIconWrap
                  }
                >
                  <Ionicons
                    name="people-outline"
                    size={
                      36
                    }
                    color={
                      Brand.burgundy
                    }
                  />
                </View>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No trusted contacts
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Add someone you trust.
                  They will then appear in
                  SOS and Safe Journey.
                </Text>
              </View>
            ) : (
              contacts.map(
                contact => (
                  <View
                    key={
                      contact.id
                    }
                    style={
                      styles.contactCard
                    }
                  >
                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Ionicons
                        name="person"
                        size={
                          19
                        }
                        color={
                          Brand.burgundy
                        }
                      />
                    </View>

                    <View
                      style={{
                        flex:
                          1,
                      }}
                    >
                      <Text
                        style={
                          styles.contactName
                        }
                      >
                        {
                          contact.name
                        }
                      </Text>

                      <Text
                        style={
                          styles.contactMeta
                        }
                      >
                        {contact.relationship ||
                          'Trusted contact'}
                        {'  ·  '}
                        {contact.phone}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        openEdit(
                          contact
                        )
                      }
                      hitSlop={
                        8
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.iconButton,

                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="create-outline"
                        size={
                          19
                        }
                        color={
                          Brand.burgundy
                        }
                      />
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        remove(
                          contact
                        )
                      }
                      hitSlop={
                        8
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.iconButton,

                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={
                          19
                        }
                        color="#B42318"
                      />
                    </Pressable>
                  </View>
                )
              )
            )}
          </>
        )}
      </ScrollView>

      <ContactModal
        visible={
          modalVisible
        }
        contact={
          editing
        }
        onClose={() =>
          setModalVisible(
            false
          )
        }
      />
    </SafeAreaView>
  );
}

function ContactModal({
  visible,
  contact,
  onClose,
}: {
  visible:
    boolean;

  contact:
    TrustedContact | null;

  onClose:
    () => void;
}) {
  const [
    name,
    setName,
  ] =
    useState('');

  const [
    relationship,
    setRelationship,
  ] =
    useState('');

  const [
    phone,
    setPhone,
  ] =
    useState('');

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  useEffect(() => {
    if (
      visible
    ) {
      setName(
        contact?.name ??
          ''
      );

      setRelationship(
        contact?.relationship ??
          ''
      );

      setPhone(
        contact?.phone ??
          ''
      );
    }
  }, [
    visible,
    contact,
  ]);

  const save =
    async () => {
      try {
        setSaving(
          true
        );

        const input = {
          name,
          relationship,
          phone,
        };

        if (
          contact
        ) {
          await updateTrustedContact(
            contact.id,
            input
          );
        } else {
          await addTrustedContact(
            input
          );
        }

        onClose();
      } catch (
        saveError
      ) {
        Alert.alert(
          'Could not save contact',

          saveError instanceof
            TrustedContactError
            ? saveError.message
            : 'Please try again.'
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <Modal
      visible={
        visible
      }
      transparent
      animationType="slide"
      onRequestClose={
        onClose
      }
    >
      <View
        style={
          styles.modalBackdrop
        }
      >
        <View
          style={
            styles.modalSheet
          }
        >
          <View
            style={
              styles.modalHandle
            }
          />

          <View
            style={
              styles.modalHeader
            }
          >
            <Text
              style={
                styles.modalTitle
              }
            >
              {contact
                ? 'Edit Contact'
                : 'Add Contact'}
            </Text>

            <Pressable
              onPress={
                onClose
              }
              style={({
                pressed,
              }) => [
                styles.closeButton,

                pressed &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                name="close"
                size={
                  20
                }
                color={
                  Brand.ink
                }
              />
            </Pressable>
          </View>

          <View
            style={
              styles.inputWrap
            }
          >
            <Ionicons
              name="person-outline"
              size={
                18
              }
              color={
                Brand.burgundy
              }
              style={
                styles.inputIcon
              }
            />

            <TextInput
              style={
                styles.input
              }
              value={
                name
              }
              onChangeText={
                setName
              }
              placeholder="Name"
              placeholderTextColor={
                Brand.muted
              }
            />
          </View>

          <View
            style={
              styles.inputWrap
            }
          >
            <Ionicons
              name="heart-outline"
              size={
                18
              }
              color={
                Brand.burgundy
              }
              style={
                styles.inputIcon
              }
            />

            <TextInput
              style={
                styles.input
              }
              value={
                relationship
              }
              onChangeText={
                setRelationship
              }
              placeholder="Relationship e.g. Mother"
              placeholderTextColor={
                Brand.muted
              }
            />
          </View>

          <View
            style={
              styles.inputWrap
            }
          >
            <Ionicons
              name="call-outline"
              size={
                18
              }
              color={
                Brand.burgundy
              }
              style={
                styles.inputIcon
              }
            />

            <TextInput
              style={
                styles.input
              }
              value={
                phone
              }
              onChangeText={
                setPhone
              }
              placeholder="Phone number"
              placeholderTextColor={
                Brand.muted
              }
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.saveButton,

              saving &&
                styles.disabled,

              pressed &&
                styles.pressed,
            ]}
            onPress={
              save
            }
            disabled={
              saving
            }
          >
            {saving ? (
              <ActivityIndicator
                color={
                  Brand.white
                }
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={
                    18
                  }
                  color={
                    Brand.white
                  }
                />

                <Text
                  style={
                    styles.addButtonText
                  }
                >
                  Save Contact
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        Brand.cream,
    },

    content: {
      paddingHorizontal:
        20,

      paddingTop:
        12,

      paddingBottom:
        36,
    },

    headerBlock: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        12,

      marginTop:
        6,

      marginBottom:
        18,
    },

    headerIconWrap: {
      width:
        50,

      height:
        50,

      borderRadius:
        16,

      backgroundColor:
        Brand.blush,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderWidth:
        1,

      borderColor:
        Brand.roseSoft,
    },

    title: {
      color:
        Brand.ink,

      fontSize:
        24,

      fontWeight:
        '900',

      letterSpacing:
        -0.3,
    },

    subtitle: {
      marginTop:
        4,

      color:
        Brand.muted,

      fontSize:
        13,

      lineHeight:
        19,
    },

    infoCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        12,

      padding:
        16,

      borderRadius:
        18,

      backgroundColor:
        Brand.blush,

      borderWidth:
        1,

      borderColor:
        Brand.roseSoft,
    },

    infoIconWrap: {
      width:
        44,

      height:
        44,

      borderRadius:
        14,

      backgroundColor:
        Brand.white,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    infoText: {
      flex:
        1,

      color:
        Brand.ink,

      lineHeight:
        19,

      fontSize:
        13.5,
    },

    addButton: {
      minHeight:
        54,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      borderRadius:
        15,

      backgroundColor:
        Brand.burgundy,

      marginBottom:
        18,

      shadowColor:
        Brand.burgundy,

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      shadowOpacity:
        0.25,

      shadowRadius:
        10,

      elevation:
        4,
    },

    saveButton: {
      minHeight:
        54,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      borderRadius:
        15,

      backgroundColor:
        Brand.burgundy,

      marginTop:
        8,

      shadowColor:
        Brand.burgundy,

      shadowOffset: {
        width:
          0,

        height:
          5,
      },

      shadowOpacity:
        0.25,

      shadowRadius:
        10,

      elevation:
        4,
    },

    addButtonText: {
      color:
        Brand.white,

      fontWeight:
        '800',

      fontSize:
        15,

      letterSpacing:
        0.2,
    },

    errorCard: {
      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        8,

      padding:
        13,

      borderRadius:
        14,

      backgroundColor:
        '#FEF3F2',

      borderWidth:
        1,

      borderColor:
        '#F8CFCB',
    },

    errorText: {
      flex:
        1,

      color:
        '#B42318',

      fontSize:
        12.5,

      lineHeight:
        18,

      fontWeight:
        '600',
    },

    emptyCard: {
      alignItems:
        'center',

      padding:
        28,

      borderRadius:
        20,

      backgroundColor:
        Brand.white,

      borderWidth:
        1,

      borderColor:
        Brand.line,
    },

    emptyIconWrap: {
      width:
        74,

      height:
        74,

      borderRadius:
        22,

      backgroundColor:
        Brand.blush,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    emptyTitle: {
      marginTop:
        14,

      color:
        Brand.ink,

      fontSize:
        17,

      fontWeight:
        '800',
    },

    emptyText: {
      marginTop:
        6,

      color:
        Brand.muted,

      textAlign:
        'center',

      lineHeight:
        19,

      fontSize:
        13,

      paddingHorizontal:
        6,
    },

    contactCard: {
      minHeight:
        74,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        10,

      marginBottom:
        10,

      padding:
        13,

      borderWidth:
        1,

      borderColor:
        Brand.line,

      borderRadius:
        18,

      backgroundColor:
        Brand.white,

      shadowColor:
        '#4E1026',

      shadowOffset: {
        width:
          0,

        height:
          2,
      },

      shadowOpacity:
        0.04,

      shadowRadius:
        6,

      elevation:
        1,
    },

    avatar: {
      width:
        44,

      height:
        44,

      alignItems:
        'center',

      justifyContent:
        'center',

      borderRadius:
        22,

      backgroundColor:
        Brand.blush,

      borderWidth:
        1,

      borderColor:
        Brand.roseSoft,
    },

    contactName: {
      color:
        Brand.ink,

      fontWeight:
        '800',

      fontSize:
        14.5,
    },

    contactMeta: {
      marginTop:
        4,

      color:
        Brand.muted,

      fontSize:
        12,
    },

    iconButton: {
      width:
        34,

      height:
        34,

      borderRadius:
        12,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        Brand.blush,
    },

    modalBackdrop: {
      flex:
        1,

      justifyContent:
        'flex-end',

      backgroundColor:
        'rgba(41,24,32,0.45)',
    },

    modalSheet: {
      padding:
        22,

      paddingTop:
        12,

      paddingBottom:
        36,

      borderTopLeftRadius:
        26,

      borderTopRightRadius:
        26,

      backgroundColor:
        Brand.white,
    },

    modalHandle: {
      width:
        44,

      height:
        5,

      alignSelf:
        'center',

      marginBottom:
        16,

      borderRadius:
        3,

      backgroundColor:
        '#D9C9D0',
    },

    modalHeader: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',

      marginBottom:
        18,
    },

    modalTitle: {
      color:
        Brand.ink,

      fontSize:
        20,

      fontWeight:
        '900',

      letterSpacing:
        -0.2,
    },

    closeButton: {
      width:
        38,

      height:
        38,

      borderRadius:
        19,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        Brand.blush,
    },

    inputWrap: {
      flexDirection:
        'row',

      alignItems:
        'center',

      minHeight:
        52,

      marginBottom:
        11,

      paddingHorizontal:
        13,

      borderWidth:
        1,

      borderColor:
        Brand.line,

      borderRadius:
        14,

      backgroundColor:
        Brand.cream,
    },

    inputIcon: {
      marginRight:
        9,
    },

    input: {
      flex:
        1,

      color:
        Brand.ink,

      fontSize:
        14,
    },

    disabled: {
      opacity:
        0.6,
    },

    pressed: {
      opacity:
        0.75,
    },
  });