"use client";

import { useEffect, useState, useRef } from "react";
import Typed from "typed.js";

function TypedEffect() {
  const typedElement = useRef(null);
  const typingDelay = 60000;

  useEffect(() => {
    const startTyping = () => {
      const options = {
        strings: ["Taekwondo! PRINCETON!!!"],
        typeSpeed: 50,
        backSpeed: 25,
        loop: false,
        showCursor: false,
        onComplete: (self) => {
          setTimeout(() => {
            self.reset();
            self.start();
          }, typingDelay);
        },
      };

      const typed = new Typed(typedElement.current, options);

      return typed;
    };

    const typedInstances = startTyping();

    return () => {
      typedInstances.destroy();
    };
  }, []);

  return (
    <h1 ref={typedElement} className="text-3xl font-bold text-gray-800"></h1>
  );
}

export default TypedEffect;
