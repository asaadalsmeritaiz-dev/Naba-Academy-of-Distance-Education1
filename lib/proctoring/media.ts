import html2canvas from 'html2canvas';

export async function requestCameraAndScreen(): Promise<MediaStream> {
  try {
    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: true
    }).catch(() => {
      // Fallback: video only if audio is unavailable
      return navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    });

    let screenStream: MediaStream;
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
    } catch (e) {
      console.warn("Screen stream request blocked/unsupported. Using camera stream only for fallback.", e);
      return cameraStream;
    }

    const combined = new MediaStream();
    cameraStream.getTracks().forEach(t => combined.addTrack(t));
    screenStream.getTracks().forEach(t => combined.addTrack(t));
    return combined;
  } catch (error) {
    console.warn("Could not request real media streams (permissions or iframe sandbox). Creating a dummy simulated stream.", error);
    
    // Create a dummy Canvas stream for visual preview compatibility in preview mode
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    let frame = 0;
    const drawPlaceholder = () => {
      if (!ctx) return;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 480);
      
      // Moving gray circle simulation
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      const x = 320 + Math.sin(frame / 20) * 150;
      const y = 240 + Math.cos(frame / 20) * 100;
      ctx.arc(x, y, 60, 0, Math.PI * 2);
      ctx.fill();
      
      // Red recording dot and text
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(40, 40, 10, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Secure Exam Proctoring (Simulated Stream)', 70, 46);
      
      frame++;
      requestAnimationFrame(drawPlaceholder);
    };
    drawPlaceholder();
    
    const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : new MediaStream();
    return canvasStream;
  }
}

export function startRecording(
  stream: MediaStream, 
  onChunk: (chunk: Blob) => void, 
  onStop: (blob: Blob) => void
): MediaRecorder | null {
  try {
    // Try VP9 first, fallback to standard options or standard webm if needed
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/mp4' };
    }
    
    const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
        onChunk(e.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
      onStop(blob);
    };
    
    recorder.start(5000); // chunk every 5 seconds
    return recorder;
  } catch (error) {
    console.error("Failed to start MediaRecorder:", error);
    // Return a dummy object for mock operation
    let timerId: any = null;
    const dummyRecorder: any = {
      state: 'recording',
      stop: () => {
        clearInterval(timerId);
        if (dummyRecorder.onstop) {
          const dummyBlob = new Blob([new Uint8Array(1000)], { type: 'video/webm' });
          dummyRecorder.onstop();
          onStop(dummyBlob);
        }
      },
      start: () => {}
    };
    timerId = setInterval(() => {
      if (dummyRecorder.ondataavailable) {
        const dummyChunk = new Blob([new Uint8Array(100)], { type: 'video/webm' });
        onChunk(dummyChunk);
      }
    }, 5000);
    return dummyRecorder;
  }
}

export async function captureScreenshot() {
  try {
    const canvas = await html2canvas(document.body, {
      scale: 0.5,
      useCORS: true,
      logging: false
    });
    return {
      timestamp: new Date().toISOString(),
      data: canvas.toDataURL('image/jpeg', 0.6)
    };
  } catch (error) {
    console.warn("Screenshot capture blocked or failed, generating generic mockup.", error);
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = '#6366f1';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('EduSphere SECURE PROCTOR', 20, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Screenshot fall-back mock', 20, 70);
      ctx.fillText(new Date().toLocaleTimeString('ar-YE'), 20, 100);
    }
    return {
      timestamp: new Date().toISOString(),
      data: canvas.toDataURL('image/jpeg')
    };
  }
}
