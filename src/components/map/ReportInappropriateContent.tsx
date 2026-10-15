import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ContentFlagError,
  createContentFlag,
} from '@/src/services/content-flag-service';
import { CONTENT_FLAG_REASONS } from '@/src/types/content-flag';

type ReportInappropriateContentProps = {
  incidentId: string;
  onExpand: () => void;
};

export default function ReportInappropriateContent({
  incidentId,
  onExpand,
}: ReportInappropriateContentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openForm = () => {
    setIsOpen(true);
    setError(null);
    onExpand();
  };

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!reason) {
      setSuccess(null);
      setError('Select a reason.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createContentFlag(incidentId, reason, details);
      setSuccess('This report has been submitted for review.');
      setIsOpen(false);
      setReason(null);
      setDetails('');
    } catch (submissionError) {
      setError(
        submissionError instanceof ContentFlagError
          ? submissionError.message
          : 'This report could not be submitted. Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successBox}>
        <Ionicons name="checkmark-circle-outline" size={22} color="#35735A" />
        <Text style={styles.successText}>{success}</Text>
      </View>
    );
  }

  if (!isOpen) {
    return (
      <Pressable
        style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}
        onPress={openForm}
        accessibilityRole="button"
        accessibilityLabel="Report inappropriate content"
      >
        <Ionicons name="flag-outline" size={18} color="#A92F61" />
        <Text style={styles.reportButtonText}>Report inappropriate content</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Report inappropriate content</Text>
      <Text style={styles.formBody}>Select a reason. Details are optional.</Text>

      {CONTENT_FLAG_REASONS.map((option) => {
        const selected = reason === option;

        return (
          <Pressable
            key={option}
            style={[styles.reason, selected && styles.reasonSelected]}
            onPress={() => {
              setReason(option);
              setError(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option}
          >
            <Ionicons
              name={selected ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={selected ? '#C43D74' : '#927E87'}
            />
            <Text style={styles.reasonText}>{option}</Text>
          </Pressable>
        );
      })}

      <Text style={styles.fieldLabel}>Details (optional)</Text>
      <TextInput
        style={styles.input}
        value={details}
        onChangeText={(value) => {
          setDetails(value);
          setError(null);
        }}
        onFocus={onExpand}
        placeholder="Add anything that would help a review"
        placeholderTextColor="#9A8790"
        multiline
        maxLength={300}
        textAlignVertical="top"
        accessibilityLabel="Optional details"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}
        onPress={() => {
          void submit();
        }}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Submit report"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Submit report</Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => {
          setIsOpen(false);
          setError(null);
        }}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Cancel report"
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1C8DA',
    borderRadius: 16,
    backgroundColor: '#FBEAF1',
  },
  reportButtonText: {
    color: '#A92F61',
    fontSize: 15,
    fontWeight: '800',
  },
  form: {
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1C8DA',
    borderRadius: 17,
    backgroundColor: '#FFF8FB',
  },
  formTitle: {
    color: '#32252B',
    fontSize: 16,
    fontWeight: '800',
  },
  formBody: {
    marginTop: 6,
    marginBottom: 10,
    color: '#75515F',
    fontSize: 13,
    lineHeight: 18,
  },
  reason: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#F1DDE6',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  reasonSelected: {
    borderColor: '#C43D74',
    backgroundColor: '#FBEAF1',
  },
  reasonText: {
    flex: 1,
    color: '#32252B',
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabel: {
    marginTop: 8,
    color: '#742443',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 88,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E4C3D1',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    color: '#32252B',
    fontSize: 14,
  },
  error: {
    marginTop: 10,
    color: '#9B2C2C',
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#C43D74',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelText: {
    marginTop: 12,
    color: '#75515F',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#E5F4ED',
  },
  successText: {
    flex: 1,
    color: '#245743',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
  },
});
