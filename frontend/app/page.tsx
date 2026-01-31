'use client';

import { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Search, 
  HelpCircle, 
  TrendingDown, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from 'recharts';

type Fraude = {
  id_original: number;
  tipo: string;
  inscricao: string;
  localidade: string;
  metragem: number;
  valor_declarado: number;
  valor_m2_calculado: number;
  referencia_mercado_m2: number;
  nivel_risco: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  motivos: string;
  arquivo_origem: string;
};

type ApiResponse = {
  status?: string;
  mensagem?: string;
  arquivos_processados?: string[];
  total_imoveis_suspeitos?: number;
  resultados?: Fraude[];
};

export default function Dashboard() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [showMethodology, setShowMethodology] = useState(false);

  const analyzeData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/analisar-pasta');
      if (!res.ok) throw new Error("Falha na API");
      const json = await res.json();
      console.log("JSON Recebido:", json); // Debug no console
      setData(json);
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o Backend. Verifique se o container 'backend' está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const safeResultados = useMemo(() => data?.resultados || [], [data]);

  
  const filteredResults = useMemo(() => {
    return safeResultados.filter((item) => 
      (item.localidade || "").toLowerCase().includes(filter.toLowerCase()) ||
      (item.inscricao || "").includes(filter) ||
      (item.motivos || "").toLowerCase().includes(filter.toLowerCase())
    );
  }, [safeResultados, filter]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = { 'Crítico': 0, 'Alto': 0, 'Médio': 0 };
    safeResultados.forEach(r => {
      if (r.nivel_risco && r.nivel_risco in counts) {
        counts[r.nivel_risco]++;
      }
    });
    return [
      { name: 'Crítico', value: counts['Crítico'], color: '#ef4444' },
      { name: 'Alto', value: counts['Alto'], color: '#f97316' },
      { name: 'Médio', value: counts['Médio'], color: '#eab308' },
    ].filter(d => d.value > 0);
  }, [safeResultados]);

  const scatterData = useMemo(() => {
    return safeResultados.map(r => ({
      x: r.metragem || 0,
      y: r.valor_declarado || 0,
      z: r.localidade,
      risk: r.nivel_risco
    })).filter(r => r.x > 0 && r.y > 0);
  }, [safeResultados]);

  const barData = useMemo(() => {
    const reasons: Record<string, number> = {};
    safeResultados.forEach(r => {
      if (r.motivos) {
        const mainReason = r.motivos.split(':')[0].split('(')[0].trim(); 
        reasons[mainReason] = (reasons[mainReason] || 0) + 1;
      }
    });
    return Object.entries(reasons)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [safeResultados]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const isDataEmpty = !data || data.status === 'vazio' || safeResultados.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-10">
      
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Pega-Safado <span className="text-red-600">Pro</span></h1>
              <p className="text-xs text-slate-500">Auditoria Fiscal & Detecção de Fraudes</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowMethodology(!showMethodology)}
              className="text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 px-3 py-2"
            >
              <HelpCircle className="h-4 w-4" /> Metodologia
            </button>
            <button 
              onClick={analyzeData}
              disabled={loading}
              className={`
                px-5 py-2 rounded-lg font-semibold text-white shadow-md transition-all flex items-center gap-2
                ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'}
              `}
            >
              {loading ? 'Processando...' : '🚀 Executar Auditoria'}
            </button>
          </div>
        </div>
      </header>

      {showMethodology && (
        <div className="bg-blue-50 border-b border-blue-100 p-6 animate-in slide-in-from-top-5">
          <div className="max-w-7xl mx-auto">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" /> Regras do Robô:
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-blue-900/80">
              <div><span className="font-bold text-red-600">1. Valor Irrisório:</span> Detecta imóveis declarados por R$ 0,10.</div>
              <div><span className="font-bold text-orange-600">2. Indícios Textuais:</span> Busca "INVASÃO", "POSSE", "IRREGULAR".</div>
              <div><span className="font-bold text-blue-600">3. Anomalia de Mercado:</span> Compara valor do m² com a mediana do tipo.</div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {isDataEmpty && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <FileText className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700">
              {data?.mensagem || "Aguardando Análise"}
            </h2>
            <p className="text-gray-500 mt-2 max-w-md text-center">
              Certifique-se de que o arquivo <code className="bg-gray-100 px-2 py-1 rounded text-sm">bens-imoveis.json</code> está na pasta <code className="bg-gray-100 px-2 py-1 rounded text-sm">data</code>.
            </p>
          </div>
        )}

        {!isDataEmpty && data && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard 
                title="Imóveis Suspeitos" 
                value={data.total_imoveis_suspeitos || 0} 
                icon={<AlertOctagon className="h-5 w-5 text-red-500" />}
                subtext="Total de anomalias"
                alert
              />
              <KpiCard 
                title="Risco Crítico" 
                value={safeResultados.filter(i => i.nivel_risco === 'Crítico').length} 
                icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                subtext="Sonegação (R$ 0,10)"
                critical
              />
              <KpiCard 
                title="Risco Alto" 
                value={safeResultados.filter(i => i.nivel_risco === 'Alto').length} 
                icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                subtext="Invasões / Subfaturamento"
              />
              <KpiCard 
                title="Arquivos Lidos" 
                value={data.arquivos_processados?.length || 0} 
                icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
                subtext="Fonte de dados"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800">Dispersão: Valor vs Metragem</h3>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Escala Logarítmica</span>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="Metragem" unit="m²" scale="log" domain={['auto', 'auto']} allowDataOverflow />
                      <YAxis type="number" dataKey="y" name="Valor" unit="R$" scale="log" domain={['auto', 'auto']} allowDataOverflow />
                      <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                        if (payload && payload.length) {
                          const info = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded text-xs z-50">
                              <p className="font-bold mb-1 text-slate-800">{info.z}</p>
                              <p>Metragem: {info.x.toLocaleString()} m²</p>
                              <p>Valor: {formatCurrency(info.y)}</p>
                              <p className="font-semibold text-red-500 mt-1">Risco: {info.risk}</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend />
                      <Scatter name="Imóveis Suspeitos" data={scatterData} fill="#ef4444" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-6">Severidade das Fraudes</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-4">Top 5 Motivos de Irregularidade</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={280} tick={{fontSize: 12}} />
                    <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="Qtd Imóveis" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="font-bold text-lg text-gray-800">Detalhamento dos Imóveis</h3>
                
                <div className="relative w-full sm:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Buscar endereço, inscrição..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risco</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acusação Principal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localidade / Inscrição</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Metragem</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Decl.</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ref. Mercado (m²)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResults.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${row.nivel_risco === 'Crítico' ? 'bg-red-100 text-red-800' : 
                              row.nivel_risco === 'Alto' ? 'bg-orange-100 text-orange-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {row.nivel_risco}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium max-w-xs truncate" title={row.motivos}>
                            {row.motivos.split(',')[0]}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
                            <div>
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={row.localidade}>{row.localidade}</div>
                              <div className="text-xs text-gray-500 font-mono">{row.inscricao}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {row.metragem.toLocaleString('pt-BR')} m²
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {formatCurrency(row.valor_declarado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 font-mono">
                          R$ {row.referencia_mercado_m2}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-xs text-gray-500">Mostrando os 50 primeiros resultados de {filteredResults.length}</span>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ title, value, icon, subtext, alert = false, critical = false }: any) {
  return (
    <div className={`p-5 rounded-xl shadow-sm border transition-all hover:shadow-md
      ${critical ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${critical ? 'text-red-800' : 'text-gray-500'}`}>{title}</span>
        <div className={`p-2 rounded-lg ${critical ? 'bg-red-200' : 'bg-blue-50'}`}>
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold ${critical ? 'text-red-700' : alert ? 'text-orange-600' : 'text-gray-800'}`}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </div>
      {subtext && <div className={`text-xs mt-1 ${critical ? 'text-red-600' : 'text-gray-400'}`}>{subtext}</div>}
    </div>
  );
}