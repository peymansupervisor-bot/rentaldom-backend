"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
const supabase_1 = require("./supabase");
const sharp_1 = __importDefault(require("sharp"));
const uuid_1 = require("uuid");
// Resize + compress an image buffer, upload to Supabase Storage, return public URL
async function uploadImage(buffer, folder, options = {}) {
    const { width = 1200, height, quality = 82 } = options;
    const compressed = await (0, sharp_1.default)(buffer)
        .rotate() // auto-orient from EXIF
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    const filename = `${folder}/${(0, uuid_1.v4)()}.jpg`;
    const { error } = await supabase_1.supabase.storage
        .from(supabase_1.BUCKET)
        .upload(filename, compressed, {
        contentType: 'image/jpeg',
        upsert: false,
    });
    if (error)
        throw new Error(`Storage upload failed: ${error.message}`);
    const { data } = supabase_1.supabase.storage.from(supabase_1.BUCKET).getPublicUrl(filename);
    return data.publicUrl;
}
async function deleteImage(url) {
    // Extract path after the bucket name
    const parts = url.split(`/${supabase_1.BUCKET}/`);
    if (parts.length < 2)
        return;
    await supabase_1.supabase.storage.from(supabase_1.BUCKET).remove([parts[1]]);
}
