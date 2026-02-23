import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DeviceRecord } from '../App';

const COLORS = ['#00FF00', '#00cc00', '#009900', '#006600', '#003300', '#33FF33', '#66FF66', '#99FF99'];

interface ChartProps {
  data: DeviceRecord[];
}

export const CategoryChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const cat = curr.Category || 'Unknown';
      // Truncate long categories for display
      const displayCat = cat.length > 20 ? cat.substring(0, 20) + '...' : cat;
      acc[displayCat] = (acc[displayCat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const LicenseChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const code = curr.LicenseNo || 'Unknown';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5); // Top 5
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
        <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={100} tick={{ fontSize: 10 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="value" fill="#00FF00" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ModelChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const model = curr.Model || 'Unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={0}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const CustomerChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const customer = curr.CustomerID || 'Unknown';
      acc[customer] = (acc[customer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5); // Top 5
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
        <YAxis stroke="rgba(255,255,255,0.5)" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="value" fill="#00FF00" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const SupplierVolumeChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const supplier = curr.SupplierID || 'Unknown';
      const num = parseInt(curr.Number) || 1;
      acc[supplier] = (acc[supplier] || 0) + num;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
        <YAxis stroke="rgba(255,255,255,0.5)" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="value" fill="#33FF33" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const LotNumberChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const lot = curr.LotNO || 'Unknown';
      acc[lot] = (acc[lot] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 5);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
        <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" width={80} tick={{ fontSize: 10 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="value" fill="#66FF66" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const DeviceNameChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const name = curr.DeviceNAME || 'Unknown';
      const display = name.length > 15 ? name.substring(0, 15) + '...' : name;
      acc[display] = (acc[display] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TimelineChart: React.FC<ChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      if (!curr.Deliverdate) return acc;
      // Format YYYYMMDD to YYYY-MM-DD
      const dateStr = curr.Deliverdate;
      const date = dateStr.length === 8 ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}` : dateStr;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
        <YAxis stroke="rgba(255,255,255,0.5)" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
        />
        <Line type="monotone" dataKey="count" stroke="#00FF00" strokeWidth={2} dot={{ fill: '#00FF00', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
