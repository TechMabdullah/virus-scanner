import { motion } from "framer-motion";

export default function AccessBurst() {
  return (
    <div className="access-burst">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="access-burst-ring"
          initial={{ width: 20, height: 20, opacity: 0.9 }}
          animate={{ width: 260, height: 260, opacity: 0 }}
          transition={{ duration: 0.9, delay: i * 0.15, ease: "easeOut" }}
        />
      ))}
      <motion.div
        className="access-burst-text"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        ACCESS GRANTED
      </motion.div>
    </div>
  );
}
