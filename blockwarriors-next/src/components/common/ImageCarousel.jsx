"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function ImageCarousel() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const scrollToSlide = (slideNumber) => {
    const carousel = document.querySelector(".carousel");
    const slideWidth = carousel.offsetWidth;

    carousel.scrollTo({
      left: (slideNumber - 1) * slideWidth,
      behavior: "smooth",
    });
  };
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      const nextSlide = (currentSlide % 4) + 1;
      setCurrentSlide(nextSlide);
      scrollToSlide(nextSlide);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentSlide, isPaused]);

  const handleNavigation = (slideNumber) => {
    setCurrentSlide(slideNumber);
    scrollToSlide(slideNumber);
  };
  return (
    <div
      className="carousel w-full carousel-center rounded-box space-x-4 scroll-smooth overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        id="slide1"
        className="carousel-item relative w-full duration-300 ease-in-out"
      >
        <Image
          src="/club_imgs/brown_2023_desmen_sparring.JPG"
          alt="Desmen Sparring"
          layout="fill"
          objectFit="cover"
          className="rounded-lg"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <button
            onClick={() => handleNavigation(4)}
            className="btn btn-circle"
          >
            ❮
          </button>
          <button
            onClick={() => handleNavigation(2)}
            className="btn btn-circle"
          >
            ❯
          </button>
        </div>
      </div>
      <div
        id="slide2"
        className="carousel-item relative w-full duration-300 ease-in-out"
      >
        <Image
          src="https://img.daisyui.com/images/stock/photo-1609621838510-5ad474b7d25d.webp"
          alt="Carousel Image 2"
          layout="fill"
          objectFit="cover"
          className="w-full rounded-lg"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <button
            onClick={() => handleNavigation(1)}
            className="btn btn-circle"
          >
            ❮
          </button>
          <button
            onClick={() => handleNavigation(3)}
            className="btn btn-circle"
          >
            ❯
          </button>
        </div>
      </div>
      <div
        id="slide3"
        className="carousel-item relative w-full duration-300 ease-in-out"
      >
        <Image
          src="https://img.daisyui.com/images/stock/photo-1414694762283-acccc27bca85.webp"
          alt="Carousel Image 3"
          layout="fill"
          objectFit="cover"
          className="w-full rounded-lg"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <button
            onClick={() => handleNavigation(2)}
            className="btn btn-circle"
          >
            ❮
          </button>
          <button
            onClick={() => handleNavigation(4)}
            className="btn btn-circle"
          >
            ❯
          </button>
        </div>
      </div>
      <div
        id="slide4"
        className="carousel-item relative w-full duration-300 ease-in-out"
      >
        <Image
          src="https://img.daisyui.com/images/stock/photo-1665553365602-b2fb8e5d1707.webp"
          alt="Carousel Image 4"
          layout="fill"
          objectFit="cover"
          className="w-full rounded-lg"
        />
        <div className="absolute left-5 right-5 top-1/2 flex -translate-y-1/2 transform justify-between">
          <button
            onClick={() => handleNavigation(3)}
            className="btn btn-circle"
          >
            ❮
          </button>
          <button
            onClick={() => handleNavigation(1)}
            className="btn btn-circle"
          >
            ❯
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageCarousel;
