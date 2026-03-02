import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Pause } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  existingAudioUrl?: string | null;
  onDelete: () => void;
}

export function VoiceRecorder({ onRecordingComplete, existingAudioUrl, onDelete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current && audioUrl) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioPlayerRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleDelete = () => {
    setAudioUrl(null);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    onDelete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Mic className="w-4 h-4 text-blue-500" />
          语音日记
        </h4>
        {isRecording && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-red-500">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!audioUrl && !isRecording && (
          <Button 
            onClick={startRecording}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border-dashed border-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            <Mic className="w-5 h-5" />
            点击开始录音
          </Button>
        )}

        {isRecording && (
          <Button 
            onClick={stopRecording}
            variant="destructive"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-lg animate-pulse"
          >
            <Square className="w-5 h-5 fill-current" />
            停止录音
          </Button>
        )}

        {audioUrl && !isRecording && (
          <div className="flex items-center gap-2 w-full bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <div className="flex-1 h-8 flex items-center gap-0.5 px-2">
              {/* Fake Waveform Visual */}
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`}
                  style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>

            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}