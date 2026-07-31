import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export function TrendGraph({ data }) {
  if (!data || data.length === 0) return <div className="text-gray-400">No data available yet.</div>;
  
  // Format data for Recharts
  const chartData = data.map((d, i) => ({
    name: `Session ${i + 1}`,
    speed: d.typing_speed,
    latency: d.avg_flight_time
  }));

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Speed (CPM)" />
          <Line type="monotone" dataKey="latency" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Latency (ms)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SHAPChart({ data }) {
  if (!data || data.length === 0) return <div className="text-gray-400">SHAP explanation not available.</div>;

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" domain={[-100, 100]} />
          <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={100} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
            formatter={(value) => [`${Math.abs(value).toFixed(1)}%`, 'Impact']}
          />
          <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.impact >= 0 ? '#ef4444' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
