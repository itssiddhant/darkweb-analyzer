import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Map, Circle } from 'lucide-react';

const VisualizationCard = ({ title, data, type, loading, fullWidth }) => {
  if (loading) {
    return (
      <div className={`card ${fullWidth ? 'col-span-full' : ''}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className={`card ${fullWidth ? 'col-span-full' : ''}`}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      </div>
    );
  }
  
  const renderChart = () => {
    if (type === 'bar') {
      // Format data for bar chart
      const chartData = data.labels?.map((label, i) => ({
        name: label,
        value: data.datasets[0].data[i]
      })) || [];
      
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#e5e7eb' }} />
            <YAxis tick={{ fill: '#e5e7eb' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }} 
            />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    if (type === 'pie') {
      // Format data for pie chart
      const chartData = data.labels?.map((label, i) => ({
        name: label,
        value: data.datasets[0].data[i]
      })) || [];
      
      const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
      
      return (
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
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }} 
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    
    if (type === 'map') {
      // For map, you might want to use a map library
      // This is a placeholder that shows we would display map data
      return (
        <div className="h-64 flex flex-col items-center justify-center">
          <Map size={48} className="text-blue-500 mb-2" />
          <p className="text-center">
            {data.points?.length || 0} geolocation points available
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            Interactive map available in full implementation
          </p>
        </div>
      );
    }
    
    return <div>Unsupported chart type</div>;
  };
  
  return (
    <div className={`card ${fullWidth ? 'col-span-full' : ''}`}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {renderChart()}
    </div>
  );
};

export default VisualizationCard;