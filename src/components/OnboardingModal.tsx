import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Map, Mountain, Heart, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const OnboardingModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState({
        interests: [] as string[],
        level: "",
        hasVisited: false
    });

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('gonepal_onboarding_seen');
        if (!hasSeenOnboarding) {
            setIsOpen(true);
        }
    }, []);

    const handleComplete = async () => {
        localStorage.setItem('gonepal_onboarding_seen', 'true');
        setIsOpen(false);
    };

    const steps = [
        {
            title: "Welcome to Nepal! 🇳🇵",
            description: "We're so glad you've landed. Let's personalize your journey to make it unforgettable.",
            icon: Sparkles,
            content: (
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-orange-600" />
                    </div>
                    <p className="text-muted-foreground">
                        Whether you're here for the peaks, the culture, or the peace, we'll help you find your way.
                    </p>
                </div>
            )
        },
        {
            title: "What are you looking for?",
            description: "Choose the experiences that speak to your soul.",
            icon: Heart,
            content: (
                <div className="grid grid-cols-2 gap-3 py-4">
                    {["Trekking", "Cultural Tours", "Yoga & Wellness", "Extreme Sports", "Wildlife", "Foodie Tours"].map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                setPreferences(prev => ({
                                    ...prev,
                                    interests: prev.interests.includes(item)
                                        ? prev.interests.filter(i => i !== item)
                                        : [...prev.interests, item]
                                }));
                            }}
                            className={`p-4 rounded-xl border-2 transition-all text-sm font-medium ${preferences.interests.includes(item)
                                    ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                                    : "border-border hover:border-orange-200"
                                }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )
        },
        {
            title: "Ready to explore?",
            description: "Last thing - tell us your comfort level with mountain adventures.",
            icon: Mountain,
            content: (
                <div className="space-y-3 py-4">
                    {["Leisurely (City & Easy Walks)", "Adventurous (Moderate Treks)", "Intense (Peak Climbing)"].map((level) => (
                        <button
                            key={level}
                            onClick={() => setPreferences(prev => ({ ...prev, level }))}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${preferences.level === level
                                    ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                                    : "border-border hover:border-orange-200"
                                }`}
                        >
                            <span className="font-medium">{level}</span>
                            {preferences.level === level && <CheckCircle2 className="w-5 h-5" />}
                        </button>
                    ))}
                </div>
            )
        }
    ];

    const currStep = steps[step - 1];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[450px] rounded-3xl overflow-hidden p-0 gap-0">
                <div className="bg-orange-600 h-2 w-full">
                    <motion.div
                        className="bg-white h-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(step / steps.length) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    <DialogHeader className="text-left">
                        <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest mb-2">
                            <currStep.icon className="w-4 h-4" />
                            Step {step} of {steps.length}
                        </div>
                        <DialogTitle className="text-2xl font-display font-bold">{currStep.title}</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {currStep.description}
                        </DialogDescription>
                    </DialogHeader>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currStep.content}
                        </motion.div>
                    </AnimatePresence>

                    <DialogFooter className="mt-6 flex flex-row justify-between sm:justify-between items-center bg-muted/30 -mx-8 -mb-8 p-6 border-t border-border">
                        <Button
                            variant="ghost"
                            onClick={() => step > 1 ? setStep(step - 1) : setIsOpen(false)}
                            className="text-muted-foreground"
                        >
                            {step === 1 ? "Skip" : "Back"}
                        </Button>
                        <Button
                            onClick={() => step < steps.length ? setStep(step + 1) : handleComplete()}
                            className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-8"
                            disabled={step === 2 && preferences.interests.length === 0}
                        >
                            {step === steps.length ? "Let's Go!" : "Next"}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OnboardingModal;
