import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function CreateObject() {
  const [form, setForm] = useState({
    title: '', description: '', keyword: '', language: 'pt-BR',
    version: '', status: '',
    contributeRole: '', contributeEntity: '', contributeDate: '',
    interactivityType: '', learningResourceType: '', intendedEndUserRole: '',
    context: '', typicalAgeRange: '', difficulty: '',
    typicalLearningTime: '', educationalDescription: '', educationalLanguage: 'pt-BR',
    cost: 'no', copyrightAndOtherRestrictions: '',
    rightsDescription: '',
    classificationPurpose: '', classificationDescription: '', classificationKeyword: ''
  });
  
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const [advanced, setAdvanced] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFile(e) {
    setFile(e.target.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.title || !file) {
        setError('Título e arquivo são obrigatórios.');
        return;
    }

    try {
      const data = new FormData();

      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', form.keyword);
      data.append('file', file);

      const lomObj = {
        general: {
          title: form.title,
          description: form.description,
          keyword: form.keyword.split(',').map(k => k.trim()).filter(Boolean),
          language: form.language
        },
        lifecycle: {
          version: form.version,
          status: form.status,
          contribute: [{
            role: form.contributeRole,
            entity: form.contributeEntity,
            date: form.contributeDate
          }]
        },
        technical: {
          format: file.type,
          size: file.size,
          location: file.name
        },
        educational: {
          interactivityType:    form.interactivityType,
          learningResourceType: form.learningResourceType,
          intendedEndUserRole:  form.intendedEndUserRole,
          context:              form.context,
          typicalAgeRange:      form.typicalAgeRange,
          difficulty:           form.difficulty,
          typicalLearningTime:  form.typicalLearningTime,
          description:          form.educationalDescription,
          language:             form.educationalLanguage
        },
        rights: {
          cost:                        form.cost,
          copyrightAndOtherRestrictions:
            form.copyrightAndOtherRestrictions,
          description:                 form.rightsDescription
        },
        classification: {
          purpose:      form.classificationPurpose,
          description:  form.classificationDescription,
          keyword:      form.classificationKeyword.split(',').map(k=>k.trim()).filter(Boolean)
        }
      };
      
      data.append('metadata', JSON.stringify(lomObj));

      const res = await api.post('/objetos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`Objeto criado com ID ${res.data.object.id}`);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Erro ao cadastrar objeto.');
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-8">
      <button onClick={() => setAdvanced(!advanced)}>
        {advanced ? 'Modo Simples' : 'Modo Avançado'}
      </button>
      
      <h2 className="text-2xl font-semibold mb-4">Cadastrar Novo Objeto</h2>
      {error   && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-600 mb-4">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* --- General --- */}
        <div><label>Título *</label>
          <input name="title" value={form.title} onChange={handleChange} required /></div>
        <div><label>Descrição</label>
          <textarea name="description" value={form.description} onChange={handleChange} /></div>
        <div><label>Palavras-chave (vírgula)</label>
          <input name="keyword" value={form.keyword} onChange={handleChange} /></div>
        <div><label>Idioma</label>
          <input name="language" value={form.language} onChange={handleChange} /></div>

        {/* --- Lifecycle --- */}
        <div><label>Versão</label>
          <input name="version" value={form.version} onChange={handleChange} /></div>
        <div><label>Status</label>
          <input name="status" value={form.status} onChange={handleChange} /></div>
        <div><label>Contribuição – Cargo</label>
          <input name="contributeRole" value={form.contributeRole} onChange={handleChange} /></div>
        <div><label>Contribuição – Entidade</label>
          <input name="contributeEntity" value={form.contributeEntity} onChange={handleChange} /></div>
        <div><label>Contribuição – Data</label>
          <input name="contributeDate" type="date" value={form.contributeDate} onChange={handleChange} /></div>

        {/* --- Technical --- */}
        <div><label>Arquivo (pptx/pptm) *</label>
          <input type="file" accept=".pptx,.pptm,.ppt" onChange={handleFile} required /></div>

        {/* --- Educational --- */}
        <div><label>Tipo de Interação</label>
          <input name="interactivityType" value={form.interactivityType} onChange={handleChange} /></div>
        <div><label>Tipo de recurso de aprendizagem</label>
          <input name="learningResourceType" value={form.learningResourceType} onChange={handleChange} /></div>
        <div><label>Papel do usuário</label>
          <input name="intendedEndUserRole" value={form.intendedEndUserRole} onChange={handleChange} /></div>
        <div><label>Contexto</label>
          <input name="context" value={form.context} onChange={handleChange} /></div>
        <div><label>Faixa etária</label>
          <input name="typicalAgeRange" value={form.typicalAgeRange} onChange={handleChange} /></div>
        <div><label>Dificuldade</label>
          <input name="difficulty" value={form.difficulty} onChange={handleChange} /></div>
        <div><label>Tempo médio de aprendizagem</label>
          <input name="typicalLearningTime" value={form.typicalLearningTime} onChange={handleChange} /></div>
        <div><label>Descrição Educacional</label>
          <textarea name="educationalDescription" value={form.educationalDescription} onChange={handleChange} /></div>
        <div><label>Idioma</label>
          <input name="educationalLanguage" value={form.educationalLanguage} onChange={handleChange} /></div>

        {/* --- Rights --- */}
        <div><label>Custo</label>
          <select name="cost" value={form.cost} onChange={handleChange}>
            <option value="no">No</option><option value="yes">Yes</option>
          </select></div>
        <div><label>Direitos autorais/Restrições</label>
          <input name="copyrightAndOtherRestrictions" value={form.copyrightAndOtherRestrictions} onChange={handleChange} /></div>
        <div><label>Descrição de Direitos autorais</label>
          <textarea name="rightsDescription" value={form.rightsDescription} onChange={handleChange} /></div>

        {/* --- Classification --- */}
        <div><label>Propósito</label>
          <input name="classificationPurpose" value={form.classificationPurpose} onChange={handleChange} /></div>
        <div><label>Descrição</label>
          <textarea name="classificationDescription" value={form.classificationDescription} onChange={handleChange} /></div>
        <div><label>Palavras-chave (vírgula)</label>
          <input name="classificationKeyword" value={form.classificationKeyword} onChange={handleChange} /></div>

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">Cadastrar</button>
      </form>
    </div>
  );
}