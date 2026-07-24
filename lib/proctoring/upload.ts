import * as tus from 'tus-js-client';
import { createClient } from '../supabase/client';

// Helper to extract or fallback to project ID
function getSupabaseProjectId(): string {
  const url = 
    (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_URL : undefined) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    "";
  
  if (url) {
    try {
      const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
      if (match) return match[1];
    } catch (e) {
      // ignore
    }
  }

  return (
    (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID : undefined) ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 
    process.env.SUPABASE_PROJECT_ID || 
    "mock-project-id"
  );
}

export async function uploadVideoToSupabase(
  videoBlob: Blob,
  examId: string,
  studentId: string,
  onProgress: (percentage: number) => void
): Promise<string> {
  const projectId = getSupabaseProjectId();
  const isMock = !projectId || projectId === "mock-project-id";

  if (isMock) {
    console.log("Supabase Project ID not configured. Simulating video upload progress...");
    return new Promise((resolve) => {
      let pct = 0;
      const interval = setInterval(() => {
        pct += 10;
        onProgress(pct);
        if (pct >= 100) {
          clearInterval(interval);
          resolve(`https://mock-storage.supabase.co/object/public/proctoring-videos/exams/${examId}/students/${studentId}/recording.webm`);
        }
      }, 150);
    });
  }

  // Real upload using tus-js-client
  return new Promise(async (resolve, reject) => {
    try {
      const supabase = createClient();
      let accessToken = "";
      try {
        const { data } = await supabase.auth.getSession();
        accessToken = data?.session?.access_token || "";
      } catch (sessionErr) {
        console.warn("Could not retrieve active Supabase session token. Proceeding with public/anonymous access.", sessionErr);
      }

      // If we don't have a session token, fallback to the anon key if possible
      const anonKey = 
        (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
        process.env.SUPABASE_ANON_KEY || 
        "";

      const token = accessToken || anonKey;
      const objectName = `exams/${examId}/students/${studentId}/recording.webm`;
      
      const upload = new tus.Upload(videoBlob, {
        endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
          authorization: `Bearer ${token}`,
          'x-upsert': 'true'
        },
        metadata: {
          bucketName: 'proctoring-videos',
          objectName: objectName,
          contentType: 'video/webm',
          cacheControl: '3600'
        },
        chunkSize: 6 * 1024 * 1024, // 6MB chunks
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = (bytesUploaded / bytesTotal) * 100;
          onProgress(Math.round(pct));
        },
        onSuccess: () => {
          const url = `https://${projectId}.storage.supabase.co/storage/v1/object/public/proctoring-videos/${objectName}`;
          resolve(url);
        },
        onError: (err) => {
          console.error("tus-js-client error during upload:", err);
          reject(err);
        }
      });

      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
        upload.start();
      }).catch((findErr) => {
        console.warn("Could not find previous upload, starting from scratch:", findErr);
        upload.start();
      });
    } catch (error) {
      console.error("Failed to construct upload wrapper:", error);
      reject(error);
    }
  });
}

export async function uploadSnapshotsToSupabase(
  snapshots: Array<{ timestamp: string; data: string }>,
  examId: string,
  studentId: string
): Promise<string[]> {
  const projectId = getSupabaseProjectId();
  const isMock = !projectId || projectId === "mock-project-id";

  if (isMock) {
    console.log("Supabase Project ID not configured. Simulating snapshots upload...");
    return snapshots.map((s, index) => {
      const tsClean = s.timestamp.replace(/:/g, '-');
      return `https://mock-storage.supabase.co/object/public/proctoring-snapshots/exams/${examId}/students/${studentId}/snapshot_${index}_${tsClean}.png`;
    });
  }

  try {
    const supabase = createClient();
    let accessToken = "";
    try {
      const { data } = await supabase.auth.getSession();
      accessToken = data?.session?.access_token || "";
    } catch (sessionErr) {
      console.warn("Could not retrieve active Supabase session token. Proceeding with public/anonymous access.", sessionErr);
    }

    const anonKey = 
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      process.env.SUPABASE_ANON_KEY || 
      "";

    const token = accessToken || anonKey;

    const promises = snapshots.map(async (snap, index) => {
      try {
        const res = await fetch(snap.data);
        const blob = await res.blob();
        
        const objectName = `exams/${examId}/students/${studentId}/snapshot_${index}_${snap.timestamp.replace(/:/g, '-')}.png`;

        return new Promise<string>((resolve, reject) => {
          const upload = new tus.Upload(blob, {
            endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${token}`,
              'x-upsert': 'true'
            },
            metadata: {
              bucketName: 'proctoring-snapshots',
              objectName: objectName,
              contentType: 'image/png',
              cacheControl: '3600'
            },
            chunkSize: 6 * 1024 * 1024,
            onSuccess: () => {
              const url = `https://${projectId}.storage.supabase.co/storage/v1/object/public/proctoring-snapshots/${objectName}`;
              resolve(url);
            },
            onError: (err) => {
              console.error(`TUS upload error for snapshot ${index}:`, err);
              reject(err);
            }
          });

          upload.findPreviousUploads().then((prev) => {
            if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
            upload.start();
          }).catch((findErr) => {
            console.warn(`Could not find previous upload for snapshot ${index}, starting from scratch:`, findErr);
            upload.start();
          });
        });
      } catch (err) {
        console.error(`Snapshot ${index} item processing failed:`, err);
        return snap.data;
      }
    });

    return await Promise.all(promises);
  } catch (error) {
    console.warn("Failed to complete TUS snapshot uploads, returning original data URLs.", error);
    return snapshots.map(s => s.data);
  }
}

