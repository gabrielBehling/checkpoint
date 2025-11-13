import { useState } from "react";

function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    game: "",
    date: "",
    mode: "",
    ticket: "",
    participationCost: "",
    place: "",
    groupSize: "",
    status: "",
    prize: "",
    language: "",
    platform: "",
    maxParticipants: "",
    isOnline: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSearch = () => {
    console.log("🔍 Pesquisando por:", searchTerm);
    console.log("🎯 Filtros aplicados:", filters);
    // Aqui você pode chamar sua API ou função de busca, ex:
    // api.get('/search', { params: { ...filters, q: searchTerm } })
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Pesquisa de Eventos</h1>

      {/* Campo de busca */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded-l w-1/2 focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 rounded-r hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded shadow">
        <input name="game" type="text" placeholder="Game" value={filters.game} onChange={handleChange} className="border p-2 rounded" />
        <input name="date" type="date" value={filters.date} onChange={handleChange} className="border p-2 rounded" />
        <input name="mode" type="text" placeholder="Mode" value={filters.mode} onChange={handleChange} className="border p-2 rounded" />
        <input name="ticket" type="text" placeholder="Ticket" value={filters.ticket} onChange={handleChange} className="border p-2 rounded" />
        <input name="participationCost" type="number" placeholder="Participation Cost" value={filters.participationCost} onChange={handleChange} className="border p-2 rounded" />
        <input name="place" type="text" placeholder="Place" value={filters.place} onChange={handleChange} className="border p-2 rounded" />
        <input name="groupSize" type="number" placeholder="Group Size" value={filters.groupSize} onChange={handleChange} className="border p-2 rounded" />
        <select name="status" value={filters.status} onChange={handleChange} className="border p-2 rounded">
          <option value="">Status</option>
          <option value="open">Aberto</option>
          <option value="closed">Fechado</option>
          <option value="ongoing">Em andamento</option>
        </select>
        <input name="prize" type="text" placeholder="Prize" value={filters.prize} onChange={handleChange} className="border p-2 rounded" />
        <input name="language" type="text" placeholder="Language" value={filters.language} onChange={handleChange} className="border p-2 rounded" />
        <input name="platform" type="text" placeholder="Platform" value={filters.platform} onChange={handleChange} className="border p-2 rounded" />
        <input name="maxParticipants" type="number" placeholder="Max Participants" value={filters.maxParticipants} onChange={handleChange} className="border p-2 rounded" />

        {/* Checkbox para isOnline */}
        <label className="flex items-center gap-2">
          <input name="isOnline" type="checkbox" checked={filters.isOnline} onChange={handleChange} />
          Evento Online
        </label>
      </div>

      {/* Botão para aplicar */}
      <div className="flex justify-center mt-6">
        <button
          onClick={handleSearch}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}

export default SearchPage;
