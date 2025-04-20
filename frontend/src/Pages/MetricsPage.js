import React, { useState, useEffect } from 'react';
import { auth } from '../Config/firebase';
import { getTrainingMetrics, getAggregatedMetrics } from '../Services';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faCalendarAlt, faStopwatch, faTachometerAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import SessionForm from './SessionForm';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const MetricsPage = () => {
    const [metricsData, setMetricsData] = useState([]);
    const [aggregatedData, setAggregatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSessionForm, setShowSessionForm] = useState(false);
    const [timeRange, setTimeRange] = useState('30days');
    const [metricView, setMetricView] = useState('performance');

    useEffect(() => {
        fetchMetricsData();
    }, [timeRange]);

    const fetchMetricsData = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                // Get individual session metrics
                const metrics = await getTrainingMetrics(user.uid);
                setMetricsData(metrics);

                // Get aggregated metrics for charts
                const aggregated = await getAggregatedMetrics(user.uid);
                setAggregatedData(aggregated);
            }
        } catch (error) {
            console.error('Error fetching metrics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionSaved = () => {
        setShowSessionForm(false);
        fetchMetricsData();
    };

    // Filter metrics based on selected time range
    const getFilteredData = () => {
        if (!aggregatedData.length) return [];
        
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (timeRange) {
            case '7days':
                cutoffDate.setDate(now.getDate() - 7);
                break;
            case '30days':
                cutoffDate.setDate(now.getDate() - 30);
                break;
            case '90days':
                cutoffDate.setDate(now.getDate() - 90);
                break;
            case 'year':
                cutoffDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                cutoffDate.setDate(now.getDate() - 30);
        }
        
        return aggregatedData.filter(item => new Date(item.date) >= cutoffDate);
    };

    // Format date for display in charts
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Calculate average values for metrics
    const calculateAverages = () => {
        if (!metricsData.length) return { sessionsCount: 0 };
        
        const sum = metricsData.reduce((acc, session) => {
            acc.duration += session.duration || 0;
            acc.dribbling += session.dribbling || 0;
            acc.shooting += session.shooting || 0;
            acc.passing += session.passing || 0;
            acc.stamina += session.stamina || 0;
            acc.intensity += session.intensity || 0;
            return acc;
        }, { duration: 0, dribbling: 0, shooting: 0, passing: 0, stamina: 0, intensity: 0 });
        
        return {
            sessionsCount: metricsData.length,
            avgDuration: Math.round(sum.duration / metricsData.length),
            avgDribbling: (sum.dribbling / metricsData.length).toFixed(1),
            avgShooting: (sum.shooting / metricsData.length).toFixed(1),
            avgPassing: (sum.passing / metricsData.length).toFixed(1),
            avgStamina: (sum.stamina / metricsData.length).toFixed(1),
            avgIntensity: (sum.intensity / metricsData.length).toFixed(1),
        };
    };

    const getMetricChartData = () => {
        const filteredData = getFilteredData();
        
        // Format data for charts based on selected metric view
        if (metricView === 'performance') {
            return filteredData.map(item => ({
                date: formatDate(item.date),
                dribbling: item.dribbling / item.count || 0,
                shooting: item.shooting / item.count || 0,
                passing: item.passing / item.count || 0,
                stamina: item.stamina / item.count || 0
            }));
        } else if (metricView === 'intensity') {
            return filteredData.map(item => ({
                date: formatDate(item.date),
                intensity: item.intensity / item.count || 0,
                duration: item.totalDuration || 0
            }));
        } else {
            return filteredData.map(item => ({
                date: formatDate(item.date),
                count: item.count || 0,
                duration: item.totalDuration || 0
            }));
        }
    };

    const averages = calculateAverages();
    const chartData = getMetricChartData();

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col-md-8">
                    <h2 className="mb-3">
                        <FontAwesomeIcon icon={faChartLine} className="me-2" />
                        Performance Metrics
                    </h2>
                    <p className="text-muted">Track and analyze your training performance over time</p>
                </div>
                <div className="col-md-4 text-end">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowSessionForm(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Record New Session
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <>
                    {showSessionForm ? (
                        <div className="row mb-4">
                            <div className="col-12">
                                <SessionForm
                                    onSessionSaved={handleSessionSaved}
                                    onCancel={() => setShowSessionForm(false)}
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h5 className="card-title mb-0">Training Overview</h5>
                                                    <small className="text-muted">Last {timeRange === '7days' ? '7' : timeRange === '30days' ? '30' : timeRange === '90days' ? '90' : '365'} days</small>
                                                </div>
                                                <div className="btn-group">
                                                    <button 
                                                        className={`btn btn-sm ${timeRange === '7days' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setTimeRange('7days')}
                                                    >
                                                        7 Days
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${timeRange === '30days' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setTimeRange('30days')}
                                                    >
                                                        30 Days
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${timeRange === '90days' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setTimeRange('90days')}
                                                    >
                                                        90 Days
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${timeRange === 'year' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setTimeRange('year')}
                                                    >
                                                        Year
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="row text-center">
                                                <div className="col-md-3 mb-3">
                                                    <div className="p-3 border rounded">
                                                        <div className="text-primary mb-1">
                                                            <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                                                        </div>
                                                        <h4>{averages.sessionsCount}</h4>
                                                        <div className="text-muted small">Total Sessions</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <div className="p-3 border rounded">
                                                        <div className="text-primary mb-1">
                                                            <FontAwesomeIcon icon={faStopwatch} size="lg" />
                                                        </div>
                                                        <h4>{averages.avgDuration}</h4>
                                                        <div className="text-muted small">Avg. Minutes</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <div className="p-3 border rounded">
                                                        <div className="text-primary mb-1">
                                                            <FontAwesomeIcon icon={faTachometerAlt} size="lg" />
                                                        </div>
                                                        <h4>{averages.avgIntensity}</h4>
                                                        <div className="text-muted small">Avg. Intensity</div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3 mb-3">
                                                    <div className="p-3 border rounded">
                                                        <div className="text-primary mb-1">
                                                            <FontAwesomeIcon icon={faChartLine} size="lg" />
                                                        </div>
                                                        <h4>{((averages.avgDribbling * 1 + averages.avgShooting * 1 + averages.avgPassing * 1 + averages.avgStamina * 1) / 4).toFixed(1)}</h4>
                                                        <div className="text-muted small">Avg. Performance</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h5 className="card-title mb-0">Performance Trends</h5>
                                                <div className="btn-group">
                                                    <button 
                                                        className={`btn btn-sm ${metricView === 'performance' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setMetricView('performance')}
                                                    >
                                                        Skills
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${metricView === 'intensity' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setMetricView('intensity')}
                                                    >
                                                        Intensity
                                                    </button>
                                                    <button 
                                                        className={`btn btn-sm ${metricView === 'activity' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                        onClick={() => setMetricView('activity')}
                                                    >
                                                        Activity
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{ height: '350px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    {metricView === 'performance' ? (
                                                        <LineChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" />
                                                            <YAxis domain={[0, 10]} />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line type="monotone" dataKey="dribbling" stroke="#007bff" name="Dribbling" />
                                                            <Line type="monotone" dataKey="shooting" stroke="#dc3545" name="Shooting" />
                                                            <Line type="monotone" dataKey="passing" stroke="#fd7e14" name="Passing" />
                                                            <Line type="monotone" dataKey="stamina" stroke="#28a745" name="Stamina" />
                                                        </LineChart>
                                                    ) : metricView === 'intensity' ? (
                                                        <LineChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" />
                                                            <YAxis yAxisId="left" domain={[0, 10]} />
                                                            <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 10']} />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line yAxisId="left" type="monotone" dataKey="intensity" stroke="#8884d8" name="Intensity (1-10)" />
                                                            <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#82ca9d" name="Duration (min)" />
                                                        </LineChart>
                                                    ) : (
                                                        <AreaChart data={chartData}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Area type="monotone" dataKey="count" stackId="1" stroke="#8884d8" fill="#8884d8" name="Sessions" />
                                                            <Area type="monotone" dataKey="duration" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Total Minutes" />
                                                        </AreaChart>
                                                    )}
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5 className="mb-0">Recent Training Sessions</h5>
                                        </div>
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Title</th>
                                                        <th>Focus</th>
                                                        <th>Duration</th>
                                                        <th>Intensity</th>
                                                        <th>Performance</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {metricsData.slice(0, 5).map((session) => (
                                                        <tr key={session.id}>
                                                            <td>{new Date(session.date).toLocaleDateString()}</td>
                                                            <td>{session.title}</td>
                                                            <td className="text-capitalize">{session.skillsFocus}</td>
                                                            <td>{session.duration} min</td>
                                                            <td>
                                                                <div className="progress" style={{ height: '8px' }}>
                                                                    <div 
                                                                        className="progress-bar" 
                                                                        role="progressbar" 
                                                                        style={{ 
                                                                            width: `${(session.intensity / 10) * 100}%`,
                                                                            backgroundColor: session.intensity > 7 ? '#dc3545' : session.intensity > 4 ? '#ffc107' : '#28a745'
                                                                        }}
                                                                        aria-valuenow={(session.intensity / 10) * 100} 
                                                                        aria-valuemin="0" 
                                                                        aria-valuemax="100"
                                                                    ></div>
                                                                </div>
                                                                <small className="text-muted">{session.intensity}/10</small>
                                                            </td>
                                                            <td>
                                                                <div className="progress" style={{ height: '8px' }}>
                                                                    <div 
                                                                        className="progress-bar bg-info" 
                                                                        role="progressbar" 
                                                                        style={{ 
                                                                            width: `${((session.dribbling + session.shooting + session.passing + session.stamina) / 40) * 100}%`
                                                                        }}
                                                                        aria-valuenow={(session.intensity / 10) * 100} 
                                                                        aria-valuemin="0" 
                                                                        aria-valuemax="100"
                                                                    ></div>
                                                                </div>
                                                                <small className="text-muted">
                                                                    {((session.dribbling + session.shooting + session.passing + session.stamina) / 4).toFixed(1)}/10
                                                                </small>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {metricsData.length === 0 && (
                                                        <tr>
                                                            <td colSpan="6" className="text-center py-4">
                                                                <div className="text-muted">
                                                                    <p>No training sessions recorded yet.</p>
                                                                    <button 
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={() => setShowSessionForm(true)}
                                                                    >
                                                                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                                                                        Record Your First Session
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default MetricsPage; 