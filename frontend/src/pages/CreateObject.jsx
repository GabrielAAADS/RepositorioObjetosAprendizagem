import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Accordion from '../components/Accordion';
import TagInput from '../components/TagInputs';
import InfoLabel from '../components/InfoLabel';
import SlidePickerModal from '../components/SlidePickerModal';
import InstallExtensionModal from '../components/InstallExtensionModal';
import css from './CreateObject.module.css';

export default function CreateObject() {
  const minsToISO = (m) => {
    const n = parseInt(m, 10);
    if (!n || n <= 0) return undefined;
    return `PT${n}M`;
  };

  const MIN_THUMB_W = 800;
  const MIN_THUMB_H = 500;
  const MAX_THUMB_MB = 3;

  async function urlToBlob(url) {
    if (url.startsWith('data:')) {
      const [header, b64] = url.split(',');
      const mime = /data:(.*?);base64/.exec(header)?.[1] || 'image/png';
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('Falha ao baixar thumbnail');
    return await res.blob();
  }

  function getImageSizeFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  const MAX_FILE_MB = 100;
  const ALLOWED_EXT = ['.pptx', '.pptm', '.ppt'];
  const LANGS = ['portuguese', 'portuguese', 'english', 'spanish', 'french'];


  const MIME_BY_EXT = {
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    '.ppt': 'application/vnd.ms-powerpoint',
  };

  const ENUMS = {
    lifecycleStatus: ['draft', 'final', 'revised'],
    interactivityType: ['active', 'expositive', 'mixed'],
    learningResourceType: ['game', 'quiz', 'presentation', 'simulation', 'exercise', 'lecture-notes'],
    endUserRole: ['teacher', 'learner'],
    context: ['primary', 'secondary', 'higher-education', 'training'],
    difficulty: ['very easy', 'easy', 'medium', 'difficult', 'very difficult'],
    cost: ['no', 'yes'],
    categories: ['Jogo', 'Apresentação', 'Quiz', 'Simulação', 'Outro'],
    ageRanges: ['5-7', '8-10', '11-14', '15-18', '18+'],
  };

  const LABELS = {
    lifecycleStatus: { draft: 'Rascunho', final: 'Final', revised: 'Revisado' },
    interactivityType: { active: 'Ativa', expositive: 'Expositiva', mixed: 'Mista' },
    learningResourceType: {
      game: 'Jogo', quiz: 'Quiz', presentation: 'Apresentação',
      simulation: 'Simulação', exercise: 'Exercício', 'lecture-notes': 'Notas de aula',
    },
    endUserRole: { teacher: 'Professor(a)', learner: 'Estudante' },
    context: {
      primary: 'Ensino Fundamental', secondary: 'Ensino Médio',
      'higher-education': 'Ensino Superior', training: 'Treinamento',
    },
    difficulty: {
      'very easy': 'Muito fácil', easy: 'Fácil', medium: 'Médio',
      difficult: 'Difícil', 'very difficult': 'Muito difícil',
    },
    cost: { no: 'Gratuito', yes: 'Com custo' },
  };

  const labelOf = (group, value) => LABELS[group]?.[value] ?? String(value);

  const nav = useNavigate();
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Jogo' });
  const advancedRef = useRef(null);

  useEffect(() => {
    if (advanced && advancedRef.current) {
      advancedRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [advanced]);

  const [lom, setLom] = useState({
    general: { keyword: [], language: 'portuguese' },
    lifecycle: { versionNum: 1, status: '', contributeRole: 'author', contributeEntity: 'Equipe ROVA', contributeDate: '' },
    technical: { format: '', size: '', location: '' },
    educational: {
      interactivityType: '',
      learningResourceType: '',
      intendedEndUserRole: '',
      context: '',
      typicalAgeRange: '',
      difficulty: '',
      typicalLearningTimeMins: 15,
      description: '',
      language: 'portuguese',
    },
    rights: { cost: 'no', copyrightAndOtherRestrictions: 'CC-BY-NC', description: '' },
    classification: { purpose: '', description: '', keyword: [] },
  });

  const [previewSlides, setPreviewSlides] = useState([]);
  const [thumbUrl, setThumbUrl] = useState('');
  const [openPicker, setOpenPicker] = useState(false);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');
  const [uploadPct, setUploadPct] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [installPayload, setInstallPayload] = useState(null);
  const [installError, setInstallError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onLom = (section, field) => (e) =>
    setLom((prev) => ({ ...prev, [section]: { ...prev[section], [field]: e.target.value } }));

  const getExt = (name = '') => {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i).toLowerCase() : '';
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreviewSlides([]);
    setThumbUrl('');
    if (!f) return;

    const ext = getExt(f.name);
    const mime = MIME_BY_EXT[ext] || f.type || '';
    setLom((prev) => ({
      ...prev,
      technical: { ...prev.technical, format: mime, size: f.size, location: f.name },
    }));

    try {
      const fd = new FormData();
      fd.append('file', f);
      const { data } = await api.post('/preview/slides', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const slides = data.slides || [];
      setPreviewSlides(slides);
      if (slides.length) setThumbUrl(slides[0]);
    } catch (err) {
      const payload = { filename: f.name, size: f.size, type: f.type };
      setInstallPayload(payload);
      setInstallError(err?.response?.data || err?.message || 'Preview error');
      const dontAsk = localStorage.getItem('rova_dont_ask_preview_ext') === '1';
      if (!dontAsk) setInstallOpen(true);
    }
  };

  const addKeyword = (section) => (tag) =>
    setLom((prev) => ({
      ...prev,
      [section]: { ...prev[section], keyword: [...prev[section].keyword, tag] },
    }));

  const removeKeyword = (section) => (tag) =>
    setLom((prev) => ({
      ...prev,
      [section]: { ...prev[section], keyword: prev[section].keyword.filter((t) => t !== tag) },
    }));

  useEffect(() => {
    const dontAsk = localStorage.getItem('rova_dont_ask_preview_ext') === '1';
    api
      .get('/preview/health')
      .then(({ data }) => {
        if (!data?.available && !dontAsk) {
          setInstallOpen(true);
          setInstallPayload({ reason: 'health-check-failed' });
          setInstallError('LibreOffice não disponível no servidor.');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof lom.general.keyword === 'string') {
      setLom((v) => ({
        ...v,
        general: {
          ...v.general,
          keyword: v.general.keyword
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }));
    }
  }, []);

  function validate() {
    const errs = [];
    if (!form.title.trim()) errs.push('Título é obrigatório.');
    if (!file) errs.push('Arquivo é obrigatório.');
    if (file) {
      const ext = getExt(file.name);
      if (!ALLOWED_EXT.includes(ext))
        errs.push(`Formato inválido. Aceito: ${ALLOWED_EXT.join(', ')}`);
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > MAX_FILE_MB)
        errs.push(`Arquivo muito grande (${sizeMB.toFixed(1)} MB). Máx: ${MAX_FILE_MB} MB.`);
    }
    return errs;
  }

  function buildMetadata() {
    const meta = {
      general: {
        title: form.title,
        description: form.description,
        keyword: lom.general.keyword,
        language: lom.general.language || 'portuguese',
      },
    };

    if (advanced) {
      const sharedDesc = form.description?.trim() || undefined;

      const lifecycle = {
        version: String(lom.lifecycle.versionNum || 1),
        status: lom.lifecycle.status || undefined,
        contribute:
          lom.lifecycle.contributeRole ||
          lom.lifecycle.contributeEntity ||
          lom.lifecycle.contributeDate
            ? [
                {
                  role: lom.lifecycle.contributeRole || undefined,
                  entity: lom.lifecycle.contributeEntity || undefined,
                  date: lom.lifecycle.contributeDate || undefined,
                },
              ]
            : undefined,
      };
      if (lifecycle.version || lifecycle.status || lifecycle.contribute) meta.lifecycle = lifecycle;

      const technical = {
        format: lom.technical.format || undefined,
        size: lom.technical.size || undefined,
        location: lom.technical.location || undefined,
      };
      if (technical.format || technical.size || technical.location) meta.technical = technical;

      const educational = {
        interactivityType: lom.educational.interactivityType || undefined,
        learningResourceType: lom.educational.learningResourceType || undefined,
        intendedEndUserRole: lom.educational.intendedEndUserRole || undefined,
        context: lom.educational.context || undefined,
        typicalAgeRange: lom.educational.typicalAgeRange || undefined,
        difficulty: lom.educational.difficulty || undefined,
        typicalLearningTime: minsToISO(lom.educational.typicalLearningTimeMins) || undefined,
        description: sharedDesc || undefined,
        language: lom.educational.language || undefined,
      };
      if (Object.values(educational).some((v) => v !== undefined))
        meta.educational = educational;

      const rights = {
        cost: lom.rights.cost || undefined,
        copyrightAndOtherRestrictions:
          lom.rights.copyrightAndOtherRestrictions || undefined,
        description: lom.rights.description || undefined,
      };
      if (rights.cost || rights.copyrightAndOtherRestrictions || rights.description)
        meta.rights = rights;

      const classification = {
        purpose: lom.classification.purpose || undefined,
        description: sharedDesc,
        keyword: lom.general.keyword.length ? lom.general.keyword : undefined,
      };
      if (classification.purpose || classification.description || classification.keyword)
        meta.classification = classification;
    }
    return meta;
  }

  async function submit(e) {
    e.preventDefault();
    setErrors([]);
    setNotice('');
    setUploadPct(0);

    const errs = validate();
    if (errs.length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const metadata = buildMetadata();
    const data = new FormData();
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('category', form.category);
    data.append('file', file);

    if (thumbUrl) {
      try {
        const blob = await urlToBlob(thumbUrl);

        const sizeMb = blob.size / 1024 / 1024;
        if (sizeMb > MAX_THUMB_MB) {
          setErrors([
            `Thumbnail muito grande (${sizeMb.toFixed(1)} MB). Máx: ${MAX_THUMB_MB} MB.`,
          ]);
          return;
        }

        const { w, h } = await getImageSizeFromBlob(blob);
        if (w < MIN_THUMB_W || h < MIN_THUMB_H) {
          setErrors([
            `Thumbnail muito pequena (${w}x${h}). Mínimo: ${MIN_THUMB_W}x${MIN_THUMB_H}.`,
          ]);
          return;
        }

        const ext =
          blob.type.includes('png') ? 'png' :
          blob.type.includes('jpeg') ? 'jpg' :
          blob.type.includes('webp') ? 'webp' : 'png';

        data.append('thumb', blob, `thumb-${Date.now()}.${ext}`);
      } catch {
        setErrors(['Não foi possível processar a thumbnail selecionada.']);
        return;
      }
    }

    data.append('metadata', JSON.stringify(metadata));

    try {
      setSubmitting(true);
      const res = await api.post('/objetos', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (!ev.total) return;
          setUploadPct(Math.round((ev.loaded * 100) / ev.total));
        },
      });
      setNotice(`✅ Objeto criado (ID ${res.data.object.id}).`);
      setTimeout(() => nav('/search'), 900);
    } catch (err) {
      setErrors([err.response?.data?.error || 'Erro ao criar objeto.']);
    } finally {
      setSubmitting(false);
    }
  }

  const handleDragEvents = (e, dragging) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  };
  const onDrop = (ev) => {
    handleDragEvents(ev, false);
    const f = ev.dataTransfer?.files?.[0];
    if (f) onFile({ target: { files: [f] } });
  };

  return (
    <div className={css.page}>
      <div className={css.header}>
        <div>
          <h1 className={css.title}>Cadastrar Objeto de Aprendizagem</h1>
          <p className={css.subtitle}>Envie o arquivo, descreva e complete os metadados para o catálogo.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          className={css.ghostBtn}
        >
          {advanced ? 'Modo Simples' : 'Modo Avançado'}
        </button>
      </div>

      {errors.length > 0 && (
        <div className={`${css.banner} ${css.bannerDanger}`} aria-live="assertive">
          <ul>{errors.map((e, i) => (<li key={i}>{e}</li>))}</ul>
        </div>
      )}
      {notice && (
        <div className={`${css.banner} ${css.bannerSuccess}`} aria-live="polite">
          {notice}
        </div>
      )}

      <div className={css.grid}>
        <form onSubmit={submit} className={css.form}>
          <section className={css.section}>
            <h2 className={css.sectionTitle}>Informações Básicas</h2>
            <div className={css.fieldsGrid}>
              <div className={css.fieldFull}>
                <InfoLabel
                  label="Título *"
                  info="Nome principal do objeto. Será usado no catálogo e na busca."
                />
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  className={css.input}
                  placeholder="Ex.: Jogo da Velha 3D — Estratégias Avançadas"
                  required
                />
              </div>

              <div className={css.fieldFull}>
                <InfoLabel
                  label="Descrição"
                  info="Resumo do objeto. Aparecerá na listagem e nos metadados educacionais."
                />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  className={`${css.input} ${css.textarea}`}
                  rows={4}
                  placeholder="Descreva brevemente o objetivo, público-alvo e como utilizar o recurso."
                />
              </div>

              <div className={css.fieldHalf}>
                <label htmlFor="category-select" className={css.label}>Categoria</label>
                <select
                  id="category-select"
                  name="category"
                  value={form.category}
                  onChange={onChange}
                  className={css.select}
                >
                  {ENUMS.categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className={css.section}>
            <h2 className={css.sectionTitle}>Arquivo do Objeto</h2>
            <div
              className={`${css.dropzone} ${isDragging ? css.dragOver : ''}`}
              onDragOver={(e) => handleDragEvents(e, true)}
              onDragEnter={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDrop={onDrop}
            >
              <p>
                Arraste e solte o arquivo aqui ou{' '}
                <label htmlFor="file-upload" className={css.highlight}>clique para selecionar</label>.
              </p>
              <p className={css.muted}>
                Formatos aceitos: {ALLOWED_EXT.join(', ')}. Tamanho máximo: {MAX_FILE_MB}MB.
              </p>
              <input
                id="file-upload"
                type="file"
                accept={ALLOWED_EXT.join(',')}
                onChange={onFile}
                className={css.fileInput}
                required
              />
              {file && (
                <p className={css.fileInfo}>
                  Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
          </section>

          {advanced && (
            <section ref={advancedRef} className={css.section}>
              <h2 className={css.sectionTitle}>Metadados (Avançado)</h2>

              <div className={css.accordionWrapper}>
                <Accordion title="Geral" defaultOpen>
                  <div className={css.fieldsGrid}>
                    <div className={css.fieldHalf}>
                      <TagInput
                        label="Palavras-chave"
                        tags={lom.general.keyword}
                        onAdd={addKeyword('general')}
                        onRemove={removeKeyword('general')}
                      />
                    </div>
                    <div className={css.fieldHalf}>
                      <InfoLabel label="Idioma" info="Código IETF (ex.: portuguese)" />
                      <select
                        value={lom.general.language}
                        onChange={onLom('general', 'language')}
                        className={css.select}
                      >
                        {LANGS.map((l) => (<option key={l} value={l}>{l}</option>))}
                      </select>
                    </div>
                  </div>
                </Accordion>
              </div>

              <div className={css.accordionWrapper}>
                <Accordion title="Ciclo de Vida">
                  <div className={css.fieldsGrid}>
                    <div className={css.fieldThird}>
                      <InfoLabel label="Versão" info="Aumente após mudanças relevantes." />
                      <input
                        type="number"
                        min={1}
                        value={lom.lifecycle.versionNum}
                        onChange={(e) =>
                          setLom((prev) => ({
                            ...prev,
                            lifecycle: {
                              ...prev.lifecycle,
                              versionNum: Math.max(1, parseInt(e.target.value || '1', 10)),
                            },
                          }))
                        }
                        className={css.input}
                      />
                    </div>
                    <div className={css.fieldThird}>
                      <label className={css.label}>Status</label>
                      <select
                        value={lom.lifecycle.status}
                        onChange={onLom('lifecycle', 'status')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.lifecycleStatus.map((o) => (
                          <option key={o} value={o}>{labelOf('lifecycleStatus', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldThird}>
                      <label className={css.label}>Data de contribuição</label>
                      <input
                        type="date"
                        value={lom.lifecycle.contributeDate}
                        onChange={onLom('lifecycle', 'contributeDate')}
                        className={css.input}
                      />
                    </div>
                    <div className={css.fieldHalf}>
                      <InfoLabel label="Cargo do Contribuidor" info="Ex: Autor(a), Revisor(a)..." />
                      <input
                        placeholder="Ex.: Autor(a)"
                        value={lom.lifecycle.contributeRole}
                        onChange={onLom('lifecycle', 'contributeRole')}
                        className={css.input}
                      />
                    </div>
                    <div className={css.fieldHalf}>
                      <InfoLabel label="Entidade Contribuidora" info="Organização ou afiliação." />
                      <input
                        placeholder="Ex.: Equipe ROVA"
                        value={lom.lifecycle.contributeEntity}
                        onChange={onLom('lifecycle', 'contributeEntity')}
                        className={css.input}
                      />
                    </div>
                  </div>
                </Accordion>
              </div>

              <div className={css.accordionWrapper}>
                <Accordion title="Técnico">
                  <div className={css.fieldsGrid}>
                    <div className={css.fieldThird}>
                      <label className={css.label}>Formato (MIME Type)</label>
                      <input
                        value={lom.technical.format}
                        onChange={onLom('technical', 'format')}
                        className={css.input}
                        readOnly
                      />
                    </div>
                    <div className={css.fieldThird}>
                      <label className={css.label}>Tamanho (bytes)</label>
                      <input
                        value={lom.technical.size}
                        onChange={onLom('technical', 'size')}
                        className={css.input}
                        readOnly
                      />
                    </div>
                    <div className={css.fieldThird}>
                      <label className={css.label}>Nome do Arquivo</label>
                      <input
                        value={lom.technical.location}
                        onChange={onLom('technical', 'location')}
                        className={css.input}
                        readOnly
                      />
                    </div>
                  </div>
                </Accordion>
              </div>

              <div className={css.accordionWrapper}>
                <Accordion title="Educacional">
                  <div className={css.fieldsGrid}>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Nível de Interatividade</label>
                      <select
                        value={lom.educational.interactivityType}
                        onChange={onLom('educational', 'interactivityType')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.interactivityType.map((o) => (
                          <option key={o} value={o}>{labelOf('interactivityType', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Tipo de Recurso de Aprendizagem</label>
                      <select
                        value={lom.educational.learningResourceType}
                        onChange={onLom('educational', 'learningResourceType')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.learningResourceType.map((o) => (
                          <option key={o} value={o}>{labelOf('learningResourceType', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Público-Alvo</label>
                      <select
                        value={lom.educational.intendedEndUserRole}
                        onChange={onLom('educational', 'intendedEndUserRole')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.endUserRole.map((o) => (
                          <option key={o} value={o}>{labelOf('endUserRole', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Contexto de Aprendizagem</label>
                      <select
                        value={lom.educational.context}
                        onChange={onLom('educational', 'context')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.context.map((o) => (
                          <option key={o} value={o}>{labelOf('context', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Faixa Etária Típica</label>
                      <select
                        value={lom.educational.typicalAgeRange}
                        onChange={onLom('educational', 'typicalAgeRange')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.ageRanges.map((a) => (<option key={a} value={a}>{a}</option>))}
                      </select>
                    </div>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Nível de Dificuldade</label>
                      <select
                        value={lom.educational.difficulty}
                        onChange={onLom('educational', 'difficulty')}
                        className={css.select}
                      >
                        <option value="">— Selecione —</option>
                        {ENUMS.difficulty.map((o) => (
                          <option key={o} value={o}>{labelOf('difficulty', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldThird}>
                      <InfoLabel label="Tempo de Aprendizagem (min)" info="Tempo médio estimado para concluir a atividade." />
                      <input
                        type="number"
                        min="1"
                        value={lom.educational.typicalLearningTimeMins}
                        onChange={onLom('educational', 'typicalLearningTimeMins')}
                        className={css.input}
                      />
                    </div>
                    <div className={css.fieldFull}>
                      <label className={css.label}>Descrição Educacional</label>
                      <textarea
                        value={lom.educational.description}
                        onChange={onLom('educational', 'description')}
                        className={`${css.input} ${css.textarea}`}
                        rows={3}
                        placeholder="Se necessário, detalhe aqui os aspectos pedagógicos do objeto."
                      />
                    </div>
                    <div className={css.fieldHalf}>
                      <InfoLabel label="Idioma do Conteúdo" info="Idioma principal do material educacional." />
                      <select
                        value={lom.educational.language}
                        onChange={onLom('educational', 'language')}
                        className={css.select}
                      >
                        {LANGS.map((l) => (<option key={l} value={l}>{l}</option>))}
                      </select>
                    </div>
                  </div>
                </Accordion>
              </div>

              <div className={css.accordionWrapper}>
                <Accordion title="Direitos de Uso">
                  <div className={css.fieldsGrid}>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Custo</label>
                      <select
                        value={lom.rights.cost}
                        onChange={onLom('rights', 'cost')}
                        className={css.select}
                      >
                        {ENUMS.cost.map((o) => (
                          <option key={o} value={o}>{labelOf('cost', o)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Copyright e Restrições</label>
                      <input
                        value={lom.rights.copyrightAndOtherRestrictions}
                        onChange={onLom('rights', 'copyrightAndOtherRestrictions')}
                        className={css.input}
                        placeholder="Ex: CC-BY-NC"
                      />
                    </div>
                    <div className={css.fieldFull}>
                      <label className={css.label}>Descrição dos Direitos</label>
                      <textarea
                        value={lom.rights.description}
                        onChange={onLom('rights', 'description')}
                        className={`${css.input} ${css.textarea}`}
                        rows={3}
                        placeholder="Detalhe aqui as condições de uso, se houver."
                      />
                    </div>
                  </div>
                </Accordion>
              </div>

              <div className={css.accordionWrapper}>
                <Accordion title="Classificação">
                  <div className={css.fieldsGrid}>
                    <div className={css.fieldHalf}>
                      <label className={css.label}>Propósito da Classificação</label>
                      <input
                        placeholder="Ex: Disciplina, Competência"
                        value={lom.classification.purpose}
                        onChange={onLom('classification', 'purpose')}
                        className={css.input}
                      />
                    </div>
                  </div>
                </Accordion>
              </div>
            </section>
          )}

          <div className={css.actions}>
            {submitting && (
              <div className={css.progress}>
                <div className={css.progressBar} style={{ width: `${uploadPct}%` }} />
              </div>
            )}
            <button type="submit" disabled={submitting} className={`${css.primaryBtn} ${css.wFull}`}>
              {submitting ? `Enviando... ${uploadPct}%` : 'Salvar e Publicar Objeto'}
            </button>
          </div>
        </form>

        <aside className={css.aside}>
          <section className={css.section}>
            <h2 className={css.sectionTitle}>Thumbnail</h2>
            <p className={css.muted}>Escolha a imagem que melhor representa o objeto. Ela será a capa no catálogo.</p>
            <div className={css.thumbBox}>
              {thumbUrl ? (
                <img src={thumbUrl} alt="Thumbnail do objeto" />
              ) : (
                <span className={css.placeholderText}>Sem preview</span>
              )}
            </div>
            <button
              type="button"
              disabled={!previewSlides.length}
              onClick={() => setOpenPicker(true)}
              className={`${css.ghostBtn} ${css.wFull}`}
            >
              Selecionar Slide como Thumbnail
            </button>
          </section>

          <section className={css.section}>
            <h2 className={css.sectionTitle}>Pré-visualização dos Slides</h2>
            {previewSlides?.length > 0 ? (
              <div className={css.previewGrid}>
                {previewSlides.slice(0, 9).map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setThumbUrl(s)}
                    className={css.previewBtn}
                    title={`Selecionar slide ${i + 1} como thumbnail`}
                  >
                    <img src={s} alt={`Preview do Slide ${i + 1}`} loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              <p className={css.muted}>
                A pré-visualização dos slides aparecerá aqui após o envio de um arquivo compatível.
              </p>
            )}
          </section>
        </aside>
      </div>

      {openPicker && (
        <SlidePickerModal
          slides={previewSlides}
          current={Math.max(0, previewSlides.indexOf(thumbUrl))}
          onSelect={(idx) => {
            setThumbUrl(previewSlides[idx]);
            setOpenPicker(false);
          }}
          onClose={() => setOpenPicker(false)}
        />
      )}

      <InstallExtensionModal
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        payload={installPayload}
        error={installError}
        publicUrl={null}
      />
    </div>
  );
}
