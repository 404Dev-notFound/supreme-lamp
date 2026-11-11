"use client";

import React, { useState, useEffect } from "react";
import { Pin } from "lucide-react";
import { announcementsService } from "@/services/announcements.service";

export default function NoticeBoard() {
  const [boardData, setBoardData] = useState({
    title: "Notice Board",
    totalPages: 3,
    notices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    announcementsService
      .fetchNoticeBoard()
      .then((data) => {
        if (isMounted && data) {
          setBoardData({
            title: data.title || "Notice Board",
            totalPages: Math.max(3, data.totalPages || 3),
            notices: Array.isArray(data.notices) ? data.notices : [],
          });
        }
      })
      .catch((err) => {
        console.warn("NoticeBoard fetch error:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalPages = Math.max(3, boardData.totalPages || 3);
  const pages = Array.from({ length: totalPages }, (_, index) => {
    return boardData.notices[index] || null;
  });

  return (
    <section className="py-14 px-6 border-t border-white/10 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <Pin className="w-4 h-4 text-orange-400 rotate-45" />
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-white">
            {boardData.title || "Notice Board"}
          </h2>
        </div>

        {/* Notice Board Container */}
        <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-5 md:p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
            {pages.map((notice, index) => {
              const isPinnedNotice = Boolean(notice);

              return (
                <div
                  key={notice?.id || `notice-page-${index}`}
                  className={`relative rounded-xl p-4 sm:p-5 flex flex-col min-h-[110px] sm:min-h-[120px] justify-between transition-all ${
                    isPinnedNotice
                      ? "bg-zinc-900/90 border border-white/10 shadow-lg hover:border-white/20"
                      : "bg-zinc-900/30 border border-dashed border-white/10"
                  }`}
                >
                  {/* Pinned pushpin indicator */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full mx-auto -mt-1.5 mb-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.6)] ${
                      isPinnedNotice
                        ? "bg-rose-500 border border-rose-400/80"
                        : "bg-zinc-600 border border-zinc-500/80"
                    }`}
                  />

                  {/* Page Content: Active notice on page 1, completely blank on remaining pages */}
                  {isPinnedNotice ? (
                    <div className="flex-1 flex items-center justify-center text-center px-2">
                      <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug">
                        {notice.title}
                      </h3>
                    </div>
                  ) : loading ? (
                    <div className="flex-1 animate-pulse" />
                  ) : null /* Intentionally blank page per requirement */}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

