import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Cpu, HardDrive, ShieldCheck } from "lucide-react";

export default function AdminSystemInfo() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/admin/system-info", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) {
            throw new Error("Acesso negado. O modo de depuração (DEBUG_MODE) está desativado em produção.");
          }
          throw new Error("Erro ao carregar informações de depuração.");
        }
        return res.json();
      })
      .then((data) => {
        setInfo(data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Cpu className="h-6 w-6 text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold text-white font-outfit">Informações do Sistema</h1>
              <p className="text-xs text-slate-400">Diagnóstico técnico da hospedagem</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
            Voltar
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            <span className="text-slate-400 text-xs animate-pulse">Carregando diagnóstico...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Modo Debug Inativo</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Diretório de Dados (DATA_DIR)</span>
                <div className="mt-1 font-mono text-xs text-slate-300 break-all">{info.dataDir}</div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Status da Persistência</span>
                <div className="mt-1.5 flex items-center gap-2">
                  {info.isFallback ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                      <span className="text-xs font-semibold text-amber-400">Fallback Local (./data)</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      <span className="text-xs font-semibold text-emerald-400">Armazenamento Persistente Externo</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Diretório de Trabalho (CWD)</span>
                <div className="mt-1 font-mono text-xs text-slate-300 break-all">{info.cwd}</div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Teste de Escrita no Banco</span>
                <div className="mt-1.5 flex items-center gap-2 text-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-slate-300">{info.writePermission}</span>
                </div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Ambiente Node.js (NODE_ENV)</span>
                <div className="mt-1.5 font-mono text-xs text-slate-300 capitalize">{info.nodeEnv}</div>
              </div>

              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/40">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Modo Depuração (DEBUG_MODE)</span>
                <div className="mt-1.5 font-mono text-xs text-slate-300 uppercase">{info.debugMode}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4 text-xs text-slate-400">
              <HardDrive className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                Esta página exibe caminhos absolutos e status de permissões para depuração de rede/disco. Desative a flag `DEBUG_MODE` no painel da Hostinger para desabilitar este acesso em produção.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
