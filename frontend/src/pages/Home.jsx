import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import CourseCard from "../components/CourseCard";

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const LIMIT = 12;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const qTitle = searchParams.get("q") || undefined;

        const { data } = await api.get("/objetos", {
          params: {
            title: qTitle,
            limit: LIMIT,
            offset: 0,
            // orderBy: "created_at", orderDir: "desc"
          },
        });

        const arr = Array.isArray(data?.objects) ? data.objects : [];
        if (mounted) setLatest(arr.filter(Boolean));
      } catch (e) {
        console.error(e);
        if (mounted) setErr("Erro ao carregar objetos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Objetos mais recentes</h1>
          <p className="text-gray-600">Pré-visualize e clique para ver os detalhes.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/objects/new")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Novo Objeto
          </button>
          <button
            onClick={() => navigate("/search")}
            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded"
          >
            🔍 Buscar / Explorar
          </button>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl overflow-hidden shadow bg-white"
            >
              <div className="aspect-[16/9] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && err && (
        <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded">
          {err}
        </div>
      )}

      {!loading && !err && latest.length === 0 && (
        <p className="text-gray-500">Nenhum objeto encontrado.</p>
      )}

      {!loading && !err && latest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latest.map((o) => (
            <CourseCard key={o.id ?? o._id} object={o} />
          ))}
        </div>
      )}
    </div>
  );
}
