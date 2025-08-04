import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }

  return (
    <div className="p-8">
      <button
        onClick={() => navigate('/objects/new')}
        className="mb-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
      >
        + Novo Objeto
      </button>
      <button
        onClick={() => navigate('/search')}
        className="mb-4 bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded"
      >
        🔍 Buscar Objetos
      </button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl">Bem-vindo ao Dashboard!</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

