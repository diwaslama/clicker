"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STORAGE_KEY = "clickerCount";

export default function Home() {
  const [count, setCount] = useState(0);
  const [clone, makeClone] = useState(0);
  const isInitialMount = useRef(true);

  // Load saved count from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        setCount(parsed);
      }
    }
  }, []);

  // Save count to localStorage when it changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, String(count));
  }, [count]);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => {
    setCount(0);
    localStorage.removeItem(STORAGE_KEY);
  };
  const cloner = () => makeClone(count);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Mesh gradient glow behind the counter */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-indigo-500/40 via-violet-500/30 to-purple-600/40 blur-[120px] opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-500/20 blur-[80px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-indigo-500/20 blur-[70px]" />
      </div>

      {/* Glassmorphism card container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-white/20 bg-white/[0.07] backdrop-blur-2xl shadow-2xl shadow-black/40">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              I am clicker
            </CardTitle>
            <CardDescription className="text-slate-400">
              Tap to count, clone to multiply
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center gap-6">
            {/* Counter display with mesh glow and spring bounce */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-purple-600/20 blur-2xl" />
              </div>
              <motion.div
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                }}
                className="relative flex flex-col items-center justify-center min-h-[120px]"
              >
                <span className="text-6xl font-bold tabular-nums bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent drop-shadow-lg">
                  {count}
                </span>
                {clone !== 0 && (
                  <motion.span
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 text-2xl font-mono text-violet-400/90"
                  >
                    {clone}
                  </motion.span>
                )}
              </motion.div>
            </div>

            {/* Action buttons with scale-down on click */}
            <div className="flex flex-wrap gap-3 justify-center">
              <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.02 }}>
                <Button onClick={increment} size="lg" className="min-w-[120px]">
                  Increment
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.02 }}>
                <Button onClick={decrement} variant="outline" size="lg" className="min-w-[120px]">
                  Decrement
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.02 }}>
                <Button onClick={cloner} variant="secondary" size="lg" className="min-w-[120px]">
                  Clone
                </Button>
              </motion.div>
            </div>
          </CardContent>

          <CardFooter className="justify-center pt-2 pb-6">
            <motion.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.02 }}>
              <Button onClick={reset} variant="destructive" size="lg">
                Reset
              </Button>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
