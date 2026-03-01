import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState } from '@/hooks/useAppState';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function SummaryTab() {
  const { logs, userData } = useAppState();
  const { t } = useTranslation();
  const [selectedMetricName, setSelectedMetricName] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [llmLoading, setLlmLoading] = useState(false);
  const inFlightRef = useRef(false);

  const chartRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const allChartsRef = useRef<HTMLDivElement>(null);

  // derive metrics list directly from log entries (unique names & types)
  const metrics = useMemo(() => {
    const map: Record<string, { type: 'scale' | 'boolean' }> = {};
    logs.forEach(log => {
      log.metrics.forEach(m => {
        if (!map[m.name]) {
          map[m.name] = { type: m.type };
        }
      });
    });
    return Object.entries(map).map(([name, info]) => ({ name, type: info.type }));
  }, [logs]);

  const defaultMetric = metrics[0]?.name || '';
  const activeMetricName = selectedMetricName || defaultMetric;
  const selectedMetricType = metrics.find(m => m.name === activeMetricName)?.type;

  // LLM summary helper
  const fetchSummary = async () => {
    if (!userData) return;
    if (inFlightRef.current) return; // prevent duplicate calls
    inFlightRef.current = true;
    setLlmLoading(true);
    try {
      const prompt = `Summarize this users data to help clinicians. Use clinical terms. Don't use technical terms like "mode". Summarize the symptoms (metrics) data trends as well. Avoid using "*" or "#". Give ready to use content. \n\n${JSON.stringify(userData)}`;
      const resp = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": import.meta.env.VITE_GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: "You are a clinical assistant." }],
      },
    }),
  }
);
      const data = await resp.json();
      console.log('LLM response:', data);
      // openrouter returns choices similar to OpenAI
      setSummary(data.candidates?.[0]?.content?.parts?.[0]?.text || 'No summary generated.');
    } catch (err) {
      console.error(err);
      setSummary('Error generating summary');
    } finally {
      inFlightRef.current = false;
      setLlmLoading(false);
    }
  };

  // trigger fetch when export panel opens
  useEffect(() => {
    if (showExport && !summary && userData) {
      fetchSummary();
    }
  }, [showExport, userData, summary]);

  // PDF generation - captures ALL metric charts
  const generatePdf = async () => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    let yOffset = 20;
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pdfWidth = pdf.internal.pageSize.getWidth() - 40;

    // Capture all charts from the hidden container
    if (allChartsRef.current) {
      const chartContainers = allChartsRef.current.querySelectorAll('[data-chart]');
      for (let i = 0; i < chartContainers.length; i++) {
        const chartEl = chartContainers[i] as HTMLElement;
        const canvas = await html2canvas(chartEl, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Check if we need a new page
        if (yOffset + pdfHeight > pageHeight - 20) {
          pdf.addPage();
          yOffset = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, yOffset, pdfWidth, pdfHeight);
        yOffset += pdfHeight + 15;
      }
    }

    // Add AI summary
    if (summaryRef.current) {
      const canvas2 = await html2canvas(summaryRef.current, { scale: 1, backgroundColor: '#ffffff' });
      const imgData2 = canvas2.toDataURL('image/png');
      const imgProps2 = pdf.getImageProperties(imgData2);
      const pdfHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
      if (yOffset + pdfHeight2 > pageHeight - 20) {
        pdf.addPage();
        yOffset = 20;
      }
      pdf.addImage(imgData2, 'PNG', 20, yOffset, pdfWidth, pdfHeight2);
    }

    pdf.save('summary.pdf');
  };

  // Prefetch summary proactively when userData becomes available (before opening panel)
  useEffect(() => {
    if (!showExport && userData && !summary && !llmLoading) {
      fetchSummary();
    }
    // only re-run when userData or summaryType changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  // ✅ Transform logs safely - for a specific metric
  const getChartDataForMetric = (metricName: string) => {
    if (!metricName || logs.length === 0) return [];

    return logs
      .map(log => {
        const metricValue = log.metrics.find(m => m.name === metricName);
        if (!metricValue) return null;

        const value =
          metricValue.type === 'boolean'
            ? (metricValue.value ? 1 : 0)
            : (metricValue.value as number);

        return {
          date: format(new Date(log.time), 'MMM d HH:mm'),
          timestamp: new Date(log.time).getTime(),
          value,
          type: metricValue.type,
        };
      })
      .filter((d): d is { date: string; timestamp: number; value: number; type: string } => d !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  // Chart data for currently selected metric (for display)
  const chartData = useMemo(() => getChartDataForMetric(activeMetricName), [logs, activeMetricName]);


  // ✅ Chart renderer for any metric
  const renderChartForMetric = (metricName: string, type: 'scale' | 'boolean', data: typeof chartData) => {
    if (!metricName || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">{t('summary.noDataAvailable', { metric: metricName })}</p>
        </div>
      );
    }

    // BOOLEAN CHART
    if (type === 'boolean') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis
              type="number"
              dataKey="value"
              domain={[0, 1]}
              ticks={[0, 1]}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              label={{
                value: 'Yes / No',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              formatter={(value: number) => (value === 1 ? 'Yes' : 'No')}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                fontSize: '12px',
              }}
            />
            <Scatter dataKey="value" fill="hsl(var(--chart-1))" />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    // SCALE CHART
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            domain={[ 'auto', 'auto' ]}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <Tooltip
            formatter={(value: number) => `${value}`}
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.75rem',
              fontSize: '12px',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            name={metricName}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // ✅ Chart renderer for currently selected metric (convenience wrapper)
  const renderChart = () => renderChartForMetric(activeMetricName, selectedMetricType || 'scale', chartData);

  return (
    <div className="animate-slide-up space-y-4 pb-4">
      {/* Metric Selection */}
      {metrics.length > 0 && (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <h3 className="text-sm font-bold mb-3">📊 {t('summary.selectMetric')}</h3>
          <div className="flex flex-wrap gap-2">
            {metrics.map(metric => (
              <button
                key={metric.name}
                onClick={() => setSelectedMetricName(metric.name)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMetricName === metric.name
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-foreground hover:bg-secondary'
                }`}
              >
                {metric.name}
                {metric.type === 'boolean' ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-card rounded-2xl border p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-4">
          📈 {t('summary.trend', { metric: activeMetricName })}
        </h3>
        <div className="h-64" ref={chartRef}>{renderChart()}</div>
      </div>


      {/* Export */}
      <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
        <button
          onClick={() => setShowExport(!showExport)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <span className="text-sm font-bold">
              {t('summary.shareWithCareTeam')}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {showExport ? t('summary.hide') : t('summary.show')}
          </span>
        </button>

        {showExport && (
          <div className="px-4 pb-4 pt-3 space-y-3 border-t">
            <button
              onClick={generatePdf}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              📄 {t('summary.downloadPdf')}
            </button>
            {llmLoading ? (
              <div className="pt-3 flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">{t('summary.generatingSummary')}</p>
              </div>
            ) : (
              <div className="mt-3" ref={summaryRef}>
                <div className="bg-card rounded-xl p-4 shadow-sm max-h-64 overflow-auto">
                  <h4 className="text-sm font-semibold mb-2">{t('summary.clinicianSummary')}</h4>
                  <div className="font-sans text-base leading-7 text-foreground/90 tracking-normal whitespace-pre-wrap">
                    {summary || t('summary.noUserData')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden container for PDF export - renders all metric charts */}
      <div
        ref={allChartsRef}
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '600px', background: '#fff' }}
      >
        {metrics.map(metric => {
          const data = getChartDataForMetric(metric.name);
          return (
            <div key={metric.name} data-chart className="p-4 mb-4 bg-white">
              <h3 className="text-sm font-bold mb-2 text-gray-900">
                📈 {metric.name} Trend
              </h3>
              <div className="h-48">
                {renderChartForMetric(metric.name, metric.type, data)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ✅ small reusable stat component
function Stat({ label, value }: { label: string; value: number }) {

  return (
    <div className="bg-secondary/30 rounded-lg p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}