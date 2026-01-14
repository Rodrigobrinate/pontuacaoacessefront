'use client';

import { useState, useEffect, use } from 'react';
import { getScoreData, ScoreData } from '@/lib/api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const colors = [
  '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF',
  '#FF9F40', '#C9CBCF', '#7BC225', '#E46651', '#00D8FF'
];

export default function ScorePage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getScoreData(resolvedParams.userId);
        setData(result);
      } catch (error) {
        console.error('Erro ao carregar pontuação:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="text-red-600">Usuário não encontrado</div>
      </div>
    );
  }

  const labels = Object.keys(data.detail);
  const dataPoints = labels.map(key => {
    const item = data.detail[key];
    return item.count * item.points;
  });

  const chartData = {
    labels,
    datasets: [{
      label: 'Pontos',
      data: dataPoints,
      backgroundColor: colors.slice(0, labels.length),
      borderWidth: 0,
      hoverOffset: 10,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: 'Origem da sua Pontuação',
        padding: { bottom: 20 }
      }
    }
  } as const;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-5 font-[Segoe_UI,Tahoma,Geneva,Verdana,sans-serif]">
      <div className="max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-1">
            Olá, {data.user.name}
          </h1>
          <p className="text-gray-600 mt-0">
            Aqui está o resumo da sua produtividade
          </p>

          {/* Total Points Box */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-2xl my-6 shadow-lg shadow-blue-500/30">
            <div className="text-sm uppercase tracking-wider opacity-90">
              Pontuação Total
            </div>
            <div className="text-6xl font-extrabold my-2.5">
              {data.totalScore}
            </div>
            <div>pontos acumulados</div>
          </div>

          {/* Chart */}
          <div className="mt-8 h-72 relative">
            <Doughnut data={chartData} options={chartOptions} />
          </div>

          {/* Footer */}
          <div className="mt-8 text-xs text-gray-400">
            Sistema de Pontuação v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
