import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  TRIP_BUTTON,
  tripButtonContentStyle,
  tripButtonTheme,
  tripFilledLabelStyle,
  tripOutlineButtonStyle,
  tripOutlineIconLabelStyle,
  tripOutlineLabelStyle,
  useAccentStyles,
} from '@/src/theme/tripButtons';
import { useAppTheme } from '@/src/theme/AppThemeProvider';
import { UI } from '@/src/theme/ui';
import { useLocalizedUserText } from '@/src/utils/localizeUserText';

type TripPlaceNotesSectionProps = {
  tripPlaceId: number;
  notes: string;
  saving?: boolean;
  onSave: (notes: string) => Promise<void>;
};

type EditorMode = 'create' | 'edit';

function tripIcon(name: keyof typeof MaterialCommunityIcons.glyphMap) {
  return ({ color }: { color: string }) => (
    <MaterialCommunityIcons
      name={name}
      size={TRIP_BUTTON.iconSize}
      color={color}
    />
  );
}

export function TripPlaceNotesSection({
  tripPlaceId,
  notes,
  saving = false,
  onSave,
}: TripPlaceNotesSectionProps) {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedUserText();
  const theme = useTheme();
  const { surfaces, primary } = useAppTheme();
  const accent = useAccentStyles();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [draft, setDraft] = useState('');
  const [editorError, setEditorError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const hasNotes = notes.trim().length > 0;
  const sheetHeight = Math.round(windowHeight * 0.5);

  useEffect(() => {
    if (!editorVisible) {
      setDraft('');
      setEditorError(null);
    }
  }, [editorVisible, tripPlaceId]);

  const openCreate = () => {
    setEditorMode('create');
    setDraft('');
    setEditorError(null);
    setEditorVisible(true);
  };

  const openEdit = () => {
    setEditorMode('edit');
    setDraft(notes);
    setEditorError(null);
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setEditorError(null);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setEditorError(t('notes.emptyError'));
      return;
    }
    setEditorError(null);
    try {
      await onSave(trimmed);
      setEditorVisible(false);
    } catch {
      setEditorError(t('errors.saveNoteFailed'));
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteVisible(false);
    await onSave('');
  };

  return (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.label}>
        {t('notes.title')}
      </Text>

      {hasNotes ? (
        <>
          <View style={[styles.noteCard, { backgroundColor: surfaces.cardItem }]}>
            <Text style={[styles.noteText, { color: surfaces.noteText }]}>
              {loc(notes)}
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon={tripIcon('pencil')}
              onPress={openEdit}
              textColor={accent.fg}
              theme={tripButtonTheme}
              style={[styles.actionButton, accent.outline]}
              contentStyle={tripButtonContentStyle}
              labelStyle={[tripOutlineIconLabelStyle, accent.label]}
            >
              {t('common.edit')}
            </Button>
            <Button
              mode="outlined"
              icon={tripIcon('delete')}
              onPress={() => setDeleteVisible(true)}
              textColor={accent.fg}
              theme={tripButtonTheme}
              style={[styles.actionButton, accent.outline]}
              contentStyle={tripButtonContentStyle}
              labelStyle={[tripOutlineIconLabelStyle, accent.label]}
            >
              {t('common.delete')}
            </Button>
          </View>
        </>
      ) : (
        <Button
          mode="outlined"
          icon={tripIcon('plus')}
          onPress={openCreate}
          textColor={accent.fg}
          theme={tripButtonTheme}
          style={[styles.addButton, accent.outline]}
          contentStyle={tripButtonContentStyle}
          labelStyle={[tripOutlineIconLabelStyle, accent.label]}
        >
          {t('common.add')}
        </Button>
      )}

      <Modal
        visible={editorVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditor}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeEditor} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: surfaces.sheet,
                height: sheetHeight,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <Text
              variant="titleMedium"
              style={{ color: surfaces.bodyText }}
            >
              {editorMode === 'create'
                ? t('notes.newTitle')
                : t('notes.editTitle')}
            </Text>

            <TextInput
              key={`note-draft-${i18n.language}`}
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                if (editorError) {
                  setEditorError(null);
                }
              }}
              mode="outlined"
              multiline
              placeholder={t('notes.placeholder')}
              style={[
                styles.sheetInput,
                { backgroundColor: surfaces.card },
              ]}
              contentStyle={styles.sheetInputContent}
              autoFocus
            />

            {editorError ? (
              <Text style={styles.editorError}>{editorError}</Text>
            ) : null}

            <View style={styles.sheetActions}>
              <Button
                mode="contained"
                onPress={() => void handleSave()}
                loading={saving}
                disabled={saving}
                buttonColor={primary}
                textColor={UI.onPrimary}
                theme={tripButtonTheme}
                style={[styles.sheetButton, styles.saveButton]}
                contentStyle={tripButtonContentStyle}
                labelStyle={tripFilledLabelStyle}
              >
                {t('common.save')}
              </Button>
              <Button
                mode="outlined"
                onPress={closeEditor}
                disabled={saving}
                textColor={accent.fg}
                theme={tripButtonTheme}
                style={[styles.sheetButton, styles.cancelButton, accent.outline]}
                contentStyle={tripButtonContentStyle}
                labelStyle={[tripOutlineLabelStyle, accent.label]}
              >
                {t('common.cancel')}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Portal>
        <Dialog
          visible={deleteVisible}
          onDismiss={() => setDeleteVisible(false)}
        >
          <Dialog.Title>{t('notes.deleteTitle')}</Dialog.Title>
          <Dialog.Content>
            <Text>{t('notes.deleteBody')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={accent.fg}
              onPress={() => setDeleteVisible(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                void handleConfirmDelete();
              }}
            >
              {t('common.delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 2,
    gap: TRIP_BUTTON.gap,
  },
  label: {
    opacity: 0.7,
  },
  noteCard: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TRIP_BUTTON.gap,
  },
  actionButton: {
    ...tripOutlineButtonStyle,
    flex: 1,
    minWidth: 0,
  },
  addButton: {
    ...tripOutlineButtonStyle,
    alignSelf: 'stretch',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  sheetInput: {
    flex: 1,
  },
  sheetInputContent: {
    flex: 1,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  editorError: {
    color: '#B3261E',
    fontSize: 13,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TRIP_BUTTON.gap,
    marginTop: 4,
    paddingBottom: 4,
  },
  sheetButton: {
    flex: 1,
    minWidth: 0,
    borderRadius: TRIP_BUTTON.borderRadius,
  },
  saveButton: {
    borderRadius: TRIP_BUTTON.borderRadius,
    backgroundColor: UI.primary,
  },
  cancelButton: {
    ...tripOutlineButtonStyle,
  },
});
