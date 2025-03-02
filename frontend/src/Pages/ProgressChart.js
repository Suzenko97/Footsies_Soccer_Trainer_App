import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

function ProgressChart(props) {
  const playerId = props.playerId;
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const db = getFirestore();

  useEffect(function() {
    async function fetchSessions() {
      const querySnapshot = await getDocs(collection(db, 'players', playerId, 'sessions'));
      const sessions = [];
      querySnapshot.forEach(function(doc) {
        sessions.push(doc.data());
      });
      // Sort sessions by date
      sessions.sort(function(a, b) {
        return new Date(a.date) - new Date(b.date);
      });
      const labels = sessions.map(function(session) {
        return session.date;
      });
      const speedData = sessions.map(function(session) {
        return session.metrics.speed;
      });
      setChartData({
        labels: labels,
        datasets: [
          {
            label: 'Speed Over Time',
            data: speedData,
            borderColor: 'rgba(75,192,192,1)',
            fill: false
          }
        ]
      });
    }
    fetchSessions();
  }, [db, playerId]);

  return React.createElement(Line, { data: chartData });
}

export default ProgressChart;
