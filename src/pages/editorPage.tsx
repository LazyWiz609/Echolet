import FloatingShapes from "../editor/floatingShapes";
import Sidebar from "../editor/sidebar";
import EditorCanvas from "../editor/EditorCanvas";

function Editor() {
  return (
    <div className="relative h-screen w-screen bg-[#a5c1d3] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <FloatingShapes />
      </div>
      <div className="flex h-screen w-screen relative z-10">
        <Sidebar />
        <EditorCanvas />
      </div>
    </div>
  );
}

export default Editor;
