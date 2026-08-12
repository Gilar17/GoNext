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
import {
  TRIP_BUTTON,
  tripButtonContentStyle,
  tripButtonTheme,
  tripFilledLabelStyle,
  tripOutlineButtonStyle,
  tripOutlineIconLabelStyle,
  tripOutlineLabelStyle,
} from '@/src/theme/tripButtons';
import { UI } from '@/src/theme/ui';

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
  const theme = useTheme();
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
      setEditorError('Заметка не может быть пустой');
      return;
    }
    setEditorError(null);
    try {
      await onSave(trimmed);
      setEditorVisible(false);
    } catch {
      setEditorError('Не удалось сохранить заметку');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteVisible(false);
    await onSave('');
  };

  return (
    <View style={styles.section}>
      <Text variant="titleSmall" style={styles.label}>
        Заметки
      </Text>

      {hasNotes ? (
        <>
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{notes}</Text>
          </View>
          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              icon={tripIcon('pencil')}
              onPress={openEdit}
              textColor={UI.primary}
              theme={tripButtonTheme}
              style={styles.actionButton}
              contentStyle={tripButtonContentStyle}
              labelStyle={tripOutlineIconLabelStyle}
            >
              Изменить
            </Button>
            <Button
              mode="outlined"
              icon={tripIcon('delete')}
              onPress={() => setDeleteVisible(true)}
              textColor={UI.primary}
              theme={tripButtonTheme}
              style={styles.actionButton}
              contentStyle={tripButtonContentStyle}
              labelStyle={tripOutlineIconLabelStyle}
            >
              Удалить
            </Button>
          </View>
        </>
      ) : (
        <Button
          mode="outlined"
          icon={tripIcon('plus')}
          onPress={openCreate}
          textColor={UI.primary}
          theme={tripButtonTheme}
          style={styles.addButton}
          contentStyle={tripButtonContentStyle}
          labelStyle={tripOutlineIconLabelStyle}
        >
          Добавить
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
                height: sheetHeight,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <Text variant="titleMedium" style={styles.sheetTitle}>
              {editorMode === 'create'
                ? 'Новая заметка'
                : 'Редактировать заметку'}
            </Text>

            <TextInput
              value={draft}
              onChangeText={(text) => {
                setDraft(text);
                if (editorError) {
                  setEditorError(null);
                }
              }}
              mode="outlined"
              multiline
              placeholder="Текст заметки"
              style={styles.sheetInput}
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
                buttonColor={UI.primary}
                textColor={UI.onPrimary}
                theme={tripButtonTheme}
                style={[styles.sheetButton, styles.saveButton]}
                contentStyle={tripButtonContentStyle}
                labelStyle={tripFilledLabelStyle}
              >
                Сохранить
              </Button>
              <Button
                mode="outlined"
                onPress={closeEditor}
                disabled={saving}
                textColor={UI.primary}
                theme={tripButtonTheme}
                style={[styles.sheetButton, styles.cancelButton]}
                contentStyle={tripButtonContentStyle}
                labelStyle={tripOutlineLabelStyle}
              >
                Отмена
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
          <Dialog.Title>Удалить заметку?</Dialog.Title>
          <Dialog.Content>
            <Text>Текст заметки будет удалён безвозвратно.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              textColor={UI.primary}
              onPress={() => setDeleteVisible(false)}
            >
              Отмена
            </Button>
            <Button
              textColor={theme.colors.error}
              onPress={() => {
                void handleConfirmDelete();
              }}
            >
              Удалить
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
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noteText: {
    color: '#222',
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
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  sheetTitle: {
    color: '#111',
  },
  sheetInput: {
    flex: 1,
    backgroundColor: '#fff',
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
