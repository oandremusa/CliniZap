import { ArrowRight, CalendarClock } from 'lucide-react';

interface AgendaPlaceholderViewProps {
  onNavigateToPatients: () => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

export function AgendaPlaceholderView({ onNavigateToPatients }: AgendaPlaceholderViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">Agenda</h1>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span>Calendário de consultas</span>
          <span aria-hidden="true">·</span>
          <span className="text-teal-700 font-medium">Fase 2 em breve</span>
        </div>
      </div>

      {/* Single-Elevation Architectural Calendar Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Top Explanatory Banner */}
        <div className="p-6 sm:p-8 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-teal-700 mb-1">Fase 2 em breve</p>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Agenda inteligente e confirmação automática de consultas
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                Na próxima etapa do CliniZap, você poderá visualizar horários disponíveis, agendar
                consultas vinculadas aos seus pacientes cadastrados e automatizar confirmações pelo
                WhatsApp.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToPatients}
            className="min-h-[42px] px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors cursor-pointer self-start md:self-center whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            <span>Gerenciar pacientes</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Clean Non-Interactive Schedule Grid Skeleton Preview */}
        <div aria-hidden="true" className="select-none opacity-65">
          {/* Weekday Header Row */}
          <div className="grid grid-cols-6 border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
            <div className="px-4 py-2.5 border-r border-slate-200/70 font-mono tabular-nums">
              Horário
            </div>
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="px-3 py-2.5 text-center border-r last:border-r-0 border-slate-200/70"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-slate-100">
            {HOURS.map((hour, rowIdx) => (
              <div key={hour} className="grid grid-cols-6 h-11">
                <div className="px-4 flex items-center text-xs font-mono tabular-nums text-slate-400 border-r border-slate-200/70 bg-slate-50/30">
                  {hour}
                </div>
                {WEEKDAYS.map((day, colIdx) => {
                  const hasSampleBlock =
                    (rowIdx === 1 && colIdx === 0) ||
                    (rowIdx === 2 && colIdx === 2) ||
                    (rowIdx === 4 && colIdx === 1) ||
                    (rowIdx === 5 && colIdx === 3);

                  return (
                    <div
                      key={`${hour}-${day}`}
                      className="p-1.5 border-r last:border-r-0 border-slate-100 flex items-center"
                    >
                      {hasSampleBlock && (
                        <div className="w-full h-full rounded bg-slate-100/90" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
