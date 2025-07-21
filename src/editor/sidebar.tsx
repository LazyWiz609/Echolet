import { useState } from "react";
import { Home, Bell, Calendar, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const icons = [
  { id: "home", icon: <Home /> },
  { id: "bell", icon: <Bell /> },
  { id: "calendar", icon: <Calendar /> },
  { id: "settings", icon: <Settings /> },
];

export default function Sidebar() {
  const [active, setActive] = useState("home");
  const [showExpanded, setShowExpanded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const handleIconClick = (id: string) => {
    if (active === id && showExpanded) {
      // Begin fade out, then collapse
      setFadeOut(true);
      setTimeout(() => {
        setShowExpanded(false);
        setFadeOut(false); // reset for future
      }, 300); // must match fade out duration
    } else {
      setActive(id);
      setShowExpanded(true);
      setFadeOut(false); // just in case
    }
  };

  return (
    <>
      {/* Thin Sidebar */}
      <aside className="fixed top-1/2 left-6 -translate-y-1/2 w-16 h-[90vh] bg-white/10 backdrop-blur-md rounded-3xl shadow-lg flex flex-col items-center justify-between py-6 z-50 border border-white/20">
        <div className="flex flex-col gap-6 relative">
          {icons.map(({ id, icon }) => (
            <button
              key={id}
              onClick={() => handleIconClick(id)}
              className="relative w-10 h-10 flex items-center justify-center"
            >
              {active === id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute w-10 h-10 bg-white rounded-xl shadow-md"
                  transition={{
                    layout: {
                      type: "spring",
                      bounce: 0.3,
                      damping: 15,
                      stiffness: 200,
                    },
                    borderRadius: { duration: 0.3 },
                    scale: {
                      duration: 0.15,
                      type: "spring",
                      stiffness: 100,
                    },
                  }}
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.2 }}
                />
              )}
              <div
                className={`z-10 ${
                  active === id ? "text-black" : "text-white/60"
                }`}
              >
                {icon}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Expanded Sidebar */}
      <AnimatePresence>
        {showExpanded && (
          <motion.div
            key="expandedSidebar"
            initial={{ width: 0 }}
            animate={{ width: "26vw" }}
            exit={{ width: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="fixed top-1/2 left-20 -translate-y-1/2 h-[85vh] bg-white rounded-r-2xl shadow-xl z-40 overflow-hidden"
          >
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              animate={fadeOut ? { opacity: 0 } : { opacity: 1 }}
              className="p-6"
            >
              <div>
                <h2 className="text-2xl font-semibold mb-4 capitalize">
                  {active}
                </h2>
                <p className="text-gray-700">Expanded content goes here...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
