// src/components/charts/PieChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SentimentPieChart = ({ data }) => {
  // Convert data from API format to Recharts format
  const chartData = [];
  
  if (data && data.data && data.data.datasets && data.data.labels) {
    const { labels, datasets } = data.data;
    
    labels.forEach((label, index) => {
      chartData.push({
        name: label,
        value: datasets[0].data[index] || 0,
        color: datasets[0].backgroundColor[index]
      });
    });
  }

  // Handle empty data
  if (chartData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-medium text-white mb-4">{data.data.title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              color: '#e5e7eb',
              borderRadius: '0.375rem',
              padding: '0.5rem'
            }}
            formatter={(value) => [value, 'Count']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentPieChart;