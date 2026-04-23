/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as opentype from "opentype.js";
import { confetti } from "@tsparticles/confetti";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// --- Handwriting Logic ---
// We implement a "Handwriting.Hand.draw" polyfill to match the user's specific request
// ensuring "each letter is traced individually".

let cachedFont: opentype.Font | null = null;

const Handwriting = {
  Hand: {
    draw: async (text: string, canvas: HTMLCanvasElement, options: any) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const {
        font_size = 60,
        font_color = "#c2748a",
        animate_speed = 300,
      } = options;

      // Using a more reliable direct URL for the font
      const fontUrl =
        "https://raw.githubusercontent.com/googlefonts/caveat/master/fonts/ttf/Caveat-Regular.ttf";

      try {
        if (!cachedFont) {
          const response = await fetch(fontUrl);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch font: ${response.status} ${response.statusText}`,
            );
          }
          const buffer = await response.arrayBuffer();

          // Debug check first 4 bytes if it fails
          const signature = String.fromCharCode(
            ...new Uint8Array(buffer.slice(0, 4)),
          );
          if (signature === "Pack" || signature.startsWith("<!DO")) {
            throw new Error(
              `Invalid font file received. Signature: ${signature}`,
            );
          }

          cachedFont = opentype.parse(buffer);
        }

        const font = cachedFont;

        const lines: string[] = text.split("\n");
        let currentY = font_size;
        const margin = 20;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = font_color;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Animate letter by letter
        for (const line of lines) {
          const glyphPaths = font.getPaths(line, margin, currentY, font_size);

          for (const path of glyphPaths) {
            const commands = path.commands;
            ctx.beginPath();

            for (let i = 0; i < commands.length; i++) {
              const cmd = commands[i];
              if (cmd.type === "M") {
                ctx.moveTo(cmd.x, cmd.y);
              } else if (cmd.type === "L") {
                ctx.lineTo(cmd.x, cmd.y);
              } else if (cmd.type === "C") {
                ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
              } else if (cmd.type === "Q") {
                ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
              } else if (cmd.type === "Z") {
                ctx.closePath();
              }

              // Simulate real-time tracing speed
              // We draw progressively
              ctx.stroke();
              await new Promise((r) => setTimeout(r, 1000 / animate_speed));
            }
          }
          currentY += font_size * 1.2;
        }
      } catch (e) {
        console.error("Font load error:", e);
      }
    },
  },
};

/**
 * DesktopOnlyGuard: Ensures the experience is only viewed on a PC.
 */
const DesktopOnlyGuard = ({ children }: { children: React.ReactNode }) => {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-[100] bg-blanc-casse flex flex-col items-center justify-center p-10 text-center space-y-8">
        <div className="w-64 h-64 opacity-50">
          <DotLottieReact
            src="https://lottie.host/5719be49-b05c-4a03-88fa-647bf2675f13/IwC12KlbVf.lottie"
            loop
            autoplay
          />
        </div>
        <h2 className="font-serif text-3xl italic text-ink">
          Expérience sur PC uniquement 🌸
        </h2>
        <p className="font-serif text-xl text-neutral-500 leading-relaxed max-w-sm">
          Cette surprise a été conçue pour être vécue sur un{" "}
          <span className="text-ink font-semibold">ordinateur</span>.
          <br />
          <br />
          S'il te plaît, reviens me voir sur ton PC pour profiter de toute la
          magie. ✨
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const TheEnd = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center space-y-12"
    >
      <div className="w-64 h-64 grayscale opacity-30">
        <DotLottieReact
          src="https://lottie.host/a6198f3b-5511-4475-8e3b-d5a23078972e/zF8X6yM7iC.lottie"
          loop
          autoplay
        />
      </div>
      <div className="space-y-4">
        <h2 className="font-serif text-6xl italic text-ink/20 tracking-[0.2em]">
          FIN
        </h2>
        <p className="font-serif italic text-neutral-400 text-xl font-light tracking-widest uppercase">
          Merci d'être là
        </p>
      </div>
    </motion.div>
  );
};

// --- Components ---

/**
 * TimeDisplay: Shows the current time with Hours, Minutes, Seconds and Thirds (1/60s).
 */
const TimeDisplay = () => {
  const [time, setTime] = useState(new Date());
  const [thirds, setThirds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(now);
      setThirds(Math.floor((now.getMilliseconds() % 1000) / (1000 / 60)));
    }, 16); // ~60fps
    return () => clearInterval(interval);
  }, []);

  const format = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="font-mono text-sm tracking-widest text-ink/60 flex items-center gap-1">
      <span>{format(time.getHours())}</span>
      <span className="animate-pulse">:</span>
      <span>{format(time.getMinutes())}</span>
      <span className="animate-pulse">:</span>
      <span>{format(time.getSeconds())}</span>
      <span className="text-[10px] opacity-40 ml-1">{format(thirds)}</span>
    </div>
  );
};

const TopBar = ({
  isMuted,
  toggleMute,
}: {
  isMuted: boolean;
  toggleMute: () => void;
}) => {
  return (
    <div className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-8 z-[60] pointer-events-none bg-gradient-to-b from-blanc-casse via-blanc-casse/80 to-transparent">
      {/* Left: Music control */}
      <div className="flex items-center gap-4 pointer-events-auto min-w-[120px]">
        <button
          onClick={toggleMute}
          className="p-3 rounded-full hover:bg-ink/5 transition-all text-ink/40 hover:text-ink/60 hover:scale-110 active:scale-95"
          title={isMuted ? "Activer la musique" : "Couper la musique"}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Center: Special Date */}
      <div className="font-serif italic text-ink/50 text-xl tracking-[0.4em] uppercase font-light hidden md:block">
        14 Avril
      </div>

      {/* Right: Precision Clock */}
      <div className="pointer-events-auto min-w-[120px] flex justify-end">
        <TimeDisplay />
      </div>
    </div>
  );
};

const Footer = ({ isMuted }: { isMuted: boolean }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full h-24 flex items-end justify-between px-8 pb-4 z-[60] pointer-events-none">
      {/* Left: Dynamic Musician */}
      <div className="w-32 h-32 pointer-events-auto -mb-4">
        <AnimatePresence mode="wait">
          {!isMuted ? (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full h-full"
            >
              <DotLottieReact
                src="https://lottie.host/e0adbdc5-f8c1-4bd1-89ca-88825a9cfe97/kO48LHfegC.lottie"
                loop
                autoplay
              />
            </motion.div>
          ) : (
            <motion.div
              key="muted"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full h-full"
            >
              <DotLottieReact
                src="https://lottie.host/6b99a6f0-cb1e-4073-97b8-b20119c167d8/QBfbXd4cih.lottie "
                loop
                autoplay
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Running Cat and Instruction */}
      <div className="flex items-center gap-4 pointer-events-auto mb-2">
        <span className="font-serif italic text-ink/30 text-lg tracking-widest uppercase">
          Eh ! Suit moi...
        </span>
        <div className="w-64 h-64 -mb-8">
          <DotLottieReact
            src="https://lottie.host/2cd948a6-fca8-4aa8-9975-62b084c10b5d/kpwluVJ8Gr.lottie"
            loop
            autoplay
          />
        </div>
      </div>
    </div>
  );
};

/**
 * ConfettiCountdown: A component that counts down from 15s with a confetti explosion.
 * Now displays a magic wand and a message when it finishes.
 */
const ConfettiCountdown = () => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isActive, setIsActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confettiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const startCelebration = useCallback(() => {
    setTimeLeft(15);
    setIsActive(true);
    setIsFinished(false);

    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    // Clear existing intervals
    if (confettiIntervalRef.current) clearInterval(confettiIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    // Confetti interval
    confettiIntervalRef.current = setInterval(() => {
      const remaining = animationEnd - Date.now();

      if (remaining <= 0) {
        if (confettiIntervalRef.current)
          clearInterval(confettiIntervalRef.current);
        setIsActive(false);
        setIsFinished(true); // Transition to magic wand view
        return;
      }

      const particleCount = 50 * (remaining / duration);

      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        }),
      );
      confetti(
        Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        }),
      );
    }, 250);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCelebration();
    return () => {
      if (confettiIntervalRef.current)
        clearInterval(confettiIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCelebration]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 min-h-96">
      <AnimatePresence mode="wait">
        {!isFinished ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="flex flex-col items-center space-y-12"
          >
            <div className="relative">
              <motion.div
                animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-8xl md:text-9xl font-serif italic text-ink"
              >
                {timeLeft}
              </motion.div>
              <div className="absolute -inset-8 border border-ink/10 rounded-full animate-pulse" />
            </div>

            <div className="flex flex-col items-center gap-6">
              <p className="font-serif italic text-2xl text-neutral-500 text-center max-w-md">
                {isActive
                  ? "La surprise éclate en mille couleurs !"
                  : "Le temps s'est arrêté sur ce moment magique."}
              </p>

              <button
                onClick={startCelebration}
                className="group relative inline-flex items-center justify-center px-10 py-4 font-medium tracking-wide text-ink border-2 border-ink rounded-full hover:bg-ink hover:text-white transition-all duration-300 shadow-lg shadow-ink/10"
              >
                <Sparkles className="w-5 h-5 mr-3 transition-transform group-hover:rotate-12" />
                <span>Plus de confetti ✨</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="magic-wand"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col md:flex-row items-center gap-10"
          >
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 max-w-sm">
              <h3 className="font-serif text-3xl italic text-ink">
                Un instant on nettoie les confettis... 🪄
              </h3>
            </div>

            <div className="w-64 h-64 flex items-center justify-center relative overflow-hidden">
              <DotLottieReact
                src="https://lottie.host/7b5fa32b-67c9-40af-86d9-d5961ddf089f/Wf5UtLmZqy.lottie"
                loop
                autoplay
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * HeartCatcher: A quick mini-game where the user clicks falling hearts.
 */
const HeartCatcher = ({ onComplete }: { onComplete: () => void }) => {
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState<
    { id: number; x: number; delay: number }[]
  >([]);
  const targetScore = 5;

  useEffect(() => {
    const newHearts = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // 10% to 90%
      delay: Math.random() * 5,
    }));
    setHearts(newHearts);
  }, []);

  const handlePop = (id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
    const newScore = score + 1;
    setScore(newScore);
    if (newScore >= targetScore) {
      setTimeout(onComplete, 1000);
    }
  };

  return (
    <div className="relative w-full h-[500px] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence>
          {hearts.map((heart) => (
            <motion.button
              key={heart.id}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 600, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 4, delay: heart.delay, ease: "linear" }}
              onMouseDown={() => handlePop(heart.id)}
              className="absolute p-3 text-rose-400 hover:text-ink cursor-pointer pointer-events-auto"
              style={{ left: `${heart.x}%` }}
            >
              <Sparkles className="w-8 h-8 fill-current" />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="z-10 text-center space-y-6"
      >
        <h3 className="font-serif text-3xl italic text-ink">
          Attrape les éclats de magie ! ✨
        </h3>
        <p className="text-neutral-500 font-serif italic text-lg">
          Clique sur {targetScore} étincelles pour libérer tes voeux.
        </p>

        <div className="w-64 h-2 bg-beige-dore/30 rounded-full mx-auto overflow-hidden">
          <motion.div
            className="h-full bg-ink"
            initial={{ width: 0 }}
            animate={{ width: `${(score / targetScore) * 100}%` }}
          />
        </div>

        {score >= targetScore && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-ink font-serif italic text-xl"
          >
            Bravo ! La magie est prête...
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

/**
 * BirthdayReveal: Shows a celebratory animation for 5s, then the happy birthday text.
 */
const BirthdayReveal = ({
  active,
  played,
}: {
  active: boolean;
  played: boolean;
}) => {
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setShowMessage(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowMessage(false);
    }
  }, [active]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <AnimatePresence mode="wait">
        {!showMessage ? (
          <motion.div
            key="celebration-lottie"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-80 h-80"
          >
            <DotLottieReact
              src="https://lottie.host/4357b7b0-d153-4bc1-8453-5159d03c5d26/wb6LLfFcwD.lottie"
              loop
              autoplay
            />
          </motion.div>
        ) : (
          <motion.div
            key="birthday-text"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <HandwritingCanvas
              text="Joyeux Anniversaire Claire !"
              played={played}
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-neutral-500 italic font-serif text-xl"
            >
              (Clique sur la flèche pour la suite...)
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FinalWishes = ({ played }: { played: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
      className="flex flex-col items-center space-y-10 max-w-2xl mx-auto text-center"
    >
      <div className="space-y-6">
        <HandwritingCanvas text="Mes pensées pour toi..." played={played} />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="font-serif italic text-2xl text-neutral-600 leading-relaxed"
        >
          Que chaque jour de cette nouvelle année t'apporte autant de joie que
          tu en donnes autour de toi. Tu es une personne exceptionnelle, et tu
          mérites tout le bonheur du monde.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="pt-10 border-t border-ink/10 w-full"
      >
        <p className="font-serif italic text-ink text-3xl">
          Passe une merveilleuse journée ! ✨🎂
        </p>
      </motion.div>
    </motion.div>
  );
};

// --- Components ---

const HandwritingCanvas = ({
  text,
  played,
}: {
  text: string;
  played: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(false);

  useEffect(() => {
    if (canvasRef.current && !drawnRef.current) {
      drawnRef.current = true;
      Handwriting.Hand.draw(text, canvasRef.current, {
        font_size: 70,
        font_color: "#c2748a",
        animate_speed: played ? 10000 : 400, // Very fast if already played, or we can just draw instantly
      });
    }
  }, [text, played]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={300}
      className="max-w-full h-auto mx-auto"
    />
  );
};

interface WelcomeModalProps {
  onStart: () => void;
  key?: string | number;
}

const WelcomeModal = ({ onStart }: WelcomeModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-rose-poudre/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-blanc-casse p-10 rounded-[2rem] shadow-xl max-w-lg w-full border border-rose-poudre text-center relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-mauve-clair rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-beige-dore rounded-full blur-3xl opacity-30" />

        <h2 className="font-serif text-4xl mb-6 italic text-ink">
          Bienvenue 🌸
        </h2>
        <p className="text-xl mb-10 text-neutral-600 leading-relaxed font-serif font-light">
          Sur ce site, le scroll est désactivé. <br />
          Utilise les touches <span className="font-semibold text-ink">
            ←
          </span>{" "}
          et <span className="font-semibold text-ink">→</span> de ton clavier
          pour naviguer.
        </p>
        <button
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-10 py-4 font-medium tracking-wide text-white transition-all duration-300 bg-ink rounded-full hover:scale-105 active:scale-95 shadow-lg shadow-ink/20"
        >
          <span>C'est parti ✨</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [currentSection, setCurrentSection] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [playedSections, setPlayedSections] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(true); // Start muted due to browser autoplay policies
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sections = [
    { id: 1, text: "Hello !", type: "handwriting" },
    {
      id: 2,
      text: "Ta journée se passe bien j'espère...",
      type: "handwriting",
    },
    {
      id: 3,
      text: "Pour commencer je m'excuse pour le retard...",
      type: "handwriting",
    },
    { id: 4, type: "confetti" },
    { id: 5, type: "birthday" },
    { id: 6, type: "game" },
    { id: 7, type: "final" },
    { id: 8, type: "the_end" },
  ];

  // Handle Audio play/pause based on isMuted state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Audio playback failed:", err);
        setIsMuted(true);
      });
    }
  }, [isMuted]);

  // Handle start from modal
  const handleStart = () => {
    setShowModal(false);
    setIsMuted(false); // Unmute and start music when user interacts
  };

  useEffect(() => {
    if (!showModal && !playedSections.includes(currentSection)) {
      setPlayedSections((prev) => [...prev, currentSection]);
    }
  }, [currentSection, showModal, playedSections]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (showModal) return;

      if (e.key === "ArrowRight") {
        setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSection((prev) => Math.max(prev - 1, 0));
      }
    },
    [showModal, sections.length],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <DesktopOnlyGuard>
      <main className="grainy-bg h-screen w-screen flex flex-col items-center justify-center bg-blanc-casse select-none overflow-hidden">
        <audio ref={audioRef} src="/music.mp3" loop preload="auto" />

        <TopBar isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)} />

        <AnimatePresence mode="wait">
          {showModal && <WelcomeModal key="modal" onStart={handleStart} />}
        </AnimatePresence>

        <div className="relative w-full h-full flex items-center justify-center overflow-hidden px-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center"
            >
              {sections[currentSection].type === "handwriting" ? (
                <HandwritingCanvas
                  text={sections[currentSection].text || ""}
                  played={playedSections.includes(currentSection)}
                />
              ) : sections[currentSection].type === "confetti" ? (
                <ConfettiCountdown />
              ) : sections[currentSection].type === "birthday" ? (
                <BirthdayReveal
                  active={currentSection === 4}
                  played={playedSections.includes(currentSection)}
                />
              ) : sections[currentSection].type === "game" ? (
                <HeartCatcher onComplete={() => setCurrentSection(6)} />
              ) : sections[currentSection].type === "final" ? (
                <FinalWishes played={playedSections.includes(currentSection)} />
              ) : (
                <TheEnd />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Footer isMuted={isMuted} />

        {/* Decorative Ornaments */}
        <div className="fixed top-12 left-12 pointer-events-none opacity-10">
          <Sparkles className="w-10 h-10 text-mauve-clair" />
        </div>
        <div className="fixed bottom-12 right-12 pointer-events-none opacity-20">
          <Sparkles className="w-10 h-10 text-beige-dore" />
        </div>
      </main>
    </DesktopOnlyGuard>
  );
}
