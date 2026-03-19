import { Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FloatingSOS = () => {
    const [showTooltip, setShowTooltip] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3 translate-x-0">
            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.8 }}
                        className="bg-red-700 text-white px-4 py-2 rounded-xl shadow-xl border border-red-500/50 text-sm font-bold flex items-center gap-2 whitespace-nowrap mb-1 backdrop-blur-md"
                    >
                        Emergency SOS Toolkit
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => {
                    // Navigate to the toolkit section on the tourist ID page
                    window.location.href = "/tourist-id#toolkit";
                }}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white relative group transition-colors"
                animate={{
                    boxShadow: [
                        "0 0 0 0px rgba(220, 38, 38, 0.4)",
                        "0 0 0 12px rgba(220, 38, 38, 0)",
                    ]
                }}
                transition={{
                    boxShadow: {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeOut"
                    }
                }}
            >
                <Shield className="w-8 h-8 relative z-10 fill-current" />
            </motion.button>
        </div>
    );
};

export default FloatingSOS;
