import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { Course, Semester } from '../../types';

export const AdminCoursesSemesters: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New course
  const [novoCursoNome, setNovoCursoNome] = useState('');
  const [novoCursoCodigo, setNovoCursoCodigo] = useState('');

  // New semester
  const [novoSemestreNome, setNovoSemestreNome] = useState('');
  const [novoSemestreAno, setNovoSemestreAno] = useState('2026');
  const [novoSemestrePeriodo, setNovoSemestrePeriodo] = useState('1');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cRes, sRes] = await Promise.all([api.getCourses(), api.getSemesters()]);
      if (cRes.success) setCourses(cRes.courses || []);
      if (sRes.success) setSemesters(sRes.semesters || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao carregar dados.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCursoNome || !novoCursoCodigo) return;
    try {
      const res = await api.createCourse({ nome: novoCursoNome, codigo: novoCursoCodigo });
      setFeedback({ type: 'success', message: res.message });
      setNovoCursoNome('');
      setNovoCursoCodigo('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar curso.' });
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoSemestreNome) return;
    try {
      const res = await api.createSemester({
        nome: novoSemestreNome,
        ano: Number(novoSemestreAno),
        periodo: Number(novoSemestrePeriodo)
      });
      setFeedback({ type: 'success', message: res.message });
      setNovoSemestreNome('');
      fetchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cadastrar semestre.' });
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
          Cursos e Semestres
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Gerenciamento da estrutura acadêmica e períodos letivos do IFCE (RF10)
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cursos */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <BookOpen className="w-5 h-5 text-[#168038]" />
            <h2 className="text-lg font-bold text-neutral-900">Cursos de Graduação & Técnicos</h2>
          </div>

          <form onSubmit={handleCreateCourse} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Nome do Curso..."
              value={novoCursoNome}
              onChange={(e) => setNovoCursoNome(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-[#168038]"
              required
            />
            <input
              type="text"
              placeholder="Código (ex: ESW)"
              value={novoCursoCodigo}
              onChange={(e) => setNovoCursoCodigo(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 uppercase outline-none focus:border-[#168038]"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#168038] hover:bg-[#136e30] text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </form>

          <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto pr-1">
            {courses.map((c) => (
              <div key={c.id_curso} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-neutral-900 block">{c.nome}</span>
                  <span className="text-[11px] font-mono text-neutral-400">Código: {c.codigo}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Semestres */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-4">
            <Calendar className="w-5 h-5 text-[#168038]" />
            <h2 className="text-lg font-bold text-neutral-900">Semestres Letivos</h2>
          </div>

          <form onSubmit={handleCreateSemester} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-6">
            <input
              type="text"
              placeholder="Ex: 2026.2"
              value={novoSemestreNome}
              onChange={(e) => setNovoSemestreNome(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-[#168038]"
              required
            />
            <input
              type="number"
              value={novoSemestreAno}
              onChange={(e) => setNovoSemestreAno(e.target.value)}
              className="px-2.5 py-2 rounded-lg border border-neutral-300 text-xs text-neutral-900 outline-none focus:border-[#168038]"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#168038] hover:bg-[#136e30] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </form>

          <div className="divide-y divide-neutral-100 max-h-80 overflow-y-auto pr-1">
            {semesters.map((s) => (
              <div key={s.id_semestre} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-neutral-900 block">{s.nome}</span>
                  <span className="text-[11px] text-neutral-400">Ano {s.ano} · Período {s.periodo}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
