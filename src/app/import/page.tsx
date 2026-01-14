'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getImportUrl, getImportHistory, revertImport, ImportHistory } from '@/lib/api';

interface LogEntry {
  type: string;
  msg?: string;
  processed?: number;
  success?: number;
  total?: number;
  duplicados?: number;
  dataInvalida?: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countRead, setCountRead] = useState(0);
  const [countSuccess, setCountSuccess] = useState(0);
  const [countDuplicados, setCountDuplicados] = useState(0);
  const [countDataInvalida, setCountDataInvalida] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [statusText, setStatusText] = useState('Processando...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Histórico de importações
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);

  // Carregar histórico ao montar o componente
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const data = await getImportHistory();
      setHistory(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleRevert(importId: string, filename: string) {
    if (!confirm(`Tem certeza que deseja desfazer a importação do arquivo "${filename}"?\n\nTodos os registros dessa importação serão removidos.`)) {
      return;
    }

    try {
      setRevertingId(importId);
      await revertImport(importId);
      await loadHistory();
    } catch (error) {
      alert('Erro ao reverter importação: ' + (error as Error).message);
    } finally {
      setRevertingId(null);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      alert('Selecione um arquivo!');
      return;
    }

    setIsUploading(true);
    setIsDone(false);
    setProgress(0);
    setCountRead(0);
    setCountSuccess(0);
    setCountDuplicados(0);
    setCountDataInvalida(0);
    setLogs([]);
    setStatusText('Processando...');

    const formData = new FormData();
    formData.append('planilha', file);

    try {
      const response = await fetch(getImportUrl(), {
        method: 'POST',
        body: formData,
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Erro ao ler resposta');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data: LogEntry = JSON.parse(line);

            if (data.type === 'progress') {
              setCountRead(data.processed || 0);
              setCountSuccess(data.success || 0);
              setCountDuplicados(data.duplicados || 0);
              setCountDataInvalida(data.dataInvalida || 0);
              const percent = Math.min(((data.processed || 0) / 200) * 100, 95);
              setProgress(percent);
            } else if (data.type === 'log') {
              setLogs(prev => [...prev, `> ${data.msg}`]);
            } else if (data.type === 'done') {
              setStatusText('Importação Finalizada!');
              setCountRead(data.total || 0);
              setCountSuccess(data.success || 0);
              setCountDuplicados(data.duplicados || 0);
              setCountDataInvalida(data.dataInvalida || 0);
              setProgress(100);
              setIsDone(true);
              // Atualiza histórico após importação
              loadHistory();
            } else if (data.type === 'error') {
              alert('Erro: ' + data.msg);
              setIsUploading(false);
            }
          } catch (err) {
            console.error('Erro parse JSON stream', err);
          }
        }
      }
    } catch (error) {
      alert('Erro na conexão: ' + (error as Error).message);
      setIsUploading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'CONCLUIDO':
        return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">✅ Concluído</span>;
      case 'REVERTIDO':
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">↩️ Revertido</span>;
      case 'PROCESSANDO':
        return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">⏳ Processando</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">{status}</span>;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Main Card - Upload */}
        <div className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full text-center border border-white/20 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-2">📁 Importar Planilha</h2>
          <p className="text-gray-400 mb-6">Sistema otimizado para grandes volumes.</p>

          <form onSubmit={handleSubmit}>
            {/* File Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/30 p-8 rounded-xl mb-5 cursor-pointer transition-all hover:border-[#667eea] hover:bg-white/5"
            >
              <p className="text-gray-300">
                Clique para selecionar o arquivo <strong className="text-[#667eea]">.csv</strong> ou <strong className="text-[#667eea]">.xlsx</strong>
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file && (
                <small className="text-[#667eea] mt-2 block font-medium">{file.name}</small>
              )}
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg text-base font-medium hover:translate-y-[-2px] hover:shadow-lg hover:shadow-[#667eea]/40 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none disabled:translate-y-0"
            >
              Iniciar Importação
            </button>
          </form>

          <div className="mt-6 flex gap-4 justify-center">
            <Link href="/admin" className="text-gray-400 hover:text-white no-underline transition-colors">
              ← Voltar ao Admin
            </Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white no-underline transition-colors">
              📊 Dashboard
            </Link>
          </div>
        </div>

        {/* Histórico de Importações */}
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            📂 Histórico de Importações
          </h3>

          {loadingHistory ? (
            <div className="text-gray-400 text-center py-8">Carregando histórico...</div>
          ) : history.length === 0 ? (
            <div className="text-gray-400 text-center py-8">Nenhuma importação encontrada.</div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium truncate max-w-xs">
                        📄 {item.filename}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="text-gray-400 text-sm mt-1 flex flex-wrap gap-4">
                      <span>📅 {formatDate(item.createdAt)}</span>
                      <span>📊 {item.rowCount.toLocaleString('pt-BR')} registros</span>
                    </div>
                  </div>

                  {item.status === 'CONCLUIDO' && (
                    <button
                      onClick={() => handleRevert(item.id, item.filename)}
                      disabled={revertingId === item.id}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {revertingId === item.id ? (
                        <>
                          <span className="animate-spin">⏳</span> Revertendo...
                        </>
                      ) : (
                        <>↩️ Desfazer</>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white">
          <h2 className="text-2xl font-semibold mb-4">{statusText}</h2>
          
          {/* Progress Bar */}
          <div className="w-4/5 max-w-md bg-white/20 rounded-lg p-1.5">
            <div
              className="h-5 rounded-lg transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: isDone ? '#4CAF50' : 'linear-gradient(90deg, #667eea, #764ba2)',
              }}
            />
          </div>

          {/* Stats */}
          <div className="text-sm mt-4 opacity-90 flex flex-wrap justify-center gap-4">
            <span className="bg-white/10 px-3 py-1 rounded-full">📄 Linhas: <strong>{countRead}</strong></span>
            <span className="bg-green-500/20 px-3 py-1 rounded-full text-green-400">✅ Sucesso: <strong>{countSuccess}</strong></span>
            {countDuplicados > 0 && (
              <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-yellow-400">⚠️ Duplicados: <strong>{countDuplicados}</strong></span>
            )}
            {countDataInvalida > 0 && (
              <span className="bg-red-500/20 px-3 py-1 rounded-full text-red-400">❌ Data inválida: <strong>{countDataInvalida}</strong></span>
            )}
          </div>

          {/* Log Area */}
          <div className="mt-5 text-xs text-gray-400 max-h-32 overflow-y-auto w-4/5 text-left bg-black/30 rounded-lg p-3">
            {logs.map((log, i) => (
              <div key={i} className="py-0.5">{log}</div>
            ))}
          </div>

          {/* Close Button */}
          {isDone && (
            <div className="mt-6 flex gap-4">
              <button 
                onClick={() => setIsUploading(false)}
                className="px-8 py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Concluir
              </button>
              <Link href="/dashboard">
                <button className="px-8 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#667eea]/40 transition-all">
                  📊 Ver Dashboard
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
