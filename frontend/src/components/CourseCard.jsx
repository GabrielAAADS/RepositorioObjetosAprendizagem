import React from "react";
import { useNavigate } from "react-router-dom";

export default function CourseCard({ object, obj }) {
  const navigate = useNavigate();

  const o = object ?? obj ?? null;
  if (!o) return null;

  const id        = o.id ?? o._id ?? "";
  const title     = o.title ?? "Untitled";
  const category  = o.category ?? "—";
  const createdAt = o.created_at ? new Date(o.created_at) : null;

  const meta   = o.metadata ?? {};
  const general = meta.general ?? {};
  const educational = meta.educational ?? {};

  const thumb =
    general.thumbnail ||
    (typeof o.file_path === "string" && o.file_path.startsWith("http")
      ? o.file_path
      : null) ||
    "/placeholder-thumb.svg"; 

  const keywords = Array.isArray(general.keyword) ? general.keyword : [];

  const chips = [
    educational.learningResourceType,
    educational.interactivityType,
    educational.context,
  ].filter(Boolean);

  const handleClick = () => {
    if (id) navigate(`/objects/${id}`);
  };

  return (
    <article
      className="rounded-xl overflow-hidden shadow hover:shadow-lg bg-white cursor-pointer transition"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <div className="aspect-[16/9] bg-gray-100">
        <img
          src={thumb}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-thumb.svg";
          }}
        />
      </div>

      <div className="p-4">
        <div className="text-[11px] uppercase tracking-wide text-rose-700 font-semibold">
          {category}
          {createdAt && (
            <>
              {" "}
              &nbsp;|&nbsp; {createdAt.toLocaleDateString()}
            </>
          )}
        </div>

        <h3 className="text-lg font-semibold mt-1 line-clamp-2">{title}</h3>

        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={`chip-${c}`}
              className="text-xs bg-gray-100 px-2 py-0.5 rounded"
            >
              {c}
            </span>
          ))}
          {chips.length === 0 && (
            <span className="text-xs text-gray-400">Sem tópicos</span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {keywords.slice(0, 3).map((k) => (
            <span
              key={`kw-${k}`}
              className="text-[11px] bg-gray-50 border px-2 py-0.5 rounded"
            >
              {k}
            </span>
          ))}
          {Array.isArray(keywords) && keywords.length === 0 && (
            <span className="text-[11px] text-gray-400">Sem keywords</span>
          )}
        </div>
      </div>
    </article>
  );
}
