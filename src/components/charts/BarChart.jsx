// src/components/charts/IOCsBarChart.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IOCsBarChart = ({ data }) => {
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
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#e5e7eb' }}
            tickLine={{ stroke: '#4b5563' }}
          />
          <YAxis 
            tick={{ fill: '#e5e7eb' }}
            tickLine={{ stroke: '#4b5563' }}
          />
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
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IOCsBarChart;