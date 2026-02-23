import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DeviceRecord } from '../App';

interface ChartProps {
  data: DeviceRecord[];
  accentColor: string;
  theme: 'light' | 'dark';
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const generatePalette = (baseColor: string, count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const alpha = Math.max(0.2, 1 - (i * 0.15));
    return hexToRgba(baseColor, alpha);
  });
};

const getTooltipStyle = (theme: 'light' | 'dark') => ({
  backgroundColor: theme === 'dark' ? '#111' : '#fff',
  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  borderRadius: '8px',
  color: theme === 'dark' ? '#fff' : '#111'
});

const getGridColor = (theme: 'light' | 'dark') => theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
const getAxisColor = (theme: 'light' | 'dark') => theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
const getCursorColor = (theme: 'light' | 'dark') => theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

export const CategoryChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const cat = curr.Category || 'Unknown';
      const displayCat = cat.length > 20 ? cat.substring(0, 20) + '...' : cat;
      acc[displayCat] = (acc[displayCat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const colors = generatePalette(accentColor, chartData.length);

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
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={getTooltipStyle(theme)} itemStyle={{ color: theme === 'dark' ? '#fff' : '#111' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const LicenseChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const code = curr.LicenseNo || 'Unknown';
      acc[code] = (acc[code] || 0) + 1;
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
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} horizontal={false} />
        <XAxis type="number" stroke={getAxisColor(theme)} />
        <YAxis dataKey="name" type="category" stroke={getAxisColor(theme)} width={100} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={getTooltipStyle(theme)} cursor={{ fill: getCursorColor(theme) }} />
        <Bar dataKey="value" fill={accentColor} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ModelChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const model = curr.Model || 'Unknown';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const colors = generatePalette(accentColor, chartData.length);

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
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={getTooltipStyle(theme)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const CustomerChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const customer = curr.CustomerID || 'Unknown';
      acc[customer] = (acc[customer] || 0) + 1;
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
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} vertical={false} />
        <XAxis dataKey="name" stroke={getAxisColor(theme)} />
        <YAxis stroke={getAxisColor(theme)} />
        <Tooltip contentStyle={getTooltipStyle(theme)} cursor={{ fill: getCursorColor(theme) }} />
        <Bar dataKey="value" fill={accentColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const SupplierVolumeChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
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
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} vertical={false} />
        <XAxis dataKey="name" stroke={getAxisColor(theme)} />
        <YAxis stroke={getAxisColor(theme)} />
        <Tooltip contentStyle={getTooltipStyle(theme)} cursor={{ fill: getCursorColor(theme) }} />
        <Bar dataKey="value" fill={hexToRgba(accentColor, 0.8)} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const LotNumberChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
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
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} horizontal={false} />
        <XAxis type="number" stroke={getAxisColor(theme)} />
        <YAxis dataKey="name" type="category" stroke={getAxisColor(theme)} width={80} tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={getTooltipStyle(theme)} cursor={{ fill: getCursorColor(theme) }} />
        <Bar dataKey="value" fill={hexToRgba(accentColor, 0.6)} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const DeviceNameChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      const name = curr.DeviceNAME || 'Unknown';
      const display = name.length > 15 ? name.substring(0, 15) + '...' : name;
      acc[display] = (acc[display] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const colors = generatePalette(accentColor, chartData.length);

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
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={getTooltipStyle(theme)} itemStyle={{ color: theme === 'dark' ? '#fff' : '#111' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const TimelineChart: React.FC<ChartProps> = ({ data, accentColor, theme }) => {
  const chartData = useMemo(() => {
    const counts = data.reduce((acc, curr) => {
      if (!curr.Deliverdate) return acc;
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
        <CartesianGrid strokeDasharray="3 3" stroke={getGridColor(theme)} vertical={false} />
        <XAxis dataKey="date" stroke={getAxisColor(theme)} />
        <YAxis stroke={getAxisColor(theme)} />
        <Tooltip contentStyle={getTooltipStyle(theme)} />
        <Line type="monotone" dataKey="count" stroke={accentColor} strokeWidth={2} dot={{ fill: accentColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
