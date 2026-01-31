'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, FileText, DollarSign, MapPin, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const analyzeData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/analisar-pasta');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o Backend. Verifique se o Docker está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = data?.resultados?.filter((item: any) => 
    item.localidade.toLowerCase().includes(filter.toLowerCase()) ||
    item.inscricao.includes(filter)
  ) || [];

  const chartData = data ? [
    { name: 'Crítico', value: data.resultados.filter((i:any) => i.nivel_risco === 'Crítico').length, color: '#ef4444' },
    { name: 'Alto', value: data.resultados.filter((i:any) => i.nivel_risco === 'Alto').length, color: '#f97316' },
    { name: 'Médio', value: data.resultados.filter((i:any) => i.nivel_risco === 'Médio').length, color: '#eab308' },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-slate-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">Pega-Safado Pro</h1>
              <p className="text-slate-400 text-sm">Sistema de Auditoria Fiscal Automatizada</p>
            </div>
          </div>
          <button 
            onClick={analyzeData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processando...' : '🔄 Analisar Pasta /data'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {!data && !loading && (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 mx-auto text-slate-300 mb-4" />
            <h2 className="text-xl font-semibold text-slate-600">Nenhum dado carregado</h2>
            <p className="text-slate-500">Coloque seus arquivos JSON na pasta "data" e clique em analisar.</p>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Arquivos Processados</p>
                <p className="text-2xl font-bold">{data.arquivos_processados.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Total de Suspeitos</p>
                <p className="text-2xl font-bold text-red-600">{data.total_imoveis_suspeitos}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Risco Crítico</p>
                <p className="text-2xl font-bold text-red-700">
                  {data.resultados.filter((i:any) => i.nivel_risco === 'Crítico').length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500 mb-1">Risco Alto</p>
                <p className="text-2xl font-bold text-orange-500">
                  {data.resultados.filter((i:any) => i.nivel_risco === 'Alto').length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1">
                <h3 className="font-semibold mb-4">Distribuição de Risco</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Tabela Acusatória</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar endereço ou inscrição..." 
                      className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Risco</th>
                        <th className="px-4 py-3">Acusação</th>
                        <th className="px-4 py-3">Localidade</th>
                        <th className="px-4 py-3">Inscrição</th>
                        <th className="px-4 py-3 text-right">Valor Calc (m²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredResults.slice(0, 100).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              row.nivel_risco === 'Crítico' ? 'bg-red-100 text-red-700' :
                              row.nivel_risco === 'Alto' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {row.nivel_risco.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 max-w-xs truncate" title={row.motivos}>
                            {row.motivos}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={row.localidade}>
                            <MapPin className="inline w-3 h-3 mr-1" />
                            {row.localidade}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono">{row.inscricao}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">R$ {row.valor_m2_calculado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredResults.length > 100 && (
                    <p className="text-center text-xs text-slate-400 mt-2">Mostrando 100 de {filteredResults.length} resultados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}