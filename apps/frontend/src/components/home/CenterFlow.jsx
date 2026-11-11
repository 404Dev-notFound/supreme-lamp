"use client";

import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  Code2,
  Compass,
  ExternalLink,
  FileCheck2,
  FileText,
  GitBranch,
  Hammer,
  HeartPulse,
} from "lucide-react";
import { useEffect, useState } from "react";
import BrandWordmark from "@/components/BrandWordmark";
import "./CenterFlow.css";

const MODULES = [
  { label: "Roadmaps", icon: Compass, href: "/roadmaps" },
  { label: "DSA", icon: Code2, href: "/dsa", waveScale: 0.49 },
  { label: "Tutorials", icon: Hammer, href: "/project-tutorials" },
  { label: "Resources", icon: FileText, href: "/resources" },
  { label: "AI Assistant", icon: BrainCircuit, href: "/assistant", waveScale: 0.49 },
  { label: "Ecosystem", icon: BookOpen, href: "/ecosystem", waveScale: 0.49 },
  { label: "CodeCollab", icon: GitBranch, href: "https://opensource-projects.netlify.app/", external: true },
  { label: "Mental Health", icon: HeartPulse, action: "mental-health" },
  { label: "Resume", icon: FileCheck2, action: "resume", waveScale: 0.49 },
];

function getEvenNodeLayout(items) {
  const step = (Math.PI * 2) / Math.max(items.length, 1);
  return items.map((item, index) => {
    const angle = -Math.PI / 2 + index * step;
    const cosVal = Math.abs(Math.cos(angle)) < 1e-7 ? 0 : Math.cos(angle);
    const sinVal = Math.abs(Math.sin(angle)) < 1e-7 ? 0 : Math.sin(angle);
    return {
      ...item,
      x: Number((50 + cosVal * 42).toFixed(4)),
      y: Number((50 + sinVal * 43).toFixed(4)),
    };
  });
}

const fmt = (n) => Number(n.toFixed(2));

function makeConnectorPath(target, railOffset = 0, reverse = false) {
  const start = { x: 500, y: 300 };
  const end = { x: fmt(target.x * 10), y: fmt(target.y * 6) };
  const rawDx = end.x - start.x;
  const rawDy = end.y - start.y;
  const dx = Math.abs(rawDx) < 1e-4 ? 0 : rawDx;
  const dy = Math.abs(rawDy) < 1e-4 ? 0 : rawDy;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const axisDistance = Math.min(Math.abs(dx / length), Math.abs(dy / length));
  const waveAmplitude = Math.SQRT2 * axisDistance * 36 * (target.waveScale ?? 1);
  const side = Math.sign(dx);
  const segmentCount = 32;
  const points = Array.from({ length: segmentCount + 1 }, (_, index) => {
    const t = index / segmentCount;
    const envelope = Math.sin(Math.PI * t);
    const oscillation = Math.sin(Math.PI * 4 * t);
    const wave = side * waveAmplitude * envelope * oscillation;
    const rail = railOffset * 0.65;
    const normalOffset = rail + wave;
    return {
      x: fmt(start.x + dx * t + normalX * normalOffset),
      y: fmt(start.y + dy * t + normalY * normalOffset),
    };
  });

  const orderedPoints = reverse ? [...points].reverse() : points;
  let path = `M ${orderedPoints[0].x} ${orderedPoints[0].y}`;
  for (let index = 0; index < orderedPoints.length - 1; index += 1) {
    const previous = orderedPoints[Math.max(0, index - 1)];
    const current = orderedPoints[index];
    const next = orderedPoints[index + 1];
    const afterNext = orderedPoints[Math.min(orderedPoints.length - 1, index + 2)];
    const control1X = fmt(current.x + (next.x - previous.x) / 6);
    const control1Y = fmt(current.y + (next.y - previous.y) / 6);
    const control2X = fmt(next.x - (afterNext.x - current.x) / 6);
    const control2Y = fmt(next.y - (afterNext.y - current.y) / 6);
    path += ` C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${next.x} ${next.y}`;
  }
  return path;
}

function ModuleCard({ item, onMentalHealthClick, onResumeClick }) {
  const Icon = item.icon;
  const content = (
    <>
      <span className="center-flow__icon"><Icon size={30} strokeWidth={1.7} /></span>
      <span className="center-flow__tooltip">{item.label}{item.external && <ExternalLink size={12} />}</span>
    </>
  );

  const className = "center-flow__node";
  if (item.external) {
    return <a className={className} href={item.href} target="_blank" rel="noreferrer">{content}</a>;
  }
  if (item.action) {
    return (
      <button className={className} type="button" onClick={item.action === "resume" ? onResumeClick : onMentalHealthClick}>
        {content}
      </button>
    );
  }
  return <Link className={className} href={item.href}>{content}</Link>;
}

let pulseSequenceId = 0;

export default function CenterFlow({ onMentalHealthClick, onResumeClick }) {
  const positionedModules = getEvenNodeLayout(MODULES);
  const [activePulses, setActivePulses] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const expiryTimers = new Set();
    const releasePulse = () => {
      pulseSequenceId += 1;
      const id = `pulse-${Date.now()}-${pulseSequenceId}-${Math.random().toString(36).slice(2, 7)}`;
      setActivePulses((current) => [...current, id].slice(-3));
      const expiryTimer = window.setTimeout(() => {
        setActivePulses((current) => current.filter((pulseId) => pulseId !== id));
        expiryTimers.delete(expiryTimer);
      }, 3000);
      expiryTimers.add(expiryTimer);
    };

    releasePulse();
    const timer = window.setInterval(releasePulse, 2000);
    return () => {
      window.clearInterval(timer);
      expiryTimers.forEach((expiryTimer) => window.clearTimeout(expiryTimer));
    };
  }, []);

  return (
    <section className="center-flow-section" aria-labelledby="center-flow-title">
      <div className="center-flow-section__heading">
        <span className="center-flow-section__eyebrow">ONE CONNECTED WORKSPACE</span>
        <h2 id="center-flow-title">Every step works together.</h2>
        <p>Move from learning a skill to building proof of it, all in one place.</p>
      </div>

      <div className="center-flow" role="group" aria-label="FlowCTRL workspace modules">
        <svg className="center-flow__wires" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
          {positionedModules.map((item) => {
            const centerPath = makeConnectorPath(item, 0, true);
            return (
              <g key={item.label}>
                <path className="center-flow__wire" d={makeConnectorPath(item, -1)} />
                <path className="center-flow__wire" d={makeConnectorPath(item, 1)} />
                {isMounted &&
                  activePulses.map((pulseId) => (
                    <g key={`${item.label}-${pulseId}`}>
                      <path className="center-flow__pulse center-flow__pulse--glow" pathLength="1" d={centerPath} />
                      <path className="center-flow__pulse center-flow__pulse--beam" pathLength="1" d={centerPath} />
                    </g>
                  ))}
              </g>
            );
          })}
        </svg>

        <div className="center-flow__hub">
          <BrandWordmark className="center-flow__brand" />
          <span className="center-flow__hub-orbit center-flow__hub-orbit--one" />
          <span className="center-flow__hub-orbit center-flow__hub-orbit--two" />
        </div>

        {positionedModules.map((item) => (
          <div className="center-flow__node-wrap" key={item.label} style={{ "--node-x": `${item.x}%`, "--node-y": `${item.y}%` }}>
            <ModuleCard item={item} onMentalHealthClick={onMentalHealthClick} onResumeClick={onResumeClick} />
          </div>
        ))}
      </div>
    </section>
  );
}
