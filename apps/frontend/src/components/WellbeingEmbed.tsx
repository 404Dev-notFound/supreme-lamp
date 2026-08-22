"use client";

import React, { useState } from "react";
import { Heart, Brain, ArrowRight, RefreshCcw } from "lucide-react";

export default function WellbeingEmbed() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    age: 20,
    gender: "Male",
    country: "USA",
    academic_level: "Undergraduate",
    most_used_platform: "Instagram",
    purpose_of_use: "Entertainment",
    avg_daily_usage_hours: 4.0,
    daily_unlocks: 50,
    study_hours: 4.0,
    physical_activity_hours: 1.0,
    sleep_hours_per_night: 7.0,
    stress_level: "Medium",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5002/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to calculate score");
      }
      setResult(data.predicted_mental_health_score);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to calculate score",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-black/40 text-zinc-100 p-6 flex flex-col items-center justify-start rounded-b-xl custom-scrollbar relative">
      <div className="w-full max-w-3xl pb-12">
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/20">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Mental Wellbeing Check
          </h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            Evaluate your daily habits and social media usage to build awareness
            of your digital wellbeing.
          </p>
        </div>

        {!result ? (
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="10"
                    max="100"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors [&>option]:bg-zinc-900"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Most Used Platform
                  </label>
                  <select
                    name="most_used_platform"
                    value={formData.most_used_platform}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors [&>option]:bg-zinc-900"
                  >
                    {[
                      "Facebook",
                      "LinkedIn",
                      "Instagram",
                      "Snapchat",
                      "Twitter",
                      "YouTube",
                      "TikTok",
                      "LINE",
                      "KakaoTalk",
                      "VKontakte",
                      "WhatsApp",
                      "WeChat",
                    ].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Purpose
                  </label>
                  <select
                    name="purpose_of_use"
                    value={formData.purpose_of_use}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors [&>option]:bg-zinc-900"
                  >
                    <option value="Networking">Networking</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="News">News</option>
                  </select>
                </div>
              </div>

              <div className="h-px w-full bg-white/10" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex justify-between">
                    Daily Screen Time{" "}
                    <span className="text-zinc-500">
                      {formData.avg_daily_usage_hours}h
                    </span>
                  </label>
                  <input
                    type="range"
                    name="avg_daily_usage_hours"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.avg_daily_usage_hours}
                    onChange={handleChange}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex justify-between">
                    Phone Unlocks{" "}
                    <span className="text-zinc-500">
                      {formData.daily_unlocks}
                    </span>
                  </label>
                  <input
                    type="range"
                    name="daily_unlocks"
                    min="0"
                    max="200"
                    step="1"
                    value={formData.daily_unlocks}
                    onChange={handleChange}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex justify-between">
                    Sleep Hours{" "}
                    <span className="text-zinc-500">
                      {formData.sleep_hours_per_night}h
                    </span>
                  </label>
                  <input
                    type="range"
                    name="sleep_hours_per_night"
                    min="0"
                    max="24"
                    step="0.5"
                    value={formData.sleep_hours_per_night}
                    onChange={handleChange}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Stress Level
                  </label>
                  <select
                    name="stress_level"
                    value={formData.stress_level}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors [&>option]:bg-zinc-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm mt-4"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Analyze Profile <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 text-center relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-yellow-400 to-rose-400 opacity-50" />

              <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6 rotate-3 shadow-xl">
                <Brain className="w-8 h-8 text-primary" />
              </div>

              <h2 className="text-sm text-zinc-400 mb-1">
                Your Digital Wellbeing Score
              </h2>
              <div className="text-5xl font-bold tracking-tighter mb-6">
                {result}
                <span className="text-xl text-zinc-500 ml-1">/10</span>
              </div>

              <div className="bg-black/20 rounded-xl p-4 text-left mb-6 border border-white/5">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  {result >= 7
                    ? "You're maintaining a healthy balance! Your current digital habits and lifestyle routines are supporting your wellbeing."
                    : result >= 4
                      ? "You have a moderate balance. Consider small adjustments to your screen time and physical activity to improve your digital wellbeing."
                      : "Your score indicates high digital strain. It might be beneficial to review your screen time, prioritize sleep, and incorporate more offline activities."}
                </p>
              </div>

              <button
                onClick={() => setResult(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-medium text-xs"
              >
                <RefreshCcw className="w-3 h-3" /> Retake
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
