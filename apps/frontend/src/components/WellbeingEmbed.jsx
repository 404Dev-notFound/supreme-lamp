"use client";

import React from "react";

export default function WellbeingEmbed() {
  return (
    <iframe
      src="https://fluffy-spoon-score.vercel.app/"
      title="Mental Health Score"
      className="w-full h-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      loading="lazy"
    />
  );
}
