import {motion} from "framer-motion";

const shapes = [
    { top: "10%", left: "10%", size: "300px", delay: 0 },
  { top: "5%", left: "70%", size: "400px", delay: 2 },
  { top: "50%", left: "45%", size: "250px", delay: 1 },
{ top: "60%", left: "5%", size: "350px", delay: 3 },
];

export default function FloatingShapes() {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="rounded-full blur-2xl opacity-40 bg-[#7fa5bd]"
          style={{
            position: "absolute",
            top: shape.top,
            left: shape.left,
            width: shape.size,
            height: shape.size,
          }}
          animate={{
            y: [0, 60, -60, 0],
            scale: [1, 1.1, 1, 0.9, 1],
          }}
          transition={{
            duration: 15,
            ease: "easeInOut",
            repeat: Infinity,
            delay: shape.delay,
          }}
        />
      ))}
        </div>
    );
}