import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Accordion from '../components/Accordion';
import TagInput from '../components/TagInputs';
import InfoLabel from '../components/InfoLabel';
import NumberStepper from '../components/NumberStepper';
import SlidePickerModal from '../components/SlidePickerModal';
import InstallExtensionModal from '../components/InstallExtensionModal';

export default function CreateObject() {
  const minsToISO = (m) => {                     
    const n = parseInt(m,10);
    if (!n || n<=0) return undefined;
    return `PT${n}M`;
  };

  const MAX_FILE_MB = 100;
  const ALLOWED_EXT = ['.pptx', '.pptm', '.ppt'];
  const LANGS = ['pt-BR', 'pt-PT', 'en', 'es', 'fr'];
  const MIME_BY_EXT = {
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.pptm': 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    '.ppt' : 'application/vnd.ms-powerpoint',
  };

  const ENUMS = {
    lifecycleStatus: ['draft', 'final', 'revised'],
    interactivityType: ['active', 'expositive', 'mixed'],
    learningResourceType: ['game', 'quiz', 'presentation', 'simulation', 'exercise', 'lecture-notes'],
    endUserRole: ['teacher', 'learner'],
    context: ['primary', 'secondary', 'higher-education', 'training'],
    difficulty: ['very easy', 'easy', 'medium', 'difficult', 'very difficult'],
    cost: ['no', 'yes'],
    categories: ['Game', 'Presentation', 'Quiz', 'Simulation', 'Other'], 
    ageRanges: ['5-7', '8-10', '11-14', '15-18', '18+'],                 
  };

  const nav = useNavigate();

  const [advanced, setAdvanced] = useState(false);

  const [form, setForm] = useState({ title:'', description:'', category:'Jogo' });

  const [lom, setLom] = useState({
    general: { keyword: [], language: 'pt-BR' },
    lifecycle: { versionNum: 1, status: '', contributeRole: 'author', contributeEntity: 'Equipe ROVA', contributeDate: '' },
    technical: { format: '', size: '', location: '' },
    educational: {
      interactivityType: '', learningResourceType: '', intendedEndUserRole: '',
      context: '', typicalAgeRange: '', difficulty: '',
      typicalLearningTimeMins: 15, description:'', language:'pt-BR',
    },
    rights: {  cost:'no', copyrightAndOtherRestrictions:'CC-BY-NC', description: '' },
    classification: { purpose:'', description:'', keyword: [] },
  });

  const [previewSlides, setPreviewSlides] = useState([]); 
  const [previewFolder, setPreviewFolder] = useState('');
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

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onLom = (section, field) => (e) =>
    setLom((prev) => ({ ...prev, [section]: { ...prev[section], [field]: e.target.value } }));

  const getExt = (name='') => {                  
    const i = name.lastIndexOf('.');
    return i>=0 ? name.slice(i).toLowerCase() : '';
  };

 const onFile = async (e) => {         
   const f = e.target.files?.[0];
   setFile(f || null);
   if (!f) return;              
   const ext = getExt(f.name);
   const mime = MIME_BY_EXT[ext] || f.type || '';
   setLom(prev => ({ ...prev, technical: { ...prev.technical, format: mime, size: f.size, location: f.name } }));

try {
    const fd = new FormData();
    fd.append('file', f);
    const { data } = await api.post('/preview/slides', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setPreviewSlides(data.slides || []);
    setPreviewFolder(data.folder || '');
    if ((data.slides || []).length) setThumbUrl(data.slides[0]);
  } catch (err) {
    setPreviewSlides([]);
    setPreviewFolder('');
    setThumbUrl('');
    const payload = { filename: f.name, size: f.size, type: f.type };
    setInstallPayload(payload);
    setInstallError(err?.response?.data || err?.message || 'Preview error');
    const dontAsk = localStorage.getItem('rova_dont_ask_preview_ext') === '1';
    if (!dontAsk) setInstallOpen(true);
  }
 };

 const addKeyword = (section) => (tag) =>
   setLom(prev => ({ ...prev, [section]: { ...prev[section], keyword:[...prev[section].keyword, tag] } }));
 const removeKeyword = (section) => (tag) =>
   setLom(prev => ({ ...prev, [section]: { ...prev[section], keyword: prev[section].keyword.filter(t=>t!==tag) } }));

  useEffect(() => {
    const dontAsk = localStorage.getItem('rova_dont_ask_preview_ext') === '1';
    api.get('/preview/health')
      .then(({ data }) => {
        if (!data?.available && !dontAsk) {
          setInstallOpen(true);
          setInstallPayload({ reason: 'health-check-failed' });
          setInstallError('LibreOffice not available on the server.');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof lom.general.keyword === 'string') {
      setLom(v => ({...v, general:{...v.general, keyword: v.general.keyword.split(',').map(s=>s.trim()).filter(Boolean)}}));
    }
  }, []);



 function validate(){                               
   const errs = [];
   if (!form.title.trim()) errs.push('Título é obrigatório.');
   if (!file) errs.push('Arquivo é obrigatório.');
   if (file) {
     const ext = getExt(file.name);
     if (!ALLOWED_EXT.includes(ext)) errs.push(`Formato inválido. Aceito: ${ALLOWED_EXT.join(', ')}`);
     const sizeMB = file.size/1024/1024;
     if (sizeMB > MAX_FILE_MB) errs.push(`Arquivo muito grande (${sizeMB.toFixed(1)} MB). Máx: ${MAX_FILE_MB} MB.`);
   }
   return errs;
 }

 function buildMetadata(){                         
   const meta = {
     general: {
       title: form.title,
       description: form.description,
       keyword: lom.general.keyword,     
       language: lom.general.language || 'pt-BR',
       thumbnail: thumbUrl || undefined
     }
   };
   if (advanced) {
     const sharedDesc = form.description?.trim() || undefined;

     const lifecycle = {
      version: String(lom.lifecycle.versionNum || 1), 
      status: lom.lifecycle.status || undefined,
      contribute: (lom.lifecycle.contributeRole || lom.lifecycle.contributeEntity || lom.lifecycle.contributeDate)
         ? [{ role: lom.lifecycle.contributeRole || undefined, entity: lom.lifecycle.contributeEntity || undefined, date: lom.lifecycle.contributeDate || undefined }]
         : undefined
     };
     if (lifecycle.version || lifecycle.status || lifecycle.contribute) meta.lifecycle = lifecycle;

     const technical = { format: lom.technical.format || undefined, size: lom.technical.size || undefined, location: lom.technical.location || undefined };
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
       language: lom.educational.language || undefined
     };
     if (Object.values(educational).some(v => v !== undefined)) meta.educational = educational;

     const rights = {
       cost: lom.rights.cost || undefined,
       copyrightAndOtherRestrictions: lom.rights.copyrightAndOtherRestrictions || undefined,
       description: lom.rights.description || undefined
     };
     if (rights.cost || rights.copyrightAndOtherRestrictions || rights.description) meta.rights = rights;

     const classification = {
       purpose: lom.classification.purpose || undefined,
       description: sharedDesc,
       keyword: lom.general.keyword.length ? lom.general.keyword : undefined
     };
     if (classification.purpose || classification.description || classification.keyword) meta.classification = classification;
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
      return;
    }

    const metadata = buildMetadata();
    metadata.general = metadata.general || {};
    if (thumbUrl) metadata.general.thumbnail = thumbUrl;

    const data = new FormData();
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('category', form.category);
    data.append('file', file);
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
      console.error(err);
      setErrors([err.response?.data?.error || 'Erro ao criar objeto.']);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Cadastrar Objeto</h1>
        <button
          type="button"
          onClick={() => setAdvanced((a) => !a)}
          className="text-sm text-blue-600"
        >
          {advanced ? 'Modo Simples' : 'Modo Avançado'}
        </button>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-3 rounded">
          <ul className="list-disc ml-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {notice && (
        <div className="mb-4 border border-green-300 bg-green-50 text-green-700 p-3 rounded">
          {notice}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <InfoLabel label="Título *" info="Nome/título do objeto como será exibido na busca e no catálogo." />
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <InfoLabel label="Descrição" info="Resumo do objeto; usada também em metadados educacionais e de classificação." />
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full border p-2 rounded"
            rows={3}
          />
        </div>
        <div>
          <label className="block font-medium">Categoria</label>
          <select name="category" value={form.category} onChange={onChange} className="w-full border p-2 rounded">
            {ENUMS.categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium">Arquivo (pptx/pptm/ppt) *</label>
          <input
            type="file"
            accept={ALLOWED_EXT.join(',')}
            onChange={onFile}
            className="w-full"
            required
          />
          {file && (
            <p className="text-xs text-gray-500 mt-1">
              Selecionado: <strong>{file.name}</strong> — {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
          )}
        </div>

        <div className="mt-2">
          <label className="block font-medium">Thumbnail</label>
          <div className="flex items-center gap-3">
            <div className="w-40 aspect-video bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              {thumbUrl ? (
                <img src={thumbUrl} alt="thumbnail" className="max-w-full max-h-full" />
              ) : (
                <span className="text-xs text-gray-500 p-2 text-center">No preview available</span>
              )}
            </div>
            <button
              type="button"
              disabled={!previewSlides.length}
              onClick={() => setOpenPicker(true)}
              className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Choose thumbnail…
            </button>
          </div>
        </div>

        {openPicker && (
          <SlidePickerModal
            slides={previewSlides}
            current={Math.max(0, previewSlides.indexOf(thumbUrl))}
            onSelect={(idx) => { setThumbUrl(previewSlides[idx]); setOpenPicker(false); }}
            onClose={() => setOpenPicker(false)}
          />
        )}

        {advanced && (
          <>
            <Accordion title="General" defaultOpen>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block">Palavras-chave (vírgula)</label>
                  <TagInput
                    label="Palavras-chave"
                    tags={lom.general.keyword}
                    onAdd={addKeyword('general')}
                    onRemove={removeKeyword('general')}
                  />
                </div>
                <div>
                  <InfoLabel label="Idioma" info="Idioma principal do objeto (código IETF, ex.: pt-BR)" />
                  <select value={lom.general.language} onChange={onLom('general','language')} className="w-full border p-2 rounded">
                    {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </Accordion>

            <Accordion title="Lifecycle">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <InfoLabel label="Version" info="Object version; increase after relevant changes." />
                  <input type="number" min={1}
                    value={lom.lifecycle.versionNum}
                    onChange={e => setLom(prev => ({ ...prev, lifecycle: { ...prev.lifecycle, versionNum: Math.max(1, parseInt(e.target.value || '1', 10)) } }))}
                    className="border p-2 rounded w-24 text-center"
                  />
                </div>
                <div>
                  <label className="block">Status</label>
                  <select
                    value={lom.lifecycle.status}
                    onChange={onLom('lifecycle', 'status')}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">—</option>
                    {ENUMS.lifecycleStatus.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block">Data de contribuição</label>
                  <input
                    type="date"
                    value={lom.lifecycle.contributeDate}
                    onChange={onLom('lifecycle', 'contributeDate')}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <InfoLabel label="Cargo" info="Papel de quem contribuiu para o objeto (autor, professor, revisor, etc.)." />
                  <input
                    placeholder="Ex.: Autor(a), Professor(a), Revisor(a)"
                    value={lom.lifecycle.contributeRole}
                    onChange={onLom('lifecycle','contributeRole')}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div>
                  <InfoLabel label="Entidade" info="Organização/grupo responsável ou afiliação do(a) contribuidor(a)." />
                  <input
                    placeholder="Ex.: Equipe ROVA, UGCF"
                    value={lom.lifecycle.contributeEntity}
                    onChange={onLom('lifecycle','contributeEntity')}
                    className="w-full border p-2 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">Exemplo: <b>Equipe ROVA</b></p>
                </div>
              </div>
            </Accordion>

            <Accordion title="Technical">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block">Formato</label>
                  <input
                    value={lom.technical.format}
                    onChange={onLom('technical', 'format')}
                    className="w-full border p-2 rounded"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block">Tamanho (bytes)</label>
                  <input
                    value={lom.technical.size}
                    onChange={onLom('technical', 'size')}
                    className="w-full border p-2 rounded"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block">Nome do arquivo</label>
                  <input
                    value={lom.technical.location}
                    onChange={onLom('technical', 'location')}
                    className="w-full border p-2 rounded"
                    readOnly
                  />
                </div>
              </div>
            </Accordion>

            <Accordion title="Educational">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block">Interatividade</label>
                  <select
                    value={lom.educational.interactivityType}
                    onChange={onLom('educational', 'interactivityType')}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">—</option>
                    {ENUMS.interactivityType.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block">Tipo de Recurso</label>
                  <select
                    value={lom.educational.learningResourceType}
                    onChange={onLom('educational', 'learningResourceType')}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">—</option>
                    {ENUMS.learningResourceType.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block">Papel do Usuário</label>
                  <select
                    value={lom.educational.intendedEndUserRole}
                    onChange={onLom('educational', 'intendedEndUserRole')}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">—</option>
                    {ENUMS.endUserRole.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block">Contexto</label>
                  <select
                    value={lom.educational.context}
                    onChange={onLom('educational', 'context')}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">—</option>
                    {ENUMS.context.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block">Faixa Etária</label>
                  <select value={lom.educational.typicalAgeRange} onChange={onLom('educational','typicalAgeRange')} className="w-full border p-2 rounded">
                    <option value="">—</option>
                    {ENUMS.ageRanges.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block">Dificuldade</label>
                  <select
                    value={lom.educational.difficulty}
                    onChange={onLom('educational', 'difficulty')}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">—</option>
                    {ENUMS.difficulty.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <InfoLabel label="Typical Learning Time (min)" info="Average learning time in minutes." />
                  <input type="number" min="1"
                    value={lom.educational.typicalLearningTimeMins}
                    onChange={onLom('educational','typicalLearningTimeMins')}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block">Descrição Educacional</label>
                  <textarea
                    value={lom.educational.description}
                    onChange={onLom('educational', 'description')}
                    className="w-full border p-2 rounded"
                    rows={3}
                  />
                </div>
                <div>
                  <InfoLabel label="Idioma Educacional" info="Idioma do conteúdo educacional" />
                  <select value={lom.educational.language} onChange={onLom('educational','language')} className="w-full border p-2 rounded">
                    {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </Accordion>

            <Accordion title="Rights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block">Custo</label>
                  <select
                    value={lom.rights.cost}
                    onChange={onLom('rights', 'cost')}
                    className="w-full border p-2 rounded"
                  >
                    {ENUMS.cost.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block">Copyright/Restrições</label>
                  <input
                    value={lom.rights.copyrightAndOtherRestrictions}
                    onChange={onLom('rights', 'copyrightAndOtherRestrictions')}
                    className="w-full border p-2 rounded"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block">Descrição de Direitos</label>
                  <textarea
                    value={lom.rights.description}
                    onChange={onLom('rights', 'description')}
                    className="w-full border p-2 rounded"
                    rows={3}
                  />
                </div>
              </div>
            </Accordion>

            <Accordion title="Classification">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block">Propósito</label>
                  <input
                    value={lom.classification.purpose}
                    onChange={onLom('classification', 'purpose')}
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>
            </Accordion>
          </>
        )}

        {submitting && (
          <div className="w-full bg-gray-200 rounded overflow-hidden">
            <div
              className="bg-blue-600 text-white text-xs text-center py-1"
              style={{ width: `${uploadPct}%` }}
            >
              {uploadPct}%
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-60"
        >
          {submitting ? 'Enviando…' : 'Salvar'}
        </button>
      </form>
      
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
