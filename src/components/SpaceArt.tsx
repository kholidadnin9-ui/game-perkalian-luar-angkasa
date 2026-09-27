import type { SVGProps } from 'react';

type ArtProps = SVGProps<SVGSVGElement>;

export function StarArt({ className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true" {...props}>
      <path d="m32 3 7.8 18.7L60 24l-15.4 13 4.7 20L32 46.1 14.7 57l4.7-20L4 24l20.2-2.3L32 3Z" fill="#FFF4B4" stroke="#E88918" strokeWidth="4" strokeLinejoin="round" />
      <path d="m32 10 6.1 15 16.1 1.5-12.3 10.4 3.9 15.8L32 44l-13.8 8.7 3.9-15.8L9.8 26.5 25.9 25 32 10Z" fill="#FFD637" />
      <path d="m23 22 8-10" stroke="white" strokeWidth="4" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

export function BookArt({ className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 180 148" className={className} fill="none" aria-hidden="true" {...props}>
      <ellipse cx="91" cy="134" rx="61" ry="10" fill="#A94120" opacity=".25" />
      <path d="M39 111 88 84l55 27-51 25-53-25Z" fill="#A9461C" stroke="#183A89" strokeWidth="5" strokeLinejoin="round" />
      <path d="M35 107 86 80l55 25-49 25-57-23Z" fill="#F99630" stroke="#183A89" strokeWidth="5" strokeLinejoin="round" />
      <path d="M20 53c20-12 43-9 68 7 19-18 46-22 67-11l2 59c-25-7-46-4-69 12-21-15-42-21-68-14V53Z" fill="#FFAB46" stroke="#173789" strokeWidth="6" strokeLinejoin="round" />
      <path d="M29 45c21-10 40-4 59 12 20-18 40-21 60-16v60c-23-5-41 0-60 15-18-16-37-22-59-17V45Z" fill="#FFF7E7" stroke="#173789" strokeWidth="5" strokeLinejoin="round" />
      <path d="M88 59v56" stroke="#E0AA74" strokeWidth="3" />
      <path d="m41 55 29 10m-29 1 28 10m-28 1 26 10" stroke="#F2C79D" strokeWidth="3" strokeLinecap="round" />
      <path d="m104 58 30-11v32l-30 11V58Z" fill="#1479DC" stroke="#16388D" strokeWidth="4" strokeLinejoin="round" />
      <text x="119" y="74" textAnchor="middle" fill="#FFE046" stroke="#173788" strokeWidth="1.5" paintOrder="stroke" fontSize="24" fontWeight="900" fontFamily="Arial, sans-serif">×</text>
      <path d="m159 13 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1 4-9Z" fill="#FFE04C" stroke="white" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="18" cy="26" r="4" fill="white" />
    </svg>
  );
}

export function MeteorArt({ className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 180 148" className={className} fill="none" aria-hidden="true" {...props}>
      <ellipse cx="87" cy="135" rx="55" ry="9" fill="#006339" opacity=".2" />
      <path d="M24 105c13-20 23-34 45-45-15 3-24 0-38-7 28-8 43-21 62-24-6 9-5 14-3 20 23-14 45-14 65-11-15 15-21 24-28 40l-49 48-54-21Z" fill="#FFE267" stroke="#D56027" strokeWidth="5" strokeLinejoin="round" />
      <path d="M29 106c27-41 52-63 79-62-11 15-14 27-10 37l-39 43-30-18Z" fill="#FF8B32" />
      <circle cx="105" cy="85" r="44" fill="#D451A0" stroke="#173889" strokeWidth="6" />
      <circle cx="105" cy="85" r="36" fill="#FFB457" stroke="#E16B35" strokeWidth="4" />
      <path d="M94 56c19-6 37 1 45 15" stroke="#FFE7A1" strokeWidth="7" strokeLinecap="round" />
      <circle cx="91" cy="84" r="8" fill="#E77A43" />
      <circle cx="122" cy="100" r="6" fill="#E77A43" />
      <circle cx="117" cy="69" r="4" fill="#E77A43" />
      <path d="m29 16 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#FFDC3F" stroke="white" strokeWidth="3" strokeLinejoin="round" />
      <path d="m159 18 2 6 7 1-5 4 1 6-5-3-6 3 2-6-5-4 7-1 2-6Z" fill="#FFDC3F" stroke="white" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyArt({ className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 180 148" className={className} fill="none" aria-hidden="true" {...props}>
      <ellipse cx="90" cy="137" rx="59" ry="9" fill="#4B22A8" opacity=".22" />
      <path d="M42 35H25c-9 0-11 8-8 20 4 15 16 23 33 24M138 35h17c9 0 11 8 8 20-4 15-16 23-33 24" stroke="#173889" strokeWidth="12" strokeLinecap="round" />
      <path d="M42 35H25c-9 0-11 8-8 20 4 15 16 23 33 24M138 35h17c9 0 11 8 8 20-4 15-16 23-33 24" stroke="#FFB722" strokeWidth="6" strokeLinecap="round" />
      <path d="M43 25h94l-8 55c-3 23-19 33-39 33S55 103 51 80l-8-55Z" fill="#FFC431" stroke="#173889" strokeWidth="6" strokeLinejoin="round" />
      <path d="M55 33h70l-7 43c-2 17-12 26-28 26s-27-9-29-26l-6-43Z" fill="#FFE260" />
      <ellipse cx="90" cy="26" rx="48" ry="10" fill="#FFDF54" stroke="#173889" strokeWidth="5" />
      <path d="M84 113v12H62c-6 0-10 5-10 12h76c0-7-4-12-10-12H96v-12" fill="#FFB81E" stroke="#173889" strokeWidth="5" strokeLinejoin="round" />
      <path d="m90 46 6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2 6-12Z" fill="white" stroke="#F39622" strokeWidth="3" strokeLinejoin="round" />
      <path d="m26 18 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#FFD83E" stroke="white" strokeWidth="3" strokeLinejoin="round" />
      <path d="m155 92 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#FFD83E" stroke="white" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function PlanetArt({ className, ...props }: ArtProps) {
  return (
    <svg viewBox="0 0 180 148" className={className} fill="none" aria-hidden="true" {...props}>
      <ellipse cx="90" cy="128" rx="57" ry="8" fill="#0750A3" opacity=".21" />
      <path d="M17 83c7-25 43-46 86-47 41-2 63 17 64 34 1 22-31 43-75 46-41 3-70-13-75-33Z" fill="#A4EAFE" stroke="#1252A8" strokeWidth="5" />
      <circle cx="91" cy="68" r="49" fill="#08A8E5" stroke="#174093" strokeWidth="6" />
      <path d="M57 45c12-14 32-21 48-15-12 9-11 20-5 28 12 14 4 28-5 39-19 3-43-17-44-34 0-6 2-13 6-18Z" fill="#44DE95" />
      <path d="M116 43c20 10 29 27 21 45-7-3-13-9-13-17-7-7-16-5-20-12 0-5 5-12 12-16Z" fill="#31CF86" />
      <path d="M45 88c16 17 43 26 70 22" stroke="#63F6F8" strokeWidth="7" strokeLinecap="round" />
      <path d="M17 83c2 17 32 26 74 23 36-3 63-15 75-34" stroke="#EAFDFF" strokeWidth="8" strokeLinecap="round" />
      <path d="M17 83c2 17 32 26 74 23 36-3 63-15 75-34" stroke="#177ED8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="68" cy="46" r="5" fill="white" opacity=".8" />
      <path d="m152 12 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1 3-7Z" fill="#FFDC3F" stroke="white" strokeWidth="3" strokeLinejoin="round" />
      <text x="91" y="83" textAnchor="middle" fill="white" stroke="#1256A7" strokeWidth="2.5" paintOrder="stroke" fontSize="38" fontWeight="900" fontFamily="Arial, sans-serif">×</text>
    </svg>
  );
}