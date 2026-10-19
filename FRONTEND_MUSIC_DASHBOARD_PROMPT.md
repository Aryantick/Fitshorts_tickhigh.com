# 🎵 TickHigh FitShort - Admin Music Management & Bulk Upload
## Complete & Updated Frontend Implementation Guide & AI Master Prompt

---

## 📌 Updated Backend Endpoints Summary

All requests require the Super Admin JWT token in headers:
```http
Authorization: Bearer <ADMIN_JWT_TOKEN>
```

| Action | HTTP Method | Endpoint | Description |
|---|---|---|---|
| **List Music** | `GET` | `/api/admin/music?category=<cat>` | Fetches all active tracks with temporary S3 streaming URLs and category list. |
| **Categories** | `GET` | `/api/admin/music/categories` | Fetches available music category strings. |
| **Batch Upload URLs** | `POST` | `/api/admin/music/batch-upload-urls` | Generates up to 5 presigned S3 PUT URLs for direct audio upload. |
| **Direct S3 Upload** | `PUT` | `<presignedUploadUrl>` | Direct binary upload to S3. **Do NOT send Bearer token to S3.** |
| **Bulk Save Tracks** | `POST` | `/api/admin/music/bulk-upload` | Commits metadata array to the database. |
| **Delete Track** | `DELETE` | `/api/admin/music/:id` | Permanently deletes track from database and cleans up S3 audio file. |
| **Get Track By ID** | `GET` | `/api/admin/music/:id` | Fetches single track details. |

---

## 📋 Copy-Paste Master Prompt for Frontend Engineer / AI Assistant

```markdown
You are a senior React + TypeScript frontend engineer working on the FitShort Admin Dashboard (`frontendadmin`).
Update and refine the **Music Management & Bulk Upload** feature inside `src/page/MusicManagement/MusicManagement.tsx`, `src/api/endpoints.ts`, and accompanying components using TailwindCSS / SCSS and Lucide Icons.

---

### 1. Endpoint Configuration (`src/api/endpoints.ts`)
Ensure the `MUSIC` object in endpoints has all routes strictly mapped to the `/admin/music` endpoints:

```typescript
MUSIC: {
  LIST: '/admin/music',
  CATEGORIES: '/admin/music/categories',
  BATCH_UPLOAD_URLS: '/admin/music/batch-upload-urls',
  BULK_UPLOAD: '/admin/music/bulk-upload',
  BY_ID: (id: string | number) => `/admin/music/${id}`,
  DELETE: (id: string | number) => `/admin/music/${id}`,
},
```

---

### 2. Music Deletion with Confirmation & Audio Cleanup
In `MusicManagement.tsx`:
1. **Delete Confirmation Dialog**:
   - When the user clicks the red trash icon on any row in the table, open a confirmation modal/dialog:
     - Title: *"Delete Music Track"*
     - Message: *"Are you sure you want to permanently delete \"{track.title}\"? This will also remove the audio file from S3."*
     - Buttons: *"Cancel"* and *"Delete Track"* (danger/red variant).
2. **Delete Request Execution**:
   - On confirmation, call `DELETE /api/admin/music/${track.id}`.
   - Show loading spinner on the delete button during deletion.
   - If the track being deleted is currently playing in the preview audio player, **stop and reset the audio player immediately**.
3. **Optimistic / Query Refresh**:
   - On success:
     - Show success toast: *"Music track '{track.title}' deleted successfully"*.
     - Refetch table data or optimistically remove the track from state.
   - On error:
     - Show error toast with the backend error message.

---

### 3. Bulk Upload Modal (Category-First Flow)
In `BulkMusicUploadModal.tsx`:
1. **Step 1 - Target Category Selector (At the top of the modal)**:
   - A prominent `<select>` dropdown labeled: *"1. Select Target Category for this Batch *"*.
   - Populated dynamically with data from `GET /api/admin/music/categories` (e.g. Workout, Motivational, Calm, Devotional, Party, Romantic, Sad).
   - This category is applied to all files in the current upload batch.
2. **Step 2 - Drag & Drop Audio Dropzone**:
   - Accepts `.mp3, .wav, .m4a, .aac, .ogg`.
   - Max 5 files per batch.
   - Displays slot indicator (e.g., *"3 of 5 slots used"*).
3. **Step 3 - Track Cards (Up to 5 cards)**:
   For each selected file:
   - **Play/Pause preview button** to listen locally via `URL.createObjectURL(file)`.
   - **Title input**: Auto-populated from filename (stripped of extension and formatted with spaces). Editable.
   - **Artist input**: Default value `"FitShot Licensed"`. Editable.
   - **Category Pill**: Read-only badge displaying the batch category chosen in Step 1.
   - **Duration badge**: Auto-calculated duration in seconds (`⏱ mm:ss`) extracted asynchronously using `new Audio()`.
   - **Upload progress bar**: Displays 0% to 100% per-file upload progress.
   - **Trash button**: Allows removing an individual file before upload.
4. **Step 4 - Upload Execution**:
   When *"Upload All (N Tracks)"* is clicked:
   - Step A: `POST /api/admin/music/batch-upload-urls` with `{ files: [{ fileName, fileExtension }] }`.
   - Step B: Upload each raw audio file directly to its presigned S3 URL via `axios.put(item.uploadUrl, file, { headers: { 'Content-Type': 'audio/' + ext }, onUploadProgress: ... })`.
   - Step C: Commit metadata to `POST /api/admin/music/bulk-upload` with:
     ```json
     {
       "tracks": [
         {
           "title": "Track Title",
           "artist": "Artist Name",
           "s3Key": "music/1/uuid.mp3",
           "durationSec": 180,
           "category": "workout"
         }
       ]
     }
     ```
   - Step D: Close modal, show toast notification, and refresh table data.

---

### 4. Audio Playback Management in Table
- Maintain a single shared `Audio` instance or ref.
- Only one track can play at a time.
- Clicking play on track B pauses track A and starts track B.
- Clicking pause stops playback.
- When audio finishes playing (`onended`), reset playing state back to idle.
- Pause and cleanup audio instance on component unmount (`useEffect` cleanup).

---

### 5. Reusable Audio Duration Extractor Utility
```typescript
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.round(audio.duration) || 0);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
};
```
```
