import { asyncHandler } from '../utils/asyncHandler.js';
import { getSettings, presentPublicSettings, updateSettings } from '../services/settings.service.js';
import { isStorageConfigured } from '../services/upload.service.js';

export const publicSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({ success: true, settings: presentPublicSettings(settings) });
});

export const adminSettings = asyncHandler(async (_req, res) => {
  const settings = await getSettings();
  res.json({
    success: true,
    settings,
    storageConfigured: isStorageConfigured(),
  });
});

export const saveSettings = asyncHandler(async (req, res) => {
  const settings = await updateSettings(req.body);
  res.json({ success: true, settings });
});
