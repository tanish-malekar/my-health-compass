import { useState, useMemo } from 'react';
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

export default function SummaryTab() {
  const { logs } = useAppState();
  const [selectedMetricName, setSelectedMetricName] = useState<string>('');
  const [showExport, setShowExport] = useState(false);

  // derive metrics list directly from log entries (unique names & types)
  const metrics = useMemo(() => {
    const map: Record<string, { metricType: 'scale' | 'boolean' }> = {};
    logs.forEach(log => {
      log.metrics.forEach(m => {
        if (!map[m.name]) {
          map[m.name] = { metricType: m.metricType };
        }
      });
    });
    return Object.entries(map).map(([name, info]) => ({ name, metricType: info.metricType }));
  }, [logs]);

  const defaultMetric = metrics[0]?.name || '';
  const activeMetricName = selectedMetricName || defaultMetric;
  const selectedMetricType = metrics.find(m => m.name === activeMetricName)?.metricType;

  // ✅ Transform logs safely
  const chartData = useMemo(() => {
    if (!activeMetricName || logs.length === 0) return [];

    return logs
      .map(log => {
        const metricValue = log.metrics.find(
          m => m.name === activeMetricName
        );
        if (!metricValue) return null;

        const value =
          metricValue.metricType === 'boolean'
            ? (metricValue.value ? 1 : 0)
            : (metricValue.value as number);

        return {
          date: format(new Date(log.time), 'MMM d HH:mm'),
          timestamp: new Date(log.time).getTime(),
          value,
          metricType: metricValue.metricType,
        };
      })
      .filter((d): d is { date: string; timestamp: number; value: number; metricType: string } => d !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, activeMetricName]);

  // ✅ Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const values = chartData.map(d => d.value as number);
    const avg = values.reduce((a, v) => a + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }, [chartData]);

  // ✅ Chart renderer
  const renderChart = () => {
    if (!activeMetricName || chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">No data available for {activeMetricName}</p>
        </div>
      );
    }

    // ✅ BOOLEAN CHART
    if (selectedMetricType === 'boolean') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            data={chartData}
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

    // ✅ SCALE CHART
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            domain={[stats?.min ?? 0, stats?.max ?? 1]}
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
            name={activeMetricName}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="animate-slide-up space-y-4 pb-4">
      {/* Metric Selection */}
      {metrics.length > 0 && (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <h3 className="text-sm font-bold mb-3">📊 Select Metric</h3>
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
                {metric.metricType === 'boolean' ? ' ✓' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-card rounded-2xl border p-4 shadow-sm">
        <h3 className="text-sm font-bold mb-4">
          📈 {activeMetricName} Trend
        </h3>
        <div className="h-64">{renderChart()}</div>
      </div>

      {/* Statistics */}
      {stats && selectedMetricType === 'scale' && (
        <div className="bg-card rounded-2xl border p-4 shadow-sm">
          <h3 className="text-sm font-bold mb-3">📊 Statistics</h3>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Entries" value={stats.count} />
            <Stat label="Avg" value={Math.round(stats.avg * 10) / 10} />
            <Stat label="Min" value={stats.min} />
            <Stat label="Max" value={stats.max} />
          </div>
        </div>
      )}

      {/* Export */}
      <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
        <button
          onClick={() => setShowExport(!showExport)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" />
            <span className="text-sm font-bold">
              Share with Care Team
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {showExport ? 'Hide' : 'Show'}
          </span>
        </button>

        {showExport && (
          <div className="px-4 pb-4 space-y-3 border-t">
            <p className="text-xs text-muted-foreground">
              Data for {activeMetricName} with {chartData.length}{' '}
              entries
              {stats && selectedMetricType === 'scale' && ` (avg: ${Math.round(stats.avg * 10) / 10})`}
            </p>
          </div>
        )}
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