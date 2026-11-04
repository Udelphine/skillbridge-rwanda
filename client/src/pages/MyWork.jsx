import { useEffect, useState } from 'react';
import { api } from '../api';
import ParticipationCard from '../components/ParticipationCard';

function MyWork() {
  const [participations, setParticipations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const joined = await api('/participations/my');
      const work = await api('/submissions/my');
      setParticipations(joined);
      setSubmissions(work);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold mb-4">My Work</h1>

      {error && <p className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</p>}

      {participations.length === 0 && (
        <p className="text-gray-600">You have not joined any challenge yet.</p>
      )}

      {participations.map((item) => (
        <ParticipationCard
          key={item.id + '-' + (submissions.find((s) => s.participation_id === item.id)?.status || 'none')}
          participation={item}
          submission={submissions.find((s) => s.participation_id === item.id)}
          reload={load}
        />
      ))}
    </div>
  );
}

export default MyWork;