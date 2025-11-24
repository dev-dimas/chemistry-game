import React from "react";

import {
  FiUser,
  FiUsers,
  FiSend,
  FiPlay,
  FiCopy,
  FiCheck,
  FiX,
  FiLogOut,
} from "react-icons/fi";
import {
  FaRegLaughBeam,
  FaRegSurprise,
  FaRegSadTear,
  FaBrain,
  FaBolt,
  FaHandshake,
} from "react-icons/fa";
import {
  IoLanguage,
  IoRocketOutline,
  IoGameControllerOutline,
} from "react-icons/io5";
import {
  RiEmotionHappyLine,
  RiSwordLine,
  RiLightbulbFlashLine,
  RiShareForwardLine,
} from "react-icons/ri";
import {
  TbPlugConnected,
  TbMoodSmile,
  TbAward,
  TbTargetArrow,
  TbReload,
} from "react-icons/tb";
import {
  BsFillPersonPlusFill,
  BsStars,
  BsChatDots,
  BsClockHistory,
} from "react-icons/bs";
import {
  HiOutlineSparkles,
  HiOutlineFingerPrint,
  HiOutlineLightBulb,
} from "react-icons/hi2";

interface BackgroundPatternProps {
  iconClassName?: string;
  opacity?: string;
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = ({
  iconClassName = "text-white",
  opacity = "opacity-[0.07]",
}) => {
  const icons = [
    FiUser,
    FiUsers,
    FiSend,
    FiPlay,
    FiCopy,
    FiCheck,
    FiX,
    FiLogOut,
    FaRegLaughBeam,
    FaRegSurprise,
    FaRegSadTear,
    FaBrain,
    FaBolt,
    FaHandshake,
    IoLanguage,
    IoRocketOutline,
    IoGameControllerOutline,
    RiEmotionHappyLine,
    RiSwordLine,
    RiLightbulbFlashLine,
    RiShareForwardLine,
    TbPlugConnected,
    TbMoodSmile,
    TbAward,
    TbTargetArrow,
    TbReload,
    BsFillPersonPlusFill,
    BsStars,
    BsChatDots,
    BsClockHistory,
    HiOutlineSparkles,
    HiOutlineFingerPrint,
    HiOutlineLightBulb,
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className={`absolute inset-0 ${opacity} flex items-center justify-center`}
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-3 p-4 w-full origin-center transform scale-150 -rotate-12">
          {Array.from({ length: 800 }).map((_, i) => {
            const Icon = icons[i % icons.length];
            // Deterministic random-like values for rotation and scale
            const rotation = (i * 57) % 360;
            const scale = 0.8 + (i % 4) * 0.1;

            return (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{
                  transform: `rotate(${rotation}deg) scale(${scale})`,
                }}
              >
                <Icon className={`w-12 h-12 ${iconClassName}`} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
