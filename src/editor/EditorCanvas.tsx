import {
  type FocusEvent,
  type MouseEvent,
  type DragEvent,
  type WheelEvent,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Trash2, Move } from "lucide-react";

// Custom Hook for State History (Undo/Redo)
const useHistoryState = <T,>(initialState: T) => {
  const [history, setHistory] = useState<{ past: T[], present: T, future: T[] }>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setHistory(currentHistory => {
      const newPresent = newState instanceof Function ? newState(currentHistory.present) : newState;
      if (JSON.stringify(newPresent) === JSON.stringify(currentHistory.present)) {
        return currentHistory; // No change, don't add to history
      }
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: newPresent,
        future: [], // Clear future on new action
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.past.length === 0) return currentHistory;
      const previous = currentHistory.past[currentHistory.past.length - 1];
      const newPast = currentHistory.past.slice(0, currentHistory.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [currentHistory.present, ...currentHistory.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(currentHistory => {
      if (currentHistory.future.length === 0) return currentHistory;
      const next = currentHistory.future[0];
      const newFuture = currentHistory.future.slice(1);
      return {
        past: [...currentHistory.past, currentHistory.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  return { 
    state: history.present, 
    setState, 
    undo, 
    redo, 
    canUndo: history.past.length > 0, 
    canRedo: history.future.length > 0 
  };
};
import Toolbar, { type DraggableContentType } from "./Toolbar";

// --- Types (Unchanged) ---
type ContentType = "text" | "image" | "video" | "pdf";
type Content = {
  type: ContentType;
  value: string;
  scale?: number;
  xOffset?: number;
  yOffset?: number;
};
type Section = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: Content | null;
};

// --- SectionContent Component (Unchanged) ---
function SectionContent({
  content,
  isEditing,
  onUpdate,
}: {
  content: Content;
  isEditing: boolean;
  onUpdate: (newValue: string) => void;
}) {
  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    position: "relative",
    containerType: "inline-size",
  };
  const mediaStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: `translate(-50%, -50%) translate(${content.xOffset || 0}px, ${
      content.yOffset || 0
    }px) scale(${content.scale || 1})`,
    minWidth: "100%",
    minHeight: "100%",
    objectFit: "cover",
    transition: isEditing ? "none" : "transform 0.2s ease-out",
    userSelect: "none",
  };
  switch (content.type) {
    case "text":
      return (
        <div style={containerStyle} className="p-2 text-gray-700">
          <div
            contentEditable={!isEditing}
            suppressContentEditableWarning={true}
            onBlur={(e: FocusEvent<HTMLDivElement>) =>
              onUpdate(e.currentTarget.innerText)
            }
            style={{
              fontSize: "clamp(8px, 5cqw, 48px)",
              outline: "none",
              height: "100%",
              cursor: "text",
            }}
          >
            {content.value}
          </div>
        </div>
      );
    case "image":
      return (
        <div style={containerStyle}>
          <img
            src={content.value}
            alt="User content"
            style={mediaStyle}
            draggable="false"
          />
        </div>
      );
    case "video":
      return (
        <div style={containerStyle}>
          <video
            src={content.value}
            style={mediaStyle}
            autoPlay
            muted
            loop
            draggable="false"
          />
        </div>
      );
    default:
      return null;
  }
}

// --- Main Editor Component ---
export default function EditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hoveredSectionRef = useRef<Section | null>(null);

  const isCanvasActive = useRef(false);
  const isCtrlPressed = useRef(false);
  const mousePosition = useRef({ x: 0, y: 0 });

  const { state: sections, setState: setSections, undo, redo } = useHistoryState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const dragInfo = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialXOffset: 0,
    initialYOffset: 0,
  });

  const [mergeState, setMergeState] = useState({
    isMerging: false,
    sourceId: null as string | null,
    targetId: null as string | null,
  });

  // State for the new drag-and-drop functionality
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [canvasModeActive, setCanvasModeActive] = useState(false);

  // --- All useEffects and most handlers remain the same ---
  useEffect(() => {
    if (canvasRef.current) {
      const b = canvasRef.current.getBoundingClientRect();
      setSections([
        {
          id: crypto.randomUUID(),
          x: 0,
          y: 0,
          width: b.width,
          height: b.height,
          content: null,
        },
      ]);
    }
  }, []);

  const [toolbarPosition, setToolbarPosition] = useState({ top: 80, left: 0 });

  // --- useEffect Hooks ---
  useEffect(() => {
    if (canvasRef.current) {
      const b = canvasRef.current.getBoundingClientRect();
      setSections([
        {
          id: crypto.randomUUID(),
          x: 0,
          y: 0,
          width: b.width,
          height: b.height,
          content: null,
        },
      ]);
    }
  }, []);

  // FIX: This effect calculates the toolbar's position and updates it on window resize.
  useEffect(() => { if (canvasRef.current) { const b = canvasRef.current.getBoundingClientRect(); setSections([{ id: crypto.randomUUID(), x: 0, y: 0, width: b.width, height: b.height, content: null }]); } }, []);
  
  // FIX: This effect now ONLY calculates the horizontal position and no longer listens to scroll events.
  useEffect(() => {
    const calculateLeftPosition = () => {
      if (canvasRef.current) {
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const toolbarWidth = 64; 
        const desiredGap = 20;

        setToolbarPosition(prevPos => ({
            ...prevPos, // Keep the existing top position
            left: canvasRect.left - toolbarWidth - desiredGap,
        }));
      }
    };

    const timeoutId = setTimeout(calculateLeftPosition, 50);
    window.addEventListener('resize', calculateLeftPosition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateLeftPosition);
    };
  }, []); // Run only once on mount

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      const isUndo = (e.metaKey || e.ctrlKey) && e.key === 'z';
      const isRedo = (e.metaKey || e.ctrlKey) && e.key === 'y';

      if (isUndo) {
        e.preventDefault();
        undo();
        return;
      } else if (isRedo) {
        e.preventDefault();
        redo();
        return;
      } else if (e.key === "Backspace" && selectedSectionId) {
        e.preventDefault();
        handleDeleteSection(selectedSectionId);
      } else if (e.key === "Enter" && editingSectionId) {
        e.preventDefault();
        setEditingSectionId(null);
      } else if (e.key === "Alt") {
        e.preventDefault();
        toggleCanvasMode();
      } else if (e.key === "Control") {
        isCtrlPressed.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control") isCtrlPressed.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedSectionId, editingSectionId, sections]);
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.style.overflow = editingSectionId ? "hidden" : "auto";
    }
  }, [editingSectionId]);
  useEffect(() => {
    const canvas = canvasRef.current,
      line = lineRef.current;
    if (!canvas || !line || editingSectionId) {
      if (line) line.style.opacity = "0";
      return;
    }
    const handleLocalMouseMove = (e: globalThis.MouseEvent) => {
      if (!isCanvasActive.current) {
        line.style.opacity = "0";
        return;
      }
      const canvasBounds = canvas.getBoundingClientRect();
      const x = e.clientX - canvasBounds.left;
      const y = e.clientY - canvasBounds.top;
      mousePosition.current = { x, y };
      const currentSection = sections.find(
        (s) => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height
      );
      hoveredSectionRef.current = currentSection ?? null;
      if (!currentSection) {
        line.style.opacity = "0";
        return;
      }
      if (isCtrlPressed.current) {
        line.style.width = "1px";
        line.style.height = `${currentSection.height}px`;
        line.style.transform = `translate(${x}px, ${currentSection.y}px)`;
      } else {
        line.style.width = `${currentSection.width}px`;
        line.style.height = "1px";
        line.style.transform = `translate(${currentSection.x}px, ${y}px)`;
      }
      line.style.opacity = "1";
    };
    const handleMouseLeave = () => {
      if (line) line.style.opacity = "0";
    };
    canvas.addEventListener("mousemove", handleLocalMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleLocalMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [sections, editingSectionId]);

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: DragEvent, type: DraggableContentType) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData("contentType", type);
    }
  };
  const handleDragOver = (e: DragEvent, sectionId: string) => {
    e.preventDefault();
    setDropTargetId(sectionId);
  };
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
  };
  const handleDrop = (e: DragEvent, sectionId: string) => {
    e.preventDefault();
    setDropTargetId(null);
    if (!e.dataTransfer) return;
    const type = e.dataTransfer.getData("contentType") as DraggableContentType;
    const targetSection = sections.find((s) => s.id === sectionId);
    if (targetSection && !targetSection.content) {
      if (type === "text") {
        handleAddContent(type, "You can edit this text.", sectionId);
      } else {
        triggerFileUpload(type, sectionId);
      }
    }
  };

  // --- Modified Content Handlers ---
  const handleAddContent = (
    contentType: ContentType,
    value: string,
    sectionId: string
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              content: {
                type: contentType,
                value,
                scale: 1,
                xOffset: 0,
                yOffset: 0,
              },
            }
          : s
      )
    );
  };
  const triggerFileUpload = (contentType: ContentType, sectionId: string) => {
    if (!fileInputRef.current) return;
    const acceptMap: Record<ContentType, string> = {
      image: "image/*",
      video: "video/*",
      text: "",
      pdf: ".pdf",
    };
    fileInputRef.current.accept = acceptMap[contentType];
    fileInputRef.current.onchange = (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (file) {
        const localUrl = URL.createObjectURL(file);
        handleAddContent(contentType, localUrl, sectionId);
      }
    };
    fileInputRef.current.click();
  };

  // --- Other Handlers (Unchanged) ---
  const handleSplit = () => {
    if (!isCanvasActive.current || !hoveredSectionRef.current) return;
    const sectionToSplit = hoveredSectionRef.current;
    const { x: mouseX, y: mouseY } = mousePosition.current;
    setSections((prevSections) => {
      const otherSections = prevSections.filter(
        (s) => s.id !== sectionToSplit.id
      );
      let newSections: Section[] = [];
      if (isCtrlPressed.current) {
        newSections.push({
          id: crypto.randomUUID(),
          x: sectionToSplit.x,
          y: sectionToSplit.y,
          width: mouseX - sectionToSplit.x,
          height: sectionToSplit.height,
          content: sectionToSplit.content,
        });
        newSections.push({
          id: crypto.randomUUID(),
          x: mouseX,
          y: sectionToSplit.y,
          width: sectionToSplit.x + sectionToSplit.width - mouseX,
          height: sectionToSplit.height,
          content: null,
        });
      } else {
        newSections.push({
          id: crypto.randomUUID(),
          x: sectionToSplit.x,
          y: sectionToSplit.y,
          width: sectionToSplit.width,
          height: mouseY - sectionToSplit.y,
          content: sectionToSplit.content,
        });
        newSections.push({
          id: crypto.randomUUID(),
          x: sectionToSplit.x,
          y: mouseY,
          width: sectionToSplit.width,
          height: sectionToSplit.y + sectionToSplit.height - mouseY,
          content: null,
        });
      }
      return [...otherSections, ...newSections];
    });
  };
  const handleDeleteSection = (sectionId: string) => {
    const sectionToDelete = sections.find((s) => s.id === sectionId);
    if (!sectionToDelete) return;
    const otherSections = sections.filter((s) => s.id !== sectionId);
    const horizontalNeighbors = otherSections.filter(
      (s) =>
        s.y === sectionToDelete.y &&
        s.height === sectionToDelete.height &&
        (s.x + s.width === sectionToDelete.x ||
          s.x === sectionToDelete.x + sectionToDelete.width)
    );
    const verticalNeighbors = otherSections.filter(
      (s) =>
        s.x === sectionToDelete.x &&
        s.width === sectionToDelete.width &&
        (s.y + s.height === sectionToDelete.y ||
          s.y === sectionToDelete.y + sectionToDelete.height)
    );
    const sortedNeighbors = [
      ...horizontalNeighbors.filter((s) => !s.content),
      ...horizontalNeighbors.filter((s) => s.content),
      ...verticalNeighbors.filter((s) => !s.content),
      ...verticalNeighbors.filter((s) => s.content),
    ];
    const neighborToExpand = sortedNeighbors[0];
    if (neighborToExpand) {
      const remainingSections = otherSections.filter(
        (s) => s.id !== neighborToExpand.id
      );
      const newSection: Section = {
        id: neighborToExpand.id,
        content: neighborToExpand.content,
        x: Math.min(sectionToDelete.x, neighborToExpand.x),
        y: Math.min(sectionToDelete.y, neighborToExpand.y),
        width: sectionToDelete.width + neighborToExpand.width,
        height: sectionToDelete.height + neighborToExpand.height,
      };
      if (horizontalNeighbors.includes(neighborToExpand)) {
        newSection.height = sectionToDelete.height;
      } else {
        newSection.width = sectionToDelete.width;
      }
      setSections([...remainingSections, newSection]);
    } else {
      setSections(otherSections);
    }
    setSelectedSectionId(null);
  };
  const handleContentUpdate = (sectionId: string, newValue: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId && s.content
          ? { ...s, content: { ...s.content, value: newValue } }
          : s
      )
    );
  };
  const handleDeleteContent = (e: MouseEvent, sectionId: string) => {
    e.stopPropagation();
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, content: null } : s))
    );
  };
  const handleSectionClick = (e: MouseEvent, section: Section) => {
    e.stopPropagation();
    if (editingSectionId) {
      setEditingSectionId(null);
      return;
    }
    setSelectedSectionId(!section.content ? section.id : null);
  };
  const handleMergeMouseDown = (e: MouseEvent, sourceSectionId: string) => {
    e.stopPropagation();
    setMergeState({
      isMerging: true,
      sourceId: sourceSectionId,
      targetId: null,
    });
  };
  const handleMergeSections = (sourceId: string, targetId: string) => {
    const sourceSection = sections.find((s) => s.id === sourceId);
    const targetSection = sections.find((s) => s.id === targetId);
    if (!sourceSection || !targetSection) return;
    const remainingSections = sections.filter(
      (s) => s.id !== sourceId && s.id !== targetId
    );
    const newMergedSection: Section = {
      id: targetSection.id,
      content: targetSection.content,
      x: Math.min(sourceSection.x, targetSection.x),
      y: Math.min(sourceSection.y, targetSection.y),
      width:
        Math.max(
          sourceSection.x + sourceSection.width,
          targetSection.x + targetSection.width
        ) - Math.min(sourceSection.x, targetSection.x),
      height:
        Math.max(
          sourceSection.y + sourceSection.height,
          targetSection.y + targetSection.height
        ) - Math.min(sourceSection.y, targetSection.y),
    };
    setSections([...remainingSections, newMergedSection]);
  };
  const toggleCanvasMode = () => {
    isCanvasActive.current = !isCanvasActive.current;
    setCanvasModeActive(isCanvasActive.current);
    if (!isCanvasActive.current) {
      if (lineRef.current) lineRef.current.style.opacity = "0";
      setSelectedSectionId(null);
      setEditingSectionId(null);
    }
  };
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (mergeState.isMerging) {
      const canvasBounds = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - canvasBounds.left;
      const y = e.clientY - canvasBounds.top;
      const target = sections.find(
        (s) =>
          s.id !== mergeState.sourceId &&
          x >= s.x &&
          x <= s.x + s.width &&
          y >= s.y &&
          y <= s.y + s.height
      );
      setMergeState((prev) => ({ ...prev, targetId: target?.id || null }));
    }
    if (dragInfo.current.isDragging && editingSectionId) {
      const dx = e.clientX - dragInfo.current.startX;
      const dy = e.clientY - dragInfo.current.startY;
      setSections((prev) =>
        prev.map((s) =>
          s.id === editingSectionId && s.content
            ? {
                ...s,
                content: {
                  ...s.content,
                  xOffset: dragInfo.current.initialXOffset + dx,
                  yOffset: dragInfo.current.initialYOffset + dy,
                },
              }
            : s
        )
      );
    }
  };
  const handleGlobalMouseUp = () => {
    if (mergeState.isMerging && mergeState.sourceId && mergeState.targetId) {
      handleMergeSections(mergeState.sourceId, mergeState.targetId);
    }
    setMergeState({ isMerging: false, sourceId: null, targetId: null });
    if (dragInfo.current.isDragging) {
      dragInfo.current.isDragging = false;
    }
  };

  return (
    <div className="flex-1 w-full h-full relative">
      <div
        style={{
          position: "fixed",
          top: toolbarPosition.top,
          left: toolbarPosition.left,
          transition: "top 0.2s, left 0.2s",
          zIndex: 50,
        }}
      >
        <Toolbar
          onDragStart={handleDragStart}
          onGridClick={toggleCanvasMode}
          isCanvasActive={canvasModeActive}
        />
      </div>

      {/* FIX: This container is now positioned absolutely to fill its parent, which enables scrolling */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 flex justify-end items-start p-8 md:p-20 overflow-auto"
        onMouseMove={handleGlobalMouseMove}
        onMouseUp={handleGlobalMouseUp}
      >
        <input type="file" ref={fileInputRef} style={{ display: "none" }} />
        <div
          ref={canvasRef}
          onMouseDown={handleSplit}
          className="bg-white shadow-2xl rounded-md relative flex-shrink-0"
          style={{
            width: "210mm",
            height: "297mm",
            cursor: canvasModeActive ? "crosshair" : "default",
          }}
        >
          {sections.map((section) => {
            const isEditing = editingSectionId === section.id;
            const isSelected = selectedSectionId === section.id;
            const isMergeTarget = mergeState.targetId === section.id;
            const isDropTarget = dropTargetId === section.id;
            return (
              <div
                key={section.id}
                className="section-container box-border flex justify-center items-center"
                onClick={(e) => handleSectionClick(e, section)}
                style={{
                  position: "absolute",
                  top: section.y,
                  left: section.x,
                  width: section.width,
                  height: section.height,
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                  zIndex: isEditing || isSelected ? 10 : 1,
                  boxShadow: isDropTarget
                    ? "0 0 0 3px rgba(0, 122, 255, 0.7) inset"
                    : isSelected
                    ? "0 0 0 2px #007aff inset"
                    : "none",
                  transition: "box-shadow 0.2s",
                }}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, section.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (
                    e.ctrlKey &&
                    (section.content?.type === "image" ||
                      section.content?.type === "video")
                  ) {
                    setSelectedSectionId(null);
                    setEditingSectionId(section.id);
                  }
                }}
                onWheel={(e: WheelEvent) => {
                  if (isEditing) {
                    e.preventDefault();
                    e.stopPropagation();
                    const scaleAmount = e.deltaY * -0.001;
                    setSections((prev) =>
                      prev.map((s) =>
                        s.id === section.id && s.content
                          ? {
                              ...s,
                              content: {
                                ...s.content,
                                scale: Math.max(
                                  0.5,
                                  (s.content.scale || 1) + scaleAmount
                                ),
                              },
                            }
                          : s
                      )
                    );
                  }
                }}
                onMouseDown={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                    dragInfo.current = {
                      isDragging: true,
                      startX: e.clientX,
                      startY: e.clientY,
                      initialXOffset: section.content?.xOffset || 0,
                      initialYOffset: section.content?.yOffset || 0,
                    };
                  }
                }}
              >
                {isEditing && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "move",
                      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                      zIndex: 2,
                    }}
                  />
                )}
                {isMergeTarget && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0, 122, 255, 0.2)",
                      zIndex: 3,
                    }}
                  />
                )}
                {section.content ? (
                  <>
                    <SectionContent
                      content={section.content}
                      isEditing={isEditing}
                      onUpdate={(newValue) =>
                        handleContentUpdate(section.id, newValue)
                      }
                    />
                    {!isEditing && (
                      <button
                        onClick={(e) => handleDeleteContent(e, section.id)}
                        className="delete-content-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* The + button is now replaced by the drag-and-drop toolbar */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleMergeMouseDown(e, section.id)}
                        className="merge-handle"
                      >
                        <Move size={14} />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          <div
            ref={lineRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              backgroundColor: "#007aff",
              boxShadow: "0 0 5px #007aff",
              opacity: 0,
              pointerEvents: "none",
              transition: "opacity 0.05s linear",
              zIndex: 5,
            }}
          />
        </div>
      </div>
      <style>{`
        .section-container { background-color: transparent; transition: background-color 0.2s; }
        .section-container:hover { background-color: rgba(0, 122, 255, 0.05); }
        .delete-content-btn { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background-color: rgba(220, 38, 38, 0.8); color: white; font-size: 16px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s, transform 0.2s; transform: scale(0.8); z-index: 3; }
        .section-container:hover .delete-content-btn { opacity: 1; transform: scale(1); }
        .merge-handle { position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: white; color: #555; border: 1px solid #ccc; cursor: grab; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .merge-handle:active { cursor: grabbing; }
      `}</style>
    </div>
  );
}
