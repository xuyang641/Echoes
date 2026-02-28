import { useState, useRef } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { MoodSelector, type MoodType } from "@/app/components/mood-selector";
import { Card } from "@/app/components/ui/card";

export interface DiaryEntry {
  id: string;
  date: string;
  photo: string;
  mood: MoodType;
  note: string;
}

interface AddEntryFormProps {
  onSave: (entry: Omit<DiaryEntry, "id" | "date">) => void;
  onCancel: () => void;
}

export function AddEntryForm({ onSave, onCancel }: AddEntryFormProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (photo && mood) {
      onSave({ photo, mood, note });
      // Reset form
      setPhoto(null);
      setMood(null);
      setNote("");
    }
  };

  const canSubmit = photo && mood;

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="mb-2 block">照片</Label>
          
          {!photo ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">点击上传照片</p>
              <p className="text-sm text-gray-400 mt-1">或拖放到此处</p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={photo}
                alt="Diary entry"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div>
          <Label className="mb-3 block">你现在感觉如何？</Label>
          <MoodSelector selectedMood={mood} onSelectMood={setMood} />
        </div>

        <div>
          <Label htmlFor="note" className="mb-2 block">
            备注 (可选)
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天有什么特别的事吗？"
            className="min-h-24 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="flex-1"
          >
            保存记录
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            取消
          </Button>
        </div>
      </form>
    </Card>
  );
}