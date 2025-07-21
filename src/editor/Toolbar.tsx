import { Image, Type, Video, LayoutGrid } from 'lucide-react';

export type DraggableContentType = 'text' | 'image' | 'video';

interface ToolbarProps {
  onDragStart: (e: React.DragEvent, type: DraggableContentType) => void;
  onGridClick: () => void;
  isCanvasActive: boolean;
}

export default function Toolbar({ onDragStart, onGridClick, isCanvasActive }: ToolbarProps) {
  return (
    // FIX: All positioning classes like 'fixed', 'left', and 'top' have been removed.
    // This component is now only responsible for its own appearance.
    <div
      className="flex flex-col items-center gap-2 p-2 rounded-full border border-white/20 shadow-lg z-50"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <button
        draggable
        onDragStart={(e) => onDragStart(e, 'text')}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
        title="Drag to add Text"
      >
        <Type size={24} className="text-gray-700" />
      </button>
      <button
        draggable
        onDragStart={(e) => onDragStart(e, 'image')}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
        title="Drag to add Image"
      >
        <Image size={24} className="text-gray-700" />
      </button>
      <button
        draggable
        onDragStart={(e) => onDragStart(e, 'video')}
        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors"
        title="Drag to add Video"
      >
        <Video size={24} className="text-gray-700" />
      </button>

      <div className="my-2 h-[1px] w-8 bg-white/30" />

      <button
        onClick={onGridClick}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${
          isCanvasActive ? 'bg-blue-500 text-white' : 'bg-white/50 text-gray-700 hover:bg-white/80'
        }`}
        title="Toggle Split Mode (Alt)"
      >
        <LayoutGrid size={24} />
      </button>
    </div>
  );
}