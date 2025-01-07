import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, TabType } from '../types';

interface StatsOverviewProps {
  stats: StatCard[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="border border-gray-200/50">
          <CardHeader className="p-6">
            <CardDescription className="text-sm font-medium text-gray-500">
              {stat.label}
            </CardDescription>
            <div className="flex items-baseline gap-2 mt-1">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {stat.value}
              </CardTitle>
              <span className={`text-sm font-medium ${
                stat.trend === 'up' ? 'text-emerald-600' :
                stat.trend === 'down' ? 'text-rose-600' :
                'text-gray-500'
              }`}>
                {stat.change}
              </span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
