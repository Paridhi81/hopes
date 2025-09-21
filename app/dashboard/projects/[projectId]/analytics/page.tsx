'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projects as staticProjects, samples, calculateHMPI, getRiskLevel } from '@/utils/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ArrowLeft, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react';
import { fetchProjects, fetchSamples } from '@/utils/data';

export default function ProjectAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState(null);
  const [projectSamples, setProjectSamples] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const allProjects = await fetchProjects();
        const allSamples = await fetchSamples();

        const selectedProject = allProjects.find(p => p.id === projectId);
        const filteredSamples = allSamples.filter(s => s.projectId === projectId);

        setProject(selectedProject);
        setProjectSamples(filteredSamples);
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">Project Not Found</h1>
        <p className="text-gray-500">The requested project could not be found.</p>
      </div>
    );
  }

  // Calculate data for charts
  const samplesWithHMPI = projectSamples.map(sample => ({
    ...sample,
    hmpi: calculateHMPI(sample),
    riskLevel: getRiskLevel(calculateHMPI(sample))
  }));

  const riskDistribution = samplesWithHMPI.reduce((acc, sample) => {
    const level = sample.riskLevel.level;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskLevels = ['Safe', 'Low Risk', 'Moderate Risk', 'High Risk', 'Very High Risk'];
  const riskChartData = riskLevels.map(level => ({
    name: level,
    value: riskDistribution[level] || 0,
    color: samplesWithHMPI.find(s => s.riskLevel.level === level)?.riskLevel.color || '#666'
  }));

  const metalDistribution = samplesWithHMPI.reduce((acc, sample) => {
    acc[sample.metal] = (acc[sample.metal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const metalChartData = Object.entries(metalDistribution).map(([metal, count]) => ({
    name: metal,
    count,
    avgHMPI: samplesWithHMPI
      .filter(s => s.metal === metal)
      .reduce((sum, s) => sum + s.hmpi, 0) / samplesWithHMPI.filter(s => s.metal === metal).length
  }));

  const timeSeriesData = samplesWithHMPI
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(s => ({
      date: s.date,
      hmpi: s.hmpi
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics for {project.name}</h1>
          <p className="text-gray-600">In-depth data visualizations and insights for this project</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              HMPI Trend Over Time
            </CardTitle>
            <CardDescription>Progression of the Heavy Metal Pollution Index</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hmpi" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Risk Level Distribution
            </CardTitle>
            <CardDescription>Breakdown of samples by pollution risk category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Metal Contamination Levels
          </CardTitle>
          <CardDescription>Average HMPI and sample count per metal type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metalChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="avgHMPI" fill="#8884d8" name="Average HMPI" />
              <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Sample Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}