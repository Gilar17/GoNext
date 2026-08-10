import * as FileSystem from 'expo-file-system/legacy';

const PHOTOS_DIR_NAME = 'photos';

function getPhotosDirectory(): string {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('documentDirectory недоступен на этой платформе');
  }
  return `${base}${PHOTOS_DIR_NAME}/`;
}

export async function ensurePhotosDirectory(): Promise<string> {
  const dir = getPhotosDirectory();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0] ?? uri;
  const match = /\.([a-zA-Z0-9]+)$/.exec(clean);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}

/** Копирует файл в локальную ФС приложения и возвращает путь хранения. */
export async function savePhotoFile(sourceUri: string): Promise<string> {
  const dir = await ensurePhotosDirectory();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extensionFromUri(sourceUri)}`;
  const destination = `${dir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function deletePhotoFile(filePath: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(filePath);
  if (info.exists) {
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  }
}
