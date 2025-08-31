import api from './api';

export async function fetchCurrent({ objectId }) {
  const { data } = await api.get('/ratings/current', { params: { objectId } });
  return data;
}
export async function upsert({ objectId, stars, comment, version }) {
  const { data } = await api.post('/ratings', { objectId, stars, comment, version });
  return data;
}
export async function history({ objectId }) {
  const { data } = await api.get('/ratings/history', { params: { objectId } });
  return data.list || [];
}

export async function community({ objectId, limit = 20, offset = 0 }) {
  const { data } = await api.get('/ratings/community', {
    params: { objectId, limit, offset },
  });
  return data;
}